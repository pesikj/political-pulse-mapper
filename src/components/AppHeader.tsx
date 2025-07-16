import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "w-full bg-card/80 backdrop-blur-sm border-b border-border/50",
        "sticky top-0 z-30",
        className
      )}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-gradient-primary text-white">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              World Political Compass
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Explore political positions worldwide
            </p>
          </div>
        </motion.div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}