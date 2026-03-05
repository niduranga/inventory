<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryContract;
use Illuminate\Support\Collection;

class ProductRepository implements ProductRepositoryContract
{
    public function getAll()
    {
        return Product::all();
    }

    public function getById($id)
    {
        return Product::findOrFail($id);
    }

    public function create(array $data)
    {
        return Product::create($data);
    }

    public function update($id, array $data)
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product;
    }

    public function delete($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
    }

    public function findBySku(string $sku)
    {
        return Product::where('sku', $sku)->first();
    }
}
