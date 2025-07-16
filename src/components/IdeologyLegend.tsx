import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Ideology, IDEOLOGY_LABELS, IDEOLOGY_COLORS } from '@/types/political';
import { cn } from '@/lib/utils';

interface IdeologyLegendProps {
  visibleIdeologies: Set<Ideology>;
  onToggleIdeology: (ideology: Ideology) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  partyCounts?: Partial<Record<Ideology, number>>;
}

export function IdeologyLegend({
  visibleIdeologies,
  onToggleIdeology,
  searchQuery,
  onSearchChange,
  partyCounts = {}
}: IdeologyLegendProps) {
  const ideologies = Object.keys(IDEOLOGY_LABELS) as Ideology[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-border/50">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-xl h-12 bg-background/50"
            />
          </div>
        </div>

        {/* Legend Title */}
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">
          Political Ideologies
        </h3>

        {/* Ideology Filters */}
        <div className="flex flex-wrap gap-3">
          {ideologies.map((ideology) => {
            const isVisible = visibleIdeologies.has(ideology);
            const count = partyCounts[ideology] || 0;
            
            return (
              <motion.div
                key={ideology}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isVisible ? "default" : "outline"}
                  onClick={() => onToggleIdeology(ideology)}
                  className={cn(
                    "rounded-full h-10 px-4 transition-all duration-300",
                    "flex items-center gap-2",
                    isVisible 
                      ? "shadow-md" 
                      : "opacity-60 hover:opacity-100"
                  )}
                  style={
                    isVisible
                      ? {
                          backgroundColor: IDEOLOGY_COLORS[ideology],
                          borderColor: IDEOLOGY_COLORS[ideology],
                          color: 'white'
                        }
                      : {
                          borderColor: IDEOLOGY_COLORS[ideology],
                          color: IDEOLOGY_COLORS[ideology]
                        }
                  }
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: IDEOLOGY_COLORS[ideology] }}
                  />
                  <span className="font-medium">
                    {IDEOLOGY_LABELS[ideology]}
                  </span>
                  {count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-5 px-2 text-xs bg-white/20 text-inherit border-0"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              ideologies.forEach(ideology => {
                if (!visibleIdeologies.has(ideology)) {
                  onToggleIdeology(ideology);
                }
              });
            }}
            className="text-xs"
          >
            Show All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              ideologies.forEach(ideology => {
                if (visibleIdeologies.has(ideology)) {
                  onToggleIdeology(ideology);
                }
              });
            }}
            className="text-xs"
          >
            Hide All
          </Button>
        </div>
      </div>
    </motion.div>
  );
}