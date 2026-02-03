import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { useSelector } from "react-redux";
import { FaVideo, FaCopy, FaCalendarAlt, FaUsers, FaUserMd, FaShieldAlt } from "react-icons/fa";
import { GiNetworkBars, GiVideoConference } from "react-icons/gi";

const VideoConferencePage = () => {
  const [meetings, setMeetings] = useState([]);
  const [newMeeting, setNewMeeting] = useState({
    topic: "",
    description: "",
    participants: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { token, user: userData } = useSelector((state) => state.token);

  // Получение списка встреч
  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    // Mock данные для демонстрации
    setMeetings([
      {
        id: 1,
        topic: "Науқас Петров туралы консилиум",
        meetingUrl: "https://meet.jit.si/patient-petrov-a1b2c3d4",
        roomId: "patient-petrov-a1b2c3d4",
        date: "2024-01-15T10:00:00",
        participants: ["dr.smith@med.com", "dr.jones@med.com"],
        doctor: "Дәрігер Иванова А.С.",
        status: "active"
      },
      {
        id: 2,
        topic: "Емдеуді талқылау",
        meetingUrl: "https://meet.jit.si/treatment-discuss-e5f6g7h8",
        roomId: "treatment-discuss-e5f6g7h8",
        date: "2024-01-16T14:30:00",
        participants: ["admin@densaulyq.kz"],
        doctor: "Дәрігер Калиев М.Т.",
        status: "upcoming"
      },
    ]);
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = newMeeting.topic 
        ? { topic: newMeeting.topic } 
        : {};
      
      const response = await api.get("/create-meeting", { params });
      const meetingData = response.data;

      // Сохраняем встречу в состояние
      const newMeetingObj = {
        id: Date.now(),
        topic: newMeeting.topic || `${new Date().toLocaleDateString('kk-KZ')} кездесуі`,
        meetingUrl: meetingData.meetingUrl,
        roomId: meetingData.roomId,
        date: new Date().toISOString(),
        participants: newMeeting.participants 
          ? newMeeting.participants.split(',').map(email => email.trim())
          : [],
        description: newMeeting.description,
        doctor: userData ? `${userData.firstName} ${userData.lastName}` : "Дәрігер",
        status: "active"
      };

      setMeetings([newMeetingObj, ...meetings]);
      setSuccess(`Кездесу құрылды! Сілтеме: ${meetingData.meetingUrl}`);
      
      // Сбрасываем форму
      setNewMeeting({
        topic: "",
        description: "",
        participants: "",
      });

    } catch (err) {
      console.error("Кездесу құру қатесі:", err);
      setError("Кездесу құру мүмкін болмады. Серверге қосылуды тексеріңіз.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("Сілтеме буферге көшірілді!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const joinMeeting = (meetingUrl) => {
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('kk-KZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Анимации
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const bounceVariants = {
    hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-4 md:p-6"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="max-w-7xl mx-auto">
        {/* Заголовок секциясы */}
        <motion.div 
          className="mb-8"
          variants={cardVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <GiVideoConference className="mr-3 text-emerald-600" />
                Бейнеконсультация
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Дәрігерлермен қауіпсіз бейнеконсультация. Деректеріңіз шифрланған және қорғалған.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                <GiNetworkBars className="inline mr-2" />
                Желі: қолжетімді
              </div>
            </div>
          </div>

          {/* Статистика карточкалары */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FaVideo className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Бүгінгі кездесулер</p>
                  <p className="text-2xl font-bold text-gray-800">2</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <FaCalendarAlt className="text-emerald-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Жоспарланған</p>
                  <p className="text-2xl font-bold text-gray-800">5</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <FaUsers className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Қатысушылар</p>
                  <p className="text-2xl font-bold text-gray-800">8</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <FaUserMd className="text-amber-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дәрігерлер</p>
                  <p className="text-2xl font-bold text-gray-800">3</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Сол жақ баған - Жаңа кездесу құру */}
          <div className="lg:col-span-2">
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6"
              variants={cardVariants}
            >
              {/* Жаңа кездесу құру формасы */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Жаңа бейнеконсультация құру
                </h2>

                <form onSubmit={handleCreateMeeting} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaVideo className="mr-2 text-gray-400" />
                      Кездесу тақырыбы
                    </label>
                    <input
                      type="text"
                      value={newMeeting.topic}
                      onChange={(e) => setNewMeeting({...newMeeting, topic: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Мысалы: Науқас Иванов туралы консилиум"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Сипаттама (міндетті емес)
                    </label>
                    <textarea
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      rows="3"
                      placeholder="Кездесу мәселелері, талқыланатын сұрақтар..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaUsers className="mr-2 text-gray-400" />
                      Қатысушылар (email үтірмен)
                    </label>
                    <input
                      type="text"
                      value={newMeeting.participants}
                      onChange={(e) => setNewMeeting({...newMeeting, participants: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="dariyer@densaulyq.kz, науқас@gmail.com"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Барлық қатысушыларға кездесу сілтемесі жіберіледі
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                      <div className="flex items-center mb-2">
                        <FaShieldAlt className="text-emerald-500 mr-2" />
                        <span>Jitsi Meet шифрлауымен қорғалған</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Браузерден тікелей қосылу</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-md hover:shadow-lg ${
                        loading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Құрылуда...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Кездесуді құру
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Хабарламалар */}
              <div className="p-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Кездесулер тізімі */}
            <motion.div variants={cardVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl flex items-center justify-center mr-3">
                    <FaCalendarAlt className="text-white" />
                  </div>
                  Жоспарланған кездесулер
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                  {meetings.length} кездесу
                </span>
              </div>

              {meetings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaVideo className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 mb-2">Әзірге кездесулер жоқ</p>
                  <p className="text-sm text-gray-400">Жоғарыдағы форма арқылы бірінші кездесуді құрыңыз</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {meetings.map((meeting) => (
                    <motion.div 
                      key={meeting.id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      variants={cardVariants}
                      whileHover="hover"
                    >
                      <motion.div variants={bounceVariants}>
                        <div className="p-6">
                          {/* Кездесу атауы және статусы */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 pr-4">
                                {meeting.topic}
                              </h3>
                              {meeting.doctor && (
                                <p className="text-sm text-gray-600 mt-1 flex items-center">
                                  <FaUserMd className="mr-2 text-gray-400" />
                                  {meeting.doctor}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              meeting.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {meeting.status === 'active' ? 'Белсенді' : 'Жоспарланған'}
                            </span>
                          </div>

                          {/* Сипаттама */}
                          {meeting.description && (
                            <p className="text-gray-600 mb-5 text-sm line-clamp-2">
                              {meeting.description}
                            </p>
                          )}

                          {/* Кездесу мәліметтері */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-gray-500">
                              <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(meeting.date)}
                            </div>
                            
                            {meeting.participants.length > 0 && (
                              <div className="flex items-center text-gray-500">
                                <FaUsers className="w-4 h-4 mr-3 text-gray-400" />
                                <span>{meeting.participants.length} қатысушы</span>
                              </div>
                            )}
                          </div>

                          {/* Әрекет түймелері */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => joinMeeting(meeting.meetingUrl)}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition flex items-center justify-center shadow-md hover:shadow-lg"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Қосылу
                            </button>

                            <button
                              onClick={() => copyToClipboard(meeting.meetingUrl)}
                              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center"
                            >
                              <FaCopy className="mr-2" />
                              Көшіру
                            </button>
                          </div>

                          {/* Сілтеме */}
                          <div className="mt-5 pt-5 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Кездесу сілтемесі:</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-all">
                              {meeting.meetingUrl}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Оң жақ баған - Ақпарат және нұсқаулар */}
          <div className="space-y-6">
            {/* Жедел кездесу */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Жедел кездесу
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Науқас пен дәрігерді тез байланыстыру үшін жедел кездесуді қолданыңыз
              </p>
              <button
                onClick={() => {
                  setNewMeeting({
                    topic: `Жедел консультация ${new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })}`,
                    description: "Науқас пен дәрігердің жедел байланысы",
                    participants: "",
                  });
                  setTimeout(() => {
                    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition shadow-md hover:shadow-lg"
              >
                Жедел кездесуді бастау
              </button>
            </motion.div>

            {/* Инструкция */}
            <motion.div 
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-sky-400 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Бейнеконсультацияны қалай пайдалануға болады?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Кездесуді құрыңыз</p>
                    <p className="text-sm text-gray-600">Тақырып пен сипаттаманы енгізіп, қауіпсіз бөлмені құрыңыз</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Сілтемені жіберіңіз</p>
                    <p className="text-sm text-gray-600">Кездесу сілтемесін науқастарға немесе әріптестерге жіберіңіз</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Консультация жасаңыз</p>
                    <p className="text-sm text-gray-600">Браузер арқылы кездесуге қосылыңыз және консультация жасаңыз</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Қауіпсіздік ақпараты */}
            <motion.div 
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg flex items-center justify-center mr-3">
                  <FaShieldAlt className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Қауіпсіздік кепілдігі</h3>
                  <p className="text-sm text-gray-500">Деректеріңіз қорғалған</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Сквозной шифрлау</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>HIPAA стандарттарына сәйкес</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Деректер Қазақстанда сақталады</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  Барлық бейнеконсультациялар заңды түрде қорғалған және деректердің құпиялылығы қамтамасыз етілген.
                </p>
              </div>
            </motion.div>

            {/* Жедел жәрдем */}
            <motion.div 
              variants={cardVariants}
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200 shadow-sm"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🚑</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">Жедел жәрдем</h3>
                  <p className="text-sm text-red-600">Өмірге қауіп төнген жағдайда</p>
                </div>
              </div>
              
              <button
                onClick={() => window.location.href = "tel:103"}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-md hover:shadow-lg mb-3"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  103 - Жедел жәрдем
                </div>
              </button>
              
              <div className="text-center">
                <p className="text-xs text-gray-600">Немесе тел: <strong>112</strong> - Барлық қызметтер</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoConferencePage;