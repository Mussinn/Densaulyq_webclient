import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const DiagnosisPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [diagnosisForm, setDiagnosisForm] = useState({
    patientId: '',
    recordId: '',
    diagnosisText: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSelector((state) => state.token);

  // Загрузка списка пациентов
  const fetchPatients = async () => {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      const response = await api.get('/api/v1/patient', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      setPatients(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      setError('Науқастарды жүктеу кезінде қате: ' + errorMessage);
      console.error('fetchPatients қатесі:', err.response?.data || err);
    }
  };

  // Загрузка медицинских записей для выбранного пациента
  const fetchMedicalRecords = async (patientId) => {
    try {
      if (!patientId) {
        throw new Error('Науқастың ID-і көрсетілмеген');
      }
      const response = await api.get(`/api/v1/patient/medical-record/${patientId}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      setMedicalRecords(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      setError('Медициналық жазбаларды жүктеу кезінде қате: ' + errorMessage);
      console.error('fetchMedicalRecords қатесі:', err.response?.data || err);
    }
  };

  // Создание диагноза
  const createDiagnosis = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      const patientId = Number(diagnosisForm.patientId);
      const recordId = Number(diagnosisForm.recordId);
      if (isNaN(patientId) || isNaN(recordId)) {
        throw new Error('Науқастың және жазбаның ID-і сан болуы керек');
      }
      if (typeof diagnosisForm.diagnosisText !== 'string' || diagnosisForm.diagnosisText.trim() === '') {
        throw new Error('Диагноз мәтіні бос емес жол болуы керек');
      }
      const payload = {
        patientId,
        recordId,
        diagnosisText: diagnosisForm.diagnosisText.trim(),
      };
      console.log('Жіберілетін payload:', payload);

      const response = await api.post('/api/v1/diagnosis/create', payload, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccess('Диагноз сәтті жасалды!');
      setDiagnosisForm({ patientId: '', recordId: '', diagnosisText: '' });
      setSelectedPatient(null);
      setMedicalRecords([]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      setError('Диагноз жасау кезінде қате: ' + errorMessage);
      console.error('createDiagnosis қатесі:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка пациентов при монтировании компонента
  useEffect(() => {
    fetchPatients();
  }, []);

  // Обработка выбора пациента
  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.patientId === Number(patientId));
    setSelectedPatient(patient);
    setDiagnosisForm({
      ...diagnosisForm,
      patientId,
      recordId: '',
    });
    fetchMedicalRecords(patientId);
  };

  // Обработка клавиш для выбора пациента
  const handlePatientKeyDown = (e, patientId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePatientSelect(patientId);
    }
  };

  // Обработка изменений в форме
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setDiagnosisForm((prev) => {
      const newForm = { ...prev, [name]: value };
      console.log('Жаңартылған diagnosisForm күйі:', newForm);
      return newForm;
    });
  };

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
      <motion.section
        className="w-full px-4 sm:px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        aria-labelledby="diagnosis-heading"
      >
        <h1 id="diagnosis-heading" className="text-3xl font-bold text-center text-gray-800 mb-8">
          Диагноздарды жасау
        </h1>

        {error && (
          <motion.div
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-8 text-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            className="bg-green-100 text-green-700 p-4 rounded-lg mb-8 text-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.div>
        )}

        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg mb-8 w-full"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Жаңа диагноз</h2>
          <form onSubmit={createDiagnosis}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="patientId"
                  className="block text-gray-800 font-semibold mb-2"
                  id="patient-label"
                >
                  Науқас
                </label>
                <select
                  id="patientId"
                  name="patientId"
                  value={diagnosisForm.patientId}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="patient-label"
                  aria-label="Науқасты таңдау"
                >
                  <option value="">Науқасты таңдаңыз</option>
                  {patients.map((patient) => (
                    <option key={patient.patientId} value={patient.patientId}>
                      {patient.user.firstName} {patient.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="recordId"
                  className="block text-gray-800 font-semibold mb-2"
                  id="record-label"
                >
                  Медициналық жазба
                </label>
                <select
                  id="recordId"
                  name="recordId"
                  value={diagnosisForm.recordId}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedPatient}
                  aria-describedby="record-label"
                  aria-label="Медициналық жазбаны таңдау"
                >
                  <option value="">Жазбаны таңдаңыз</option>
                  {medicalRecords.map((record) => (
                    <option key={record.recordId} value={record.recordId}>
                      Жазба #{record.recordId}, {new Date(record.createdAt).toLocaleDateString('kk-KZ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="diagnosisText"
                className="block text-gray-800 font-semibold mb-2"
                id="diagnosis-label"
              >
                Диагноз мәтіні
              </label>
              <textarea
                id="diagnosisText"
                name="diagnosisText"
                value={diagnosisForm.diagnosisText}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Диагноз мәтінін енгізіңіз"
                aria-describedby="diagnosis-label"
                aria-label="Диагноз мәтіні"
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!diagnosisForm.patientId || !diagnosisForm.recordId || !diagnosisForm.diagnosisText.trim() || isLoading}
              aria-label="Диагноз жасау"
            >
              {isLoading ? 'Жасалуда...' : 'Диагноз жасау'}
            </button>
          </form>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg mb-8 w-full"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Науқастар</h2>
          {patients.length === 0 ? (
            <p className="text-gray-600">Қолжетімді науқастар жоқ</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <motion.div
                  key={patient.patientId}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  tabIndex="0"
                  onClick={() => handlePatientSelect(patient.patientId)}
                  onKeyDown={(e) => handlePatientKeyDown(e, patient.patientId)}
                  role="button"
                  aria-label={`Науқасты таңдау: ${patient.user.firstName} ${patient.user.lastName}`}
                >
                  <p className="font-semibold text-gray-800">
                    {patient.user.firstName} {patient.user.lastName}
                  </p>
                  <p className="text-gray-600">ID: {patient.patientId}</p>
                  <p className="text-gray-600">
                    Туған күні: {new Date(patient.dateOfBirth).toLocaleDateString('kk-KZ')}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {selectedPatient && (
          <motion.div
            className="bg-white p-6 rounded-xl shadow-lg w-full"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">
              Медициналық жазбалар: {selectedPatient.user.firstName} {selectedPatient.user.lastName}
            </h2>
            {medicalRecords.length === 0 ? (
              <p className="text-gray-600">Медициналық жазбалар жоқ</p>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <motion.div
                    key={record.recordId}
                    className="p-4 border border-gray-300 rounded-lg"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <p className="font-semibold text-gray-800">Жазба #{record.recordId}</p>
                    <p className="text-gray-600">
                      Жасалған: {new Date(record.createdAt).toLocaleString('kk-KZ')}
                    </p>
                    <p className="text-gray-600">
                      Жаңартылған: {new Date(record.updatedAt).toLocaleString('kk-KZ')}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.section>
    </div>
  );
};

export default DiagnosisPage;