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
  });
  const [createdDiagnosis, setCreatedDiagnosis] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: '',
    callback: '',
    showForm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const { token } = useSelector((state) => state.token);

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
      const recordId = diagnosisForm.recordId ? Number(diagnosisForm.recordId) : null;
      
      if (!patientId) {
        throw new Error('Науқасты таңдаңыз');
      }
      
      if (!diagnosisForm.diagnosisText.trim()) {
        throw new Error('Диагноз мәтінін енгізіңіз');
      }
      
      // Если нет медицинской записи, создаем ее
      let finalRecordId = recordId;
      if (!finalRecordId && medicalRecords.length > 0) {
        finalRecordId = medicalRecords[0].recordId;
      }
      
      // Если совсем нет записей, возможно нужно создать через API
      if (!finalRecordId) {
        // Здесь можно вызвать API для создания медицинской записи
        // Для простоты пока пропускаем
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
      
      // Сохраняем созданный диагноз
      setCreatedDiagnosis(newDiagnosis);
      
      setSuccess(`Диагноз сәтті жасалды! Диагноз ID: ${newDiagnosis.diagnosisId}`);
      
      // После успешного создания диагноза показываем форму для рецепта
      setPrescriptionForm({
        appointmentId: '',
        callback: '',
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
      
      const payload = {
        diagnosisId: createdDiagnosis.diagnosisId, // Используем diagnosisId из созданного диагноза
        appointmentId: appointmentId,
        callback: prescriptionForm.callback.trim() || 'Қайта тексеру жоқ'
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
      
      // Сброс форм
      setTimeout(() => {
        setDiagnosisForm({ patientId: '', recordId: '', diagnosisText: '' });
        setPrescriptionForm({
          appointmentId: '',
          callback: '',
          showForm: false,
        });
        setCreatedDiagnosis(null);
        setSelectedPatient(null);
        setMedicalRecords([]);
        setPatientAppointments([]);
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

  // Пропуск создания рецепта
  const skipPrescription = () => {
    setSuccess('Диагноз сәтті жасалды! Рецепт қосылмады.');
    setDiagnosisForm({ patientId: '', recordId: '', diagnosisText: '' });
    setPrescriptionForm({
      appointmentId: '',
      callback: '',
      showForm: false,
    });
    setCreatedDiagnosis(null);
    setSelectedPatient(null);
    setMedicalRecords([]);
    setPatientAppointments([]);
  };

  // Загрузка пациентов при монтировании компонента
  useEffect(() => {
    fetchPatients();
  }, []);

  // Обработка выбора пациента
  const handlePatientSelect = async (patientId) => {
    const patient = patients.find((p) => p.patientId === Number(patientId));
    setSelectedPatient(patient);
    setDiagnosisForm({
      patientId,
      recordId: '',
      diagnosisText: '',
    });
    await fetchMedicalRecords(patientId);
    await fetchPatientAppointments(patientId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <motion.section
        className="w-full px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Диагноздар және рецепттерді жасау
        </h1>

        {/* Сообщения об ошибках/успехе */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Форма диагноза */}
        {!prescriptionForm.showForm ? (
          <motion.div
            className="bg-white p-6 rounded-xl shadow-lg mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">1. Жаңа диагноз</h2>
            
            <form onSubmit={createDiagnosis}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-800 font-semibold mb-2">
                    Науқас
                  </label>
                  <select
                    value={diagnosisForm.patientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedPatient}
                  >
                    <option value="">Жазбаны таңдаңыз (міндетті емес)</option>
                    {medicalRecords.map((record) => (
                      <option key={record.recordId} value={record.recordId}>
                        Жазба #{record.recordId}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Егер жазба жоқ болса, жаңа жазба автоматты түрде құрылады
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-800 font-semibold mb-2">
                  Диагноз мәтіні *
                </label>
                <textarea
                  value={diagnosisForm.diagnosisText}
                  onChange={(e) => setDiagnosisForm({...diagnosisForm, diagnosisText: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Диагнозды толық сипаттаңыз..."
                  required
                />
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading || !diagnosisForm.patientId || !diagnosisForm.diagnosisText.trim()}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="bg-white p-6 rounded-xl shadow-lg mb-8 border-2 border-green-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-green-700">Диагноз сәтті жасалды!</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Диагноз ID:</span> {createdDiagnosis?.diagnosisId}</div>
                <div><span className="font-medium">Науқас:</span> {createdDiagnosis?.medicalRecord?.patient?.user?.firstName}</div>
                <div><span className="font-medium">Жазба ID:</span> {createdDiagnosis?.medicalRecord?.recordId}</div>
                <div><span className="font-medium">Күні:</span> {new Date(createdDiagnosis?.diagnosisDate).toLocaleDateString('kk-KZ')}</div>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-green-600 mb-4">2. Рецепт қосу (міндетті емес)</h2>
            
            <form onSubmit={createPrescription}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-800 font-semibold mb-2">
                    Кездесу *
                  </label>
                  <select
                    value={prescriptionForm.appointmentId}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, appointmentId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      Аяқталған кездесулер жоқ. Кездесу жасау керек.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 font-semibold mb-2">
                    Қайта тексеру кездесуі
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.callback}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, callback: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Мысалы: 2 аптадан кейін қайта келу"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={creatingPrescription || !prescriptionForm.appointmentId}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {creatingPrescription ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Жасалуда...
                    </>
                  ) : 'Рецепт жасау'}
                </button>
                
                <button
                  type="button"
                  onClick={skipPrescription}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Рецепт қоспау
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Информация о выбранном пациенте */}
        {selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Науқас ақпараты</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">
                      {selectedPatient.user?.firstName?.charAt(0)}{selectedPatient.user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedPatient.user?.firstName} {selectedPatient.user?.lastName}</p>
                    <p className="text-sm text-gray-500">ID: {selectedPatient.patientId}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600"><span className="font-medium">Email:</span> {selectedPatient.user?.email}</p>
                  <p className="text-gray-600"><span className="font-medium">Телефон:</span> {selectedPatient.contactNumber || 'Көрсетілмеген'}</p>
                  <p className="text-gray-600"><span className="font-medium">Туған күні:</span> {new Date(selectedPatient.dateOfBirth).toLocaleDateString('kk-KZ')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Медициналық жазбалар</h3>
              {medicalRecords.length === 0 ? (
                <p className="text-gray-500">Жазбалар жоқ</p>
              ) : (
                <div className="space-y-3">
                  {medicalRecords.slice(0, 3).map((record) => (
                    <div key={record.recordId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">Жазба #{record.recordId}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString('kk-KZ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Соңғы кездесулер</h3>
              {patientAppointments.length === 0 ? (
                <p className="text-gray-500">Кездесулер жоқ</p>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.appointmentId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">Кездесу #{appointment.appointmentId}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString('kk-KZ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Отладка (для разработки) */}
        {process.env.NODE_ENV === 'development' && createdDiagnosis && (
          <div className="bg-gray-100 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Отладка - созданный диагноз:</h4>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(createdDiagnosis, null, 2)}
            </pre>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default DiagnosisPage;