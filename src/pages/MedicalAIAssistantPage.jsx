import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import { useSelector } from "react-redux";
import { FaRobot, FaVideo, FaStethoscope, FaHeartbeat, FaThermometerHalf, FaHeadSideVirus } from "react-icons/fa";
import { GiBrain, GiMedicines, GiHealthNormal, GiHealing } from "react-icons/gi";
import { MdHealthAndSafety, MdEmergency, MdLocalHospital } from "react-icons/md";

const MedicalAIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Сәлем! Мен сіздің жеке медициналық көмекшіңіз Densaulyq AI. Сізді не мазалайтынын сипаттаңыз, мен жеделдік дәрежесін анықтауға және әрі қарай не істеу керектігін көрсетуге көмектесемін. Мысалы: 'Менің басым ауырып, сәл жүрегім айнып тұр' деп жаза аласыз.",
      sender: "ai",
      timestamp: new Date(),
      type: "welcome"
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [emergencyCheck, setEmergencyCheck] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [userInfo] = useState({
    name: "Қанат",
    age: 28,
    bloodType: "B+"
  });
  
  const { token, user } = useSelector((state) => state.token);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Фокус на поле ввода при загрузке
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Добавляем сообщение пользователя
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInputText("");
    setIsAnalyzing(true);
    
    try {
      // 1. Проверка на экстренный случай
      const emergencyResponse = await api.post("/api/ai-assistant/emergency-check", {
        symptoms: inputText,
      });
      
      setEmergencyCheck(emergencyResponse.data);
      
      // Если экстренный случай - сразу показываем предупреждение
      if (emergencyResponse.data.isEmergency) {
        const emergencyMessage = {
          id: messages.length + 2,
          text: `⚠️ Назар аударыңыз! Қауіпті симптомдар анықталды: "${emergencyResponse.data.emergencyReason}".\n\n🚑 ${emergencyResponse.data.recommendation}\n\nДәрігерге дереу жүгініңіз!`,
          sender: "ai",
          timestamp: new Date(),
          isEmergency: true,
        };
        
        setMessages(prev => [...prev, emergencyMessage]);
        setIsAnalyzing(false);
        
        // Вибрация для срочных случаев
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        return;
      }
      
      // 2. Анализ симптомов
      const analysisResponse = await api.post("/api/ai-assistant/analyze-symptoms", {
        symptoms: inputText,
      });
      
      setAnalysisResult(analysisResponse.data);
      
      // 3. Генерация уточняющих вопросов
      const questionsResponse = await api.post("/api/ai-assistant/generate-questions", {
        messages: [inputText],
      });
      
      setFollowUpQuestions(questionsResponse.data.questions || []);
      
      // Формируем красивый ответ AI
      const urgencyLevel = analysisResponse.data.urgencyLevel;
      const urgencyText = analysisResponse.data.urgencyDescription;
      const urgencyEmoji = ["🟢", "🟡", "🟠", "🔴", "🚨"][urgencyLevel - 1];
      
      let aiResponse = `🔍 **Талдау аяқталды**\n\n`;
      aiResponse += `${urgencyEmoji} **Жеделдік дәрежесі:** ${urgencyText}\n\n`;
      
      if (analysisResponse.data.redFlags.length > 0) {
        aiResponse += `📌 **Уайымдататын симптомдар:** ${analysisResponse.data.redFlags.join(", ")}\n\n`;
      }
      
      aiResponse += `🏥 **Мүмкін мән-жайлар:**\n${analysisResponse.data.possibleConditions.map(c => `• ${c}`).join("\n")}\n\n`;
      aiResponse += `👨‍⚕️ **Ұсынылатын мамандар:**\n${analysisResponse.data.recommendedSpecialists.map(s => `• ${s}`).join("\n")}\n\n`;
      aiResponse += `💡 **Әрі қарай не істеу керек:**\n${analysisResponse.data.recommendations.map(r => `• ${r}`).join("\n")}`;
      
      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
        analysis: analysisResponse.data,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Показываем вопросы через 1 секунду
      setTimeout(() => {
        setShowQuestions(true);
      }, 1000);
      
    } catch (error) {
      console.error("Талдау қатесі:", error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "Техникалық қате орын алды. Симптомдарды қайта сипаттап көріңіз немесе дәрігерге тікелей жүгініңіз.",
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleQuickQuestion = async (question) => {
    const quickMessage = {
      id: messages.length + 1,
      text: question.text,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages([...messages, quickMessage]);
    setShowQuestions(false);
    setInputText(question.text);
    
    // Автоматически отправляем через небольшую задержку
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };
  
  const handleBookConsultation = (specialist) => {
    const confirmMessage = `Сіз ${specialist} бейнеконсультациясына жазылуды қалайсыз ба?`;
    if (window.confirm(confirmMessage)) {
      window.location.href = `/video-conference?specialist=${encodeURIComponent(specialist)}`;
    }
  };
  
  const getUrgencyColor = (level) => {
    switch (level) {
      case 1: return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case 2: return "bg-amber-50 border-amber-200 text-amber-700";
      case 3: return "bg-orange-50 border-orange-200 text-orange-700";
      case 4: return "bg-red-50 border-red-200 text-red-700";
      case 5: return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };
  
  const handleEmergencyCall = () => {
    const confirmCall = window.confirm("Сіз жедел жәрдемге 103 нөміріне қоңырау шалуды жоспарлап отырсыз. Сіз сенімдісіз бе?");
    if (confirmCall) {
      window.location.href = "tel:103";
    }
  };
  
  const clearChat = () => {
    const confirmClear = window.confirm("Сөйлесу тарихын тазалау керек пе?");
    if (confirmClear) {
      setMessages([
        {
          id: 1,
          text: "Сәлем! Мен сіздің жеке медициналық көмекшіңіз Densaulyq AI. Сізді не мазалайтынын сипаттаңыз, мен жеделдік дәрежесін анықтауға және әрі қарай не істеу керектігін көрсетуге көмектесемін.",
          sender: "ai",
          timestamp: new Date(),
          type: "welcome"
        },
      ]);
      setAnalysisResult(null);
      setEmergencyCheck(null);
      setFollowUpQuestions([]);
      setShowQuestions(false);
    }
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('kk-KZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleQuickTemplate = (template) => {
    setInputText(template.text);
    inputRef.current?.focus();
  };
  
  // Анимации
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };
  
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const symptomTemplates = [
    { text: "Басым ауырып, жүрегім айнауда", emoji: "🤢", color: "purple", icon: <FaHeadSideVirus /> },
    { text: "Температурам бар және жөтел", emoji: "🤧", color: "orange", icon: <FaThermometerHalf /> },
    { text: "Ішім ауырып тұр", emoji: "🤕", color: "red", icon: <GiMedicines /> },
    { text: "Басым айналуда", emoji: "🌀", color: "blue", icon: <GiBrain /> },
    { text: "Кеуде ауруы", emoji: "💔", color: "pink", icon: <FaHeartbeat /> },
    { text: "Теріде безеу", emoji: "🔴", color: "yellow", icon: <GiHealing /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Заголовок секциясы */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <FaRobot className="mr-3 text-emerald-600" />
                Densaulyq AI Көмекшісі
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Жасанды интеллект арқылы симптомдарды талдау. Денсаулығыңызға күтім жасаймыз.
              </p>
            </div>
            
            {/* Жедел әрекеттер */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearChat}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Сөйлесуді тазалау
              </button>
              
              <button
                onClick={() => window.location.href = "/video-conference"}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition flex items-center shadow-md hover:shadow-lg"
              >
                <FaVideo className="w-4 h-4 mr-2" />
                Бейнеконсультация
              </button>
            </div>
          </div>
          
          {/* Ақпараттық панель */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <GiBrain className="text-emerald-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Талдау дәлдігі</p>
                  <p className="font-semibold text-gray-800">94%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Жауап уақыты</p>
                  <p className="font-semibold text-gray-800">2 сек-тан аз</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <MdHealthAndSafety className="text-violet-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Расталған деректер</p>
                  <p className="font-semibold text-gray-800">Медициналық дерекқорлар</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Сол жақ баған - Ақпарат және жедел әрекеттер */}
          <div className="lg:col-span-1 space-y-6">

            {/* Жедел үлгілер */}
            <motion.div 
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Жедел үлгілер
              </h3>
              <p className="text-sm text-gray-600 mb-4">Симптомдарды жедел сипаттау үшін басыңыз</p>
              <div className="space-y-3">
                {symptomTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickTemplate(template)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-gradient-to-r from-${template.color}-50 to-${template.color}-100 border-${template.color}-200 text-gray-700`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <span className="text-xl">{template.emoji}</span>
                      </div>
                      <div>
                        <span className="font-medium block">{template.text}</span>
                        <span className="text-xs text-gray-500 mt-1">Басқа белгілерді қосыңыз</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Негізгі чат */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-200px)] flex flex-col border border-gray-200">
              {/* Чаттың тақырыбы */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/20">
                        <FaRobot className="text-white text-2xl" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-emerald-700"></div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Densaulyq AI</h2>
                      <p className="text-emerald-100 text-sm">Симптомдарды нақты уақыт режимінде талдайды</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                      <span className="w-2 h-2 bg-green-400 rounded-full inline-block mr-2"></span>
                      Онлайн
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Хабарламалар */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className={`mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}
                    >
                      <div className={`flex items-end ${message.sender === 'user' ? 'justify-end' : ''}`}>
                        {message.sender === 'ai' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                            <span className="text-white text-xs font-bold">AI</span>
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none shadow-lg'
                              : message.isEmergency
                              ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 text-gray-800 rounded-bl-none shadow-sm'
                              : message.isError
                              ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-none'
                              : 'bg-gradient-to-r from-gray-100 to-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <div className="whitespace-pre-line mb-2 leading-relaxed">{message.text}</div>
                          <div className={`text-xs ${message.sender === 'user' ? 'text-emerald-200' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center ml-3 shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="bg-gradient-to-r from-gray-100 to-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
                            </div>
                            <span className="text-gray-600 font-medium">Симптомдарды талдауда...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </div>
              
              {/* Нақтылау сұрақтары */}
              {showQuestions && followUpQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-200 p-4 bg-gradient-to-r from-emerald-50 to-teal-50"
                >
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Өтінеміз, нақтылаңыз:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {followUpQuestions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuickQuestion(question)}
                        className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition text-sm font-medium shadow-sm hover:shadow"
                      >
                        {question.text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Хабар енгізу */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleSendMessage()}
                      placeholder="Симптомдарыңызды егжей-тегжейлі сипаттаңыз... Мысалы: 'Бірінші күнінен бастап басым ауырып, жеңіл жүрек айну сезімі бар'"
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder-gray-400"
                      disabled={isAnalyzing}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={isAnalyzing || !inputText.trim()}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center ${
                      isAnalyzing || !inputText.trim()
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Талдауда...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Жіберу
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Деректеріңіз қорғалған және анонимді
                  </div>
                  <div>
                    Жіберу үшін <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border border-gray-300">Enter</kbd> пернесін басыңыз
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Талдау нәтижелері (бар болса) */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Симптомдарды талдау нәтижелері
              </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Жеделдік дәрежесі */}
              <div className={`border rounded-xl p-5 ${getUrgencyColor(analysisResult.urgencyLevel)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">Жеделдік</span>
                  <span className="text-2xl">{["🟢", "🟡", "🟠", "🔴", "🚨"][analysisResult.urgencyLevel - 1]}</span>
                </div>
                <p className="font-bold text-lg mb-2">{analysisResult.urgencyDescription}</p>
                <div className="w-full bg-white/50 rounded-full h-2 mt-3">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-current to-current"
                    style={{ width: `${analysisResult.urgencyLevel * 20}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Мамандар */}
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <FaStethoscope className="mr-2 text-emerald-600" />
                  Ұсынылатын мамандар
                </h4>
                <div className="space-y-3">
                  {analysisResult.recommendedSpecialists.slice(0, 3).map((specialist, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition group border border-emerald-100"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                          <MdLocalHospital className="text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-800">{specialist}</span>
                      </div>
                      <button
                        onClick={() => handleBookConsultation(specialist)}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-lg hover:from-emerald-600 hover:to-teal-600 transition opacity-100 group-hover:opacity-100 shadow-sm hover:shadow"
                      >
                        Жазылу
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Ұсыныстар */}
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <GiHealthNormal className="mr-2 text-emerald-600" />
                  Ұсыныстар
                </h4>
                <ul className="space-y-3">
                  {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition">
                      <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Келесі қадамдар */}
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Келесі қадамдар
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.href = "/video-conference"}
                    className="w-full p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition text-left flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaVideo className="w-5 h-5 mr-3" />
                    Бейнеконсультацияға жазылу
                  </button>
                  <button
                    onClick={clearChat}
                    className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-left flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Жаңа талдауды бастау
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MedicalAIAssistantPage;