import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class CallService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.userId = null;
    this.userData = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.maxReconnectDelay = 30000;
    this.heartbeatInterval = null;
    this.missedPongs = 0;

    this.callbacks = {
      onConnected: [],
      onDisconnected: [],
      onIncomingCall: [],
      onCallAccepted: [],
      onCallRejected: [],
      onCallEnded: [],
      onWebRTCSignal: [],
      onError: []
    };
  }

  connect(userData, token) {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.client?.connected) {
        console.log('WebSocket уже активен — пропускаем');
        resolve();
        return;
      }

      this.userData = userData;
      this.userId = String(userData.id || userData.userId || userData.userID);

      if (!this.userId || !token) {
        const err = new Error('Нет userId или token');
        console.error(err);
        this.callbacks.onError.forEach(cb => cb(err));
        reject(err);
        return;
      }

      console.log('🔗 Подключение WS для пользователя:', this.userId);

      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws-call'),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': this.userId
        },
        debug: (str) => {
          if (str.includes('ERROR') || str.includes('WARN') || str.includes('Close') || str.includes('connect')) {
            console.log('STOMP debug:', str);
          }
        },
        reconnectDelay: 2000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectionTimeout: 10000
      });

      this.client.onConnect = (frame) => {
        console.log('✅ STOMP подключён для user:', this.userId);
        console.log('Session ID:', frame.headers['session'] || 'не указан');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 2000;
        this.missedPongs = 0;

        this.setupSubscriptions();
        this.sendConnectRequest();
        this.startHeartbeat();

        this.callbacks.onConnected.forEach(cb => cb());
        resolve();
      };

      this.client.onStompError = (frame) => {
        const msg = frame.headers?.message || 'STOMP error';
        console.error('❌ STOMP ошибка:', msg);
        this.isConnected = false;
        this.callbacks.onError.forEach(cb => cb(new Error(msg)));
      };

      this.client.onWebSocketError = (event) => {
        console.error('🌐 WS ошибка:', event);
        this.isConnected = false;
      };

      this.client.onWebSocketClose = (event) => {
        console.log('🔌 WS закрыт:', event.code, event.reason || 'без причины');
        this.isConnected = false;
        this.stopHeartbeat();
        this.callbacks.onDisconnected.forEach(cb => cb());

        if (event.code === 1000) {
          console.log('Нормальное отключение');
          return;
        }

        const delay = Math.min(this.reconnectDelay, this.maxReconnectDelay);
        console.log(`Переподключение через ${delay / 1000} сек (попытка ${this.reconnectAttempts + 1})`);

        setTimeout(() => {
          this.reconnectAttempts++;
          if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            this.client.activate();
          } else {
            console.error('Исчерпаны попытки переподключения');
          }
        }, delay);

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      };

      try {
        this.client.activate();
      } catch (err) {
        console.error('Ошибка активации:', err);
        reject(err);
      }
    });
  }

  sendConnectRequest() {
    if (!this.client?.connected) {
      setTimeout(() => this.sendConnectRequest(), 500);
      return;
    }

    const request = {
      userId: this.userId,
      sessionId: 'unknown',
      userRole: this.userData.roles?.[0] || 'PATIENT',
      userName: this.userData.username || this.userData.userName || 'User',
      timestamp: Date.now()
    };

    this.client.publish({
      destination: '/app/call.connect',
      body: JSON.stringify(request)
    });
    console.log('📤 Отправлен connect-запрос:', request);
  }

  setupSubscriptions() {
    if (!this.client?.connected) return;

    console.log(`[${this.userId}] Настраиваем подписки`);

    // Входящие звонки
    this.client.subscribe(`/user/${this.userId}/queue/call`, (msg) => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║ ДОКТОР ПОЛУЧИЛ ЗВОНОК! ║');
      console.log('║ User:', this.userId);
      console.log('║ Raw JSON:', msg.body);
      console.log('╚════════════════════════════════════════════╝');

      try {
        const data = JSON.parse(msg.body);
        console.log('Parsed данные звонка:', data);
        // alert(`Вам звонит ${data.callerName || 'кто-то'}!`); // тест — потом удали
        this.callbacks.onIncomingCall.forEach(cb => cb(data));
      } catch (e) {
        console.error('Ошибка парсинга звонка:', e);
      }
    });

    // Личный pong — критично для проверки живости
    this.client.subscribe(`/user/${this.userId}/queue/pong`, (msg) => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║ 🏓 ЛИЧНЫЙ PONG ПОЛУЧЕН! ║');
      console.log('║ User:', this.userId);
      console.log('║ Raw:', msg.body);
      console.log('╚════════════════════════════════════════════╝');

      try {
        const data = JSON.parse(msg.body);
        const delay = Date.now() - data.timestamp;
        console.log(`Задержка: ${delay} мс | сервер time: ${data.timestamp}`);

        this.missedPongs = 0;

        if (delay > 40000) {
          console.warn('Большая задержка pong — reconnect');
          this.client.deactivate();
          setTimeout(() => this.client.activate(), 1000);
        }
      } catch (err) {
        console.error('Pong parse error:', err, msg.body);
      }
    });

    // Ответы на звонки
    this.client.subscribe(`/user/${this.userId}/queue/call-response`, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        console.log('📞 Ответ на звонок:', data.status, data);
        switch (data.status?.toLowerCase()) {
          case 'accepted': this.callbacks.onCallAccepted.forEach(cb => cb(data)); break;
          case 'rejected': this.callbacks.onCallRejected.forEach(cb => cb(data)); break;
          case 'ended': this.callbacks.onCallEnded.forEach(cb => cb(data)); break;
        }
      } catch (err) {
        console.error('Ошибка ответа:', err);
      }
    });

    // WebRTC
    this.client.subscribe(`/user/${this.userId}/queue/webrtc`, (msg) => {
      try {
        const signal = JSON.parse(msg.body);
        console.log('📡 WebRTC:', signal.type);
        this.callbacks.onWebRTCSignal.forEach(cb => cb(signal));
      } catch (err) {
        console.error('WebRTC error:', err);
      }
    });

    console.log(`[${this.userId}] Подписки настроены (включая личный pong)`);
  }

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.client?.connected && this.userId) {
        const timestamp = Date.now();
        this.client.publish({
          destination: '/app/call.ping',
          body: JSON.stringify({ userId: this.userId, timestamp })
        });
        console.log(`💓 Личный Ping отправлен в ${timestamp}`);

        this.missedPongs++;
        if (this.missedPongs > 3) {
          console.warn('3 пропущенных pong подряд — reconnect');
          this.client.deactivate();
          setTimeout(() => this.client.activate(), 1000);
          this.missedPongs = 0;
        }
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  initiateCall(targetId, callerName, callerType = 'PATIENT') {
    if (!this.client?.connected) throw new Error('WS не подключён');

    const request = {
      callerId: this.userId,
      callerName: callerName || this.userData.username || 'User',
      targetId: String(targetId),
      callerType,
      timestamp: Date.now()
    };

    console.log('📤 Запрос на звонок (без callId):', request);

    this.client.publish({
      destination: '/app/call.initiate',
      body: JSON.stringify(request)
    });
  }

  disconnect() {
    console.log('🔌 Отключение CallService');
    this.stopHeartbeat();
    if (this.client) this.client.deactivate();
    this.client = null;
    this.isConnected = false;
    this.userId = null;
    this.userData = null;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000;
    this.missedPongs = 0;
  }

  getConnectionStatus() {
    return this.isConnected && this.client?.connected === true;
  }

  onConnected(cb) { this.callbacks.onConnected.push(cb); }
  onDisconnected(cb) { this.callbacks.onDisconnected.push(cb); }
  onIncomingCall(cb) { this.callbacks.onIncomingCall.push(cb); }
  onCallAccepted(cb) { this.callbacks.onCallAccepted.push(cb); }
  onCallRejected(cb) { this.callbacks.onCallRejected.push(cb); }
  onCallEnded(cb) { this.callbacks.onCallEnded.push(cb); }
  onWebRTCSignal(cb) { this.callbacks.onWebRTCSignal.push(cb); }
  onError(cb) { this.callbacks.onError.push(cb); }
}

const callServiceInstance = new CallService();
export default callServiceInstance;