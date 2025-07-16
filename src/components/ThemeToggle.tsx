import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-full w-12 h-12 border-2 bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300"
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: theme === 'light' ? 1 : 0, 
          opacity: theme === 'light' ? 1 : 0,
          rotate: theme === 'light' ? 0 : 180
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Sun className="h-5 w-5" />
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{ 
          scale: theme === 'dark' ? 1 : 0, 
          opacity: theme === 'dark' ? 1 : 0,
          rotate: theme === 'dark' ? 0 : -180
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Moon className="h-5 w-5" />
      </motion.div>
    </Button>
  );
}