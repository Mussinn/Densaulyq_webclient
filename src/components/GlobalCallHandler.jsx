import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import callService from '../../services/CallService';

const GlobalCallHandler = () => {
  const { user, token } = useSelector((state) => state.token);
  
  useEffect(() => {
    if (user && token) {
      // Подключаемся к WebSocket
      callService.connect(user, token)
        .then(() => {
          console.log('✅ CallService connected');
        })
        .catch(error => {
          console.error('❌ CallService connection error:', error);
        });
      
      // Настраиваем обработчики
      callService.onIncomingCall((notification) => {
        console.log('📞 Incoming call notification:', notification);
        // Здесь будет логика показа уведомления
        alert(`Входящий звонок от ${notification.callerName}`);
      });
      
      callService.onCallAccepted((response) => {
        console.log('✅ Call accepted:', response);
        alert(`Звонок принят доктором ${response.doctorName}`);
      });
      
      callService.onCallRejected((response) => {
        console.log('❌ Call rejected:', response);
        alert(`Звонок отклонен: ${response.reason}`);
      });
      
      callService.onCallEnded((response) => {
        console.log('📞 Call ended:', response);
        alert('Звонок завершен');
      });
      
      callService.onConnected(() => {
        console.log('🔗 Connected to call server');
      });
      
      callService.onError((error) => {
        console.error('Call service error:', error);
      });
    }
    
    // Очистка при размонтировании
    return () => {
      callService.disconnect();
    };
  }, [user, token]);
  
  // Этот компонент не рендерит ничего видимого
  return null;
};

export default  GlobalCallHandler;