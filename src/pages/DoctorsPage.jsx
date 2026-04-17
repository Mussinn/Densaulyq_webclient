import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Stethoscope,
  Clock,
  Star,
  Search,
  RefreshCw,
  Filter,
  Mail,
  Calendar,
  MapPin,
  Languages,
  Award,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSelector } from 'react-redux';

const DoctorsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user, token } = useSelector((state) => state.token);
  
  // Дәрігерлерді API-дан жүктеу
  useEffect(() => {
    fetchDoctors();
  }, []);
  
  // Іздеу/сүзгілер өзгергенде сүзгілеу
  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specialtyFilter, doctors]);
  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/v1/doctor');
      
      // API-дан нақты деректерді өңдеу
      const doctorsData = response.data.map(doctor => {
        const userData = doctor.user || {};
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Дәрігер';
        
        // Егер айқын тәжірибе өрісі болмаса, құрылған күнінен тәжірибені есептеу
        let experienceText = doctor.experience || 'Көрсетілмеген';
        if (!doctor.experience && doctor.createdAt) {
          const years = new Date().getFullYear() - new Date(doctor.createdAt).getFullYear();
          experienceText = years > 0 ? `${years} ${getYearsDeclension(years)}` : 'Бір жылдан аз';
        }

        return {
          id: doctor.doctorId,
          doctorId: doctor.doctorId,
          userId: userData.userId,
          fullName,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          specialty: doctor.specialty || 'Көрсетілмеген',
          phoneNumber: doctor.contactNumber || null,
          rating: doctor.rating || 0,
          experience: experienceText,
          isOnline: doctor.isOnline || false,
          email: userData.email || '',
          department: doctor.department || 'Жалпы бөлімше',
          languages: doctor.languages || ['Орыс'],
          available: doctor.available !== false,
          education: doctor.education || 'Ақпарат көрсетілмеген',
          workAddress: doctor.workAddress || 'Мекенжай көрсетілмеген'
        };
      });
      
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      
    } catch (err) {
      console.error('Дәрігерлерді жүктеу қатесі:', err);
      setError('Дәрігерлер тізімін жүктеу мүмкін болмады. Кейінірек қайталаңыз.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // "Жыл" сөзінің жалғауы
  const getYearsDeclension = (years) => {
    if (years % 10 === 1 && years % 100 !== 11) return 'жыл';
    if ([2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100)) return 'жыл';
    return 'жыл';
  };
  
  const filterDoctors = () => {
    let filtered = [...doctors];
    
    // Аты мен мамандығы бойынша іздеу
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.fullName.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term) ||
        doctor.department.toLowerCase().includes(term)
      );
    }
    
    // Мамандығы бойынша сүзгі
    if (specialtyFilter) {
      filtered = filtered.filter(doctor => 
        doctor.specialty === specialtyFilter
      );
    }
    
    setFilteredDoctors(filtered);
  };
  
  // Сүзгілеу үшін бірегей мамандықтарды алу
  const getSpecialties = () => {
    const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
    return specialties.sort();
  };
  
  // Тізімді жаңарту
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDoctors();
  };
  
  // Сүзгілерді тазалау
  const resetFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
  };
  
  // Қабылдауға жазылу өңдеушісі - /booking бетіне мамандық параметрімен өту
  const handleAppointment = (doctor) => {
    navigate(`/booking?specialist=${encodeURIComponent(doctor.specialty)}`);
  };
  
  // Хабарлама өңдеушісі - таңдалған дәрігермен мессенджерге өту
  const handleMessage = (doctor) => {
    navigate(`/messenger?userId=${doctor.userId}&name=${encodeURIComponent(doctor.fullName)}`);
  };
  
  // Рейтингті пішімдеу
  const renderRating = (rating) => {
    if (!rating || rating === 0) return 'Бағалар жоқ';
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400" />);
    }
    return stars;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Дәрігерлер тізімі жүктелуде...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Тақырып */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Біздің Дәрігерлер
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Кеңес алу немесе қабылдауға жазылу үшін маманды таңдаңыз
          </p>
        </motion.div>
        
        {/* Іздеу және сүзгілер панелі */}
        <motion.div 
          className="mb-8 bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Іздеу және сүзгілер</h2>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
              >
                Тазалау
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Жаңарту...' : 'Жаңарту'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Іздеу */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Аты немесе мамандығы бойынша іздеу
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Аты немесе мамандығын енгізіңіз..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            
            {/* Мамандығы бойынша сүзгі */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Мамандығы
              </label>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Барлық мамандықтар</option>
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
                  Барлығы: {doctors.length} дәрігер
                </span>
              </div>
              <div className="px-4 py-2 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">
                  Онлайн: {doctors.filter(d => d.isOnline).length}
                </span>
              </div>
              <div className="px-4 py-2 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">
                  Қолжетімді: {filteredDoctors.filter(d => d.available).length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Қате туралы хабарлама */}
        {error && (
          <motion.div 
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
        
        {/* Дәрігерлер тізімі */}
        {filteredDoctors.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-white rounded-2xl shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <User className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Дәрігерлер табылмады</h3>
            <p className="text-gray-600 mb-4">Іздеу параметрлерін өзгертіп көріңіз</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Сүзгілерді тазалау
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
                {/* Жоғарғы бөлік - аватар және негізгі ақпарат */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-2xl mr-4 shadow-md">
                      {doctor.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-xl">{doctor.fullName}</h3>
                      <div className="flex items-center text-blue-700 mt-1">
                        <Stethoscope className="w-4 h-4 mr-1" />
                        <span className="font-medium text-sm">{doctor.specialty}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Статус */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${doctor.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm ${doctor.isOnline ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                        {doctor.isOnline ? 'Кеңес алуға қолжетімді' : 'Желіде емес'}
                      </span>
                    </div>
                    
                    {/* Рейтинг */}
                    <div className="flex items-center">
                      {typeof doctor.rating === 'number' && doctor.rating > 0 ? (
                        <>
                          {renderRating(doctor.rating)}
                          <span className="text-sm text-gray-600 ml-1">({doctor.rating})</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Бағалар жоқ</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Толық ақпарат */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {/* Тәжірибе */}
                    <div className="flex items-start text-gray-700">
                      <Clock className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-800">Жұмыс тәжірибесі: </span>
                        <span>{doctor.experience}</span>
                      </div>
                    </div>
                    
                    {/* Бөлімше */}
                    <div className="flex items-start text-gray-700">
                      <MapPin className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-800">Бөлімше: </span>
                        <span>{doctor.department}</span>
                      </div>
                    </div>
                    
                    {/* Тілдер */}
                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="flex items-start text-gray-700">
                        <Languages className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-800">Тілдер: </span>
                          <span>{doctor.languages.join(', ')}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Email */}
                    {doctor.email && (
                      <div className="flex items-start text-gray-700">
                        <Mail className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-800">Email: </span>
                          <span className="text-sm">{doctor.email}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Білім (егер бар болса) */}
                    {doctor.education && doctor.education !== 'Ақпарат көрсетілмеген' && (
                      <div className="flex items-start text-gray-700">
                        <Award className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-800">Білімі: </span>
                          <span className="text-sm">{doctor.education}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Әрекет түймелері */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* "Хабарлама" түймесі - мессенджерге өту */}
                    <button
                      onClick={() => handleMessage(doctor)}
                      className="py-2.5 px-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Хабарлама
                    </button>
                    
                    {/* "Жазылу" түймесі - /booking бетіне өту */}
                    <button
                      onClick={() => handleAppointment(doctor)}
                      className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Calendar className="w-5 h-5" />
                      Жазылу
                    </button>
                  </div>
                  
                  {/* Қолжетімділік туралы ескерту */}
                  {!doctor.isOnline && (
                    <p className="text-xs text-center text-gray-400 mt-4">
                      Дәрігер қазір желіде емес. Сіз хабарлама қалдыра аласыз немесе қабылдауға жазыла аласыз.
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Кеңестер туралы ақпарат */}
        <motion.div 
          className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Дәрігерге қалай жазылуға болады?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">1</div>
              <h4 className="font-semibold text-gray-800 mb-2">Дәрігерді таңдаңыз</h4>
              <p className="text-gray-600">Мамандығы немесе рейтингі бойынша қолайлы маманды табыңыз</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">2</div>
              <h4 className="font-semibold text-gray-800 mb-2">"Жазылу" батырмасын басыңыз</h4>
              <p className="text-gray-600">Сіз таңдалған мамандықпен брондау бетіне өтесіз</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">3</div>
              <h4 className="font-semibold text-gray-800 mb-2">Уақытты таңдаңыз</h4>
              <p className="text-gray-600">Дәрігерге келу үшін ыңғайлы күн мен уақытты таңдаңыз</p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Ескерту:</strong> Дәрігер желіде болмаса да, сіз оған хабарлама жаза аласыз. 
              Жауап жеке кабинетке және көрсетілген поштаға келеді.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorsPage;