import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import PaymentModal from '../components/PaymentModal';
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
  FaFilter,
  FaSearch,
  FaUser,
  FaHistory,
  FaPhone,
  FaChartLine,
  FaExclamationTriangle,
  FaBell,
  FaCreditCard,
  FaReceipt,
  FaExternalLinkAlt,
  FaMoneyBillWave
} from "react-icons/fa";

const OnlineBooking = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientMeetings, setPatientMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('booking');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [meetingFilter, setMeetingFilter] = useState('all');

  const { token } = useSelector((state) => state.token);

  const WORK_HOURS = { start: 9, end: 18, slotDuration: 30 };

  const handleOpenPayment = (payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const fetchPatientPayments = async (patientId) => {
    try {
      setLoadingPayments(true);
      const response = await api.get(`/api/payments/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки платежей:', err);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchData = async () => {
    try {
      if (!token) throw new Error('Токен табылмады');
      setLoading(true);

      const doctorsResponse = await api.get('/api/v1/doctor', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (doctorsResponse.data && Array.isArray(doctorsResponse.data)) {
        setDoctors(doctorsResponse.data);
        const specialistParam = searchParams.get('specialist');
        if (specialistParam) {
          setSpecialtyFilter(specialistParam);
          filterDoctorsBySpecialty(doctorsResponse.data, specialistParam);
        } else {
          setFilteredDoctors(doctorsResponse.data);
        }
      }

      const patientResponse = await api.get('/api/v1/patient/me', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      setCurrentPatient(patientResponse.data);

      if (patientResponse.data?.patientId) {
        await fetchPatientAppointments(patientResponse.data.patientId);
        await fetchPatientMeetings(patientResponse.data.patientId);
        await fetchPatientPayments(patientResponse.data.patientId);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Деректерді жүктеу кезінде қате: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId) => {
    try {
      setLoadingAppointments(true);
      const response = await api.get(`/api/appointments/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setPatientAppointments(response.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки записей пациента:', err);
      setPatientAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchPatientMeetings = async (patientId) => {
    try {
      setLoadingMeetings(true);
      const response = await api.get(`/api/v1/meetings/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setPatientMeetings(response.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки встреч:', err);
      setPatientMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const filterDoctorsBySpecialty = (doctorsList, specialty) => {
    if (!specialty) { setFilteredDoctors(doctorsList); return; }
    const filtered = doctorsList.filter(doctor =>
      doctor.specialty && doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };

  const handleSpecialtyFilterChange = (value) => {
    setSpecialtyFilter(value);
    filterDoctorsBySpecialty(doctors, value);
    setSelectedDoctor(null);
  };

  const clearFilter = () => {
    setSpecialtyFilter('');
    setFilteredDoctors(doctors);
  };

  const fetchAllAppointments = async () => {
    try {
      if (!token) return;
      const response = await api.get('/api/appointments', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setAllAppointments(response.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
      setAllAppointments([]);
    }
  };

  const createAppointment = async (doctorId, date, time) => {
    try {
      if (!token) throw new Error('Токен табылмады');
      if (!selectedDoctor) throw new Error('Дәрігер таңдалмады');
      if (!currentPatient?.patientId) throw new Error('Пациент мәліметтері жүктелмеді');

      setLoading(true);
      setError('');
      setSuccess('');

      const appointmentDateTime = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      appointmentDateTime.setHours(hours + 5, minutes, 0, 0);

      const payload = {
        doctorId: selectedDoctor.doctorId,
        patientId: currentPatient.patientId,
        appointmentDate: appointmentDateTime.toISOString(),
        status: "scheduled"
      };

      const response = await api.post('/api/appointments', payload, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      setSuccess(`✅ Қабылдау сәтті жазылды! 
        Дәрігер: ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}
        Күні: ${selectedDate.toLocaleDateString('kk-KZ')}
        Уақыты: ${time}`);

      await fetchAllAppointments();
      await fetchPatientAppointments(currentPatient.patientId);
      setSelectedDoctor(null);
      setSelectedDate(new Date());
      setAvailableSlots([]);

      setTimeout(() => { setActiveTab('appointments'); }, 2000);
    } catch (err) {
      let errorMessage = '';
      if (err.response?.status === 400) errorMessage = '400 қате (Bad Request). Деректерді тексеріңіз.';
      else if (err.response?.status === 404) errorMessage = 'Дәрігер немесе науқас табылмады';
      else if (err.response?.status === 500) errorMessage = 'Серверде қате. Кейінірек қайталаңыз.';
      else errorMessage = `Қабылдау жазу кезінде қате: ${err.message || 'Белгісіз қате'}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDoctor || !selectedDate) return [];

    const slots = [];
    const startDate = new Date(selectedDate);
    startDate.setHours(WORK_HOURS.start, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(WORK_HOURS.end, 0, 0, 0);

    const now = new Date();
    const minTime = new Date(now.getTime() + 60 * 60000);

    const busySlots = allAppointments
      .filter(app => {
        if (!app.doctor || app.doctor.doctorId !== selectedDoctor.doctorId) return false;
        const appDate = new Date(app.appointmentDate);
        const isSameDay = appDate.getDate() === selectedDate.getDate() &&
          appDate.getMonth() === selectedDate.getMonth() &&
          appDate.getFullYear() === selectedDate.getFullYear();
        const isActiveStatus = ['scheduled', 'SCHEDULED', 'confirmed', 'CONFIRMED'].includes(app.status);
        return isSameDay && isActiveStatus;
      })
      .map(app => {
        const appDate = new Date(app.appointmentDate);
        return `${appDate.getHours().toString().padStart(2, '0')}:${appDate.getMinutes().toString().padStart(2, '0')}`;
      });

    let currentTime = new Date(startDate);
    while (currentTime < endDate) {
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const slotDateTime = new Date(currentTime);
      const isPast = slotDateTime < minTime;
      const isBusy = busySlots.includes(timeString);
      slots.push({ time: timeString, dateTime: slotDateTime, isAvailable: !isPast && !isBusy, isBusy, isPast });
      currentTime.setMinutes(currentTime.getMinutes() + WORK_HOURS.slotDuration);
    }

    setAvailableSlots(slots);
    return slots;
  };

  const handleJoinMeeting = (meetingUrl) => {
    if (!meetingUrl) { alert('Кездесу сілтемесі жоқ'); return; }
    window.open(meetingUrl, '_blank');
  };

  const getMeetingForAppointment = (appointmentId) => {
    return patientMeetings.find(meeting => meeting.appointmentId === appointmentId);
  };

  // ═══════════════════════════════════════════════════════════
  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - ГЛАВНОЕ ИЗМЕНЕНИЕ!
  // Пациент может зайти ТОЛЬКО когда статус ACTIVE
  // Никакого автоматического доступа за 10 минут до начала!
  // ═══════════════════════════════════════════════════════════
  const getMeetingStatus = (meeting) => {
    if (!meeting) return null;
    const dbStatus = meeting.status?.toUpperCase();

    // Пациент может зайти ТОЛЬКО когда доктор нажал "Бастау" (status = ACTIVE)
    if (dbStatus === 'ACTIVE') return 'active';
    if (dbStatus === 'COMPLETED') return 'ended';
    if (dbStatus === 'CANCELLED') return 'cancelled';
    
    // SCHEDULED - пациент НЕ МОЖЕТ зайти, даже за 10 минут до начала
    // Ждем пока доктор явно не нажмет кнопку "Бастау"
    return 'upcoming';
  };

  const copyLink = (url) => {
    if (url) { navigator.clipboard.writeText(url); alert('Сілтеме көшірілді'); }
  };

  const handleDoctorSelect = async (doctorId) => {
    const doctor = filteredDoctors.find(d => d.doctorId === Number(doctorId));
    setSelectedDoctor(doctor);
    setSelectedDate(new Date());
    if (allAppointments.length === 0) await fetchAllAppointments();
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
      `Уақыты: ${slot.time}\n\nРастаңыз ба?`;
    if (window.confirm(confirmMessage)) createAppointment(selectedDoctor.doctorId, selectedDate, slot.time);
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })
      };
    } catch { return { date: dateString || '—', time: '' }; }
  };

  const getAppointmentStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'Жоспарланған';
      case 'confirmed': return 'Расталған';
      case 'completed': return 'Аяқталған';
      case 'cancelled': return 'Болдырылмаған';
      default: return status || '—';
    }
  };

  const getAppointmentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getMeetingStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED': return 'Жоспарланған';
      case 'ACTIVE': return 'Белсенді';
      case 'COMPLETED': return 'Аяқталған';
      case 'CANCELLED': return 'Болдырылмаған';
      default: return status || '—';
    }
  };

  const getMeetingStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
      await fetchAllAppointments();
    };
    if (token) loadData();
  }, [token]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) generateTimeSlots();
  }, [selectedDoctor, selectedDate, allAppointments]);

  const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  const filteredAppointments = patientAppointments.filter(app => {
    const status = app.status?.toLowerCase();
    if (appointmentFilter === 'upcoming') return status === 'scheduled' || status === 'confirmed';
    if (appointmentFilter === 'completed') return status === 'completed';
    if (appointmentFilter === 'cancelled') return status === 'cancelled';
    return true;
  });

  const filteredMeetings = patientMeetings.filter(meeting => {
    const status = meeting.status?.toUpperCase();
    if (meetingFilter === 'scheduled') return status === 'SCHEDULED';
    if (meetingFilter === 'active') return status === 'ACTIVE';
    if (meetingFilter === 'completed') return status === 'COMPLETED';
    return true;
  });

  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'pending') return p.status === 'pending';
    if (paymentFilter === 'paid') return p.status === 'paid';
    if (paymentFilter === 'failed') return p.status === 'failed';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Пациент панелі</h1>
              <p className="text-gray-600">Онлайн қабылдау, жазбалар және кездесулер</p>
            </div>
            <button
              onClick={fetchData}
              className="mt-4 md:mt-0 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <><FaSpinner className="animate-spin mr-2" />Жүктелуде...</>
              ) : (
                <><FaCalendar className="mr-2" /> Жаңарту</>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
              <div className="flex items-center">
                <FaExclamationTriangle className="mr-2" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 border border-green-200">
              <div className="flex items-center">
                <FaCheck className="mr-2" />
                <div className="whitespace-pre-line">{success}</div>
              </div>
            </div>
          )}

          {/* Информация о пациенте */}
          {currentPatient && (
            <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-xl mr-4">
                  <FaUser className="text-2xl text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-800 font-bold text-lg">
                    {currentPatient.user?.firstName} {currentPatient.user?.lastName}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center">
                      <FaEnvelope className="mr-1.5 text-gray-400" size={12} />
                      {currentPatient.user?.email}
                    </span>
                    {currentPatient.contactNumber && (
                      <span className="flex items-center">
                        <FaPhone className="mr-1.5 text-gray-400" size={12} />
                        {currentPatient.contactNumber}
                      </span>
                    )}
                    <span className="text-gray-400">ID: {currentPatient.patientId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Табы */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('booking')}
                className={`px-5 py-3 rounded-xl flex items-center transition-all font-medium ${
                  activeTab === 'booking' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCalendar className="mr-2" /> Жаңа жазылу
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-5 py-3 rounded-xl flex items-center transition-all font-medium ${
                  activeTab === 'appointments' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaHistory className="mr-2" /> Менің жазбаларым
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{patientAppointments.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`px-5 py-3 rounded-xl flex items-center transition-all font-medium ${
                  activeTab === 'meetings' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaVideo className="mr-2" /> Видео кездесулер
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{patientMeetings.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-5 py-3 rounded-xl flex items-center transition-all font-medium ${
                  activeTab === 'payments' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCreditCard className="mr-2" /> Төлемдер
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{payments.filter(p => p.status === 'pending').length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* ВКЛАДКА: НОВАЯ ЗАПИСЬ */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'booking' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-2xl font-semibold text-blue-600 mb-6">1. Дәрігерді таңдау</h2>

              {uniqueSpecialties.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-3">
                    <FaFilter className="inline mr-2" />Мамандық бойынша сүзу
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={specialtyFilter}
                      onChange={(e) => handleSpecialtyFilterChange(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Барлық мамандықтар</option>
                      {uniqueSpecialties.map((specialty, index) => (
                        <option key={index} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                    {specialtyFilter && (
                      <button onClick={clearFilter} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition flex items-center">
                        <FaTimes className="mr-2" />Тазалау
                      </button>
                    )}
                  </div>
                  {specialtyFilter && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Сүзгі:</span> {specialtyFilter}
                        <span className="ml-2">({filteredDoctors.length} дәрігер табылды)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <FaSpinner className="inline-block animate-spin text-4xl text-blue-600 mb-4" />
                  <p className="text-gray-600">Дәрігерлер жүктелуде...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-8">
                  <FaUserMd className="text-5xl mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">
                    {specialtyFilter ? `"${specialtyFilter}" мамандығы бойынша дәрігерлер табылмады` : 'Қолжетімді дәрігерлер жоқ'}
                  </p>
                  {specialtyFilter && (
                    <button onClick={clearFilter} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                      Сүзгіні алып тастау
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Табылды: <span className="font-semibold">{filteredDoctors.length}</span> дәрігер
                    {doctors.length !== filteredDoctors.length && <span className="ml-2 text-gray-500">(барлығы: {doctors.length})</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doctor) => (
                      <motion.div
                        key={doctor.doctorId}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                            <p className="font-semibold text-gray-800">{doctor.user.firstName} {doctor.user.lastName}</p>
                            <p className="text-blue-600 text-sm font-medium">{doctor.specialty}</p>
                            <div className="flex items-center mt-1">
                              <div className={`w-2 h-2 rounded-full mr-2 ${doctor.user.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <p className="text-xs text-gray-500">{doctor.user.online ? '🟢 Онлайн' : '⚫ Оффлайн'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedDoctor && (
              <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-semibold text-blue-600 mb-6">2. Күн мен уақытты таңдау</h2>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{selectedDoctor.user.firstName} {selectedDoctor.user.lastName}</p>
                      <p className="text-blue-600 font-medium">{selectedDoctor.specialty}</p>
                      <p className="text-sm text-gray-500 mt-1">Дәрігер ID: {selectedDoctor.doctorId}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${selectedDoctor.user.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {selectedDoctor.user.online ? '🟢 Онлайн' : '⚫ Оффлайн'}
                      </div>
                      <p className="text-xs text-gray-500">
                        Барлық жазбалар: {allAppointments.filter(a => a.doctor?.doctorId === selectedDoctor.doctorId).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-gray-800 font-semibold mb-3">Күн таңдау</label>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const isToday = i === 0;
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                            isSelected ? 'bg-blue-600 text-white border-blue-600'
                            : isToday ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          onClick={() => handleDateSelect(date)}
                        >
                          <div className="text-center">
                            <div className="text-xs font-medium">{date.toLocaleDateString('kk-KZ', { weekday: 'short' })}</div>
                            <div className="text-lg font-bold mt-1">{date.getDate()}</div>
                            <div className="text-xs mt-1">{date.toLocaleDateString('kk-KZ', { month: 'short' })}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-gray-800 font-semibold">Қолжетімді уақыттар</label>
                    {loadingAppointments && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaSpinner className="animate-spin mr-2" size={12} />Жазбалар тексерілуде...
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">
                    {selectedDate.toLocaleDateString('kk-KZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <FaSpinner className="inline-block animate-spin text-4xl text-blue-600 mb-4" />
                      <p className="text-gray-600">Уақыттар есептелуде...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {availableSlots.map((slot, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: slot.isAvailable ? 1.05 : 1 }}
                            whileTap={{ scale: slot.isAvailable ? 0.95 : 1 }}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              slot.isAvailable
                                ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 text-green-800 hover:shadow-md'
                                : slot.isBusy
                                ? 'border-red-200 bg-red-50 text-red-600 cursor-not-allowed'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            onClick={() => slot.isAvailable && handleTimeSelect(slot)}
                            disabled={!slot.isAvailable || loading}
                          >
                            <div className="font-medium">{slot.time}</div>
                            {slot.isBusy && <div className="text-xs text-red-500 mt-1">Бос емес</div>}
                            {slot.isPast && !slot.isBusy && <div className="text-xs text-gray-500 mt-1">Өткен</div>}
                          </motion.button>
                        ))}
                      </div>
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

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center"><div className="w-4 h-4 bg-green-300 rounded mr-2"></div><span>Қолжетімді</span></div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-red-300 rounded mr-2"></div><span>Бос емес (жазба бар)</span></div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded mr-2"></div><span>Өткен уақыт</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* ВКЛАДКА: МОИ ЗАПИСИ */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center mb-3">
                <FaFilter className="text-gray-500 mr-2" />
                <span className="font-medium text-gray-700">Сүзгілер:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Барлық жазбалар', icon: <FaCalendar className="mr-2" /> },
                  { key: 'upcoming', label: 'Болашақ', icon: <FaClock className="mr-2" /> },
                  { key: 'completed', label: 'Аяқталған', icon: <FaCheck className="mr-2" /> },
                  { key: 'cancelled', label: 'Болдырылмаған', icon: <FaTimes className="mr-2" /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setAppointmentFilter(key)}
                    className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${
                      appointmentFilter === key ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2.5 bg-white rounded-xl mr-3 shadow-sm">
                      <FaHistory className="text-xl text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Менің жазбаларым</h2>
                      <p className="text-sm text-gray-600">Дәрігерге қабылдаулар</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                    {filteredAppointments.length} жазба
                  </span>
                </div>
              </div>

              <div className="p-4 max-h-[700px] overflow-y-auto">
                {loadingAppointments ? (
                  <div className="py-12 text-center">
                    <FaSpinner className="animate-spin mx-auto text-3xl text-emerald-600 mb-4" />
                    <p className="text-gray-600">Жазбалар жүктелуде...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="py-12 text-center">
                    <FaCalendar className="text-4xl mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Жазбалар жоқ</h3>
                    <p className="text-gray-500">Басқа сүзгіні таңдаңыз немесе жаңа жазылу жасаңыз</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map(appointment => {
                      const meeting = getMeetingForAppointment(appointment.appointmentId);
                      const meetingStatus = getMeetingStatus(meeting);
                      const { date, time } = formatDateTime(appointment.appointmentDate);
                      return (
                        <motion.div
                          key={appointment.appointmentId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-xl p-5 hover:bg-emerald-50 transition-all border border-gray-200"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start mb-3">
                                <div className="p-2 bg-white rounded-lg mr-3 border border-gray-200 shadow-sm">
                                  <FaUserMd className="text-emerald-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg mb-1">
                                    {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                                  </h3>
                                  <p className="text-emerald-600 text-sm font-medium">{appointment.doctor?.specialty}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Күні мен уақыты</p>
                                  <p className="text-gray-800 font-medium flex items-center">
                                    <FaCalendar className="mr-2 text-gray-400" size={14} />{date}
                                  </p>
                                  <p className="text-gray-800 font-medium flex items-center mt-1">
                                    <FaClock className="mr-2 text-gray-400" size={14} />{time}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Күйі</p>
                                  <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getAppointmentStatusColor(appointment.status)}`}>
                                    {appointment.status === 'confirmed' && <FaCheckCircle className="inline mr-1.5" size={12} />}
                                    {appointment.status === 'cancelled' && <FaTimes className="inline mr-1.5" size={12} />}
                                    {getAppointmentStatusText(appointment.status)}
                                  </span>
                                </div>
                              </div>

                              {/* Блок встречи привязан к жазба */}
                              {meeting && (
                                <div className={`mt-4 p-4 rounded-xl border-l-4 ${
                                  meetingStatus === 'active'
                                    ? 'bg-green-50 border-green-500'
                                    : meetingStatus === 'upcoming'
                                    ? 'bg-blue-50 border-blue-500'
                                    : meetingStatus === 'cancelled'
                                    ? 'bg-red-50 border-red-400'
                                    : 'bg-gray-50 border-gray-400'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaVideo className="text-lg text-gray-600" />
                                    <span className="font-semibold text-gray-800">{meeting.topic || 'Онлайн кездесу'}</span>
                                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${getMeetingStatusColor(meeting.status)}`}>
                                      {getMeetingStatusText(meeting.status)}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                                    <p className="flex items-center">
                                      <span className="w-24 text-gray-500">Бөлме ID:</span>
                                      <strong>{meeting.roomId}</strong>
                                    </p>
                                    <p className="flex items-center">
                                      <span className="w-24 text-gray-500">Ұзақтығы:</span>
                                      <strong>{meeting.durationMinutes || 30} минут</strong>
                                    </p>
                                  </div>

                                  {/* Кнопки действий строго по статусу из БД */}
                                  {meetingStatus === 'active' && meeting.meetingUrl && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <button
                                        onClick={() => handleJoinMeeting(meeting.meetingUrl)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm animate-pulse"
                                      >
                                        <FaVideo size={14} /> Қосылу
                                      </button>
                                      <button
                                        onClick={() => copyLink(meeting.meetingUrl)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
                                      >
                                        <FaCopy size={14} /> Сілтемені көшіру
                                      </button>
                                    </div>
                                  )}

                                  {meetingStatus === 'upcoming' && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                                      <FaClock size={12} />
                                      <span>Дәрігер кездесуді бастағанда қол жетімді болады</span>
                                    </div>
                                  )}

                                  {meetingStatus === 'ended' && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                      <FaCheck size={12} />
                                      <span>Кездесу аяқталды</span>
                                    </div>
                                  )}

                                  {meetingStatus === 'cancelled' && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                      <FaTimes size={12} />
                                      <span>Кездесу болдырылмады</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                            Жазылған күні: {formatDateTime(appointment.createdAt).date} {formatDateTime(appointment.createdAt).time}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* ВКЛАДКА: ВИДЕОВСТРЕЧИ */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'meetings' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center mb-3">
                <FaFilter className="text-gray-500 mr-2" />
                <span className="font-medium text-gray-700">Сүзгілер:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Барлық кездесулер', icon: <FaVideo className="mr-2" /> },
                  { key: 'scheduled', label: 'Жоспарланған', icon: <FaClock className="mr-2" /> },
                  { key: 'active', label: 'Белсенді', icon: <FaPlay className="mr-2" /> },
                  { key: 'completed', label: 'Аяқталған', icon: <FaCheck className="mr-2" /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setMeetingFilter(key)}
                    className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${
                      meetingFilter === key ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2.5 bg-white rounded-xl mr-3 shadow-sm">
                      <FaVideo className="text-xl text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Видео кездесулер</h2>
                      <p className="text-sm text-gray-600">Онлайн консультациялар</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingMeetings && <FaSpinner className="animate-spin text-purple-600" />}
                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                      {filteredMeetings.length} кездесу
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 max-h-[700px] overflow-y-auto">
                {loadingMeetings ? (
                  <div className="py-12 text-center">
                    <FaSpinner className="animate-spin mx-auto text-3xl text-purple-600 mb-4" />
                    <p className="text-gray-600">Кездесулер жүктелуде...</p>
                  </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="py-12 text-center">
                    <FaVideo className="text-4xl mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Кездесулер жоқ</h3>
                    <p className="text-gray-500">Басқа сүзгіні таңдаңыз</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMeetings.map(meeting => {
                      const appointment = patientAppointments.find(app => app.appointmentId === meeting.appointmentId);
                      const { date, time } = formatDateTime(meeting.scheduledTime || meeting.createdAt);
                      const meetingStatus = getMeetingStatus(meeting);

                      return (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-xl p-5 hover:bg-purple-50 transition-all border border-gray-200"
                        >
                          <div className="mb-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                  <FaVideo className="text-purple-600" />
                                  {meeting.topic || 'Онлайн кездесу'}
                                </h3>
                                {appointment && (
                                  <p className="text-gray-600 text-sm mt-1">
                                    Дәрігер: {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                                  </p>
                                )}
                              </div>
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getMeetingStatusColor(meeting.status)}`}>
                                {getMeetingStatusText(meeting.status)}
                              </span>
                            </div>
                            {meeting.patientEmail && (
                              <p className="text-gray-600 text-sm flex items-center mt-2">
                                <FaEnvelope className="mr-1.5 text-gray-400" size={12} />
                                {meeting.patientEmail}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="text-gray-600 text-sm flex items-center">
                              <FaClock className="mr-2 text-gray-400" />
                              <div>
                                <div className="font-medium">{date}</div>
                                <div>{time}</div>
                              </div>
                            </div>
                            <div className="text-gray-600 text-sm">
                              <p className="flex items-center">
                                <span className="text-gray-500 mr-2">Бөлме ID:</span>
                                <strong>{meeting.roomId}</strong>
                              </p>
                              <p className="flex items-center mt-1">
                                <span className="text-gray-500 mr-2">Ұзақтығы:</span>
                                <strong>{meeting.durationMinutes || 30} минут</strong>
                              </p>
                            </div>
                          </div>

                          {/* ── КНОПКИ: строго по статусу из БД ── */}
                          <div className="flex flex-wrap gap-2">
                            {/* ACTIVE — дәрігер бастады, қосылуға болады */}
                            {meetingStatus === 'active' && meeting.meetingUrl && (
                              <>
                                <button
                                  onClick={() => handleJoinMeeting(meeting.meetingUrl)}
                                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 shadow-md animate-pulse"
                                >
                                  <FaVideo size={14} /> Қосылу
                                </button>
                                <button
                                  onClick={() => copyLink(meeting.meetingUrl)}
                                  className="px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-medium flex items-center gap-2"
                                >
                                  <FaCopy size={14} /> Сілтемені көшіру
                                </button>
                              </>
                            )}

                            {/* SCHEDULED — дәрігер әлі бастамады */}
                            {meetingStatus === 'upcoming' && (
                              <div className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2 border border-blue-200">
                                <FaClock size={12} /> Дәрігер кездесуді бастағанда қол жетімді болады
                              </div>
                            )}

                            {/* COMPLETED — аяқталған */}
                            {meetingStatus === 'ended' && (
                              <div className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium flex items-center gap-2">
                                <FaCheck size={12} className="text-gray-400" /> Кездесу аяқталды
                              </div>
                            )}

                            {/* CANCELLED */}
                            {meetingStatus === 'cancelled' && (
                              <div className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-200">
                                <FaTimes size={12} /> Кездесу болдырылмады
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* ВКЛАДКА: ПЛАТЕЖИ */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center mb-3">
                <FaFilter className="text-gray-500 mr-2" />
                <span className="font-medium text-gray-700">Сүзгілер:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Барлық төлемдер', icon: <FaReceipt className="mr-2" />, color: 'bg-green-600' },
                  { key: 'pending', label: 'Күтілуде', icon: <FaClock className="mr-2" />, color: 'bg-yellow-600' },
                  { key: 'paid', label: 'Төленген', icon: <FaCheck className="mr-2" />, color: 'bg-green-600' },
                  { key: 'failed', label: 'Сәтсіз', icon: <FaExclamationTriangle className="mr-2" />, color: 'bg-red-600' },
                ].map(({ key, label, icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentFilter(key)}
                    className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${
                      paymentFilter === key ? `${color} text-white shadow-md` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2.5 bg-white rounded-xl mr-3 shadow-sm">
                      <FaCreditCard className="text-xl text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Менің төлемдерім</h2>
                      <p className="text-sm text-gray-600">Шоттар мен төлемдер</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingPayments && <FaSpinner className="animate-spin text-green-600" />}
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      {filteredPayments.length} төлем
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 max-h-[700px] overflow-y-auto">
                {loadingPayments ? (
                  <div className="py-12 text-center">
                    <FaSpinner className="animate-spin mx-auto text-3xl text-green-600 mb-4" />
                    <p className="text-gray-600">Төлемдер жүктелуде...</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="py-12 text-center">
                    <FaMoneyBillWave className="text-4xl mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Төлемдер жоқ</h3>
                    <p className="text-gray-500">Дәрігерге жазылып, төлемді күтіңіз</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPayments.map(payment => (
                      <motion.div
                        key={payment.paymentId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl p-5 hover:bg-green-50 transition-all border border-gray-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start mb-3">
                              <div className="p-2 bg-white rounded-lg mr-3 border border-gray-200 shadow-sm">
                                <FaReceipt className="text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">
                                  {payment.description || 'Консультация'}
                                </h3>
                                <p className="text-gray-600 text-sm flex items-center">
                                  <FaCalendar className="mr-1.5 text-gray-400" size={12} />
                                  {formatDateTime(payment.createdAt).date} {formatDateTime(payment.createdAt).time}
                                </p>
                                {payment.paidAt && (
                                  <p className="text-gray-600 text-sm flex items-center mt-1">
                                    <FaCheck className="mr-1.5 text-green-600" size={12} />
                                    Төленді: {formatDateTime(payment.paidAt).date} {formatDateTime(payment.paidAt).time}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Сома</p>
                                <p className="text-xl font-bold text-gray-800">
                                  {payment.amount?.toLocaleString()} {payment.currency || 'KZT'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Күйі</p>
                                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : payment.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200'
                                  : payment.status === 'failed' ? 'bg-red-100 text-red-800 border border-red-200'
                                  : payment.status === 'refunded' ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.status === 'pending' ? 'Күтілуде'
                                   : payment.status === 'paid' ? 'Төленген'
                                   : payment.status === 'failed' ? 'Сәтсіз'
                                   : payment.status === 'refunded' ? 'Қайтарылған'
                                   : payment.status}
                                </span>
                              </div>
                            </div>
                            {payment.doctorName && (
                              <p className="text-sm text-gray-600 flex items-center mt-2">
                                <FaUserMd className="mr-1.5 text-gray-400" size={12} />
                                Дәрігер: {payment.doctorName}
                              </p>
                            )}
                          </div>

                          {payment.status === 'pending' && payment.paymentUrl && (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <button
                                onClick={() => handleOpenPayment(payment)}
                                className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <FaCreditCard /> Төлеу
                              </button>
                              <button
                                onClick={() => copyLink(payment.paymentUrl)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <FaCopy size={14} /> Сілтемені көшіру
                              </button>
                            </div>
                          )}
                          {payment.status === 'paid' && (
                            <div className="px-5 py-3 bg-green-100 text-green-800 rounded-xl flex items-center gap-2 font-medium">
                              <FaCheck /> Төлем расталды
                            </div>
                          )}
                          {payment.status === 'failed' && (
                            <div className="px-5 py-3 bg-red-100 text-red-800 rounded-xl flex items-center gap-2 font-medium">
                              <FaExclamationTriangle /> Төлем сәтсіз
                            </div>
                          )}
                          {payment.status === 'refunded' && (
                            <div className="px-5 py-3 bg-purple-100 text-purple-800 rounded-xl flex items-center gap-2 font-medium">
                              <FaMoneyBillWave /> Қайтарылған
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Модальное окно оплаты */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
            if (currentPatient?.patientId) fetchPatientPayments(currentPatient.patientId);
          }}
          paymentUrl={selectedPayment?.paymentUrl}
          paymentDetails={selectedPayment}
        />
      </section>
    </div>
  );
};

export default OnlineBooking;