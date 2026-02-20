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
  FaImage
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

  // Загрузка медицинской истории пациента
  const fetchMedicalHistory = async (patientId) => {
    try {
      setLoadingMedicalHistory(true);
      const response = await api.get(`/api/v1/prescription/${patientId}/patient`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Медициналық тарих:', response.data);
      setMedicalHistory(response.data || []);
      
    } catch (error) {
      console.error('Медициналық тарихты алу қатесі:', error);
      setMedicalHistory([]);
    } finally {
      setLoadingMedicalHistory(false);
    }
  };

  // Загрузка результатов лабораторных анализов
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

  // Загрузка деталей кездесу (рецепты, диагнозы)
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

  // Открытие модального окна с деталями
  const handleShowDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
    await fetchAppointmentDetails(appointment.appointmentId);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Получаем информацию о пациенте
      const patientData = await fetchPatientInfo();
      
      if (patientData && patientData.patientId) {
        // 2. Получаем записи пациента
        await fetchAppointments(patientData.patientId);
        // 3. Получаем медицинскую историю
        await fetchMedicalHistory(patientData.patientId);
        // 4. Получаем результаты лабораторных анализов
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

  // Проверка на AI диагноз
  const isAIDiagnosis = (diagnosisText) => {
    return diagnosisText?.includes('AI') || 
           diagnosisText?.includes('ЖАСАНДЫ ИНТЕЛЛЕКТ') ||
           diagnosisText?.includes('🤖');
  };

  // Группировка медицинской истории
  const getGroupedMedicalHistory = () => {
    if (!medicalHistory || medicalHistory.length === 0) return [];

    const recordsMap = {};

    medicalHistory.forEach(prescription => {
      const recordId = prescription.diagnosis?.medicalRecord?.recordId;
      if (!recordId) return;

      if (!recordsMap[recordId]) {
        recordsMap[recordId] = {
          recordId,
          medicalRecord: prescription.diagnosis.medicalRecord,
          diagnoses: {}
        };
      }

      const diagnosisId = prescription.diagnosis?.diagnosisId;
      if (!recordsMap[recordId].diagnoses[diagnosisId]) {
        recordsMap[recordId].diagnoses[diagnosisId] = {
          diagnosisId,
          diagnosis: prescription.diagnosis,
          prescriptions: []
        };
      }

      recordsMap[recordId].diagnoses[diagnosisId].prescriptions.push(prescription);
    });

    return Object.values(recordsMap).map(record => ({
      ...record,
      diagnoses: Object.values(record.diagnoses)
    }));
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
    const groupedData = getGroupedMedicalHistory();

    if (loadingMedicalHistory) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      );
    }

    if (groupedData.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <GiMedicalPack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Медициналық тарих әзірше толтырылмаған</p>
          <p className="text-sm text-gray-400 mt-1">Дәрігер сіздің медициналық тарихыңызды осында жазады</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Медициналық тарих</h3>
          <span className="text-sm text-gray-500">
            Барлығы: {groupedData.length} жазба
          </span>
        </div>

        {groupedData.map((record) => (
          <div 
            key={record.recordId}
            className="border-2 border-purple-200 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50"
          >
            {/* Заголовок записи */}
            <div className="p-5 bg-gradient-to-r from-purple-100 to-pink-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-600 rounded-xl mr-4">
                    <FaFileMedical className="text-white text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xl">
                      📋 Медициналық Жазба #{record.recordId}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Жасалған: {formatDateShort(record.medicalRecord.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                    {record.diagnoses.length} диагноз
                  </span>
                </div>
              </div>
            </div>

            {/* Диагнозы */}
            <div className="p-6 space-y-4">
              {record.diagnoses.map((diagnosisData) => (
                <div
                  key={diagnosisData.diagnosisId}
                  className={`border-2 rounded-xl overflow-hidden ${
                    isAIDiagnosis(diagnosisData.diagnosis.diagnosis)
                      ? 'border-purple-300 bg-white'
                      : 'border-indigo-200 bg-white'
                  }`}
                >
                  {/* Заголовок диагноза */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-xl mr-3 ${
                          isAIDiagnosis(diagnosisData.diagnosis.diagnosis)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-indigo-600'
                        }`}>
                          {isAIDiagnosis(diagnosisData.diagnosis.diagnosis) ? (
                            <span className="text-white text-2xl">🤖</span>
                          ) : (
                            <FaStethoscope className="text-white text-xl" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-gray-800 text-lg">
                              🩺 Диагноз #{diagnosisData.diagnosisId}
                            </h5>
                            {isAIDiagnosis(diagnosisData.diagnosis.diagnosis) && (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                                🤖 AI Диагноз
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {formatDateShort(diagnosisData.diagnosis.diagnosisDate)}
                          </p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                        {diagnosisData.prescriptions.length} рецепт
                      </span>
                    </div>

                    {/* Текст диагноза */}
                    <div className={`p-4 rounded-xl mb-4 ${
                      isAIDiagnosis(diagnosisData.diagnosis.diagnosis)
                        ? 'bg-purple-50 border-2 border-purple-200'
                        : 'bg-indigo-50 border-2 border-indigo-200'
                    }`}>
                      <h6 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
                        <FaNotesMedical className="mr-2 text-indigo-600" />
                        Диагноз мәтіні:
                      </h6>
                      <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed max-h-60 overflow-y-auto">
                        {diagnosisData.diagnosis.diagnosis}
                      </div>
                    </div>

                    {/* Рецепты */}
                    {diagnosisData.prescriptions.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                        <h6 className="font-bold text-gray-800 mb-3 flex items-center">
                          <FaPrescriptionBottle className="mr-2 text-green-600" />
                          💊 Рецепттер ({diagnosisData.prescriptions.length}):
                        </h6>
                        <div className="space-y-3">
                          {diagnosisData.prescriptions.map((prescription) => (
                            <div 
                              key={prescription.prescriptionId}
                              className="bg-white p-4 rounded-lg border border-green-300"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                                    <FaPills className="text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-800">
                                      💊 Рецепт #{prescription.prescriptionId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {formatDateShort(prescription.prescriptionDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {prescription.callback && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {prescription.callback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
              {/* Заголовок теста */}
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

              {/* Результаты */}
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

                {/* Файлы и изображения */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.imageUrl && (
                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center mb-3">
                        <FaImage className="text-purple-600 mr-2" />
                        <h6 className="font-bold text-gray-800">Сурет</h6>
                      </div>
                      <a 
                        href={test.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img 
                          src={test.imageUrl} 
                          alt={test.testName}
                          className="w-full h-48 object-cover rounded-lg border-2 border-purple-300 hover:border-purple-500 transition"
                        />
                      </a>
                      <a 
                        href={test.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        <FaImage className="mr-1" />
                        Суретті ашу
                      </a>
                    </div>
                  )}

                  {test.fileUrl && (
                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="flex items-center mb-3">
                        <FaFileAlt className="text-green-600 mr-2" />
                        <h6 className="font-bold text-gray-800">Файл</h6>
                      </div>
                      <div className="flex items-center justify-center h-48 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-center">
                          <FaFileAlt className="text-5xl text-green-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">Құжат қол жетімді</p>
                        </div>
                      </div>
                      <a 
                        href={test.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        <FaDownload className="mr-1" />
                        Файлды жүктеу
                      </a>
                    </div>
                  )}
                </div>

                {/* Дата создания */}
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
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Жеке кабинет</h1>
          <p className="text-gray-600">Медициналық тарихыңыз, кездесулеріңіз және талдау нәтижелеріңіз</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковая панель */}
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
              {/* Заголовок */}
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

              {/* Контент */}
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
                        {/* Диагноз */}
                        {prescription.diagnosis && (
                          <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50">
                            <div className="flex items-center mb-4">
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
                            <div className="bg-white p-4 rounded-lg border border-indigo-200">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {prescription.diagnosis.diagnosis}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Рецепт */}
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

                        {/* Информация о враче */}
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
    </div>
  );
}

export default PersonalProfile;