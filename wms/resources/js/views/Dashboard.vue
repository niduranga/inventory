// resources/js/views/Dashboard.vue

<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Welcome to the Universal Smart Inventory & Warehouse Management System!</h2>
    <p class="text-gray-700">This is your central hub for managing products, locations, and stock movements efficiently.</p>
    <div class="mt-6">
      <p class="text-gray-600">Quick Links:</p>
      <ul class="list-disc list-inside ml-4">
        <li><router-link to="/products" class="text-blue-600 hover:underline">Manage Products</router-link></li>
        <li><router-link to="/locations" class="text-blue-600 hover:underline">Manage Locations</router-link></li>
        <li><router-link to="/stock" class="text-blue-600 hover:underline">View Stock Logs</router-link></li>
        <li><router-link to="/stock/move" class="text-blue-600 hover:underline">Perform Stock Movement</router-link></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
/* Add component-specific styles here */
</style>
