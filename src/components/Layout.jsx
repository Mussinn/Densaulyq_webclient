import { Link, NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaSignOutAlt, FaUserCircle, FaFileMedical, FaVideo, FaHistory, FaChartLine, FaRobot, FaChevronDown } from 'react-icons/fa';
import { GiHealthPotion, GiHealthDecrease, GiStethoscope, GiHeartPlus } from 'react-icons/gi';
import { MdHealthAndSafety, MdDashboard, MdAudiotrack, MdLocalHospital } from 'react-icons/md';
import { BiMessageSquareDetail } from 'react-icons/bi';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../services/authService';
import { clearToken } from '../store/tokenSlice';
import api from '../../utils/api';
import FloatingChatBot from '../components/FloatingChatBot';

function Layout() {
  const dispatch = useDispatch();
  const { token, roles } = useSelector((state) => state.token);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Dropdown states
  const [dropdowns, setDropdowns] = useState({
    ai: false,
    health: false,
    consult: false
  });

  // Refs for dropdown detection
  const aiDropdownRef = useRef(null);
  const healthDropdownRef = useRef(null);
  const consultDropdownRef = useRef(null);

  // Fetch user data
  const fetchUserData = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Пайдаланушы мәліметтері:', response.data);
      setUser(response.data);
    } catch (err) {
      console.error('Пайдаланушы мәліметтерін алу қатесі:', err);
      setError('Пайдаланушы мәліметтерін алу қатесі: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        aiDropdownRef.current && !aiDropdownRef.current.contains(event.target) &&
        healthDropdownRef.current && !healthDropdownRef.current.contains(event.target) &&
        consultDropdownRef.current && !consultDropdownRef.current.contains(event.target)
      ) {
        setDropdowns({ ai: false, health: false, consult: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle modal open/close
  const openProfileModal = () => {
    if (token && user) {
      setIsProfileModalOpen(true);
    }
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isProfileModalOpen) {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isProfileModalOpen]);

  // Focus trap for modal
  useEffect(() => {
    if (isProfileModalOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isProfileModalOpen]);

  const handleLogout = () => {
    console.log('Жүйеден шығу');
    logout();
    dispatch(clearToken());
    setMenuOpen(false);
    setIsProfileModalOpen(false);
  };

  const toggleDropdown = (name) => {
    setDropdowns(prev => ({
      ai: false,
      health: false,
      consult: false,
      [name]: !prev[name]
    }));
  };

  const closeAllDropdowns = () => {
    setDropdowns({ ai: false, health: false, consult: false });
  };

  const linkClass = ({ isActive }) =>
    `transition-all duration-300 hover:text-sky-300 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center ${isActive ? 'text-sky-300 font-semibold bg-white/5 border-l-4 border-sky-300' : 'text-gray-100'
    }`;

  const dropdownLinkClass = 'block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200 rounded-lg flex items-center';

  // Check roles
  const isUser = roles.includes('ROLE_USER');
  const isDoctor = roles.includes('ROLE_DOCTOR');
  const isAdmin = roles.includes('ROLE_ADMIN');

  // Animation variants
  const profileVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 to-emerald-50 text-gray-800 font-sans overflow-hidden">
      {/* Жоғарғы навигация */}
      <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 lg:px-8 py-4 shadow-xl flex-shrink-0">
        <div className="w-full flex justify-between items-center">
          {/* Логотип және атауы */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <GiHealthPotion className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                <span className="block">Densaulyq</span>
                <span className="text-sm font-normal opacity-90">Медициналық платформа</span>
              </h1>
            </div>
          </Link>

          {/* Жоғарғы мәзір (десктоп) */}
          <div className="hidden md:flex items-center space-x-2 text-sm">
            {token ? (
              <>
                {isDoctor && (
                  <>
                    <NavLink to="/home" className={linkClass}>
                      <MdLocalHospital className="mr-2" />
                      Басты бет
                    </NavLink>
                    <NavLink to="/doctor-appointments" className={linkClass}>
                      <MdLocalHospital className="mr-2" />
                      DensBooking тізімі
                    </NavLink>
                    {/* <NavLink to="/derm-AI" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <BiMessageSquareDetail className="mr-2" />
                      DensAi
                    </NavLink> */}
                    <NavLink to="/doctor-consultations" className={linkClass}>
                      <MdLocalHospital className="mr-2" />
                      Консультациялар
                    </NavLink>
                    {/* <NavLink to="/audit/logs" className={linkClass}>
                      <MdAudiotrack className="mr-2" />
                      Аудит
                    </NavLink> */}
                    <NavLink to="/medical-history" className={linkClass}>
                      <FaHistory className="mr-2" />
                      DensVault
                    </NavLink>
                    <NavLink to="/derm-AI" className={linkClass}>
                      <FaRobot className="mr-2" />
                      DensVision
                    </NavLink>
                    <NavLink to="/diagnosis/create" className={linkClass}>
                      <GiStethoscope className="mr-2" />
                      Диагноз құру
                    </NavLink>
                    <NavLink to="/messenger" className={linkClass}>
                      <BiMessageSquareDetail className="mr-2" />
                      DensTalk
                    </NavLink>
                  </>
                )}
                {isAdmin && (
                  <>
                    <NavLink to="/admin" className={linkClass}>
                      <MdDashboard className="mr-2" />
                      Әкімші панелі
                    </NavLink>
                    <NavLink to="/dashboard" className={linkClass}>
                      <FaChartLine className="mr-2" />
                      Дашборд
                    </NavLink>
                    <NavLink to="/audit/logs" className={linkClass}>
                      <MdAudiotrack className="mr-2" />
                      Аудит логтары
                    </NavLink>
                    <NavLink to="/messenger" className={linkClass}>
                      <BiMessageSquareDetail className="mr-2" />
                      DensTalk
                    </NavLink>
                  </>
                )}

                {isUser && (
                  <>
                    <NavLink to="/home" className={linkClass}>
                      <MdLocalHospital className="mr-2" />
                      Басты бет
                    </NavLink>

                    {/* AI Қызметтер Dropdown */}
                    <div className="relative" ref={aiDropdownRef}>
                      <button
                        onClick={() => toggleDropdown('ai')}
                        className={`transition-all duration-300 hover:text-sky-300 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center text-gray-100 ${dropdowns.ai ? 'bg-white/10 text-sky-300' : ''
                          }`}
                      >
                        <FaRobot className="mr-2" />
                        AI Қызметтер
                        <FaChevronDown className={`ml-1 w-3 h-3 transition-transform duration-200 ${dropdowns.ai ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {dropdowns.ai && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100"
                          >
                          <NavLink
                              to="/densvision-patient"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaRobot className="mr-3 text-purple-500" />
                              <div>
                                <div className="font-medium">DensVision</div>
                                <div className="text-xs text-gray-500">Жаңартылған нұсқа</div>
                              </div>
                            </NavLink>
                            {/* <NavLink
                              to="/derm-AI"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaRobot className="mr-3 text-purple-500" />
                              <div>
                                <div className="font-medium">DensVision</div>
                                <div className="text-xs text-gray-500">Жаңартылған нұсқа</div>
                              </div>
                            </NavLink> */}
                            <NavLink
                              to="/ai"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaRobot className="mr-3 text-blue-500" />
                              <div>
                                <div className="font-medium">DensAI</div>
                                <div className="text-xs text-gray-500">Симптомдарды тексеру</div>
                              </div>
                            </NavLink>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Консультациялар Dropdown */}
                    <div className="relative" ref={consultDropdownRef}>
                      <button
                        onClick={() => toggleDropdown('consult')}
                        className={`transition-all duration-300 hover:text-sky-300 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center text-gray-100 ${dropdowns.consult ? 'bg-white/10 text-sky-300' : ''
                          }`}
                      >
                        <GiStethoscope className="mr-2" />
                        Консультациялар
                        <FaChevronDown className={`ml-1 w-3 h-3 transition-transform duration-200 ${dropdowns.consult ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {dropdowns.consult && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100"
                          >
                            <NavLink
                              to="/doctors"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <GiStethoscope className="mr-3 text-emerald-500" />
                              <div>
                                <div className="font-medium">Дәрігерлер тізімі</div>
                                <div className="text-xs text-gray-500">Маман таңдау</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/booking"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaUserCircle className="mr-3 text-sky-500" />
                              <div>
                                <div className="font-medium">DensBooking</div>
                                <div className="text-xs text-gray-500">Қабылдауға жазылу</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/meet"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaVideo className="mr-3 text-red-500" />
                              <div>
                                <div className="font-medium">DensMeet</div>
                                <div className="text-xs text-gray-500">Онлайн кеңес</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/messenger"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <BiMessageSquareDetail className="mr-3 text-indigo-500" />
                              <div>
                                <div className="font-medium">DensTalk</div>
                                <div className="text-xs text-gray-500">Хабарласу</div>
                              </div>
                            </NavLink>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Менің денсаулығым Dropdown */}
                    <div className="relative" ref={healthDropdownRef}>
                      <button
                        onClick={() => toggleDropdown('health')}
                        className={`transition-all duration-300 hover:text-sky-300 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center text-gray-100 ${dropdowns.health ? 'bg-white/10 text-sky-300' : ''
                          }`}
                      >
                        <GiHealthPotion className="mr-2" />
                        Менің денсаулығым
                        <FaChevronDown className={`ml-1 w-3 h-3 transition-transform duration-200 ${dropdowns.health ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {dropdowns.health && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100"
                          >
                            <NavLink
                              to="/profile"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaUserCircle className="mr-3 text-blue-500" />
                              <div>
                                <div className="font-medium">Жеке кабинет</div>
                                <div className="text-xs text-gray-500">Профиль мәліметтері</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/diagnosis/view"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <GiHealthDecrease className="mr-3 text-orange-500" />
                              <div>
                                <div className="font-medium">Диагнозды қарау</div>
                                <div className="text-xs text-gray-500">Медициналық карта</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/diagnosis/key-generation"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <GiHeartPlus className="mr-3 text-pink-500" />
                              <div>
                                <div className="font-medium">DensKey</div>
                                <div className="text-xs text-gray-500">Қауіпсіздік кілті</div>
                              </div>
                            </NavLink>
                            <NavLink
                              to="/medical-tests"
                              className={dropdownLinkClass}
                              onClick={closeAllDropdowns}
                            >
                              <FaFileMedical className="mr-3 text-teal-500" />
                              <div>
                                <div className="font-medium">DensVault</div>
                                <div className="text-xs text-gray-500">Анализдер мен тесттер</div>
                              </div>
                            </NavLink>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* Пайдаланушы профилі */}
                <motion.div
                  className="flex items-center space-x-3 ml-2"
                  initial="hidden"
                  animate="visible"
                  variants={profileVariants}
                >
                  <button
                    onClick={openProfileModal}
                    className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 hover:bg-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Пайдаланушы профилін ашу"
                    disabled={!token || !user}
                  >
                    {loading ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-sm">
                          {user?.firstName?.[0] || user?.username?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div className="text-left hidden lg:block">
                      <span className="text-white font-medium text-sm block truncate max-w-[100px]">
                        {user ? `${user.firstName}` : 'Профиль'}
                      </span>
                    </div>
                  </button>

                  {/* Шығу түймесі */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    aria-label="Жүйеден шығу"
                  >
                    <FaSignOutAlt className="lg:mr-2" />
                    <span className="font-medium hidden lg:inline">Шығу</span>
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="px-5 py-2 text-white hover:text-sky-200 font-medium transition-colors duration-200"
                >
                  Кіру
                </NavLink>
                <NavLink
                  to="/register"
                  className="px-5 py-2 bg-white text-emerald-600 rounded-xl font-medium hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Тіркелу
                </NavLink>
              </>
            )}
          </div>

          {/* Мобильді мәзір түймесі */}
          <button
            className="md:hidden text-white focus:outline-none w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Мәзірді жабу' : 'Мәзірді ашу'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Мобильді мәзір */}
        {menuOpen && (
          <motion.div
            className="md:hidden mt-4 space-y-2 px-4 bg-gradient-to-b from-emerald-700/95 to-teal-700/95 backdrop-blur-sm rounded-xl py-4 max-h-[70vh] overflow-y-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {token ? (
              <>
                {isDoctor && (
                  <>
                    <NavLink to="/home" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <MdLocalHospital className="mr-2" />
                      Басты бет
                    </NavLink>
                    <NavLink to="/doctor-appointments" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <MdLocalHospital className="mr-2" />
                      DensBooking
                    </NavLink>
                    <NavLink to="/doctor-consultations" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <MdLocalHospital className="mr-2" />
                      Консультациялар
                    </NavLink>
                    <NavLink to="/audit/logs" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <MdAudiotrack className="mr-2" />
                      Аудит
                    </NavLink>
                    <NavLink to="/diagnosis/create" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <GiStethoscope className="mr-2" />
                      Диагноз құру
                    </NavLink>
                    <NavLink to="/messenger" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <BiMessageSquareDetail className="mr-2" />
                      DensTalk
                    </NavLink>
                  </>
                )}

                {isUser && (
                  <>
                    <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2 mt-2">
                      AI Қызметтер
                    </div>
                    <NavLink to="/derm-AI" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaRobot className="mr-2" />
                      DensVision
                    </NavLink>
                    <NavLink to="/ai" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaRobot className="mr-2" />
                      DensAI
                    </NavLink>
                    <NavLink to="/medical-tests" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaFileMedical className="mr-2" />
                      DensVault
                    </NavLink>

                    <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2 mt-4">
                      Консультациялар
                    </div>
                    <NavLink to="/doctors" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <GiStethoscope className="mr-2" />
                      Дәрігерлер
                    </NavLink>
                    <NavLink to="/booking" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaUserCircle className="mr-2" />
                      DensBooking
                    </NavLink>
                    <NavLink to="/meet" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaVideo className="mr-2" />
                      DensMeet
                    </NavLink>
                    <NavLink to="/messenger" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <BiMessageSquareDetail className="mr-2" />
                      DensTalk
                    </NavLink>

                    <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2 mt-4">
                      Менің денсаулығым
                    </div>
                    <NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <FaUserCircle className="mr-2" />
                      Жеке кабинет
                    </NavLink>
                    <NavLink to="/diagnosis/view" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <GiHealthDecrease className="mr-2" />
                      Диагнозды қарау
                    </NavLink>
                    <NavLink to="/diagnosis/key-generation" className={linkClass} onClick={() => setMenuOpen(false)}>
                      <GiHeartPlus className="mr-2" />
                      Кілт генерациясы
                    </NavLink>
                  </>
                )}

                <div className="border-t border-emerald-500/30 pt-4 mt-4">
                  <button
                    onClick={() => {
                      openProfileModal();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center bg-white/10 rounded-xl px-4 py-3 mb-3 hover:bg-white/20 transition"
                    aria-label="Пайдаланушы профилін ашу"
                    disabled={!token || !user}
                  >
                    {loading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold">
                          {user?.firstName?.[0] || user?.username?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div className="text-left">
                      <span className="text-white font-medium block">
                        {user ? `${user.firstName} ${user.lastName}` : 'Пайдаланушы'}
                      </span>
                      <span className="text-gray-200 text-xs block">
                        {roles.map(translateRole).join(', ') || 'Жоқ'}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300"
                    aria-label="Жүйеден шығу"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Жүйеден шығу
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-xl transition text-center block"
                  onClick={() => setMenuOpen(false)}
                >
                  Кіру
                </NavLink>
                <NavLink
                  to="/register"
                  className="w-full px-4 py-3 bg-white text-emerald-600 rounded-xl font-medium hover:bg-gray-100 transition text-center block mt-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Тіркелу
                </NavLink>
              </>
            )}
          </motion.div>
        )}
      </nav>

      {/* ОСНОВНАЯ ОБЛАСТЬ С БОКОВЫМ МЕНЮ И КОНТЕНТОМ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Бүйір мәзір (десктоп) */}
        {token && (
          <div className="hidden lg:block w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 shadow-lg flex-shrink-0 overflow-y-auto">
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <MdDashboard className="mr-2" />
                  Жедел баптар
                </h3>
                <div className="space-y-2">
                  {isUser && (
                    <>
                      <a
                        href="tel:103"
                        className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-lg">🚑</span>
                        </div>
                        <div>
                          <div className="font-medium">103 - Жедел жәрдем</div>
                          <div className="text-xs text-gray-500">Телефон арқылы</div>
                        </div>
                      </a>
                      <a
                        href="tel:112"
                        className="flex items-center px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      >
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-lg">📞</span>
                        </div>
                        <div>
                          <div className="font-medium">112 - Төтенше жағдай</div>
                          <div className="text-xs text-gray-500">Барлық қызметтер</div>
                        </div>
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <MdHealthAndSafety className="mr-2" />
                  Жиі қолданылатын
                </h3>
                <div className="space-y-1">
                  {isUser && (
                    <>
                      <NavLink
                        to="/ai"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition"
                      >
                        <FaRobot className="mr-3" />
                        DensAI
                      </NavLink>
                      <NavLink
                        to="/doctors"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition"
                      >
                        <GiStethoscope className="mr-3" />
                        Дәрігерлер
                      </NavLink>
                      <NavLink
                        to="/meet"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition"
                      >
                        <FaVideo className="mr-3" />
                        DensMeet
                      </NavLink>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* КОНТЕНТНАЯ ОБЛАСТЬ */}
        <div className="flex-1 overflow-y-auto">
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <motion.div
                className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 text-center shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}

            {!token && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg"
              >
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 md:mr-6">
                    <h2 className="text-2xl font-bold mb-2">Densaulyq платформасына қош келдіңіз!</h2>
                    <p className="opacity-90">
                      Сіздің денсаулығыңыз біз үшін маңызды. Қауіпсіз медициналық қызметтер мен заманауи технологияларды пайдаланыңыз.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <NavLink
                      to="/login"
                      className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition shadow-md"
                    >
                      Кіру
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition"
                    >
                      Тіркелу
                    </NavLink>
                  </div>
                </div>
              </motion.div>
            )}

            <Outlet />
          </main>

          {/* Футер */}
          <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8 mt-12">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <GiHealthPotion className="text-2xl text-emerald-400 mr-3" />
                    <h3 className="text-xl font-bold">Densaulyq</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Қазақстандық медициналық платформа. Сіздің денсаулығыңыз біздің басты міндетіміз.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-emerald-300">Байланыс</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href="tel:+77771234567" className="hover:text-white transition">+7 (777) 123-45-67</a>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href="mailto:info@densaulyq.kz" className="hover:text-white transition">info@densaulyq.kz</a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-emerald-300">Жедел сілтемелер</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="tel:103" className="hover:text-white transition">103 - Жедел жәрдем</a></li>
                    <li><a href="tel:112" className="hover:text-white transition">112 - Барлық қызметтер</a></li>
                    <li><NavLink to="/ai" className="hover:text-white transition">DensAI Диагностика</NavLink></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-emerald-300">Құпиялылық</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Біз сіздің медициналық деректеріңіздің құпиялылығын қамтамасыз етеміз.
                  </p>
                  <div className="flex space-x-4">
                    <a href="/privacy" className="text-xs text-gray-400 hover:text-white transition">Құпиялылық саясаты</a>
                    <a href="/terms" className="text-xs text-gray-400 hover:text-white transition">Пайдалану шарттары</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700/50 mt-8 pt-8 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Densaulyq медициналық платформасы. Барлық құқықтар қорғалған.</p>
                <p className="mt-2">Қазақстан Республикасы</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Профиль модальды терезесі */}
      {isProfileModalOpen && user && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 sm:px-6 lg:px-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={closeProfileModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <motion.div
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="profile-modal-title" className="text-2xl font-bold text-gray-800">
                Профиль
              </h2>
              <button
                ref={closeButtonRef}
                onClick={closeProfileModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                aria-label="Жабу"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">
                    {user.firstName?.[0] || user.username?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {roles.map(translateRole).join(', ') || 'Рөл жоқ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Электрондық пошта</p>
                      <p className="font-medium text-gray-800">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Пайдаланушы аты</p>
                      <p className="font-medium text-gray-800">{user.username}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Тіркелген күні</p>
                    <p className="font-medium text-gray-800">
                      {new Date(user.createdAt).toLocaleDateString('kk-KZ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Жаңартылған күні</p>
                    <p className="font-medium text-gray-800">
                      {new Date(user.updatedAt).toLocaleDateString('kk-KZ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center">
                    <FaSignOutAlt className="mr-2" />
                    Жүйеден шығу
                  </div>
                </button>
                <button
                  onClick={closeProfileModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Жабу
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {token && <FloatingChatBot />}
    </div>
  );
}

export default Layout;