<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'from_location_id',
        'to_location_id',
        'quantity',
        'type',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer', // Ensure quantity is always an integer
    ];

    /**
     * Get the product associated with the stock log.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the location from which the stock was moved.
     */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    /**
     * Get the location to which the stock was moved.
     */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    /**
     * Get the user who performed the stock operation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // Assuming a User model exists
    }
}
