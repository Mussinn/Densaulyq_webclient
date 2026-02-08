import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import {
  FaComments,
  FaPaperPlane,
  FaUserMd,
  FaSearch,
  FaEllipsisV,
  FaPhone,
  FaVideo,
  FaInfoCircle,
  FaTimes,
  FaClock,
  FaCheck,
  FaCheckDouble,
  FaImage,
  FaFile,
  FaSmile,
  FaPaperclip,
  FaTrash,
  FaEdit,
  FaReply
} from 'react-icons/fa';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const DoctorMessenger = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { token } = useSelector((state) => state.token);
  const currentDoctorId = useSelector((state) => state.auth?.user?.doctorId);

  // Загрузка чатов
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/chats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(response.data || []);
      
      // Сортировка по последнему сообщению
      const sortedChats = (response.data || []).sort((a, b) => 
        new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
      );
      setChats(sortedChats);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка врачей для нового чата
  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/v1/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const doctorsData = response.data
        .filter(doctor => doctor.doctorId !== currentDoctorId)
        .map(doctor => ({
          id: doctor.doctorId,
          name: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim() || 'Доктор',
          specialty: doctor.specialty || '—',
          avatarColor: getAvatarColor(doctor.doctorId),
          online: doctor.user?.online || false,
          email: doctor.user?.email || ''
        }));
      
      setDoctorsList(doctorsData);
    } catch (error) {
      console.error('Ошибка загрузки врачей:', error);
    }
  };

  // Загрузка сообщений чата
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      setLoadingMessages(true);
      const response = await api.get(`/api/v1/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, offset: 0 }
      });
      
      setMessages(response.data || []);
      
      // Отмечаем сообщения как прочитанные
      await markAsRead(chatId);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Отметить сообщения как прочитанные
  const markAsRead = async (chatId) => {
    try {
      await api.post(`/api/v1/chats/${chatId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Ошибка отметки как прочитанного:', error);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!activeChat) return;
    
    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('content', newMessage.trim());
      formData.append('chatId', activeChat.id);
      
      if (replyTo) {
        formData.append('replyToId', replyTo.id);
      }
      
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
      
      const response = await api.post('/api/v1/messages', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Добавляем новое сообщение в список
      const newMsg = response.data;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setAttachments([]);
      setReplyTo(null);
      
      // Обновляем последнее сообщение в списке чатов
      setChats(prev => prev.map(chat => 
        chat.id === activeChat.id 
          ? { ...chat, lastMessage: newMsg.content, lastMessageAt: new Date().toISOString() }
          : chat
      ));
      
      // Прокручиваем к последнему сообщению
      scrollToBottom();
      
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  // Создание нового чата
  const createNewChat = async () => {
    if (!selectedDoctorId) {
      alert('Выберите врача');
      return;
    }
    
    try {
      const response = await api.post('/api/v1/chats', {
        participantId: selectedDoctorId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setShowNewChatModal(false);
      setSelectedDoctorId('');
      fetchMessages(newChat.id);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      alert('Не удалось создать чат');
    }
  };

  // Обработка файлов
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.size <= 10 * 1024 * 1024 // 10MB лимит
    );
    
    if (validFiles.length !== files.length) {
      alert('Некоторые файлы превышают лимит 10MB');
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  // Удаление вложения
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Генерация цвета для аватарки
  const getAvatarColor = (id) => {
    const colors = [
      'bg-indigo-500', 'bg-green-500', 'bg-blue-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-red-500',
      'bg-yellow-500', 'bg-teal-500'
    ];
    return colors[Math.abs(id) % colors.length];
  };

  // Форматирование даты
  const formatMessageTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return '--:--';
    }
  };

  const formatChatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(date, 'HH:mm', { locale: ru });
      } else if (diffDays === 1) {
        return 'Вчера';
      } else if (diffDays < 7) {
        return format(date, 'EEEE', { locale: ru });
      } else {
        return format(date, 'dd.MM.yy', { locale: ru });
      }
    } catch {
      return '';
    }
  };

  // Фильтрация чатов
  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    const participantName = chat.participant?.name || '';
    const lastMessage = chat.lastMessage || '';
    
    return (
      participantName.toLowerCase().includes(searchLower) ||
      lastMessage.toLowerCase().includes(searchLower)
    );
  });

  // Эффекты
  useEffect(() => {
    if (token) {
      fetchChats();
      fetchDoctors();
    }
  }, [token]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Слушатель для новых сообщений (WebSocket или polling)
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      fetchChats();
      if (activeChat) {
        fetchMessages(activeChat.id);
      }
    }, 10000); // Опрос каждые 10 секунд
    
    return () => clearInterval(interval);
  }, [token, activeChat]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Список чатов */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FaComments className="mr-2 text-indigo-600" />
              Сообщения
            </h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200"
              title="Новый чат"
            >
              <FaPaperPlane />
            </button>
          </div>
          
          {/* Поиск */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FaComments className="text-4xl text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-700 font-medium mb-1">Нет чатов</h3>
              <p className="text-gray-500 text-sm">Начните общение с коллегами</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm"
              >
                Создать чат
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeChat?.id === chat.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Аватар */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAvatarColor(chat.participant?.id)} text-white font-medium`}>
                        {chat.participant?.name?.charAt(0) || 'Д'}
                      </div>
                      {chat.participant?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Информация о чате */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {chat.participant?.name || 'Доктор'}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatChatDate(chat.lastMessageAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {chat.lastMessage || 'Нет сообщений'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {chat.participant?.specialty || '—'}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAvatarColor(activeChat.participant?.id)} text-white font-medium`}>
                  {activeChat.participant?.name?.charAt(0) || 'Д'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {activeChat.participant?.name || 'Доктор'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${activeChat.participant?.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {activeChat.participant?.online ? 'В сети' : 'Не в сети'} • {activeChat.participant?.specialty || '—'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                  <FaPhone />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                  <FaVideo />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                  <FaInfoCircle />
                </button>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FaComments className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">Нет сообщений</h3>
                    <p className="text-gray-500">Начните диалог с коллегой</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === currentDoctorId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.senderId === currentDoctorId ? 'order-2' : 'order-1'}`}>
                        {/* Ответ на сообщение */}
                        {message.replyTo && (
                          <div className={`mb-1 p-2 rounded-lg text-sm ${
                            message.senderId === currentDoctorId 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            <div className="font-medium">
                              {message.replyTo.senderId === currentDoctorId ? 'Вы' : activeChat.participant?.name}
                            </div>
                            <div className="truncate">
                              {message.replyTo.content || 'Вложение'}
                            </div>
                          </div>
                        )}
                        
                        {/* Сообщение */}
                        <div className={`rounded-2xl p-3 ${
                          message.senderId === currentDoctorId 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 rounded-bl-none'
                        }`}>
                          {/* Вложения */}
                          {message.attachments?.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden bg-black bg-opacity-10">
                                  {attachment.type?.startsWith('image/') ? (
                                    <img 
                                      src={attachment.url} 
                                      alt="Вложение" 
                                      className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90"
                                      onClick={() => window.open(attachment.url, '_blank')}
                                    />
                                  ) : (
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center p-3 hover:bg-black hover:bg-opacity-5"
                                    >
                                      <FaFile className="text-xl mr-3" />
                                      <div className="flex-1">
                                        <div className="font-medium truncate">{attachment.name}</div>
                                        <div className="text-sm opacity-75">{(attachment.size / 1024).toFixed(1)} KB</div>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Текст сообщения */}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          
                          {/* Время и статус */}
                          <div className={`flex items-center justify-end mt-1 text-xs ${
                            message.senderId === currentDoctorId ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {message.senderId === currentDoctorId && (
                              <span className="ml-1">
                                {message.readAt ? <FaCheckDouble /> : <FaCheck />}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Действия с сообщением */}
                        <div className={`flex items-center space-x-2 mt-1 ${message.senderId === currentDoctorId ? 'justify-end' : 'justify-start'}`}>
                          <button 
                            onClick={() => setReplyTo(message)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Ответить
                          </button>
                          {message.senderId === currentDoctorId && (
                            <button className="text-xs text-gray-500 hover:text-gray-700">
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Ответ на сообщение */}
            {replyTo && (
              <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-indigo-700 font-medium">Ответ на сообщение</div>
                    <div className="text-sm text-indigo-800 truncate">
                      {replyTo.content || 'Вложение'}
                    </div>
                  </div>
                  <button 
                    onClick={() => setReplyTo(null)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            {/* Вложения */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 bg-gray-100 border-t">
                <div className="flex items-center flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-white border rounded-lg p-2">
                      {file.type.startsWith('image/') ? (
                        <FaImage className="text-blue-500 mr-2" />
                      ) : (
                        <FaFile className="text-gray-500 mr-2" />
                      )}
                      <span className="text-sm truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Поле ввода */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="w-full bg-transparent border-none focus:outline-none resize-none py-3 px-4 max-h-32"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between px-4 pb-2">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-gray-700"
                        title="Прикрепить файл"
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
                      <button className="text-gray-500 hover:text-gray-700">
                        <FaSmile />
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {newMessage.length}/2000
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                  className={`p-3 rounded-xl ${
                    sending || (!newMessage.trim() && attachments.length === 0)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FaComments className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Выберите чат</h3>
              <p className="text-gray-500 max-w-md">
                Выберите существующий чат из списка или создайте новый для общения с коллегами
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 inline-flex items-center"
              >
                <FaPaperPlane className="mr-2" />
                Создать новый чат
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно нового чата */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center">
                  <FaUserMd className="mr-3 text-indigo-600" />
                  Новый чат
                </h2>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Выберите коллегу для начала диалога
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {doctorsList.length === 0 ? (
                <div className="text-center py-8">
                  <FaUserMd className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет доступных врачей</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctorsList.map(doctor => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedDoctorId(doctor.id)}
                      className={`p-3 rounded-xl cursor-pointer border transition-colors ${
                        selectedDoctorId === doctor.id
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doctor.avatarColor} text-white font-medium`}>
                          {doctor.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">
                              {doctor.name}
                            </h4>
                            <span className={`w-2 h-2 rounded-full ${doctor.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {doctor.specialty}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-3">
                <button
                  onClick={createNewChat}
                  disabled={!selectedDoctorId}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    !selectedDoctorId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Начать диалог
                </button>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMessenger;