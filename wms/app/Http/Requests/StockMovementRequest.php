<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockMovementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Implement authorization logic based on user roles and actions
        // e.g., return Auth::user()->can('manage stock');
        return true; // Placeholder
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'user_id' => 'nullable|exists:users,id', // Allow specifying user, useful for backend operations
        ];

        $movementType = $this->input('type');

        switch ($movementType) {
            case 'In':
                $rules['location_id'] = 'required|exists:locations,id';
                break;
            case 'Out':
                $rules['location_id'] = 'required|exists:locations,id';
                break;
            case 'Transfer':
                $rules['from_location_id'] = 'required|exists:locations,id';
                $rules['to_location_id'] = 'required|exists:locations,id';
                // Additional validation for transfer: from and to locations must be different
                $rules['to_location_id'] = Rule::notIn([$this->input('from_location_id')]);
                break;
            default:
                // If type is not provided or invalid, we might want to add a general rule or handle it differently
                // For now, assuming type will be provided and valid based on controller logic
                break;
        }

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'product_id' => __('Product'),
            'location_id' => __('Location'),
            'from_location_id' => __('From Location'),
            'to_location_id' => __('To Location'),
            'quantity' => __('Quantity'),
            'notes' => __('Notes'),
            'user_id' => __('User'),
            'type' => __('Movement Type'),
        ];
    }
}
