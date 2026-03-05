<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockMovementRequest;
use App\Http\Services\StockMovementService;
use App\Models\Product;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockController extends Controller
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
        // Add middleware for authorization, e.g., using Spatie Permissions
        // $this->middleware('permission:manage stock');
    }

    /**
     * Perform a stock IN operation.
     */
    public function handleIn(StockMovementRequest $request)
    {
        try {
            $log = $this->stockMovementService->handleIn(
                $request->input('product_id'),
                $request->input('location_id'),
                $request->input('quantity'),
                $request->input('user_id'),
                $request->input('notes')
            );
            return response()->json(['message' => 'Stock IN successful', 'log_id' => $log->id], 200);
        } catch (\Exception $e) {
            // Log the error and return an appropriate response
            // Log::error('Stock IN failed: ' . $e->getMessage());
            return response()->json(['message' => 'Stock IN failed: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Perform a stock OUT operation.
     */
    public function handleOut(StockMovementRequest $request)
    {
        try {
            $log = $this->stockMovementService->handleOut(
                $request->input('product_id'),
                $request->input('location_id'),
                $request->input('quantity'),
                $request->input('user_id'),
                $request->input('notes')
            );
            return response()->json(['message' => 'Stock OUT successful', 'log_id' => $log->id], 200);
        } catch (\Exception $e) {
            // Log the error and return an appropriate response
            // Log::error('Stock OUT failed: ' . $e->getMessage());
            return response()->json(['message' => 'Stock OUT failed: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Perform a stock TRANSFER operation.
     */
    public function handleTransfer(StockMovementRequest $request)
    {
        try {
            $log = $this->stockMovementService->handleTransfer(
                $request->input('product_id'),
                $request->input('from_location_id'),
                $request->input('to_location_id'),
                $request->input('quantity'),
                $request->input('user_id'),
                $request->input('notes')
            );
            return response()->json(['message' => 'Stock TRANSFER successful', 'log_id' => $log->id], 200);
        } catch (\Exception $e) {
            // Log the error and return an appropriate response
            // Log::error('Stock TRANSFER failed: ' . $e->getMessage());
            return response()->json(['message' => 'Stock TRANSFER failed: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Get stock levels for a specific product across all locations.
     */
    public function getProductStock(int $productId, Request $request)
    {
        try {
            $product = Product::findOrFail($productId);
            $stockLevels = $product->stocks()->with('location')->get(); // Eager load location
            return response()->json($stockLevels);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve stock levels: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get stock logs for a specific product.
     */
    public function getProductStockLogs(int $productId, Request $request)
    {
        try {
            $logs = $this->stockMovementService->stockLogRepository->getByProduct($productId, $request->query('limit', 10));
            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve stock logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get stock logs for a specific location.
     */
    public function getLocationStockLogs(int $locationId, Request $request)
    {
        try {
            $logs = $this->stockMovementService->stockLogRepository->getByLocation($locationId, $request->query('limit', 10));
            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve stock logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Trigger low stock alerts manually (or could be a scheduled command).
     */
    public function triggerLowStockAlerts(Request $request)
    {
        // Ensure only authorized users can trigger this, e.g., an admin
        // if (!Auth::user()->hasRole('admin')) {
        //     abort(403, 'Unauthorized action.');
        // }
        
        $this->stockMovementService->triggerLowStockAlerts();
        return response()->json(['message' => 'Low stock alert check initiated.']);
    }
}
