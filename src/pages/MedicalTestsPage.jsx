import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { 
  FaFileMedical, 
  FaUserInjured, 
  FaCalendarAlt, 
  FaFilePdf, 
  FaFileImage, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaDownload,
  FaEye,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStethoscope,
  FaXRay,
  FaMicroscope,
  FaUserMd
} from 'react-icons/fa';

const MedicalTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Форма для нового теста
  const [newTest, setNewTest] = useState({
    testName: '',
    result: '',
    testDate: new Date().toISOString().slice(0, 16),
    file: null,
    image: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  
  const { token } = useSelector((state) => state.token);
  
  // Загрузка данных
  useEffect(() => {
    fetchPatientInfo();
    fetchPatientTests();
  }, [token]);
  
  // Получение информации о текущем пациенте
  const fetchPatientInfo = async () => {
    try {
      const response = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientInfo(response.data);
    } catch (err) {
      console.error('Ошибка загрузки информации о пациенте:', err);
    }
  };
  
  // Загрузка тестов текущего пациента
  const fetchPatientTests = async () => {
    try {
      setLoading(true);
      
      // Получаем ID пациента из профиля
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userRes.data;
      const patientId = user?.patient?.patientId || user?.userId;
      
      if (patientId) {
        const response = await api.get(`/api/v1/test/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTests(response.data || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки тестов:', err);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Создание нового теста
  const handleCreateTest = async (e) => {
    e.preventDefault();
    
    if (!newTest.testName || !newTest.result) {
      alert('Заполните обязательные поля: название теста и результат');
      return;
    }
    
    setUploading(true);
    
    try {
      // Получаем ID пациента из профиля
      const userRes = await api.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userRes.data;
      const patientId = user?.patient?.patientId || user?.userId;
      
      if (!patientId) {
        throw new Error('Не удалось определить ID пациента');
      }
      
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('testName', newTest.testName);
      formData.append('result', newTest.result);
      
      if (newTest.testDate) {
        const date = new Date(newTest.testDate);
        formData.append('testDate', date.toISOString());
      }
      
      if (newTest.file) {
        formData.append('file', newTest.file);
      }
      
      if (newTest.image) {
        formData.append('image', newTest.image);
      }
      
      const response = await api.post('/api/v1/test', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Тест успешно сохранен!');
      setShowAddModal(false);
      resetForm();
      
      // Обновляем список тестов
      await fetchPatientTests();
      
    } catch (err) {
      console.error('Ошибка создания теста:', err);
      alert(`Ошибка создания теста: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  // Удаление теста
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест?')) return;
    
    try {
      await api.delete(`/api/v1/test/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Тест успешно удален!');
      setTests(tests.filter(test => test.testId !== testId));
      
    } catch (err) {
      console.error('Ошибка удаления теста:', err);
      alert(`Ошибка удаления теста: ${err.response?.data?.message || err.message}`);
    }
  };
  
  // Просмотр теста
  const handleViewTest = (test) => {
    setSelectedTest(test);
    setShowViewModal(true);
  };
  
  // Скачивание файла
  const handleDownloadFile = async (url, filename) => {
    if (!url) {
      alert('URL файла не найден');
      return;
    }
    
    try {
      // Открываем файл в новой вкладке для скачивания
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при скачивании файла');
      }

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
      console.error('Ошибка скачивания файла:', err);
      alert('Ошибка скачивания файла. Попробуйте открыть файл в новой вкладке.');
      
      // Резервный метод - открыть в новой вкладке
      window.open(url, '_blank');
    }
  };
  
  // Просмотр изображения
  const handleViewImage = (url) => {
    if (!url) return;
    window.open(url.replace('/files/', '/files/view/'), '_blank');
  };
  
  // Обработчики файлов
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (fileType === 'image') {
      setNewTest({ ...newTest, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setNewTest({ ...newTest, file: file });
      setPreviewFile(file.name);
    }
  };
  
  const resetForm = () => {
    setNewTest({
      testName: '',
      result: '',
      testDate: new Date().toISOString().slice(0, 16),
      file: null,
      image: null
    });
    setPreviewImage(null);
    setPreviewFile(null);
  };
  
  // Фильтрация тестов
  const filteredTests = tests.filter(test => {
    // Фильтр по типу
    if (filterType !== 'all') {
      const testLower = test.testName?.toLowerCase() || '';
      if (filterType === 'xray' && !testLower.includes('рентген') && !testLower.includes('снимок') && !testLower.includes('x-ray')) {
        return false;
      }
      if (filterType === 'lab' && !testLower.includes('анализ') && !testLower.includes('кровь') && !testLower.includes('лаборатор')) {
        return false;
      }
      if (filterType === 'other' && 
          (testLower.includes('рентген') || testLower.includes('снимок') || testLower.includes('x-ray') ||
           testLower.includes('анализ') || testLower.includes('кровь') || testLower.includes('лаборатор'))) {
        return false;
      }
    }
    
    // Поиск
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (test.testName?.toLowerCase().includes(searchLower)) ||
        (test.result?.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  // Получение иконки для типа теста
  const getTestIcon = (testName) => {
    const name = testName?.toLowerCase() || '';
    if (name.includes('рентген') || name.includes('снимок') || name.includes('x-ray')) {
      return <FaXRay className="text-blue-500" />;
    } else if (name.includes('кровь') || name.includes('анализ') || name.includes('лаборатор')) {
      return <FaMicroscope className="text-red-500" />;
    } else {
      return <FaFileMedical className="text-purple-500" />;
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };
  
  // Получение имени файла из URL
  const getFileNameFromUrl = (url) => {
    if (!url) return 'Файл';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Файл';
  };
  
  // Получение типа файла из URL
  const getFileTypeFromUrl = (url) => {
    if (!url) return '';
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) return 'Изображение';
    if (url.includes('.doc') || url.includes('.docx')) return 'Документ';
    return 'Файл';
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Заголовок и информация о пациенте */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              <FaFileMedical className="inline mr-3 text-blue-600" />
              Мои медицинские тесты и анализы
            </h1>
            <p className="text-gray-600">Просмотр и управление результатами анализов</p>
          </div>
          
          {patientInfo && (
            <div className="mt-4 md:mt-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-white rounded-lg mr-3 border border-blue-200">
                  <FaUserInjured className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {patientInfo.firstName} {patientInfo.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">Пациент</p>
                  {patientInfo.email && (
                    <p className="text-xs text-gray-500">{patientInfo.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Кнопка добавления и статистика */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="mb-4 md:mb-0 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <FaPlus className="mr-2" /> Добавить новый тест
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
              <div className="text-sm text-gray-600">Всего тестов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tests.filter(t => t.imageUrl).length}
              </div>
              <div className="text-sm text-gray-600">Снимков</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tests.filter(t => t.fileUrl).length}
              </div>
              <div className="text-sm text-gray-600">Документов</div>
            </div>
          </div>
        </div>
        
        {/* Фильтры и поиск */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" /> Фильтр по типу:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">Все типы тестов</option>
                <option value="xray">Рентген и снимки</option>
                <option value="lab">Лабораторные анализы</option>
                <option value="other">Другие тесты</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" /> Поиск:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию теста или результату..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:border-blue-500"
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Список тестов */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2.5 bg-blue-50 rounded-xl mr-3">
                <FaStethoscope className="text-xl text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Мои тесты</h2>
                <p className="text-sm text-gray-500">
                  {filteredTests.length === tests.length 
                    ? `Всего ${tests.length} тестов`
                    : `Найдено ${filteredTests.length} из ${tests.length} тестов`}
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchPatientTests}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaCalendarAlt className="mr-2" />}
              Обновить
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center">
              <FaSpinner className="animate-spin mx-auto text-3xl text-blue-600 mb-4" />
              <p className="text-gray-600">Загрузка тестов...</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-3">
                <FaFileMedical className="text-4xl mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchTerm || filterType !== 'all' ? 'Тесты не найдены' : 'Нет сохраненных тестов'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Добавьте первый тест для отслеживания результатов анализов'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-colors"
              >
                <FaPlus className="inline mr-2" /> Добавить тест
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTests.map(test => (
                <div key={test.testId} className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-all duration-200 border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start mb-3">
                        <div className="p-2 bg-white rounded-lg mr-3 border border-gray-200">
                          {getTestIcon(test.testName)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">{test.testName}</h3>
                            <span className="text-sm text-gray-500">
                              <FaCalendarAlt className="inline mr-1" />
                              {formatDate(test.testDate)}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Результат:</h4>
                            <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                              {test.result}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {test.fileUrl && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <FaFilePdf className="mr-1" /> {getFileTypeFromUrl(test.fileUrl)}
                              </span>
                            )}
                            {test.imageUrl && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                <FaFileImage className="mr-1" /> Изображение
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-4">
                      <div className="flex flex-col space-y-2 min-w-[200px]">
                        <button
                          onClick={() => handleViewTest(test)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                        >
                          <FaEye className="mr-2" /> Подробнее
                        </button>
                        
                        {test.fileUrl && (
                          <button
                            onClick={() => handleDownloadFile(test.fileUrl, getFileNameFromUrl(test.fileUrl))}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <FaDownload className="mr-2" /> Скачать документ
                          </button>
                        )}
                        
                        {test.imageUrl && (
                          <>
                            <button
                              onClick={() => handleViewImage(test.imageUrl)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
                            >
                              <FaEye className="mr-2" /> Просмотр снимка
                            </button>
                            <button
                              onClick={() => handleDownloadFile(test.imageUrl, getFileNameFromUrl(test.imageUrl))}
                              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center text-sm font-medium"
                            >
                              <FaDownload className="mr-2" /> Скачать снимок
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDeleteTest(test.testId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center text-sm font-medium"
                        >
                          <FaTrash className="mr-2" /> Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Модалка добавления теста */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mr-3">
                    <FaFileMedical className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Добавить новый тест</h2>
                    <p className="text-sm text-gray-500">Заполните информацию о вашем тесте или анализе</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateTest} className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-lg mr-3 border border-blue-200">
                      <FaUserInjured className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {patientInfo?.firstName} {patientInfo?.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">Тест будет сохранен в вашу медицинскую карту</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название теста <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTest.testName}
                    onChange={(e) => setNewTest({...newTest, testName: e.target.value})}
                    placeholder="Например: Рентген легких, Анализ крови, МРТ"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-2 text-blue-500" />
                    Дата проведения теста
                  </label>
                  <input
                    type="datetime-local"
                    value={newTest.testDate}
                    onChange={(e) => setNewTest({...newTest, testDate: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Результат теста <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={newTest.result}
                    onChange={(e) => setNewTest({...newTest, result: e.target.value})}
                    placeholder="Введите результаты вашего теста или анализа..."
                    rows="4"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaFilePdf className="inline mr-2 text-red-500" />
                      Прикрепить документ (PDF, DOC, и т.д.)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'file')}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <FaFilePdf className="text-3xl text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          {previewFile || 'Нажмите для выбора файла'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, XLS до 10MB</p>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaFileImage className="inline mr-2 text-purple-500" />
                      Прикрепить изображение (рентген, снимок)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="hidden"
                        id="image-upload"
                        accept="image/*"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <FaFileImage className="text-3xl text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          {previewImage ? 'Изображение выбрано' : 'Нажмите для выбора изображения'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG до 10MB</p>
                      </label>
                    </div>
                    
                    {previewImage && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</p>
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-48 object-contain border border-gray-200 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm mb-1">Полезные советы:</h4>
                      <p className="text-gray-600 text-xs">
                        • Сохраняйте результаты всех медицинских обследований<br/>
                        • Прикрепляйте оригиналы снимков и документов<br/>
                        • Указывайте точную дату проведения теста<br/>
                        • Эти данные помогут вашему врачу в диагностике
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`flex-1 py-3.5 rounded-xl font-medium flex items-center justify-center transition-all shadow-md ${
                      uploading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Сохранение...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" /> Сохранить тест
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 bg-gray-100 text-gray-700 py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center font-medium border border-gray-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Модалка просмотра теста */}
      {showViewModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mr-3">
                    {getTestIcon(selectedTest.testName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedTest.testName}</h2>
                    <p className="text-sm text-gray-500">Детальная информация о тесте</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Результат теста</h3>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-800 whitespace-pre-line">{selectedTest.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3">Информация о тесте</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Дата проведения:</p>
                        <p className="font-medium text-gray-800">
                          <FaCalendarAlt className="inline mr-2 text-blue-500" />
                          {formatDate(selectedTest.testDate)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Дата создания записи:</p>
                        <p className="font-medium text-gray-800">
                          {formatDate(selectedTest.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3">Прикрепленные файлы</h3>
                    
                    <div className="space-y-3">
                      {selectedTest.fileUrl && (
                        <button
                          onClick={() => handleDownloadFile(selectedTest.fileUrl, getFileNameFromUrl(selectedTest.fileUrl))}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <FaFilePdf className="mr-2" /> Скачать документ
                        </button>
                      )}
                      
                      {selectedTest.imageUrl && (
                        <button
                          onClick={() => handleDownloadFile(selectedTest.imageUrl, getFileNameFromUrl(selectedTest.imageUrl))}
                          className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <FaFileImage className="mr-2" /> Скачать снимок
                        </button>
                      )}
                      
                      {!selectedTest.fileUrl && !selectedTest.imageUrl && (
                        <p className="text-gray-500 text-center py-2">Нет прикрепленных файлов</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShowAddModal(true);
                        setNewTest({
                          testName: selectedTest.testName,
                          result: selectedTest.result,
                          testDate: selectedTest.testDate ? new Date(selectedTest.testDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                          file: null,
                          image: null
                        });
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <FaEdit className="mr-2" /> Создать похожий
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTest(selectedTest.testId)}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <FaTrash className="mr-2" /> Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalTestsPage;