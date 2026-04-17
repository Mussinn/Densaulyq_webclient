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
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaPlay,
  FaStop,
  FaShare,
  FaPaperPlane,
  FaUserTie,
  FaUsers,
  FaComments,
  FaStethoscope
} from "react-icons/fa";

const DoctorConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentDoctorId, setCurrentDoctorId] = useState(null);

  // Консилиум құру үшін
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);

  // Консилиумды басқа дәрігермен бөлісу үшін
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedConsultationToShare, setSelectedConsultationToShare] = useState(null);
  const [selectedShareDoctorId, setSelectedShareDoctorId] = useState('');
  const [sharing, setSharing] = useState(false);

  const { token } = useSelector((state) => state.token);

  // ────────────────────────────────────────────────
  // Деректерді жүктеу
  // ────────────────────────────────────────────────
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      
      const doctorRes = await api.get('/api/v1/doctor/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const doctorData = doctorRes.data;
      console.log('Ағымдағы дәрігер:', doctorData);
      
      const doctorId = doctorData?.doctorId || doctorData?.userId;
      setCurrentDoctorId(doctorId);

      if (doctorId) {
        // Ағымдағы дәрігер жіберуші (ұйымдастырушы) болып табылатын консилиумдар
        const senderResponse = await api.get(`/api/v1/meeting-consilium/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Ағымдағы дәрігер алушы (шақырылған) болып табылатын консилиумдар
        const receiverResponse = await api.get(`/api/v1/meeting-consilium/receiver-doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const senderMeetings = senderResponse.data || [];
        const receiverMeetings = receiverResponse.data || [];

        // Дәрігер ұйымдастырушы болып табылатын консилиумдарды байыту
        const enrichedSenderConsultations = senderMeetings.map(meeting => ({
          ...meeting,
          currentUserRole: 'organizer',
          colleagueId: meeting.receiverDoctorId,
          colleagueEmail: meeting.receiverDoctorEmail,
          colleagueName: 'Әріптес'
        }));

        // Дәрігер шақырылған болып табылатын консилиумдарды байыту
        const enrichedReceiverConsultations = receiverMeetings.map(meeting => ({
          ...meeting,
          currentUserRole: 'invited',
          colleagueId: meeting.senderDoctorId,
          colleagueEmail: meeting.senderDoctorEmail,
          colleagueName: 'Ұйымдастырушы'
        }));

        // Екі тізімді біріктіру
        const allConsultations = [
          ...enrichedSenderConsultations,
          ...enrichedReceiverConsultations
        ];
        
        // Күні бойынша сұрыптау (жаңалары бірінші)
        allConsultations.sort((a, b) => 
          new Date(b.scheduledTime || b.createdAt) - new Date(a.scheduledTime || a.createdAt)
        );
        
        setConsultations(allConsultations);
      }
    } catch (err) {
      console.error('Консилиумдарды жүктеу қатесі:', err);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/v1/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const doctorRes = await api.get('/api/v1/doctor/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentDoctorId = doctorRes.data?.doctorId || doctorRes.data?.userId;

      // Ағымдағы дәрігерді тізімнен сүзу
      const doctorsData = response.data
        .filter(doctor => doctor.doctorId !== currentDoctorId)
        .map(doctor => {
          const user = doctor.user || {};
          return {
            id: doctor.doctorId,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Дәрігер',
            email: user.email || '',
            specialty: doctor.specialty || '—',
            user: user,
          };
        });

      setDoctors(doctorsData);
    } catch (err) {
      console.error('Дәрігерлер тізімін жүктеу мүмкін болмады:', err);
    }
  };

  // ────────────────────────────────────────────────
  // Консилиум құру
  // ────────────────────────────────────────────────
  const openCreateModal = () => {
    setShowCreateModal(true);
    setSelectedDoctorId('');
    setTopic('');
    setDescription('');
    setScheduledDate('');
    setScheduledTime('');
    setInviteEmail('');
    setCreatedMeeting(null);
  };

  const handleDoctorSelection = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctorId(doctorId);
    
    if (doctorId) {
      const doctor = doctors.find(d => d.id === parseInt(doctorId));
      setInviteEmail(doctor?.email || '');
    } else {
      setInviteEmail('');
    }
  };

  const createConsultation = async () => {
    // Тексеру
    if (!selectedDoctorId) {
      alert('Консилиум үшін әріптесті таңдаңыз');
      return;
    }

    if (!topic.trim()) {
      alert('Консилиум тақырыбын енгізіңіз');
      return;
    }

    if (!inviteEmail.trim()) {
      alert('Әріптестің email-і көрсетілмеген');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      alert('Дұрыс email мекенжайын енгізіңіз');
      return;
    }

    setCreating(true);

    try {
      const doctorRes = await api.get('/api/v1/doctor/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctorData = doctorRes.data;
      const currentDoctorId = doctorData?.doctorId || doctorData?.userId;

      // Күн мен уақытты қалыптастыру
      let scheduledDateTime;
      if (scheduledDate && scheduledTime) {
        scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      } else {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        scheduledDateTime = now.toISOString().slice(0, 19);
      }

      const requestData = {
        senderDoctorId: Number(currentDoctorId),
        receiverDoctorId: Number(selectedDoctorId),
        topic: topic.trim(),
        description: description.trim() || 'Дәрігерлер консилиумы',
        scheduledTime: scheduledDateTime,
        durationMinutes: 60,
        receiverDoctorEmail: inviteEmail.trim(),
      };

      console.log('Консилиум құру сұрауы:', requestData);

      const response = await api.post('/api/v1/meeting-consilium', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const meeting = response.data;
      console.log('Консилиум құрылды:', meeting);

      setCreatedMeeting({
        meetingUrl: meeting.meetingUrl,
        roomId: meeting.roomId,
        message: 'Консилиум құрылды және шақыру жіберілді',
        id: meeting.id
      });

      await fetchConsultations();

      // Форманы тазалау
      setSelectedDoctorId('');
      setTopic('');
      setDescription('');
      setScheduledDate('');
      setScheduledTime('');

    } catch (err) {
      console.error('Консилиум құру қатесі:', err);
      console.error('Қате мәліметтері:', err.response?.data);
      alert(err.response?.data?.message || 'Консилиум құру мүмкін болмады');
    } finally {
      setCreating(false);
    }
  };

  // ────────────────────────────────────────────────
  // Консилиуммен бөлісу
  // ────────────────────────────────────────────────
  const openShareModal = (consultation) => {
    setSelectedConsultationToShare(consultation);
    setSelectedShareDoctorId('');
    setShowShareModal(true);
  };

  const shareConsultation = async () => {
    if (!selectedShareDoctorId) {
      alert('Дәрігерді таңдаңыз');
      return;
    }

    const doctor = doctors.find(d => d.id === parseInt(selectedShareDoctorId));
    if (!doctor?.email) {
      alert('Таңдалған дәрігердің email-і көрсетілмеген');
      return;
    }

    if (!selectedConsultationToShare?.meetingUrl) {
      alert('Консилиум сілтемесі жоқ');
      return;
    }

    setSharing(true);

    try {
      await api.get('/api/v1/meeting-consilium/share', {
        params: {
          email: doctor.email,
          link: selectedConsultationToShare.meetingUrl,
        },
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      alert(`Сілтеме ${doctor.fullName} (${doctor.email}) мекенжайына сәтті жіберілді`);
      setShowShareModal(false);
      setSelectedShareDoctorId('');
      setSelectedConsultationToShare(null);
    } catch (err) {
      console.error('Сілтеме жіберу қатесі:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      alert(`Сілтеме жіберу мүмкін болмады\n${errorMessage}`);
    } finally {
      setSharing(false);
    }
  };

  const copyLink = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      alert('Сілтеме алмасу буферіне көшірілді');
    }
  };

  const updateConsultationStatus = async (meetingId, status) => {
    try {
      await api.patch(`/api/v1/meeting-consilium/${meetingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConsultations(prev => prev.map(m =>
        m.id === meetingId ? { ...m, status } : m
      ));
      alert(`Консилиум мәртебесі өзгертілді: ${status}`);
    } catch (err) {
      console.error('Мәртебені өзгерту қатесі:', err);
      alert('Мәртебені өзгерту қатесі');
    }
  };

  // ────────────────────────────────────────────────
  // Көмекші функциялар
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

  const getStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'Жоспарланған';
      case 'ACTIVE': return 'Белсенді';
      case 'COMPLETED': return 'Аяқталған';
      case 'CANCELLED': return 'Болдырылмаған';
      default: return status || '—';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // ────────────────────────────────────────────────
  // Эффекттер
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchConsultations();
      fetchDoctors();
    }
  }, [token]);

  const filteredConsultations = consultations.filter(cons => {
    if (filter === 'active') return cons.status === 'SCHEDULED' || cons.status === 'ACTIVE';
    if (filter === 'completed') return cons.status === 'COMPLETED';
    if (filter === 'cancelled') return cons.status === 'CANCELLED';
    return true;
  });

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Тақырып */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <FaUsers className="mr-3 text-indigo-600" />
              Дәрігерлер консилиумы
            </h1>
            <p className="text-gray-600">Әріптестермен бірлескен кеңестерді ұйымдастыру</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchConsultations}
              className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Жүктелуде...
                </>
              ) : (
                <>
                  <FaCalendar className="mr-2" /> Жаңарту
                </>
              )}
            </button>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
            >
              <FaUserTie className="mr-2" /> Консилиум құру
            </button>
          </div>
        </div>

        {/* Сүзгілер */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCalendar className="mr-2" /> Барлық консилиумдар
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'active' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCheckCircle className="mr-2" /> Белсенді
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'completed' ? 'bg-gray-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaCheck className="mr-2" /> Аяқталған
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2.5 rounded-xl flex items-center transition-all ${filter === 'cancelled' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <FaTimes className="mr-2" /> Болдырылмаған
            </button>
          </div>
        </div>
      </div>

      {/* Консилиумдар тізімі */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2.5 bg-indigo-50 rounded-xl mr-3">
                <FaStethoscope className="text-xl text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Менің консилиумдарым</h2>
                <p className="text-sm text-gray-500">Әріптестермен жоспарланған кездесулер</p>
              </div>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
              {filteredConsultations.length} кездесу
            </span>
          </div>
        </div>

        <div className="p-4 max-h-[800px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <FaSpinner className="animate-spin mx-auto text-3xl text-indigo-600 mb-4" />
              <p className="text-gray-600">Консилиумдар жүктелуде...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="py-12 text-center">
              <FaUsers className="text-4xl mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Консилиумдар жоқ</h3>
              <p className="text-gray-500 mb-4">Әріптеспен бірінші кездесуді құрыңыз</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 inline-flex items-center"
              >
                <FaUserTie className="mr-2" /> Консилиум құру
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map(consultation => (
                <div key={consultation.id} className="bg-gray-50 rounded-xl p-5 hover:bg-indigo-50 transition-all border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start mb-3">
                        <div className="p-2.5 bg-white rounded-lg mr-3 border border-indigo-200">
                          <FaComments className="text-indigo-600 text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg mb-1">
                            {consultation.topic || 'Консилиум'}
                          </h3>
                          
                          {/* Қолданушының рөлін және әріптес туралы ақпаратты көрсету */}
                          <div className="flex items-center gap-4 text-sm mb-2">
                            <span className={`px-2.5 py-1 rounded-lg font-medium ${
                              consultation.currentUserRole === 'organizer' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {consultation.currentUserRole === 'organizer' ? '👤 Сіз — ұйымдастырушы' : '✉️ Сіз — шақырылған'}
                            </span>
                          </div>

                          {consultation.colleagueEmail && (
                            <p className="text-gray-600 text-sm flex items-center">
                              <FaEnvelope className="mr-1.5 text-gray-400" size={12} />
                              {consultation.currentUserRole === 'organizer' ? 'Шақырылған' : 'Ұйымдастырушы'}: {consultation.colleagueName} ({consultation.colleagueEmail})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaClock className="mr-1.5 text-gray-400" />
                          <span>{formatDateTime(consultation.scheduledTime)}</span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(consultation.status)}`}>
                          {getStatusText(consultation.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {consultation.status === 'SCHEDULED' && (
                          <>
                            {consultation.currentUserRole === 'organizer' && (
                              <button
                                onClick={() => updateConsultationStatus(consultation.id, 'ACTIVE')}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                              >
                                <FaPlay className="mr-2 inline" /> Бастау
                              </button>
                            )}
                            {consultation.meetingUrl && (
                              <button
                                onClick={() => window.open(consultation.meetingUrl, '_blank')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                              >
                                <FaVideo className="mr-2 inline" /> Қосылу
                              </button>
                            )}
                            {consultation.currentUserRole === 'organizer' && (
                              <button
                                onClick={() => updateConsultationStatus(consultation.id, 'CANCELLED')}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium"
                              >
                                <FaTimes className="mr-2 inline" /> Болдырмау
                              </button>
                            )}
                          </>
                        )}

                        {consultation.status === 'ACTIVE' && consultation.meetingUrl && (
                          <>
                            {consultation.currentUserRole === 'organizer' && (
                              <button
                                onClick={() => updateConsultationStatus(consultation.id, 'COMPLETED')}
                                className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                              >
                                <FaStop className="mr-2 inline" /> Аяқтау
                              </button>
                            )}
                            <button
                              onClick={() => window.open(consultation.meetingUrl, '_blank')}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                            >
                              <FaVideo className="mr-2 inline" /> Қосылу
                            </button>
                            <button
                              onClick={() => copyLink(consultation.meetingUrl)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-sm font-medium"
                            >
                              <FaCopy className="mr-2 inline" /> Көшіру
                            </button>
                            <button
                              onClick={() => openShareModal(consultation)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium"
                            >
                              <FaShare className="mr-2 inline" /> Бөлісу
                            </button>
                          </>
                        )}

                        {consultation.status === 'COMPLETED' && consultation.meetingUrl && (
                          <button
                            onClick={() => window.open(consultation.meetingUrl, '_blank')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                          >
                            <FaVideo className="mr-2 inline" /> Жазбаны ашу
                          </button>
                        )}

                        {consultation.status === 'CANCELLED' && (
                          <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
                            Консилиум болдырылды
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

      {/* Консилиум құру модальды терезесі */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl mr-3">
                    <FaUsers className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {creating ? 'Консилиум құрылуда...' : createdMeeting ? 'Консилиум құрылды!' : 'Жаңа консилиум'}
                    </h2>
                    <p className="text-sm text-gray-500">Әріптеспен кездесуді ұйымдастыру</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedMeeting(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={creating}
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {creating ? (
                <div className="text-center py-10">
                  <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Консилиум құрылуда</h3>
                  <p className="text-gray-600">Әріптеске шақыру жіберілуде...</p>
                </div>
              ) : createdMeeting ? (
                <div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FaCheck className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">Консилиум құрылды!</h3>
                        <p className="text-gray-600 text-sm">Шақыру әріптеске жіберілді</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Консилиум сілтемесі:
                    </label>
                    <div className="flex">
                      <input
                        readOnly
                        value={createdMeeting.meetingUrl}
                        className="flex-1 border border-gray-300 rounded-l-xl px-4 py-3 bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyLink(createdMeeting.meetingUrl)}
                        className="bg-blue-600 text-white px-5 rounded-r-xl hover:bg-blue-700 flex items-center"
                      >
                        <FaCopy className="mr-2" /> Көшіру
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(createdMeeting.meetingUrl, '_blank')}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 flex items-center justify-center"
                    >
                      <FaVideo className="mr-2" /> Қосылу
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreatedMeeting(null);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200"
                    >
                      Жабу
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Әріптесті таңдау */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Әріптесті таңдаңыз: *
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={handleDoctorSelection}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">— дәрігерді таңдаңыз —</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          {doc.fullName} {doc.specialty !== '—' ? `(${doc.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Әріптестің email-і */}
                  {selectedDoctorId && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <p className="text-sm text-gray-700">
                        <strong>Әріптестің email-і:</strong> {inviteEmail || 'көрсетілмеген'}
                      </p>
                    </div>
                  )}

                  {/* Тақырып */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Консилиум тақырыбы: *
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="Мысалы: Пациенттің күрделі жағдайын талқылау"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Сипаттама */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сипаттама (міндетті емес):
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Консилиум туралы қосымша ақпарат..."
                      rows={3}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Күн мен уақыт */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Күні (міндетті емес):
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Уақыты (міндетті емес):
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Құру түймесі */}
                  <button
                    onClick={createConsultation}
                    disabled={creating || !selectedDoctorId || !topic.trim()}
                    className={`w-full py-3.5 rounded-xl text-white font-medium flex items-center justify-center ${
                      creating || !selectedDoctorId || !topic.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {creating ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Құрылуда...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Консилиум құру және шақыру жіберу
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Консилиуммен бөлісу модальды терезесі */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center">
                <FaUserTie className="mr-3 text-indigo-600" />
                Консилиуммен бөлісу
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Сілтемені басқа әріптеске жіберу
              </p>
            </div>

            <div className="p-6">
              {doctors.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Дәрігерлер тізімі жүктелмеді...
                </p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Әріптесті таңдаңыз:
                  </label>
                  <select
                    value={selectedShareDoctorId}
                    onChange={e => setSelectedShareDoctorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— дәрігерді таңдаңыз —</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} {doc.specialty !== '—' ? `(${doc.specialty})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedShareDoctorId && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm">
                      Email: <strong>
                        {doctors.find(d => d.id === parseInt(selectedShareDoctorId))?.email || 'көрсетілмеген'}
                      </strong>
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={shareConsultation}
                  disabled={sharing || !selectedShareDoctorId}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center ${
                    !selectedShareDoctorId || sharing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {sharing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Жіберілуде...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Сілтемені жіберу
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedShareDoctorId('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Болдырмау
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultations;