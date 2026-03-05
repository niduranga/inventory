// resources/js/views/Product/Index.vue

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Products</h2>

    <div class="mb-4 flex justify-between items-center">
      <router-link 
        to="/products/create" 
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Product
      </router-link>
      <!-- Potentially add search/filter controls here -->
    </div>

    <DataTable 
      :headers="productHeaders"
      :items="stockStore.products"
      :actions="productActions"
      :itemsPerPage="10"
      @edit-item="handleEdit"
      @delete-item="handleDelete"
      @sort="handleSort"
      v-if="!stockStore.loading && !stockStore.error"
    />

    <div v-if="stockStore.loading" class="text-center py-4">
      Loading products...
    </div>
    <div v-if="stockStore.error" class="text-center py-4 text-red-500">
      Error: {{ stockStore.error }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useStockStore } from '@/stores/stockStore';
import DataTable from '@/components/DataTable.vue';
import { useRouter } from 'vue-router';
import api from '@/api'; // Import api for potential delete operations if not handled by store directly

const stockStore = useStockStore();
const router = useRouter();

const productHeaders = [
  { text: 'Name', key: 'name' },
  { text: 'SKU', key: 'sku' },
  { text: 'Description', key: 'description' },
  { text: 'Attributes', key: 'attributes' }, // Will need custom rendering if complex JSON
  { text: 'Created At', key: 'created_at' },
];

const productActions = [
  { label: 'Edit', event: 'edit-item', color: 'blue' },
  { label: 'Delete', event: 'delete-item', color: 'red' },
];

// Custom rendering for attributes if needed
const renderAttributes = (attributes) => {
    if (!attributes) return 'N/A';
    try {
        const attrs = JSON.parse(attributes);
        return Object.entries(attrs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    } catch (e) {
        return 'Invalid JSON';
    }
};

// Computed property to provide correctly formatted attributes for DataTable
const formattedProducts = computed(() => {
    return stockStore.products.map(p => ({
        ...p,
        attributes: renderAttributes(p.attributes) // Ensure attributes are stringified or formatted
    }));
});


onMounted(async () => {
  await stockStore.fetchProducts();
});

const handleEdit = (item) => {
  router.push({ name: 'products.edit', params: { id: item.id } }); // Assuming an 'edit' route exists
};

const handleDelete = async (item) => {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      // await stockStore.deleteProduct(item.id); // If delete action is in store
      await api.products.delete(item.id);
      await stockStore.fetchProducts(); // Refresh list
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }
};

const handleSort = (sortConfig) => {
  // In a real app, you'd sort the data here or trigger an API call with sort params
  // For this example, we'll simulate sorting on the client-side data.
  const { key, order } = sortConfig;
  if (!key) return;
  stockStore.products.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    // Handle nested keys if necessary (e.g., location.name)
    if (key.includes('.')) {
        const keys = key.split('.');
        valA = keys.reduce((o, k) => o?.[k], a);
        valB = keys.reduce((o, k) => o?.[k], b);
    }

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return order === 'asc' ? 1 : -1;
    if (valB === null || valB === undefined) return order === 'asc' ? -1 : 1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return order === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    }
  });
};

</script>

<style scoped>
/* Add component-specific styles here */
</style>
