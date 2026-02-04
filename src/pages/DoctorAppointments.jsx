import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { 
  FaVideo, 
  FaCopy, 
  FaEnvelope, 
  FaCalendar, 
  FaSpinner, 
  FaCheck, 
  FaUserMd, 
  FaUserInjured, 
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaPlay,
  FaStop,
  FaShare,
  FaLink,
  FaPaperPlane,
  FaExclamationTriangle
} from "react-icons/fa";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  
  const { token } = useSelector((state) => state.token);

  // Загрузка данных
  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = userRes.data;
      const doctorId = user?.doctor?.doctorId || user?.userId;

      if (doctorId) {
        const appointmentsRes = await api.get(`/api/appointments/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalizedAppointments = appointmentsRes.data?.map(app => ({
          ...app,
          id: app.appointment_id || app.appointmentId || app.id,
          patientName: `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`,
          patientEmail: app.patient?.email || app.patient?.user?.email,
          patientId: app.patient?.patientId || app.patient?.id
        })) || [];

        setAppointments(normalizedAppointments);
        await fetchMeetings(doctorId);
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка встреч
  const fetchMeetings = async (doctorId) => {
    try {
      setMeetingsLoading(true);
      const response = await api.get(`/api/v1/meetings/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMeetings(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки встреч:', err);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Обновление статуса записи
  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/appointments/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments(prev => prev.map(app =>
        app.id === id ? { ...app, status } : app
      ));

      alert(`Статус изменен на: ${status}`);
    } catch (err) {
      alert('Ошибка обновления статуса: ' + (err.response?.data?.message || err.message));
    }
  };

  // Открытие модалки для создания встречи
  const openMeetingModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setInviteEmail(appointment.patientEmail || '');
    setShowMeetingModal(true);
    setMeetingData(null);
  };

  // Отправка приглашения через POST /api/v1/meetings
  const sendInvite = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanedEmail = inviteEmail?.trim() || '';
    
    if (!cleanedEmail) {
      alert('Введите email пациента');
      return;
    }
    
    if (!emailRegex.test(cleanedEmail)) {
      alert('Введите корректный email адрес (например: patient@example.com)');
      return;
    }

    setSendingInvite(true);
    try {
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = userRes.data;
      const doctorId = user?.doctor?.doctorId || user?.userId;

      if (!doctorId) {
        throw new Error('Не удалось получить ID доктора');
      }

      if (!selectedAppointment?.patientId) {
        throw new Error('У пациента отсутствует ID');
      }

      const response = await api.post('/api/v1/meetings', {
        appointmentId: Number(selectedAppointment?.id) || 0,
        doctorId: Number(doctorId) || 0,
        patientId: Number(selectedAppointment?.patientId) || 0,
        topic: `Консультация с ${selectedAppointment?.patientName}`,
        description: 'Консультация врача',
        scheduledTime: new Date().toISOString(),
        durationMinutes: 30,
        patientEmail: cleanedEmail,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const meeting = response.data;
      
      setMeetingData({
        meetingUrl: meeting.meetingUrl,
        roomId: meeting.roomId,
        message: 'Встреча создана и приглашение отправлено',
        id: meeting.id
      });

      await fetchMeetings(doctorId);

    } catch (err) {
      console.error('Ошибка создания встречи:', err);
      
      let errorMessage = 'Ошибка создания встречи';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 500) {
        errorMessage = 'Внутренняя ошибка сервера';
      }
      
      alert(errorMessage);
      
      try {
        const userRes = await api.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const user = userRes.data;
        const doctorId = user?.doctor?.doctorId || user?.userId;
        
        const simpleResponse = await api.get(`/api/v1/meetings/create-simple`, {
          params: {
            topic: `Консультация-${selectedAppointment?.patientName}`,
            doctorId: Number(doctorId),
            patientId: Number(selectedAppointment?.patientId),
            patientEmail: cleanedEmail
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const meetingInfo = simpleResponse.data;
        setMeetingData({
          meetingUrl: meetingInfo.meetingUrl,
          roomId: meetingInfo.roomId,
          message: 'Встреча создана (резервный режим)'
        });
        
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        setMeetingData({
          meetingUrl: '',
          roomId: '',
          message: 'Не удалось создать встречу'
        });
      }
    } finally {
      setSendingInvite(false);
    }
  };

  // Копирование ссылки
  const copyLink = () => {
    if (meetingData?.meetingUrl) {
      navigator.clipboard.writeText(meetingData.meetingUrl);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  // Обновление статуса встречи
  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await api.patch(`/api/v1/meetings/${meetingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMeetings(prev => prev.map(meeting =>
        meeting.id === meetingId ? { ...meeting, status } : meeting
      ));

      alert(`Статус встречи изменен: ${status}`);
    } catch (err) {
      alert('Ошибка обновления статуса встречи');
    }
  };

  // Фильтрация записей
  const filteredApps = appointments.filter(app => {
    if (filter === 'active') return app.status === 'scheduled' || app.status === 'confirmed';
    if (filter === 'completed') return app.status === 'completed';
    if (filter === 'cancelled') return app.status === 'cancelled';
    return true;
  });

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Форматирование даты
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('kk-KZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Перевод статуса записи
  const getAppointmentStatusText = (status) => {
    switch(status) {
      case 'scheduled': return 'Запланирована';
      case 'confirmed': return 'Подтверждена';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      default: return status;
    }
  };

  // Цвет статуса записи
  const getAppointmentStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Перевод статуса встречи
  const getMeetingStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Запланирована';
      case 'ACTIVE': return 'Активна';
      case 'COMPLETED': return 'Завершена';
      case 'CANCELLED': return 'Отменена';
      default: return status;
    }
  };

  // Цвет статуса встречи
  const getMeetingStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Заголовок и фильтры */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Записи на прием</h1>
            <p className="text-gray-600">Управление приемами пациентами</p>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 md:mt-0 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Загрузка...
              </>
            ) : (
              <>
                <FaCalendar className="mr-2" /> Обновить список
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCalendar className="mr-2" /> Все записи
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'active' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCheckCircle className="mr-2" /> Активные
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'completed' ? 'bg-gray-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCheck className="mr-2" /> Завершенные
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'cancelled' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaTimes className="mr-2" /> Отмененные
            </button>
          </div>
        </div>
      </div>

      {/* Основной контент в двух колонках */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка: Записи на прием - ФИКСИРОВАННАЯ ВЫСОТА С ПРОКРУТКОЙ */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col" style={{ height: '700px' }}>
          <div className="p-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2.5 bg-blue-50 rounded-xl mr-3">
                  <FaUserMd className="text-xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Записи пациентов</h2>
                  <p className="text-sm text-gray-500">Запланированные приемы</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {filteredApps.length} записей
              </span>
            </div>
          </div>

          <div className="p-4 flex-grow overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center">
                <FaSpinner className="animate-spin mx-auto text-3xl text-blue-600 mb-4" />
                <p className="text-gray-600">Загрузка записей...</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-400 mb-3">
                  <FaCalendar className="text-4xl mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Нет записей</h3>
                <p className="text-gray-500">Выберите другой фильтр или проверьте позже</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-all duration-200 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start mb-3">
                          <div className="p-2 bg-white rounded-lg mr-3 border border-gray-200">
                            <FaUserInjured className="text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{app.patientName}</h3>
                            {app.patientEmail && (
                              <p className="text-gray-600 text-sm flex items-center">
                                <FaEnvelope className="mr-1.5 text-gray-400" size={12} /> {app.patientEmail}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-3">
                          <FaClock className="mr-1.5 text-gray-400" />
                          <span className="font-medium">{formatDateTime(app.appointmentDate)}</span>
                        </div>
                        
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center ${getAppointmentStatusColor(app.status)}`}>
                          {app.status === 'confirmed' && <FaCheckCircle className="mr-1.5" size={12} />}
                          {app.status === 'cancelled' && <FaTimes className="mr-1.5" size={12} />}
                          {getAppointmentStatusText(app.status)}
                        </span>
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:ml-4">
                        <div className="flex flex-col space-y-2">
                          {app.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => updateStatus(app.id, 'confirmed')}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                              >
                                <FaCheck className="mr-2" /> Подтвердить
                              </button>
                              <button
                                onClick={() => updateStatus(app.id, 'cancelled')}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center text-sm font-medium"
                              >
                                <FaTimes className="mr-2" /> Отменить
                              </button>
                            </>
                          )}
                          {app.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => updateStatus(app.id, 'completed')}
                                className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium"
                              >
                                <FaCheckCircle className="mr-2" /> Завершить прием
                              </button>
                              <button
                                onClick={() => openMeetingModal(app)}
                                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center text-sm font-medium shadow-md"
                              >
                                <FaVideo className="mr-2" /> Создать видеовстречу
                              </button>
                            </>
                          )}
                          {app.status === 'completed' && (
                            <div className="text-center p-2 text-gray-500 text-sm">
                              Прием завершен
                            </div>
                          )}
                          {app.status === 'cancelled' && (
                            <div className="text-center p-2 text-red-500 text-sm">
                              Прием отменен
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: Видеовстречи - ФИКСИРОВАННАЯ ВЫСОТА С ПРОКРУТКОЙ */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col" style={{ height: '700px' }}>
          <div className="p-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2.5 bg-purple-50 rounded-xl mr-3">
                  <FaVideo className="text-xl text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Видеовстречи</h2>
                  <p className="text-sm text-gray-500">Созданные консультации</p>
                </div>
              </div>
              {meetingsLoading && (
                <FaSpinner className="animate-spin text-blue-600" />
              )}
            </div>
          </div>

          <div className="p-4 flex-grow overflow-y-auto">
            {meetingsLoading ? (
              <div className="py-12 text-center">
                <FaSpinner className="animate-spin mx-auto text-3xl text-purple-600 mb-4" />
                <p className="text-gray-600">Загрузка встреч...</p>
              </div>
            ) : meetings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-400 mb-3">
                  <FaVideo className="text-4xl mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Нет встреч</h3>
                <p className="text-gray-500">Создайте первую видеовстречу для пациента</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map(meeting => (
                  <div key={meeting.id} className="bg-gray-50 rounded-xl p-4 hover:bg-purple-50 transition-all duration-200 border border-gray-100">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{meeting.topic || 'Консультация'}</h3>
                      {meeting.patientEmail && (
                        <p className="text-gray-600 text-sm flex items-center">
                          <FaEnvelope className="mr-1.5 text-gray-400" size={12} /> {meeting.patientEmail}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between mb-3">
                      <div className="flex items-center text-gray-600 text-sm mb-2 md:mb-0">
                        <FaClock className="mr-1.5 text-gray-400" />
                        <span>{formatDateTime(meeting.scheduledTime || meeting.createdAt)}</span>
                      </div>
                      
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getMeetingStatusColor(meeting.status)}`}>
                        {getMeetingStatusText(meeting.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {meeting.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => updateMeetingStatus(meeting.id, 'ACTIVE')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center text-sm font-medium"
                          >
                            <FaPlay className="mr-2" /> Начать встречу
                          </button>
                          {meeting.meetingUrl && (
                            <button
                              onClick={() => window.open(meeting.meetingUrl, '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center text-sm font-medium"
                            >
                              <FaVideo className="mr-2" /> Присоединиться
                            </button>
                          )}
                        </>
                      )}
                      {meeting.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => updateMeetingStatus(meeting.id, 'COMPLETED')}
                            className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center text-sm font-medium"
                          >
                            <FaStop className="mr-2" /> Завершить
                          </button>
                          {meeting.meetingUrl && (
                            <>
                              <button
                                onClick={() => window.open(meeting.meetingUrl, '_blank')}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center text-sm font-medium"
                              >
                                <FaVideo className="mr-2" /> Присоединиться
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(meeting.meetingUrl)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center text-sm font-medium"
                                title="Копировать ссылку"
                              >
                                <FaShare className="mr-2" /> Поделиться
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {meeting.status === 'COMPLETED' && meeting.meetingUrl && (
                        <button
                          onClick={() => window.open(meeting.meetingUrl, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center text-sm font-medium"
                        >
                          <FaVideo className="mr-2" /> Открыть запись
                        </button>
                      )}
                      {meeting.status === 'CANCELLED' && (
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
                          Встреча отменена
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка создания встречи */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mr-3">
                    <FaVideo className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {sendingInvite ? 'Создание встречи...' : meetingData?.meetingUrl ? 'Встреча создана!' : 'Новая видеовстреча'}
                    </h2>
                    <p className="text-sm text-gray-500">Отправьте приглашение пациенту</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMeetingModal(false);
                    setMeetingData(null);
                    setInviteEmail('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={sendingInvite}
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Информация о пациенте */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-white rounded-lg mr-3 border border-blue-200">
                    <FaUserInjured className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{selectedAppointment?.patientName}</h3>
                    <p className="text-gray-600 text-sm">Пациент</p>
                  </div>
                </div>
                
                {selectedAppointment?.patientEmail && (
                  <div className="flex items-center text-gray-700">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    <span className="text-sm">Записанный email: <strong>{selectedAppointment.patientEmail}</strong></span>
                  </div>
                )}
              </div>

              {sendingInvite ? (
                <div className="text-center py-10">
                  <div className="relative inline-block">
                    <FaSpinner className="animate-spin text-4xl text-purple-600 mb-4" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-30"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Создание встречи</h3>
                  <p className="text-gray-600">Отправляем приглашение пациенту...</p>
                </div>
              ) : meetingData?.meetingUrl ? (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FaCheck className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">Приглашение отправлено!</h3>
                        <p className="text-gray-600 text-sm">Ссылка направлена пациенту</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-100">
                      <div className="flex items-center text-green-700">
                        <FaPaperPlane className="mr-2" />
                        <span className="text-sm">Отправлено на: <strong className="font-medium">{inviteEmail}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FaShare className="mr-2 text-gray-400" />
                      Ссылка на видеовстречу:
                    </label>
                    <div className="flex">
                      <div className="flex-1 relative">
                        <input
                          readOnly
                          value={meetingData.meetingUrl}
                          className="w-full border-2 border-gray-200 rounded-l-xl px-4 py-3 pr-12 text-sm bg-gray-50 focus:outline-none focus:border-purple-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <FaLink className="text-gray-400" />
                        </div>
                      </div>
                      <button
                        onClick={copyLink}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 rounded-r-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center font-medium shadow-md"
                      >
                        <FaCopy className="mr-2" /> Копировать
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => window.open(meetingData.meetingUrl, '_blank')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center font-medium shadow-md"
                    >
                      <FaVideo className="mr-2" /> Присоединиться к встрече
                    </button>
                    <button
                      onClick={() => {
                        setShowMeetingModal(false);
                        setMeetingData(null);
                        setInviteEmail('');
                      }}
                      className="bg-gray-100 text-gray-700 py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center font-medium border border-gray-200"
                    >
                      Закрыть
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      Email пациента для приглашения:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Введите email пациента..."
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 pl-12 text-sm focus:outline-none focus:border-purple-500 hover:border-gray-300 transition-colors"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-100">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm mb-1">Как это работает?</h4>
                        <p className="text-gray-600 text-xs">
                          1. Введите email пациента<br/>
                          2. Система создаст встречу и отправит приглашение<br/>
                          3. Вы получите ссылку для присоединения к консультации
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendInvite}
                    disabled={!inviteEmail || !inviteEmail.includes('@') || sendingInvite}
                    className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center transition-all shadow-md ${!inviteEmail || !inviteEmail.includes('@') || sendingInvite
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg'
                    }`}
                  >
                    {sendingInvite ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Создание...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" /> Создать встречу и отправить приглашение
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;