<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Repositories\Contracts\ProductRepositoryContract;
use App\Helpers\SkuGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    protected ProductRepositoryContract $productRepository;

    public function __construct(ProductRepositoryContract $productRepository)
    {
        $this->productRepository = $productRepository;
        // Add middleware for authorization, e.g., using Spatie Permissions
        // $this->middleware('permission:view products')->only('index', 'show');
        // $this->middleware('permission:create products')->only('store');
        // $this->middleware('permission:update products')->only('update');
        // $this->middleware('permission:delete products')->only('destroy');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = $this->productRepository->getAll();
        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request)
    {
        // Generate SKU if not provided or if logic requires it
        if (empty($request->input('sku'))) {
            $request->merge([
                'sku' => SkuGenerator::generateSku($request->input('name'))
            ]);
        }

        // Handle attributes - ensure it's valid JSON
        $attributes = $request->has('attributes') ? json_decode($request->input('attributes'), true) : null;
        $request->merge(['attributes' => $attributes]);

        $product = $this->productRepository->create($request->validated());
        return response()->json($product, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $product = $this->productRepository->getById($id);
        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, $id)
    {
        // Handle attributes - ensure it's valid JSON
        if ($request->has('attributes')) {
            $attributes = json_decode($request->input('attributes'), true);
            $request->merge(['attributes' => $attributes]);
        }

        $product = $this->productRepository->update($id, $request->validated());
        return response()->json($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $this->productRepository->delete($id);
        return response()->json(null, 204);
    }
}
