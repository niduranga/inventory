<?php

namespace App\Repositories\Contracts;

interface StockLogRepositoryContract
{
    public function create(array $data);
    public function getByProduct(int $productId, int $limit = 10);
    public function getByLocation(int $locationId, int $limit = 10);
}
