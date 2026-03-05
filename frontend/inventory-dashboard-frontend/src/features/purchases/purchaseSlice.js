import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../../api/purchaseService';

const initialState = {
    purchases: [],
    purchase: null, // For single purchase view
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchPurchases = createAsyncThunk('purchases/fetchPurchases', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getPurchases(params);
        return response.data; // { purchases: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch purchases');
    }
});

export const createPurchaseThunk = createAsyncThunk('purchases/createPurchase', async ({ token, purchaseData }, { rejectWithValue }) => {
    try {
        const response = await createPurchase(purchaseData);
        return response.data.purchase;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create purchase');
    }
});

export const fetchPurchaseById = createAsyncThunk('purchases/fetchPurchaseById', async ({ token, id }, { rejectWithValue }) => {
    try {
        const response = await getPurchaseById(id);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch purchase details');
    }
});

export const updatePurchaseThunk = createAsyncThunk('purchases/updatePurchase', async ({ token, purchaseId, purchaseData }, { rejectWithValue }) => {
    try {
        const response = await updatePurchase(purchaseId, purchaseData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update purchase');
    }
});

export const deletePurchaseThunk = createAsyncThunk('purchases/deletePurchase', async ({ token, purchaseId }, { rejectWithValue }) => {
    try {
        const response = await deletePurchase(purchaseId);
        return response.data.purchase; // Assuming API returns the deactivated purchase
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete purchase');
    }
});

const purchaseSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {
        resetPurchaseState: (state) => {
            state.purchases = [];
            state.purchase = null;
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearPurchaseError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPurchases.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchPurchases.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.purchases = action.payload.purchases;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchPurchases.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createPurchaseThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createPurchaseThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(createPurchaseThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchPurchaseById.pending, (state) => {
                state.status = 'loading';
                state.purchase = null;
            })
            .addCase(fetchPurchaseById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.purchase = action.payload;
            })
            .addCase(fetchPurchaseById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updatePurchaseThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updatePurchaseThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(updatePurchaseThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deletePurchaseThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deletePurchaseThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.purchases = state.purchases.map(purchase =>
                    purchase._id === action.payload._id ? action.payload : purchase
                );
                if (state.purchase && state.purchase._id === action.payload._id) {
                    state.purchase = action.payload;
                }
            })
            .addCase(deletePurchaseThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetPurchaseState, clearPurchaseError } = purchaseSlice.actions;
export default purchaseSlice.reducer; 