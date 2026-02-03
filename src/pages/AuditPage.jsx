import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaFilter, 
  FaUser, 
  FaCalendarAlt, 
  FaList, 
  FaRedo, 
  FaSearch,
  FaEye,
  FaDatabase,
  FaHistory,
  FaShieldAlt
} from "react-icons/fa";
import { 
  GiArchiveResearch,
  GiNotebook
} from "react-icons/gi";
import axios from "axios";

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    uniqueUsers: 0,
    mostCommonAction: ""
  });
  
  const authToken = useSelector((state) => state.token.token);
  const navigate = useNavigate();

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
  };

  // Fetch audit logs
  const fetchAuditLogs = async (params = {}, pageNum = 1) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!authToken || typeof authToken !== "string") {
        throw new Error("Invalid or missing JWT token");
      }
      
      const allParams = { 
        page: pageNum - 1, 
        size: 20,
        ...params 
      };
      
      const response = await axios.get("http://localhost:8080/api/audit/logs", {
        params: allParams,
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
        },
      });
      
      setLogs(response.data.content || response.data);
      setTotalPages(response.data.totalPages || 1);
      setPage(pageNum);
      setSuccess("Аудит журналы сәтті жүктелді!");
    } catch (err) {
      console.error("Аудит журналын жүктеу қатесі:", err.response || err);
      setError(
        err.response?.data?.message ||
          "Аудит журналын жүктеу кезінде қате пайда болды"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/audit/statistics", {
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
        },
      });
      setStats(response.data);
    } catch (err) {
      console.error("Статистиканы жүктеу қатесі:", err);
    }
  };

  // Handle filter submission
  const handleFilter = (e) => {
    e.preventDefault();
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (action) params.action = action;
    if (userId) params.userId = userId;
    if (searchQuery) params.search = searchQuery;
    
    fetchAuditLogs(params);
  };

  // Reset filters
  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setAction("");
    setUserId("");
    setSearchQuery("");
    setPage(1);
    fetchAuditLogs();
  };

  // Handle log details view
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAuditLogs({}, newPage);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (!authToken) {
      setError("Авторизация қажет. Кіріңіз.");
      navigate("/login");
    } else {
      fetchAuditLogs();
      fetchStatistics();
    }
  }, [authToken, navigate]);

  // Filter actions for dropdown
  const actionTypes = [
    "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", 
    "READ", "EXPORT", "IMPORT", "BACKUP", "RESTORE"
  ];

  // Filtered logs for display
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (log.user?.username?.toLowerCase().includes(query)) ||
      (log.action?.toLowerCase().includes(query)) ||
      (log.targetTable?.toLowerCase().includes(query)) ||
      (log.ipAddress?.toLowerCase().includes(query))
    );
  });

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.header
        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white w-full"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-6 sm:mb-0">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-6 backdrop-blur-sm">
                <GiArchiveResearch className="text-white text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Аудит Журналы</h1>
                <p className="text-emerald-100">Жүйелік әрекеттерді бақылау және талдау</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <span className="font-medium">Әкімші режимі</span>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition duration-200 backdrop-blur-sm"
              >
                Дашбордқа
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Error/Success Messages */}
          {error && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
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

          {success && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            </motion.div>
          )}

          {/* Statistics Cards */}
          <motion.section
            className="mb-8"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FaHistory className="mr-3 text-emerald-600" />
              Аудит Статистикасы
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-sky-100 rounded-xl flex items-center justify-center mr-4">
                    <GiNotebook className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Жалпы Логтар</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalLogs}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Бүгінгі логтар: {stats.todayLogs}</p>
              </motion.div>

              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mr-4">
                    <FaUser className="text-emerald-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Белсенді Пайдаланушылар</h3>
                    <p className="text-3xl font-bold text-emerald-600">{stats.uniqueUsers}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Соңғы 30 күнде</p>
              </motion.div>

              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mr-4">
                    <FaDatabase className="text-purple-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Жиі Әрекет</h3>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.mostCommonAction || "Жоқ"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Ең жиі орындалған операция</p>
              </motion.div>

              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl flex items-center justify-center mr-4">
                    <FaShieldAlt className="text-orange-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Қауіпсіздік Деңгейі</h3>
                    <p className="text-3xl font-bold text-orange-600">Жоғары</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">RSA шифрлау белсенді</p>
              </motion.div>
            </div>
          </motion.section>

          {/* Search and Filter Section */}
          <motion.section
            className="mb-8"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaSearch className="mr-3 text-emerald-600" />
                Логтарды Іздеу және Сүзгілеу
              </h2>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пайдаланушы аты, әрекет, IP мекенжайы бойынша іздеу..."
                  className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                />
              </div>

              {/* Filter Form */}
              <form onSubmit={handleFilter} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Басталу Күні
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Аяқталу Күні
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
                      Әрекет Түрі
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaFilter className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="action"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200 bg-white"
                      >
                        <option value="">Барлық әрекеттер</option>
                        {actionTypes.map((act) => (
                          <option key={act} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                      Пайдаланушы ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                        placeholder="Пайдаланушы ID"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-200 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Жүктелуде...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaFilter className="mr-3" />
                        Логтарды Фильтрлеу
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 border-2 border-gray-300 text-gray-700 p-4 rounded-xl font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaRedo className="mr-3" />
                    Фильтрлерді Тазалау
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.section>

          {/* Logs Table */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FaList className="mr-3 text-emerald-600" />
                  Аудит Логтары
                </h2>
                <div className="text-sm text-gray-500">
                  Жалпы: {filteredLogs.length} лог
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Пайдаланушы</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Әрекет</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Кесте</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Әрекет Күні</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">IP Мекенжайы</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Әрекеттер</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, index) => (
                        <motion.tr
                          key={log.auditId || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition duration-200"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-semibold text-emerald-600">
                                  {log.user?.username?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{log.user?.username || "Белгісіз"}</div>
                                <div className="text-sm text-gray-500">ID: {log.user?.id || "-"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                              log.action === 'LOGOUT' ? 'bg-blue-100 text-blue-800' :
                              log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                              log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                              log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{log.targetTable || "-"}</div>
                            <div className="text-sm text-gray-500">ID: {log.targetId || "-"}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {new Date(log.actionDate).toLocaleDateString('kk-KZ')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.actionDate).toLocaleTimeString('kk-KZ')}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {log.ipAddress || "-"}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="text-emerald-600 hover:text-emerald-800 transition duration-200 flex items-center"
                            >
                              <FaEye className="mr-2" />
                              Толығырақ
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <GiNotebook className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Логтар табылмады</h3>
                            <p className="text-gray-500 max-w-md">
                              Сүзгі параметрлеріңізді өзгертіңіз немесе жаңа аудит әрекеттері орындалуын күтіңіз
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Бет {page} / {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className={`px-4 py-2 rounded-lg transition duration-200 ${
                        page <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Алдыңғы
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className={`px-4 py-2 rounded-lg transition duration-200 ${
                        page >= totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Келесі
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 sm:px-6 lg:px-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Логтың Толық Мәліметтері</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-2">Пайдаланушы Ақпараты</h4>
                  <p><span className="text-gray-500">Аты:</span> {selectedLog.user?.username || "Белгісіз"}</p>
                  <p><span className="text-gray-500">ID:</span> {selectedLog.user?.id || "-"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-2">Әрекет Ақпараты</h4>
                  <p><span className="text-gray-500">Түрі:</span> {selectedLog.action}</p>
                  <p><span className="text-gray-500">Күні:</span> {new Date(selectedLog.actionDate).toLocaleString('kk-KZ')}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-2">Нысан Ақпараты</h4>
                <p><span className="text-gray-500">Кесте:</span> {selectedLog.targetTable || "-"}</p>
                <p><span className="text-gray-500">Нысан ID:</span> {selectedLog.targetId || "-"}</p>
                {selectedLog.details && (
                  <div className="mt-2">
                    <p className="text-gray-500 mb-1">Толық мәліметтер:</p>
                    <pre className="bg-white p-3 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-2">Жүйе Ақпараты</h4>
                <p><span className="text-gray-500">IP Мекенжайы:</span> {selectedLog.ipAddress || "-"}</p>
                <p><span className="text-gray-500">User Agent:</span> {selectedLog.userAgent || "-"}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition duration-200"
              >
                Жабу
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <GiArchiveResearch className="text-white" />
              </div>
              <div>
                <p className="font-medium">Densaulyq Аудит Жүйесі</p>
                <p className="text-sm text-gray-400">RSA шифрлау арқылы қорғалған</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Densaulyq | Жаңартылған: {new Date().toLocaleString('kk-KZ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Барлық аудит деректер Қазақстан заңдарына сәйкес сақталады
              </p>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default AuditPage;