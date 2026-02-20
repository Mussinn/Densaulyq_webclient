import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaCopy, FaCheck } from 'react-icons/fa';

const PaymentModal = ({ isOpen, onClose, paymentUrl, paymentDetails }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50"
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Заголовок */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-500 to-green-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <div className="p-2 bg-white/20 rounded-xl mr-3">
                      <FaExternalLinkAlt className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Счет на оплату</h2>
                      <p className="text-sm text-green-100">
                        {paymentDetails?.description || 'Платежная страница'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              {/* Информация о платеже */}
              {paymentDetails && (
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Сумма</p>
                      <p className="text-xl font-bold text-gray-800">
                        {paymentDetails.amount?.toLocaleString()} {paymentDetails.currency || 'KZT'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Статус</p>
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                        paymentDetails.status === 'pending' || paymentDetails.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : paymentDetails.status === 'paid' || paymentDetails.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {paymentDetails.status === 'pending' || paymentDetails.status === 'PENDING' ? 'Ожидает оплаты' : 
                         paymentDetails.status === 'paid' || paymentDetails.status === 'PAID' ? 'Оплачено' : 
                         paymentDetails.status}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Пациент</p>
                      <p className="font-medium text-gray-800">{paymentDetails.patientName || '—'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Врач</p>
                      <p className="font-medium text-gray-800">{paymentDetails.doctorName || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Контент - iframe с платежной страницей */}
              <div className="p-6 bg-gray-100" style={{ height: '500px' }}>
                {paymentUrl ? (
                  <iframe
                    src={paymentUrl}
                    title="Payment Page"
                    className="w-full h-full rounded-xl border-2 border-gray-200 bg-white"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    allow="payment *"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white rounded-xl">
                    <p className="text-gray-500">Ссылка на оплату недоступна</p>
                  </div>
                )}
              </div>

              {/* Нижняя панель */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={paymentUrl || ''}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <FaCheck /> Скопировано
                        </>
                      ) : (
                        <>
                          <FaCopy /> Копировать
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => window.open(paymentUrl, '_blank')}
                      className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <FaExternalLinkAlt />
                      Открыть в новой вкладке
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;