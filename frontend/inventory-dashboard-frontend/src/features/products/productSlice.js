import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Mock API definition - replace with actual API import or definition
const api = {
    updateProduct: async (productId, productData) => {
        console.log('Mock API: Updating product', productId, productData);
        // Simulate API call, return a success response for now
        return Promise.resolve({ data: { _id: productId, ...productData } });
    }
};

// Define the async thunk for updating a product
export const updateProductThunk = createAsyncThunk(
    'products/updateProduct',
    async ({ token, productId, productData }, { rejectWithValue }) => {
        try {
            // Use the api object to call the actual update function
            const response = await api.updateProduct(productId, productData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update product');
        }
    }
);

// Define other thunks or actions as needed (e.g., fetchProducts, addProduct, deleteProductThunk)
// For example:
export const fetchProducts = createAsyncThunk('products/fetchProducts', async ({ token, params }, { rejectWithValue }) => {
    // Replace with actual API call
    console.log('Mock API: Fetching products', params);
    return Promise.resolve({ data: [], pagination: {} });
});

export const addProduct = createAsyncThunk('products/addProduct', async ({ token, productData }, { rejectWithValue }) => {
    // Replace with actual API call
    console.log('Mock API: Adding product', productData);
    return Promise.resolve({ data: { ...productData, _id: 'new_product_id' } });
});

export const deleteProductThunk = createAsyncThunk('products/deleteProduct', async ({ token, productId }, { rejectWithValue }) => {
    // Replace with actual API call
    console.log('Mock API: Deleting product', productId);
    return Promise.resolve({ data: { message: 'Product deleted' } });
});

const initialState = {
    products: [],
    status: 'idle',
    error: null,
    pagination: { currentPage: 1, pageSize: 10, totalItems: 0 },
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        resetProductState: () => initialState,
        clearProductError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.products.push(action.payload);
            })
            .addCase(deleteProductThunk.fulfilled, (state, action) => {
                state.products = state.products.filter(product => product._id !== action.meta.arg.productId);
            })
            .addCase(updateProductThunk.fulfilled, (state, action) => {
                const index = state.products.findIndex(product => product._id === action.payload._id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
            });
    },
});

export { fetchProducts, addProduct, deleteProductThunk, updateProductThunk }; // Export thunks directly
export const { resetProductState, clearProductError } = productSlice.actions;

export default productSlice.reducer;
