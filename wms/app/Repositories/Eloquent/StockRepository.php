<?php

namespace App\Repositories\Eloquent;

use App\Models\Stock;
use App\Repositories\Contracts\StockRepositoryContract;

class StockRepository implements StockRepositoryContract
{
    public function getByProductIdAndLocationId(int $productId, int $locationId)
    {
        return Stock::where('product_id', $productId)->where('location_id', $locationId)->first();
    }

    public function updateOrCreate(array $attributes, array $values = [])
    {
        return Stock::updateOrCreate($attributes, $values);
    }

    public function updateQuantity(int $productId, int $locationId, int $newQuantity)
    {
        $stock = $this->getByProductIdAndLocationId($productId, $locationId);

        if ($stock) {
            $stock->quantity = $newQuantity;
            $stock->save();
            return $stock;
        } else {
            // If stock doesn't exist, create it if newQuantity is positive
            if ($newQuantity > 0) {
                return Stock::create([
                    'product_id' => $productId,
                    'location_id' => $locationId,
                    'quantity' => $newQuantity,
                ]);
            } 
            // Handle cases where quantity might become zero or negative and stock entry shouldn't be created
            return null; // Or throw an exception/return false
        }
    }

    public function findByProduct(int $productId)
    {
        return Stock::where('product_id', $productId)->get();
    }

    public function findByLocation(int $locationId)
    {
        return Stock::where('location_id', $locationId)->get();
    }
}
