import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { FaVideo, FaCopy, FaEnvelope, FaCalendar, FaSpinner } from "react-icons/fa";

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
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  
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
        // Загрузка записей на прием
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
        
        // Загрузка встреч доктора
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

  // Создание встречи
  const createMeeting = async (appointment) => {
    setSelectedAppointment(appointment);
    setInviteEmail(appointment.patientEmail || '');
    setShowMeetingModal(true);
    setCreatingMeeting(true);
    
    try {
      // Получаем информацию о текущем пользователе (докторе)
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const user = userRes.data;
      const doctorId = user?.doctor?.doctorId || user?.userId;
      
      if (!doctorId) {
        throw new Error('Не удалось получить ID доктора');
      }
      
      // Создаем встречу через простой эндпоинт
      const response = await api.get(`/api/v1/meetings/create-simple`, {
        params: {
          topic: `Консультация-${appointment.patientName}`,
          doctorId: doctorId,
          patientId: appointment.patientId,
          patientEmail: appointment.patientEmail
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const meetingInfo = response.data;
      setMeetingData({
        meetingUrl: meetingInfo.meetingUrl,
        roomId: meetingInfo.roomId,
        message: meetingInfo.message
      });
      
      // Обновляем список встреч
      await fetchMeetings(doctorId);
      
    } catch (err) {
      console.error('Ошибка создания встречи:', err);
      // Fallback на локальную генерацию
      const fallbackMeetingUrl = `https://meet.jit.si/consult-${Date.now()}`;
      setMeetingData({
        meetingUrl: fallbackMeetingUrl,
        roomId: `consult-${Date.now()}`,
        message: 'Ссылка сгенерирована локально'
      });
    } finally {
      setCreatingMeeting(false);
    }
  };

  // Отправка приглашения (используем API повторной отправки)
  const sendInvite = async () => {
    if (!inviteEmail) {
      alert('Введите email пациента');
      return;
    }
    
    setSendingInvite(true);
    try {
      // Если у нас есть ID созданной встречи, используем resend-invite
      // В противном случае просто показываем сообщение
      
      // Создаем встречу через POST если нужно
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const user = userRes.data;
      const doctorId = user?.doctor?.doctorId || user?.userId;
      
      // Используем POST endpoint для создания встречи с отправкой email
      const response = await api.post('/api/v1/meetings', {
        doctorId: doctorId,
        patientId: selectedAppointment?.patientId,
        patientEmail: inviteEmail,
        topic: `Консультация с ${selectedAppointment?.patientName}`,
        scheduledTime: new Date().toISOString(),
        durationMinutes: 30
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const meeting = response.data;
      setMeetingData({
        meetingUrl: meeting.meetingUrl,
        roomId: meeting.roomId,
        message: 'Встреча создана и приглашение отправлено'
      });
      
      // Обновляем список встреч
      await fetchMeetings(doctorId);
      
      alert(`Приглашение отправлено на ${inviteEmail}`);
      
    } catch (err) {
      console.error('Ошибка отправки приглашения:', err);
      alert('Ошибка отправки приглашения. Проверьте настройки email.');
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
      
      // Обновляем локальный список
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

  // Перевод статуса встречи
  const getMeetingStatusText = (status) => {
    switch(status) {
      case 'SCHEDULED': return 'Запланирована';
      case 'ACTIVE': return 'Активна';
      case 'COMPLETED': return 'Завершена';
      case 'CANCELLED': return 'Отменена';
      default: return status;
    }
  };

  // Цвет статуса встречи
  const getMeetingStatusColor = (status) => {
    switch(status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Записи на прием</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'active', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              className={`px-3 py-1 rounded ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Все' : 
               f === 'active' ? 'Активные' :
               f === 'completed' ? 'Завершенные' : 'Отмененные'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Загрузка...
            </>
          ) : 'Обновить'}
        </button>
      </div>

      {/* Список записей */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        {loading ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin mx-auto text-2xl text-blue-600 mb-2" />
            <p>Загрузка записей...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет записей</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Пациент</th>
                <th className="p-3 text-left">Дата</th>
                <th className="p-3 text-left">Статус</th>
                <th className="p-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{app.patientName}</div>
                    {app.patientEmail && (
                      <div className="text-sm text-gray-500">{app.patientEmail}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {formatDateTime(app.appointmentDate)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      app.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {app.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    {app.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'completed')}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                        >
                          Завершить
                        </button>
                        <button
                          onClick={() => createMeeting(app)}
                          className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                          disabled={creatingMeeting}
                        >
                          <FaVideo className="mr-1" /> 
                          {creatingMeeting ? 'Создание...' : 'Создать встречу'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Список встреч */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaCalendar className="mr-2 text-blue-600" />
            Видеовстречи
          </h2>
          {meetingsLoading && (
            <FaSpinner className="animate-spin text-blue-600" />
          )}
        </div>
        
        {meetingsLoading ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin mx-auto text-2xl text-blue-600 mb-2" />
            <p>Загрузка встреч...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет созданных встреч</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Тема</th>
                <th className="p-3 text-left">Дата</th>
                <th className="p-3 text-left">Статус</th>
                <th className="p-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(meeting => (
                <tr key={meeting.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{meeting.topic || 'Консультация'}</div>
                    {meeting.patientEmail && (
                      <div className="text-sm text-gray-500">{meeting.patientEmail}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {formatDateTime(meeting.scheduledTime || meeting.createdAt)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${getMeetingStatusColor(meeting.status)}`}>
                      {getMeetingStatusText(meeting.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {meeting.status === 'SCHEDULED' && (
                        <button
                          onClick={() => updateMeetingStatus(meeting.id, 'ACTIVE')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Начать
                        </button>
                      )}
                      {meeting.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateMeetingStatus(meeting.id, 'COMPLETED')}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Завершить
                        </button>
                      )}
                      {meeting.meetingUrl && (
                        <>
                          <button
                            onClick={() => window.open(meeting.meetingUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <FaVideo className="mr-1" /> Присоединиться
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(meeting.meetingUrl)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Копировать ссылку"
                          >
                            <FaCopy size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Модалка создания встречи */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaVideo className="mr-2 text-purple-600" />
                {creatingMeeting ? 'Создание встречи...' : 'Встреча создана'}
              </h2>
              
              <div className="mb-4">
                <p className="font-medium mb-1">Пациент:</p>
                <p className="text-gray-700">{selectedAppointment?.patientName}</p>
              </div>
              
              {creatingMeeting ? (
                <div className="text-center py-8">
                  <FaSpinner className="animate-spin mx-auto text-3xl text-blue-600 mb-4" />
                  <p>Создание видеовстречи...</p>
                </div>
              ) : meetingData ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Ссылка на встречу:</label>
                    <div className="flex">
                      <input
                        readOnly
                        value={meetingData.meetingUrl}
                        className="flex-1 border rounded-l px-3 py-2 text-sm"
                      />
                      <button
                        onClick={copyLink}
                        className="bg-gray-800 text-white px-3 rounded-r flex items-center"
                      >
                        <FaCopy />
                      </button>
                    </div>
                    {meetingData.message && (
                      <p className="text-sm text-green-600 mt-1">{meetingData.message}</p>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 flex items-center">
                      <FaEnvelope className="mr-2 text-blue-600" />
                      Отправить приглашение на email:
                    </label>
                    <div className="flex">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 border rounded-l px-3 py-2 text-sm"
                      />
                      <button
                        onClick={sendInvite}
                        disabled={sendingInvite || !inviteEmail}
                        className={`px-4 rounded-r flex items-center ${
                          sendingInvite || !inviteEmail
                            ? 'bg-gray-400 text-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {sendingInvite ? <FaSpinner className="animate-spin" /> : 'Отправить'}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.open(meetingData.meetingUrl, '_blank')}
                    className="w-full bg-green-600 text-white py-2 rounded mb-3 hover:bg-green-700 flex items-center justify-center"
                  >
                    <FaVideo className="mr-2" />
                    Присоединиться к встрече
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-red-600">
                  Ошибка создания встречи. Попробуйте еще раз.
                </div>
              )}
              
              <button
                onClick={() => setShowMeetingModal(false)}
                className="w-full border border-gray-300 py-2 rounded text-gray-700 hover:bg-gray-50"
                disabled={creatingMeeting}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;