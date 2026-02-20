import React, { useState, useEffect } from "react";
import { FaUpload, FaImage, FaChartBar, FaHistory, FaStethoscope, FaExclamationTriangle, FaCheckCircle, FaHeartbeat, FaLungs, FaInfoCircle, FaCloudUploadAlt, FaRedo, FaSave, FaUserInjured } from "react-icons/fa";
import { useSelector } from 'react-redux';
import axios from "axios";
import api from "../../utils/api";

const DensVision = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [modelsInfo, setModelsInfo] = useState({});
  const [apiHealth, setApiHealth] = useState(null);
  const [analysisType, setAnalysisType] = useState("skin");
  const [apiStatus, setApiStatus] = useState({
    skin: false,
    lungs: false
  });

  // Для сохранения диагноза (DensAI)
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  
  const { token } = useSelector((state) => state.token);

  // Базовый URL API
  const API_BASE_URL = "http://localhost:8000";

  // Проверка здоровья API и статуса моделей
  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setApiHealth(response.data);
      
      setApiStatus({
        skin: response.data.skin_model_loaded,
        lungs: response.data.lungs_model_loaded
      });
      
      return response.data;
    } catch (err) {
      console.error("API health check failed:", err);
      setError("API серверіне қосылу мүмкін болмады");
      return null;
    }
  };

  // Получение информации о моделях
  const fetchModelsInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/models`);
      setModelsInfo(response.data.models || {});
      console.log("Model info loaded:", response.data.models);
    } catch (err) {
      console.error("Failed to fetch model info:", err);
    }
  };

  // Загрузка списка пациентов
  const fetchPatients = async () => {
    try {
      if (!token) return;
      const response = await api.get('/api/v1/patient', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data || []);
    } catch (err) {
      console.error('Науқастарды жүктеу қатесі:', err);
    }
  };

  // Загрузка медицинских записей для пациента
  const fetchMedicalRecords = async (patientId) => {
    try {
      if (!patientId) return;
      const response = await api.get(`/api/v1/patient/medical-record/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicalRecords(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedRecordId(response.data[0].recordId.toString());
      }
    } catch (err) {
      console.error('Медициналық жазбалар қатесі:', err);
      setMedicalRecords([]);
    }
  };

  // Обработчик выбора файла
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"];
    if (!validTypes.includes(file.type)) {
      setError("Тек JPEG, JPG, PNG, WebP немесе BMP суреттер қабылданады");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Суреттің көлемі 10MB-тан аспауы тиіс");
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccess("");
    setPrediction(null);

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

    if (analysisType === "skin" && !apiStatus.skin) {
      setError("Тері диагностикасының моделі жүктелмеген");
      return;
    }
    
    if (analysisType === "lungs" && !apiStatus.lungs) {
      setError("Өкпе диагностикасының моделі жүктелмеген");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      console.log(`${analysisType} анализ басталуда...`);
      
      const endpoint = analysisType === "skin" ? "/predict/skin" : "/predict/lungs";
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Нәтиже алынды:", response.data);
      
      const formattedResult = {
        ...response.data,
        prediction: response.data.prediction || "Unknown",
        confidence: response.data.confidence || 0,
        confidence_percentage: response.data.confidence_percentage || "0%",
        risk_level: response.data.risk_level || "unknown",
        recommendation: response.data.recommendation || "Ұсыныс жоқ",
        class_info: response.data.class_info || {},
        all_probabilities: response.data.all_probabilities || {},
        timestamp: response.data.timestamp || new Date().toISOString(),
        analysis_type: analysisType
      };
      
      setPrediction(formattedResult);
      
      const newHistoryItem = {
        id: Date.now(),
        filename: selectedFile.name,
        timestamp: new Date().toLocaleString("kk-KZ"),
        result: formattedResult,
        analysis_type: analysisType
      };
      
      setHistory([newHistoryItem, ...history.slice(0, 9)]);
      setSuccess(`${analysisType === "skin" ? "Тері" : "Өкпе"} анализы сәтті аяқталды!`);
      
    } catch (err) {
      console.error("Анализ қатесі:", err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        err.message || 
        "Анализ кезінде қате пайда болды"
      );
    } finally {
      setLoading(false);
    }
  };

  // Открытие модального окна сохранения (DensAI)
  const openSaveModal = () => {
    if (!token) {
      setError("Диагнозды сақтау үшін жүйеге кіріңіз");
      return;
    }
    setShowSaveModal(true);
    setSelectedPatientId("");
    setSelectedRecordId("");
    setMedicalRecords([]);
  };

  // Сохранение AI диагноза (DensAI)
  const saveDiagnosis = async () => {
    if (!selectedPatientId) {
      setError("Науқасты таңдаңыз");
      return;
    }

    if (!selectedRecordId) {
      setError("Медициналық жазбаны таңдаңыз");
      return;
    }

    setSavingDiagnosis(true);
    setError("");

    try {
      // Формируем текст диагноза с предупреждением
      const aiDiagnosisText = `
╔════════════════════════════════════════════════════════════╗
║           🤖 DensAI - ЖАСАНДЫ ИНТЕЛЛЕКТ ДИАГНОЗЫ          ║
╚════════════════════════════════════════════════════════════╝

⚠️ МАҢЫЗДЫ ЕСКЕРТУ:
Бұл диагноз DensAI жүйесімен автоматты түрде жасалған.
DensAI 100% дәлдікпен жұмыс істемейді және тек көмекші құрал болып табылады.
Нақты диагноз қою және емдеуді тағайындау үшін МІНДЕТТІ түрде білікті дәрігерге жүгініңіз.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ТАЛДАУ ТҮРІ: ${analysisType === "skin" ? "🩺 DensVision - Тері диагностикасы" : "🫁 DensVision - Өкпе диагностикасы"}

🔍 АНЫҚТАЛҒАН ЖАЙ-КҮЙ:
   ${getClassName(prediction.prediction, prediction.analysis_type)}

📈 DensAI СЕНІМДІЛІГІ: ${prediction.confidence_percentage || `${(prediction.confidence * 100).toFixed(1)}%`}

${getRiskIcon(prediction.risk_level)} ҚАУІП ДЕҢГЕЙІ: ${getRiskText(prediction.risk_level)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DensAI ҰСЫНЫСЫ:
${prediction.recommendation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 БАРЛЫҚ ЫҚТИМАЛДЫҚТАР (DensVision):
${Object.entries(prediction.all_probabilities || {})
  .map(([className, data]) => 
    `   • ${getClassName(className, prediction.analysis_type)}: ${data.percentage || `${((data.probability || 0) * 100).toFixed(1)}%`}`
  )
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 КЕЛЕСІ ҚАДАМДАР:
✓ Білікті дәрігерге кеңес алу
✓ Қосымша тексерулер өткізу
✓ Нақты диагноз алу
✓ Емдеу жоспарын құру

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚕️ ДӘРІГЕРГЕ АРНАЛҒАН ЕСКЕРТУ:
Бұл DensAI талдауы тек бастапқы скрининг мақсатында қолданылады.
Нақты диагноз қою үшін клиникалық тексеру, анамнез жинау және 
қосымша зертханалық зерттеулер қажет.

📅 Талдау күні: ${new Date().toLocaleString('kk-KZ')}
🤖 Модель: ${prediction.model_info?.name || 'DensVision AI'}
📁 Файл аты: ${selectedFile?.name || 'Белгісіз'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ЗАҢДЫ ЕСКЕРТУ:
DensAI жүйесі медициналық көмекті алмастырмайды. Жүйе әзірлеушілері 
диагноздың дұрыс болмауы немесе емдеуден туындаған зардаптар үшін 
жауапты болмайды. Барлық медициналық шешімдер білікті дәрігермен 
консультациядан кейін қабылдануы тиіс.
`;

      const payload = {
        patientId: Number(selectedPatientId),
        recordId: Number(selectedRecordId),
        diagnosisText: aiDiagnosisText.trim(),
      };

      console.log('DensAI диагнозын сақтау:', payload);

      const response = await api.post('/api/v1/diagnosis/create/bot', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const newDiagnosis = response.data;
      console.log('DensAI диагноз сақталды:', newDiagnosis);

      setSuccess(`DensAI диагнозы сәтті сақталды! Диагноз ID: ${newDiagnosis.diagnosisId}`);
      setShowSaveModal(false);
      
      // Очищаем форму через 3 секунды
      setTimeout(() => {
        setSuccess("");
      }, 5000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Белгісіз қате';
      setError(`DensAI диагнозды сақтау қатесі: ${errorMessage}`);
      console.error('Сақтау қатесі:', err.response?.data || err);
    } finally {
      setSavingDiagnosis(false);
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
  const loadSampleImage = () => {
    try {
      let sampleUrl;
      let fileName;
      
      if (analysisType === "skin") {
        sampleUrl = "https://images.unsplash.com/photo-1545930748-acae6fbfb3c8?w=400&h=300&fit=crop";
        fileName = "тері_үлгісі.jpg";
      } else {
        sampleUrl = "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w-400&h=300&fit=crop";
        fileName = "өкпе_үлгісі.jpg";
      }
      
      setPreviewUrl(sampleUrl);
      setSelectedFile(new File([""], fileName, { type: "image/jpeg" }));
      setError("");
      setSuccess("Үлгі сурет жүктелді. Анализді бастау үшін төмендегі батырманы басыңыз.");
      setPrediction(null);
      
    } catch (err) {
      setError("Үлгі суретті жүктеу қатесі");
    }
  };

  // Получение названия класса
  const getClassName = (className, type) => {
    if (type === "skin") {
      const skinClasses = {
        "melanoma": "Меланома",
        "bcc": "Базальноклеточная карцинома",
        "akiec": "Актинический кератоз",
        "nv": "Невус (қауіпсіз)",
        "df": "Дерматофиброма",
        "vasc": "Қан тамырлары ауруы",
        "bkl": "Қатерлі емес кератоз"
      };
      return skinClasses[className.toLowerCase()] || className;
    } else {
      const lungClasses = {
        "covid": "COVID-19 пневмония",
        "pneumonia": "Пневмония",
        "normal": "Қалыпты",
        "tuberculosis": "Туберкулез",
        "lung_opacity": "Өкпенің тұмандануы"
      };
      return lungClasses[className.toLowerCase()] || className;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "high": return "red";
      case "medium": return "orange";
      case "low": return "green";
      default: return "gray";
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case "high": return "⚠️";
      case "medium": return "🔶";
      case "low": return "✅";
      default: return "❓";
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case "high": return "Жоғары қауіп";
      case "medium": return "Орташа қауіп";
      case "low": return "Төмен қауіп";
      default: return "Белгісіз";
    }
  };

  // Инициализация при загрузке
  useEffect(() => {
    const initApp = async () => {
      const health = await checkApiHealth();
      if (health && health.status === "healthy") {
        await fetchModelsInfo();
      }
      
      if (token) {
        await fetchPatients();
      }
      
      const savedHistory = localStorage.getItem("densvision_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }
    };
    
    initApp();
    
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("densvision_history", JSON.stringify(history));
    }
  }, [history]);

  // Обработка выбора пациента
  useEffect(() => {
    if (selectedPatientId) {
      fetchMedicalRecords(selectedPatientId);
    }
  }, [selectedPatientId]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-teal-700 text-white p-4 shadow-xl">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <FaStethoscope className="w-10 h-10 text-cyan-300" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">DensVision + DensAI</h1>
              <p className="text-sm opacity-90">Жасанды интеллект негізіндегі медициналық диагностика</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {apiHealth && (
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-1 rounded-full text-sm font-semibold ${apiHealth.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`}>
                  API: {apiHealth.status === "healthy" ? "🎯 Белсенді" : "⚠️ Шектеулі"}
                </div>
                <div className="text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">DensVision:</span>
                    <span className={`w-3 h-3 rounded-full ${apiStatus.skin ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="mr-2">DensAI:</span>
                    <span className={`w-3 h-3 rounded-full ${apiStatus.lungs ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs mt-2 opacity-80">Дәрігердің кеңесін алмастырмайды</p>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto p-3">
          <div className="flex items-center justify-center text-amber-800">
            <FaExclamationTriangle className="flex-shrink-0 mr-3 text-amber-500" />
            <div className="text-sm text-center">
              <strong>ЕСКЕРТУ:</strong> Бұл құрал тек көмекші скрининг ретінде қызмет етеді. 
              Нақты диагноз қою және емдеу үшін міндетті түрде дәрігерге жүгініңіз.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Загрузка и результаты (DensVision) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Выбор типа анализа */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-3">DensVision талдау түрін таңдаңыз:</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => setAnalysisType("skin")}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition duration-200 ${
                    analysisType === "skin"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <FaHeartbeat className="w-8 h-8 mb-2" />
                  <span className="font-medium">DensVision Тері</span>
                  <span className="text-xs mt-1 text-gray-500">
                    {apiStatus.skin ? "✓ Қолжетімді" : "✗ Қолжетімсіз"}
                  </span>
                </button>
                
                <button
                  onClick={() => setAnalysisType("lungs")}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition duration-200 ${
                    analysisType === "lungs"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <FaLungs className="w-8 h-8 mb-2" />
                  <span className="font-medium">DensVision Өкпе</span>
                  <span className="text-xs mt-1 text-gray-500">
                    {apiStatus.lungs ? "✓ Қолжетімді" : "✗ Қолжетімсіз"}
                  </span>
                </button>
              </div>
            </div>

            {/* Карточка загрузки - DensVision */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaCloudUploadAlt className="mr-3 text-blue-600" />
                DensVision - {analysisType === "skin" ? "Тері Суретін Жүктеу" : "Өкпе Рентген Суретін Жүктеу"}
              </h2>
              
              {/* Область загрузки */}
              <div 
                className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
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
                      className="max-h-80 mx-auto rounded-lg shadow-lg object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                      title="Суретті өшіру"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full">
                      <FaImage className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-lg text-gray-700 mb-2">
                      Суретті жүктеу үшін осы жерді басыңыз
                    </p>
                    <p className="text-gray-500 mb-1">немесе суретті аймаққа тартыңыз</p>
                    <div className="inline-flex items-center px-4 py-2 mt-4 bg-gray-100 rounded-full text-sm text-gray-600">
                      <span>Қолдау көрсетілетін форматтар: JPG, PNG, JPEG, WebP</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Максималды өлшем: 10MB</p>
                  </>
                )}
              </div>

              {/* Кнопки управления */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !selectedFile || (analysisType === "skin" && !apiStatus.skin) || (analysisType === "lungs" && !apiStatus.lungs)}
                  className={`flex-1 flex items-center justify-center p-4 rounded-xl text-white font-semibold transition duration-200 shadow-md ${
                    loading || !selectedFile || (analysisType === "skin" && !apiStatus.skin) || (analysisType === "lungs" && !apiStatus.lungs)
                      ? "bg-gray-400 cursor-not-allowed"
                      : analysisType === "skin" 
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      DensVision талдауда...
                    </>
                  ) : (
                    <>
                      <FaChartBar className="mr-3" />
                      DensVision {analysisType === "skin" ? "Теріні Талдау" : "Өкпені Талдау"}
                    </>
                  )}
                </button>
                
                <button
                  onClick={loadSampleImage}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center p-4 rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition duration-200 font-semibold"
                >
                  <FaImage className="mr-3" />
                  Үлгі Сурет
                </button>
                
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center p-4 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition duration-200 font-semibold"
                >
                  <FaRedo className="mr-3" />
                  Тазалау
                </button>
              </div>

              {/* Сообщения об ошибках/успехе */}
              {error && (
                <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg border border-red-200 animate-fade-in">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-3 text-red-500" />
                    <div>
                      <strong>Қате:</strong> {error}
                    </div>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mt-4 bg-emerald-100 text-emerald-800 p-4 rounded-lg border border-emerald-200 animate-fade-in">
                  <div className="flex items-center">
                    <FaCheckCircle className="mr-3 text-emerald-500" />
                    <div>
                      <strong>Сәтті:</strong> {success}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Карточка результатов - DensVision + DensAI */}
            {prediction && (
              <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaChartBar className="mr-3 text-blue-600" />
                  DensVision + DensAI Нәтижесі
                </h2>
                
                {/* Основной результат */}
                <div className={`p-6 rounded-xl mb-6 ${prediction.risk_level === "high" ? "bg-red-50 border-l-4 border-red-500" : prediction.risk_level === "medium" ? "bg-amber-50 border-l-4 border-amber-500" : "bg-emerald-50 border-l-4 border-emerald-500"}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getRiskIcon(prediction.risk_level)}</span>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {getClassName(prediction.prediction, prediction.analysis_type)}
                        </h3>
                      </div>
                      {prediction.class_info?.description && (
                        <p className="text-gray-600 mt-2">{prediction.class_info.description}</p>
                      )}
                    </div>
                    <div className="text-center md:text-right">
                      <div className="text-4xl font-bold text-blue-600">
                        {prediction.confidence_percentage || `${(prediction.confidence * 100).toFixed(1)}%`}
                      </div>
                      <div className="text-sm text-gray-500">DensAI сенімділік</div>
                    </div>
                  </div>
                  
                  {/* Уровень риска */}
                  <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-white ${getRiskColor(prediction.risk_level) === "red" ? "bg-red-500" : getRiskColor(prediction.risk_level) === "orange" ? "bg-amber-500" : "bg-emerald-500"}`}>
                    <span className="mr-2">{getRiskIcon(prediction.risk_level)}</span>
                    {getRiskText(prediction.risk_level)}
                  </div>
                  
                  {/* Рекомендация DensAI */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                      <FaInfoCircle className="mr-2 text-blue-500" />
                      DensAI Ұсынысы:
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{prediction.recommendation}</p>
                  </div>

                  {/* КНОПКА СОХРАНЕНИЯ ДИАГНОЗА (DensAI) */}
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <button
                      onClick={openSaveModal}
                      disabled={!token}
                      className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                        !token 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      }`}
                    >
                      <FaSave className="mr-3 text-xl" />
                      <span className="text-lg">DensAI - Науқасқа диагноз сақтау</span>
                    </button>
                    {!token && (
                      <p className="text-center text-sm text-red-600 mt-2">
                        Диагнозды сақтау үшін жүйеге кіріңіз
                      </p>
                    )}
                  </div>
                </div>

                {/* Детальная информация о вероятностях от DensVision */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <FaChartBar className="mr-2" />
                    DensVision - Барлық Ықтималдықтар:
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(prediction.all_probabilities || {}).map(([className, data]) => (
                      <div key={className} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                        <div className="w-full sm:w-64 text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <span className="mr-2">{getClassName(className, prediction.analysis_type)}</span>
                            {prediction.prediction.toLowerCase() === className.toLowerCase() && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">DensVision таңдаған</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 ml-0 sm:ml-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                prediction.prediction.toLowerCase() === className.toLowerCase()
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                              }`}
                              style={{ width: `${(data.probability || 0) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-bold text-gray-800">
                          {data.percentage || `${((data.probability || 0) * 100).toFixed(1)}%`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Информация о модели DensVision */}
                {prediction.model_info && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaStethoscope className="mr-2" />
                      <div>
                        DensVision модель: <span className="font-medium">{prediction.model_info.name}</span>
                        {prediction.model_info.accuracy && (
                          <span className="ml-4">
                            Дәлдік: <span className="font-medium">{prediction.model_info.accuracy}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка - Информация и история (DensVision + DensAI) */}
          <div className="space-y-6">
            {/* Информация о моделях */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaStethoscope className="mr-3 text-blue-600" />
                DensVision & DensAI Модельдері
              </h2>
              
              <div className="space-y-4">
                {/* Информация о модели кожи - DensVision */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-blue-800">DensVision Тері</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${apiStatus.skin ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {apiStatus.skin ? "Активті" : "Белсенді емес"}
                    </span>
                  </div>
                  {modelsInfo.skin_cancer ? (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Модель:</span>
                        <span className="font-medium">{modelsInfo.skin_cancer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Архитектура:</span>
                        <span className="font-medium">{modelsInfo.skin_cancer.architecture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Дәлдік:</span>
                        <span className="font-medium">{modelsInfo.skin_cancer.accuracy || "N/A"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2 text-center">
                      DensVision ақпараты жүктелмеді
                    </div>
                  )}
                </div>

                {/* Информация о модели легких - DensAI */}
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-teal-800">DensAI Өкпе</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${apiStatus.lungs ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {apiStatus.lungs ? "Активті" : "Белсенді емес"}
                    </span>
                  </div>
                  {modelsInfo.lung_disease ? (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Модель:</span>
                        <span className="font-medium">{modelsInfo.lung_disease.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Архитектура:</span>
                        <span className="font-medium">{modelsInfo.lung_disease.architecture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Дәлдік:</span>
                        <span className="font-medium">{modelsInfo.lung_disease.accuracy || "N/A"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2 text-center">
                      DensAI ақпараты жүктелмеді
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* История анализов DensVision */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaHistory className="mr-3 text-blue-600" />
                  DensVision Тарихы
                </h2>
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem("densvision_history");
                      setHistory([]);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Тазалау
                  </button>
                )}
              </div>
              
              {history.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition ${item.result.risk_level === "high" ? "border-red-200 bg-red-50" : item.result.risk_level === "medium" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
                      onClick={() => {
                        setPrediction(item.result);
                        setAnalysisType(item.analysis_type);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" title={item.filename}>
                            {item.filename}
                          </p>
                          <p className="text-xs text-gray-500">{item.timestamp}</p>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-bold ml-2 ${
                          item.result.risk_level === "high" ? "bg-red-500 text-white" : 
                          item.result.risk_level === "medium" ? "bg-amber-500 text-white" : 
                          "bg-emerald-500 text-white"
                        }`}>
                          {item.analysis_type === "skin" ? "DensVision" : "DensAI"}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                          {getClassName(item.result.prediction, item.analysis_type)}
                        </div>
                        <div className="text-sm font-bold">
                          {item.result.confidence_percentage || `${(item.result.confidence * 100).toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaHistory className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Әлі DensVision талдаулар жоқ</p>
                  <p className="text-sm mt-1">Сурет жүктеп, алғашқы талдауды бастаңыз</p>
                </div>
              )}
            </div>

            {/* Подсказки */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                <FaInfoCircle className="mr-2" />
                💡 DensVision Кеңестер:
              </h3>
              <ul className="space-y-2 text-sm text-blue-700">
                {analysisType === "skin" ? (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Теріні жақсы жарықта түсіріңіз</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Терінің барлық аймағы анық көрінуі керек</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Фон біртекті және айқын болуы тиіс</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Суреттің анықтығы жоғары болуы керек</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Күмән туындаған жағдайда дерматологқа жүгініңіз</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Рентген суреті анық және айқын болуы керек</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Суретте өкпенің толық көрінісі болуы тиіс</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Өкпе шеттері анық көрінуі керек</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Суретте жарықтандыру біркелкі болуы тиіс</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Күмән туындаған жағдайда пульмонологқа жүгініңіз</span>
                    </li>
                  </>
                )}
              </ul>
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Ескерту:</strong> Бұл жүйе 100% дәлдікпен жұмыс істемейді. 
                  Нақты диагноз үшін әрқашан медициналық мекемеге жүгініңіз.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно сохранения диагноза (DensAI) */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-xl mr-3">
                    <FaSave className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">DensAI Диагнозын Сақтау</h2>
                    <p className="text-purple-100 text-sm mt-1">Науқасқа DensAI талдауын қосу</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Предупреждение */}
            <div className="p-6 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-amber-500 text-2xl mr-3 flex-shrink-0 mt-1" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-2">⚠️ МАҢЫЗДЫ ЕСКЕРТУ (DensAI):</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Бұл DensAI жүйесімен автоматты жасалған диагноз</li>
                    <li>DensAI 100% дәлдікпен жұмыс істемейді</li>
                    <li>Диагнозда DensAI туралы ескерту болады</li>
                    <li>Дәрігер міндетті түрде тексеруі керек</li>
                    <li>Нақты емдеу үшін клиникалық тексеру қажет</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Форма */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Выбор пациента */}
                <div>
                  <label className="block text-gray-800 font-bold mb-2 flex items-center">
                    <FaUserInjured className="mr-2 text-purple-600" />
                    Науқасты таңдаңыз *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">-- Науқасты таңдаңыз --</option>
                    {patients.map((patient) => (
                      <option key={patient.patientId} value={patient.patientId}>
                        {patient.user?.firstName} {patient.user?.lastName} (ID: {patient.patientId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Выбор медицинской записи */}
                {selectedPatientId && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-2">
                      Медициналық жазба *
                    </label>
                    <select
                      value={selectedRecordId}
                      onChange={(e) => setSelectedRecordId(e.target.value)}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    >
                      <option value="">-- Жазбаны таңдаңыз --</option>
                      {medicalRecords.map((record) => (
                        <option key={record.recordId} value={record.recordId}>
                          Жазба #{record.recordId} - {new Date(record.createdAt).toLocaleDateString('kk-KZ')}
                        </option>
                      ))}
                    </select>
                    {medicalRecords.length === 0 && (
                      <p className="text-sm text-yellow-600 mt-2">
                        Бұл науқастың медициналық жазбасы жоқ. Алдымен жазба жасаңыз.
                      </p>
                    )}
                  </div>
                )}

                {/* Информация о сохраняемом диагнозе */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <FaInfoCircle className="mr-2 text-blue-600" />
                    Сақталатын DensAI диагноз:
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Талдау түрі:</span>
                      <span className="font-medium">{analysisType === "skin" ? "🩺 DensVision Тері" : "🫁 DensAI Өкпе"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Диагноз:</span>
                      <span className="font-medium">{getClassName(prediction.prediction, prediction.analysis_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DensAI сенімділік:</span>
                      <span className="font-medium">{prediction.confidence_percentage || `${(prediction.confidence * 100).toFixed(1)}%`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Қауіп деңгейі:</span>
                      <span className="font-medium">{getRiskIcon(prediction.risk_level)} {getRiskText(prediction.risk_level)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={saveDiagnosis}
                  disabled={savingDiagnosis || !selectedPatientId || !selectedRecordId}
                  className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                    savingDiagnosis || !selectedPatientId || !selectedRecordId
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  }`}
                >
                  {savingDiagnosis ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      DensAI сақталуда...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-3" />
                      DensAI диагнозын сақтау
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Бас тарту
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-800 to-teal-800 text-white p-6 mt-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <FaStethoscope className="w-6 h-6 mr-3 text-cyan-300" />
                <h3 className="text-xl font-bold">DensVision + DensAI</h3>
              </div>
              <p className="text-sm opacity-80 mt-2">
                Жасанды интеллект негізіндегі медициналық көмекші скрининг жүйесі
              </p>
            </div>
            <div className="text-sm text-center md:text-right">
              <p>© {new Date().getFullYear()} DensAI - Барлық құқықтар қорғалған</p>
              <p className="opacity-80 mt-1">Version 2.0.0</p>
              <p className="text-xs opacity-60 mt-2">
                Бұл қосымша тек көмекші мақсатта жасалған. 
                Емдеу және диагноз үшін әрқашан медициналық көмекке жүгініңіз.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS для анимаций */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
};

export default DensVision;