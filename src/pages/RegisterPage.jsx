import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserMd,
  FaUserInjured,
  FaIdBadge,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaVenusMars,
  FaStethoscope,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle
} from "react-icons/fa";

const Register = () => {
  const [step, setStep] = useState(1); // 1 = выбор роли, 2 = основные данные, 3 = дополнительные данные
  const [selectedRole, setSelectedRole] = useState(null); // 2 = врач, 3 = пациент
  
  // Основные данные (Step 2)
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  // Дополнительные данные для врача (Step 3)
  const [doctorData, setDoctorData] = useState({
    specialty: "",
    contactNumber: "",
  });

  // Дополнительные данные для пациента (Step 3)
  const [patientData, setPatientData] = useState({
    dateOfBirth: "",
    gender: "male",
    contactNumber: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleDoctorChange = (e) =>
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });

  const handlePatientChange = (e) =>
    setPatientData({ ...patientData, [e.target.name]: e.target.value });

  // Шаг 1: Выбор роли
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  // Шаг 2 -> Шаг 3
  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError("");
    
    // Валидация основных данных
    if (!form.username || !form.password || !form.email || !form.firstName || !form.lastName) {
      setError("Барлық өрістерді толтырыңыз");
      return;
    }

    if (form.password.length < 6) {
      setError("Құпия сөз кемінде 6 таңбадан тұруы керек");
      return;
    }

    setStep(3);
  };

  // Финальная регистрация
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Подготовка данных в зависимости от роли
      let registrationData = {
        username: form.username,
        password: form.password,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: selectedRole,
      };

      // Шаг 1: Регистрация основного пользователя
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Тіркелу кезінде қате пайда болды");
      }

      const userData = await registerResponse.json();
      const userId = userData.userId;

      // Шаг 2: Обновление дополнительных данных для врача или пациента
      if (selectedRole === 2) {
        // Обновление данных врача
        await fetch(`${API_BASE_URL}/api/v1/doctor/update-by-user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specialty: doctorData.specialty,
            contactNumber: doctorData.contactNumber,
          }),
        });
      } else if (selectedRole === 3) {
        // Обновление данных пациента
        await fetch(`${API_BASE_URL}/api/v1/patient/update-by-user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateOfBirth: patientData.dateOfBirth,
            gender: patientData.gender,
            contactNumber: patientData.contactNumber,
            address: patientData.address,
          }),
        });
      }

      navigate("/login", {
        state: { message: "✅ Тіркелу сәтті аяқталды! Енді кіре аласыз." },
      });
    } catch (err) {
      setError(err.message || "Тіркелу кезінде қате пайда болды");
    } finally {
      setIsLoading(false);
    }
  };

  // Возврат на предыдущий шаг
  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedRole(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Прогресс-бар */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Қадам {step} / 3
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {step === 1 && "Рөлді таңдау"}
              {step === 2 && "Негізгі деректер"}
              {step === 3 && selectedRole === 2 ? "Дәрігер деректері" : step === 3 ? "Пациент деректері" : ""}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              {step === 1 && <FaUser className="text-3xl text-indigo-600" />}
              {step === 2 && <FaIdBadge className="text-3xl text-indigo-600" />}
              {step === 3 && selectedRole === 2 && <FaUserMd className="text-3xl text-indigo-600" />}
              {step === 3 && selectedRole === 3 && <FaUserInjured className="text-3xl text-indigo-600" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {step === 1 && "Тіркелу"}
            {step === 2 && "Жеке деректер"}
            {step === 3 && "Қосымша мәліметтер"}
          </h2>
          <p className="text-gray-500">
            {step === 1 && "Өзіңіздің рөліңізді таңдаңыз"}
            {step === 2 && "Негізгі ақпаратты толтырыңыз"}
            {step === 3 && "Профильді аяқтаңыз"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 flex items-center border border-red-200">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* ШАГ 1: ВЫБОР РОЛИ */}
        {step === 1 && (
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect(2)}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                  <FaUserMd className="text-3xl text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Дәрігер</h3>
                  <p className="text-gray-600 text-sm">
                    Науқастарды қабылдау және емдеу жоспарын жасау
                  </p>
                </div>
                <FaArrowRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(3)}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                  <FaUserInjured className="text-3xl text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Пациент</h3>
                  <p className="text-gray-600 text-sm">
                    Дәрігерге жазылу және медициналық көмек алу
                  </p>
                </div>
                <FaArrowRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                Тіркелгіңіз бар ма?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Кіру
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ШАГ 2: ОСНОВНЫЕ ДАННЫЕ */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaUser className="mr-2 text-gray-400" />
                  Пайдаланушы аты
                </label>
                <input
                  name="username"
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaIdBadge className="mr-2 text-gray-400" />
                  Аты
                </label>
                <input
                  name="firstName"
                  type="text"
                  placeholder="Атыңыз"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaIdBadge className="mr-2 text-gray-400" />
                  Тегі
                </label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Тегіңіз"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaLock className="mr-2 text-gray-400" />
                Құпия сөз
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Кемінде 6 таңба</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Артқа
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Келесі
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </form>
        )}

        {/* ШАГ 3: ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ДЛЯ ВРАЧА */}
        {step === 3 && selectedRole === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaStethoscope className="mr-2 text-gray-400" />
                Мамандық
              </label>
              <input
                name="specialty"
                type="text"
                placeholder="Терапевт, Хирург, т.б."
                value={doctorData.specialty}
                onChange={handleDoctorChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaPhone className="mr-2 text-gray-400" />
                Байланыс нөмірі
              </label>
              <input
                name="contactNumber"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={doctorData.contactNumber}
                onChange={handleDoctorChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                <FaArrowLeft className="mr-2" />
                Артқа
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
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

        {/* ШАГ 3: ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ДЛЯ ПАЦИЕНТА */}
        {step === 3 && selectedRole === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaCalendar className="mr-2 text-gray-400" />
                  Туған күні
                </label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={patientData.dateOfBirth}
                  onChange={handlePatientChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaVenusMars className="mr-2 text-gray-400" />
                  Жынысы
                </label>
                <select
                  name="gender"
                  value={patientData.gender}
                  onChange={handlePatientChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                >
                  <option value="male">Ер</option>
                  <option value="female">Әйел</option>
                  <option value="other">Басқа</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaPhone className="mr-2 text-gray-400" />
                Байланыс нөмірі
              </label>
              <input
                name="contactNumber"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={patientData.contactNumber}
                onChange={handlePatientChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-gray-400" />
                Мекенжайы
              </label>
              <input
                name="address"
                type="text"
                placeholder="Қала, көше, үй"
                value={patientData.address}
                onChange={handlePatientChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                <FaArrowLeft className="mr-2" />
                Артқа
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
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

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            Жетілдірілген шифрлау стандарттарымен қорғалған
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;