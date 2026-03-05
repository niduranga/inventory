import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSalesReports, getProfitReports, getInventoryReports, getTopProducts } from '../../api/reportService';

const initialState = {
    salesReport: null,
    profitReport: null,
    inventoryReport: null,
    topProducts: null,
    status: 'idle',
    error: null,
};

export const fetchSalesReports = createAsyncThunk('reports/fetchSalesReports', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getSalesReports(params);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sales reports');
    }
});

export const fetchProfitReports = createAsyncThunk('reports/fetchProfitReports', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getProfitReports(params);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch profit reports');
    }
});

export const fetchInventoryReports = createAsyncThunk('reports/fetchInventoryReports', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getInventoryReports(params);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch inventory reports');
    }
});

export const fetchTopProducts = createAsyncThunk('reports/fetchTopProducts', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getTopProducts(params);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch top products report');
    }
});

const reportSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        resetReportState: (state) => {
            state.salesReport = null;
            state.profitReport = null;
            state.inventoryReport = null;
            state.topProducts = null;
            state.status = 'idle';
            state.error = null;
        },
        clearReportError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSalesReports.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchSalesReports.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.salesReport = action.payload;
            })
            .addCase(fetchSalesReports.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchProfitReports.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProfitReports.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.profitReport = action.payload;
            })
            .addCase(fetchProfitReports.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchInventoryReports.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchInventoryReports.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.inventoryReport = action.payload;
            })
            .addCase(fetchInventoryReports.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchTopProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTopProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.topProducts = action.payload;
            })
            .addCase(fetchTopProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetReportState, clearReportError } = reportSlice.actions;
export default reportSlice.reducer;