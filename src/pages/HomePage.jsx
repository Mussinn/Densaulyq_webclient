import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { 
  FaEye, FaComments, FaBrain, FaVideo, FaCalendarAlt, 
  FaDatabase, FaKey, FaArrowRight 
} from "react-icons/fa";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { token, roles } = useSelector((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        setError("");
        try {
          const res = await api.get("/api/v1/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } catch (err) {
          console.error("Қате:", err);
          setError("Пайдаланушы мәліметтерін алу мүмкін болмады.");
        }
      }
    };
    fetchUser();
  }, [token]);

  const modules = [
    {
      icon: <FaEye />,
      name: "DensVision",
      description: "Медициналық бейнелерді талдау және диагностика",
      color: "from-blue-500 to-cyan-500",
      path: "/derm-AI"
    },
    {
      icon: <FaComments />,
      name: "DensTalk",
      description: "Науқастармен байланыс және консультациялар",
      color: "from-emerald-500 to-teal-500",
      path: "/messenger"
    },
    {
      icon: <FaBrain />,
      name: "DensAI",
      description: "AI көмекшісі және симптомдарды талдау",
      color: "from-purple-500 to-violet-500",
      path: "/ai"
    },
    {
      icon: <FaVideo />,
      name: "DensMeet",
      description: "Дәрігермен бейнеконсультация",
      color: "from-orange-500 to-red-500",
      path: "/meet"
    },
    {
      icon: <FaCalendarAlt />,
      name: "DensBook",
      description: "Жазылу, расписание және төлем",
      color: "from-pink-500 to-rose-500",
      path: "/booking"
    },
    {
      icon: <FaDatabase />,
      name: "DensVault",
      description: "Медициналық деректерді қауіпсіз сақтау",
      color: "from-indigo-500 to-blue-500",
      path: "/medical-tests"
    },
    {
      icon: <FaKey />,
      name: "DensKey",
      description: "RSA шифрлау және қауіпсіздік",
      color: "from-slate-600 to-gray-700",
      path: "/diagnosis/key-generation"
    }
  ];

  const features = [
    "RSA шифрлау және қауіпсіздік",
    "AI диагностика және талдау",
    "Дәрігермен бейнеконсультация",
    "Деректерді қауіпсіз сақтау"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              Densaulyq
            </h1>
            <p className="text-xl md:text-2xl mb-12 opacity-90">
              Медициналық Платформа
            </p>
            
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Дашбордқа өту
                  <FaArrowRight className="text-sm" />
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  onClick={() => navigate("/register")}
                  className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Тіркелу
                </motion.button>
                <motion.button
                  onClick={() => navigate("/login")}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Кіру
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Platform Modules */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Платформа Модульдері
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Densaulyq — заманауи медициналық қызметтер экожүйесі
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate(module.path)}
              className="group cursor-pointer"
            >
              <div className={`relative bg-gradient-to-br ${module.color} rounded-2xl p-6 h-full text-white shadow-lg hover:shadow-2xl transition-all duration-300`}>
                <div className="text-4xl mb-4 opacity-90">
                  {module.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {module.name}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {module.description}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaArrowRight className="text-xl" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-gray-50 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Неліктен Densaulyq?
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Қазақстандағы ең қауіпсіз және заманауи медициналық платформа
              </p>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FaKey className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">DensKey</h4>
                      <p className="text-sm text-gray-600">RSA шифрлау</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FaDatabase className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">DensVault</h4>
                      <p className="text-sm text-gray-600">Қауіпсіз сақтау</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <FaBrain className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">DensAI</h4>
                      <p className="text-sm text-gray-600">AI диагностика</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* User Welcome Section */}
      {user && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-12 text-white text-center shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-2">
              Қош келдіңіз, {user.firstName} {user.lastName}!
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Рөліңіз: {roles.includes('ROLE_DOCTOR') ? 'Дәрігер' : 'Науқас'}
            </p>
            <motion.button
              onClick={() => navigate("/dashboard")}
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Жеке Кабинет
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* CTA Section for Non-Users */}
      {!user && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Бүгін Бастаңыз
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Тіркелу тегін және бірнеше минут алады
            </p>
            <motion.button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Тегін Тіркелу
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;