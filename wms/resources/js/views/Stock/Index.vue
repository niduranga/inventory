// resources/js/views/Stock/Index.vue

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Stock Logs</h2>

    <div class="mb-4 flex justify-between items-center">
      <router-link 
        to="/stock/move"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Record Stock Movement
      </router-link>
      <!-- Potentially add search/filter controls here -->
    </div>

    <DataTable 
      :headers="stockLogHeaders"
      :items="stockStore.stockLogs"
      :actions="[]" <!-- No actions for logs by default -->
      :itemsPerPage="15"
      @sort="handleSort"
      v-if="!stockStore.loading && !stockStore.error"
    />

    <div v-if="stockStore.loading" class="text-center py-4">
      Loading stock logs...
    </div>
    <div v-if="stockStore.error" class="text-center py-4 text-red-500">
      Error: {{ stockStore.error }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useStockStore } from '@/stores/stockStore';
import DataTable from '@/components/DataTable.vue';

const stockStore = useStockStore();

const stockLogHeaders = [
  { text: 'Product', key: 'product.name' }, // Nested key for related data
  { text: 'SKU', key: 'product.sku' },
  { text: 'Type', key: 'type' },
  { text: 'Quantity', key: 'quantity' },
  { text: 'From Location', key: 'from_location.name' }, // Nested key
  { text: 'To Location', key: 'to_location.name' }, // Nested key
  { text: 'User', key: 'user.name' }, // Nested key
  { text: 'Notes', key: 'notes' },
  { text: 'Timestamp', key: 'created_at' },
];

// Fetch stock logs on component mount. 
// In a real app, you'd likely have filters for product, location, date range.
// For now, fetching a default set.
onMounted(async () => {
  // Example: Fetching logs for a specific product if needed, otherwise fetch general logs
  // await stockStore.fetchStockLogs({ productId: 1 }); // Replace 1 with a dynamic ID or filter
  // For a general log view, you might need a different API endpoint or logic
  // For now, simulating a fetch that might load some initial logs (adapt based on actual backend endpoint for general logs)
  // If no general log endpoint, this might fetch product logs for a default product.
  
  // Let's assume a backend endpoint could list recent logs globally, or we fetch for a default item.
  // For demonstration, let's try fetching logs for product ID 1, if it exists.
  // A better approach would be to have a dedicated /api/stock/logs endpoint.
  try {
      // To fetch general logs, you might need to adjust the API service and backend endpoint.
      // For now, we can fetch logs for a hypothetical product ID 1.
      await stockStore.fetchStockLogs({ productId: 1 });
  } catch (e) {
      console.warn("Could not fetch logs for product ID 1. Please ensure it exists or adjust the fetch logic.");
      // Optionally fetch other data or show an empty state
  }
});

const handleSort = (sortConfig) => {
  console.log('Sorting stock logs by:', sortConfig);
  // Implement sorting logic similar to Product Index or handle via API with sort params
  // For now, client-side sorting if data is loaded, or trigger API call.
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
