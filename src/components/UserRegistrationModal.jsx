import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdBadge,
  FaPhone,
  FaMapMarkerAlt,
  FaVenusMars,
  FaStethoscope,
  FaUserMd,
  FaTimes,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";

const UserRegistrationModal = ({ showModal, setShowModal, onUserCreated, authToken, API_BASE_URL }) => {
  const [step, setStep] = useState(1); // 1 = основные данные, 2 = специфичные данные роли
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Основные данные
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    roleId: 3, // По умолчанию пациент
  });

  // Специфичные данные роли
  const [roleSpecificData, setRoleSpecificData] = useState({
    // Для пациента (roleId = 3)
    gender: "male",
    contactNumber: "",
    address: "",
    // Для доктора (roleId = 2)
    specialization: "",
    // contactNumber используется для обоих
  });

  const roles = [
    { id: 1, name: "ROLE_ADMIN", displayName: "Администратор" },
    { id: 2, name: "ROLE_DOCTOR", displayName: "Врач" },
    { id: 3, name: "ROLE_USER", displayName: "Пациент" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "roleId") {
      setFormData({ ...formData, [name]: parseInt(value) });
      // Сбрасываем специфичные данные при смене роли
      setRoleSpecificData({
        gender: "male",
        contactNumber: "",
        address: "",
        specialization: "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRoleSpecificChange = (e) => {
    setRoleSpecificData({ ...roleSpecificData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");

    // Валидация основных полей
    if (!formData.username || !formData.password || !formData.email || 
        !formData.firstName || !formData.lastName) {
      setError("Все поля обязательны для заполнения");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Введите корректный email");
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Формируем данные в соответствии с бэкендом
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
      };

      // Добавляем поля в зависимости от роли
      if (formData.roleId === 1) {
        // Администратор - только основные поля
        // Можно добавить contactNumber если нужно
        registrationData.contactNumber = roleSpecificData.contactNumber || "";
      } else if (formData.roleId === 2) {
        // Доктор
        registrationData.specialization = roleSpecificData.specialization;
        registrationData.contactNumber = roleSpecificData.contactNumber;
      } else if (formData.roleId === 3) {
        // Пациент
        registrationData.gender = roleSpecificData.gender;
        registrationData.contactNumber = roleSpecificData.contactNumber;
        registrationData.address = roleSpecificData.address;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Ошибка при регистрации");
      }

      const newUser = await response.json();

      // Успех
      onUserCreated(newUser);
      handleClose();
      alert("✅ Пользователь успешно создан!");

    } catch (err) {
      setError(err.message || "Ошибка при создании пользователя");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setStep(1);
    setFormData({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      roleId: 3,
    });
    setRoleSpecificData({
      gender: "male",
      contactNumber: "",
      address: "",
      specialization: "",
    });
    setError("");
    setIsLoading(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Добавить пользователя
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Шаг {step} из 2
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pt-4">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Основные данные */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep1Submit}
                className="space-y-4"
              >
                {/* Выбор роли */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Выберите роль пользователя
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleChange({ target: { name: "roleId", value: role.id.toString() }})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.roleId === role.id
                            ? role.id === 1 
                              ? "border-purple-500 bg-purple-50"
                              : role.id === 2
                              ? "border-blue-500 bg-blue-50"
                              : "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {role.id === 1 ? (
                          <FaUser className={`mx-auto mb-2 text-2xl ${
                            formData.roleId === 1 ? "text-purple-600" : "text-gray-400"
                          }`} />
                        ) : role.id === 2 ? (
                          <FaUserMd className={`mx-auto mb-2 text-2xl ${
                            formData.roleId === 2 ? "text-blue-600" : "text-gray-400"
                          }`} />
                        ) : (
                          <FaUser className={`mx-auto mb-2 text-2xl ${
                            formData.roleId === 3 ? "text-emerald-600" : "text-gray-400"
                          }`} />
                        )}
                        <div className={`text-sm font-medium ${
                          formData.roleId === role.id
                            ? role.id === 1 
                              ? "text-purple-700"
                              : role.id === 2
                              ? "text-blue-700"
                              : "text-emerald-700"
                            : "text-gray-700"
                        }`}>
                          {role.displayName}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaUser className="mr-2 text-gray-400" size={14} />
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="username"
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
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* First & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaIdBadge className="mr-2 text-gray-400" size={14} />
                      Имя
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Иван"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaIdBadge className="mr-2 text-gray-400" size={14} />
                      Фамилия
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Иванов"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaLock className="mr-2 text-gray-400" size={14} />
                    Пароль
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Далее
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 2: Специфичные данные роли */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleFinalSubmit}
                className="space-y-4"
              >
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    <strong>Роль:</strong> {roles.find(r => r.id === formData.roleId)?.displayName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Пользователь:</strong> {formData.username}
                  </p>
                </div>

                {/* Для Администратора */}
                {formData.roleId === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaPhone className="mr-2 text-gray-400" size={14} />
                      Контактный номер (опционально)
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={roleSpecificData.contactNumber}
                      onChange={handleRoleSpecificChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="+7 (___) ___-__-__"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Для администратора дополнительные поля не требуются
                    </p>
                  </div>
                )}

                {/* Для Доктора */}
                {formData.roleId === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaStethoscope className="mr-2 text-gray-400" size={14} />
                        Специализация
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={roleSpecificData.specialization}
                        onChange={handleRoleSpecificChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Например: Кардиолог, Терапевт"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaPhone className="mr-2 text-gray-400" size={14} />
                        Контактный номер
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={roleSpecificData.contactNumber}
                        onChange={handleRoleSpecificChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+7 (___) ___-__-__"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Для Пациента */}
                {formData.roleId === 3 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaVenusMars className="mr-2 text-gray-400" size={14} />
                          Пол
                        </label>
                        <select
                          name="gender"
                          value={roleSpecificData.gender}
                          onChange={handleRoleSpecificChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        >
                          <option value="male">Мужской</option>
                          <option value="female">Женский</option>
                          <option value="other">Другой</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FaPhone className="mr-2 text-gray-400" size={14} />
                          Контактный номер
                        </label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={roleSpecificData.contactNumber}
                          onChange={handleRoleSpecificChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="+7 (___) ___-__-__"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" size={14} />
                        Адрес
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={roleSpecificData.address}
                        onChange={handleRoleSpecificChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Город, улица, дом"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Buttons */}
                <div className="flex justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    disabled={isLoading}
                  >
                    <FaArrowLeft className="mr-2" size={14} />
                    Назад
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-75"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Создание...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Создать пользователя
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default UserRegistrationModal;