import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockIn, stockOut, adjustStock, getStockHistory, getProductStockHistory } from '../../api/inventoryService';

const initialState = {
    history: [],
    productHistory: [],
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const performStockIn = createAsyncThunk('inventory/stockIn', async ({ token, data }, { rejectWithValue }) => {
    try {
        const response = await stockIn(data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Stock In failed');
    }
});

export const performStockOut = createAsyncThunk('inventory/stockOut', async ({ token, data }, { rejectWithValue }) => {
    try {
        const response = await stockOut(data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Stock Out failed');
    }
});

export const performStockAdjust = createAsyncThunk('inventory/adjustStock', async ({ token, data }, { rejectWithValue }) => {
    try {
        const response = await adjustStock(data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Stock Adjustment failed');
    }
});

export const fetchStockHistory = createAsyncThunk('inventory/fetchStockHistory', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getStockHistory(params);
        return response.data; // { movements: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch stock history');
    }
});

export const fetchProductSpecificStockHistory = createAsyncThunk('inventory/fetchProductSpecificStockHistory', async ({ token, productId, params }, { rejectWithValue }) => {
    try {
        const response = await getProductStockHistory(productId, params);
        return response.data; // { product: {}, movements: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch product stock history');
    }
});

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        resetInventoryState: (state) => {
            state.history = [];
            state.productHistory = [];
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearInventoryError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(performStockIn.pending, (state) => { state.status = 'loading'; })
            .addCase(performStockIn.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(performStockIn.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
            .addCase(performStockOut.pending, (state) => { state.status = 'loading'; })
            .addCase(performStockOut.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(performStockOut.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
            .addCase(performStockAdjust.pending, (state) => { state.status = 'loading'; })
            .addCase(performStockAdjust.fulfilled, (state) => { state.status = 'succeeded'; })
            .addCase(performStockAdjust.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
            .addCase(fetchStockHistory.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchStockHistory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.history = action.payload.movements;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchStockHistory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchProductSpecificStockHistory.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProductSpecificStockHistory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.productHistory = action.payload.movements;
                // Optionally store product details: state.product = action.payload.product;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProductSpecificStockHistory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetInventoryState, clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer; 