// resources/js/components/DataTable.vue

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th 
            v-for="header in headers"
            :key="header.key"
            @click="sortBy(header)"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer relative"
          >
            {{ header.text }}
            <span v-if="sort.key === header.key" class="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg class="h-5 w-5" :class="{'rotate-180': sort.order === 'asc'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 01.555.184l6 5.5a.75.75 0 01-.184 1.07l-6 5.5a.75.75 0 01-1.07-1.07L13.682 10H3.75a.75.75 0 010-1.5h9.928l-2.723-2.477a.75.75 0 01.184-1.07z" clip-rule="evenodd" />
              </svg>
            </span>
          </th>
          <th v-if="actions.length" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(item, index) in paginatedItems" :key="index">
          <td 
            v-for="header in headers"
            :key="header.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            <!-- Handle nested data or custom formatting -->
            {{ resolveValue(item, header.key) }}
          </td>
          <td v-if="actions.length" class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button 
              v-for="action in actions"
              :key="action.label"
              @click="emitAction(action.event, item)"
              :class="['text-xs px-2 py-1 rounded', 
                        action.color === 'red' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                        action.color === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                        'bg-gray-100 text-gray-800 hover:bg-gray-200']"
            >
              {{ action.label }}
            </button>
          </td>
        </tr>
        <tr v-if="!items || items.length === 0">
          <td :colspan="headers.length + (actions.length ? 1 : 0)" class="px-6 py-4 text-center text-gray-500">
            No data available.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-between items-center px-6 py-3 bg-gray-50">
      <div>
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, items.length) }} of {{ items.length }} entries
      </div>
      <div class="flex space-x-2">
        <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">
          Previous
        </button>
        <span class="px-3 py-1 border rounded bg-white">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  headers: {
    type: Array, // e.g., [{ text: 'Name', key: 'name' }, { text: 'SKU', key: 'sku' }]
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  actions: {
    type: Array, // e.g., [{ label: 'Edit', event: 'edit-item', color: 'blue' }, { label: 'Delete', event: 'delete-item', color: 'red' }]
    default: () => [],
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  }
});

const emit = defineEmits(['sort', 'action', 'page-change']);

const currentPage = ref(1);
const sort = ref({
  key: null,
  order: 'asc',
});

// Computed property for total pages
const totalPages = computed(() => {
  if (!props.items || props.items.length === 0) return 1;
  return Math.ceil(props.items.length / props.itemsPerPage);
});

// Computed property for paginated items
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return props.items.slice(start, end);
});

// Watch for changes in items and reset to first page
watch(() => props.items, () => {
  currentPage.value = 1;
});

// Method to sort items
const sortBy = (header) => {
  if (!header.key) return;
  if (sort.value.key === header.key) {
    sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value.key = header.key;
    sort.value.order = 'asc';
  }
  emit('sort', sort.value);
  // Note: Actual sorting of props.items would be done in the parent component or via a dedicated sort function here that modifies a local copy or the passed-in array.
  // For simplicity in this generic component, we assume the parent will handle re-sorting the data based on the 'sort' event.
};

// Method to go to previous page
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    emit('page-change', currentPage.value);
  }
};

// Method to go to next page
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    emit('page-change', currentPage.value);
  }
};

// Helper to resolve nested values (e.g., 'location.name')
const resolveValue = (item, key) => {
  if (!key) return '';
  const keys = key.split('.');
  let value = item;
  for (const k of keys) {
    if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
      value = value[k];
    } else {
      return ''; // Key not found or value is not an object
    }
  }
  // Format dates or other types if needed
  if (value instanceof Date) {
    return value.toLocaleString(); // Basic date formatting
  }
  // Handle null/undefined gracefully
  return value === null || value === undefined ? '' : value;
};

// Emit action event for buttons
const emitAction = (event, item) => {
  emit(event, item);
};
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>
