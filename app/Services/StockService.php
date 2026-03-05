<?php

namespace App\Services;

use App\Models\Location;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockLog;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Exception;

class StockService
{
    /**
     * Add stock to a specific location.
     *
     * @param array $data
     * @return Stock
     * @throws ModelNotFoundException
     * @throws Exception
     */
    public function stockIn(array $data): Stock
    {
        return DB::transaction(function () use ($data) {
            $productId = $data['product_id'];
            $locationId = $data['location_id'];
            $quantity = $data['quantity'];
            $referenceId = $data['reference_id'] ?? null;
            $referenceType = $data['reference_type'] ?? null;

            // Validate existence of Product and Location
            $product = Product::findOrFail($productId);
            $location = Location::findOrFail($locationId);

            // Find or create stock entry for the product in the specified location
            $stock = Stock::firstOrCreate([
                'product_id' => $productId,
                'location_id' => $locationId,
            ]);

            // Update quantity
            $stock->quantity += $quantity;
            $stock->save();

            // Log the stock movement
            StockLog::create([
                'product_id' => $productId,
                'to_location_id' => $locationId,
                'quantity' => $quantity,
                'type' => 'in',
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
            ]);

            return $stock;
        });
    }

    /**
     * Deduct stock from a specific location.
     *
     * @param array $data
     * @return Stock
     * @throws ModelNotFoundException
     * @throws Exception
     */
    public function stockOut(array $data): Stock
    {
        return DB::transaction(function () use ($data) {
            $productId = $data['product_id'];
            $locationId = $data['location_id'];
            $quantity = $data['quantity'];
            $referenceId = $data['reference_id'] ?? null;
            $referenceType = $data['reference_type'] ?? null;

            // Validate existence of Product and Location
            $product = Product::findOrFail($productId);
            $location = Location::findOrFail($locationId);

            // Find the stock entry
            $stock = Stock::where([
                'product_id' => $productId,
                'location_id' => $locationId,
            ])->first();

            if (!$stock) {
                throw new Exception('Stock not found for this product in the specified location.');
            }

            // Check for sufficient stock
            if ($stock->quantity < $quantity) {
                throw new Exception('Insufficient stock available.');
            }

            // Update quantity
            $stock->quantity -= $quantity;
            $stock->save();

            // Log the stock movement
            StockLog::create([
                'product_id' => $productId,
                'from_location_id' => $locationId,
                'quantity' => -$quantity, // Store as negative for outbound
                'type' => 'out',
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
            ]);

            return $stock;
        });
    }

    /**
     * Transfer stock from one location to another.
     *
     * @param array $data
     * @return array [$fromStock, $toStock]
     * @throws ModelNotFoundException
     * @throws Exception
     */
    public function transferStock(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $productId = $data['product_id'];
            $fromLocationId = $data['from_location_id'];
            $toLocationId = $data['to_location_id'];
            $quantity = $data['quantity'];
            $referenceId = $data['reference_id'] ?? null;
            $referenceType = $data['reference_type'] ?? null;

            // Validate existence of Product and Locations
            $product = Product::findOrFail($productId);
            $fromLocation = Location::findOrFail($fromLocationId);
            $toLocation = Location::findOrFail($toLocationId);

            if ($fromLocationId === $toLocationId) {
                throw new Exception('Cannot transfer stock to the same location.');
            }

            // Deduct stock from the source location
            $fromStock = Stock::where([
                'product_id' => $productId,
                'location_id' => $fromLocationId,
            ])->first();

            if (!$fromStock) {
                throw new Exception('Source stock not found for this product in the specified location.');
            }

            if ($fromStock->quantity < $quantity) {
                throw new Exception('Insufficient stock in the source location for transfer.');
            }

            $fromStock->quantity -= $quantity;
            $fromStock->save();

            // Add stock to the destination location
            $toStock = Stock::firstOrCreate([
                'product_id' => $productId,
                'location_id' => $toLocationId,
            ]);
            $toStock->quantity += $quantity;
            $toStock->save();

            // Log the stock movement (out from source)
            StockLog::create([
                'product_id' => $productId,
                'from_location_id' => $fromLocationId,
                'quantity' => -$quantity, // Negative for outbound
                'type' => 'transfer',
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
            ]);

            // Log the stock movement (in to destination)
            StockLog::create([
                'product_id' => $productId,
                'to_location_id' => $toLocationId,
                'quantity' => $quantity, // Positive for inbound
                'type' => 'transfer',
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
            ]);

            return [$fromStock, $toStock];
        });
    }
}
