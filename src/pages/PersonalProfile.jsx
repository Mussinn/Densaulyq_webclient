// src/components/PersonalProfile.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaHistory, 
  FaCalendarCheck, 
  FaFileMedical, 
  FaChartLine,
  FaUserEdit,
  FaBell,
  FaDownload,
  FaUserMd,
  FaPhone,
  FaCalendarAlt,
  FaClipboardCheck,
  FaTimesCircle,
  FaCheckCircle
} from 'react-icons/fa';
import { GiHealthPotion, GiMedicalPack } from 'react-icons/gi';
import { MdHealthAndSafety, MdAccessTimeFilled, MdEmail, MdLocationOn } from 'react-icons/md';
import api from '../../utils/api';

function PersonalProfile() {
  const { token } = useSelector((state) => state.token);
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    scheduledAppointments: 0
  });

  const tabs = [
    { id: 'appointments', label: 'Кездесулер тарихы', icon: <FaHistory /> },
    { id: 'prescriptions', label: 'Тағайындаулар', icon: <FaCalendarCheck /> },
    { id: 'labResults', label: 'Талдау нәтижелері', icon: <FaFileMedical /> },
    { id: 'medicalHistory', label: 'Медициналық тарих', icon: <GiMedicalPack /> },
  ];

  const fetchPatientInfo = async () => {
    try {
      const response = await api.get('/api/v1/patient/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatientInfo(response.data);
      return response.data;
    } catch (error) {
      console.error('Пациент ақпаратын алу қатесі:', error);
      return null;
    }
  };

  const fetchAppointments = async (patientId) => {
    try {
      const response = await api.get(`/api/appointments/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const appointmentsData = response.data || [];
      setAppointments(appointmentsData);
      
      // Рассчитываем статистику
      const now = new Date();
      const completed = appointmentsData.filter(a => 
        a.status === 'COMPLETED' || a.status === 'completed'
      ).length;
      
      const scheduled = appointmentsData.filter(a => 
        (a.status === 'SCHEDULED' || a.status === 'scheduled') && 
        new Date(a.appointmentDate) > now
      ).length;
      
      const cancelled = appointmentsData.filter(a => 
        a.status === 'CANCELLED' || a.status === 'cancelled'
      ).length;
      
      const confirmed = appointmentsData.filter(a => 
        a.status === 'CONFIRMED' || a.status === 'confirmed'
      ).length;
      
      setStats({
        totalAppointments: appointmentsData.length,
        completedAppointments: completed,
        upcomingAppointments: scheduled + confirmed,
        cancelledAppointments: cancelled,
        scheduledAppointments: scheduled + confirmed + completed
      });
      
    } catch (error) {
      console.error('Кездесулерді алу қатесі:', error);
      setAppointments([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Получаем информацию о пациенте
      const patientData = await fetchPatientInfo();
      
      if (patientData && patientData.patientId) {
        // 2. Получаем записи пациента
        await fetchAppointments(patientData.patientId);
      } else {
        console.error('Пациент ID табылмады');
      }
    } catch (error) {
      console.error('Деректерді алу қатесі:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    switch(statusLower) {
      case 'scheduled':
      case 'scheduled':
        return {
          text: 'Жоспарланған',
          color: 'bg-blue-100 text-blue-700',
          icon: <FaCalendarAlt className="text-blue-500" />
        };
      case 'confirmed':
      case 'confirmed':
        return {
          text: 'Расталған',
          color: 'bg-green-100 text-green-700',
          icon: <FaClipboardCheck className="text-green-500" />
        };
      case 'completed':
      case 'completed':
        return {
          text: 'Аяқталған',
          color: 'bg-gray-100 text-gray-700',
          icon: <FaCheckCircle className="text-gray-500" />
        };
      case 'cancelled':
      case 'cancelled':
        return {
          text: 'Болдырмаған',
          color: 'bg-red-100 text-red-700',
          icon: <FaTimesCircle className="text-red-500" />
        };
      default:
        return {
          text: status || 'Белгісіз',
          color: 'bg-yellow-100 text-yellow-700',
          icon: <FaBell className="text-yellow-500" />
        };
    }
  };

  const renderAppointments = () => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MdAccessTimeFilled className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Әзірше кездесулер жоқ</p>
          <p className="text-sm text-gray-400">Онлайн қабылдауға жазылыңыз</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Кездесулер тарихы</h3>
          <span className="text-sm text-gray-500">
            Барлығы: {appointments.length} кездесу
          </span>
        </div>
        
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const statusInfo = getStatusInfo(appointment.status);
            const appointmentDate = new Date(appointment.appointmentDate);
            const isPast = appointmentDate < new Date();
            
            return (
              <div key={appointment.appointmentId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(appointment.appointmentDate)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-3">
                          <FaUserMd className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">
                            Др. {appointment.doctor?.user?.firstName || 'Дәрігер'} {appointment.doctor?.user?.lastName || ''}
                          </h4>
                          <p className="text-gray-600">{appointment.doctor?.specialty || 'Жалпы дәрігер'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MdEmail className="mr-2 text-gray-400" />
                        <span>{appointment.doctor?.user?.email || 'Email белгісіз'}</span>
                      </div>
                      {appointment.doctor?.contactNumber && (
                        <div className="flex items-center text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          <span>{appointment.doctor.contactNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:text-right">
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-emerald-600">
                        ID: {appointment.appointmentId}
                      </div>
                      <p className="text-sm text-gray-500">Кездесу нөмірі</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {appointment.status === 'SCHEDULED' || appointment.status === 'scheduled' ? (
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                          Растау сұрау
                        </button>
                      ) : appointment.status === 'CONFIRMED' || appointment.status === 'confirmed' ? (
                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                          Кездесуді бастау
                        </button>
                      ) : null}
                      
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                        Толығырақ
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Жасалған: {formatDate(appointment.createdAt)}
                    </div>
                    {isPast && (
                      <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
                        <FaFileMedical className="mr-1" />
                        Есепті көру
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return renderAppointments();

      case 'prescriptions':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Тағайындаулар</h3>
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <GiMedicalPack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Әзірше тағайындаулар жоқ</p>
              <p className="text-sm text-gray-400 mt-1">Кездесулерден кейін тағайындаулар осында пайда болады</p>
            </div>
          </div>
        );

      case 'labResults':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Талдау нәтижелері</h3>
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FaFileMedical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Әзірше талдау нәтижелері жоқ</p>
              <p className="text-sm text-gray-400 mt-1">Лабораториялық талдаулардан кейін нәтижелер осында пайда болады</p>
            </div>
          </div>
        );

      case 'medicalHistory':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Медициналық тарих</h3>
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <GiMedicalPack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Медициналық тарих әзірше толтырылмаған</p>
              <p className="text-sm text-gray-400 mt-1">Дәрігер сіздің медициналық тарихыңызды осында жазады</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Жеке кабинет</h1>
          <p className="text-gray-600">Медициналық тарихыңыз, тағайындауларыңыз және талдау нәтижелеріңіз</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковая панель с информацией о пациенте */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              {patientInfo && (
                <div className="mb-8">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full flex items-center justify-center mb-4">
                      <GiHealthPotion className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {patientInfo.user?.firstName || 'Аты'} {patientInfo.user?.lastName || 'Жоқ'}
                      </h3>
                      <p className="text-sm text-gray-500">Пациент ID: {patientInfo.patientId}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-700">
                      <MdEmail className="mr-3 text-gray-400" />
                      <span className="text-sm">{patientInfo.user?.email || 'Email белгісіз'}</span>
                    </div>
                    {patientInfo.contactNumber && (
                      <div className="flex items-center text-gray-700">
                        <FaPhone className="mr-3 text-gray-400" />
                        <span className="text-sm">{patientInfo.contactNumber}</span>
                      </div>
                    )}
                    {patientInfo.address && (
                      <div className="flex items-center text-gray-700">
                        <MdLocationOn className="mr-3 text-gray-400" />
                        <span className="text-sm">{patientInfo.address}</span>
                      </div>
                    )}
                    {patientInfo.dateOfBirth && (
                      <div className="flex items-center text-gray-700">
                        <FaCalendarAlt className="mr-3 text-gray-400" />
                        <span className="text-sm">
                          Туған күні: {new Date(patientInfo.dateOfBirth).toLocaleDateString('kk-KZ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-8">
                <h4 className="font-bold text-gray-800 mb-4">Статистика</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Барлық кездесулер:</span>
                    <span className="font-bold text-gray-800">{stats.totalAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Аяқталған:</span>
                    <span className="font-bold text-green-600">{stats.completedAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Алдағы:</span>
                    <span className="font-bold text-blue-600">{stats.upcomingAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Болдырмаған:</span>
                    <span className="font-bold text-red-600">{stats.cancelledAppointments}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="font-bold text-gray-800 mb-4">Жедел әрекеттер</h4>
                <div className="space-y-3">
                  <button 
                    onClick={() => fetchData()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                  >
                    <FaBell className="mr-2" />
                    Деректерді жаңарту
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">
                    <FaDownload className="mr-2" />
                    Профильді жүктеу
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  <span className="ml-3 text-gray-600">Деректер жүктелуде...</span>
                </div>
              ) : (
                renderContent()
              )}
            </motion.div>
            
            {/* Медицинская информация */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center mb-3">
                  <MdHealthAndSafety className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-bold text-gray-800">Аллергиялар</h4>
                </div>
                <p className="text-sm text-gray-600">Аллергиялар тіркелмеген</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <div className="flex items-center mb-3">
                  <GiMedicalPack className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-bold text-gray-800">Мәңгілік аурулар</h4>
                </div>
                <p className="text-sm text-gray-600">Тіркелген аурулар жоқ</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
                <div className="flex items-center mb-3">
                  <FaFileMedical className="w-6 h-6 text-purple-600 mr-3" />
                  <h4 className="font-bold text-gray-800">Соңғы кездесу</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {appointments.length > 0 
                    ? formatDate(appointments[0]?.appointmentDate)
                    : 'Әзірше кездесу жоқ'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalProfile;