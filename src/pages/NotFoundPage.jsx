import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function NotFoundPage() {
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
      <motion.div
        className="w-full px-4 sm:px-6 lg:px-8 text-center"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        role="alert"
        aria-labelledby="notfound-heading"
        aria-describedby="notfound-description"
      >
        <h1
          id="notfound-heading"
          className="text-4xl font-bold text-gray-800 mb-4"
        >
          404 - Бет табылмады
        </h1>
        <p
          id="notfound-description"
          className="text-lg text-gray-600 mb-6"
        >
          Сіз іздеген бет жоқ.
        </p>
        <motion.div variants={buttonVariants}>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Басты бетке оралу"
          >
            Басты бетке оралу
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;