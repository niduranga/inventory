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
            $table->foreignId('product_id')->constrained()->onDelete('restrict'); // Prevent deleting product if logs exist
            $table->foreignId('from_location_id')->nullable()->constrained('locations')->onDelete('set null'); // Null if it's an inbound shipment
            $table->foreignId('to_location_id')->nullable()->constrained('locations')->onDelete('set null'); // Null if it's an outbound shipment
            $table->integer('quantity'); // Positive for inbound/adjustment, negative for outbound
            $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'initial'])->default('in');
            $table->string('reference_id')->nullable(); // e.g., Order ID, Transfer ID, Shipment ID
            $table->string('reference_type')->nullable(); // e.g., App\Models\Order, App\Models\Transfer
            $table->timestamps();

            $table->index(['product_id', 'from_location_id', 'to_location_id', 'type']);
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
