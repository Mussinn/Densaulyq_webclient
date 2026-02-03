import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, User, Clock, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

const ActiveCallWindow = ({ 
  isOpen, 
  call, 
  onEndCall,
  isMuted,
  onToggleMute 
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  
  // Таймер звонка
  useEffect(() => {
    let interval;
    
    if (isOpen && call) {
      const startTime = call.startTime || Date.now();
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, call]);
  
  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Переключение микрофона
  const handleToggleMute = () => {
    setIsLocalMuted(!isLocalMuted);
    onToggleMute?.();
  };
  
  // Переключение динамика
  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    const audio = document.getElementById('remote-audio');
    if (audio) {
      audio.volume = isSpeakerOn ? 0.3 : 1.0;
    }
  };
  
  if (!isOpen || !call) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 right-6 z-[9998]"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden w-80 border border-gray-700/50">
          {/* Заголовок звонка */}
          <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Разговор</p>
                <p className="text-sm text-gray-300 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {formatTime(callDuration)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onEndCall}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition"
              title="Завершить"
            >
              <PhoneOff size={18} />
            </button>
          </div>
          
          {/* Основная информация */}
          <div className="p-6">
            {/* Аватар собеседника */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                <User size={40} />
              </div>
              
              {/* Индикатор звука */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-green-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Ваш аватар (маленький) */}
              <div className="absolute bottom-0 right-6 w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center">
                <User size={20} />
                {isLocalMuted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <MicOff size={10} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Информация о собеседнике */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-1">{call.participantName}</h3>
              <p className="text-gray-300 text-sm mb-2">
                {call.doctorId === call.participantId ? 'Доктор' : 'Пациент'}
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                <Shield size={10} className="mr-1" />
                Защищенное соединение
              </div>
            </div>
            
            {/* Кнопки управления */}
            <div className="flex justify-center space-x-6 mb-4">
              <button
                onClick={handleToggleMute}
                className={`p-3 rounded-full transition ${
                  isLocalMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isLocalMuted ? 'Включить микрофон' : 'Выключить микрофон'}
              >
                {isLocalMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              <button
                onClick={handleToggleSpeaker}
                className={`p-3 rounded-full transition ${
                  isSpeakerOn 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isSpeakerOn ? 'Выключить динамик' : 'Включить динамик'}
              >
                <Volume2 size={20} />
              </button>
            </div>
            
            {/* Кнопка завершения */}
            <button
              onClick={onEndCall}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center justify-center"
            >
              <PhoneOff size={20} className="mr-2" />
              Завершить звонок
            </button>
          </div>
          
          {/* Индикатор качества */}
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full bg-gray-700 overflow-hidden"
                >
                  <div 
                    className="h-full bg-green-400 animate-pulse"
                    style={{
                      width: `${Math.min(100, 30 + Math.random() * 50)}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
              Качество связи: отличное
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActiveCallWindow;