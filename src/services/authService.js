// services/authService.js
import api from "../../utils/api";

export const login = async (credentials) => {
  try {
    // Очищаем старый токен перед логином
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const res = await api.post("/api/auth/login", credentials);
    const { jwt, userId, userName, roles } = res.data;

    console.log("Auth Service - Full response:", res.data);

    // Проверяем, что токен валидный
    if (!jwt || typeof jwt !== "string") {
      console.error("Invalid JWT received:", jwt);
      throw new Error("Invalid or missing JWT token from server");
    }

    // Проверяем наличие userId
    if (!userId) {
      console.error("No userId received in response");
      throw new Error("User ID not received from server");
    }

    console.log("Auth Service - Extracted data:", { 
      jwt, 
      userId, 
      userName, 
      roles 
    });

    // Преобразуем роли в массив строк
    let roleNames = [];
    if (Array.isArray(roles)) {
      roleNames = roles.map(role => {
        // Обрабатываем разные форматы ролей
        if (typeof role === 'string') return role;
        if (role.roleName) return role.roleName;
        if (role.name) return role.name;
        if (role.authority) return role.authority;
        return String(role);
      });
    }

    // Сохраняем токен
    localStorage.setItem("token", jwt);
    
    // Сохраняем данные пользователя для быстрого доступа
    const userData = {
      id: userId,
      userId: userId,
      username: userName,
      name: userName,
      roles: roleNames
    };
    
    localStorage.setItem("user", JSON.stringify(userData));

    // Возвращаем структурированные данные для Redux
    return {
      jwt,
      token: jwt,
      userId,
      userName,
      username: userName,
      roles: roleNames,
      user: userData
    };
    
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const loginWithKey = async (credentials) => {
  try {
    // Очищаем старый токен перед логином
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const res = await api.post("/api/auth/login/key", credentials);
    const { jwt, userId, userName, roles } = res.data;

    console.log("Auth Service (Key) - Full response:", res.data);

    // Проверяем, что токен валидный
    if (!jwt || typeof jwt !== "string") {
      console.error("Invalid JWT received:", jwt);
      throw new Error("Invalid or missing JWT token from server");
    }

    // Проверяем наличие userId
    if (!userId) {
      console.error("No userId received in response");
      throw new Error("User ID not received from server");
    }

    // Преобразуем роли в массив строк
    let roleNames = [];
    if (Array.isArray(roles)) {
      roleNames = roles.map(role => {
        if (typeof role === 'string') return role;
        if (role.roleName) return role.roleName;
        if (role.name) return role.name;
        if (role.authority) return role.authority;
        return String(role);
      });
    }

    // Сохраняем токен
    localStorage.setItem("token", jwt);
    
    // Сохраняем данные пользователя
    const userData = {
      id: userId,
      userId: userId,
      username: userName,
      name: userName,
      roles: roleNames
    };
    
    localStorage.setItem("user", JSON.stringify(userData));

    // Возвращаем структурированные данные для Redux
    return {
      jwt,
      token: jwt,
      userId,
      userName,
      username: userName,
      roles: roleNames,
      user: userData
    };
    
  } catch (error) {
    console.error("Login with key error:", error.response?.data || error.message);
    throw error;
  }
};

export const register = async (data) => {
  try {
    const res = await api.post("/api/auth/register", data);
    console.log("Register response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Register error:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  console.log("User logged out, localStorage cleared");
};

// Дополнительная функция для получения данных пользователя
export const getUserData = () => {
  try {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) return null;
    
    const user = JSON.parse(userStr);
    return {
      token,
      user,
      roles: user.roles || []
    };
  } catch (error) {
    console.error("Error getting user data from localStorage:", error);
    return null;
  }
};

// Функция для проверки авторизации
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!token && !!user;
};