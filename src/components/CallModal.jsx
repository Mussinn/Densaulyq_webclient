// components/CallModal.jsx
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = '753433eb1ae141cb93c4223272ad4bdd';

const CallModal = ({
  channelName,
  targetName,
  onClose,
  isIncoming = false  // true — входящий (доктор), false — исходящий (пациент)
}) => {
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(isIncoming ? 'Принимаем звонок...' : 'Звоним...');
  const [remoteActive, setRemoteActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = 0; // или можно передать реальный userId

  useEffect(() => {
    let agoraClient = null;
    let mounted = true;

    const startCall = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        setError(null);

        // Проверка channelName
        if (!channelName || typeof channelName !== 'string' || channelName.trim() === '') {
          throw new Error('channelName не передан или пустой');
        }

        setStatus('Получаем токен Agora...');

        const url = `/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}&expireSeconds=7200`;
        console.log('[CallModal] Полный URL запроса токена:', url);

        const tokenRes = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        console.log('[CallModal] Токен-запрос →', {
          status: tokenRes.status,
          statusText: tokenRes.statusText,
          url: tokenRes.url,
        });

        if (!tokenRes.ok) {
          let errorBody = '';
          try {
            errorBody = await tokenRes.text();
          } catch { }
          throw Object.assign(new Error(`HTTP ${tokenRes.status}`), {
            status: tokenRes.status,
            body: errorBody,
          });
        }

        const contentType = tokenRes.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await tokenRes.text();
          throw new Error(
            `Сервер вернул неожиданный тип ответа (${contentType})\n` +
            `Первые 300 символов: ${text.substring(0, 300)}...`
          );
        }

        const data = await tokenRes.json();
        const token = data.token;

        if (!token) {
          throw new Error('В ответе нет поля token');
        }

        console.log('[CallModal] Токен получен (первые 20 символов):', token.substring(0, 20));

        setStatus(isIncoming ? 'Подключаемся к входящему звонку...' : 'Подключаемся к каналу...');

        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(agoraClient);

        await agoraClient.join(APP_ID, channelName, token, uid);
        console.log('[CallModal] Успешно присоединились к каналу');

        // Публикуем свой микрофон сразу
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(micTrack);
        await agoraClient.publish(micTrack);

        // Начальный статус после join
        setStatus(isIncoming
          ? 'Звонок принят — ждём, когда собеседник подключит микрофон...'
          : 'Звонок отправлен — ждём ответа от собеседника...');
        setLoading(false);

        // Слушаем публикацию аудио от собеседника
        agoraClient.on('user-published', async (user, mediaType) => {
          if (mediaType === 'audio') {
            // Самое важное: игнорируем свой собственный publish
            if (user.uid === uid || user.uid === 0 || user.uid === null) {
              console.log(
                '[CallModal] Игнорируем собственный publish (мой uid:', uid,
                ', пришёл uid:', user.uid, ')'
              );
              return;
            }

            console.log(
              '[CallModal] Реальный собеседник опубликовал аудио! UID собеседника:', user.uid
            );

            await agoraClient.subscribe(user, mediaType);
            user.audioTrack?.play();
            setRemoteActive(true);
            setStatus(`Разговор с ${targetName} • Собеседник на линии`);
          }
        });

        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio') {
            setRemoteActive(false);
            setStatus(`Разговор с ${targetName} • Собеседник отключил микрофон`);
          }
        });

        // Логируем присоединение пользователей
        agoraClient.on('user-joined', (user) => {
          console.log('[CallModal] Пользователь присоединился к каналу → UID:', user.uid, 'Мой UID:', uid);
        });

        // Таймаут ожидания собеседника
        const timeoutId = setTimeout(() => {
          if (mounted && !remoteActive) {
            setStatus(isIncoming
              ? 'Собеседник ещё не подключился...'
              : 'Собеседник не принял звонок...');
          }
        }, 45000);

        return () => clearTimeout(timeoutId);

      } catch (err) {
        console.error('[CallModal] Критическая ошибка:', err);

        let title = 'Не удалось начать звонок';
        let message = err.message || 'Неизвестная ошибка';
        let details = '';
        let code = err.status || 0;

        if (err.status === 404) {
          title = 'Эндпоинт токена не найден';
          message = 'Сервер не нашёл /api/agora/token (404)';
          details = 'Проверьте, что контроллер AgoraTokenController зарегистрирован';
        } else if (err.status >= 500) {
          title = 'Ошибка на сервере';
          message = 'Сервер вернул 5xx — проблема с генерацией токена';
          details = err.body?.substring(0, 500) || err.message;
        } else if (message.includes('<!doctype') || message.includes('<html')) {
          title = 'Сервер вернул HTML вместо JSON';
          message = 'Вероятно 404 или редирект на логин';
          details = message.substring(0, 500);
        } else if (message.includes('join')) {
          title = 'Ошибка присоединения к каналу Agora';
          message = 'Не удалось join канал';
          details = err.message;
        } else if (message.includes('channelName')) {
          title = 'Неверный или отсутствующий канал';
          message = 'channelName не передан или пустой';
          details = 'Проверьте генерацию channelName в CallButton';
        }

        if (mounted) {
          setError({ title, message, details, code });
          setStatus('Ошибка');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    startCall();

    return () => {
      mounted = false;
      if (localAudioTrack) {
        localAudioTrack.close();
        localAudioTrack.stop();
      }
      if (agoraClient) {
        agoraClient.leave();
        agoraClient.removeAllListeners();
      }
    };
  }, [channelName, targetName, isIncoming]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!muted);
      setMuted(!muted);
    }
  };

  const endCall = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Кнопка закрытия */}
        <button
          onClick={endCall}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10 p-1 rounded-full hover:bg-gray-100"
        >
          <XCircle size={28} />
        </button>

        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Volume2 size={24} />
            {isIncoming ? 'Входящий звонок' : 'Звонок'} {targetName}
          </h3>
          <p className="mt-1 opacity-90">{status}</p>
        </div>

        {/* Блок ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-300 m-4 p-5 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-1 flex-shrink-0" size={28} />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-red-800 mb-2">{error.title}</h4>
                <p className="text-red-700 mb-3">{error.message}</p>
                {error.details && (
                  <div className="bg-red-100 p-3 rounded text-sm text-red-800 font-mono break-all whitespace-pre-wrap max-h-40 overflow-auto">
                    {error.details}
                  </div>
                )}
                {error.code && (
                  <p className="text-sm text-red-600 mt-2">
                    Код ошибки: {error.code}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Основной контент */}
        {!error && (
          <>
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-600">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p>Подготовка звонка...</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold transition-all duration-500 ${remoteActive ? 'bg-green-500 animate-pulse scale-110 shadow-lg' : 'bg-gray-400'
                    }`}
                >
                  {remoteActive ? 'Говорит' : '...'}
                </div>

                <p className="mt-6 text-lg font-medium text-gray-800">
                  {remoteActive ? 'Собеседник на линии' : 'Ожидание ответа...'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Кнопки управления */}
        <div className="p-6 bg-gray-50 flex justify-center gap-8 border-t">
          <button
            onClick={toggleMute}
            disabled={!!error || loading || !localAudioTrack}
            className={`p-6 rounded-full transition-all ${muted
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow`}
            title={muted ? 'Включить микрофон' : 'Отключить микрофон'}
          >
            {muted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={endCall}
            className="p-6 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
            title="Завершить звонок"
          >
            <PhoneOff size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;