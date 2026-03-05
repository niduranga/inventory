import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser, getUserProfile } from '../../api/authService';

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    status: 'idle',
    error: null,
};

export const login = createAsyncThunk('auth/login', async (userData, { rejectWithValue }) => {
    try {
        const response = await loginUser(userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const response = await registerUser(userData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed');
    }
});

export const fetchUserProfile = createAsyncThunk('auth/fetchUserProfile', async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
        return rejectWithValue('No token available');
    }
    try {
        const response = await getUserProfile(token);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user profile');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.status = 'idle';
            state.error = null;
        },
        clearAuthError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = localStorage.getItem('token');
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            .addCase(register.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(register.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchUserProfile.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.isAuthenticated = false;
                state.token = null;
                localStorage.removeItem('token');
            });
    },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;