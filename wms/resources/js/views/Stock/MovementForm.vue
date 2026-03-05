// resources/js/views/Stock/MovementForm.vue

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Perform Stock Movement</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="movementType" class="block text-sm font-medium text-gray-700">Movement Type</label>
        <select 
          id="movementType"
          v-model="movement.type"
          @change="resetFormForType"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Select type</option>
          <option value="In">Stock In</option>
          <option value="Out">Stock Out</option>
          <option value="Transfer">Stock Transfer</option>
        </select>
        <p v-if="errors.type" class="text-red-500 text-sm mt-1">{{ errors.type }}</p>
      </div>

      <!-- Product Selection -->
      <div>
        <label for="productId" class="block text-sm font-medium text-gray-700">Product</label>
        <select 
          id="productId"
          v-model="movement.productId"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Select Product</option>
          <option v-for="product in stockStore.products" :key="product.id" :value="product.id">
            {{ product.name }} ({{ product.sku }})
          </option>
        </select>
        <p v-if="errors.productId" class="text-red-500 text-sm mt-1">{{ errors.productId }}</p>
      </div>

      <!-- Location Selection -->
      <div v-if="movement.type === 'In' || movement.type === 'Out'">
        <label for="locationId" class="block text-sm font-medium text-gray-700">Location</label>
        <select 
          id="locationId"
          v-model="movement.locationId"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Select Location</option>
          <option v-for="location in stockStore.locations" :key="location.id" :value="location.id">
            {{ location.name }}
          </option>
        </select>
        <p v-if="errors.locationId" class="text-red-500 text-sm mt-1">{{ errors.locationId }}</p>
      </div>

      <!-- Transfer Locations -->
      <div v-if="movement.type === 'Transfer'" class="grid grid-cols-2 gap-4">
        <div>
          <label for="fromLocationId" class="block text-sm font-medium text-gray-700">From Location</label>
          <select 
            id="fromLocationId"
            v-model="movement.fromLocationId"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option disabled value="">Select Source Location</option>
            <option v-for="location in stockStore.locations" :key="location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>
          <p v-if="errors.fromLocationId" class="text-red-500 text-sm mt-1">{{ errors.fromLocationId }}</p>
        </div>
        <div>
          <label for="toLocationId" class="block text-sm font-medium text-gray-700">To Location</label>
          <select 
            id="toLocationId"
            v-model="movement.toLocationId"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option disabled value="">Select Destination Location</option>
            <option v-for="location in stockStore.locations" :key="location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>
          <p v-if="errors.toLocationId" class="text-red-500 text-sm mt-1">{{ errors.toLocationId }}</p>
        </div>
      </div>

      <!-- Quantity -->
      <div>
        <label for="quantity" class="block text-sm font-medium text-gray-700">Quantity</label>
        <input 
          type="number" 
          id="quantity" 
          v-model.number="movement.quantity"
          min="1"
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
        />
        <p v-if="errors.quantity" class="text-red-500 text-sm mt-1">{{ errors.quantity }}</p>
      </div>

      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
        <textarea 
          id="notes"
          v-model="movement.notes"
          rows="3"
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
        ></textarea>
        <p v-if="errors.notes" class="text-red-500 text-sm mt-1">{{ errors.notes }}</p>
      </div>

      <div class="flex justify-end">
        <button 
          type="submit"
          :disabled="stockStore.loading || !isFormValid"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ stockStore.loading ? 'Processing...' : 'Submit Movement' }}
        </button>
      </div>
    </form>

    <div v-if="responseMessage" :class="['mt-4 p-3 rounded-md', responseStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
      {{ responseMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useStockStore } from '@/stores/stockStore';
import { useRouter } from 'vue-router';

const stockStore = useStockStore();
const router = useRouter();

const movement = reactive({
  type: '',
  productId: '',
  locationId: '', // For In/Out
  fromLocationId: '', // For Transfer
  toLocationId: '',   // For Transfer
  quantity: 1,
  notes: '',
});

const errors = reactive({});
const responseMessage = ref('');
const responseStatus = ref('');

// Fetch initial data on component mount
const initialFetch = async () => {
    await stockStore.fetchProducts();
    await stockStore.fetchLocations();
};

onMounted(initialFetch);

// Reset form fields based on movement type
const resetFormForType = () => {
    movement.locationId = '';
    movement.fromLocationId = '';
    movement.toLocationId = '';
    // Clear specific errors related to locations
    errors.locationId = null;
    errors.fromLocationId = null;
    errors.toLocationId = null;
};

// Form validation computed property
const isFormValid = computed(() => {
  if (!movement.type || !movement.productId || movement.quantity < 1) {
    return false;
  }
  if (movement.type === 'In' || movement.type === 'Out') {
    if (!movement.locationId) return false;
  } else if (movement.type === 'Transfer') {
    if (!movement.fromLocationId || !movement.toLocationId) return false;
  }
  return true;
});

// Submit handler
const handleSubmit = async () => {
  resetValidationErrors();
  // Basic client-side validation before API call
  if (!isFormValid.value) {
      validateFormClientSide();
      return;
  }

  stockStore.loading = true;
  responseMessage.value = '';
  responseStatus.value = '';

  try {
    let response;
    const payload = {
      product_id: movement.productId,
      quantity: movement.quantity,
      notes: movement.notes,
    };

    if (movement.type === 'In') {
      payload.location_id = movement.locationId;
      response = await stockStore.performStockIn(payload);
    } else if (movement.type === 'Out') {
      payload.location_id = movement.locationId;
      response = await stockStore.performStockOut(payload);
    } else if (movement.type === 'Transfer') {
      payload.from_location_id = movement.fromLocationId;
      payload.to_location_id = movement.toLocationId;
      response = await stockStore.performStockTransfer(payload);
    } else {
      throw new Error('Invalid movement type selected.');
    }

    responseMessage.value = response.message;
    responseStatus.value = 'success';
    
    // Optionally reset form or navigate
    // resetForm();
    // router.push({ name: 'stock.index' }); // Navigate to stock logs page

  } catch (err) {
    const apiErrors = err.response?.data?.errors;
    if (apiErrors) {
      // Populate form errors from API response
      Object.keys(apiErrors).forEach(key => {
        errors[key] = apiErrors[key][0]; // Take the first error message
      });
      // Also check for specific transfer location mismatch not caught by validator
      if (err.response?.data?.message?.includes('Source and destination locations cannot be the same')) {
          errors.toLocationId = 'Source and destination locations cannot be the same.';
      }
    }
    responseMessage.value = err.response?.data?.message || 'An unexpected error occurred.';
    responseStatus.value = 'error';
    console.error('Movement failed:', err.response?.data || err);
  } finally {
    stockStore.loading = false;
  }
};

// Client-side validation helper
const validateFormClientSide = () => {
    if (!movement.type) errors.type = 'Movement type is required.';
    if (!movement.productId) errors.productId = 'Product is required.';
    if (movement.quantity < 1) errors.quantity = 'Quantity must be at least 1.';

    if (movement.type === 'In' || movement.type === 'Out') {
        if (!movement.locationId) errors.locationId = 'Location is required for ' + movement.type + '.';
    } else if (movement.type === 'Transfer') {
        if (!movement.fromLocationId) errors.fromLocationId = 'Source location is required for transfer.';
        if (!movement.toLocationId) errors.toLocationId = 'Destination location is required for transfer.';
        if (movement.fromLocationId && movement.toLocationId && movement.fromLocationId === movement.toLocationId) {
            errors.toLocationId = 'Source and destination locations cannot be the same.';
        }
    }
};

// Clear all validation errors
const resetValidationErrors = () => {
    Object.keys(errors).forEach(key => {
        errors[key] = null;
    });
};

// Watch for type changes to reset form and clear related errors
watch(() => movement.type, resetFormForType);

// Watch for movement.productId to potentially fetch product-specific stock levels
watch(() => movement.productId, async (newProductId) => {
    if (newProductId) {
        try {
            await stockStore.fetchProductStockLevels(newProductId);
        } catch (e) {
            console.error('Error fetching stock levels for product:', newProductId, e);
        }
    }
});

</script>

<style scoped>
/* Add component-specific styles here */
</style>
