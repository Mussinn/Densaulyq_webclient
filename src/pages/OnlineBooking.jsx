import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const OnlineBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]); // Все записи
  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { token } = useSelector((state) => state.token);

  // Конфигурация рабочих часов
  const WORK_HOURS = {
    start: 9, end: 18, slotDuration: 30
  };

  // 1. ЗАГРУЗКА ДОКТОРОВ И ПОЛЬЗОВАТЕЛЯ
  const fetchData = async () => {
    try {
      if (!token) throw new Error('Токен табылмады');

      setLoading(true);
      
      // Загружаем докторов
      const doctorsResponse = await api.get('/api/v1/doctor', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      
      if (doctorsResponse.data && Array.isArray(doctorsResponse.data)) {
        setDoctors(doctorsResponse.data);
      }
      
      // Загружаем текущего пользователя
      const userResponse = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      
      setCurrentUser(userResponse.data);
      
    } catch (err) {
      setError('Деректерді жүктеу кезінде қате: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // 2. ЗАГРУЗКА ВСЕХ APPOINTMENTS ДЛЯ ФИЛЬТРАЦИИ
  const fetchAllAppointments = async () => {
    try {
      if (!token) return;

      setLoadingAppointments(true);
      
      const response = await api.get('/api/appointments', {
        headers: { 
          Authorization: `Bearer ${token.trim()}`
        },
      });
      
      if (response.data && Array.isArray(response.data)) {
        setAllAppointments(response.data);
        console.log(`Загружено записей: ${response.data.length}`);
      }
      
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
      // Если endpoint не работает, используем пустой массив
      setAllAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // 3. СОЗДАНИЕ ПРИЕМА
  const createAppointment = async (doctorId, date, time) => {
    try {
      if (!token) throw new Error('Токен табылмады');
      if (!selectedDoctor) throw new Error('Дәрігер таңдалмады');
      if (!currentUser?.userId) throw new Error('Пайдаланушы мәліметтері жүктелмеді');

      setLoading(true);
      setError('');
      setSuccess('');
      
      // Создаем дату приема
    const appointmentDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Добавляем 5 часов (если вы в часовом поясе UTC+5)
    const correctedHours = hours + 5;
    
    appointmentDateTime.setHours(correctedHours, minutes, 0, 0);
    
    const payload = {
      doctorId: selectedDoctor.doctorId,
      patientId: patientResponse.data.patientId,
      appointmentDate: appointmentDateTime.toISOString(),
      status: "scheduled"
    };
      
      console.log('📤 Отправляемый payload:', payload);
      
      const response = await api.post('/api/appointments', payload, {
        headers: { 
          Authorization: `Bearer ${token.trim()}`
        },
      });
      
      console.log('✅ Успешный ответ:', response.data);
      
      setSuccess(`✅ Қабылдау сәтті жазылды! 
        Дәрігер: ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}
        Күні: ${selectedDate.toLocaleDateString('kk-KZ')}
        Уақыты: ${time}`);
      
      // Обновляем список записей
      await fetchAllAppointments();
      
      // Сбрасываем выбор
      setSelectedDoctor(null);
      setSelectedDate(new Date());
      setAvailableSlots([]);
      
    } catch (err) {
      console.error('❌ Ошибка создания:', err);
      console.error('📄 Ответ сервера:', err.response?.data);
      
      let errorMessage = '';
      
      if (err.response?.status === 400) {
        errorMessage = '400 қате (Bad Request). Деректерді тексеріңіз.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Дәрігер немесе науқас табылмады';
      } else if (err.response?.status === 500) {
        errorMessage = 'Серверде қате. Кейінірек қайталаңыз.';
      } else {
        errorMessage = `Қабылдау жазу кезінде қате: ${err.message || 'Белгісіз қате'}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 4. ГЕНЕРАЦИЯ СЛОТОВ С ФИЛЬТРАЦИЕЙ ЗАНЯТЫХ ВРЕМЕН
  const generateTimeSlots = () => {
    if (!selectedDoctor || !selectedDate) return [];
    
    const slots = [];
    const startDate = new Date(selectedDate);
    startDate.setHours(WORK_HOURS.start, 0, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(WORK_HOURS.end, 0, 0, 0);
    
    const now = new Date();
    const minTime = new Date(now.getTime() + 60 * 60000); // Минимум через 1 час
    
    // Получаем занятые слоты для выбранного доктора на выбранную дату
    const busySlots = allAppointments
      .filter(app => {
        // Проверяем, что запись относится к выбранному доктору
        if (!app.doctor || app.doctor.doctorId !== selectedDoctor.doctorId) {
          return false;
        }
        
        // Проверяем дату
        const appDate = new Date(app.appointmentDate);
        const isSameDay = appDate.getDate() === selectedDate.getDate() &&
                         appDate.getMonth() === selectedDate.getMonth() &&
                         appDate.getFullYear() === selectedDate.getFullYear();
        
        // Проверяем статус (только активные записи считаются занятыми)
        const isActiveStatus = app.status === 'scheduled' || 
                               app.status === 'SCHEDULED' || 
                               app.status === 'confirmed' ||
                               app.status === 'CONFIRMED';
        
        return isSameDay && isActiveStatus;
      })
      .map(app => {
        const appDate = new Date(app.appointmentDate);
        // Форматируем время как "HH:MM"
        return `${appDate.getHours().toString().padStart(2, '0')}:${appDate.getMinutes().toString().padStart(2, '0')}`;
      });
    
    console.log(`Занятые слоты для доктора ${selectedDoctor.doctorId}:`, busySlots);
    
    // Генерируем слоты
    let currentTime = new Date(startDate);
    while (currentTime < endDate) {
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const slotDateTime = new Date(currentTime);
      
      const isPast = slotDateTime < minTime;
      const isBusy = busySlots.includes(timeString);
      const isAvailable = !isPast && !isBusy;
      
      slots.push({
        time: timeString,
        dateTime: slotDateTime,
        isAvailable,
        isBusy,
        isPast
      });
      
      currentTime.setMinutes(currentTime.getMinutes() + WORK_HOURS.slotDuration);
    }
    
    setAvailableSlots(slots);
    console.log(`Сгенерировано слотов: ${slots.length}, доступно: ${slots.filter(s => s.isAvailable).length}`);
    return slots;
  };

  // Обработчики
  const handleDoctorSelect = async (doctorId) => {
    const doctor = doctors.find(d => d.doctorId === Number(doctorId));
    setSelectedDoctor(doctor);
    setSelectedDate(new Date());
    
    // Загружаем записи если еще не загружены
    if (allAppointments.length === 0) {
      await fetchAllAppointments();
    }
    
    generateTimeSlots();
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    generateTimeSlots();
  };

  const handleTimeSelect = (slot) => {
    if (!slot.isAvailable) return;
    
    const confirmMessage = 
      `Қабылдауға жазылу:\n` +
      `Дәрігер: ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}\n` +
      `Күні: ${selectedDate.toLocaleDateString('kk-KZ')}\n` +
      `Уақыты: ${slot.time}\n` +
      `Күйі: scheduled (күтілуде)\n\n` +
      `Растаңыз ба?`;
    
    if (window.confirm(confirmMessage)) {
      createAppointment(selectedDoctor.doctorId, selectedDate, slot.time);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      await fetchData();
      await fetchAllAppointments(); // Загружаем записи заранее
    };
    
    loadData();
  }, []);

  // Обновление слотов при изменении
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDoctor, selectedDate, allAppointments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Онлайн қабылдауға жазылу
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8 text-center max-w-4xl mx-auto">
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-8 text-center max-w-4xl mx-auto">
            <div className="whitespace-pre-line">{success}</div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Информация о текущем пользователе */}
          {currentUser && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">
                    👤 Сіз: {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Пайдаланушы ID: {currentUser.userId}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {loadingAppointments ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Жазбалар жүктелуде...
                    </span>
                  ) : (
                    <span>Барлық жазбалар: {allAppointments.length}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Выбор доктора */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-blue-600 mb-6">
              1. Дәрігерді таңдау
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Дәрігерлер жүктелуде...</p>
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Қолжетімді дәрігерлер жоқ</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.doctorId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDoctor?.doctorId === doctor.doctorId
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onClick={() => handleDoctorSelect(doctor.doctorId)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {doctor.user.firstName?.charAt(0)}{doctor.user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {doctor.user.firstName} {doctor.user.lastName}
                        </p>
                        <p className="text-gray-600 text-sm">{doctor.specialty}</p>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            doctor.user.online ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <p className="text-xs text-gray-500">
                            {doctor.user.online ? '🟢 Онлайн' : '⚫ Оффлайн'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Выбор даты и времени */}
          {selectedDoctor && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-2xl font-semibold text-blue-600 mb-6">
                2. Күн мен уақытты таңдау
              </h2>
              
              {/* Информация о докторе */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                    </p>
                    <p className="text-gray-600">{selectedDoctor.specialty}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Дәрігер ID: {selectedDoctor.doctorId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      selectedDoctor.user.online 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDoctor.user.online ? '🟢 Онлайн' : '⚫ Оффлайн'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Барлық жазбалар: {allAppointments.filter(a => a.doctor?.doctorId === selectedDoctor.doctorId).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Выбор даты */}
              <div className="mb-8">
                <label className="block text-gray-800 font-semibold mb-3">
                  Күн таңдау
                </label>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isToday = i === 0;
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={i}
                        className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isToday
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        onClick={() => handleDateSelect(date)}
                      >
                        <div className="text-center">
                          <div className="text-xs font-medium">
                            {date.toLocaleDateString('kk-KZ', { weekday: 'short' })}
                          </div>
                          <div className="text-lg font-bold mt-1">
                            {date.getDate()}
                          </div>
                          <div className="text-xs mt-1">
                            {date.toLocaleDateString('kk-KZ', { month: 'short' })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Доступные временные слоты */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-gray-800 font-semibold">
                    Қолжетімді уақыттар
                  </label>
                  {loadingAppointments && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Жазбалар тексерілуде...
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {selectedDate.toLocaleDateString('kk-KZ', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Уақыттар есептелуде...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            slot.isAvailable
                              ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 text-green-800 hover:shadow-md'
                              : slot.isBusy
                              ? 'border-red-200 bg-red-50 text-red-600 cursor-not-allowed'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => slot.isAvailable && handleTimeSelect(slot)}
                          disabled={!slot.isAvailable || loading}
                          title={slot.isBusy ? 'Бос емес' : slot.isPast ? 'Өткен уақыт' : 'Таңдау'}
                        >
                          <div className="font-medium">{slot.time}</div>
                          {slot.isBusy && (
                            <div className="text-xs text-red-500 mt-1">Бос емес</div>
                          )}
                          {slot.isPast && !slot.isBusy && (
                            <div className="text-xs text-gray-500 mt-1">Өткен</div>
                          )}
                          {slot.isAvailable && loading && (
                            <div className="text-xs text-blue-500 mt-1">...</div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Статистика */}
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        Барлық уақыттар: {availableSlots.length} | 
                        Қолжетімді: {availableSlots.filter(s => s.isAvailable).length} | 
                        Бос емес: {availableSlots.filter(s => s.isBusy).length} |
                        Өткен: {availableSlots.filter(s => s.isPast && !s.isBusy).length}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Легенда */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-300 rounded mr-2"></div>
                    <span>Қолжетімді</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-300 rounded mr-2"></div>
                    <span>Бос емес (жазба бар)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                    <span>Өткен уақыт</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OnlineBooking;