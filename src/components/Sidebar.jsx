// src/components/layout/Sidebar.jsx
import { Home, FileText, ShieldCheck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r shadow-sm p-6 space-y-6">
      <div className="text-2xl font-bold text-primary">MedSafe</div>
      <nav className="space-y-4">
        <Link className="flex items-center gap-2 text-gray-700 hover:text-blue-600" to="/dashboard">
          <Home size={20} /> Доска анализа
        </Link>
        <Link className="flex items-center gap-2 text-gray-700 hover:text-blue-600" to="/home">
          <Home size={20} /> Главная
        </Link>
        <Link className="flex items-center gap-2" to="/diagnosis/create">
          <FileText size={20} /> Новый диагноз
        </Link>
        <Link className="flex items-center gap-2" to="/diagnosis/view">
          <ShieldCheck size={20} /> Расшифровка
        </Link>
        <Link className="flex items-center gap-2" to="/audit/logs">
          <FileText size={20} /> Аудит
        </Link>
        <button className="flex items-center gap-2 text-red-600 mt-10">
          <LogOut size={20} /> Выйти
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
