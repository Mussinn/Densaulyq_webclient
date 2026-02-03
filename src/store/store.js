// store.js
import { configureStore } from '@reduxjs/toolkit';
import tokenReducer from './tokenSlice';  // Путь к редюсеру

export const store = configureStore({
  reducer: {
    token: tokenReducer,  // Подключение редюсера для token
  },
});
// НАДО ЭКСПОРТИРОВАТЬ КАК "store"!
// export { store };
// ИЛИ
export default store;