import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserInjured, 
  FaCalendar, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaStethoscope,
  FaFileMedical,
  FaPrescriptionBottle,
  FaHistory,
  FaSearch,
  FaDownload,
  FaPrint,
  FaChartLine,
  FaClock,
  FaUserMd,
  FaNotesMedical,
  FaPills,
  FaClipboardList,
} from 'react-icons/fa';
import api from '../../utils/api';

const PatientMedicalHistory = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { token } = useSelector((state) => state.token);

  // Загрузка списка пациентов
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/patient', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data || []);
    } catch (err) {
      console.error('Науқастарды жүктеу қатесі:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка полной истории пациента
  const fetchPatientFullHistory = async (patientId) => {
    try {
      setLoading(true);
      
      console.log('Загрузка истории для пациента:', patientId);

      // Загружаем рецепты (в них есть вся нужная информация)
      const prescriptionsRes = await api.get(`/api/v1/prescription/${patientId}/patient`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Полученные рецепты:', prescriptionsRes.data);
      setPrescriptions(prescriptionsRes.data || []);

      // Загружаем записи на прием
      const appointmentsRes = await api.get(`/api/appointments/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(appointmentsRes.data || []);

    } catch (err) {
      console.error('Тарихты жүктеу қатесі:', err);
    } finally {
      setLoading(false);
    }
  };

  // Выбор пациента
  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    await fetchPatientFullHistory(patient.patientId);
  };

  // Группировка рецептов по медицинским записям
  const getGroupedData = () => {
    if (!prescriptions || prescriptions.length === 0) return [];

    // Группируем по recordId
    const recordsMap = {};

    prescriptions.forEach(prescription => {
      const recordId = prescription.diagnosis?.medicalRecord?.recordId;
      if (!recordId) return;

      if (!recordsMap[recordId]) {
        recordsMap[recordId] = {
          recordId,
          medicalRecord: prescription.diagnosis.medicalRecord,
          diagnoses: {}
        };
      }

      // Группируем по diagnosisId
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

    // Преобразуем в массив
    return Object.values(recordsMap).map(record => ({
      ...record,
      diagnoses: Object.values(record.diagnoses)
    }));
  };

  // Фильтрация пациентов
  const getFilteredPatients = () => {
    let filtered = patients;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.user?.firstName?.toLowerCase().includes(query) ||
        p.user?.lastName?.toLowerCase().includes(query) ||
        p.user?.email?.toLowerCase().includes(query) ||
        p.contactNumber?.includes(query)
      );
    }

    return filtered;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('kk-KZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('kk-KZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Вычисление возраста
  const calculateAge = (birthDate) => {
    if (!birthDate) return '—';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} жас`;
  };

  // Получение статистики
  const getPatientStats = () => {
    if (!selectedPatient) return null;

    const groupedData = getGroupedData();
    const totalRecords = groupedData.length;
    const totalDiagnoses = groupedData.reduce((acc, record) => acc + record.diagnoses.length, 0);
    const totalPrescriptions = prescriptions.length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => 
      a.status === 'completed' || a.status === 'COMPLETED'
    ).length;

    return {
      totalRecords,
      totalDiagnoses,
      totalPrescriptions,
      totalAppointments,
      completedAppointments
    };
  };

  // Проверка на AI диагноз
  const isAIDiagnosis = (diagnosisText) => {
    return diagnosisText?.includes('AI') || 
           diagnosisText?.includes('ЖАСАНДЫ ИНТЕЛЛЕКТ') ||
           diagnosisText?.includes('🤖');
  };

  // Экспорт в PDF
  const handleExportPDF = () => {
    alert('PDF экспорты әзірленуде...');
  };

  // Печать
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token]);

  const filteredPatients = getFilteredPatients();
  const stats = getPatientStats();
  const groupedData = getGroupedData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <FaFileMedical className="mr-4 text-blue-600" />
                Медициналық Тарих
              </h1>
              <p className="text-gray-600">Науқастардың толық медициналық картасы</p>
            </div>
            
            {selectedPatient && (
              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center shadow-md"
                >
                  <FaDownload className="mr-2" />
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center shadow-md"
                >
                  <FaPrint className="mr-2" />
                  Басып шығару
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Левая панель - Список пациентов */}
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-white rounded-2xl shadow-xl border border-gray-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Поиск */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <FaUserInjured className="mr-2" />
                  Науқастар
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Іздеу..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-blue-300 focus:outline-none focus:border-white transition"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Список пациентов */}
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {loading && !selectedPatient ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Жүктелуде...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-8 text-center">
                    <FaUserInjured className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Науқастар табылмады</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.patientId}
                        onClick={() => handlePatientSelect(patient)}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          selectedPatient?.patientId === patient.patientId
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            selectedPatient?.patientId === patient.patientId
                              ? 'bg-white/20'
                              : 'bg-blue-100'
                          }`}>
                            <span className={`font-bold ${
                              selectedPatient?.patientId === patient.patientId
                                ? 'text-white'
                                : 'text-blue-600'
                            }`}>
                              {patient.user?.firstName?.charAt(0)}{patient.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate ${
                              selectedPatient?.patientId === patient.patientId
                                ? 'text-white'
                                : 'text-gray-800'
                            }`}>
                              {patient.user?.firstName} {patient.user?.lastName}
                            </p>
                            <p className={`text-sm truncate ${
                              selectedPatient?.patientId === patient.patientId
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}>
                              ID: {patient.patientId}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Правая панель - Информация о пациенте */}
          <div className="lg:col-span-3">
            {!selectedPatient ? (
              <motion.div 
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Науқасты таңдаңыз</h3>
                <p className="text-gray-500">Толық медициналық тарихты көру үшін солдан науқасты басыңыз</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Карточка пациента */}
                <motion.div 
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex items-center mb-4 md:mb-0">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mr-5 backdrop-blur-sm">
                          <span className="text-3xl font-bold text-white">
                            {selectedPatient.user?.firstName?.charAt(0)}{selectedPatient.user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold mb-1">
                            {selectedPatient.user?.firstName} {selectedPatient.user?.lastName}
                          </h2>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              {selectedPatient.gender === 'MALE' ? '👨 Ер' : selectedPatient.gender === 'FEMALE' ? '👩 Әйел' : '—'}
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              {calculateAge(selectedPatient.dateOfBirth)}
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              ID: {selectedPatient.patientId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Контакты */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                      <div className="flex items-center">
                        <FaEnvelope className="mr-3 text-indigo-200" />
                        <div>
                          <p className="text-xs text-indigo-200">Email</p>
                          <p className="font-medium">{selectedPatient.user?.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaPhone className="mr-3 text-indigo-200" />
                        <div>
                          <p className="text-xs text-indigo-200">Телефон</p>
                          <p className="font-medium">{selectedPatient.contactNumber || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCalendar className="mr-3 text-indigo-200" />
                        <div>
                          <p className="text-xs text-indigo-200">Туған күні</p>
                          <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
                        </div>
                      </div>
                    </div>

                    {selectedPatient.address && (
                      <div className="mt-4 flex items-center">
                        <FaMapMarkerAlt className="mr-3 text-indigo-200" />
                        <div>
                          <p className="text-xs text-indigo-200">Мекенжай</p>
                          <p className="font-medium">{selectedPatient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Статистика */}
                  {stats && (
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                        <FaChartLine className="mr-2 text-indigo-600" />
                        Медициналық Статистика
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-white rounded-xl border-2 border-blue-100 shadow-sm">
                          <div className="text-3xl font-bold text-blue-600">{stats.totalRecords}</div>
                          <div className="text-xs text-gray-600 mt-1">Мед. жазба</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl border-2 border-purple-100 shadow-sm">
                          <div className="text-3xl font-bold text-purple-600">{stats.totalDiagnoses}</div>
                          <div className="text-xs text-gray-600 mt-1">Диагноз</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl border-2 border-green-100 shadow-sm">
                          <div className="text-3xl font-bold text-green-600">{stats.totalPrescriptions}</div>
                          <div className="text-xs text-gray-600 mt-1">Рецепт</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl border-2 border-orange-100 shadow-sm">
                          <div className="text-3xl font-bold text-orange-600">{stats.totalAppointments}</div>
                          <div className="text-xs text-gray-600 mt-1">Кездесу</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl border-2 border-teal-100 shadow-sm">
                          <div className="text-3xl font-bold text-teal-600">{stats.completedAppointments}</div>
                          <div className="text-xs text-gray-600 mt-1">Аяқталған</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Медицинские записи с диагнозами и рецептами */}
                <motion.div 
                  className="bg-white rounded-2xl shadow-xl border border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold flex items-center">
                      <FaFileMedical className="mr-3" />
                      Толық Медициналық Тарих
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Жазбалар → Диагноздар → Рецепттер
                    </p>
                  </div>

                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Жүктелуде...</p>
                      </div>
                    ) : groupedData.length === 0 ? (
                      <div className="text-center py-12">
                        <FaFileMedical className="text-5xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium">Медициналық тарих жоқ</p>
                        <p className="text-gray-500 text-sm mt-2">Науқастың әлі жазбасы, диагнозы немесе рецепті жоқ</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {groupedData.map((record) => (
                          <div 
                            key={record.recordId}
                            className="border-2 border-purple-200 rounded-2xl overflow-hidden"
                          >
                            {/* Заголовок медицинской записи */}
                            <div className="p-5 bg-gradient-to-r from-purple-100 to-pink-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="p-3 bg-purple-600 rounded-xl mr-4">
                                    <FaClipboardList className="text-white text-xl" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-xl">
                                      📋 Медициналық Жазба #{record.recordId}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Жасалған: {formatDate(record.medicalRecord.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {record.diagnoses.length} диагноз
                                  </span>
                                  <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {record.diagnoses.reduce((acc, d) => acc + d.prescriptions.length, 0)} рецепт
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
                                      ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
                                      : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50'
                                  }`}
                                >
                                  {/* Заголовок диагноза */}
                                  <div className="p-5 bg-white/60">
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
                                            📅 {formatDate(diagnosisData.diagnosis.diagnosisDate)}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                        {diagnosisData.prescriptions.length} рецепт
                                      </span>
                                    </div>

                                    {/* Текст диагноза */}
                                    <div className={`p-4 rounded-xl ${
                                      isAIDiagnosis(diagnosisData.diagnosis.diagnosis)
                                        ? 'bg-white border-2 border-purple-200'
                                        : 'bg-white border-2 border-indigo-200'
                                    }`}>
                                      <h6 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
                                        <FaNotesMedical className="mr-2 text-indigo-600" />
                                        Диагноз мәтіні:
                                      </h6>
                                      <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                        {diagnosisData.diagnosis.diagnosis}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Рецепты */}
                                  {diagnosisData.prescriptions.length > 0 && (
                                    <div className="p-5 bg-green-50 border-t-2 border-green-200">
                                      <h6 className="font-bold text-gray-800 mb-4 flex items-center">
                                        <FaPrescriptionBottle className="mr-2 text-green-600 text-xl" />
                                        💊 Рецепттер ({diagnosisData.prescriptions.length}):
                                      </h6>
                                      <div className="space-y-3">
                                        {diagnosisData.prescriptions.map((prescription) => (
                                          <div 
                                            key={prescription.prescriptionId}
                                            className="bg-white p-4 rounded-xl border-2 border-green-300 hover:shadow-lg transition-all"
                                          >
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center">
                                                <div className="p-2 bg-green-500 rounded-lg mr-3">
                                                  <FaPills className="text-white text-lg" />
                                                </div>
                                                <div>
                                                  <p className="font-bold text-gray-800 text-lg">
                                                    💊 Рецепт #{prescription.prescriptionId}
                                                  </p>
                                                  <p className="text-sm text-gray-600">
                                                    📅 {formatDate(prescription.prescriptionDate)}
                                                  </p>
                                                </div>
                                              </div>
                                              {prescription.appointment && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium">
                                                  Кездесу #{prescription.appointment.appointmentId}
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Текст рецепта */}
                                            {prescription.callback && (
                                              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                                <h6 className="font-bold text-gray-700 text-sm mb-2">📋 Рецепт:</h6>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                  {prescription.callback}
                                                </p>
                                              </div>
                                            )}

                                            {/* Информация о враче и кездесу */}
                                            {prescription.appointment && (
                                              <div className="mt-3 pt-3 border-t border-green-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                  {prescription.appointment.doctor && (
                                                    <div className="flex items-center text-gray-700">
                                                      <FaUserMd className="mr-2 text-blue-600" />
                                                      <div>
                                                        <p className="font-medium">
                                                          👨‍⚕️ {prescription.appointment.doctor.user?.firstName} {prescription.appointment.doctor.user?.lastName}
                                                        </p>
                                                        {prescription.appointment.doctor.specialty && (
                                                          <p className="text-xs text-gray-500">
                                                            {prescription.appointment.doctor.specialty}
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                  <div className="flex items-center text-gray-700">
                                                    <FaClock className="mr-2 text-teal-600" />
                                                    <div>
                                                      <p className="font-medium text-xs">Кездесу уақыты:</p>
                                                      <p className="text-xs text-gray-600">
                                                        {formatDateTime(prescription.appointment.appointmentDate)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* История приемов */}
                <motion.div 
                  className="bg-white rounded-2xl shadow-xl border border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold flex items-center">
                      <FaHistory className="mr-3" />
                      Кездесулер Тарихы
                    </h3>
                    <p className="text-teal-100 text-sm mt-1">
                      Барлық кездесулер мен консультациялар
                    </p>
                  </div>

                  <div className="p-6">
                    {appointments.length === 0 ? (
                      <div className="text-center py-12">
                        <FaCalendar className="text-5xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium">Кездесулер жоқ</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((appointment) => (
                          <div 
                            key={appointment.appointmentId}
                            className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="p-2 bg-teal-600 rounded-lg mr-3">
                                  <FaCalendar className="text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">
                                    Кездесу #{appointment.appointmentId}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {formatDateTime(appointment.appointmentDate)}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                appointment.status === 'COMPLETED' || appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'CONFIRMED' || appointment.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : appointment.status === 'CANCELLED' || appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>

                            {appointment.doctor && (
                              <div className="flex items-center text-sm text-gray-700 bg-white p-3 rounded-lg">
                                <FaUserMd className="mr-2 text-teal-600" />
                                <span className="font-medium">
                                  Дәрігер: {appointment.doctor.user?.firstName} {appointment.doctor.user?.lastName}
                                </span>
                                {appointment.doctor.specialty && (
                                  <span className="ml-2 text-gray-500">
                                    • {appointment.doctor.specialty}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;