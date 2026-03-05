<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // return Auth::user()->can('update', $this->product);
        return true; // Placeholder: Implement Spatie Permission check here
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('product'); // Assuming route model binding for product id
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:30|unique:products,sku,'. $productId,
            'description' => 'nullable|string',
            'attributes' => 'nullable|json',
            // Example for a specific attribute within JSON:
            // 'attributes.low_stock_threshold' => 'nullable|integer|min:0',
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
