<?php

namespace App\Repositories\Eloquent;

use App\Models\StockLog;
use App\Repositories\Contracts\StockLogRepositoryContract;

class StockLogRepository implements StockLogRepositoryContract
{
    public function create(array $data)
    {
        return StockLog::create($data);
    }

    public function getByProduct(int $productId, int $limit = 10)
    {
        return StockLog::where('product_id', $productId)
                       ->with('fromLocation', 'toLocation', 'user')
                       ->orderBy('created_at', 'desc')
                       ->limit($limit)
                       ->get();
    }

    public function getByLocation(int $locationId, int $limit = 10)
    {
        return StockLog::where('to_location_id', $locationId)
                       ->orWhere('from_location_id', $locationId)
                       ->with('product', 'fromLocation', 'toLocation', 'user')
                       ->orderBy('created_at', 'desc')
                       ->limit($limit)
                       ->get();
    }
}
