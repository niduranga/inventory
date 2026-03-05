<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade'); // If product is deleted, stock records are removed
            $table->foreignId('location_id')->constrained()->onDelete('cascade'); // If location is deleted, stock records are removed
            $table->integer('quantity')->default(0);
            $table->timestamps();

            // Ensure a product has only one stock entry per location
            $table->unique(['product_id', 'location_id']);
            $table->index(['product_id', 'location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
