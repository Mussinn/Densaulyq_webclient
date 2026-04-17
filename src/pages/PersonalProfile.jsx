// src/components/PersonalProfile.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHistory, 
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
  FaCheckCircle,
  FaTimes,
  FaPrescriptionBottle,
  FaPills,
  FaNotesMedical,
  FaStethoscope,
  FaFlask,
  FaFileAlt,
  FaImage,
  FaLock,
  FaLockOpen,
  FaDiagnoses,
  FaEye
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
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [labResults, setLabResults] = useState([]);
  const [loadingLabResults, setLoadingLabResults] = useState(false);
  
  // Для модального окна деталей кездесу
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Для модального окна расшифровки диагноза
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedDiagnosis, setDecryptedDiagnosis] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    scheduledAppointments: 0
  });

  const tabs = [
    { id: 'appointments', label: 'Кездесулер тарихы', icon: <FaHistory /> },
    { id: 'medicalHistory', label: 'Медициналық тарих', icon: <GiMedicalPack /> },
    { id: 'labResults', label: 'Талдау нәтижелері', icon: <FaFileMedical /> },
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

  const fetchMedicalHistory = async (userId) => {
    try {
      setLoadingMedicalHistory(true);
      const response = await api.get(`/api/v1/diagnosis/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Медициналық тарих (диагноздар):', response.data);
      setMedicalHistory(response.data || []);
      
    } catch (error) {
      console.error('Медициналық тарихты алу қатесі:', error);
      setMedicalHistory([]);
    } finally {
      setLoadingMedicalHistory(false);
    }
  };

  const fetchLabResults = async (patientId) => {
    try {
      setLoadingLabResults(true);
      const response = await api.get(`/api/v1/test/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Талдау нәтижелері:', response.data);
      setLabResults(response.data || []);
      
    } catch (error) {
      console.error('Талдау нәтижелерін алу қатесі:', error);
      setLabResults([]);
    } finally {
      setLoadingLabResults(false);
    }
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/api/v1/prescription/${appointmentId}/appointment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Кездесу детальдары:', response.data);
      setAppointmentDetails(response.data || []);
      
    } catch (error) {
      console.error('Кездесу детальдарын алу қатесі:', error);
      setAppointmentDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleShowDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
    await fetchAppointmentDetails(appointment.appointmentId);
  };

  // Функция для скачивания файлов (как в MedicalTestsPage)
  const handleDownloadFile = async (url, filename) => {
    if (!url) {
      alert('Файл URL-і табылмады');
      return;
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Файлды жүктеу кезінде қате');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      console.error('Файлды жүктеу қатесі:', err);
      alert('Файлды жүктеу қатесі. Файлды жаңа қойында ашып көріңіз.');
      window.open(url, '_blank');
    }
  };

  // Функция для просмотра изображения
  const handleViewImage = (url) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  // Открытие модального окна расшифровки диагноза
  const handleDecryptDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setDecryptionKey('');
    setDecryptedDiagnosis('');
    setDecryptError('');
    setShowDecryptModal(true);
  };

  // Функция расшифровки диагноза
  const handleDecryptSubmit = async () => {
    if (!decryptionKey.trim()) {
      setDecryptError('Шифрлау кілтін енгізіңіз');
      return;
    }

    setDecrypting(true);
    setDecryptError('');

    try {
      // Отправляем запрос на расшифровку
      const response = await api.post('/api/v1/diagnosis/decrypt', {
        diagnosisId: selectedDiagnosis.diagnosisId,
        encryptionKey: decryptionKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDecryptedDiagnosis(response.data.decryptedText || response.data.diagnosis);
      
    } catch (err) {
      console.error('Диагнозды шешу қатесі:', err);
      setDecryptError(err.response?.data?.message || 'Диагнозды шешу мүмкін болмады. Кілт дұрыс емес.');
    } finally {
      setDecrypting(false);
    }
  };

  // Закрытие модального окна расшифровки
  const closeDecryptModal = () => {
    setShowDecryptModal(false);
    setSelectedDiagnosis(null);
    setDecryptionKey('');
    setDecryptedDiagnosis('');
    setDecryptError('');
    setDecrypting(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const patientData = await fetchPatientInfo();
      
      if (patientData && patientData.patientId) {
        await fetchAppointments(patientData.patientId);
        
        if (patientData.user && patientData.user.userId) {
          await fetchMedicalHistory(patientData.user.userId);
        } else {
          console.error('userId табылмады');
        }
        
        await fetchLabResults(patientData.patientId);
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

  const formatDateShort = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    switch(statusLower) {
      case 'scheduled':
        return {
          text: 'Жоспарланған',
          color: 'bg-blue-100 text-blue-700',
          icon: <FaCalendarAlt className="text-blue-500" />
        };
      case 'confirmed':
        return {
          text: 'Расталған',
          color: 'bg-green-100 text-green-700',
          icon: <FaClipboardCheck className="text-green-500" />
        };
      case 'completed':
        return {
          text: 'Аяқталған',
          color: 'bg-gray-100 text-gray-700',
          icon: <FaCheckCircle className="text-gray-500" />
        };
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

  const isAIDiagnosis = (diagnosisText) => {
    return diagnosisText?.includes('AI') || 
           diagnosisText?.includes('ЖАСАНДЫ ИНТЕЛЛЕКТ') ||
           diagnosisText?.includes('🤖');
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
                      <button 
                        onClick={() => handleShowDetails(appointment)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition text-sm font-medium shadow-md"
                      >
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMedicalHistory = () => {
    if (loadingMedicalHistory) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      );
    }

    if (!medicalHistory || medicalHistory.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <GiMedicalPack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Медициналық тарих әзірше толтырылмаған</p>
          <p className="text-sm text-gray-400 mt-1">Дәрігер сізге диагноз қойғаннан кейін осында пайда болады</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FaDiagnoses className="mr-2 text-purple-600" />
            Диагноздар тізімі
          </h3>
          <span className="text-sm text-gray-500">
            Барлығы: {medicalHistory.length} диагноз
          </span>
        </div>

        <div className="space-y-4">
          {medicalHistory.map((diagnosis) => (
            <div
              key={diagnosis.diagnosisId}
              className={`border-2 rounded-xl overflow-hidden ${
                isAIDiagnosis(diagnosis.diagnosis)
                  ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
                  : 'border-indigo-200 bg-white'
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl mr-3 ${
                      isAIDiagnosis(diagnosis.diagnosis)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-indigo-600'
                    }`}>
                      {isAIDiagnosis(diagnosis.diagnosis) ? (
                        <span className="text-white text-2xl">🤖</span>
                      ) : (
                        <FaStethoscope className="text-white text-xl" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-gray-800 text-lg">
                          🩺 Диагноз №{diagnosis.diagnosisId}
                        </h5>
                        {isAIDiagnosis(diagnosis.diagnosis) && (
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                            🤖 AI Диагноз
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {formatDateShort(diagnosis.diagnosisDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaLock className="text-gray-400 text-sm" />
                    <span className="text-xs text-gray-500">Шифрленген</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-4 ${
                  isAIDiagnosis(diagnosis.diagnosis)
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-indigo-50 border-2 border-indigo-200'
                }`}>
                  <h6 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
                    <FaNotesMedical className="mr-2 text-indigo-600" />
                    Шифрленген диагноз мәтіні:
                  </h6>
                  <div className="text-gray-700 text-sm leading-relaxed max-h-40 overflow-y-auto font-mono break-all">
                    {diagnosis.diagnosis ? diagnosis.diagnosis.substring(0, 200) + '...' : 'Диагноз мәтіні жоқ'}
                  </div>
                </div>

                {diagnosis.appointment?.doctor && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <FaUserMd className="text-blue-600 text-lg mr-3" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          Дәрігер: {diagnosis.appointment.doctor.user?.firstName} {diagnosis.appointment.doctor.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {diagnosis.appointment.doctor.specialty}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => handleDecryptDiagnosis(diagnosis)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition text-sm font-medium"
                  >
                    <FaLockOpen className="text-sm" />
                    Диагнозды шешу
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLabResults = () => {
    if (loadingLabResults) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      );
    }

    if (!labResults || labResults.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaFlask className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Әзірше талдау нәтижелері жоқ</p>
          <p className="text-sm text-gray-400 mt-1">Лабораториялық талдаулардан кейін нәтижелер осында пайда болады</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Талдау нәтижелері</h3>
          <span className="text-sm text-gray-500">
            Барлығы: {labResults.length} талдау
          </span>
        </div>

        <div className="grid gap-4">
          {labResults.map((test) => (
            <div 
              key={test.testId}
              className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-600 rounded-xl mr-4">
                      <FaFlask className="text-white text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        🔬 {test.testName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        📅 {formatDate(test.testDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      ID: {test.testId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {test.result && (
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-4">
                    <h6 className="font-bold text-gray-800 mb-3 flex items-center">
                      <FaFileAlt className="mr-2 text-blue-600" />
                      📊 Нәтиже:
                    </h6>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {test.result}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.imageUrl && (
                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center mb-3">
                        <FaImage className="text-purple-600 mr-2" />
                        <h6 className="font-bold text-gray-800">Сурет</h6>
                      </div>
                      <img 
                        src={test.imageUrl} 
                        alt={test.testName}
                        className="w-full h-48 object-cover rounded-lg border-2 border-purple-300 cursor-pointer hover:opacity-90 transition"
                        onClick={() => handleViewImage(test.imageUrl)}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewImage(test.imageUrl)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                          <FaEye className="text-sm" />
                          Суретті қарау
                        </button>
                        <button
                          onClick={() => handleDownloadFile(test.imageUrl, `${test.testName}.jpg`)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium"
                        >
                          <FaDownload className="text-sm" />
                          Жүктеу
                        </button>
                      </div>
                    </div>
                  )}

                  {test.fileUrl && (
                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="flex items-center mb-3">
                        <FaFileAlt className="text-green-600 mr-2" />
                        <h6 className="font-bold text-gray-800">Құжат</h6>
                      </div>
                      <div className="flex items-center justify-center h-32 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-center">
                          <FaFileAlt className="text-4xl text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">{test.fileUrl.split('/').pop()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(test.fileUrl, test.fileUrl.split('/').pop())}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <FaDownload className="text-sm" />
                        Құжатты жүктеу
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Жасалған: {formatDate(test.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return renderAppointments();
      case 'medicalHistory':
        return renderMedicalHistory();
      case 'labResults':
        return renderLabResults();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Жеке кабинет</h1>
          <p className="text-gray-600">Медициналық тарихыңыз, кездесулеріңіз және талдау нәтижелеріңіз</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                </div>
              </div>
            </div>
          </div>

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

      {/* Модальное окно деталей кездесу */}
      <AnimatePresence>
        {showDetailsModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl mr-4">
                      <FaFileMedical className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Кездесу детальдары</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Кездесу #{selectedAppointment.appointmentId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingDetails ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Жүктелуде...</p>
                  </div>
                ) : !appointmentDetails || appointmentDetails.length === 0 ? (
                  <div className="text-center py-12">
                    <FaFileMedical className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">Рецепттер мен диагноздар жоқ</p>
                    <p className="text-gray-500 text-sm mt-2">Бұл кездесу үшін әлі рецепт жазылмаған</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {appointmentDetails.map((prescription) => (
                      <div key={prescription.prescriptionId} className="border-2 border-indigo-200 rounded-xl overflow-hidden">
                        {prescription.diagnosis && (
                          <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <div className={`p-3 rounded-xl mr-3 ${
                                  isAIDiagnosis(prescription.diagnosis.diagnosis)
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                    : 'bg-indigo-600'
                                }`}>
                                  {isAIDiagnosis(prescription.diagnosis.diagnosis) ? (
                                    <span className="text-white text-2xl">🤖</span>
                                  ) : (
                                    <FaStethoscope className="text-white text-xl" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-800 text-lg">
                                      Диагноз #{prescription.diagnosis.diagnosisId}
                                    </h3>
                                    {isAIDiagnosis(prescription.diagnosis.diagnosis) && (
                                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                        🤖 AI
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {formatDateShort(prescription.diagnosis.diagnosisDate)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDecryptDiagnosis(prescription.diagnosis)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium"
                              >
                                <FaLockOpen className="text-xs" />
                                Шешу
                              </button>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-indigo-200">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {prescription.diagnosis.diagnosis?.substring(0, 150)}...
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="p-5 bg-green-50 border-t-2 border-green-200">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-green-500 rounded-lg mr-3">
                              <FaPills className="text-white text-lg" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                Рецепт #{prescription.prescriptionId}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {formatDateShort(prescription.prescriptionDate)}
                              </p>
                            </div>
                          </div>
                          {prescription.callback && (
                            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {prescription.callback}
                              </p>
                            </div>
                          )}
                        </div>

                        {prescription.appointment?.doctor && (
                          <div className="p-5 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center">
                              <FaUserMd className="text-blue-600 text-xl mr-3" />
                              <div>
                                <p className="font-medium text-gray-800">
                                  Др. {prescription.appointment.doctor.user?.firstName} {prescription.appointment.doctor.user?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {prescription.appointment.doctor.specialty}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно расшифровки диагноза */}
      <AnimatePresence>
        {showDecryptModal && selectedDiagnosis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={closeDecryptModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 sticky top-0 z-10 ${
                isAIDiagnosis(selectedDiagnosis.diagnosis)
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl mr-4">
                      {isAIDiagnosis(selectedDiagnosis.diagnosis) ? (
                        <span className="text-2xl">🤖</span>
                      ) : (
                        <FaDiagnoses className="text-2xl" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Диагнозды шешу</h2>
                      <p className="text-white/80 text-sm mt-1">
                        Диагноз №{selectedDiagnosis.diagnosisId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDecryptModal}
                    className="p-2 hover:bg-white/20 rounded-xl transition"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!decryptedDiagnosis ? (
                  <>
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start">
                        <FaLock className="text-yellow-600 text-xl mr-3 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-gray-800 mb-1">Шифрланған диагноз</h3>
                          <p className="text-sm text-gray-700">
                            Бұл диагноз қорғалған. Оны оқу үшін арнайы кілт қажет.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded-lg font-mono text-xs break-all">
                        {selectedDiagnosis.diagnosis}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Шифрлау кілтін енгізіңіз:
                      </label>
                      <input
                        type="text"
                        value={decryptionKey}
                        onChange={(e) => setDecryptionKey(e.target.value)}
                        placeholder="Кілтті енгізіңіз..."
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleDecryptSubmit()}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Кілтті дәрігерден немесе электрондық поштадан алуға болады
                      </p>
                    </div>

                    {decryptError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                        {decryptError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleDecryptSubmit}
                        disabled={decrypting || !decryptionKey.trim()}
                        className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                          decrypting || !decryptionKey.trim()
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                        }`}
                      >
                        {decrypting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Шешу...
                          </>
                        ) : (
                          <>
                            <FaLockOpen />
                            Диагнозды шешу
                          </>
                        )}
                      </button>
                      <button
                        onClick={closeDecryptModal}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                      >
                        Болдырмау
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-5 mb-6">
                      <div className="flex items-center mb-4">
                        <FaLockOpen className="text-emerald-600 text-xl mr-3" />
                        <h3 className="font-bold text-gray-800 text-lg">Шешілген диагноз</h3>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-200">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {decryptedDiagnosis}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setDecryptedDiagnosis('');
                          setDecryptionKey('');
                        }}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
                      >
                        Басқа кілтпен қайта шешу
                      </button>
                      <button
                        onClick={closeDecryptModal}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                      >
                        Жабу
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PersonalProfile;