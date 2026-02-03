import { createSlice } from '@reduxjs/toolkit';

const loadInitialState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      console.log('🔄 Loading initial state from localStorage:', {
        hasToken: !!token,
        user: user?.id || user?.userId,
        isAuthenticated: true
      });
      
      return {
        token,
        user,
        roles: user.roles || [],
        isAuthenticated: true
      };
    }
  } catch (error) {
    console.error('❌ Error loading initial state from localStorage:', error);
  }
  
  console.log('🔍 No saved state found in localStorage');
  return {
    token: null,
    user: null,
    roles: [],
    isAuthenticated: false
  };
};

const tokenSlice = createSlice({
  name: 'token',
  initialState: loadInitialState(),
  reducers: {
    saveToken: (state, action) => {
      const payload = action.payload;
      
      console.log('💾 saveToken action received:', {
        hasToken: !!(payload.token || payload.jwt),
        hasUserId: !!(payload.userId),
        payloadKeys: Object.keys(payload)
      });
      
      // Сохраняем токен
      if (payload.token || payload.jwt) {
        const token = payload.token || payload.jwt;
        state.token = token;
        localStorage.setItem('token', token);
        console.log('✅ Token saved to localStorage');
      }
      
      // Сохраняем пользователя
      if (payload.userId) {
        // Создаем унифицированный объект пользователя
        state.user = {
          // Основные ID
          id: payload.userId,
          userId: payload.userId,
          
          // Имена и username
          username: payload.userName || payload.username || '',
          userName: payload.userName || payload.username || '',
          name: payload.userName || payload.username || '',
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          
          // Контактная информация
          email: payload.email || '',
          
          // Роли и разрешения
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          
          // Дополнительные данные
          phoneNumber: payload.phoneNumber || '',
          specialization: payload.specialization || '',
          department: payload.department || '',
          
          // Токен (если передается отдельно)
          token: payload.token || payload.jwt || state.token
        };
        
        state.roles = payload.roles || [];
        state.isAuthenticated = true;
        
        // Сохраняем в localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
        
        console.log('✅ User saved to Redux:', {
          userId: state.user.id,
          username: state.user.username,
          roles: state.user.roles,
          isAuthenticated: state.isAuthenticated
        });
      }
    },
    
    clearToken: (state) => {
      console.log('🧹 Clearing token from Redux and localStorage');
      
      state.token = null;
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('✅ Token cleared successfully');
    },
    
    updateUser: (state, action) => {
      if (state.user) {
        console.log('🔄 Updating user data:', Object.keys(action.payload));
        
        state.user = {
          ...state.user,
          ...action.payload
        };
        
        localStorage.setItem('user', JSON.stringify(state.user));
        console.log('✅ User data updated');
      }
    },
    
    updateToken: (state, action) => {
      const newToken = action.payload;
      if (newToken) {
        console.log('🔄 Updating token');
        state.token = newToken;
        localStorage.setItem('token', newToken);
        
        // Также обновляем токен в объекте пользователя
        if (state.user) {
          state.user.token = newToken;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        
        console.log('✅ Token updated');
      }
    },
    
    // Дополнительный метод для отладки
    debugState: (state) => {
      console.log('🔍 Current token state:', {
        hasToken: !!state.token,
        tokenType: typeof state.token,
        tokenLength: state.token?.length,
        user: state.user ? {
          id: state.user.id,
          userId: state.user.userId,
          username: state.user.username,
          roles: state.user.roles
        } : null,
        isAuthenticated: state.isAuthenticated,
        localStorageToken: localStorage.getItem('token')?.substring(0, 20) + '...',
        localStorageUser: localStorage.getItem('user')?.substring(0, 50) + '...'
      });
    }
  },
});

export const { saveToken, clearToken, updateUser, updateToken, debugState } = tokenSlice.actions;

// Селекторы для удобного доступа
export const selectToken = (state) => state.token.token;
export const selectUser = (state) => state.token.user;
export const selectUserId = (state) => state.token.user?.id || state.token.user?.userId;
export const selectIsAuthenticated = (state) => state.token.isAuthenticated;
export const selectUserRoles = (state) => state.token.roles;

export default tokenSlice.reducer;