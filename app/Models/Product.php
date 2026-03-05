<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sku',
        'name',
        'description',
        'category_id',
        'attributes',
        'reorder_level',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attributes' => 'json', // Cast JSON column
        'reorder_level' => 'integer',
    ];

    /**
     * Get the category that the product belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the stock levels for the product across all locations.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    /**
     * Get the stock movement logs for the product.
     */
    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }

    /**
     * Get the total stock quantity across all locations.
     */
    public function getTotalStockQuantityAttribute(): int
    {
        return $this->stocks()->sum('quantity');
    }

    /**
     * Check if the product is below reorder level.
     */
    public function getIsBelowReorderLevelAttribute(): bool
    {
        return $this->getTotalStockQuantityAttribute() < $this->reorder_level;
    }
}
