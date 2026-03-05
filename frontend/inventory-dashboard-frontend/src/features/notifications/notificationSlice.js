import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotifications, markNotificationsAsRead, deleteNotification } from '../../api/notificationService';

const initialState = {
    notifications: [],
    status: 'idle',
    error: null,
    pagination: {
        currentPage: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
    },
};

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await getNotifications(params);
        return response.data; // { notifications: [], pagination: {} }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch notifications');
    }
});

export const markNotificationsRead = createAsyncThunk('notifications/markRead', async ({ token, notificationIds }, { rejectWithValue }) => {
    try {
        const response = await markNotificationsAsRead(notificationIds);
        return notificationIds; // Return IDs of marked notifications
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark notifications as read');
    }
});

export const deleteNotificationThunk = createAsyncThunk('notifications/deleteNotification', async ({ token, notificationId }, { rejectWithValue }) => {
    try {
        await deleteNotification(notificationId);
        return notificationId; // Return ID of deleted notification
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete notification');
    }
});

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        resetNotificationState: (state) => {
            state.notifications = [];
            state.status = 'idle';
            state.error = null;
            state.pagination = { currentPage: 1, limit: 10, totalDocs: 0, totalPages: 0 };
        },
        clearNotificationError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.notifications = action.payload.notifications;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(markNotificationsRead.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(markNotificationsRead.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Mark notifications as read in the state
                state.notifications = state.notifications.map(notif =>
                    action.payload.includes(notif._id) ? { ...notif, isRead: true } : notif
                );
            })
            .addCase(markNotificationsRead.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteNotificationThunk.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.notifications = state.notifications.filter(notif => notif._id !== action.payload);
            })
            .addCase(deleteNotificationThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetNotificationState, clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
