// resources/js/stores/stockStore.js

import { defineStore } from 'pinia';
import api from '@/api'; // Assuming api is correctly aliased or imported

export const useStockStore = defineStore('stock', {
  state: () => ({
    products: [],
    locations: [],
    stockLogs: [],
    productStockLevels: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.products.getAll();
        this.products = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch products';
      } finally {
        this.loading = false;
      }
    },

    async fetchLocations() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.locations.getAll();
        this.locations = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch locations';
      } finally {
        this.loading = false;
      }
    },

    async fetchStockLogs(params) {
        // Could fetch all logs, or filter by product/location based on params
        this.loading = true;
        this.error = null;
        try {
            // Example: Fetching product logs, adjust as needed
            const response = await api.stock.getProductStockLogs(params.productId, { limit: params.limit || 10 });
            this.stockLogs = response.data;
        } catch (err) {
            this.error = err.response?.data?.message || 'Failed to fetch stock logs';
        } finally {
            this.loading = false;
        }
    },

    async performStockIn(stockData) {
        this.loading = true;
        this.error = null;
        try {
            const response = await api.stock.handleIn(stockData);
            // Optionally refetch data after operation
            // await this.fetchProducts();
            // await this.fetchLocations();
            return response.data;
        } catch (err) {
            this.error = err.response?.data?.message || 'Stock IN failed';
            throw err; // Re-throw to allow component to handle errors
        } finally {
            this.loading = false;
        }
    },

    async performStockOut(stockData) {
        this.loading = true;
        this.error = null;
        try {
            const response = await api.stock.handleOut(stockData);
            return response.data;
        } catch (err) {
            this.error = err.response?.data?.message || 'Stock OUT failed';
            throw err;
        } finally {
            this.loading = false;
        }
    },

    async performStockTransfer(stockData) {
        this.loading = true;
        this.error = null;
        try {
            const response = await api.stock.handleTransfer(stockData);
            return response.data;
        } catch (err) {
            this.error = err.response?.data?.message || 'Stock TRANSFER failed';
            throw err;
        } finally {
            this.loading = false;
        }
    },

    async fetchProductStockLevels(productId) {
        this.loading = true;
        this.error = null;
        try {
            const response = await api.stock.getProductStock(productId);
            this.productStockLevels = response.data;
        } catch (err) {
            this.error = err.response?.data?.message || 'Failed to fetch product stock levels';
        } finally {
            this.loading = false;
        }
    }
    // Add more actions as needed (e.g., create/update locations, manage products)
  }
});
