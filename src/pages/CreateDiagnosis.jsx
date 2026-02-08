import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const DiagnosisPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [diagnosisForm, setDiagnosisForm] = useState({
    patientId: '',
    recordId: '',
    diagnosisText: '',
    useTemplate: false,
    selectedTemplate: ''
  });
  const [createdDiagnosis, setCreatedDiagnosis] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: '',
    prescription: '',
    comment: '',
    showForm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const { token } = useSelector((state) => state.token);

  // Шаблоны диагнозов
  const diagnosisTemplates = [
    {
      id: 'common_cold',
      name: 'Жай салқын',
      text: 'Өткір респираторлық инфекция. Құрғақ жөтел, мұрын қабынуы, дене қызуы 37.5-38°C. Қажет: дем алу, сұйықтықты көп ішу, парацетамол 500 мг таблеткасын күніне 3 рет тамақтан кейін.'
    },
    {
      id: 'hypertension',
      name: 'Артериалды гипертензия',
      text: 'Артериялық қысымның жоғарылауы. Қазіргі қысымы 150/95 мм сын.бағ. Қажет: тұзды азықтарды шектеу, жүріс жасау, стрестен аулақ болу. Дәрі: лизиноприл 10 мг күніне 1 рет таңертең.'
    },
    {
      id: 'gastritis',
      name: 'Гастрит',
      text: 'Өңеш қабынуы, ауыз ішінің қышуы, тамақтан кейінгі ауырсыну. Қажет: майлы, ащы азықтардан аулақ болу, асқазанды үш күн тыныштыру. Дәрі: омепразол 20 мг күніне 2 рет тамақтан 30 минут бұрын.'
    },
    {
      id: 'bronchitis',
      name: 'Бронхит',
      text: 'Өткір бронх қабынуы. Ылғалды жөтел, кеуде ауырсынуы, қабыну. Қажет: ыстық сусындар ішу, ингаляциялар жасау, демалу. Дәрі: амброксол 30 мг күніне 3 рет, амоксициллин 500 мг күніне 3 рет 7 күн.'
    },
    {
      id: 'arthritis',
      name: 'Буын қабынуы',
      text: 'Буындардың қабынуы мен ауырсынуы, қызметтің шектелуі. Қажет: буындарды жүктемеден сақтау, суықтан аулақ болу. Дәрі: диклофенак 50 мг күніне 2 рет, глюкозамин 1500 мг күніне 1 рет.'
    }
  ];

  // Загрузка списка пациентов
  const fetchPatients = async () => {
    try {
      if (!token) {
        throw new Error('Токен жоқ');
      }
      const response = await api.get('/api/v1/patient', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (err) {
      setError('Науқастарды жүктеу қатесі: ' + (err.response?.data?.message || err.message));
    }
  };

  // Загрузка медицинских записей для выбранного пациента
  const fetchMedicalRecords = async (patientId) => {
    try {
      if (!patientId) return;
      const response = await api.get(`/api/v1/patient/medical-record/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicalRecords(response.data || []);
    } catch (err) {
      console.log('Медициналық жазбалар қатесі:', err);
      setMedicalRecords([]);
    }
  };

  // Загрузка записей на прием для выбранного пациента
  const fetchPatientAppointments = async (patientId) => {
    try {
      if (!patientId) return;
      
      const response = await api.get(`/api/appointments/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const completedAppointments = (response.data || []).filter(app => 
        app.status === 'COMPLETED' || app.status === 'completed' || app.status === 'CONFIRMED'
      );
      
      setPatientAppointments(completedAppointments);
    } catch (err) {
      console.error('Кездесулерді жүктеу қатесі:', err);
      setPatientAppointments([]);
    }
  };

  // Применение шаблона диагноза
  const applyTemplate = (templateId) => {
    const template = diagnosisTemplates.find(t => t.id === templateId);
    if (template) {
      setDiagnosisForm(prev => ({
        ...prev,
        diagnosisText: template.text,
        selectedTemplate: templateId
      }));
    }
  };

  // Создание диагноза
  const createDiagnosis = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreatedDiagnosis(null);
    setIsLoading(true);

    try {
      if (!token) {
        throw new Error('Токен жоқ');
      }
      
      const patientId = Number(diagnosisForm.patientId);
      
      if (!patientId) {
        throw new Error('Науқасты таңдаңыз');
      }
      
      if (!diagnosisForm.diagnosisText.trim()) {
        throw new Error('Диагноз мәтінін енгізіңіз');
      }
      
      let finalRecordId = diagnosisForm.recordId ? Number(diagnosisForm.recordId) : null;
      
      // Если нет медицинской записи, создаем ее
      if (!finalRecordId && medicalRecords.length > 0) {
        finalRecordId = medicalRecords[0].recordId;
      }
      
      if (!finalRecordId) {
        throw new Error('Науқастың медициналық жазбасы жоқ');
      }
      
      const payload = {
        patientId: patientId,
        recordId: finalRecordId,
        diagnosisText: diagnosisForm.diagnosisText.trim(),
      };
      
      console.log('Диагноз жасау:', payload);

      const response = await api.post('/api/v1/diagnosis/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const newDiagnosis = response.data;
      console.log('Жаңа диагноз:', newDiagnosis);
      
      if (!newDiagnosis?.diagnosisId) {
        throw new Error('Сервер диагноз ID қайтармады');
      }
      
      setCreatedDiagnosis(newDiagnosis);
      setSuccess(`Диагноз сәтті жасалды! Диагноз ID: ${newDiagnosis.diagnosisId}`);
      
      setPrescriptionForm({
        appointmentId: patientAppointments.length > 0 ? patientAppointments[0].appointmentId.toString() : '',
        prescription: '',
        comment: '',
        showForm: true,
      });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      setError(`Диагноз жасау қатесі: ${errorMessage}`);
      console.error('Диагноз қатесі:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Создание рецепта
  const createPrescription = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingPrescription(true);

    try {
      console.log('Рецепт жасау:', {
        createdDiagnosis,
        prescriptionForm
      });
      
      if (!createdDiagnosis?.diagnosisId) {
        throw new Error('Диагноз жасалмаған. Алдымен диагноз жасаңыз.');
      }
      
      if (!prescriptionForm.appointmentId) {
        throw new Error('Кездесуді таңдаңыз');
      }
      
      const appointmentId = Number(prescriptionForm.appointmentId);
      
      if (isNaN(appointmentId) || !appointmentId) {
        throw new Error('Кездесу ID жарамсыз');
      }
      
      // Формируем callback текст
      let callbackText = '';
      
      if (prescriptionForm.prescription && prescriptionForm.comment) {
        callbackText = `РЕЦЕПТ: ${prescriptionForm.prescription}\nКОММЕНТАРИЙ: ${prescriptionForm.comment}`;
      } else if (prescriptionForm.prescription) {
        callbackText = `РЕЦЕПТ: ${prescriptionForm.prescription}`;
      } else if (prescriptionForm.comment) {
        callbackText = `КОММЕНТАРИЙ: ${prescriptionForm.comment}`;
      } else {
        callbackText = 'Қайта тексеру жоқ';
      }
      
      const payload = {
        diagnosisId: createdDiagnosis.diagnosisId,
        appointmentId: appointmentId,
        callback: callbackText
      };
      
      console.log('Рецепт payload:', payload);

      const response = await api.post('/api/v1/prescription', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const newPrescription = response.data;
      console.log('Жаңа рецепт:', newPrescription);
      
      setSuccess(`Рецепт сәтті жасалды! Диагноз және рецепт құрылды. Рецепт ID: ${newPrescription.prescriptionId}`);
      
      setTimeout(() => {
        resetForms();
      }, 3000);
      
    } catch (err) {
      console.error('Рецепт қатесі:', err.response?.data || err);
      
      let errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      
      if (errorMessage.includes('DiagnosisId is required')) {
        errorMessage = 'Диагноз ID қажет. Диагноз дұрыс жасалмаған.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Ресурс табылмады (404). Сервердегі проблема.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Сервер қатесі (500). Деректер қате болуы мүмкін.';
      }
      
      setError(`Рецепт жасау қатесі: ${errorMessage}`);
      
    } finally {
      setCreatingPrescription(false);
    }
  };

  // Сброс всех форм
  const resetForms = () => {
    setDiagnosisForm({ 
      patientId: '', 
      recordId: '', 
      diagnosisText: '', 
      useTemplate: false, 
      selectedTemplate: '' 
    });
    setPrescriptionForm({
      appointmentId: '',
      prescription: '',
      comment: '',
      showForm: false,
    });
    setCreatedDiagnosis(null);
    setSelectedPatient(null);
    setMedicalRecords([]);
    setPatientAppointments([]);
  };

  // Пропуск создания рецепта
  const skipPrescription = () => {
    setSuccess('Диагноз сәтті жасалды! Рецепт қосылмады.');
    resetForms();
  };

  // Загрузка пациентов при монтировании компонента
  useEffect(() => {
    fetchPatients();
  }, []);

  // Обработка выбора пациента
  const handlePatientSelect = async (patientId) => {
    const patient = patients.find((p) => p.patientId === Number(patientId));
    setSelectedPatient(patient);
    setDiagnosisForm(prev => ({
      ...prev,
      patientId,
      recordId: '',
    }));
    await fetchMedicalRecords(patientId);
    await fetchPatientAppointments(patientId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <motion.section
        className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Диагноздар және рецепттерді жасау
          </h1>
          <p className="text-center text-gray-600">
            Науқасқа диагноз қою және рецепт беру
          </p>
        </div>

        {/* Сообщения об ошибках/успехе */}
        <div className="mb-6 max-w-4xl mx-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Основное содержимое в два столбца */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Левая колонка - Форма диагноза */}
          <div className="lg:col-span-2">
            {!prescriptionForm.showForm ? (
              <motion.div
                className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                  <h2 className="text-2xl font-bold text-white">1. Жаңа диагноз жасау</h2>
                  <p className="text-blue-100 mt-1">Науқасқа диагноз қойыңыз</p>
                </div>
                
                <form onSubmit={createDiagnosis} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-800 font-semibold mb-2">
                        Науқас *
                      </label>
                      <select
                        value={diagnosisForm.patientId}
                        onChange={(e) => handlePatientSelect(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Науқасты таңдаңыз</option>
                        {patients.map((patient) => (
                          <option key={patient.patientId} value={patient.patientId}>
                            {patient.user?.firstName} {patient.user?.lastName} (ID: {patient.patientId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-800 font-semibold mb-2">
                        Медициналық жазба
                      </label>
                      <select
                        value={diagnosisForm.recordId}
                        onChange={(e) => setDiagnosisForm({...diagnosisForm, recordId: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={!selectedPatient}
                      >
                        <option value="">Жазбаны таңдаңыз (міндетті емес)</option>
                        {medicalRecords.map((record) => (
                          <option key={record.recordId} value={record.recordId}>
                            Жазба #{record.recordId} - {new Date(record.createdAt).toLocaleDateString('kk-KZ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Шаблоны диагнозов */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">Диагноз шаблондары</h3>
                      <button
                        type="button"
                        onClick={() => setDiagnosisForm({...diagnosisForm, useTemplate: !diagnosisForm.useTemplate})}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {diagnosisForm.useTemplate ? 'Шаблонды жасыру' : 'Шаблонды көрсету'}
                      </button>
                    </div>
                    
                    {diagnosisForm.useTemplate && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                        {diagnosisTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template.id)}
                            className={`p-2 text-sm rounded-lg border transition-all ${diagnosisForm.selectedTemplate === template.id 
                              ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium' 
                              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-800 font-semibold mb-2">
                      Диагноз мәтіні *
                    </label>
                    <textarea
                      value={diagnosisForm.diagnosisText}
                      onChange={(e) => setDiagnosisForm({...diagnosisForm, diagnosisText: e.target.value})}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[200px] resize-y"
                      placeholder="Диагнозды толық сипаттаңыз немесе шаблонды таңдаңыз..."
                      required
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>Ұзындық: {diagnosisForm.diagnosisText.length} символ</span>
                      {diagnosisForm.selectedTemplate && (
                        <span className="text-blue-600">
                          Шаблон: {diagnosisTemplates.find(t => t.id === diagnosisForm.selectedTemplate)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isLoading || !diagnosisForm.patientId || !diagnosisForm.diagnosisText.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Жасалуда...
                        </>
                      ) : 'Диагноз жасау'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Форма рецепта */
              <motion.div
                className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-700">
                  <h2 className="text-2xl font-bold text-white">2. Рецепт қосу</h2>
                  <p className="text-green-100 mt-1">Диагнозға рецепт қосыңыз (міндетті емес)</p>
                </div>
                
                {/* Информация о созданном диагнозе */}
                <div className="p-6 bg-green-50 border-b border-green-100">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">Диагноз сәтті жасалды!</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-green-700 mt-1">
                        <div><span className="font-medium">ID:</span> {createdDiagnosis?.diagnosisId}</div>
                        <div><span className="font-medium">Күні:</span> {new Date(createdDiagnosis?.diagnosisDate).toLocaleDateString('kk-KZ')}</div>
                        <div><span className="font-medium">Науқас:</span> {selectedPatient?.user?.firstName} {selectedPatient?.user?.lastName}</div>
                        <div><span className="font-medium">Жазба ID:</span> {createdDiagnosis?.medicalRecord?.recordId}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={createPrescription} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-800 font-semibold mb-2">
                        Кездесу *
                      </label>
                      <select
                        value={prescriptionForm.appointmentId}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, appointmentId: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Кездесуді таңдаңыз</option>
                        {patientAppointments.map((appointment) => (
                          <option key={appointment.appointmentId} value={appointment.appointmentId}>
                            Кездесу #{appointment.appointmentId} - {new Date(appointment.appointmentDate).toLocaleDateString('kk-KZ')}
                          </option>
                        ))}
                      </select>
                      {patientAppointments.length === 0 && (
                        <p className="text-sm text-yellow-600 mt-2">
                          Аяқталған кездесулер жоқ
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-gray-800 font-semibold mb-2">
                        Рецепт (дәрілер, нұсқаулар)
                      </label>
                      <textarea
                        value={prescriptionForm.prescription}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, prescription: e.target.value})}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all min-h-[120px] resize-y"
                        placeholder="Дәрілердің атауы, дозасы, қабылдау реті..."
                      />
                      <p className="text-sm text-gray-500 mt-1">Мысалы: Парацетамол 500 мг, күніне 3 рет 7 күн</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-gray-800 font-semibold mb-2">
                        Қосымша комментарий
                      </label>
                      <textarea
                        value={prescriptionForm.comment}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, comment: e.target.value})}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all min-h-[100px] resize-y"
                        placeholder="Нұсқаулар, ескертулер, қайта тексеру күні..."
                      />
                      <p className="text-sm text-gray-500 mt-1">Мысалы: 2 аптадан кейін қайта келу, тамақтан кейін ішу</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={creatingPrescription || !prescriptionForm.appointmentId}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                      >
                        {creatingPrescription ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Жасалуда...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Рецепт қосу
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={skipPrescription}
                        className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-md"
                      >
                        <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Рецепт қоспау
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Правая колонка - Информация о пациенте */}
          <div className="space-y-6">
            {/* Карточка пациента */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700">
                  <h3 className="text-lg font-bold text-white">Науқас ақпараты</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-indigo-600 font-bold text-lg">
                        {selectedPatient.user?.firstName?.charAt(0)}{selectedPatient.user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{selectedPatient.user?.firstName} {selectedPatient.user?.lastName}</p>
                      <p className="text-sm text-gray-500">ID: {selectedPatient.patientId}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span className="text-gray-700">{selectedPatient.user?.email}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-gray-700">{selectedPatient.contactNumber || 'Көрсетілмеген'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">
                        {new Date(selectedPatient.dateOfBirth).toLocaleDateString('kk-KZ')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Статистика */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                  <h3 className="text-lg font-bold text-white">Статистика</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{medicalRecords.length}</div>
                      <div className="text-sm text-gray-600">Медициналық жазба</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{patientAppointments.length}</div>
                      <div className="text-sm text-gray-600">Аяқталған кездесу</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Быстрые шаблоны */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600">
                <h3 className="text-lg font-bold text-white">Жылдам шаблондар</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {diagnosisTemplates.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-all"
                    >
                      <div className="font-medium text-gray-800">{template.name}</div>
                      <div className="text-xs text-gray-500 truncate">{template.text.substring(0, 60)}...</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default DiagnosisPage;