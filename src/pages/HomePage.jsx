import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { FaShieldAlt, FaLock, FaUserMd, FaVideo, FaRobot, FaKey, FaHeartbeat } from "react-icons/fa";
import { GiHealthPotion, GiStethoscope, GiMedicalPack, GiHealing } from "react-icons/gi";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { token, roles } = useSelector((state) => state.token);
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        setError("");
        try {
          const res = await api.get("/api/v1/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Пайдаланушы мәліметтері:", res.data);
          setUser(res.data);
        } catch (err) {
          console.error("Пайдаланушы мәліметтерін алу қатесі:", err);
          setError("Пайдаланушы мәліметтерін алу мүмкін болмады.");
        }
      }
    };
    fetchUser();
  }, [token]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  const bounceVariants = {
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  const features = [
    {
      icon: <FaLock className="text-emerald-600 text-2xl" />,
      title: "RSA Шифрлау",
      description: "Медициналық деректерді RSA алгоритмімен шифрлау арқылы қорғаймыз.",
      color: "emerald"
    },
    {
      icon: <FaKey className="text-blue-600 text-2xl" />,
      title: "Жеке Кілттер",
      description: "Әр пайдаланушыға жеке кілттер арқылы қауіпсіз және ыңғайлы кіру.",
      color: "blue"
    },
    {
      icon: <GiStethoscope className="text-purple-600 text-2xl" />,
      title: "Телемедицина",
      description: "Дәрігерлермен қауіпсіз бейнеконсультация және диагноз беру.",
      color: "purple"
    },
    {
      icon: <FaRobot className="text-orange-600 text-2xl" />,
      title: "AI Диагностика",
      description: "Жасанды интеллект арқылы симптомдарды талдау және жеделдікті бағалау.",
      color: "orange"
    },
    {
      icon: <FaShieldAlt className="text-red-600 text-2xl" />,
      title: "Қауіпсіздік Аудиті",
      description: "Барлық әрекеттерді бақылау және қауіпсіздікті қамтамасыз ету.",
      color: "red"
    },
    {
      icon: <GiMedicalPack className="text-teal-600 text-2xl" />,
      title: "Деректер Қорғау",
      description: "Деректерді Қазақстан заңдарына сәйкес қорғау және сақтау.",
      color: "teal"
    },
  ];

  const quickActions = [
    {
      icon: <FaVideo className="text-white text-xl" />,
      title: "Бейнеконсультация",
      description: "Дәрігермен қауіпсіз бейнебайланыс",
      path: "/video-conference",
      color: "from-blue-500 to-sky-500"
    },
    {
      icon: <FaRobot className="text-white text-xl" />,
      title: "AI Диагностика",
      description: "Симптомдарды талдау",
      path: "/ai",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <FaKey className="text-white text-xl" />,
      title: "Кілттер",
      description: "RSA кілттерін басқару",
      path: "/diagnosis/key-generation",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: <FaLock className="text-white text-xl" />,
      title: "Диагноз Шешу",
      description: "Шифрленген диагнозды оқу",
      path: "/diagnosis/view",
      color: "from-orange-500 to-red-500"
    },
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Hero Section */}
      <motion.header
        className="flex flex-col items-center justify-center text-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white w-full relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        aria-labelledby="hero-heading"
      >
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-white/30">
            <GiHealthPotion className="text-white text-4xl" />
          </div>
          
          <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block">Densaulyq</span>
            <span className="text-2xl md:text-3xl font-normal opacity-90">Медициналық Платформа</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Қазақстандық медициналық қызметтер платформасы. 
            Медициналық деректерді қауіпсіз сақтау және өңдеу жүйесі. 
            RSA шифрлауы мен жеке кілттер арқылы сіздің құпиялылығыңызды қамтамасыз етеміз.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white transition duration-200 shadow-lg hover:shadow-xl"
                aria-label="Дашбордқа өту"
              >
                Дашбордқа Өту
              </button>
              <button
                onClick={() => handleNavigate("/ai")}
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white transition duration-200"
                aria-label="AI Көмекші"
              >
                AI Көмекшісі
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleNavigate("/login")}
                className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white transition duration-200 shadow-lg hover:shadow-xl"
                aria-label="Кіру"
              >
                Кіру
              </button>
              <button
                onClick={() => handleNavigate("/register")}
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white transition duration-200"
                aria-label="Тіркелу"
              >
                Тіркелу
              </button>
            </div>
          )}
        </div>
      </motion.header>

      {/* Жедел Әрекеттер (егер тіркелген болса) */}
      {user && (
        <motion.section
          className="py-12 px-4 sm:px-6 lg:px-8 w-full"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          aria-labelledby="quick-actions-heading"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="quick-actions-heading" className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center">
              <GiHealing className="mr-3 text-emerald-600" />
              Жедел Әрекеттер
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  className="relative group cursor-pointer"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  onClick={() => handleNavigate(action.path)}
                >
                  <motion.div 
                    className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full`}
                    variants={bounceVariants}
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{action.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{action.description}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Мүмкіндіктер Бөлімі */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 w-full"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12 flex items-center justify-center">
            <FaShieldAlt className="mr-3 text-emerald-600" />
            Densaulyq Жүйесінің Мүмкіндіктері
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.03 }}
              >
                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <div className={`mt-4 h-1 w-12 bg-${feature.color}-500 rounded-full`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Тіркелген Пайдаланушы Бөлімі */}
      {user && (
        <motion.section
          className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-50 to-teal-50 w-full"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          aria-labelledby="welcome-heading"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaUserMd className="text-white text-2xl" />
            </div>
            
            <h2 id="welcome-heading" className="text-3xl font-bold text-gray-800 mb-4">
              Қош келдіңіз, {user.firstName} {user.lastName}!
            </h2>
            
            <div className="inline-flex items-center bg-white px-4 py-2 rounded-full mb-6 shadow-sm">
              <span className="text-emerald-600 font-medium">
                Рөліңіз: {roles.map(role => {
                  switch(role) {
                    case 'ROLE_USER': return 'Науқас';
                    case 'ROLE_DOCTOR': return 'Дәрігер';
                    default: return role;
                  }
                }).join(', ')}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200 shadow-md hover:shadow-lg"
                aria-label="Жеке кабинетке өту"
              >
                Жеке Кабинетке Өту
              </button>
              <button
                onClick={() => handleNavigate("/video-conference")}
                className="bg-white text-emerald-600 border-2 border-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200"
                aria-label="Бейнеконсультация"
              >
                Бейнеконсультация
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Тіркелмеген Пайдаланушыларға */}
      {!user && (
        <motion.section
          className="py-16 px-4 sm:px-6 lg:px-8 w-full"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          aria-labelledby="cta-heading"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 id="cta-heading" className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                Densaulyq Платформасын Қолдануды Бастаңыз
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Тіркелу арқылы сіз қауіпсіз медициналық қызметтерге қол жеткізе аласыз, 
                AI диагностикасын пайдалана аласыз және дәрігерлермен қауіпсіз байланыса аласыз.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleNavigate("/register")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200 shadow-md hover:shadow-lg"
                  aria-label="Тегін тіркелу"
                >
                  Тегін Тіркелу
                </button>
                <button
                  onClick={() => handleNavigate("/login")}
                  className="bg-white text-emerald-600 border-2 border-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200"
                  aria-label="Аккаунтыңыз бар болса"
                >
                  Аккаунтым Бар
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Қате Хабарламасы */}
      {error && (
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HomePage;