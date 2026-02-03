// components/CallButton.tsx
import { Phone, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import callService from '../services/CallService';
import CallModal from './CallModal';  // ← твой модал с Agora

const CallButton = ({
  targetUserId,
  targetName,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const { user } = useSelector((state) => state.token);
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [availability, setAvailability] = useState({ available: false, online: false });
  const [isChecking, setIsChecking] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { callId, channelName, targetName }

  // Проверяем статус WebSocket
  const checkWebSocketConnection = useCallback(() => {
    const connected = callService.getConnectionStatus ? callService.getConnectionStatus() : false;
    console.log('🔌 WebSocket connection status:', connected);
    setWsConnected(connected);
    return connected;
  }, []);

  // Проверяем доступность доктора
  const checkDoctorAvailability = useCallback(async () => {
    if (!targetUserId) {
      setAvailability({ available: false, online: false });
      return;
    }

    setIsChecking(true);

    try {
      if (callService.checkDoctorAvailability) {
        const result = await callService.checkDoctorAvailability(targetUserId);
        console.log('👨‍⚕️ Doctor availability check:', {
          doctorId: targetUserId,
          doctorName: targetName,
          result,
          timestamp: new Date().toISOString()
        });

        setAvailability({
          available: result.available !== false,
          online: result.online !== false,
          lastCheck: new Date().toISOString()
        });
      } else {
        console.warn('checkDoctorAvailability method not available');
        setAvailability({ available: true, online: true, fallback: true });
      }
    } catch (error) {
      console.warn('Availability check failed:', error);
      setAvailability({ available: false, online: false, error: error.message });
    } finally {
      setIsChecking(false);
    }
  }, [targetUserId, targetName]);

  // Инициализация проверок
  useEffect(() => {
    checkWebSocketConnection();
    checkDoctorAvailability();

    const wsInterval = setInterval(checkWebSocketConnection, 5000);
    const availabilityInterval = setInterval(checkDoctorAvailability, 10000);

    return () => {
      clearInterval(wsInterval);
      clearInterval(availabilityInterval);
    };
  }, [checkWebSocketConnection, checkDoctorAvailability]);

  // Обработчик звонка
  const handleCall = async () => {
    console.log('🔘 Call button clicked', { targetUserId, targetName });

    // Проверки
    if (!user || (!user.id && !user.userId)) {
      alert('❌ Пожалуйста, войдите в систему');
      return;
    }

    if (!targetUserId) {
      alert('❌ Не указан получатель звонка');
      return;
    }

    if (!availability.available) {
      alert(`⚠️ ${targetName || 'Доктор'} сейчас не доступен для звонков`);
      return;
    }

    if (!availability.online) {
      const proceed = confirm(
        `⚠️ ${targetName || 'Доктор'} в данный момент не в сети.\n` +
        `Звонок будет отправлен как офлайн уведомление.\n\n` +
        `Продолжить?`
      );
      if (!proceed) return;
    }

    if (!wsConnected) {
      const proceed = confirm(
        '⚠️ Ваше соединение с сервером не активно.\n' +
        'Звонок будет отправлен, но вы не получите ответ в реальном времени.\n\n' +
        'Продолжить тестовый звонок?'
      );
      if (!proceed) return;
    }

    setIsCalling(true);
    setStatus('Инициируем звонок...');

    try {
      const callerName = user.username ||
        user.userName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Пациент';

      console.log('📞 Calling with:', {
        callerName,
        targetUserId,
        callerId: user.id || user.userId
      });

      // Инициируем звонок через сервис
      const callId = callService.initiateCall(targetUserId, callerName, 'PATIENT');

      // Генерируем уникальный channelName для Agora (одинаковый для обоих)
      const minId = Math.min(Number(user.id || user.userId), targetUserId);
      const maxId = Math.max(Number(user.id || user.userId), targetUserId);
      const channelName = `call_${minId}_${maxId}`;

      // Открываем модальное окно с Agora
      setActiveCall({ callId, channelName, targetName });
      setStatus(`✅ Звонок инициирован! ID: ${callId}`);

      // Сбрасываем статус через 5 секунд (модалка остаётся открытой)
      setTimeout(() => setStatus(''), 5000);

    } catch (error) {
      console.error('❌ Call error:', error);

      let errorMessage = 'Не удалось установить соединение';
      let userMessage = '❌ Ошибка при инициации звонка';

      if (error.message?.includes('Not connected')) {
        errorMessage = 'Ваше WebSocket соединение не активно';
        userMessage = '❌ Нет соединения с сервером';
      } else if (error.message?.includes('Target ID')) {
        errorMessage = 'Не указан получатель звонка';
        userMessage = '❌ Ошибка: не указан получатель';
      }

      alert(`${userMessage}\n${error.message || error}`);
      setStatus(`Ошибка: ${errorMessage}`);
    } finally {
      setIsCalling(false);
    }
  };

  // Активна ли кнопка
  const isActive = user &&
    (user.id || user.userId) &&
    targetUserId &&
    availability.available &&
    !isCalling;

  // Стили кнопки
  const getButtonStyles = () => {
    const baseStyles = 'w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center relative transition-all duration-300';

    const sizeStyles = {
      sm: 'py-2 px-4 text-sm',
      md: 'py-3 px-6 text-base',
      lg: 'py-4 px-8 text-lg'
    };

    const variantStyles = {
      primary: isActive
        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
      secondary: isActive
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
      outline: isActive
        ? 'border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 hover:text-green-700'
        : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
    };

    return `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary}`;
  };

  const getTooltipText = () => {
    if (!user) return 'Войдите в систему';
    if (!targetUserId) return 'Не указан доктор';
    if (!availability.available) return 'Доктор не доступен';
    if (!availability.online) return 'Доктор не в сети';
    if (isCalling) return 'Звонок выполняется...';
    if (isChecking) return 'Проверка доступности...';
    return `Позвонить ${targetName || 'доктору'}`;
  };

  return (
    <div className="w-full">
      {/* Кнопка звонка */}
      <button
        onClick={handleCall}
        disabled={!isActive}
        className={`${getButtonStyles()} ${className}`}
        title={getTooltipText()}
      >
        {isCalling ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Звонок...
          </>
        ) : (
          <>
            <Phone className="w-5 h-5 mr-2" />
            Позвонить
          </>
        )}

        {isActive && availability.online && (
          <div className="absolute -top-1 -right-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
      </button>

      {/* Статус звонка */}
      {status && (
        <div className={`mt-2 text-sm text-center font-medium ${status.includes('Ошибка') ? 'text-red-600' : 'text-green-600'
          }`}>
          {status}
        </div>
      )}

      {/* Информационная панель — твоя оригинальная */}
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-600">Ваш ID:</div>
          <div className={`font-medium ${user?.id || user?.userId ? 'text-green-600' : 'text-red-600'}`}>
            {user?.id || user?.userId || 'не авторизован'}
          </div>

          <div className="text-gray-600">Доктор ID:</div>
          <div className="text-blue-600 font-medium">{targetUserId || '—'}</div>

          <div className="text-gray-600">Статус доктора:</div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${isChecking ? 'bg-yellow-500 animate-pulse' :
                availability.online ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            <span className={availability.online ? 'text-green-600' : 'text-red-600'}>
              {isChecking ? 'проверка...' : availability.online ? 'онлайн' : 'офлайн'}
            </span>
          </div>

          <div className="text-gray-600">Доступность:</div>
          <div className={`font-medium ${isChecking ? 'text-yellow-600' :
              availability.available ? 'text-green-600' : 'text-red-600'
            }`}>
            {isChecking ? 'проверка...' : availability.available ? 'доступен' : 'недоступен'}
          </div>

          <div className="text-gray-600">Ваш WebSocket:</div>
          <div className="flex items-center">
            {wsConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-600">подключен</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1 text-red-500" />
                <span className="text-red-600">отключен</span>
              </>
            )}
          </div>

          {availability.lastCheck && (
            <>
              <div className="text-gray-600">Последняя проверка:</div>
              <div className="text-gray-500 text-xs">
                {new Date(availability.lastCheck).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>

        {!wsConnected && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-yellow-600">
            <div className="flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                Ваше WebSocket соединение не активно. Доктор помечен как "онлайн" через HTTP авторизацию.
              </span>
            </div>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-blue-600">
            <div className="flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                Режим разработки: Используются mock данные для тестирования.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно звонка Agora */}
      {activeCall && (
        <CallModal
          channelName={activeCall.channelName}
          targetName={activeCall.targetName}
          onClose={() => setActiveCall(null)}
          isIncoming={false}  // исходящий
        />
      )}
    </div>
  );
};

export default CallButton;