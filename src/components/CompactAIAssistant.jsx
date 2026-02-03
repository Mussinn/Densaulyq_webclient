import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaTimes } from 'react-icons/fa';

const CompactAIAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {isExpanded ? (
          <div className="w-80 h-96 flex flex-col">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-white flex justify-between items-center">
              <div className="flex items-center">
                <FaRobot className="mr-2" />
                <span className="font-semibold">AI Көмекші</span>
              </div>
              <button onClick={() => setIsExpanded(false)}>
                <FaTimes />
              </button>
            </div>
            
            {/* Контент компактной версии */}
            <div className="flex-1 p-3 overflow-y-auto">
              {/* Здесь упрощенный контент из MedicalAIAssistantPage */}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <FaRobot className="text-xl" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CompactAIAssistant;