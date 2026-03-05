<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // return Auth::user()->can('create', Product::class);
        return true; // Placeholder: Implement Spatie Permission check here
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products|max:30',
            'description' => 'nullable|string',
            'attributes' => 'nullable|json',
            // Example for a specific attribute within JSON: 'attributes.low_stock_threshold' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => __('Product Name'),
            'sku' => __('SKU'),
            'description' => __('Description'),
            'attributes' => __('Attributes'),
        ];
    }
}
