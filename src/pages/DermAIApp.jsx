import React, { useState, useEffect } from "react";
import { FaUpload, FaImage, FaChartBar, FaHistory, FaStethoscope, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import axios from "axios";

const DermAIApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  // Базовый URL API
  const API_BASE_URL = "http://localhost:8000";

  // Проверка здоровья API
  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setApiHealth(response.data);
    } catch (err) {
      console.error("API health check failed:", err);
    }
  };

  // Получение информации о модели
  const fetchModelInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/model-info`);
      setModelInfo(response.data);
    } catch (err) {
      console.error("Failed to fetch model info:", err);
    }
  };

  // Обработчик выбора файла
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Тек JPEG, JPG, PNG немесе WebP суреттер қабылданады");
      return;
    }

    // Проверка размера файла (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Суреттің көлемі 10MB-тан аспауы тиіс");
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccess("");

    // Создание предпросмотра
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Отправка изображения на анализ
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Суретті таңдаңыз");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      console.log("Анализ басталуда...");
      const response = await axios.post(`${API_BASE_URL}/predict/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Нәтиже алынды:", response.data);
      setPrediction(response.data);
      
      // Сохраняем в историю
      const newHistoryItem = {
        id: Date.now(),
        filename: selectedFile.name,
        timestamp: new Date().toLocaleString("kk-KZ"),
        result: response.data,
      };
      
      setHistory([newHistoryItem, ...history.slice(0, 4)]); // Храним последние 5 записей
      setSuccess("Анализ сәтті аяқталды!");
      
    } catch (err) {
      console.error("Анализ қатесі:", err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        "Анализ кезінде қате пайда болды"
      );
    } finally {
      setLoading(false);
    }
  };

  // Очистка формы
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setError("");
    setSuccess("");
  };

  // Загрузка примера изображения
  const loadSampleImage = async () => {
    try {
      // Можно использовать случайное изображение из интернета для демо
      // Или предварительно загруженные примеры
      setLoading(true);
      const response = await fetch("https://picsum.photos/400/300");
      const blob = await response.blob();
      const file = new File([blob], "sample-image.jpg", { type: "image/jpeg" });
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setError("");
      setSuccess("Үлгі сурет жүктелді. Анализді бастау үшін төмендегі батырманы басыңыз.");
    } catch (err) {
      setError("Үлгі суретті жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  };

  // Инициализация при загрузке
  useEffect(() => {
    checkApiHealth();
    fetchModelInfo();
    
    // Загружаем историю из localStorage
    const savedHistory = localStorage.getItem("dermai_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Сохраняем историю в localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("dermai_history", JSON.stringify(history));
    }
  }, [history]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <FaStethoscope className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">DermAI - Тері қатерлі ісігінің анықтағышы</h1>
              <p className="text-sm opacity-90">Жасанды интеллект негізіндегі тері ауруларын талдау жүйесі</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {apiHealth && (
              <div className={`px-3 py-1 rounded-full text-sm ${apiHealth.status === "healthy" ? "bg-green-500" : "bg-yellow-500"}`}>
                API: {apiHealth.status === "healthy" ? "Белсенді" : "Шектеулі"}
              </div>
            )}
            <p className="text-sm mt-2">Дәрігердің кеңесін алмастырмайды</p>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4">
        <div className="container mx-auto flex items-center">
          <FaExclamationTriangle className="flex-shrink-0 mr-3" />
          <div>
            <strong>ЕСКЕРТУ:</strong> Бұл құрал тек көмекші ретінде қызмет етеді. 
            Нақты диагноз қою және емдеу үшін міндетті түрде дәрігерге жүгініңіз.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Загрузка и информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Карточка загрузки */}
            <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUpload className="mr-2 text-blue-600" />
                Суретті жүктеу
              </h2>
              
              {/* Область загрузки */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                  ${previewUrl ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Предпросмотр" 
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <FaImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Суретті жүктеу үшін осы жерді басыңыз немесе суретті тартыңыз</p>
                    <p className="text-sm text-gray-500">Қолдау көрсетілетін форматтар: JPG, PNG, JPEG</p>
                    <p className="text-sm text-gray-500">Максималды өлшем: 10MB</p>
                  </>
                )}
              </div>

              {/* Кнопки управления */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !selectedFile}
                  className={`flex-1 flex items-center justify-center p-4 rounded-xl text-white transition duration-200 ${
                    loading || !selectedFile
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                        />
                      </svg>
                      Талдауда...
                    </>
                  ) : (
                    <>
                      <FaChartBar className="mr-2" />
                      Теріні Талдау
                    </>
                  )}
                </button>
                
                <button
                  onClick={loadSampleImage}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center p-4 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition duration-200"
                >
                  <FaImage className="mr-2" />
                  Үлгі Сурет
                </button>
                
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center p-4 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition duration-200"
                >
                  Тазалау
                </button>
              </div>

              {/* Сообщения об ошибках/успехе */}
              {error && (
                <div className="mt-4 bg-red-100 text-red-700 p-4 rounded-lg animate-fade-in">
                  <FaExclamationTriangle className="inline mr-2" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mt-4 bg-green-100 text-green-700 p-4 rounded-lg animate-fade-in">
                  <FaCheckCircle className="inline mr-2" />
                  {success}
                </div>
              )}
            </div>

            {/* Карточка результатов */}
            {prediction && (
              <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaChartBar className="mr-2 text-blue-600" />
                  Талдау Нәтижесі
                </h2>
                
                {/* Основной результат */}
                <div className={`p-6 rounded-xl mb-6 ${prediction.risk_level === "high" ? "bg-red-50 border-l-4 border-red-500" : "bg-green-50 border-l-4 border-green-500"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {prediction.prediction === "melanoma" ? "🎗️ Меланома" : "✅ Қауіпсіз"}
                      </h3>
                      <p className="text-gray-600">{prediction.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">сенімділік</div>
                    </div>
                  </div>
                  
                  {/* Уровень риска */}
                  <div className={`inline-block px-4 py-2 rounded-full font-bold ${prediction.risk_level === "high" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
                    {prediction.risk_level === "high" ? "⚡ Жоғары қауіп" : "✅ Төмен қауіп"}
                  </div>
                  
                  {/* Рекомендация */}
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">🎯 Ұсыныс:</h4>
                    <p>{prediction.recommendation}</p>
                  </div>
                </div>

                {/* Детальная информация о вероятностях */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">Толық ықтималдықтар:</h4>
                  <div className="space-y-3">
                    {Object.entries(prediction.probabilities).map(([className, probability]) => (
                      <div key={className} className="flex items-center">
                        <div className="w-24 text-sm font-medium text-gray-700">
                          {className === "melanoma" ? "Меланома" : "Қауіпсіз"}
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${className === "melanoma" ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${probability * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-bold">
                          {(probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - Информация и история */}
          <div className="space-y-6">
            {/* Информация о модели */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaStethoscope className="mr-2 text-blue-600" />
                Модель Ақпараты
              </h2>
              
              {modelInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Модель:</span>
                    <span className="font-medium">{modelInfo.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Архитектура:</span>
                    <span className="font-medium">{modelInfo.architecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дереккөз:</span>
                    <span className="font-medium">{modelInfo.dataset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Жаттығу күні:</span>
                    <span className="font-medium">
                      {new Date(modelInfo.training_date).toLocaleDateString("kk-KZ")}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">{modelInfo.medical_disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Модель ақпараты жүктелуде...
                </div>
              )}
            </div>

            {/* История анализов */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaHistory className="mr-2 text-blue-600" />
                Жуырдағы Талдаулар
              </h2>
              
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border ${item.result.risk_level === "high" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm truncate">{item.filename}</p>
                          <p className="text-xs text-gray-500">{item.timestamp}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${item.result.risk_level === "high" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
                          {item.result.prediction === "melanoma" ? "Меланома" : "Қауіпсіз"}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        Сенімділік: <span className="font-bold">{(item.result.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Әлі талдаулар жоқ
                </div>
              )}
            </div>

            {/* Подсказки */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-800 mb-3">💡 Кеңестер:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Суретті жақсы жарықта түсіріңіз</li>
                <li>• Терінің аймағы толық көрінуі керек</li>
                <li>• Фон қарапайым болуы тиіс</li>
                <li>• Суреттің анықтығы жоғары болуы керек</li>
                <li>• Күмән туындаған жағдайда дәрігерге жүгініңіз</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4">
        <div className="container mx-auto text-center">
          <p className="text-sm">© {new Date().getFullYear()} DermAI - Тері қатерлі ісігінің анықтағышы</p>
          <p className="text-xs opacity-80 mt-1">
            Жасанды интеллект негізіндегі медициналық көмекші құрал
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DermAIApp;