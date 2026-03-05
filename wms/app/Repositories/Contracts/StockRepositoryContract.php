<?php

namespace App\Repositories\Contracts;

interface StockRepositoryContract
{
    public function getByProductIdAndLocationId(int $productId, int $locationId);
    public function updateOrCreate(array $attributes, array $values = []);
    public function updateQuantity(int $productId, int $locationId, int $newQuantity);
    public function findByProduct(int $productId);
    public function findByLocation(int $locationId);
}
