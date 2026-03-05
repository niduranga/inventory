<?php

namespace App\Http\Services;

use App\Models\Product;
use App\Models\Location;
use App\Models\Stock;
use App\Models\StockLog;
use App\Repositories\Contracts\StockRepositoryContract;
use App\Repositories\Contracts\StockLogRepositoryContract;
use App\Repositories\Contracts\ProductRepositoryContract;
use App\Repositories\Contracts\LocationRepositoryContract;
use App\Helpers\SkuGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth; // Assuming a User model and Auth facade are available

class StockMovementService
{
    protected StockRepositoryContract $stockRepository;
    protected StockLogRepositoryContract $stockLogRepository;
    protected ProductRepositoryContract $productRepository;
    protected LocationRepositoryContract $locationRepository;

    public function __construct(
        StockRepositoryContract $stockRepository,
        StockLogRepositoryContract $stockLogRepository,
        ProductRepositoryContract $productRepository,
        LocationRepositoryContract $locationRepository
    )
    {
        $this->stockRepository = $stockRepository;
        $this->stockLogRepository = $stockLogRepository;
        $this->productRepository = $productRepository;
        $this->locationRepository = $locationRepository;
    }

    /**
     * Handle stock coming IN to a location.
     */
    public function handleIn(int $productId, int $locationId, int $quantity, ?int $userId = null, ?string $notes = null): StockLog
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive for stock IN.');
        }

        // Use DB Transaction for data integrity
        return DB::transaction(function () use ($productId, $locationId, $quantity, $userId, $notes) {
            $product = $this->productRepository->getById($productId);
            $location = $this->locationRepository->getById($locationId);

            $currentStock = $this->stockRepository->getByProductIdAndLocationId($productId, $locationId);
            $newQuantity = $currentStock ? $currentStock->quantity + $quantity : $quantity;

            $this->stockRepository->updateQuantity($productId, $locationId, $newQuantity);

            $logData = [
                'product_id' => $productId,
                'to_location_id' => $locationId,
                'quantity' => $quantity, // Always positive for IN
                'type' => 'In',
                'notes' => $notes,
                'user_id' => $userId ?? (Auth::check() ? Auth::id() : null),
            ];
            return $this->stockLogRepository->create($logData);
        });
    }

    /**
     * Handle stock going OUT from a location.
     */
    public function handleOut(int $productId, int $locationId, int $quantity, ?int $userId = null, ?string $notes = null): StockLog
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive for stock OUT.');
        }

        // Use DB Transaction for data integrity
        return DB::transaction(function () use ($productId, $locationId, $quantity, $userId, $notes) {
            $product = $this->productRepository->getById($productId);
            $location = $this->locationRepository->getById($locationId);

            $currentStock = $this->stockRepository->getByProductIdAndLocationId($productId, $locationId);

            if (!$currentStock || $currentStock->quantity < $quantity) {
                throw new \RuntimeException('Insufficient stock for product ' . $product->sku . ' at location ' . $location->name);
            }

            $newQuantity = $currentStock->quantity - $quantity;
            $this->stockRepository->updateQuantity($productId, $locationId, $newQuantity);

            $logData = [
                'product_id' => $productId,
                'from_location_id' => $locationId,
                'quantity' => -$quantity, // Always negative for OUT
                'type' => 'Out',
                'notes' => $notes,
                'user_id' => $userId ?? (Auth::check() ? Auth::id() : null),
            ];
            return $this->stockLogRepository->create($logData);
        });
    }

    /**
     * Handle transfer of stock from one location to another.
     */
    public function handleTransfer(int $productId, int $fromLocationId, int $toLocationId, int $quantity, ?int $userId = null, ?string $notes = null): StockLog
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive for stock TRANSFER.');
        }
        if ($fromLocationId === $toLocationId) {
            throw new \InvalidArgumentException('Source and destination locations cannot be the same.');
        }

        // Use DB Transaction for data integrity
        return DB::transaction(function () use ($productId, $fromLocationId, $toLocationId, $quantity, $userId, $notes) {
            $product = $this->productRepository->getById($productId);
            $fromLocation = $this->locationRepository->getById($fromLocationId);
            $toLocation = $this->locationRepository->getById($toLocationId);

            // Handle stock OUT from source location
            $currentStockFrom = $this->stockRepository->getByProductIdAndLocationId($productId, $fromLocationId);
            if (!$currentStockFrom || $currentStockFrom->quantity < $quantity) {
                throw new \RuntimeException('Insufficient stock for product ' . $product->sku . ' at source location ' . $fromLocation->name);
            }
            $newQuantityFrom = $currentStockFrom->quantity - $quantity;
            $this->stockRepository->updateQuantity($productId, $fromLocationId, $newQuantityFrom);

            // Handle stock IN to destination location
            $currentStockTo = $this->stockRepository->getByProductIdAndLocationId($productId, $toLocationId);
            $newQuantityTo = $currentStockTo ? $currentStockTo->quantity + $quantity : $quantity;
            $this->stockRepository->updateQuantity($productId, $toLocationId, $newQuantityTo);

            // Log the transfer
            $logData = [
                'product_id' => $productId,
                'from_location_id' => $fromLocationId,
                'to_location_id' => $toLocationId,
                'quantity' => $quantity, // Positive quantity for log, context is transfer
                'type' => 'Transfer',
                'notes' => $notes,
                'user_id' => $userId ?? (Auth::check() ? Auth::id() : null),
            ];
            return $this->stockLogRepository->create($logData);
        });
    }

    // --- Core Feature Logic: Low Stock Alert System ---
    /**
     * Checks for products that are below their defined low stock threshold.
     * This could be run via a scheduled command.
     * 
     * @return Collection|Product[]
     */
    public function getLowStockAlerts(): Collection
    {
        // Assumes products have a 'low_stock_threshold' attribute in their JSON `attributes` field.
        // This logic would need to be more sophisticated in a real-world scenario (e.g., per-location thresholds).
        
        $lowStockProducts = Product::whereJsonLength('attributes', '>=', 1) // Check if attributes exist
                                   ->whereJsonContains('attributes', ['low_stock_threshold' => null]) // Ensure the key exists
                                   ->get()
                                   ->filter(function ($product) {
                                       $threshold = $product->attributes['low_stock_threshold'] ?? null;
                                       if ($threshold === null || !is_numeric($threshold) || $threshold < 0) {
                                           return false; // Skip if threshold is not set or invalid
                                       }
                                       
                                       $totalStock = $product->stocks->sum('quantity'); // Sum stock across all locations
                                       return $totalStock < $threshold;
                                   });

        return $lowStockProducts;
    }

    /**
     * Triggers alerts for low stock items.
     * In a real system, this would integrate with notification channels (email, Slack, etc.).
     */
    public function triggerLowStockAlerts(): void
    {
        $lowStockItems = $this->getLowStockAlerts();

        if ($lowStockItems->isNotEmpty()) {
            // Here you would implement the notification logic
            // For example: 
            // Notification::route('mail', 'inventory@example.com')
            //     ->notify(new LowStockNotification($lowStockItems));
            
            // For now, we can just log it or echo it for demonstration
            
            // Log::info('Low Stock Alert:', ['items' => $lowStockItems->pluck('sku', 'name')]);
            // echo "Low Stock Alert for: ";
            // foreach($lowStockItems as $item) {
            //     echo "- " . $item->name . " (SKU: " . $item->sku . ")\n";
            // }
        }
    }
}
