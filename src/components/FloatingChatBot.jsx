import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaVideo, FaExpand, FaCompress } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import aiDatabase from '../components/aiMedicalDatabase.json';

const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { token, user } = useSelector((state) => state.token);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Функция для определения времени суток
  function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return aiDatabase.timeBasedGreetings.morning;
    if (hour < 17) return aiDatabase.timeBasedGreetings.afternoon;
    if (hour < 21) return aiDatabase.timeBasedGreetings.evening;
    return aiDatabase.timeBasedGreetings.night;
  }
  
  // Инициализация чата
  useEffect(() => {
    const savedMessages = localStorage.getItem('densaulyq_chat_history');
    const initialMessages = savedMessages 
      ? JSON.parse(savedMessages)
      : [
          {
            id: 1,
            text: getTimeBasedGreeting(),
            sender: 'ai',
            timestamp: new Date(),
            type: 'welcome',
            read: true
          }
        ];
    
    setMessages(initialMessages);
    
    const unread = initialMessages.filter(msg => 
      msg.sender === 'ai' && !msg.read && msg.id > 1
    ).length;
    setUnreadCount(unread);
  }, []);
  
  // Сохранение истории
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('densaulyq_chat_history', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Автопрокрутка
  useEffect(() => {
    if (chatContainerRef.current && isOpen && !isMinimized && messages.length > 1) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);
  
  // Фокус на поле ввода
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);
  
  // Функция анализа симптомов
  const analyzeSymptoms = (text) => {
    const lowerText = text.toLowerCase();
    let matchedSymptom = null;
    let maxMatches = 0;
    
    Object.entries(aiDatabase.symptomDatabase).forEach(([key, symptom]) => {
      let matches = 0;
      symptom.keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          matches++;
        }
      });
      
      if (matches > maxMatches) {
        maxMatches = matches;
        matchedSymptom = { ...symptom, key };
      }
    });
    
    return matchedSymptom;
  };
  
  // Проверка на экстренный случай
  const checkEmergency = (text) => {
    const lowerText = text.toLowerCase();
    
    for (const trigger of aiDatabase.emergencyTriggers.critical) {
      if (lowerText.includes(trigger)) {
        return {
          isEmergency: true,
          level: 'critical',
          reason: trigger,
          recommendation: '🚨 ДЕРЕУ 103 НЕМЕСЕ 112 ҚОҢЫРАУ ШАЛЫҢЫЗ!'
        };
      }
    }
    
    for (const trigger of aiDatabase.emergencyTriggers.high) {
      if (lowerText.includes(trigger)) {
        return {
          isEmergency: true,
          level: 'high',
          reason: trigger,
          recommendation: 'Дәрігерге тез арада жүгініңіз немесе 103-ке қоңырау шалыңыз!'
        };
      }
    }
    
    return { isEmergency: false };
  };
  
  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!inputText.trim() || isAnalyzing) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      read: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsAnalyzing(true);
    setShowQuestions(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const emergency = checkEmergency(currentInput);
      
      if (emergency.isEmergency) {
        const emergencyMessage = {
          id: messages.length + 2,
          text: `⚠️ НАЗАР АУДАРЫҢЫЗ! Қауіпті симптомдар: "${emergency.reason}".\n\n🚑 ${emergency.recommendation}\n\nДәрігерге дереу жүгініңіз!`,
          sender: 'ai',
          timestamp: new Date(),
          isEmergency: true,
          read: false
        };
        
        setMessages(prev => [...prev, emergencyMessage]);
        setUnreadCount(prev => prev + 1);
        
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        setIsAnalyzing(false);
        return;
      }
      
      const symptomMatch = analyzeSymptoms(currentInput);
      
      if (symptomMatch) {
        if (symptomMatch.isEmergency) {
          const emergencyMessage = {
            id: messages.length + 2,
            text: `⚠️ НАЗАР АУДАРЫҢЫЗ! Бұл өте жедел жағдай!\n\n🚑 ${symptomMatch.recommendations[0]}\n\nДереу медициналық көмек алыңыз!`,
            sender: 'ai',
            timestamp: new Date(),
            isEmergency: true,
            read: false
          };
          
          setMessages(prev => [...prev, emergencyMessage]);
          setUnreadCount(prev => prev + 1);
          
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          
          setIsAnalyzing(false);
          return;
        }
        
        setAnalysisResult(symptomMatch);
        setFollowUpQuestions(symptomMatch.followUpQuestions || []);
        
        const urgencyEmoji = ["🟢", "🟡", "🟠", "🔴", "🚨"][symptomMatch.urgencyLevel - 1];
        
        let aiResponse = `🔍 **Талдау аяқталды**\n\n`;
        aiResponse += `${urgencyEmoji} **Жеделдік:** ${symptomMatch.urgencyDescription}\n\n`;
        
        if (symptomMatch.redFlags && symptomMatch.redFlags.length > 0) {
          aiResponse += `⚠️ **Уайымдататын белгілер:**\n${symptomMatch.redFlags.map(f => `• ${f}`).join('\n')}\n\n`;
        }
        
        aiResponse += `🏥 **Мүмкін мән-жайлар:**\n${symptomMatch.possibleConditions.slice(0, 2).map(c => `• ${c}`).join('\n')}\n\n`;
        aiResponse += `👨‍⚕️ **Ұсынылатын мамандар:**\n${symptomMatch.recommendedSpecialists.slice(0, 2).map(s => `• ${s}`).join('\n')}\n\n`;
        aiResponse += `💡 **Ұсыныстар:**\n${symptomMatch.recommendations.slice(0, 2).map(r => `• ${r}`).join('\n')}`;
        
        const aiMessage = {
          id: messages.length + 2,
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          analysis: symptomMatch,
          read: false
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setUnreadCount(prev => prev + 1);
        
        setTimeout(() => {
          setShowQuestions(true);
        }, 1000);
        
      } else {
        const aiMessage = {
          id: messages.length + 2,
          text: "Симптомдарды нақтырақ сипаттаңыз:\n\n• Қай жерде ауырып тұр?\n• Қашан басталды?\n• Температураңыз бар ма?\n\nНемесе жедел үлгілерді қолданыңыз.",
          sender: 'ai',
          timestamp: new Date(),
          read: false
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setUnreadCount(prev => prev + 1);
      }
      
    } catch (error) {
      console.error("Талдау қатесі:", error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "Техникалық қате. Қайта көріңіз немесе дәрігерге жүгініңіз.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
        read: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setUnreadCount(prev => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleQuickQuestion = (question) => {
    setInputText(question.text);
    setShowQuestions(false);
    setTimeout(() => handleSendMessage(), 300);
  };
  
  const handleQuickTemplate = (template) => {
    setInputText(template.text);
    inputRef.current?.focus();
  };
  
  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setUnreadCount(0);
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    }
  };
  
  const clearChat = () => {
    if (window.confirm("Сөйлесу тарихын тазалау керек пе?")) {
      const welcomeMessage = {
        id: 1,
        text: getTimeBasedGreeting(),
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome',
        read: true
      };
      
      setMessages([welcomeMessage]);
      setAnalysisResult(null);
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
  
  const quickTemplates = [
    { text: "Басым ауырып, жүрегім айнауда", emoji: "🤢", color: "from-purple-500 to-pink-500" },
    { text: "Температурам бар және жөтел", emoji: "🤧", color: "from-blue-500 to-cyan-500" },
    { text: "Ішім ауырып тұр", emoji: "🤕", color: "from-orange-500 to-red-500" },
    { text: "Кеуде ауруы", emoji: "💔", color: "from-red-500 to-pink-500" },
  ];
  
  // Анимации
  const chatVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <>
      {/* Плавающая кнопка - ОБНОВЛЕННЫЙ ДИЗАЙН */}
      <motion.div
        className="fixed bottom-8 right-8 z-[9999]"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.3
        }}
      >
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          onClick={toggleChat}
          className="relative w-[72px] h-[72px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[24px] shadow-2xl flex items-center justify-center transition-all duration-300 group overflow-hidden"
          style={{
            boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          }}
          aria-label="AI көмекші"
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            animate={{
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Icon */}
          <motion.div
            animate={{
              rotate: isOpen ? 0 : [0, -10, 10, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: isOpen ? 0 : Infinity,
              repeatDelay: 3
            }}
          >
            <FaRobot className="text-white text-3xl relative z-10 drop-shadow-lg" />
          </motion.div>
          
          {/* Badge непрочитанных */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 min-w-7 h-7 bg-gradient-to-br from-red-500 to-pink-600 text-white text-sm font-bold rounded-full flex items-center justify-center px-2 border-3 border-white shadow-xl"
              style={{
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
          
          {/* Pulse эффект */}
          <motion.div
            className="absolute inset-0 rounded-[24px] bg-emerald-400"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-5 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 min-w-[200px]">
              <div className="font-bold text-base mb-1 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Densaulyq AI
              </div>
              <div className="text-xs text-gray-300">Симптомдарды талдау</div>
              <div className="text-xs text-emerald-400 mt-1">Басу үшін басыңыз</div>
              
              {/* Triangle */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-gray-900/95 border-r border-t border-white/10 rotate-45"></div>
              </div>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Чат окно - ПОЛНОСТЬЮ ОБНОВЛЕННЫЙ ДИЗАЙН */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-8 right-8 z-[9998]"
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              marginBottom: '88px' // Отступ от кнопки
            }}
          >
            <div 
              className={`backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 transition-all duration-300 ${
                isMinimized ? 'w-[380px] h-[72px]' : 'w-[440px] h-[680px]'
              }`}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
            >
              
              {/* Заголовок - НОВЫЙ ДИЗАЙН */}
              <div className="relative overflow-hidden">
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                />
                
                {/* Content */}
                <div className="relative p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                          <FaRobot className="text-white text-xl" />
                          <motion.div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [1, 0.7, 1]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg tracking-tight">Densaulyq AI</h3>
                        <p className="text-emerald-100 text-sm flex items-center mt-0.5">
                          <motion.span 
                            className="w-2 h-2 bg-green-300 rounded-full inline-block mr-2 shadow-lg shadow-green-400/50"
                            animate={{
                              scale: [1, 1.3, 1]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                          {isMinimized ? 'Жинақталған' : 'Симптомдарды талдау'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearChat}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
                        title="Тазалау"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
                        title={isMinimized ? "Кеңейту" : "Жинау"}
                      >
                        {isMinimized ? <FaExpand className="w-4 h-4" /> : <FaCompress className="w-4 h-4" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleChat}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
                        title="Жабу"
                      >
                        <FaTimes className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isMinimized && (
                <>
                  {/* Сообщения - УЛУЧШЕННЫЙ ДИЗАЙН */}
                  <div 
                    ref={chatContainerRef}
                    className="h-[420px] overflow-y-auto p-5 space-y-4"
                    style={{
                      background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#10b981 #f3f4f6'
                    }}
                  >
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                        >
                          {message.sender === 'ai' && (
                            <motion.div 
                              className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 200 }}
                            >
                              <span className="text-white text-xs font-bold">AI</span>
                            </motion.div>
                          )}
                          
                          <div
                            className={`max-w-[80%] rounded-2xl p-4 ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : message.isEmergency
                                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-400 text-gray-800 shadow-lg shadow-red-500/20'
                                : 'bg-white border-2 border-gray-100 text-gray-800 shadow-lg'
                            }`}
                            style={{
                              borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
                            }}
                          >
                            <div className="text-sm leading-relaxed whitespace-pre-line">{message.text}</div>
                            <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                          
                          {message.sender === 'user' && (
                            <motion.div 
                              className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                              initial={{ scale: 0, rotate: 180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 200 }}
                            >
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                      
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-end gap-2"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">AI</span>
                          </div>
                          <div className="bg-white border-2 border-gray-100 rounded-2xl rounded-bl-md p-4 shadow-lg">
                            <div className="flex items-center space-x-3">
                              <div className="flex space-x-1.5">
                                <motion.div 
                                  className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div 
                                  className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                                />
                                <motion.div 
                                  className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Талдауда...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Уточняющие вопросы - ОБНОВЛЕННЫЙ ДИЗАЙН */}
                  <AnimatePresence>
                    {showQuestions && followUpQuestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t-2 border-gray-100 px-5 py-4 bg-gradient-to-br from-emerald-50 to-teal-50"
                      >
                        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                          <span className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          Нақтылаңыз:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {followUpQuestions.slice(0, 2).map((question) => (
                            <motion.button
                              key={question.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleQuickQuestion(question)}
                              className="px-4 py-2.5 bg-white border-2 border-emerald-300 text-emerald-700 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                            >
                              {question.text}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Панель ввода - НОВЫЙ ДИЗАЙН */}
                  <div className="border-t-2 border-gray-100 p-5 bg-white">
                    {/* Быстрые шаблоны - ОБНОВЛЕННЫЕ */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {quickTemplates.map((template, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickTemplate(template)}
                          className={`flex-shrink-0 px-4 py-2.5 bg-gradient-to-r ${template.color} text-white rounded-xl text-xs font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
                        >
                          <span className="text-base">{template.emoji}</span>
                          <span className="truncate max-w-[140px]">{template.text.split(',')[0]}</span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Поле ввода */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleSendMessage()}
                          placeholder="Симптомдарды жазыңыз..."
                          className="w-full px-5 py-3.5 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm placeholder-gray-400 bg-gray-50 focus:bg-white shadow-sm"
                          disabled={isAnalyzing}
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={isAnalyzing || !inputText.trim()}
                        className={`p-4 rounded-2xl transition-all flex items-center justify-center shadow-lg ${
                          isAnalyzing || !inputText.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30'
                        }`}
                      >
                        <FaPaperPlane className="w-5 h-5" />
                      </motion.button>
                    </div>
                    
                    {/* Быстрые действия */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/meet'}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                      >
                        <FaVideo className="w-4 h-4" />
                        Бейне консультация
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (window.confirm("103 - Жедел жәрдемге қоңырау шалу керек пе?")) {
                            window.location.href = 'tel:103';
                          }
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          🚑
                        </motion.span>
                        Жедел 103
                      </motion.button>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Қорғалған және құпия</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
        }
      `}</style>
    </>
  );
};

export default FloatingChatBot;