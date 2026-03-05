import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../../api/productService';

const initialState = {
    products: [],
    product: null, // For single product view/edit
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchProducts = createAsyncThunk('products/fetchProducts', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getProducts(params);
        return response.data; // { products: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch products');
    }
});

export const fetchProductById = createAsyncThunk('products/fetchProductById', async ({ token, id }, { rejectWithValue }) => {
    try {
        const response = await getProductById(id);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch product');
    }
});

export const addProduct = createAsyncThunk('products/addProduct', async ({ token, productData }, { rejectWithValue }) => {
    try {
        const response = await createProduct(productData);
        return response.data.product;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create product');
    }
});

export const updateProduct = createAsyncThunk('products/updateProduct', async ({ token, productId, productData }, { rejectWithValue }) => {
    try {
        const response = await updateProduct(productId, productData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update product');
    }
});

export const deleteProductThunk = createAsyncThunk('products/deleteProduct', async ({ token, productId }, { rejectWithValue }) => {
    try {
        await deleteProduct(productId);
        return productId; // Return the ID of the deleted product
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete product');
    }
});

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        resetProductState: (state) => {
            state.products = [];
            state.product = null;
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearProductError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload.products;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchProductById.pending, (state) => {
                state.status = 'loading';
                state.product = null;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.product = action.payload;
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addProduct.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Optionally add the new product to the list or re-fetch products
            })
            .addCase(addProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateProduct.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Update the product in the list or re-fetch
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteProductThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteProductThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Remove the deleted product from the list
                state.products = state.products.filter(product => product._id !== action.payload);
            })
            .addCase(deleteProductThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetProductState, clearProductError } = productSlice.actions;
export default productSlice.reducer;
