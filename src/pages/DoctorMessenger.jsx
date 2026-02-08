import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
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
  FaCheckDouble
} from 'react-icons/fa';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Messenger = () => {
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
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { token } = useSelector((state) => state.token);
  const currentUserId = useSelector((state) => state.auth?.user?.userId);

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
        if (updatedActiveChat) {
          setActiveChat(updatedActiveChat);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
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
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Пользователь',
          email: user.email || '',
          username: user.username || '',
          avatarColor: getAvatarColor(user.userId),
          online: user.online || false,
          roles: user.roles || [],
          specialty: user.doctor?.specialty || user.specialty || ''
        }));
      
      setUsersList(usersData);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
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
      console.error('Ошибка загрузки сообщений:', error);
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
      console.error('Ошибка отметки как прочитанного:', error);
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
      
      if (replyTo) {
        formData.append('replyToId', replyTo.id);
      }
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      const response = await api.post('/api/v1/messages', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
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
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const createNewChat = async () => {
    if (!selectedUserId) {
      alert('Выберите пользователя');
      return;
    }
    
    try {
      const response = await api.post('/api/v1/chats', {
        participantId: selectedUserId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setShowNewChatModal(false);
      setSelectedUserId('');
      fetchMessages(newChat.id);
      
      if (window.innerWidth < 768) {
        setShowChatList(false);
      }
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      alert('Не удалось создать чат');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.size <= 10 * 1024 * 1024
    );
    
    if (validFiles.length !== files.length) {
      alert('Некоторые файлы превышают лимит 10MB');
    }
    
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
      'bg-indigo-500', 'bg-green-500', 'bg-blue-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-red-500',
      'bg-yellow-500', 'bg-teal-500'
    ];
    return colors[Math.abs(id || 0) % colors.length];
  };

  const getUserRole = (roles) => {
    if (!roles || roles.length === 0) return 'Пользователь';
    const roleNames = roles.map(r => r.name || r.roleName || '');
    if (roleNames.includes('ROLE_DOCTOR') || roleNames.includes('DOCTOR')) return 'Врач';
    if (roleNames.includes('ROLE_PATIENT') || roleNames.includes('PATIENT')) return 'Пациент';
    if (roleNames.includes('ROLE_ADMIN') || roleNames.includes('ADMIN')) return 'Администратор';
    return 'Пользователь';
  };

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

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    if (window.innerWidth < 768) {
      setShowChatList(false);
    }
  };

  const handleBackToChats = () => {
    setActiveChat(null);
    setShowChatList(true);
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    const participantName = chat.participant?.name || '';
    const lastMessage = chat.lastMessage || '';
    
    return (
      participantName.toLowerCase().includes(searchLower) ||
      lastMessage.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    if (token) {
      fetchChats();
      fetchUsers();
      
      if (window.innerWidth < 768) {
        setShowChatList(true);
      }
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

  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      fetchChats();
      if (activeChat) {
        fetchMessages(activeChat.id);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [token, activeChat]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Мессенджер</h1>
          <p className="text-gray-600 mt-2">Общайтесь с пациентами и коллегами</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* Список чатов */}
            <div className={`
              ${showChatList ? 'flex' : 'hidden'} 
              md:flex w-full md:w-96 
              border-r border-gray-200 
              flex-col h-full
            `}>
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                    <FaComments className="mr-2 text-indigo-600" />
                    Чаты
                  </h2>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                    title="Новый чат"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
                
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск чатов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <FaComments className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">Нет чатов</h3>
                    <p className="text-gray-500 text-sm mb-4">Начните общение</p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm transition-colors"
                    >
                      Создать чат
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredChats.map(chat => (
                      <div
                        key={chat.id}
                        onClick={() => handleChatSelect(chat)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          activeChat?.id === chat.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAvatarColor(chat.participant?.id)} text-white font-medium text-lg`}>
                              {chat.participant?.name?.charAt(0) || 'П'}
                            </div>
                            {chat.participant?.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {chat.participant?.name || 'Пользователь'}
                              </h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatChatDate(chat.lastMessageAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {chat.lastMessage || 'Нет сообщений'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 truncate">
                                {chat.participant?.specialty || chat.participant?.email || '—'}
                              </span>
                              {chat.unreadCount > 0 && (
                                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full min-w-[1.5rem] text-center">
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
            <div className={`
              ${!showChatList ? 'flex' : 'hidden'} 
              md:flex flex-1 
              flex-col h-full
            `}>
              {activeChat ? (
                <>
                  <div className="p-4 md:p-6 border-b border-gray-200 bg-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleBackToChats}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <FaArrowLeft className="text-gray-600 text-lg" />
                      </button>
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAvatarColor(activeChat.participant?.id)} text-white font-medium text-lg`}>
                          {activeChat.participant?.name?.charAt(0) || 'П'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base md:text-lg">
                            {activeChat.participant?.name || 'Пользователь'}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${activeChat.participant?.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            {activeChat.participant?.online ? 'В сети' : 'Не в сети'} 
                            {activeChat.participant?.specialty && ` • ${activeChat.participant.specialty}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <FaPhone />
                      </button>
                      <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <FaVideo />
                      </button>
                      <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <FaInfoCircle />
                      </button>
                    </div>
                  </div>

                  {/* Сообщения */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <FaComments className="text-4xl text-gray-300 mx-auto mb-3" />
                          <h3 className="text-gray-700 font-medium mb-1">Нет сообщений</h3>
                          <p className="text-gray-500">Начните диалог</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] lg:max-w-[60%] ${message.senderId === currentUserId ? 'order-2' : 'order-1'}`}>
                              {message.replyTo && (
                                <div className={`mb-2 p-3 rounded-lg ${
                                  message.senderId === currentUserId 
                                    ? 'bg-indigo-100 text-indigo-800' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  <div className="font-medium text-sm">
                                    {message.replyTo.senderId === currentUserId ? 'Вы' : activeChat.participant?.name}
                                  </div>
                                  <div className="truncate text-sm">
                                    {message.replyTo.content || 'Вложение'}
                                  </div>
                                </div>
                              )}
                              
                              <div className={`rounded-2xl p-4 ${
                                message.senderId === currentUserId 
                                  ? 'bg-indigo-600 text-white rounded-br-none' 
                                  : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                              }`}>
                                {message.attachments?.length > 0 && (
                                  <div className="mb-3 space-y-2">
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
                                
                                {message.content && (
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                )}
                                
                                <div className={`flex items-center justify-end mt-2 text-sm ${
                                  message.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'
                                }`}>
                                  <span>{formatMessageTime(message.createdAt)}</span>
                                  {message.senderId === currentUserId && (
                                    <span className="ml-2">
                                      {message.readAt ? <FaCheckDouble /> : <FaCheck />}
                                    </span>
                                  )}
                                </div>
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
                    <div className="px-4 md:px-6 py-3 bg-indigo-50 border-t border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-indigo-700 font-medium">Ответ на сообщение</div>
                          <div className="text-indigo-800 truncate">
                            {replyTo.content || 'Вложение'}
                          </div>
                        </div>
                        <button 
                          onClick={() => setReplyTo(null)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Вложения */}
                  {attachments.length > 0 && (
                    <div className="px-4 md:px-6 py-3 bg-gray-100 border-t">
                      <div className="flex items-center flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center bg-white border rounded-lg p-3">
                            {file.type.startsWith('image/') ? (
                              <FaImage className="text-blue-500 mr-2" />
                            ) : (
                              <FaFile className="text-gray-500 mr-2" />
                            )}
                            <span className="text-sm truncate max-w-[150px] md:max-w-[200px]">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Поле ввода */}
                  <div className="p-4 md:p-6 border-t border-gray-200">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200">
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
                        
                        <div className="flex items-center justify-between px-4 pb-3">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
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
                            <button className="text-gray-500 hover:text-gray-700 transition-colors p-1">
                              <FaSmile />
                            </button>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {newMessage.length}/2000
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={sendMessage}
                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                        className={`p-3 rounded-xl transition-colors ${
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
                <div className="hidden md:flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <FaComments className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Выберите чат</h3>
                    <p className="text-gray-500 max-w-md">
                      Выберите существующий чат из списка или создайте новый
                    </p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 inline-flex items-center transition-colors"
                    >
                      <FaPaperPlane className="mr-2" />
                      Создать новый чат
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно нового чата */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center">
                  <FaUser className="mr-3 text-indigo-600" />
                  Новый чат
                </h2>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Выберите пользователя для начала диалога
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {usersList.length === 0 ? (
                <div className="text-center py-8">
                  <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет доступных пользователей</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersList.map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`p-4 rounded-xl cursor-pointer border transition-colors ${
                        selectedUserId === user.id
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.avatarColor} text-white font-medium text-lg`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">
                              {user.name}
                            </h4>
                            <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {getUserRole(user.roles)} • {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={createNewChat}
                  disabled={!selectedUserId}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    !selectedUserId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Начать диалог
                </button>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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

export default Messenger;