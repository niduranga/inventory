// resources/js/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '@/views/Dashboard.vue';
import ProductIndex from '@/views/Product/Index.vue';
import LocationIndex from '@/views/Location/Index.vue';
import StockIndex from '@/views/Stock/Index.vue';
import StockMovementForm from '@/views/Stock/MovementForm.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/products',
    name: 'products.index',
    component: ProductIndex,
  },
  {
    path: '/locations',
    name: 'locations.index',
    component: LocationIndex,
  },
  {
    path: '/stock',
    name: 'stock.index',
    component: StockIndex,
  },
  {
    path: '/stock/move',
    name: 'stock.move',
    component: StockMovementForm,
    props: true // Pass route params as props
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Or process.env.BASE_URL for older Vite/Vue CLI
  routes,
});

export default router;
