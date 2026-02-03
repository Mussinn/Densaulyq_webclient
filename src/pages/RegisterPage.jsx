import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(form);
      navigate("/login", {
        state: { message: "Тіркелу сәтті аяқталды! Кіріңіз." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Тіркелу кезінде қате пайда болды. Мәліметтерді тексеріңіз."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105">
        <div className="flex justify-center mb-6">
          <svg
            className="w-12 h-12 text-blue-600"
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
            ></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Тіркелу
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Жеке Деректерді Қорғау Жүйесі
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Пайдаланушы аты
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Пайдаланушы атын енгізіңіз"
              value={form.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
              minLength={3}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Электронды пошта
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Электронды поштаны енгізіңіз"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Аты
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Атыңызды енгізіңіз"
              value={form.firstName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Тегі
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Тегіңізді енгізіңіз"
              value={form.lastName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Құпия сөз
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Құпия сөзді енгізіңіз"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-blue-400"
            disabled={isLoading}
          >
            {isLoading ? "Тіркелуде..." : "Тіркелу"}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          Жетілдірілген шифрлау стандарттарымен қорғалған
        </p>
      </div>
    </div>
  );
};

export default Register;