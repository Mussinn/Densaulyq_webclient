import { useState } from "react";
import { useDispatch } from "react-redux";
import { saveToken } from "../store/tokenSlice";
import { login, loginWithKey } from "../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserLock, 
  FaKey, 
  FaLock, 
  FaUpload, 
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaPhone,
  FaMapMarkerAlt,
  FaVenusMars,
  FaArrowLeft,
  FaCheckCircle
} from "react-icons/fa";

const Login = () => {
  const [mode, setMode] = useState("login"); // "login" или "register"
  const [loginMethod, setLoginMethod] = useState("password"); // "password" или "key"
  
  // Login form
  const [loginForm, setLoginForm] = useState({ username: "", password: "", privateKey: "" });
  const [keyFileName, setKeyFileName] = useState("");
  
  // Registration form - основные данные (только для пациентов)
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    roleId: 3, // Всегда пациент
  });
  
  // Данные пациента
  const [patientData, setPatientData] = useState({
    gender: "male",
    contactNumber: "",
    address: "",
  });
  
  const [registerStep, setRegisterStep] = useState(1); // 1 = основные, 2 = данные пациента
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Анимации
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  // ═══════════════════════════════════════════════
  // LOGIN HANDLERS
  // ═══════════════════════════════════════════════
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    if (e.target.name === "privateKey") {
      setKeyFileName("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLoginForm({ ...loginForm, privateKey: event.target.result });
        setKeyFileName(file.name);
      };
      reader.onerror = () => {
        setError("Кілт файлын оқу мүмкін болмады.");
      };
      reader.readAsText(file);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      let response;
      if (loginMethod === "password") {
        if (!loginForm.username || !loginForm.password) {
          throw new Error("Пайдаланушы аты мен құпия сөзді енгізіңіз.");
        }
        response = await login({ username: loginForm.username, password: loginForm.password });
      } else {
        if (!loginForm.username || !loginForm.privateKey) {
          throw new Error("Пайдаланушы аты мен жеке кілтті енгізіңіз.");
        }
        response = await loginWithKey({ username: loginForm.username, privateKey: loginForm.privateKey });
      }

      if (response.error) {
        throw new Error(response.error);
      }

      const jwt = response.jwt;
      if (!jwt || typeof jwt !== "string") {
        throw new Error("Жарамсыз JWT алынды.");
      }

      if (!response.userId) {
        throw new Error("Пайдаланушы ID алынбады.");
      }

      dispatch(saveToken({ 
        token: jwt,
        jwt: jwt,
        userId: response.userId,
        userName: response.userName,
        username: response.userName,
        roles: response.roles,
        user: response.user
      }));

      const redirectTo = response.roles.includes("ROLE_ADMIN") 
        ? "/admin" 
        : location.state?.from || "/home";
      
      navigate(redirectTo, { replace: true });
      
    } catch (err) {
      setError(err.message || "Қате мәліметтер. Қайтадан тексеріңіз.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // REGISTRATION HANDLERS (только для пациентов)
  // ═══════════════════════════════════════════════
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handlePatientChange = (e) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleRegisterStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    
    if (!registerForm.username || !registerForm.password || !registerForm.email || 
        !registerForm.firstName || !registerForm.lastName) {
      setError("Барлық өрістерді толтырыңыз");
      return;
    }

    if (registerForm.password.length < 6) {
      setError("Құпия сөз кемінде 6 таңбадан тұруы керек");
      return;
    }

    setRegisterStep(2);
  };

  const handleFinalRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Формируем данные для регистрации пациента
      const registrationData = {
        username: registerForm.username,
        password: registerForm.password,
        email: registerForm.email,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        roleId: 3, // Всегда пациент
        gender: patientData.gender,
        contactNumber: patientData.contactNumber,
        address: patientData.address,
      };

      // Единственный API запрос на регистрацию
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Тіркелу кезінде қате пайда болды");
      }

      // Успешная регистрация - переключаемся на login
      setMode("login");
      setRegisterStep(1);
      setRegisterForm({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        roleId: 3,
      });
      setPatientData({
        gender: "male",
        contactNumber: "",
        address: "",
      });
      setError("");
      
      alert("✅ Тіркелу сәтті аяқталды! Енді кіре аласыз.");
      
    } catch (err) {
      setError(err.message || "Тіркелу кезінде қате пайда болды");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRegister = () => {
    setMode("register");
    setRegisterStep(1);
    setError("");
  };

  const switchToLogin = () => {
    setMode("login");
    setRegisterStep(1);
    setError("");
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Декоративные элементы */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-200/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full translate-x-1/3 translate-y-1/3"></div>

      <motion.div 
        className="relative z-10 w-full max-w-md"
        variants={containerVariants}
      >
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaUserLock className="text-white text-3xl" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Densaulyq
            <span className="block text-xl font-normal text-emerald-600">
              {mode === "login" ? "Қауіпсіз Кіру" : "Пациент Тіркелу"}
            </span>
          </h1>
          
          <p className="text-gray-600 max-w-sm mx-auto">
            {mode === "login" 
              ? "Медициналық деректерді қорғау платформасына қош келдіңіз"
              : "Жаңа пациент есептік жазбасын жасау"
            }
          </p>
        </div>

        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
          variants={cardVariants}
          whileHover="hover"
        >
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════ */}
            {/* LOGIN FORM */}
            {/* ═══════════════════════════════════════════════ */}
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Вкладки для выбора метода входа */}
                <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
                  <button
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                      loginMethod === "password" 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setLoginMethod("password")}
                    type="button"
                  >
                    <FaLock className="text-sm" />
                    <span className="font-medium">Құпия сөз</span>
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                      loginMethod === "key" 
                        ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-md" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setLoginMethod("key")}
                    type="button"
                  >
                    <FaKey className="text-sm" />
                    <span className="font-medium">Жеке Кілт</span>
                  </button>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                  <motion.div
                    className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Пайдаланушы аты
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Пайдаланушы атыңызды енгізіңіз"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Password or Private Key */}
                  {loginMethod === "password" ? (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Құпия сөз
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Құпия сөзіңізді енгізіңіз"
                          value={loginForm.password}
                          onChange={handleLoginChange}
                          className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-2">
                        Жеке Кілт
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                          <FaKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="privateKey"
                          name="privateKey"
                          placeholder="Жеке кілтті енгізіңіз немесе файлды жүктеңіз"
                          value={loginForm.privateKey}
                          onChange={handleLoginChange}
                          className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 h-32 resize-none"
                          required
                        />
                      </div>
                      
                      <div className="mt-4">
                        <label
                          htmlFor="keyFile"
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                            keyFileName 
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                              : "border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600"
                          }`}
                        >
                          <FaUpload className="text-sm" />
                          <span className="text-sm font-medium">
                            {keyFileName ? `Файл: ${keyFileName}` : "Кілт файлын жүктеу"}
                          </span>
                        </label>
                        <input
                          id="keyFile"
                          type="file"
                          accept=".txt,.pem,.key"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Login Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 px-4 rounded-xl font-semibold text-white transition duration-200 ${
                      loginMethod === "password"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600"
                    } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Кіру үдейін...
                      </span>
                    ) : (
                      "Кіру"
                    )}
                  </motion.button>

                  {/* Switch to Register */}
                  <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Тіркелмегенсіз бе?{" "}
                      <button
                        type="button"
                        onClick={switchToRegister}
                        className="font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Тіркелу
                      </button>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Басты бетке оралу
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* REGISTRATION FORM (только для пациентов) */}
            {/* ═══════════════════════════════════════════════ */}
            {mode === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Қадам {registerStep} / 2
                    </span>
                    <span className="text-sm font-medium text-emerald-600">
                      {registerStep === 1 ? "Негізгі деректер" : "Пациент деректері"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(registerStep / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Basic Info */}
                {registerStep === 1 && (
                  <form onSubmit={handleRegisterStep1Submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaUser className="mr-2 text-gray-400" size={14} />
                          Пайдаланушы аты
                        </label>
                        <input
                          name="username"
                          type="text"
                          placeholder="username"
                          value={registerForm.username}
                          onChange={handleRegisterChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                          minLength={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaEnvelope className="mr-2 text-gray-400" size={14} />
                          Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="email@example.com"
                          value={registerForm.email}
                          onChange={handleRegisterChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaIdBadge className="mr-2 text-gray-400" size={14} />
                          Аты
                        </label>
                        <input
                          name="firstName"
                          type="text"
                          placeholder="Атыңыз"
                          value={registerForm.firstName}
                          onChange={handleRegisterChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaIdBadge className="mr-2 text-gray-400" size={14} />
                          Тегі
                        </label>
                        <input
                          name="lastName"
                          type="text"
                          placeholder="Тегіңіз"
                          value={registerForm.lastName}
                          onChange={handleRegisterChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaLock className="mr-2 text-gray-400" size={14} />
                        Құпия сөз
                      </label>
                      <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Кемінде 6 таңба</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                      >
                        <FaArrowLeft className="mr-2" size={14} />
                        Артқа
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-medium"
                      >
                        Келесі
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Patient Data */}
                {registerStep === 2 && (
                  <form onSubmit={handleFinalRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaVenusMars className="mr-2 text-gray-400" size={14} />
                          Жынысы
                        </label>
                        <select
                          name="gender"
                          value={patientData.gender}
                          onChange={handlePatientChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        >
                          <option value="male">Ер</option>
                          <option value="female">Әйел</option>
                          <option value="other">Басқа</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaPhone className="mr-2 text-gray-400" size={14} />
                          Байланыс нөмірі
                        </label>
                        <input
                          name="contactNumber"
                          type="tel"
                          placeholder="+7 (___) ___-__-__"
                          value={patientData.contactNumber}
                          onChange={handlePatientChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" size={14} />
                        Мекенжайы
                      </label>
                      <input
                        name="address"
                        type="text"
                        placeholder="Қала, көше, үй"
                        value={patientData.address}
                        onChange={handlePatientChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setRegisterStep(1)}
                        className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                        disabled={isLoading}
                      >
                        <FaArrowLeft className="mr-2" size={14} />
                        Артқа
                      </button>
                      <button
                        type="submit"
                        className="flex-1 flex items-center justify-center py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-medium disabled:opacity-75"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Тіркелуде...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="mr-2" />
                            Тіркелуді аяқтау
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <FaShieldAlt className="text-emerald-500" />
            <span>RSA шифрлау арқылы қорғалған</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            Барлық медициналық деректер қазақстандық заңдарға сәйкес қорғалады және сақталады
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;