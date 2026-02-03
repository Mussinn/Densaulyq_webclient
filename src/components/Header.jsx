import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="bg-white border-b shadow-sm flex justify-between items-center px-6 py-4">
      <div className="text-lg font-semibold">Панель администратора</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="rounded-full bg-gray-200 h-8 w-8 flex items-center justify-center text-gray-700">
          U
        </div>
      </div>
    </header>
  );
};

export default Header;
