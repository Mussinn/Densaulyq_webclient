import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux"; 
import { useEffect, useState, useCallback, useMemo } from "react";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AuditPage from "./pages/AuditPage";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import CreateDiagnosis from "./pages/CreateDiagnosis";
import KeyGenerationPage from "./pages/KeyGenerationPage";
import DecryptDiagnosisPage from "./pages/DecryptDiagnosisPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import VideoConferencePage from "./pages/VideoConferencePage";
import MedicalAIAssistantPage from "./pages/MedicalAIAssistantPage";
import DermAIApp from "./pages/DermAIApp";
import DoctorsPage from "./pages/DoctorsPage";
import callService from "./services/CallService";
import IncomingCallModal from "./components/IncomingCallModal";
import PersonalProfile from "./pages/PersonalProfile";
import OnlineBooking from "./pages/OnlineBooking";
import DoctorAppointments from "./pages/DoctorAppointments";
import MedicalTestsPage from "./pages/MedicalTestsPage";
import DoctorConsultations from "./pages/DoctorConsultations"; 
import Messenger from "./pages/DoctorMessenger";
import PatientMedicalHistory from "./pages/PatientMedicalHistory";

function App() {
  const { token: authToken, user } = useSelector((state) => state.token);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [incomingCall, setIncomingCall] = useState(null);

  // Получение токена (твоя оригинальная функция)
  const getAuthToken = useCallback(() => {
    console.log("🔄 Getting auth token...");
    
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      console.log("✅ Using token from Redux (string)");
      return authToken;
    }
    
    if (authToken && typeof authToken === 'object' && authToken.accessToken) {
      console.log("✅ Using token from Redux (object)");
      return authToken.accessToken;
    }
    
    if (user?.token) {
      console.log("✅ Using token from user object");
      return user.token;
    }
    
    const localStorageToken = localStorage.getItem('token');
    if (localStorageToken && localStorageToken.trim().length > 0) {
      console.log("✅ Using token from localStorage");
      return localStorageToken;
    }
    
    console.log("❌ No valid token found");
    return null;
  }, [authToken, user]);

  const currentToken = useMemo(() => getAuthToken(), [getAuthToken]);

  // Подключение WebSocket (единственный эффект + проверка)
  useEffect(() => {
    let isMounted = true;
    let connectionCheckInterval;

    const initializeWebSocket = async () => {
      const token = currentToken;
      const userId = user?.id || user?.userId;

      if (!userId || !token) {
        console.log("⏸️ Skipping WebSocket - missing user ID or token");
        if (isMounted) setWsStatus('disconnected');
        return;
      }

      // Уже подключены?
      if (callService.getConnectionStatus && callService.getConnectionStatus()) {
        console.log("🔗 WebSocket already connected");
        if (isMounted) setWsStatus('connected');
        return;
      }

      console.log("🔄 Initializing WebSocket connection...");
      console.log("User ID:", userId);
      console.log("User name:", user.username || user.userName);
      console.log("Token available:", !!token);

      if (isMounted) setWsStatus('connecting');

      try {
        console.log("🚀 Connecting to real WebSocket");
        await callService.connect(user, token);

        // Колбэки
        callService.onConnected(() => {
          console.log("✅ WebSocket connected successfully");
          if (isMounted) setWsStatus('connected');
        });

        callService.onDisconnected(() => {
          console.log("⚠️ WebSocket disconnected");
          if (isMounted) setWsStatus('disconnected');
        });

        callService.onError((error) => {
          console.error("❌ WebSocket error:", error);
          if (isMounted) setWsStatus('error');
        });

      } catch (error) {
        console.error("❌ WebSocket initialization error:", error);
        if (isMounted) setWsStatus('error');
      }
    };

    initializeWebSocket();

    // Проверка статуса каждые 5 секунд
    connectionCheckInterval = setInterval(() => {
      if (!isMounted) return;
      
      const isConnected = callService.getConnectionStatus ? 
        callService.getConnectionStatus() : false;
      
      if (isConnected && wsStatus !== 'connected') {
        setWsStatus('connected');
      } else if (!isConnected && wsStatus === 'connected') {
        setWsStatus('disconnected');
      }
    }, 5000);

    // Очистка
    return () => {
      console.log("App unmounting, cleaning up...");
      isMounted = false;
      clearInterval(connectionCheckInterval);
      
      if (callService.getConnectionStatus && callService.getConnectionStatus()) {
        console.log("Disconnecting WebSocket...");
        callService.disconnect();
      }
    };
  }, [user, currentToken]);

  // Глобальная подписка на входящие звонки (один раз при монтировании)
  useEffect(() => {
    // Подписка на событие входящего звонка
    const unsubscribe = callService.onIncomingCall((notification) => {
      console.log('📞 Глобально: входящий звонок получен:', notification);
      setIncomingCall(notification);
    });

    // Отписка при размонтировании
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // Пустой массив — запускается только при первом монтировании

  // Обработчики действий в модалке
  const handleAccept = () => {
    if (!incomingCall) return;
    callService.acceptCall(incomingCall.callId, user?.id || user?.userId);
    setIncomingCall(null);
    // Здесь можно открыть модалку Agora (если нужно)
  };

  const handleReject = () => {
    if (!incomingCall) return;
    callService.rejectCall(incomingCall.callId, 'Звонок отклонён');
    setIncomingCall(null);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route 
          path="/" 
          element={
            user?.id ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          } 
        />

        <Route element={<Layout />}>
                <Route path="/medical-history" element={<PrivateRoute><PatientMedicalHistory /></PrivateRoute>} />
        <Route path="/messenger" element={<PrivateRoute><Messenger /></PrivateRoute>} />
        <Route path="/doctor-consultations" element={<PrivateRoute><DoctorConsultations /></PrivateRoute>} />
        <Route path="/medical-tests" element={<PrivateRoute><MedicalTestsPage /></PrivateRoute>} />
          <Route path="/doctor-appointments" element={<PrivateRoute><DoctorAppointments /></PrivateRoute>} />
          <Route path="/booking" element={<PrivateRoute><OnlineBooking /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><PersonalProfile /></PrivateRoute>} />
          <Route path="/register" element={<PrivateRoute><Register /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/meet" element={<PrivateRoute><VideoConferencePage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ai" element={<PrivateRoute><MedicalAIAssistantPage /></PrivateRoute>} />
          <Route path="/derm-AI" element={<PrivateRoute><DermAIApp /></PrivateRoute>} />
          <Route path="/doctors" element={<PrivateRoute><DoctorsPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/audit/logs" element={<PrivateRoute><AuditPage /></PrivateRoute>} />
          <Route path="/diagnosis/create" element={<PrivateRoute><CreateDiagnosis /></PrivateRoute>} />
          <Route path="/diagnosis/key-generation" element={<PrivateRoute><KeyGenerationPage /></PrivateRoute>} />
          <Route path="/diagnosis/view" element={<PrivateRoute><DecryptDiagnosisPage /></PrivateRoute>} />
        </Route>
      </Routes>

      {/* Индикатор состояния WebSocket
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`
          flex items-center px-3 py-2 rounded-lg shadow-lg text-sm font-medium
          ${wsStatus === 'connected' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : wsStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : wsStatus === 'error'
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-gray-100 text-gray-800 border border-gray-300'
          }
        `}>
          {wsStatus === 'connected' && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              WebSocket: ✓ Подключен
            </>
          )}
          {wsStatus === 'connecting' && (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></div>
              WebSocket: Подключение...
            </>
          )}
          {wsStatus === 'disconnected' && (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
              WebSocket: Отключен
            </>
          )}
          {wsStatus === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
              WebSocket: Ошибка
            </>
          )}
        </div>
      </div> */}

      {/* Глобальная модалка входящего звонка — видна на любой странице */}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callerId={incomingCall.callerId}
          callId={incomingCall.callId}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </>
  );
}

export default App;

if (typeof global === 'undefined') {
  window.global = window;
} 