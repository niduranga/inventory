import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSales, createSale, updateSale, cancelSale } from '../../api/saleService';

const initialState = {
    sales: [],
    sale: null, // For single sale view
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchSales = createAsyncThunk('sales/fetchSales', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getSales(params);
        return response.data; // { sales: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sales');
    }
});

export const createSaleThunk = createAsyncThunk('sales/createSale', async ({ token, saleData }, { rejectWithValue }) => {
    try {
        const response = await createSale(saleData);
        return response.data.sale;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create sale');
    }
});

export const fetchSaleById = createAsyncThunk('sales/fetchSaleById', async ({ token, id }, { rejectWithValue }) => {
    try {
        const response = await getSaleById(id);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sale details');
    }
});

export const updateSaleThunk = createAsyncThunk('sales/updateSale', async ({ token, saleId, saleData }, { rejectWithValue }) => {
    try {
        const response = await updateSale(saleId, saleData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update sale');
    }
});

export const cancelSaleThunk = createAsyncThunk('sales/cancelSale', async ({ token, saleId }, { rejectWithValue }) => {
    try {
        const response = await cancelSale(saleId);
        return response.data.sale; // Return the cancelled sale object
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to cancel sale');
    }
});

const saleSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {
        resetSaleState: (state) => {
            state.sales = [];
            state.sale = null;
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearSaleError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSales.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchSales.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.sales = action.payload.sales;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchSales.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createSaleThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createSaleThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(createSaleThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchSaleById.pending, (state) => {
                state.status = 'loading';
                state.sale = null;
            })
            .addCase(fetchSaleById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.sale = action.payload;
            })
            .addCase(fetchSaleById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateSaleThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateSaleThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(updateSaleThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(cancelSaleThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(cancelSaleThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.sales = state.sales.map(sale =>
                    sale._id === action.payload._id ? action.payload : sale
                );
                if (state.sale && state.sale._id === action.payload._id) {
                    state.sale = action.payload;
                }
            })
            .addCase(cancelSaleThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetSaleState, clearSaleError } = saleSlice.actions;
export default saleSlice.reducer; 