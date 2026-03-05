<template>
  <div id="app" class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white flex flex-col">
      <div class="p-4 text-lg font-semibold border-b border-gray-700">
        WMS Dashboard
      </div>
      <nav class="flex-1 px-2 py-4 space-y-2">
        <router-link 
          to="/"
          class="block px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          active-class="bg-gray-700"
        >
          Dashboard
        </router-link>
        <router-link 
          to="/products"
          class="block px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          active-class="bg-gray-700"
        >
          Products
        </router-link>
        <router-link 
          to="/locations"
          class="block px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          active-class="bg-gray-700"
        >
          Locations
        </router-link>
        <router-link 
          to="/stock"
          class="block px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          active-class="bg-gray-700"
        >
          Stock Logs
        </router-link>
        <router-link 
          to="/stock/move"
          class="block px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          active-class="bg-gray-700"
        >
          Stock Movement
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900">{{ $route.name }}</h1>
        <!-- Add user info/logout here if needed -->
      </header>
      <div class="flex-1 overflow-auto p-6">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<style>
/* Global styles or Tailwind base setup */
/* Ensure Tailwind directives are in your main CSS file */
</style>
