import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = "Loading...", className }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-12",
        className
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <Loader2 className="h-8 w-8 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">{text}</p>
    </motion.div>
  );
}

export function CompassSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full bg-gradient-compass rounded-3xl p-6 shadow-compass"
    >
      <div className="h-full relative flex items-center justify-center">
        <div className="space-y-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-muted/30 mx-auto"
          />
          <div className="space-y-2">
            <div className="h-4 bg-muted/30 rounded w-32 mx-auto" />
            <div className="h-3 bg-muted/20 rounded w-24 mx-auto" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}