<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
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
     * Get stock logs originating from this location.
     */
    public function stockLogsFrom(): HasMany
    {
        return $this->hasMany(StockLog::class, 'from_location_id');
    }

    /**
     * Get stock logs destined for this location.
     */
    public function stockLogsTo(): HasMany
    {
        return $this->hasMany(StockLog::class, 'to_location_id');
    }
}
