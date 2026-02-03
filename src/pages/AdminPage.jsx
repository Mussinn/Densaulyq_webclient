import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Компонент модального окна для добавления пользователя
const AddUserModal = ({ showModal, setShowModal, form, setForm, formError, setFormError, handleAddUser, roles }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  return (
    showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Добавить пользователя</h3>
          {formError && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">{formError}</div>
          )}
          <form onSubmit={handleAddUser} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={form.username}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={form.password}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Введите email"
                value={form.email}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Введите имя"
                value={form.firstName}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Фамилия
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Введите фамилию"
                value={form.lastName}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <select
                id="roleId"
                name="roleId"
                value={form.roleId}
                onChange={handleFormChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Выберите роль
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 min-w-[140px]"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 min-w-[140px]"
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
  });
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const authToken = useSelector((state) => state.token.token);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Список ролей
  const roles = [
    { id: 1, name: "ROLE_ADMIN", displayName: "Администратор" },
    { id: 2, name: "ROLE_DOCTOR", displayName: "Врач" },
    { id: 3, name: "ROLE_USER", displayName: "Пользователь" },
  ];

  // Загрузка списка пользователей
  useEffect(() => {
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

    fetchUsers();
  }, [authToken, API_BASE_URL]);

  // Обработчик выхода
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Обработчик добавления пользователя
  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.username || !form.password || !form.email || !form.firstName || !form.lastName || !form.roleId) {
      setFormError("Все поля должны быть заполнены.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...form,
          roleId: parseInt(form.roleId),
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json") ? await response.json() : {};
        throw new Error(data.error || "Ошибка при регистрации пользователя.");
      }

      const data = await response.json();
      setUsers([
        ...users,
        {
          userId: data.userId || Date.now(),
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          roles: [{ roleId: parseInt(form.roleId), roleName: roles.find((r) => r.id === parseInt(form.roleId)).name }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      setShowModal(false);
      setForm({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        roleId: "",
      });
    } catch (err) {
      setFormError(err.message || "Ошибка при добавлении пользователя.");
      console.error("Add user error:", err);
    }
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = async (userId) => {
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
    } catch (err) {
      setError(err.message || "Ошибка при удалении пользователя.");
      console.error("Delete user error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-[95%]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <svg
              className="w-12 h-12 text-blue-600 mr-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2 2 4 2 4 2-2.9 2-4zm0 0c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4-2-2.9-2-4zm-7 7h14M5 5h14"
              />
            </svg>
            <h2 className="text-3xl font-bold text-gray-800">Админ-панель</h2>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 min-w-[160px] text-sm"
            >
              Добавить пользователя
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-200 min-w-[160px] text-sm"
            >
              Выйти
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mb-6 text-lg">Управление пользователями</p>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 text-lg">Загрузка...</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[80px]">ID</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[150px]">
                    Имя пользователя
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[200px]">Email</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[120px]">Имя</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[120px]">
                    Фамилия
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[150px]">Роли</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[180px]">
                    Создан
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[180px]">
                    Обновлен
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-700 border-b min-w-[120px]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="py-4 px-6 border-b text-gray-700">{user.userId}</td>
                    <td className="py-4 px-6 border-b text-gray-700">{user.username}</td>
                    <td className="py-4 px-6 border-b text-gray-700">{user.email}</td>
                    <td className="py-4 px-6 border-b text-gray-700">{user.firstName}</td>
                    <td className="py-4 px-6 border-b text-gray-700">{user.lastName}</td>
                    <td className="py-4 px-6 border-b text-gray-700">
                      {user.roles.map((role) => role.roleName).join(", ")}
                    </td>
                    <td className="py-4 px-6 border-b text-gray-700">
                      {new Date(user.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="py-4 px-6 border-b text-gray-700">
                      {new Date(user.updatedAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="py-4 px-6 border-b">
                      <button
                        onClick={() => handleDeleteUser(user.userId)}
                        className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition duration-200 text-sm"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AddUserModal
          showModal={showModal}
          setShowModal={setShowModal}
          form={form}
          setForm={setForm}
          formError={formError}
          setFormError={setFormError}
          handleAddUser={handleAddUser}
          roles={roles}
        />
      </div>
    </div>
  );
};

export default AdminPanel;