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
  FaHome
} from "react-icons/fa";
import { GiStethoscope, GiHealthPotion } from "react-icons/gi";

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
    monthlyData: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, roles } = useSelector((state) => state.token);
  const navigate = useNavigate();
  const isDoctor = roles.includes("ROLE_DOCTOR");
  const isAdmin = roles.includes("ROLE_ADMIN");

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
        setStats(response.data);
      } catch (err) {
        console.error("Статистиканы алу қатесі:", err);
        setError("Статистиканы жүктеу мүмкін болмады. Қайтадан көріңіз.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

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
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  const bounceVariants = {
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  // Statistics cards data
  const statCards = [
    {
      icon: <FaUsers className="text-3xl" />,
      title: "Жалпы Пациенттер",
      value: stats.totalPatients,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600"
    },
    {
      icon: <FaFileMedical className="text-3xl" />,
      title: "Жалпы Диагноздар",
      value: stats.totalDiagnoses,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600"
    },
    {
      icon: <FaFlask className="text-3xl" />,
      title: "Жалпы Тесттер",
      value: stats.totalTests,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-100",
      textColor: "text-amber-600"
    },
    {
      icon: <FaUserMd className="text-3xl" />,
      title: "Белсенді Дәрігерлер",
      value: Math.floor(stats.totalPatients / 10), // Пример расчета
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600"
    }
  ];

  // Quick actions based on role
  const quickActions = [
    {
      icon: <GiStethoscope className="text-xl" />,
      title: "Жаңа Диагноз",
      description: "Пациентке диагноз қою",
      path: "/diagnosis/create",
      color: "from-emerald-500 to-teal-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN"]
    },
    {
      icon: <FaHeartbeat className="text-xl" />,
      title: "Пациенттер Тізімі",
      description: "Барлық пациенттерді көру",
      path: "/patients",
      color: "from-blue-500 to-indigo-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN", "ROLE_USER"]
    },
    {
      icon: <FaComments className="text-xl" />,
      title: "Мессенджер",
      description: "Хабарлар алмасу",
      path: "/messenger",
      color: "from-indigo-500 to-purple-500",
      roles: ["ROLE_DOCTOR", "ROLE_ADMIN", "ROLE_USER"]
    },
    {
      icon: <FaShieldAlt className="text-xl" />,
      title: "Қауіпсіздік",
      description: "RSA кілттерін басқару",
      path: "/security/keys",
      color: "from-red-500 to-orange-500",
      roles: ["ROLE_ADMIN", "ROLE_DOCTOR"]
    }
  ].filter(action => action.roles.some(role => roles.includes(role)));

  // Pie chart data
  const pieData = {
    labels: ["Пациенттер", "Диагноздар", "Тесттер"],
    datasets: [
      {
        data: [stats.totalPatients, stats.totalDiagnoses, stats.totalTests],
        backgroundColor: ["#4F46E5", "#10B981", "#F59E0B"],
        hoverBackgroundColor: ["#4338CA", "#059669", "#D97706"],
        borderWidth: 2,
        borderColor: "#ffffff"
      },
    ],
  };

  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { 
          font: { size: 14, family: "'Inter', sans-serif" },
          padding: 20,
          usePointStyle: true
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: { 
          label: (context) => `${context.label}: ${context.raw}` 
        },
      },
    },
  };

  // Bar chart data
  const barData = {
    labels: ["Пациенттер", "Диагноздар", "Тесттер"],
    datasets: [
      {
        label: "Статистика",
        data: [stats.totalPatients, stats.totalDiagnoses, stats.totalTests],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(79, 70, 229)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: { 
          display: true, 
          text: "Саны", 
          font: { size: 14, weight: 'bold' },
          color: '#4b5563'
        },
      },
      x: {
        grid: {
          display: false
        },
        title: { 
          display: true, 
          text: "Категориялар", 
          font: { size: 14, weight: 'bold' },
          color: '#4b5563'
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: { 
          label: (context) => `${context.label}: ${context.raw}` 
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Басты бақылау тақтасы</h1>
              <p className="text-gray-600 mt-2">Жүйенің статистикасы мен басқару</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <span className="font-medium text-gray-700">
                  {roles.includes("ROLE_ADMIN") ? "Әкімші" : 
                   roles.includes("ROLE_DOCTOR") ? "Дәрігер" : "Пайдаланушы"}
                </span>
              </div>
              <button
                onClick={() => navigate("/")}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-white rounded-xl transition duration-200 flex items-center"
              >
                <FaHome className="mr-2" />
                Басты бетке
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-8"
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

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <motion.section
              className="mb-8"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Қош келдіңіз, Densaulyq пайдаланушысы!
                </h2>
                <p className="text-gray-600">
                  Жүйедегі соңғы статистика мен жедел әрекеттер төменде көрсетілген.
                </p>
              </div>
            </motion.section>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <motion.section
                className="mb-8"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                aria-labelledby="quick-actions-heading"
              >
                <h2 id="quick-actions-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaChartLine className="mr-3 text-indigo-600" />
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
                      onClick={() => navigate(action.path)}
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
              </motion.section>
            )}

            {/* Statistics Cards */}
            <motion.section
              className="mb-8"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              aria-labelledby="stats-heading"
            >
              <h2 id="stats-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaChartBar className="mr-3 text-indigo-600" />
                Негізгі Статистика
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                    variants={cardVariants}
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4 ${stat.textColor}`}>
                      {stat.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{stat.title}</h3>
                    <div className="flex items-baseline">
                      <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
                      <div className={`ml-2 w-16 h-2 bg-gradient-to-r ${stat.color} rounded-full`}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Соңғы 30 күнде</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Charts Section */}
            <motion.section
              className="mb-8"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              aria-labelledby="charts-heading"
            >
              <h2 id="charts-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaChartPie className="mr-3 text-indigo-600" />
                Талдау Диаграммалары
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <motion.div 
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  variants={cardVariants}
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <FaChartPie className="mr-2 text-indigo-600" />
                    Деректердің таралуы
                  </h3>
                  <div className="h-64">
                    <Pie data={pieData} options={pieOptions} aria-label="Статистиканың таралу диаграммасы" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Жүйедегі барлық деректердің проценттік таралуы
                  </p>
                </motion.div>

                {/* Bar Chart */}
                <motion.div 
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  variants={cardVariants}
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-indigo-600" />
                    Салыстырмалы Статистика
                  </h3>
                  <div className="h-64">
                    <Bar data={barData} options={barOptions} aria-label="Статистиканы салыстыру диаграммасы" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Әрбір категорияның санын көрсетеді
                  </p>
                </motion.div>
              </div>
            </motion.section>

            {/* Recent Activity */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              aria-labelledby="activity-heading"
            >
              <h2 id="activity-heading" className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaCalendarCheck className="mr-3 text-indigo-600" />
                Соңғы Әрекеттер
              </h2>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center p-4 hover:bg-gray-50 rounded-xl transition duration-200">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                          <GiStethoscope className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{activity.description}</p>
                          <p className="text-sm text-gray-500">{activity.date}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          activity.type === 'diagnosis' ? 'bg-indigo-100 text-indigo-800' :
                          activity.type === 'test' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {activity.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GiStethoscope className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Әрекеттер жоқ</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Соңғы әрекеттер әлі жоқ. Жүйені пайдалана бастағаннан кейін бұл бөлім толтырылады.
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <GiHealthPotion className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Densaulyq Медициналық Платформасы</p>
                <p className="text-sm text-gray-500">RSA шифрлау арқылы қорғалған</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Densaulyq | Қазақстандық медициналық қорғау жүйесі
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Барлық медициналық деректер Қазақстан заңдарына сәйкес қорғалады
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;