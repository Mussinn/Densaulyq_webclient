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
  FaExclamationTriangle,
  FaUserTie
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

  // Для шаринга встречи другому доктору
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeetingToShare, setSelectedMeetingToShare] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [sharing, setSharing] = useState(false);

  const { token } = useSelector((state) => state.token);

  // ────────────────────────────────────────────────
  // Загрузка данных доктора и его записей
  // ────────────────────────────────────────────────
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
      console.error('Ошибка загрузки данных:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

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

  // Загрузка списка всех врачей
  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/v1/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const doctorsData = response.data.map(doctor => {
        const user = doctor.user || {};
        return {
          id: doctor.doctorId,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Доктор без имени',
          email: user.email || '',
          specialty: doctor.specialty || '—',
          user: user, // Сохраняем весь объект user для доступа к email
        };
      });

      setDoctors(doctorsData);
    } catch (err) {
      console.error('Не удалось загрузить список врачей:', err);
    }
  };

  // ────────────────────────────────────────────────
  // Обновление статуса записи на приём
  // ────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/appointments/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(prev => prev.map(app =>
        app.id === id ? { ...app, status } : app
      ));
      alert(`Статус изменён на: ${status}`);
    } catch (err) {
      alert('Ошибка обновления статуса: ' + (err.response?.data?.message || err.message));
    }
  };

  // ────────────────────────────────────────────────
  // Создание видеовстречи
  // ────────────────────────────────────────────────
  const openMeetingModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setInviteEmail(appointment.patientEmail || '');
    setShowMeetingModal(true);
    setMeetingData(null);
  };

  const sendInvite = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanedEmail = inviteEmail?.trim() || '';

    if (!cleanedEmail) {
      alert('Введите email пациента');
      return;
    }

    if (!emailRegex.test(cleanedEmail)) {
      alert('Введите корректный email адрес');
      return;
    }

    setSendingInvite(true);

    try {
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = userRes.data;
      const doctorId = user?.doctor?.doctorId || user?.userId;

      if (!doctorId || !selectedAppointment?.patientId) {
        throw new Error('Недостаточно данных для создания встречи');
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
      alert(err.response?.data?.message || 'Не удалось создать встречу');

      // fallback логика (если есть в вашем проекте)
    } finally {
      setSendingInvite(false);
    }
  };

  // ────────────────────────────────────────────────
  // Поделиться встречей с другим врачом
  // ────────────────────────────────────────────────
  const openShareModal = (meeting) => {
    setSelectedMeetingToShare(meeting);
    setSelectedDoctorId('');
    setShowShareModal(true);
  };

  const shareMeetingWithDoctor = async () => {
    if (!selectedDoctorId) {
      alert('Выберите врача');
      return;
    }

    const doctor = doctors.find(d => d.id === parseInt(selectedDoctorId));
    if (!doctor?.email) {
      alert('У выбранного врача не указан email');
      return;
    }

    if (!selectedMeetingToShare?.meetingUrl) {
      alert('Нет ссылки на встречу');
      return;
    }

    setSharing(true);

    try {
      const response = await api.get('/api/v1/meetings/share', {
        params: {
          email: doctor.email,
          link: selectedMeetingToShare.meetingUrl,
        },
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      alert(`Ссылка успешно отправлена на ${doctor.fullName} (${doctor.email})`);
      setShowShareModal(false);
      setSelectedDoctorId('');
      setSelectedMeetingToShare(null);
    } catch (err) {
      console.error('Ошибка отправки ссылки:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      alert(`Не удалось отправить ссылку\n${errorMessage}`);
    } finally {
      setSharing(false);
    }
  };

  const copyLink = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await api.patch(`/api/v1/meetings/${meetingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMeetings(prev => prev.map(m =>
        m.id === meetingId ? { ...m, status } : m
      ));
      alert(`Статус встречи изменён: ${status}`);
    } catch (err) {
      alert('Ошибка изменения статуса встречи');
    }
  };

  // ────────────────────────────────────────────────
  // Форматирование и вспомогательные функции
  // ────────────────────────────────────────────────
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
      return dateString || '—';
    }
  };

  const getAppointmentStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Запланирована';
      case 'confirmed': return 'Подтверждена';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      default: return status || '—';
    }
  };

  const getAppointmentStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getMeetingStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Запланирована';
      case 'ACTIVE': return 'Активна';
      case 'COMPLETED': return 'Завершена';
      case 'CANCELLED': return 'Отменена';
      default: return status || '—';
    }
  };

  const getMeetingStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // ────────────────────────────────────────────────
  // Эффекты
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchData();
      fetchDoctors();
    }
  }, [token]);

  const filteredApps = appointments.filter(app => {
    if (filter === 'active') return app.status === 'scheduled' || app.status === 'confirmed';
    if (filter === 'completed') return app.status === 'completed';
    if (filter === 'cancelled') return app.status === 'cancelled';
    return true;
  });

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────
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

      {/* Две колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Записи пациентов */}
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
                <FaCalendar className="text-4xl mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Нет записей</h3>
                <p className="text-gray-500">Выберите другой фильтр или проверьте позже</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-all border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start mb-3">
                          <div className="p-2 bg-white rounded-lg mr-3 border border-gray-200">
                            <FaUserInjured className="text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{app.patientName || 'Пациент'}</h3>
                            {app.patientEmail && (
                              <p className="text-gray-600 text-sm flex items-center">
                                <FaEnvelope className="mr-1.5 text-gray-400" size={12} />
                                {app.patientEmail}
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

                      <div className="flex flex-col space-y-2 min-w-[180px]">
                        {app.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'confirmed')}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                            >
                              <FaCheck className="mr-2 inline" /> Подтвердить
                            </button>
                            <button
                              onClick={() => updateStatus(app.id, 'cancelled')}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium"
                            >
                              <FaTimes className="mr-2 inline" /> Отменить
                            </button>
                          </>
                        )}

                        {app.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'completed')}
                              className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                            >
                              <FaCheckCircle className="mr-2 inline" /> Завершить
                            </button>
                            <button
                              onClick={() => openMeetingModal(app)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 text-sm font-medium shadow-md"
                            >
                              <FaVideo className="mr-2 inline" /> Видеовстреча
                            </button>
                          </>
                        )}

                        {(app.status === 'completed' || app.status === 'cancelled') && (
                          <div className={`text-center p-2 text-sm font-medium ${app.status === 'completed' ? 'text-gray-600' : 'text-red-600'}`}>
                            {app.status === 'completed' ? 'Прием завершен' : 'Прием отменен'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Видеовстречи */}
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
              {meetingsLoading && <FaSpinner className="animate-spin text-purple-600" />}
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
                <FaVideo className="text-4xl mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Нет встреч</h3>
                <p className="text-gray-500">Создайте первую видеовстречу</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map(meeting => (
                  <div key={meeting.id} className="bg-gray-50 rounded-xl p-4 hover:bg-purple-50 transition-all border border-gray-100">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {meeting.topic || 'Консультация'}
                      </h3>
                      {meeting.patientEmail && (
                        <p className="text-gray-600 text-sm flex items-center">
                          <FaEnvelope className="mr-1.5 text-gray-400" size={12} />
                          {meeting.patientEmail}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
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
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                          >
                            <FaPlay className="mr-2" /> Начать
                          </button>
                          {meeting.meetingUrl && (
                            <button
                              onClick={() => window.open(meeting.meetingUrl, '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                            >
                              <FaVideo className="mr-2" /> Присоединиться
                            </button>
                          )}
                        </>
                      )}

                      {meeting.status === 'ACTIVE' && meeting.meetingUrl && (
                        <>
                          <button
                            onClick={() => updateMeetingStatus(meeting.id, 'COMPLETED')}
                            className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                          >
                            <FaStop className="mr-2" /> Завершить
                          </button>
                          <button
                            onClick={() => window.open(meeting.meetingUrl, '_blank')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                          >
                            <FaVideo className="mr-2" /> Присоединиться
                          </button>
                          <button
                            onClick={() => copyLink(meeting.meetingUrl)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-sm font-medium"
                          >
                            <FaCopy className="mr-2" /> Копировать
                          </button>
                          <button
                            onClick={() => openShareModal(meeting)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium"
                          >
                            <FaShare className="mr-2" /> Поделиться
                          </button>
                        </>
                      )}

                      {meeting.status === 'COMPLETED' && meeting.meetingUrl && (
                        <button
                          onClick={() => window.open(meeting.meetingUrl, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
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

      {/* Модальное окно создания встречи с пациентом */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
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
                  <div className="flex items-center text-gray-700 text-sm">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    Записанный email: <strong className="ml-1">{selectedAppointment.patientEmail}</strong>
                  </div>
                )}
              </div>

              {sendingInvite ? (
                <div className="text-center py-10">
                  <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Создание встречи</h3>
                  <p className="text-gray-600">Отправляем приглашение...</p>
                </div>
              ) : meetingData?.meetingUrl ? (
                <div>
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
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ссылка на встречу:
                    </label>
                    <div className="flex">
                      <input
                        readOnly
                        value={meetingData.meetingUrl}
                        className="flex-1 border border-gray-300 rounded-l-xl px-4 py-3 bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyLink(meetingData.meetingUrl)}
                        className="bg-blue-600 text-white px-5 rounded-r-xl hover:bg-blue-700 flex items-center"
                      >
                        <FaCopy className="mr-2" /> Копировать
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(meetingData.meetingUrl, '_blank')}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 flex items-center justify-center"
                    >
                      <FaVideo className="mr-2" /> Присоединиться
                    </button>
                    <button
                      onClick={() => {
                        setShowMeetingModal(false);
                        setMeetingData(null);
                        setInviteEmail('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email пациента:
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={sendInvite}
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className={`w-full py-3.5 rounded-xl text-white font-medium flex items-center justify-center ${
                      sendingInvite || !inviteEmail.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {sendingInvite ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Создать встречу и отправить приглашение
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно — поделиться встречей с коллегой */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center">
                <FaUserTie className="mr-3 text-indigo-600" />
                Поделиться встречей
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Отправить ссылку другому врачу
              </p>
            </div>

            <div className="p-6">
              {doctors.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Список врачей не загружен...
                </p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите коллегу:
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— выберите врача —</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} {doc.specialty !== '—' ? `(${doc.specialty})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedDoctorId && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm">
                      Email: <strong>
                        {doctors.find(d => d.id === parseInt(selectedDoctorId))?.email || 'не указан'}
                      </strong>
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={shareMeetingWithDoctor}
                  disabled={sharing || !selectedDoctorId}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center ${
                    !selectedDoctorId || sharing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {sharing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Отправить ссылку
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedDoctorId('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;