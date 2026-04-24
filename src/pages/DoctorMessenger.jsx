import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
  FaComments,
  FaPaperPlane,
  FaUser,
  FaSearch,
  FaTimes,
  FaPhone,
  FaVideo,
  FaInfoCircle,
  FaArrowLeft,
  FaPaperclip,
  FaSmile,
  FaImage,
  FaFile,
  FaCheck,
  FaCheckDouble,
  FaRobot,
  FaStethoscope,
  FaUserMd,
  FaUserInjured,
  FaDownload,
  FaSpinner,
  FaReply,
  FaCheckCircle,
  FaRegClock,
  FaEllipsisV,
  FaCopy,
  FaTrash,
  FaShare,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { GiBrain, GiHealthNormal, GiMedicines } from 'react-icons/gi';
import { MdHealthAndSafety, MdLocalHospital, MdMoreVert } from 'react-icons/md';
import { format } from 'date-fns';
import { kk } from 'date-fns/locale';

const DensTalk = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showChatList, setShowChatList] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageMenuRef = useRef(null);

  const { token } = useSelector((state) => state.token);
  // ID берётся из state.token.user.id (см. tokenSlice — selectUserId)
  const currentUserId = useSelector((state) => state.token.user?.id || state.token.user?.userId);
  const currentUser = useSelector((state) => state.token.user);

  // ========== ФАЙЛ ФУНКЦИЯЛАРЫ ==========

  const API_BASE_URL = 'http://localhost:8080';

  const getFileNameFromUrl = (url) => {
    if (!url) return 'Файл';
    const parts = url.split('/');
    let filename = parts[parts.length - 1] || 'Файл';
    if (filename.includes('?')) filename = filename.split('?')[0];
    return filename;
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
    return `${API_BASE_URL}/${url}`;
  };

  const handleDownloadFile = async (url, filename) => {
    if (!url) { alert('Файл URL-і табылмады'); return; }
    const fullUrl = getFullUrl(url);
    try {
      const response = await fetch(fullUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Жүктеу қатесі:', err);
      window.open(fullUrl, '_blank');
    }
  };

  const handleViewImage = (url) => {
    if (!url) return;
    const fullUrl = getFullUrl(url);
    const viewUrl = fullUrl.replace('/files/', '/files/view/');
    window.open(viewUrl, '_blank');
  };

  const getFileIcon = (filename, mimeType) => {
    if (mimeType?.startsWith('image/')) return <FaImage className="text-purple-500" />;
    if (mimeType === 'application/pdf') return <FaFile className="text-red-500" />;
    if (mimeType?.includes('word')) return <FaFile className="text-blue-500" />;
    if (mimeType?.includes('excel')) return <FaFile className="text-green-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ========== УТИЛИТЫ ==========

  const getInitials = (name, fallback = 'Қ') => {
    if (!name || name === 'Қолданушы' || name === 'Unknown') return fallback;
    const cleanName = name.trim();
    if (cleanName.length > 0) {
      const firstChar = cleanName.charAt(0).toUpperCase();
      if (/[A-Za-zА-Яа-я]/.test(firstChar)) return firstChar;
    }
    return fallback;
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Қолданушы';
    if (user.firstName) {
      if (user.lastName) return `${user.firstName} ${user.lastName}`;
      return user.firstName;
    }
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Қолданушы';
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const messageVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } }
  };

  // ========== API ВЫЗОВЫ ==========

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/chats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedChats = (response.data || []).sort((a, b) =>
        new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
      );
      setChats(sortedChats);
      if (activeChat) {
        const updatedActiveChat = sortedChats.find(chat => chat.id === activeChat.id);
        if (updatedActiveChat) setActiveChat(updatedActiveChat);
      }
    } catch (error) {
      console.error('Чаттарды жүктеу қатесі:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/v1/users/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = response.data
        .filter(user => user.userId !== currentUserId)
        .map(user => ({
          id: user.userId,
          name: getUserDisplayName(user),
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || '',
          username: user.username || '',
          avatarColor: getAvatarColor(user.userId),
          online: user.online || false,
          roles: user.roles || [],
          specialty: user.doctor?.specialty || user.specialty || '',
          initials: getInitials(user.firstName || user.username || user.email)
        }));
      setUsersList(usersData);
    } catch (error) {
      console.error('Қолданушыларды жүктеу қатесі:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const response = await api.get(`/api/v1/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, offset: 0 }
      });
      setMessages(response.data || []);
      await markAsRead(chatId);
    } catch (error) {
      console.error('Хабарламаларды жүктеу қатесі:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      await api.post(`/api/v1/chats/${chatId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Оқылған деп белгілеу қатесі:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!activeChat) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('content', newMessage.trim());
      formData.append('chatId', activeChat.id);
      if (replyTo) formData.append('replyToId', replyTo.id);
      attachments.forEach((file) => formData.append('attachments', file));
      const response = await api.post('/api/v1/messages', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newMsg = response.data;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setAttachments([]);
      setReplyTo(null);
      setChats(prev => prev.map(chat =>
        chat.id === activeChat.id
          ? { ...chat, lastMessage: newMsg.content, lastMessageAt: new Date().toISOString() }
          : chat
      ));
      scrollToBottom();
    } catch (error) {
      console.error('Хабарлама жіберу қатесі:', error);
      alert('Хабарлама жіберу мүмкін болмады');
    } finally {
      setSending(false);
    }
  };

  const createNewChat = async () => {
    if (!selectedUserId) { alert('Қолданушыны таңдаңыз'); return; }
    try {
      const response = await api.post('/api/v1/chats', { participantId: selectedUserId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setShowNewChatModal(false);
      setSelectedUserId('');
      fetchMessages(newChat.id);
      if (window.innerWidth < 768) setShowChatList(false);
    } catch (error) {
      console.error('Чат құру қатесі:', error);
      alert('Чат құру мүмкін болмады');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) alert('Кейбір файлдар 10MB шектеуінен асады');
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAvatarColor = (id) => {
    const colors = [
      'bg-gradient-to-br from-emerald-500 to-teal-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-purple-500 to-indigo-500',
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-orange-500 to-amber-500',
      'bg-gradient-to-br from-green-500 to-emerald-500'
    ];
    return colors[Math.abs((id || 0).toString().length) % colors.length];
  };

  const getUserRole = (roles) => {
    if (!roles || roles.length === 0) return 'Қолданушы';
    const roleNames = roles.map(r => r.name || r.roleName || '');
    if (roleNames.includes('ROLE_DOCTOR') || roleNames.includes('DOCTOR')) return 'Дәрігер';
    if (roleNames.includes('ROLE_PATIENT') || roleNames.includes('PATIENT')) return 'Пациент';
    if (roleNames.includes('ROLE_ADMIN') || roleNames.includes('ADMIN')) return 'Әкімші';
    return 'Қолданушы';
  };

  const getUserIcon = (roles) => {
    const roleNames = roles?.map(r => r.name || r.roleName || '') || [];
    if (roleNames.includes('ROLE_DOCTOR') || roleNames.includes('DOCTOR')) return <FaUserMd />;
    if (roleNames.includes('ROLE_PATIENT') || roleNames.includes('PATIENT')) return <FaUserInjured />;
    return <FaUser />;
  };

  const formatMessageTime = (dateString) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: kk });
    } catch { return '--:--'; }
  };

  const formatChatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return format(date, 'HH:mm', { locale: kk });
      if (diffDays === 1) return 'Кеше';
      if (diffDays < 7) return format(date, 'EEEE', { locale: kk });
      return format(date, 'dd.MM.yy', { locale: kk });
    } catch { return ''; }
  };

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    if (window.innerWidth < 768) setShowChatList(false);
  };

  const handleBackToChats = () => {
    setActiveChat(null);
    setShowChatList(true);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setShowMessageMenu(false);
  };

  const handleCopyMessage = (message) => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      alert('Хабарлама көшірілді');
    }
    setShowMessageMenu(false);
  };

  const handleStarMessage = (message) => {
    console.log('Маңызды деп белгілеу:', message.id);
    setShowMessageMenu(false);
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setSelectedMessage(message);
    setMessageMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMessageMenu(true);
  };

  const closeMessageMenu = () => {
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target)) closeMessageMenu();
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (chat.participant?.name || '').toLowerCase().includes(searchLower) ||
      (chat.lastMessage || '').toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    if (token) {
      fetchChats();
      fetchUsers();
      if (window.innerWidth < 768) setShowChatList(true);
    }
  }, [token]);

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat.id);
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchChats();
      if (activeChat) fetchMessages(activeChat.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, activeChat]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowChatList(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMessageStatusIcon = (message) => {
    const senderId = message.sender?.id ?? message.senderId;
    if (Number(senderId) !== Number(currentUserId)) return null;
    if (message.readAt) return <FaCheckDouble className="text-blue-400" title="Оқылды" />;
    if (message.deliveredAt) return <FaCheckDouble className="text-gray-300" title="Жеткізілді" />;
    if (message.sentAt) return <FaCheck className="text-gray-300" title="Жіберілді" />;
    return <FaRegClock className="text-gray-300" title="Күтуде" />;
  };

  const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = [];
    messages.forEach((msg, index) => {
      const prevMsg = messages[index - 1];
      // sender может быть объектом {id, ...} или плоским senderId
      const msgSenderId = msg.sender?.id ?? msg.senderId;
      const prevSenderId = prevMsg ? (prevMsg.sender?.id ?? prevMsg.senderId) : null;
      if (prevMsg && String(prevSenderId) === String(msgSenderId)) {
        currentGroup.push(msg);
      } else {
        if (currentGroup.length > 0) grouped.push(currentGroup);
        currentGroup = [msg];
      }
    });
    if (currentGroup.length > 0) grouped.push(currentGroup);
    return grouped;
  };

  const messageGroups = groupMessages(messages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Тақырып */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <FaComments className="mr-3 text-emerald-600" />
                DensTalk
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Пациенттер мен әріптестермен қарым-қатынас жасауға арналған қауіпсіз мессенджер
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow-sm border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-700">{chats.length} чат</span>
              </div>
              <div className="bg-white rounded-xl px-4 py-2 flex items-center shadow-sm border border-gray-200">
                <MdHealthAndSafety className="text-emerald-600 mr-2" />
                <span className="text-sm text-gray-700">E2E шифрлау</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <FaRobot className="text-emerald-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI көмекші</p>
                  <p className="font-semibold text-gray-800">DensAI интеграция</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Қауіпсіздік</p>
                  <p className="font-semibold text-gray-800">Сквоздық шифрлау</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <GiBrain className="text-violet-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ақылды іздеу</p>
                  <p className="font-semibold text-gray-800">Хабарламалар мен файлдар бойынша</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-280px)] md:h-[calc(100vh-300px)] border border-gray-200">
          <div className="flex h-full">

            {/* Чаттар тізімі */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={`
                ${showChatList ? 'flex' : 'hidden'}
                md:flex w-full md:w-96
                border-r border-gray-200
                flex-col h-full bg-gradient-to-b from-white to-gray-50
              `}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-white flex items-center">
                    <FaComments className="mr-2" />
                    Менің чаттарым
                  </h2>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
                    title="Жаңа чат"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
                  <input
                    type="text"
                    placeholder="Чаттарды іздеу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <FaComments className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">Чаттар жоқ</h3>
                    <p className="text-gray-500 text-sm mb-4">Сөйлесуді бастаңыз</p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                      Чат құру
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredChats.map(chat => (
                      <motion.div
                        key={chat.id}
                        whileHover={{ scale: 0.99, backgroundColor: '#f9fafb' }}
                        onClick={() => handleChatSelect(chat)}
                        className={`p-4 cursor-pointer transition-all ${
                          activeChat?.id === chat.id
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 shadow-inner'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAvatarColor(chat.participant?.id)} text-white font-medium text-lg shadow-md`}>
                              {getInitials(chat.participant?.name || chat.participant?.firstName)}
                            </div>
                            {chat.participant?.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-gray-900 truncate flex items-center">
                                {getUserIcon(chat.participant?.roles)}
                                <span className="ml-1">{chat.participant?.name || 'Қолданушы'}</span>
                              </h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatChatDate(chat.lastMessageAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {chat.lastMessage || 'Хабарламалар жоқ'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 truncate flex items-center">
                                <FaStethoscope className="mr-1 text-emerald-600" size={10} />
                                {chat.participant?.specialty || chat.participant?.email || 'Қолданушы'}
                              </span>
                              {chat.unreadCount > 0 && (
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs px-2 py-1 rounded-full min-w-[1.5rem] text-center font-medium shadow-sm">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Хабарламалар аймағы */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={`
                ${!showChatList ? 'flex' : 'hidden'}
                md:flex flex-1
                flex-col h-full bg-gradient-to-b from-gray-50 to-white
              `}
            >
              {activeChat ? (
                <>
                  {/* Чат хедері */}
                  <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleBackToChats}
                        className="md:hidden p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                      >
                        <FaArrowLeft className="text-lg" />
                      </button>
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAvatarColor(activeChat.participant?.id)} text-white font-medium text-lg shadow-lg`}>
                          {getInitials(activeChat.participant?.name || activeChat.participant?.firstName)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base md:text-lg flex items-center">
                            {getUserIcon(activeChat.participant?.roles)}
                            <span className="ml-1">{activeChat.participant?.name || 'Қолданушы'}</span>
                          </h3>
                          <p className="text-sm text-emerald-100 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${activeChat.participant?.online ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></span>
                            {activeChat.participant?.online ? 'Желіде' : 'Желіде емес'}
                            {activeChat.participant?.specialty && ` • ${activeChat.participant.specialty}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2.5 text-white hover:bg-white/20 rounded-xl transition-colors">
                        <FaPhone />
                      </button>
                      <button className="p-2.5 text-white hover:bg-white/20 rounded-xl transition-colors">
                        <FaVideo />
                      </button>
                      <button className="p-2.5 text-white hover:bg-white/20 rounded-xl transition-colors">
                        <FaInfoCircle />
                      </button>
                    </div>
                  </div>

                  {/* ========== ХАБАРЛАМАЛАР (WhatsApp стилі) ========== */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <FaComments className="text-5xl text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-gray-700 mb-2">Хабарламалар жоқ</h3>
                          <p className="text-gray-500 max-w-md">
                            {activeChat.participant?.name} -пен сөйлесуді бастау үшін бірінші хабарламаны жазыңыз
                          </p>
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence>
                        <div className="space-y-1">
                          {messageGroups.map((group, groupIndex) => {
                            // sender может быть объектом {id,...} или плоским полем senderId
                            const msgSenderId = group[0].sender?.id ?? group[0].senderId;
                            const isOwnGroup = Number(msgSenderId) === Number(currentUserId);

                            return (
                              <div
                                key={groupIndex}
                                className={`flex ${isOwnGroup ? 'justify-end' : 'justify-start'} mb-3`}
                              >
                                <div className={`max-w-[72%] flex flex-col ${isOwnGroup ? 'items-end' : 'items-start'}`}>

                                  {/* Имя отправителя — только у чужих сообщений */}
                                  {!isOwnGroup && (
                                    <span className="text-xs font-medium text-emerald-700 mb-1 px-1">
                                      {activeChat.participant?.name || 'Қолданушы'}
                                    </span>
                                  )}

                                  <div className="space-y-0.5 w-full">
                                    {group.map((message, idx) => {
                                      const isFirst = idx === 0;
                                      const isLast = idx === group.length - 1;

                                      return (
                                        <motion.div
                                          key={message.id}
                                          variants={messageVariants}
                                          initial="hidden"
                                          animate="visible"
                                          exit="hidden"
                                          className="group relative"
                                          onContextMenu={(e) => handleMessageContextMenu(e, message)}
                                        >
                                          {/* Блок ответа */}
                                          {message.replyTo && (
                                            <div className={`mb-0.5 px-3 py-2 rounded-xl text-xs border-l-2 ${
                                              isOwnGroup
                                                ? 'bg-emerald-700/40 text-emerald-100 border-emerald-300 rounded-br-none'
                                                : 'bg-gray-100 text-gray-600 border-emerald-500 rounded-bl-none'
                                            }`}>
                                              <div className="font-semibold flex items-center gap-1 mb-0.5">
                                                <FaReply size={9} />
                                                {Number(message.replyTo.sender?.id ?? message.replyTo.senderId) === Number(currentUserId)
                                                  ? 'Сіз'
                                                  : activeChat.participant?.name}
                                              </div>
                                              <div className="truncate opacity-80">
                                                {message.replyTo.content || 'Тіркеме'}
                                              </div>
                                            </div>
                                          )}

                                          <div className={`relative px-3 py-2 transition-all ${
                                            isOwnGroup
                                              ? `bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ${
                                                  isFirst && isLast ? 'rounded-2xl rounded-br-sm'
                                                  : isFirst ? 'rounded-t-2xl rounded-tl-2xl rounded-br-sm rounded-bl-2xl'
                                                  : isLast ? 'rounded-b-2xl rounded-tr-2xl rounded-br-sm'
                                                  : 'rounded-l-2xl rounded-r-sm'
                                                }`
                                              : `bg-white border border-gray-200 shadow-sm hover:shadow-md ${
                                                  isFirst && isLast ? 'rounded-2xl rounded-bl-sm'
                                                  : isFirst ? 'rounded-t-2xl rounded-tr-2xl rounded-bl-sm rounded-br-2xl'
                                                  : isLast ? 'rounded-b-2xl rounded-tl-2xl rounded-bl-sm'
                                                  : 'rounded-r-2xl rounded-l-sm'
                                                }`
                                          }`}>

                                            {/* Вложения */}
                                            {message.attachments && message.attachments.length > 0 && (
                                              <div className="mb-2 space-y-2">
                                                {message.attachments.map((attachment, attIdx) => (
                                                  <div key={attIdx} className="rounded-lg overflow-hidden bg-black/5">
                                                    {attachment.mimeType?.startsWith('image/') ? (
                                                      <div className="relative group/image">
                                                        <img
                                                          src={getFullUrl(attachment.url)}
                                                          alt={attachment.name || 'Сурет'}
                                                          className="max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                                                          onClick={() => handleViewImage(attachment.url)}
                                                        />
                                                        <button
                                                          onClick={() => handleDownloadFile(attachment.url, attachment.name || 'сурет')}
                                                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white opacity-0 group-hover/image:opacity-100 transition-opacity"
                                                        >
                                                          <FaDownload size={12} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center justify-between p-2 hover:bg-black/5 transition-colors">
                                                        <div className="flex items-center flex-1 min-w-0">
                                                          {getFileIcon(attachment.name, attachment.mimeType)}
                                                          <div className="ml-2 flex-1 min-w-0">
                                                            <div className="font-medium truncate text-xs">{attachment.name || 'Файл'}</div>
                                                            <div className="text-xs opacity-70">{formatFileSize(attachment.size)}</div>
                                                          </div>
                                                        </div>
                                                        <button
                                                          onClick={() => handleDownloadFile(attachment.url, attachment.name)}
                                                          className="ml-2 p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                                                        >
                                                          <FaDownload size={12} />
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Текст сообщения */}
                                            {message.content && (
                                              <p className={`whitespace-pre-wrap break-words leading-relaxed text-sm ${
                                                isOwnGroup ? 'text-white' : 'text-gray-800'
                                              }`}>
                                                {message.content}
                                              </p>
                                            )}

                                            {/* Время и статус */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                                              isOwnGroup ? 'text-emerald-100/80' : 'text-gray-400'
                                            }`}>
                                              <span className="text-[10px]">
                                                {formatMessageTime(message.createdAt)}
                                              </span>
                                              {getMessageStatusIcon(message)}
                                            </div>

                                            {/* Кнопки при hover */}
                                            <div className={`absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                                              isOwnGroup ? '-left-20' : '-right-20'
                                            }`}>
                                              <button
                                                onClick={() => handleReply(message)}
                                                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors text-gray-600"
                                                title="Жауап беру"
                                              >
                                                <FaReply size={10} />
                                              </button>
                                              <button
                                                onClick={() => handleStarMessage(message)}
                                                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors text-gray-600"
                                                title="Маңызды"
                                              >
                                                <FaRegStar size={10} />
                                              </button>
                                              <button
                                                onClick={() => handleCopyMessage(message)}
                                                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors text-gray-600"
                                                title="Көшіру"
                                              >
                                                <FaCopy size={10} />
                                              </button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Блок ответа */}
                  <AnimatePresence>
                    {replyTo && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="px-4 md:px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm text-emerald-700 font-medium flex items-center">
                              <FaReply className="mr-2" />
                              Хабарламаға жауап
                            </div>
                            <div className="text-emerald-800 truncate text-sm">
                              {replyTo.content || 'Тіркеме'}
                            </div>
                          </div>
                          <button
                            onClick={() => setReplyTo(null)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Вложения */}
                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="px-4 md:px-6 py-3 bg-gray-100 border-t"
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center bg-white border rounded-lg p-2 shadow-sm">
                              {file.type.startsWith('image/') ? (
                                <FaImage className="text-emerald-500 mr-2" />
                              ) : (
                                <FaFile className="text-gray-500 mr-2" />
                              )}
                              <span className="text-sm truncate max-w-[150px] md:max-w-[200px]">{file.name}</span>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Поле ввода */}
                  <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Хабарлама жазыңыз..."
                          className="w-full bg-transparent border-none focus:outline-none resize-none py-3 px-4 max-h-32 text-gray-700 text-sm"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                        />
                        <div className="flex items-center justify-between px-4 pb-3">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-gray-500 hover:text-emerald-600 transition-colors p-1"
                              title="Файл тіркеу"
                            >
                              <FaPaperclip />
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              multiple
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <button className="text-gray-500 hover:text-emerald-600 transition-colors p-1">
                              <FaSmile />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">{newMessage.length}/2000</div>
                        </div>
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                        className={`p-3 rounded-xl transition-all ${
                          sending || (!newMessage.trim() && attachments.length === 0)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg'
                        } text-white`}
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <FaPaperPlane />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center">
                      <FaComments className="text-4xl text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">DensTalk-қа қош келдіңіз!</h3>
                    <p className="text-gray-600 max-w-md mb-8">
                      Тізімнен бар чатты таңдаңыз немесе пациенттер мен әріптестермен сөйлесу үшін жаңасын құрыңыз
                    </p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 inline-flex items-center transition-all shadow-lg hover:shadow-xl font-medium"
                    >
                      <FaPaperPlane className="mr-2" />
                      Жаңа чат құру
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Контекстное меню сообщения */}
      <AnimatePresence>
        {showMessageMenu && selectedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            ref={messageMenuRef}
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[160px]"
            style={{ top: messageMenuPosition.y, left: messageMenuPosition.x }}
          >
            <button
              onClick={() => handleReply(selectedMessage)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <FaReply className="text-emerald-600" />
              Жауап беру
            </button>
            <button
              onClick={() => handleCopyMessage(selectedMessage)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <FaCopy className="text-blue-600" />
              Көшіру
            </button>
            <button
              onClick={() => handleStarMessage(selectedMessage)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <FaRegStar className="text-yellow-600" />
              Маңызды деп белгілеу
            </button>
            {Number(selectedMessage.sender?.id ?? selectedMessage.senderId) === Number(currentUserId) && (
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                <FaTrash />
                Жою
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно нового чата */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FaUser className="mr-3" />
                    Жаңа чат
                  </h2>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                  >
                    <FaTimes />
                  </button>
                </div>
                <p className="text-emerald-100 text-sm mt-1">Сөйлесуді бастау үшін қолданушыны таңдаңыз</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                {usersList.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Қолжетімді қолданушылар жоқ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usersList.map(user => (
                      <motion.div
                        key={user.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                          selectedUserId === user.id
                            ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${user.avatarColor} text-white font-medium text-xl shadow-md`}>
                            {user.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 truncate flex items-center">
                                {getUserIcon(user.roles)}
                                <span className="ml-1">{user.name}</span>
                              </h4>
                              <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                            </div>
                            <p className="text-sm text-gray-600 truncate flex items-center mt-1">
                              {user.specialty && <FaStethoscope className="mr-1 text-emerald-600" size={12} />}
                              {getUserRole(user.roles)} • {user.email}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={createNewChat}
                    disabled={!selectedUserId}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      !selectedUserId
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    Сөйлесуді бастау
                  </button>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Болдырмау
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}</style>
    </div>
  );
};

export default DensTalk;