import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUsers, inviteUser, updateUser, deleteUser } from '../../api/userService';

const initialState = {
    users: [],
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getUsers(params);
        return response.data; // Assuming API returns { users: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
});

export const inviteUserThunk = createAsyncThunk('users/inviteUser', async ({ token, userData }, { rejectWithValue }) => {
    try {
        const response = await inviteUser(userData);
        return response.data.user; // Assuming API returns the created user object
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to invite user');
    }
});

export const updateUserThunk = createAsyncThunk('users/updateUser', async ({ token, userId, userData }, { rejectWithValue }) => {
    try {
        const response = await updateUser(userId, userData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user');
    }
});

export const deleteUserThunk = createAsyncThunk('users/deleteUser', async ({ token, userId }, { rejectWithValue }) => {
    try {
        await deleteUser(userId);
        return userId; // Return the ID of the deleted user
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete user');
    }
});

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        resetUserState: (state) => {
            state.users = [];
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearUserError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = action.payload.users; // Adjust based on actual API response structure
                state.pagination = action.payload.pagination; // Adjust based on actual API response structure
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(inviteUserThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(inviteUserThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(inviteUserThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateUserThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateUserThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(updateUserThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteUserThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteUserThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = state.users.filter(user => user._id !== action.payload);
            })
            .addCase(deleteUserThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetUserState, clearUserError } = userSlice.actions;
export default userSlice.reducer;
