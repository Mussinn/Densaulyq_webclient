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
  FaDownload
} from 'react-icons/fa';
import { GiHealthPotion, GiMedicalPack } from 'react-icons/gi';
import { MdHealthAndSafety, MdAccessTimeFilled } from 'react-icons/md';
import api from '../../utils/api';

function PersonalProfile() {
  const { token } = useSelector((state) => state.token);
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    prescriptions: 0
  });

  const tabs = [
    { id: 'appointments', label: 'Кездесулер тарихы', icon: <FaHistory /> },
    { id: 'prescriptions', label: 'Тағайындаулар', icon: <FaCalendarCheck /> },
    { id: 'labResults', label: 'Талдау нәтижелері', icon: <FaFileMedical /> },
    { id: 'medicalHistory', label: 'Медициналық тарих', icon: <GiMedicalPack /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Пример запросов - адаптируйте под ваш API
      const [appointmentsRes, historyRes, labRes] = await Promise.all([
        api.get('/api/v1/appointments/my', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/medical-history', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/lab-results', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAppointments(appointmentsRes.data);
      setMedicalHistory(historyRes.data);
      setLabResults(labRes.data);
      
      // Рассчитываем статистику
      setStats({
        totalAppointments: appointmentsRes.data.length,
        completedAppointments: appointmentsRes.data.filter(a => a.status === 'completed').length,
        upcomingAppointments: appointmentsRes.data.filter(a => a.status === 'scheduled').length,
        prescriptions: historyRes.data.filter(h => h.type === 'prescription').length
      });
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
    return new Date(dateString).toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Кездесулер тарихы</h3>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                Жаңа кездесу құру
              </button>
            </div>
            
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <MdAccessTimeFilled className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Әзірше кездесулер жоқ</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.status === 'completed' ? 'Аяқталды' : 
                             appointment.status === 'scheduled' ? 'Жоспарланған' : 'Бас тартылды'}
                          </div>
                          <span className="ml-3 text-sm text-gray-500">{formatDate(appointment.date)}</span>
                        </div>
                        <h4 className="font-bold text-lg text-gray-800 mb-1">
                          {appointment.doctorName || 'Дәрігер'}
                        </h4>
                        <p className="text-gray-600 mb-2">{appointment.specialization || 'Жалпы дәрігер'}</p>
                        <p className="text-gray-700">{appointment.reason || 'Талдау'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-emerald-600">{appointment.cost || '0'} ₸</span>
                        <p className="text-sm text-gray-500">Бағасы</p>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'prescriptions':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Тағайындаулар</h3>
            {medicalHistory
              .filter(item => item.type === 'prescription')
              .length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <GiMedicalPack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Әзірше тағайындаулар жоқ</p>
              </div>
            ) : (
              medicalHistory
                .filter(item => item.type === 'prescription')
                .map((prescription) => (
                  <div key={prescription.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 mb-2">{prescription.medication}</h4>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Доза:</span> {prescription.dosage}
                          </span>
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Жиілігі:</span> {prescription.frequency}
                          </span>
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Мерзімі:</span> {prescription.duration}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{prescription.instructions}</p>
                        <div className="text-sm text-gray-500">
                          Тағайындаған: {prescription.doctorName} • {formatDate(prescription.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          prescription.status === 'active' ? 'bg-green-100 text-green-700' :
                          prescription.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {prescription.status === 'active' ? 'Белсенді' : 'Аяқталды'}
                        </span>
                      </div>
                    </div>
                    {prescription.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-sm text-yellow-800">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        );

      case 'labResults':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Талдау нәтижелері</h3>
            {labResults.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <FaFileMedical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Әзірше талдау нәтижелері жоқ</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {labResults.map((result) => (
                  <div key={result.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">{result.testName}</h4>
                        <p className="text-sm text-gray-600">{result.labName}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(result.date)}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Нәтиже:</span>
                        <span className={`font-bold ${
                          result.isNormal ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.value} {result.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            result.isNormal ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (result.value / result.referenceMax) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{result.referenceMin} {result.unit}</span>
                        <span>Қалыпты аралық</span>
                        <span>{result.referenceMax} {result.unit}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>{result.notes || 'Қосымша ақпарат жоқ'}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button className="flex items-center text-emerald-600 hover:text-emerald-700">
                        <FaDownload className="mr-2" />
                        PDF жүктеу
                      </button>
                      <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition">
                        Толығырақ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          {/* Боковая панель */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full flex items-center justify-center mr-4">
                    <GiHealthPotion className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Медициналық профиль</h3>
                    <p className="text-sm text-gray-500">Толық бақылау</p>
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
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-800 mb-4">Жедел әрекеттер</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                    <FaUserEdit className="mr-2" />
                    Профильді өңдеу
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">
                    <FaDownload className="mr-2" />
                    Деректерді жүктеу
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
                  <h4 className="font-bold text-gray-800">Соңғы талдау</h4>
                </div>
                <p className="text-sm text-gray-600">30 күн бұрын</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalProfile;