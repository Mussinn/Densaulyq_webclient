import React, { useEffect } from 'react';
import { Phone, X } from 'lucide-react';

const IncomingCallModal = ({ 
  callerName = 'Неизвестный', 
  callerId, 
  callId, 
  onAccept, 
  onReject, 
  onClose 
}) => {
  // Звук звонка (положи файл в public/sounds/incoming.mp3 или убери, если не нужно)
  useEffect(() => {
    const audio = new Audio('/sounds/incoming.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => console.log('Автозвук заблокирован браузером'));
    return () => audio.pause();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden">
        {/* Шапка */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Phone className="w-6 h-6" />
              Входящий звонок
            </h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Основное содержимое */}
        <div className="p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-6 text-5xl font-bold text-blue-600 shadow-inner">
            {callerName.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {callerName}
          </h2>

          <p className="text-gray-600 mb-8 text-lg">
            Хочет начать консультацию
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onReject}
              className="px-8 py-4 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-xl transition flex items-center justify-center gap-2 border border-red-200"
            >
              <X className="w-5 h-5" />
              Отклонить
            </button>

            <button
              onClick={onAccept}
              className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Принять
            </button>
          </div>
        </div>

        <div className="px-8 pb-6 text-center text-sm text-gray-500">
          Автоматически отклонится через 30 секунд
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;