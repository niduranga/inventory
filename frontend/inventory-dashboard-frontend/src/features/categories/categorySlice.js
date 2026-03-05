import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoryService';

const initialState = {
    categories: [],
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getCategories(params);
        return response.data; // { categories: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
});

export const addCategory = createAsyncThunk('categories/addCategory', async ({ token, categoryData }, { rejectWithValue }) => {
    try {
        const response = await createCategory(categoryData);
        return response.data.category;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create category');
    }
});

export const updateCategoryThunk = createAsyncThunk('categories/updateCategory', async ({ token, categoryId, categoryData }, { rejectWithValue }) => {
    try {
        const response = await updateCategory(categoryId, categoryData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update category');
    }
});

export const deleteCategoryThunk = createAsyncThunk('categories/deleteCategory', async ({ token, categoryId }, { rejectWithValue }) => {
    try {
        await deleteCategory(categoryId);
        return categoryId; // Return the ID of the deleted category
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete category');
    }
});

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        resetCategoryState: (state) => {
            state.categories = [];
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearCategoryError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = action.payload.categories;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addCategory.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addCategory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Optionally add the new category to the list or re-fetch categories
            })
            .addCase(addCategory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateCategoryThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateCategoryThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Update the category in the list or re-fetch
            })
            .addCase(updateCategoryThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteCategoryThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = state.categories.filter(category => category._id !== action.payload);
            })
            .addCase(deleteCategoryThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetCategoryState, clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
