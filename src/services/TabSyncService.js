class TabSyncService {
  constructor() {
    this.listeners = new Map();
    this.uuid = Math.random().toString(36).substr(2, 9);
  }
  
  // Отправить событие во все вкладки
  broadcast(eventType, data) {
    const eventData = {
      type: eventType,
      data,
      source: this.uuid,
      timestamp: Date.now()
    };
    
    // Сохраняем в localStorage (сработает во всех вкладках)
    localStorage.setItem(`medsafe-sync-${eventType}`, JSON.stringify(eventData));
    
    // Очищаем через 1 секунду
    setTimeout(() => {
      localStorage.removeItem(`medsafe-sync-${eventType}`);
    }, 1000);
  }
  
  // Слушать события из других вкладок
  listen(eventType, callback) {
    const handler = (e) => {
      if (e.key === `medsafe-sync-${eventType}` && e.newValue) {
        try {
          const eventData = JSON.parse(e.newValue);
          
          // Игнорируем события от себя
          if (eventData.source !== this.uuid) {
            callback(eventData.data, eventData);
          }
        } catch (error) {
          console.error('Error parsing sync data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handler);
    this.listeners.set(eventType, handler);
    
    return () => {
      window.removeEventListener('storage', handler);
      this.listeners.delete(eventType);
    };
  }
  
  // Отправить уведомление о звонке во все вкладки
  broadcastCallNotification(notification) {
    this.broadcast('incoming-call', notification);
  }
  
  // Отправить завершение звонка
  broadcastCallEnd(callId) {
    this.broadcast('call-end', { callId });
  }
}

// Singleton
export default new TabSyncService();