import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  FaUsers, 
  FaUserPlus, 
  FaSignOutAlt, 
  FaIdBadge,
  FaEnvelope,
  FaUser,
  FaUserTag,
  FaCalendarAlt,
  FaHistory,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import UserRegistrationModal from "../components/UserRegistrationModal";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const authToken = useSelector((state) => state.token.token);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Список ролей
  const roles = [
    { id: 1, name: "ROLE_ADMIN", displayName: "Администратор" },
    { id: 2, name: "ROLE_DOCTOR", displayName: "Врач" },
    { id: 3, name: "ROLE_USER", displayName: "Пациент" },
  ];

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    try {
      if (!authToken) {
        throw new Error("Токен не найден. Пожалуйста, войдите снова.");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json") ? await response.json() : {};
        throw new Error(data.error || `Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Ошибка при загрузке данных.");
      setLoading(false);
      console.error("AdminPanel error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Обработчик выхода
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Callback после успешного создания пользователя
  const handleUserCreated = (newUser) => {
    // Перезагружаем список пользователей
    fetchUsers();
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/delete/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json") ? await response.json() : {};
        throw new Error(data.error || `Ошибка HTTP: ${response.status}`);
      }

      setUsers(users.filter((user) => user.userId !== userId));
      
      // Показываем уведомление об успехе
      const successMsg = document.createElement("div");
      successMsg.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center";
      successMsg.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        Пользователь успешно удален
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
    } catch (err) {
      setError(err.message || "Ошибка при удалении пользователя.");
      console.error("Delete user error:", err);
    }
  };

  // Получить цвет роли
  const getRoleColor = (roleName) => {
    switch (roleName) {
      case "ROLE_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "ROLE_DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "ROLE_USER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <FaUsers className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Административная панель</h1>
                <p className="text-gray-600 mt-2">Управление пользователями системы</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors flex items-center text-sm shadow-md hover:shadow-lg"
              >
                <FaUserPlus className="mr-2" />
                Добавить пользователя
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-xl transition-colors flex items-center text-sm"
              >
                <FaSignOutAlt className="mr-2" />
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
                <button 
                  onClick={() => setError("")}
                  className="ml-auto text-red-900 hover:text-red-700"
                >
                  <FaTimesCircle />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FaUsers className="mr-3 text-indigo-600" />
              Список пользователей
              <span className="ml-3 bg-gray-100 text-gray-600 text-sm font-normal px-3 py-1 rounded-full">
                {users.length} {users.length === 1 ? 'пользователь' : users.length < 5 ? 'пользователя' : 'пользователей'}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-500">Загрузка пользователей...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[100px]">
                      <div className="flex items-center">
                        <FaIdBadge className="mr-2 text-gray-400" />
                        ID
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[180px]">
                      Пользователь
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[220px]">
                      <div className="flex items-center">
                        <FaEnvelope className="mr-2 text-gray-400" />
                        Email
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[140px]">
                      Имя
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[140px]">
                      Фамилия
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[160px]">
                      Роли
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[180px]">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        Создан
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[180px]">
                      <div className="flex items-center">
                        <FaHistory className="mr-2 text-gray-400" />
                        Обновлен
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[120px]">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">#{user.userId}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-indigo-600 font-medium text-sm">
                              {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            {user.online && (
                              <span className="inline-flex items-center text-xs text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                Online
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{user.firstName || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{user.lastName || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.roleName)}`}
                            >
                              {roles.find(r => r.name === role.roleName)?.displayName || role.roleName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {new Date(user.updatedAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleDeleteUser(user.userId)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center text-sm"
                          title="Удалить пользователя"
                        >
                          <FaTrash className="mr-2" />
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Пользователи не найдены</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                В системе пока нет пользователей. Добавьте первого пользователя.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center mx-auto"
              >
                <FaUserPlus className="mr-2" />
                Добавить пользователя
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <FaUsers className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Densaulyq Административная панель</p>
                <p className="text-sm text-gray-500">Управление пользователями системы</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Densaulyq | Всего пользователей: {users.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Только администраторы имеют доступ к этой панели
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Модальное окно регистрации пользователя */}
      <UserRegistrationModal
        showModal={showModal}
        setShowModal={setShowModal}
        onUserCreated={handleUserCreated}
        authToken={authToken}
        API_BASE_URL={API_BASE_URL}
      />
    </div>
  );
};

export default AdminPanel;