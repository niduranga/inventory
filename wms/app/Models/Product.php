<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'description',
        'attributes',
    ];

    protected $casts = [
        'attributes' => 'json',
    ];

    /**
     * Get the stocks for the product.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    /**
     * Get the stock logs for the product.
     */
    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }

    // Relationship to locations via stocks pivot table
    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'stocks')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
}
