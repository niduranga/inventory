<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'location_id',
        'quantity',
    ];

    /**
     * Get the product that owns the stock.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the location where the stock is held.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
