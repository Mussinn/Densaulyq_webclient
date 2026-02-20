let ringtoneAudio = null;

// Проигрывать звук звонка
export const playRingtone = () => {
  stopRingtone();
  
  // Создаем аудио элемент
  ringtoneAudio = new Audio('/sounds/ringtone.mp3');
  ringtoneAudio.loop = true;
  ringtoneAudio.volume = 0.7;
  
  // Пытаемся воспроизвести
  const playPromise = ringtoneAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Не удалось воспроизвести звук звонка:', error);
    });
  }
};

// Остановить звук звонка
export const stopRingtone = () => {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    ringtoneAudio = null;
  }
};
///sounds/end-call.mp3
// Проигрывать звук завершения звонка
export const playEndCallSound = () => {
  const audio = new Audio('../sounds/end-call.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('End call sound error:', e));
};

// Виброотклик (для мобильных)
export const vibrate = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};