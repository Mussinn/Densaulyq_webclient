import { useState } from "react";
import { useDispatch } from "react-redux";
import { saveToken } from "../store/tokenSlice";
import { login, loginWithKey } from "../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUserLock, FaKey, FaLock, FaUpload, FaShieldAlt } from "react-icons/fa";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "", privateKey: "" });
  const [error, setError] = useState("");
  const [loginMethod, setLoginMethod] = useState("password"); // "password" или "key"
  const [keyFileName, setKeyFileName] = useState(""); // Для имени загруженного файла
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "privateKey") {
      setKeyFileName(""); // Сбрасываем имя файла при ручном вводе ключа
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm({ ...form, privateKey: event.target.result });
        setKeyFileName(file.name);
      };
      reader.onerror = () => {
        setError("Кілт файлын оқу мүмкін болмады.");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);
  
  try {
    let response;
    if (loginMethod === "password") {
      if (!form.username || !form.password) {
        throw new Error("Пайдаланушы аты мен құпия сөзді енгізіңіз.");
      }
      response = await login({ username: form.username, password: form.password });
    } else {
      if (!form.username || !form.privateKey) {
        throw new Error("Пайдаланушы аты мен жеке кілтті енгізіңіз.");
      }
      response = await loginWithKey({ username: form.username, privateKey: form.privateKey });
    }

    console.log("Login Page: Received response:", response);

    // Проверяем наличие ошибки
    if (response.error) {
      throw new Error(response.error);
    }

    const jwt = response.jwt;
    if (!jwt || typeof jwt !== "string") {
      throw new Error("Жарамсыз JWT алынды.");
    }

    // Проверяем наличие userId
    if (!response.userId) {
      throw new Error("Пайдаланушы ID алынбады.");
    }

    console.log("Login Page: Saving to Redux:", {
      userId: response.userId,
      userName: response.userName,
      roles: response.roles
    });

    // Сохраняем ВСЕ данные в Redux
    dispatch(saveToken({ 
      token: jwt,
      jwt: jwt,
      userId: response.userId,
      userName: response.userName,
      username: response.userName,
      roles: response.roles,
      user: response.user
    }));

    // Проверяем, есть ли роль ROLE_ADMIN
    const redirectTo = response.roles.includes("ROLE_ADMIN") 
      ? "/admin" 
      : location.state?.from || "/home";
    
    console.log("Login Page: Redirecting to:", redirectTo);
    navigate(redirectTo, { replace: true });
    
  } catch (err) {
    setError(err.message || "Қате мәліметтер. Қайтадан тексеріңіз.");
    console.error("Login error:", err);
  } finally {
    setIsLoading(false);
  }
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
            <span className="block text-xl font-normal text-emerald-600">Қауіпсіз Кіру</span>
          </h1>
          
          <p className="text-gray-600 max-w-sm mx-auto">
            Медициналық деректерді қорғау платформасына қош келдіңіз
          </p>
        </div>

        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
          variants={cardVariants}
          whileHover="hover"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле имени пользователя */}
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
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Пароль или приватный ключ */}
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
                    value={form.password}
                    onChange={handleChange}
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
                    placeholder="Жеке кілтті осы жерге енгізіңіз немесе төмендегі батырма арқылы файлды жүктеңіз"
                    value={form.privateKey}
                    onChange={handleChange}
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
                      {keyFileName ? `Файл жүктелді: ${keyFileName}` : "Кілт файлын жүктеу"}
                    </span>
                  </label>
                  <input
                    id="keyFile"
                    type="file"
                    accept=".txt,.pem,.key"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Тек .txt, .pem, .key форматтары қолдау көрсетіледі
                  </p>
                </div>
              </div>
            )}

            {/* Кнопка входа */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-xl font-semibold text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loginMethod === "password"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-emerald-500"
                  : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 focus:ring-blue-500"
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

            {/* Ссылки на другие страницы */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Тіркелмегенсіз бе?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 focus:outline-none"
                >
                  Тіркелу
                </button>
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                ← Басты бетке оралу
              </button>
            </div>
          </form>
        </motion.div>

        {/* Информация о безопасности */}
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