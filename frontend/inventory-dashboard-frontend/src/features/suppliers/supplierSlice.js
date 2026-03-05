import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/supplierService';

const initialState = {
    suppliers: [],
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchSuppliers = createAsyncThunk('suppliers/fetchSuppliers', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getSuppliers(params);
        return response.data; // { suppliers: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch suppliers');
    }
});

export const addSupplier = createAsyncThunk('suppliers/addSupplier', async ({ token, supplierData }, { rejectWithValue }) => {
    try {
        const response = await createSupplier(supplierData);
        return response.data.supplier;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create supplier');
    }
});

export const updateSupplierThunk = createAsyncThunk('suppliers/updateSupplier', async ({ token, supplierId, supplierData }, { rejectWithValue }) => {
    try {
        const response = await updateSupplier(supplierId, supplierData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update supplier');
    }
});

export const deleteSupplierThunk = createAsyncThunk('suppliers/deleteSupplier', async ({ token, supplierId }, { rejectWithValue }) => {
    try {
        await deleteSupplier(supplierId);
        return supplierId; // Return the ID of the deleted supplier
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete supplier');
    }
});

const supplierSlice = createSlice({
    name: 'suppliers',
    initialState,
    reducers: {
        resetSupplierState: (state) => {
            state.suppliers = [];
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearSupplierError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchSuppliers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.suppliers = action.payload.suppliers;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchSuppliers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addSupplier.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addSupplier.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(addSupplier.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateSupplierThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateSupplierThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(updateSupplierThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteSupplierThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteSupplierThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.suppliers = state.suppliers.filter(supplier => supplier._id !== action.payload);
            })
            .addCase(deleteSupplierThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetSupplierState, clearSupplierError } = supplierSlice.actions;
export default supplierSlice.reducer;
