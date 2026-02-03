import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  User,
  Stethoscope,
  Clock,
  Star,
  Search,
  RefreshCw,
  Filter
} from 'lucide-react';
import api from '../../utils/api';
import CallButton from '../components/CallButton';
import { useSelector } from 'react-redux';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user } = useSelector((state) => state.token);
  
  // Загрузка докторов из API
  useEffect(() => {
    fetchDoctors();
  }, []);
  
  // Фильтрация при изменении поиска/фильтров
  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specialtyFilter, doctors]);
  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/v1/doctor');
      
      // Обрабатываем реальные данные из API
      const doctorsData = response.data.map(doctor => {
        const user = doctor.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Доктор без имени';

        return {
          id: doctor.doctorId,
          doctorId: doctor.doctorId,
          userId: user.userId,
          fullName,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          specialty: doctor.specialty || 'Не указана',
          phoneNumber: doctor.contactNumber || 'Не указан',
          cleanPhoneNumber: (doctor.contactNumber || '').replace(/[^0-9]/g, ''),
          rating: doctor.rating || 'Нет рейтинга',
          experience: doctor.experience || 'Не указан',
          isOnline: doctor.isOnline || false,           // реальный статус из API
          email: user.email || '',
          department: doctor.department || 'Не указано',
          languages: doctor.languages || [],
          available: doctor.available !== false         // реальная доступность
        };
      });
      
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      
    } catch (err) {
      console.error('Ошибка загрузки докторов:', err);
      setError('Не удалось загрузить список докторов. Попробуйте позже.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const filterDoctors = () => {
    let filtered = [...doctors];
    
    // Поиск по имени и специальности
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.fullName.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term) ||
        doctor.department.toLowerCase().includes(term)
      );
    }
    
    // Фильтр по специальности
    if (specialtyFilter) {
      filtered = filtered.filter(doctor => 
        doctor.specialty === specialtyFilter
      );
    }
    
    setFilteredDoctors(filtered);
  };
  
  // Получить уникальные специальности для фильтра
  const getSpecialties = () => {
    const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
    return specialties;
  };
  
  // Обновить список
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDoctors();
  };
  
  // Сбросить фильтры
  const resetFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
  };
  
  // Форматирование номера телефона
  const formatPhone = (phone) => {
    if (!phone) return 'Не указан';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
      return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
    }
    return phone;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка списка докторов...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Наши Доктора
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Выберите специалиста для онлайн-консультации
          </p>
        </motion.div>
        
        {/* Панель поиска и фильтров */}
        <motion.div 
          className="mb-8 bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Поиск и фильтры</h2>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
              >
                Сбросить
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Обновление...' : 'Обновить'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск по имени или специальности
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Введите имя или специальность..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            
            {/* Фильтр по специальности */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Специальность
              </label>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Все специальности</option>
                {getSpecialties().map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Статистика */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">
                  Всего: {doctors.length} докторов
                </span>
              </div>
              <div className="px-4 py-2 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">
                  Онлайн: {doctors.filter(d => d.isOnline).length}
                </span>
              </div>
              <div className="px-4 py-2 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">
                  Доступно: {filteredDoctors.filter(d => d.available).length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Сообщение об ошибке */}
        {error && (
          <motion.div 
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
        
        {/* Список докторов */}
        {filteredDoctors.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-white rounded-2xl shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <User className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Докторы не найдены</h3>
            <p className="text-gray-600 mb-4">Попробуйте изменить параметры поиска</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Сбросить фильтры
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredDoctors.map((doctor) => (
              <motion.div 
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                {/* Верхняя часть */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl mr-4">
                      {doctor.fullName.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{doctor.fullName}</h3>
                      <div className="flex items-center text-blue-600 mt-1">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        <span className="font-medium">{doctor.specialty}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Статус */}
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${doctor.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`${doctor.isOnline ? 'text-green-700' : 'text-red-700'} font-medium`}>
                      {doctor.isOnline ? 'Онлайн' : 'Офлайн'}
                    </span>
                  </div>
                </div>
                
                {/* Информация */}
                <div className="p-6">
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 mr-3" />
                      <span className="font-medium">Рейтинг:</span>
                      <span className="ml-2">{doctor.rating}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-3" />
                      <span className="font-medium">Опыт:</span>
                      <span className="ml-2">{doctor.experience}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Отделение: {doctor.department}
                    </div>
                    
                    {doctor.phoneNumber && (
                      <div className="text-sm text-gray-600">
                        📞 {formatPhone(doctor.phoneNumber)}
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопка звонка */}
                  <CallButton
                    targetUserId={doctor.userId}
                    targetName={doctor.fullName}
                    size="lg"
                    variant="primary"
                    className="w-full"
                  />
                  
                  {/* Дополнительные кнопки */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="py-2 px-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition text-sm flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Запись
                    </button>
                    
                    <button className="py-2 px-3 border border-gray-600 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition text-sm flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Сообщение
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Информация о звонках */}
        <motion.div 
          className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Phone className="w-6 h-6 mr-2 text-blue-600" />
            Как работают звонки?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">1</div>
              <h4 className="font-semibold text-gray-800 mb-2">Нажмите "Позвонить"</h4>
              <p className="text-gray-600">Выберите доктора и нажмите кнопку звонка</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">2</div>
              <h4 className="font-semibold text-gray-800 mb-2">Ожидайте ответа</h4>
              <p className="text-gray-600">Доктор получит уведомление о звонке</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">3</div>
              <h4 className="font-semibold text-gray-800 mb-2">Начните консультацию</h4>
              <p className="text-gray-600">После принятия звонка начнется безопасная консультация</p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-800">
              💡 <strong>Примечание:</strong> Для работы звонков необходимо, чтобы доктор был онлайн 
              и имел открыто приложение MedSafe.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorsPage;