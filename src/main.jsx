import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';  // Импортируем Provider из react-redux
import './index.css';
import App from './App';
import { store } from './store/store';  // Импорт вашего Redux store

// Оборачиваем все приложение в Provider
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>  {/* Обертываем все приложение в Provider */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
