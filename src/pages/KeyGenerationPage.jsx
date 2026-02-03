import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { FaKey, FaLock, FaLockOpen, FaCopy, FaDownload, FaUser, FaShieldAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { GiKey, GiPadlock, GiUnlocking } from 'react-icons/gi';

const KeyGenerationPage = () => {
  const [user, setUser] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
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

  // Получение данных пользователя
  const fetchUserData = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      const response = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      setUser(response.data);
    } catch (err) {
      setError('Пайдаланушы мәліметтерін жүктеу кезінде қате: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  // Генерация пары ключей
  const generateKeys = async () => {
    setError('');
    setSuccess('');
    setPublicKey('');
    setPrivateKey('');
    setIsLoading(true);
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      if (!user || !user.userId) {
        throw new Error('Пайдаланушы мәліметтері жүктелмеді');
      }
      const response = await api.post(
        `/api/security-keys/generate/${user.userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      setPublicKey(response.data.publicKey);
      setPrivateKey(response.data.privateKey);
      setSuccess('RSA кілттер жұбы сәтті жасалды!');
    } catch (err) {
      const errorMessage =
        err.response?.status === 400
          ? 'Сұраудың қате форматы. Деректерді тексеріңіз.'
          : err.response?.status === 403
            ? 'Кілттерді жасауға рұқсат жоқ'
            : `Кілттерді жасау кезінде қате: ${err.message || err}`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Получение публичного ключа
  const fetchPublicKey = async () => {
    setError('');
    setSuccess('');
    setPublicKey('');
    setIsLoading(true);
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      if (!user || !user.userId) {
        throw new Error('Пайдаланушы мәліметтері жүктелмеді');
      }
      const response = await api.get(
        `/api/security-keys/public/${user.userId}`,
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      setPublicKey(response.data);
      setSuccess('Ашық кілт сәтті алынды!');
    } catch (err) {
      const errorMessage =
        err.response?.status === 404
          ? 'Ашық кілт осы пайдаланушы үшін табылмады'
          : err.response?.status === 403
            ? 'Кілтті алуға рұқсат жоқ'
            : `Ашық кілтті алу кезінде қате: ${err.message || err}`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка валидности приватного ключа
  const validatePrivateKey = async () => {
    setError('');
    setSuccess('');
    setValidationResult(null);
    setIsLoading(true);
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Жарамды JWT токені табылмады');
      }
      if (!user || !user.userId) {
        throw new Error('Пайдаланушы мәліметтері жүктелмеді');
      }
      if (!privateKeyInput) {
        throw new Error('Тексеру үшін жеке кілтті енгізіңіз');
      }
      const response = await api.post(
        `/api/security-keys/validate`,
        {
          privateKey: privateKeyInput,
          userId: user.userId,
        },
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      setValidationResult(response.data);
      setSuccess(response.data ? 'Жеке кілт жарамды!' : 'Жеке кілт жарамсыз.');
    } catch (err) {
      const errorMessage =
        err.response?.status === 400
          ? 'Сұраудың қате форматы. Деректерді тексеріңіз.'
          : err.response?.status === 403
            ? 'Кілтті тексеруге рұқсат жоқ'
            : `Жеке кілтті тексеру кезінде қате: ${err.message || err}`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Копирование ключа в буфер обмена
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Кілт алмасу буферіне көшірілді!');
  };

  // Скачивание ключа как файла
  const downloadKey = (key, filename) => {
    const blob = new Blob([key], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Анимации
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

  const tabs = [
    { id: 'generate', label: 'Кілт Жасау', icon: <GiKey /> },
    { id: 'public', label: 'Ашық Кілт', icon: <FaLockOpen /> },
    { id: 'validate', label: 'Кілт Тексеру', icon: <FaShieldAlt /> },
  ];

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
                <GiKey className="mr-3 text-emerald-600" />
                RSA Кілттер Генерациясы
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Медициналық деректерді шифрлеу үшін қауіпсіз RSA кілттерін басқарыңыз
              </p>
            </div>
            
            {/* Статистика карточкалары */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Статус</p>
                <p className="text-lg font-bold text-emerald-600">Белсенді</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Кілт түрі</p>
                <p className="text-lg font-bold text-gray-800">RSA-2048</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Шифрлау</p>
                <p className="text-lg font-bold text-blue-600">AES-256</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Қауіпсіздік</p>
                <p className="text-lg font-bold text-green-600">Жоғары</p>
              </div>
            </div>
          </div>

          {/* Табы */}
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${activeTab === tab.id 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Сол жақ баған - Пайдаланушы және ақпарат */}
          <div className="lg:col-span-1 space-y-6">
            {/* Пайдаланушы профилі */}
            {user && (
              <motion.div 
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-200"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mr-4">
                    <FaUser className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Пайдаланушы Профилі</h2>
                    <p className="text-gray-600 text-sm">Кілт басқару үшін</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/70 p-3 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Толық аты</p>
                    <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Электрондық пошта</p>
                    <p className="font-semibold text-gray-800">{user.email}</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Пайдаланушы аты</p>
                    <p className="font-semibold text-gray-800">{user.username}</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-500 mb-1">Рөл</p>
                    <p className="font-semibold text-gray-800">
                      {user.roles?.map((role) => translateRole(role.roleName)).join(', ') || 'Рөл жоқ'}
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
                RSA Кілттер туралы
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <p><strong>Ашық кілт:</strong> Басқа адамдармен бөлісуге болады</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">2</span>
                  </div>
                  <p><strong>Жеке кілт:</strong> Өзіңізде ғана сақтаңыз</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">3</span>
                  </div>
                  <p><strong>Шифрлеу:</strong> Ашық кілтпен шифрланады</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">4</span>
                  </div>
                  <p><strong>Шифрлеуден шығару:</strong> Жеке кілтпен ашылады</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  ⚠️ <strong>Ескерту:</strong> Жеке кілтіңізді ешқашан ешкіммен бөліспейді және қауіпсіз сақтаңыз.
                </p>
              </div>
            </motion.div>

            {/* Қауіпсіздік кеңестері */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                <FaShieldAlt className="mr-2" />
                Қауіпсіздік Кеңестері
              </h3>
              <ul className="space-y-2 text-sm text-red-700">
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Жеке кілтті қорғалған ортада сақтаңыз</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Кілттерді мерзімді жаңартыңыз</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Кілттерді басқа мақсаттарға пайдаланбаңыз</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Сенімді бағдарламаларды ғана пайдаланыңыз</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Негізгі контент аймағы */}
          <div className="lg:col-span-2 space-y-6">
            {/* Хабарламалар */}
            <div className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start shadow-sm"
                >
                  <FaTimesCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
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
                  <FaCheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Сәтті!</p>
                    <p className="text-sm mt-1">{success}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Кілт жасау */}
            {activeTab === 'generate' && (
              <motion.div 
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                      <GiKey className="text-white" />
                    </div>
                    Жаңа RSA Кілттер Жұбын Жасау
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Сіздің тұлғаңызға арналған жаңа RSA-2048 кілттер жұбын жасау.
                      Кілттер сіздің медициналық деректеріңізді қорғау үшін пайдаланылады.
                    </p>
                    
                    <button
                      onClick={generateKeys}
                      disabled={isLoading || !user}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${isLoading || !user 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl transform hover:scale-[1.02]'}`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Кілттер жасалуда...
                        </div>
                      ) : (
                        'КІЛТТЕРДІ ЖАСАУ'
                      )}
                    </button>
                  </div>

                  {/* Жасалған кілттер */}
                  {(publicKey || privateKey) && (
                    <div className="space-y-6">
                      {publicKey && (
                        <motion.div 
                          className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200"
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-blue-800 flex items-center">
                              <FaLockOpen className="mr-2" />
                              Ашық Кілт
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard(publicKey)}
                                className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition flex items-center"
                              >
                                <FaCopy className="mr-1" /> Көшіру
                              </button>
                              <button
                                onClick={() => downloadKey(publicKey, 'public_key.pem')}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center"
                              >
                                <FaDownload className="mr-1" /> Жүктеу
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={publicKey}
                            readOnly
                            className="w-full p-3 border border-blue-200 rounded-lg bg-white/50 text-gray-700 text-sm font-mono"
                            rows="4"
                          />
                        </motion.div>
                      )}

                      {privateKey && (
                        <motion.div 
                          className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border border-red-200"
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-red-800 flex items-center">
                              <GiPadlock className="mr-2" />
                              Жеке Кілт
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard(privateKey)}
                                className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center"
                              >
                                <FaCopy className="mr-1" /> Көшіру
                              </button>
                              <button
                                onClick={() => downloadKey(privateKey, 'private_key.pem')}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center"
                              >
                                <FaDownload className="mr-1" /> Жүктеу
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={privateKey}
                            readOnly
                            className="w-full p-3 border border-red-200 rounded-lg bg-white/50 text-gray-700 text-sm font-mono"
                            rows="4"
                          />
                          <p className="text-red-600 text-xs mt-3 font-medium">
                            ⚠️ Жеке кілтті қауіпсіз жерде сақтаңыз! Ол тек бір рет көрсетіледі.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Ашық кілт */}
            {activeTab === 'public' && (
              <motion.div 
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg flex items-center justify-center mr-3">
                      <FaLockOpen className="text-white" />
                    </div>
                    Ашық Кілтті Алу
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Сіздің тұлғаңызға байланысты бар ашық кілтті алу. 
                      Бұл кілтті дәрігерлер сіздің медициналық деректеріңізді шифрлау үшін пайдалана алады.
                    </p>
                    
                    <button
                      onClick={fetchPublicKey}
                      disabled={isLoading || !user}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${isLoading || !user 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 hover:shadow-xl transform hover:scale-[1.02]'}`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Алынуда...
                        </div>
                      ) : (
                        'АШЫҚ КІЛТТІ АЛУ'
                      )}
                    </button>
                  </div>

                  {/* Алынған ашық кілт */}
                  {publicKey && (
                    <motion.div 
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-blue-800 flex items-center">
                          <GiUnlocking className="mr-2" />
                          Алынған Ашық Кілт
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(publicKey)}
                            className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition flex items-center"
                          >
                            <FaCopy className="mr-1" /> Көшіру
                          </button>
                          <button
                            onClick={() => downloadKey(publicKey, 'public_key.pem')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center"
                          >
                            <FaDownload className="mr-1" /> Жүктеу
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={publicKey}
                        readOnly
                        className="w-full p-3 border border-blue-200 rounded-lg bg-white/50 text-gray-700 text-sm font-mono"
                        rows="6"
                      />
                      <p className="text-blue-600 text-xs mt-3">
                        Бұл кілтті дәрігерлермен бөлісе аласыз. Ол тек шифрлеу үшін пайдаланылады.
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Кілт тексеру */}
            {activeTab === 'validate' && (
              <motion.div 
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-3">
                      <FaShieldAlt className="text-white" />
                    </div>
                    Жеке Кілтті Тексеру
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Сіздің жеке кілтіңіздің жарамдылығын тексеру. 
                      Кілттің дұрыс форматы бар және сіздің тұлғаңызға сәйкес келетініне көз жеткізіңіз.
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Жеке Кілт
                      </label>
                      <textarea
                        value={privateKeyInput}
                        onChange={(e) => setPrivateKeyInput(e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        rows="6"
                      />
                    </div>
                    
                    <button
                      onClick={validatePrivateKey}
                      disabled={isLoading || !user || !privateKeyInput}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${isLoading || !user || !privateKeyInput
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 hover:shadow-xl transform hover:scale-[1.02]'}`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Тексерілуде...
                        </div>
                      ) : (
                        'КІЛТТІ ТЕКСЕРУ'
                      )}
                    </button>
                  </div>

                  {/* Тексеру нәтижесі */}
                  {validationResult !== null && (
                    <motion.div 
                      className={`p-5 rounded-xl border ${validationResult 
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700' 
                        : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700'}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="flex items-center">
                        {validationResult ? (
                          <FaCheckCircle className="text-emerald-600 text-2xl mr-3" />
                        ) : (
                          <FaTimesCircle className="text-red-600 text-2xl mr-3" />
                        )}
                        <div>
                          <h4 className="font-bold">
                            {validationResult ? 'Кілт Жарамды' : 'Кілт Жарамсыз'}
                          </h4>
                          <p className="text-sm mt-1">
                            {validationResult 
                              ? 'Сіздің жеке кілтіңіз дұрыс форматы бар және сіздің тұлғаңызға сәйкес келеді.' 
                              : 'Кілт дұрыс емес немесе сіздің тұлғаңызға сәйкес келмейді.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Ақпарат блокы */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Кілттерді Қалай Пайдалану Керек</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-2">Дәрігерлер үшін</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Науқастың ашық кілтін алыңыз</li>
                    <li>• Диагнозды оның ашық кілтімен шифрлаңыз</li>
                    <li>• Шифрленген диагнозды жіберіңіз</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-2">Науқастар үшін</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Жеке кілтіңізді қауіпсіз сақтаңыз</li>
                    <li>• Дәрігерге ашық кілтіңізді беріңіз</li>
                    <li>• Шифрленген диагнозды жеке кілтіңізбен оқыңыз</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KeyGenerationPage;