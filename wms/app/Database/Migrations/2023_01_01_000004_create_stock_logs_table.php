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
        Schema::create('stock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_location_id')->nullable()->constrained('locations')->onDelete('set null'); // For stock outs or transfers
            $table->foreignId('to_location_id')->nullable()->constrained('locations')->onDelete('set null'); // For stock ins or transfers
            $table->integer('quantity'); // Positive for IN, Negative for OUT
            $table->enum('type', ['In', 'Out', 'Transfer']);
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // User performing the action
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_logs');
    }
};
