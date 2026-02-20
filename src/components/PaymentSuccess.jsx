import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome } from 'react-icons/fa';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Здесь можно отправить аналитику или обновить данные
    console.log('Payment successful:', sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Төлем сәтті аяқталды!
        </h1>
        <p className="text-gray-600 mb-6">
          Сіздің төлеміңіз қабылданды. Рахмет!
        </p>
        <button
          onClick={() => navigate('/patient')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <FaHome />
          Панельге оралу
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;