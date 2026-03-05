// resources/js/views/Location/Index.vue

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Locations</h2>

    <div class="mb-4 flex justify-between items-center">
      <router-link 
        to="/locations/create" 
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Location
      </router-link>
      <!-- Potentially add search/filter controls here -->
    </div>

    <DataTable 
      :headers="locationHeaders"
      :items="stockStore.locations"
      :actions="locationActions"
      :itemsPerPage="10"
      @edit-item="handleEdit"
      @delete-item="handleDelete"
      @sort="handleSort"
      v-if="!stockStore.loading && !stockStore.error"
    />

    <div v-if="stockStore.loading" class="text-center py-4">
      Loading locations...
    </div>
    <div v-if="stockStore.error" class="text-center py-4 text-red-500">
      Error: {{ stockStore.error }}
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStockStore } from '@/stores/stockStore';
import DataTable from '@/components/DataTable.vue';
import { useRouter } from 'vue-router';
import api from '@/api'; // Import api for potential delete operations

const stockStore = useStockStore();
const router = useRouter();

const locationHeaders = [
  { text: 'Name', key: 'name' },
  { text: 'Description', key: 'description' },
  { text: 'Address', key: 'address' },
  { text: 'Created At', key: 'created_at' },
];

const locationActions = [
  { label: 'Edit', event: 'edit-item', color: 'blue' },
  { label: 'Delete', event: 'delete-item', color: 'red' },
];

onMounted(async () => {
  await stockStore.fetchLocations();
});

const handleEdit = (item) => {
  router.push({ name: 'locations.edit', params: { id: item.id } }); // Assuming an 'edit' route exists
};

const handleDelete = async (item) => {
  if (confirm('Are you sure you want to delete this location?')) {
    try {
      // await stockStore.deleteLocation(item.id); // If delete action is in store
      await api.locations.delete(item.id);
      await stockStore.fetchLocations(); // Refresh list
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Failed to delete location. Please try again.');
    }
  }
};

const handleSort = (sortConfig) => {
  // Implement sorting logic similar to Product Index or handle via API
  console.log('Sorting by:', sortConfig);
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
