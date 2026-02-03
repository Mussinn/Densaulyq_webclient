import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { FaKey, FaFileDownload, FaFileUpload, FaDiagnoses, FaLock, FaLockOpen, FaUserMd } from 'react-icons/fa';
import { GiHealthNormal } from 'react-icons/gi';

const DecryptDiagnosisPage = () => {
  const [user, setUser] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedDiagnosis, setDecryptedDiagnosis] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const { token } = useSelector((state) => state.token);

  // Перевод ролей
  const translateRole = (role) => {
    switch (role) {
      case 'ROLE_USER':
        return 'Науқас';
      case 'ROLE_DOCTOR':
        return 'Дәрігер';
      default:
        return role;
    }
  };

  // Получение заголовков авторизации
  const getAuthHeaders = () => {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Жарамды JWT токені табылмады');
    }
    return { Authorization: `Bearer ${token.trim()}` };
  };

  // Получение данных пользователя
  const fetchUserData = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.get('/api/v1/users/me', {
        headers: getAuthHeaders(),
      });
      console.log('Пайдаланушы мәліметтері:', response.data);
      setUser(response.data);
    } catch (err) {
      console.error('Пайдаланушы мәліметтерін жүктеу қатесі:', err);
      setError('Пайдаланушы мәліметтерін жүктеу кезінде қате: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Получение списка диагнозов
  const fetchDiagnoses = async () => {
    if (!user || !user.userId) {
      console.warn('Пайдаланушы немесе userId жоқ');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/diagnosis/${user.userId}`, {
        headers: getAuthHeaders(),
      });
      console.log('Алынған диагноздар:', response.data);
      response.data.forEach((diagnosis, index) => {
        if (!diagnosis.diagnosis) {
          console.warn(`Диагноз ${index} (ID: ${diagnosis.diagnosisId}) diagnosis өрісін қамтымайды`);
        }
      });
      setDiagnoses(response.data);
      if (response.data.length === 0) {
        setSuccess('Бұл пайдаланушы үшін диагноздар табылмады.');
      }
    } catch (err) {
      console.error('Диагноздарды жүктеу қатесі:', err);
      setError(`Диагноздарды жүктеу кезінде қате: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработка загрузки файла с приватным ключом
  const handlePrivateKeyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.warn('Файл таңдалмады');
      setError('Жеке кілт файлы таңдаңыз.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      let keyContent = event.target.result?.trim();
      console.log('Жеке кілттің шикі мазмұны:', keyContent);

      if (!keyContent) {
        setError('Жеке кілт файлы бос немесе қате.');
        return;
      }

      const hasPemHeaders = keyContent.includes('-----BEGIN PRIVATE KEY-----') && keyContent.includes('-----END PRIVATE KEY-----');
      if (!hasPemHeaders) {
        keyContent = `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----`;
      }

      keyContent = keyContent.replace(/\r\n|\n|\r/g, '\n').trim();
      setPrivateKey(keyContent);
      setFileUploaded(true);
      setSuccess('Жеке кілт сәтті жүктелді!');
      console.log('Орнатылған privateKey:', keyContent.substring(0, 50) + '...');
    };
    reader.onerror = () => {
      console.error('Файлды оқу қатесі');
      setError('Жеке кілт файлы оқу кезінде қате.');
    };
    reader.readAsText(file);
  };

  // Обработка выбора диагноза
  const handleDiagnosisSelect = (diagnosis) => {
    if (!diagnosis.diagnosis) {
      setError('Таңдалған диагнозда шифрленген деректер жоқ.');
      return;
    }
    const newSelection = selectedDiagnosis === diagnosis.diagnosis ? '' : diagnosis.diagnosis;
    setSelectedDiagnosis(newSelection);
    console.log('Таңдалған диагноз:', newSelection || 'таңдау қалпына келтірілді');
  };

  // Расшифровка выбранного диагноза
  const decryptDiagnosis = async () => {
    setError('');
    setSuccess('');
    setDecryptedDiagnosis('');
    if (!selectedDiagnosis) {
      setError('Тізімнен диагнозды таңдаңыз.');
      return;
    }
    if (!privateKey.trim()) {
      setError('Жеке кілтті жүктеңіз.');
      return;
    }
    setLoading(true);
    try {
      console.log('Шешуге жіберілетін сұрау:', { encryptedDiagnosis: selectedDiagnosis, privateKey });
      const response = await api.post(
        '/api/v1/diagnosis/decrypt',
        {
          encryptedDiagnosis: selectedDiagnosis,
          privateKey,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      console.log('Шешілген диагноз:', response.data);
      setDecryptedDiagnosis(response.data.decryptedDiagnosis || response.data);
      setSuccess('Диагноз сәтті шешілді!');
    } catch (err) {
      console.error('Шешу қатесі:', err);
      setError(err.response?.data?.message || `Шешу кезінде қате: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Скачивание расшифрованного диагноза
  const downloadDecryptedDiagnosis = () => {
    if (!decryptedDiagnosis) {
      setError('Жүктеуге деректер жоқ.');
      return;
    }
    const blob = new Blob([decryptedDiagnosis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decrypted_diagnosis_${new Date().toISOString()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccess('Шешілген диагноз жүктелді!');
  };

  // Загрузка данных пользователя при монтировании
  useEffect(() => {
    fetchUserData();
  }, []);

  // Загрузка диагнозов при получении userId
  useEffect(() => {
    if (user && user.userId) {
      fetchDiagnoses();
    }
  }, [user]);

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const bounceVariants = {
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-4 md:p-6"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="max-w-7xl mx-auto">
        {/* Заголовок секциясы */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <FaLockOpen className="mr-3 text-emerald-600" />
                Диагнозды Шифрлеуден Шығару
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Жеке кілтіңізді пайдаланып шифрленген диагноздарыңызды оқыңыз
              </p>
            </div>
            
            {/* Статистика карточкалары */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Жалпы диагноздар</p>
                <p className="text-2xl font-bold text-gray-800">{diagnoses.length}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Таңдалған</p>
                <p className="text-2xl font-bold text-gray-800">{selectedDiagnosis ? 1 : 0}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Кілт жүктелген</p>
                <p className="text-2xl font-bold text-gray-800">{fileUploaded ? '✓' : '✗'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Статус</p>
                <p className="text-lg font-bold text-emerald-600">Белсенді</p>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Сол жақ баған - Пайдаланушы және диагноздар */}
          <div className="lg:col-span-2 space-y-6">
            {/* Пайдаланушы мәліметтері */}
            {user && (
              <motion.div 
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-200"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mr-4">
                    <FaUserMd className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Пайдаланушы Профилі</h2>
                    <p className="text-gray-600 text-sm">Шифрлеу үшін сәйкестендіру</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/70 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Толық аты</p>
                    <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Электрондық пошта</p>
                    <p className="font-semibold text-gray-800">{user.email}</p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Пайдаланушы аты</p>
                    <p className="font-semibold text-gray-800">{user.username}</p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Рөл</p>
                    <p className="font-semibold text-gray-800">
                      {user.roles?.map((role) => translateRole(role.roleName)).join(', ') || 'Рөл жоқ'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Диагноздар тізімі */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg flex items-center justify-center mr-3">
                    <FaDiagnoses className="text-white" />
                  </div>
                  Сіздің Диагноздарыңыз
                </h2>
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-gray-600">Диагноздар жүктелуде...</span>
                  </div>
                )}
                
                {!loading && diagnoses.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GiHealthNormal className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500">Әзірге диагноздар жоқ</p>
                    <p className="text-sm text-gray-400 mt-2">Дәрігер сізге диагноз қойғаннан кейін осында пайда болады</p>
                  </div>
                )}
                
                {!loading && diagnoses.length > 0 && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {diagnoses.map((diagnosis) => (
                      <motion.div
                        key={diagnosis.diagnosisId}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedDiagnosis === diagnosis.diagnosis ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                        onClick={() => handleDiagnosisSelect(diagnosis)}
                        whileHover="hover"
                        variants={bounceVariants}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${selectedDiagnosis === diagnosis.diagnosis ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                              {selectedDiagnosis === diagnosis.diagnosis ? (
                                <FaLockOpen className="text-white text-sm" />
                              ) : (
                                <FaLock className="text-white text-sm" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                Диагноз №{diagnosis.diagnosisId}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(diagnosis.diagnosisDate).toLocaleDateString('kk-KZ', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-3 py-1 text-xs rounded-full ${selectedDiagnosis === diagnosis.diagnosis ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                              {selectedDiagnosis === diagnosis.diagnosis ? 'Таңдалған' : 'Таңдау'}
                            </span>
                          </div>
                        </div>
                        
                        {selectedDiagnosis === diagnosis.diagnosis && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 pt-3 border-t border-emerald-200"
                          >
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Шифрленген деректер:</span>{' '}
                              {diagnosis.diagnosis.substring(0, 100)}...
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Жеке кілт жүктеу */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-3">
                    <FaKey className="text-white" />
                  </div>
                  Жеке Кілт Жүктеу
                </h2>
                
                <div className={`p-6 border-2 border-dashed rounded-xl text-center transition-all duration-300 ${fileUploaded ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaFileUpload className="text-purple-600 text-2xl" />
                  </div>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pem,.txt,.rem,.key"
                      onChange={handlePrivateKeyFileUpload}
                      className="hidden"
                      id="privateKeyFile"
                    />
                    <div className="space-y-3">
                      <p className="font-medium text-gray-800">
                        {fileUploaded ? 'Кілт жүктелген!' : 'Кілт файлын таңдаңыз'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {fileUploaded 
                          ? 'Файл сәтті жүктелді. Енді диагнозды шешуге болады.' 
                          : 'RSA жеке кілт файлын (.pem, .txt, .key) тартып әкеліңіз'}
                      </p>
                      <div className={`inline-block px-6 py-3 rounded-lg font-medium ${fileUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                        {fileUploaded ? '✓ Жүктелді' : 'Файл Таңдау'}
                      </div>
                    </div>
                  </label>
                  
                  {fileUploaded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-3 bg-emerald-100 rounded-lg"
                    >
                      <p className="text-sm text-emerald-700">
                        ✅ Кілт сәтті жүктелді. Енді диагнозды шешуге болады.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Оң жақ баған - Шешу және нәтижелер */}
          <div className="space-y-6">
            {/* Шешу түймесі */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLockOpen className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Диагнозды Шешу</h3>
                <p className="text-sm opacity-90 mb-6">
                  Диагнозды және жеке кілтті таңдап, шешу түймесін басыңыз
                </p>
                <button
                  onClick={decryptDiagnosis}
                  disabled={loading || !selectedDiagnosis || !privateKey.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${loading || !selectedDiagnosis || !privateKey.trim() 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:shadow-xl transform hover:scale-[1.02]'}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-2"></div>
                      Шешілуде...
                    </div>
                  ) : (
                    'ДИАГНОЗДЫ ШЕШУ'
                  )}
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Диагноз таңдалған:</span>
                    <span className={`font-bold ${selectedDiagnosis ? 'text-green-300' : 'text-red-300'}`}>
                      {selectedDiagnosis ? '✓ Иә' : '✗ Жоқ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Кілт жүктелген:</span>
                    <span className={`font-bold ${privateKey.trim() ? 'text-green-300' : 'text-red-300'}`}>
                      {privateKey.trim() ? '✓ Иә' : '✗ Жоқ'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Хабарламалар */}
            <motion.div 
              variants={cardVariants}
              className="space-y-4"
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start shadow-sm"
                >
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Қате</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start shadow-sm"
                >
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Сәтті!</p>
                    <p className="text-sm mt-1">{success}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Шешілген диагноз (бар болса) */}
            {decryptedDiagnosis && (
              <motion.div 
                variants={cardVariants}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                initial="hidden"
                animate="visible"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                      <GiHealthNormal className="text-white" />
                    </div>
                    Шешілген Диагноз
                  </h2>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                    <textarea
                      readOnly
                      value={decryptedDiagnosis}
                      rows={8}
                      className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-700"
                    />
                  </div>
                  
                  <button
                    onClick={downloadDecryptedDiagnosis}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <FaFileDownload className="mr-2" />
                    Диагнозды Жүктеу
                  </button>
                  
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Диагноз сәтті шешілді. Қауіпсіз ортада сақтаңыз.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Инструкция */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Нұсқау
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. Диагноз тізімінен біреуін таңдаңыз</p>
                <p>2. RSA жеке кілт файлыңызды жүктеңіз</p>
                <p>3. "Диагнозды шешу" түймесін басыңыз</p>
                <p>4. Шешілген диагнозды жүктеп алыңыз</p>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  ⚠️ <strong>Ескерту:</strong> Жеке кілтіңізді қауіпсіз сақтаңыз. Оны ешкіммен бөліспеңіз.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DecryptDiagnosisPage;