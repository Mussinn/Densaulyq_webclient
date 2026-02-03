// src/utils/auth.js

// Сохраняем JWT токен и извлекаем имя пользователя для использования в приложении
export const saveAuth = (token) => {
  // Сохраняем токен в localStorage
  localStorage.setItem("token", token);

  // Декодируем JWT (получаем payload)
  const payload = JSON.parse(atob(token.split(".")[1]));

  // Сохраняем имя пользователя (или другую информацию) в localStorage
  localStorage.setItem("username", payload.sub || payload.username); // Зависит от твоего JWT
  localStorage.setItem("roles", JSON.stringify(payload.roles)); // Сохраняем роли
};

// Получаем текущий токен
export const getToken = () => {
  return localStorage.getItem("token");
};

// Получаем имя пользователя
export const getUsername = () => {
  return localStorage.getItem("username");
};

// Получаем роли пользователя
export const getRoles = () => {
  return JSON.parse(localStorage.getItem("roles"));
};

// Проверка, аутентифицирован ли пользователь
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Логаут - удаляем данные из localStorage
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("roles");
};

// Получаем токен из Authorization Header (если нужен для запросов)
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Декодируем JWT (payload)
export const decodeToken = (token) => {
  return JSON.parse(atob(token.split(".")[1]));
};

// Проверка, не истек ли срок действия токена
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  const decoded = decodeToken(token);
  const expiryDate = decoded.exp * 1000; // Преобразуем в миллисекунды
  return expiryDate < Date.now();
};
