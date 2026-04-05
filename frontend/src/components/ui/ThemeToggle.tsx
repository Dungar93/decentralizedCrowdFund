import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`relative w-14 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${
        isDark 
          ? 'bg-indigo-600/30 border border-indigo-500/30' 
          : 'bg-amber-400/30 border border-amber-400/30'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        animate={{ x: isDark ? 0 : 24 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
          isDark 
            ? 'bg-indigo-500 text-white' 
            : 'bg-amber-400 text-amber-900'
        }`}
      >
        {isDark ? <FiMoon className="w-3 h-3" /> : <FiSun className="w-3 h-3" />}
      </motion.div>
    </motion.button>
  );
}
