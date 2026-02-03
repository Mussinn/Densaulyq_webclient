import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaUserMd, FaCommentMedical } from 'react-icons/fa';
import { GiStethoscope, GiHealthPotion } from 'react-icons/gi';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { token, user } = useSelector((state) => state.token);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Инициализация чата при первой загрузке
  useEffect(() => {
    const savedMessages = localStorage.getItem('densaulyq_chat_history');
    const initialMessages = savedMessages 
      ? JSON.parse(savedMessages)
      : [
          {
            id: 1,
            text: "👋 Сәлем! Мен сіздің жеке медициналық көмекшіңіз Densaulyq AI. Медициналық сұрақтарыңызға жауап беруге және симптомдарды талдауға көмектесемін. Қандай қиындықпен бетпе-бет келдіңіз?",
            sender: 'ai',
            timestamp: new Date(),
            type: 'welcome'
          }
        ];
    
    setMessages(initialMessages);
    
    if (user) {
      setUserInfo({
        name: `${user.firstName || 'Құрметті'} ${user.lastName || 'пайдаланушы'}`,
        role: user.roles?.includes('ROLE_DOCTOR') ? 'Дәрігер' : 'Науқас'
      });
    }
    
    // Проверяем, есть ли непрочитанные сообщения
    const unread = initialMessages.filter(msg => 
      msg.sender === 'ai' && !msg.read && msg.id > 1
    ).length;
    setUnreadCount(unread);
    
    // Автооткрытие при первом посещении
    const firstVisit = !localStorage.getItem('densaulyq_first_visit');
    if (firstVisit) {
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('densaulyq_first_visit', 'true');
      }, 2000);
    }
  }, [user]);
  
  // Сохраняем историю чата
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('densaulyq_chat_history', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (chatContainerRef.current && isOpen && !isMinimized) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);
  
  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen && inputRef.current && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);
  
  // Обработка отправки сообщения
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      read: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    setHasNewMessage(true);
    setUnreadCount(prev => prev + 1);
    
    try {
      // Имитация задержки для реалистичности
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Для демонстрации используем локальную логику
      const aiResponse = generateAIResponse(inputText);
      
      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        analysis: aiResponse.data,
        read: false
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('AI талдау қатесі:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "Кешіріңіз, техникалық қате орын алды. Дәрігермен тікелей байланысуға кеңес беремін.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
        read: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Локальная генерация ответа AI (для демо)
  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    let response = {};
    
    if (input.includes('температур') || input.includes('қыз')) {
      response = {
        text: "🌡️ **Температура туралы:**\n\nТемператураңызды өлшеңіз. 38°C-тан жоғары болса, парацетамол немесе ибупрофен алуға болады. Сұйықтықты көп ішіңіз.\n\n⚠️ Егер температура 3 күннен асса, дәрігерге көріну қажет.",
        data: { urgency: 2, recommendation: 'Температураны бақылау' }
      };
    } else if (input.includes('бас ауру') || input.includes('басым ауыр')) {
      response = {
        text: "🤕 **Бас ауруы туралы:**\n\nТыныш ортада демалыңыз. Күшті дыбыс пен жарықтан аулақ болыңыз.\n\n❗ Бастың қатты ауруы, құсу, аңғалдау белгілері болса, жедел жәрдемге хабарласыңыз.",
        data: { urgency: 2, recommendation: 'Тыныштық сақтау' }
      };
    } else if (input.includes('жөтел') || input.includes('төш')) {
      response = {
        text: "🤧 **Жөтел туралы:**\n\nБалмен шай ішіп көріңіз. Ыстық су буын тыныстаңыз.\n\n⚠️ Қан аралас жөтел болса, немесе 2 аптадан аса берсе, дәрігерге көрініңіз.",
        data: { urgency: 2, recommendation: 'Дәрігерге көріну' }
      };
    } else if (input.includes('дәрігер') || input.includes('консультация')) {
      response = {
        text: "👨‍⚕️ **Дәрігерге жазылу:**\n\nТөмендегі батырманы басу арқылы бейнеконсультацияға жазыла аласыз. Дәрігер сізбен 15-30 минут ішінде байланысады.\n\n✅ Қазір жазылу үшін түймені басыңыз.",
        data: { urgency: 3, recommendation: 'Бейнеконсультация' }
      };
    } else {
      response = {
        text: "🤖 **Жалпы кеңес:**\n\nСимптомдарыңызды толығырақ сипаттап берсеңіз, нақтырақ кеңес бере аламын.\n\n💡 Аурудың себебін анықтау үшін дәрігердің тікелей консультациясы қажет болуы мүмкін.",
        data: { urgency: 1, recommendation: 'Симптомдарды толығырақ сипаттау' }
      };
    }
    
    return response;
  };
  
  // Быстрые шаблоны
  const quickTemplates = [
    { text: "🌡️ Температурам бар", emoji: "🌡️", color: "red" },
    { text: "🤕 Бас ауырып тұр", emoji: "🤕", color: "purple" },
    { text: "🤧 Жөтел басталды", emoji: "🤧", color: "blue" },
    { text: "👨‍⚕️ Дәрігер керек", emoji: "👨‍⚕️", color: "green" }
  ];
  
  // Быстрые действия
  const quickActions = [
    { 
      text: "🎥 Бейнеконсультация", 
      action: () => window.open('/video-conference', '_blank'),
      color: 'bg-gradient-to-r from-blue-500 to-sky-500',
      icon: <FaCommentMedical className="mr-1" />
    },
    { 
      text: "📋 Диагноз қарау", 
      action: () => window.open('/diagnosis/view', '_blank'),
      color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: <GiStethoscope className="mr-1" />
    },
    { 
      text: "🚑 103 - Жедел", 
      action: () => {
        if (window.confirm("103 - Жедел жәрдемге қоңырау шалу керек пе?")) {
          window.open('tel:103');
        }
      },
      color: 'bg-gradient-to-r from-red-500 to-orange-500',
      icon: <span className="mr-1">🚑</span>,
      emergency: true
    }
  ];
  
  // Анимации
  const chatVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };
  
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };
  
  const handleQuickTemplate = (template) => {
    setInputText(template.text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setHasNewMessage(false);
      setUnreadCount(0);
      
      // Помечаем все сообщения как прочитанные при открытии
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    }
  };
  
  const minimizeChat = () => {
    setIsMinimized(true);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearChat = () => {
    if (window.confirm("Сөйлесу тарихын тазалау керек пе?")) {
      const welcomeMessage = {
        id: 1,
        text: "👋 Сәлем! Мен сіздің жеке медициналық көмекшіңіз Densaulyq AI. Медициналық сұрақтарыңызға жауап беруге және симптомдарды талдауға көмектесемін.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome',
        read: true
      };
      
      setMessages([welcomeMessage]);
      localStorage.setItem('densaulyq_chat_history', JSON.stringify([welcomeMessage]));
    }
  };
  
  // Форматирование времени
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('kk-KZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <>
      {/* Основная плавающая кнопка - ВСЕГДА ВИДНА */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: 0.5
        }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={toggleChat}
          className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-all duration-300 group"
          aria-label="AI медициналық көмекші"
        >
          <div className="relative">
            <FaRobot className="text-white text-2xl" />
            
            {/* Счетчик непрочитанных */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 min-w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 border-2 border-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </div>
          
          {/* Анимация пульсации */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          />
          
          {/* Тултип при наведении */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            <div className="font-semibold">AI Көмекші</div>
            <div className="text-xs text-gray-300">Медициналық кеңес</div>
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </motion.button>
      </motion.div>

      {/* Чат окно */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50"
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ 
              position: 'fixed',
              bottom: '6rem',
              right: '1.5rem'
            }}
          >
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 ${
              isMinimized ? 'w-72' : 'w-80 sm:w-96'
            } transition-all duration-300 ${isMinimized ? 'h-16' : 'max-h-[500px]'}`}>
              
              {/* Заголовок чата */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <FaRobot className="text-white" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">Densaulyq AI</h3>
                      <p className="text-emerald-100 text-xs">
                        {isMinimized ? 'Чат жинақталған' : 'Медициналық көмекші'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={clearChat}
                      className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-xs"
                      aria-label="Тарихты тазалау"
                      title="Тарихты тазалау"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={minimizeChat}
                      className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
                      aria-label={isMinimized ? "Чатты кеңейту" : "Чатты жинау"}
                      title={isMinimized ? "Кеңейту" : "Жинау"}
                    >
                      {isMinimized ? '↗' : '↘'}
                    </button>
                    <button
                      onClick={toggleChat}
                      className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
                      aria-label="Чатты жабу"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Если чат свернут */}
              {isMinimized ? (
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 transition border-t border-gray-100"
                  onClick={() => setIsMinimized(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                        <GiStethoscope className="text-emerald-600 text-xs" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">AI көмекші</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {messages.length > 0 ? 
                        `${messages.length} хабар` : '...'}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Область сообщений */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 p-3 overflow-y-auto bg-gradient-to-b from-gray-50 to-white chat-scrollbar"
                    style={{ maxHeight: '300px', minHeight: '200px' }}
                  >
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mb-2 ${message.sender === 'user' ? 'text-right' : ''}`}
                        >
                          <div className={`flex ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            {message.sender === 'ai' && (
                              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                <span className="text-white text-xs font-bold">AI</span>
                              </div>
                            )}
                            
                            <div
                              className={`max-w-[85%] rounded-xl p-2 sm:p-3 ${
                                message.sender === 'user'
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none'
                                  : message.isEmergency
                                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-gray-800 rounded-bl-none'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <div className="text-xs sm:text-sm whitespace-pre-line">{message.text}</div>
                              <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-emerald-200' : 'text-gray-500'}`}>
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                            
                            {message.sender === 'user' && (
                              <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                                <span className="text-white text-xs">S</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      {isProcessing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center space-x-2 p-2"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">AI</span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none p-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Быстрые шаблоны */}
                  <div className="px-3 pt-2 pb-2 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {quickTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickTemplate(template)}
                          className={`px-2 py-1 bg-${template.color}-50 hover:bg-${template.color}-100 border border-${template.color}-200 text-${template.color}-700 rounded-lg text-xs transition flex items-center`}
                        >
                          <span className="mr-1 text-xs">{template.emoji}</span>
                          <span className="truncate max-w-[70px]">{template.text.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Поле ввода */}
                    <div className="flex space-x-2 mb-2">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Симптомдарды жазыңыз..."
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder-gray-400"
                          disabled={isProcessing}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputText.trim() || isProcessing}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center ${
                            !inputText.trim() || isProcessing
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                          } transition`}
                          aria-label="Жіберу"
                        >
                          {isProcessing ? (
                            <FaSpinner className="w-3 h-3 animate-spin" />
                          ) : (
                            <FaPaperPlane className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Быстрые действия */}
                    <div className="flex flex-wrap gap-1">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`px-2 py-1.5 ${action.color} text-white rounded-lg text-xs transition flex items-center hover:shadow-md ${action.emergency ? 'animate-pulse' : ''}`}
                        >
                          {action.icon}
                          <span className="truncate max-w-[90px]">{action.text}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Информация о конфиденциальности */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      <p>✅ Деректеріңіз қорғалған</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Декоративный элемент */}
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatBot;