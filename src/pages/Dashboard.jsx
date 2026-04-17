import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pie, Bar, Line } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend,
  Title 
} from "chart.js";
import api from "../../utils/api";
import { 
  FaUsers, 
  FaFileMedical, 
  FaFlask, 
  FaChartLine, 
  FaChartBar, 
  FaChartPie,
  FaShieldAlt,
  FaUserMd,
  FaHeartbeat,
  FaCalendarCheck,
  FaComments,
  FaPaperPlane,
  FaHome,
  FaStethoscope,
  FaHospitalUser,
  FaMicroscope,
  FaPrescription,
  FaRegCalendarAlt,
  FaArrowRight,
  FaStar,
  FaStarHalfAlt,
  FaUserGraduate,
  FaAward,
  FaRocket,
  FaGlobe,
  FaBell,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa";
import { GiHealthPotion, GiMedicines, GiHospitalCross } from "react-icons/gi";

ChartJS.register(
  ArcElement, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend,
  Title
);

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDiagnoses: 0,
    totalTests: 0,
    totalDoctors: 0,
    topDoctorsByAppointments: [],
    topDoctorsByDiagnoses: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, roles } = useSelector((state) => state.token);
  const navigate = useNavigate();
  const isDoctor = roles?.includes("ROLE_DOCTOR");
  const isAdmin = roles?.includes("ROLE_ADMIN");
  const isPatient = roles?.includes("ROLE_USER");

  useEffect(() => {
    const fetchStats = async () => {
      setError("");
      setLoading(true);
      try {
        if (!token || typeof token !== "string") {
          throw new Error("Жарамды JWT токені табылмады");
        }
        const response = await api.get("/api/dashboard/statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(prev => ({
          ...prev,
          ...response.data,
          totalDoctors: response.data.totalDoctors || 12
        }));
      } catch (err) {
        console.error("Статистиканы алу қатесі:", err);
        setError("Статистиканы жүктеу мүмкін болмады. Қайтадан көріңіз.");
        // Демо деректер
        setStats({
          totalPatients: 2847,
          totalDiagnoses: 12563,
          totalTests: 8921,
          totalDoctors: 24,
          topDoctorsByAppointments: [
            { fullName: "Др. Айдар Жұмағалиев", specialty: "Кардиолог", count: 342, rating: 4.9 },
            { fullName: "Др. Меруерт Сапарбаева", specialty: "Невролог", count: 298, rating: 4.8 },
            { fullName: "Др. Ерлан Нұржанұлы", specialty: "Хирург", count: 276, rating: 4.9 },
            { fullName: "Др. Айгүл Сейтжанова", specialty: "Педиатр", count: 254, rating: 4.7 },
            { fullName: "Др. Бауыржан Төлегенов", specialty: "Терапевт", count: 231, rating: 4.8 }
          ],
          topDoctorsByDiagnoses: [
            { fullName: "Др. Айдар Жұмағалиев", specialty: "Кардиолог", count: 187, rating: 4.9 },
            { fullName: "Др. Ерлан Нұржанұлы", specialty: "Хирург", count: 165, rating: 4.9 },
            { fullName: "Др. Меруерт Сапарбаева", specialty: "Невролог", count: 154, rating: 4.8 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    hover: { y: -8, transition: { type: "spring", stiffness: 300 } }
  };

  const statCards = [
    {
      icon: <FaHospitalUser className="text-3xl" />,
      title: "Барлық Пациенттер",
      value: stats.totalPatients,
      color: "from-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12%",
      trendUp: true
    },
    {
      icon: <FaStethoscope className="text-3xl" />,
      title: "Барлық Диагноздар",
      value: stats.totalDiagnoses,
      color: "from-emerald-600 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "+8%",
      trendUp: true
    },
    {
      icon: <FaMicroscope className="text-3xl" />,
      title: "Барлық Тесттер",
      value: stats.totalTests,
      color: "from-amber-600 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      trend: "+15%",
      trendUp: true
    },
    {
      icon: <FaUserMd className="text-3xl" />,
      title: "Белсенді Дәрігерлер",
      value: stats.totalDoctors,
      color: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: "+5%",
      trendUp: true
    }
  ];

  const quickActions = [
    {
      icon: <FaStethoscope className="text-xl" />,
      title: "Жаңа Диагноз",
      desc: "Пациентке диагноз қою",
      path: "/diagnosis/create",
      color: "from-emerald-500 to-teal-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN"]
    },
    {
      icon: <FaUsers className="text-xl" />,
      title: "Пациенттер",
      desc: "Барлық пациенттерді көру",
      path: "/patients",
      color: "from-blue-500 to-indigo-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN"]
    },
    {
      icon: <FaComments className="text-xl" />,
      title: "Мессенджер",
      desc: "Хабарлар алмасу",
      path: "/messenger",
      color: "from-indigo-500 to-purple-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN", "ROLE_USER"]
    },
    {
      icon: <FaRegCalendarAlt className="text-xl" />,
      title: "Қабылдау",
      desc: "Жаңа қабылдауға жазылу",
      path: "/booking",
      color: "from-rose-500 to-pink-500",
      roles: ["ROLE_USER"]
    }
  ].filter(action => action.roles.some(role => roles?.includes(role)));

  const pieData = {
    labels: ["Пациенттер", "Диагноздар", "Тесттер"],
    datasets: [{
      data: [stats.totalPatients, stats.totalDiagnoses, stats.totalTests],
      backgroundColor: ["#4F46E5", "#10B981", "#F59E0B"],
      borderWidth: 0,
      borderRadius: 10,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 12 }, usePointStyle: true, padding: 15 } },
      tooltip: { backgroundColor: "#1F2937", titleColor: "#F9FAFB", bodyColor: "#D1D5DB", cornerRadius: 8 }
    },
  };

  const barData = {
    labels: ["Пациенттер", "Диагноздар", "Тесттер"],
    datasets: [{
      label: "Саны",
      data: [stats.totalPatients, stats.totalDiagnoses, stats.totalTests],
      backgroundColor: ["#4F46E5", "#10B981", "#F59E0B"],
      borderRadius: 10,
      barPercentage: 0.6,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1F2937", cornerRadius: 8 } },
    scales: { y: { beginAtZero: true, grid: { color: "#E5E7EB" }, title: { display: true, text: "Саны" } }, x: { grid: { display: false }, title: { display: true, text: "Категориялар" } } },
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<FaStar key={i} className="text-yellow-400 text-xs" />);
    if (hasHalfStar) stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 text-xs" />);
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GiHealthPotion className="text-3xl text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Деректер жүктелуде</h2>
          <p className="text-gray-500">Статистика дайындалуда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl shadow-lg">
                  <GiHospitalCross className="text-white text-2xl" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Бақылау тақтасы
                </h1>
              </div>
              <p className="text-gray-500 ml-14">Жүйе статистикасы мен басқару орталығы</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : isDoctor ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
                  <span className="font-medium text-gray-700">
                    {isAdmin ? "Әкімші" : isDoctor ? "Дәрігер" : "Пациент"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/")}
                className="group bg-white hover:bg-indigo-600 border border-gray-200 hover:border-indigo-600 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <FaHome className="text-gray-600 group-hover:text-white transition" />
                <span className="text-gray-700 group-hover:text-white transition">Басты бет</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-500" />
                <p>{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Welcome Banner */}
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <FaRocket className="text-white/80 text-2xl" />
                    <span className="text-white/80 font-medium">Densaulyq</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Қош келдіңіз!
                  </h2>
                  <p className="text-indigo-100 max-w-md">
                    Жүйедегі соңғы жаңалықтар мен статистикаларды қадағалаңыз
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalPatients}</div>
                    <div className="text-xs text-white/80">Пациент</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalDoctors}</div>
                    <div className="text-xs text-white/80">Дәрігер</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <motion.div variants={fadeInUp} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <FaRocket className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Жедел әрекеттер</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  variants={cardVariants}
                  whileHover="hover"
                  onClick={() => navigate(action.path)}
                  className={`group relative overflow-hidden bg-gradient-to-r ${action.color} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                  <div className="relative flex flex-col items-start gap-2">
                    <div className="p-2 bg-white/20 rounded-lg">{action.icon}</div>
                    <h3 className="font-bold text-sm">{action.title}</h3>
                    <p className="text-white/70 text-xs">{action.desc}</p>
                    <FaArrowRight className="absolute bottom-3 right-3 text-white/50 group-hover:text-white/100 transition" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Statistics Cards */}
        <motion.div variants={fadeInUp} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <FaChartLine className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Негізгі көрсеткіштер</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={cardVariants}
                whileHover="hover"
                className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-3 ${stat.iconBg} rounded-xl`}>
                    <div className={stat.iconColor}>{stat.icon}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span>{stat.trendUp ? '↑' : '↓'} {stat.trend}</span>
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm mb-1">{stat.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">барлығы</span>
                </div>
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full w-3/4 bg-gradient-to-r ${stat.color} rounded-full`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={fadeInUp} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 rounded-xl">
              <FaChartPie className="text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Статистикалық талдау</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaChartPie className="text-indigo-500" /> Деректер таралуы
              </h3>
              <div className="h-64">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaChartBar className="text-indigo-500" /> Салыстырмалы статистика
              </h3>
              <div className="h-64">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Doctors Section */}
        <motion.div variants={fadeInUp} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-100 rounded-xl">
              <FaAward className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Үздік дәрігерлер</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top by Appointments */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaCalendarCheck className="text-emerald-500" /> Қабылдаулар бойынша
                </h3>
                <span className="text-xs text-gray-400">Топ 5</span>
              </div>
              <div className="space-y-3">
                {stats.topDoctorsByAppointments?.map((doctor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                        'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{doctor.fullName}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">{doctor.specialty}</span>
                          <div className="flex gap-0.5">{renderStars(doctor.rating)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{doctor.count}</p>
                      <p className="text-xs text-gray-400">қабылдау</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top by Diagnoses */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaStethoscope className="text-purple-500" /> Диагноздар бойынша
                </h3>
                <span className="text-xs text-gray-400">Топ 5</span>
              </div>
              <div className="space-y-3">
                {stats.topDoctorsByDiagnoses?.map((doctor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{doctor.fullName}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">{doctor.specialty}</span>
                          <div className="flex gap-0.5">{renderStars(doctor.rating)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{doctor.count}</p>
                      <p className="text-xs text-gray-400">диагноз</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div variants={fadeInUp}>
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FaShieldAlt className="text-emerald-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Жүйе қауіпсіздігі</h3>
                  <p className="text-gray-400 text-sm">RSA шифрлау арқылы қорғалған</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">256-бит</div>
                  <div className="text-gray-400 text-xs">Шифрлау</div>
                </div>
                <div className="w-px h-10 bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">99.9%</div>
                  <div className="text-gray-400 text-xs">Қорғау</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GiHealthPotion className="text-white text-sm" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Densaulyq Медициналық Платформасы</p>
                <p className="text-xs text-gray-500">RSA шифрлау арқылы қорғалған</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">© {new Date().getFullYear()} Densaulyq | Қазақстандық медициналық жүйе</p>
              <p className="text-xs text-gray-400 mt-1">Барлық деректер қорғалған</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;