<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'address',
    ];

    /**
     * Get the stocks for the location.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    /**
     * Get the stock logs associated with this location (as source or destination).
     */
    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class, 'to_location_id')->orWhere('from_location_id');
    }

    // Relationship to products via stocks pivot table
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'stocks')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
}
