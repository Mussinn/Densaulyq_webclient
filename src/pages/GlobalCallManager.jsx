import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import callService from '../../services/CallService';
import IncomingCallNotification from '../components/IncomingCallNotification';
import ActiveCallWindow from '../components/ActiveCallWindow';
import { playRingtone, stopRingtone } from '../../utils/soundUtils';

const GlobalCallManager = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [webRTCPeer, setWebRTCPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  
  const { user, token } = useSelector((state) => state.token);
  
  // Инициализация WebSocket соединения
  useEffect(() => {
    if (user && token) {
      initializeCallService();
    }
    
    return () => {
      cleanup();
    };
  }, [user, token]);
  
  const initializeCallService = () => {
    // Подключаемся к WebSocket
    callService.connect(user, token);
    
    // Настраиваем обработчики событий
    callService.onIncomingCall(handleIncomingCall);
    callService.onCallAccepted(handleCallAccepted);
    callService.onCallRejected(handleCallRejected);
    callService.onCallEnded(handleCallEnded);
    callService.onWebRTCSignal(handleWebRTCSignal);
    callService.onConnected(() => console.log('✅ Connected to call server'));
    callService.onDisconnected(() => console.log('❌ Disconnected from call server'));
    callService.onError((error) => console.error('Call service error:', error));
  };
  
  // Обработка входящего звонка
  const handleIncomingCall = useCallback((notification) => {
    console.log('📞 Incoming call:', notification);
    
    // Показываем уведомление во всех вкладках
    if (Notification.permission === 'granted') {
      new Notification('Входящий звонок', {
        body: `${notification.callerName} звонит вам`,
        icon: '/logo.png',
        tag: 'incoming-call'
      });
    }
    
    // Проигрываем звук звонка
    playRingtone();
    
    // Сохраняем информацию о звонке
    setIncomingCall(notification);
    
    // Автоматическое отклонение через 45 секунд
    setTimeout(() => {
      if (incomingCall?.callId === notification.callId) {
        handleRejectCall();
      }
    }, 45000);
  }, [incomingCall]);
  
  // Обработка принятого звонка
  const handleCallAccepted = useCallback(async (response) => {
    console.log('✅ Call accepted:', response);
    
    // Останавливаем звук звонка
    stopRingtone();
    
    // Скрываем входящее уведомление
    setIncomingCall(null);
    
    // Начинаем активный звонок
    setActiveCall({
      ...response,
      participantId: response.doctorId === user.id.toString() ? response.patientId : response.doctorId,
      participantName: response.doctorId === user.id.toString() ? response.patientName : response.doctorName,
      startTime: Date.now()
    });
    
    // Инициализируем WebRTC соединение
    await initializeWebRTC(response.callId, response.doctorId === user.id.toString() ? response.patientId : response.doctorId);
    
  }, [user]);
  
  // Обработка отклоненного звонка
  const handleCallRejected = useCallback((response) => {
    console.log('❌ Call rejected:', response);
    
    stopRingtone();
    setIncomingCall(null);
    
    // Показываем уведомление об отклонении
    if (activeCall?.callId === response.callId) {
      alert(`Звонок отклонен: ${response.reason || 'Причина не указана'}`);
      setActiveCall(null);
    }
  }, [activeCall]);
  
  // Обработка завершенного звонка
  const handleCallEnded = useCallback((response) => {
    console.log('📞 Call ended:', response);
    
    stopRingtone();
    setIncomingCall(null);
    setActiveCall(null);
    
    if (webRTCPeer) {
      webRTCPeer.destroy();
      setWebRTCPeer(null);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [webRTCPeer, localStream]);
  
  // Обработка WebRTC сигналов
  const handleWebRTCSignal = useCallback((signal) => {
    if (webRTCPeer) {
      webRTCPeer.signal(signal.data);
    }
  }, [webRTCPeer]);
  
  // Инициализация WebRTC
  const initializeWebRTC = async (callId, targetUserId) => {
    try {
      // Получаем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      setLocalStream(stream);
      
      // Инициализируем SimplePeer
      const Peer = (await import('simple-peer')).default;
      const isInitiator = user.roles.includes('PATIENT');
      
      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: stream
      });
      
      setWebRTCPeer(peer);
      
      // Обработка сигналов
      peer.on('signal', (data) => {
        callService.sendSignal(targetUserId, { callId, ...data }, data.type || 'signal');
      });
      
      peer.on('stream', (remoteStream) => {
        // Воспроизводим удаленный звук
        const audio = document.getElementById('remote-audio');
        if (audio) {
          audio.srcObject = remoteStream;
          audio.play().catch(e => console.log('Audio play error:', e));
        }
      });
      
      peer.on('connect', () => {
        console.log('🔗 WebRTC connected');
      });
      
      peer.on('close', () => {
        console.log('🔌 WebRTC closed');
        handleCallEnded({ callId, status: 'ended' });
      });
      
      peer.on('error', (err) => {
        console.error('WebRTC error:', err);
        handleCallEnded({ callId, status: 'error' });
      });
      
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      alert('Ошибка доступа к микрофону. Проверьте разрешения.');
    }
  };
  
  // Принять входящий звонок
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    
    callService.acceptCall(incomingCall.callId, incomingCall.callerId);
  };
  
  // Отклонить входящий звонок
  const handleRejectCall = () => {
    if (!incomingCall) return;
    
    callService.rejectCall(incomingCall.callId, 'Звонок отклонен');
    setIncomingCall(null);
    stopRingtone();
  };
  
  // Завершить активный звонок
  const handleEndCall = () => {
    if (activeCall) {
      const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
      callService.endCall(activeCall.callId, duration);
    }
  };
  
  // Очистка
  const cleanup = () => {
    stopRingtone();
    callService.disconnect();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (webRTCPeer) {
      webRTCPeer.destroy();
    }
  };
  
  // Запрос разрешения на уведомления
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'medsafe-call-notification') {
        const notification = JSON.parse(e.newValue);
        if (notification && notification.type === 'incoming-call') {
          handleIncomingCall(notification.data);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleIncomingCall]);
  
  return (
    <>
      {/* Уведомление о входящем звонке */}
      <IncomingCallNotification
        isOpen={!!incomingCall}
        callerName={incomingCall?.callerName}
        callerType={incomingCall?.callerType}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      
      {/* Окно активного звонка */}
      <ActiveCallWindow
        isOpen={!!activeCall}
        call={activeCall}
        onEndCall={handleEndCall}
        isMuted={false}
        onToggleMute={() => {/* реализация */}}
      />
      
      {/* Скрытый аудио элемент для удаленного звука */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />
    </>
  );
};

export default GlobalCallManager;