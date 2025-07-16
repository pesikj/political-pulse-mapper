import React from 'react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PoliticalParty, IDEOLOGY_COLORS } from '@/types/political';
import { cn } from '@/lib/utils';

interface PoliticalCompassProps {
  parties: PoliticalParty[];
  onPartyClick: (party: PoliticalParty) => void;
  selectedParty?: PoliticalParty;
  className?: string;
}

export function PoliticalCompass({ 
  parties, 
  onPartyClick, 
  selectedParty,
  className 
}: PoliticalCompassProps) {
  // Transform parties data for the scatter plot
  const compassData = parties.map((party) => ({
    x: party.econFreedom,
    y: party.personalFreedom,
    name: party.shortName,
    party: party,
    fill: IDEOLOGY_COLORS[party.ideology],
  }));

  const chartConfig = {
    x: {
      label: "Economic Freedom",
    },
    y: {
      label: "Personal Freedom", 
    },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const party = data.party;
      
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-lg"
        >
          <div className="font-semibold text-card-foreground">{party.name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Economic: {party.econFreedom > 0 ? '+' : ''}{party.econFreedom}
          </div>
          <div className="text-sm text-muted-foreground">
            Personal: {party.personalFreedom > 0 ? '+' : ''}{party.personalFreedom}
          </div>
          <div className="text-xs text-muted-foreground mt-2 capitalize">
            {party.ideology}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isSelected = selectedParty?.id === payload?.party?.id;
    
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={isSelected ? 8 : 6}
        fill={payload?.fill}
        stroke={isSelected ? 'hsl(var(--primary))' : 'white'}
        strokeWidth={isSelected ? 3 : 2}
        className="cursor-pointer drop-shadow-sm"
        onClick={() => payload?.party && onPartyClick(payload.party)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: Math.random() * 0.5,
          type: "spring",
          stiffness: 300,
          damping: 20 
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "w-full h-full bg-gradient-compass rounded-3xl p-6 shadow-compass",
        className
      )}
    >
      <div className="h-full relative">
        {/* Quadrant Labels */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 left-4 text-xs font-medium text-compass-axis">
            Authoritarian Left
          </div>
          <div className="absolute top-4 right-4 text-xs font-medium text-compass-axis">
            Authoritarian Right
          </div>
          <div className="absolute bottom-4 left-4 text-xs font-medium text-compass-axis">
            Libertarian Left
          </div>
          <div className="absolute bottom-4 right-4 text-xs font-medium text-compass-axis">
            Libertarian Right
          </div>
        </div>

        {/* Axis Labels */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium text-compass-axis">
            Economic Freedom →
          </div>
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-compass-axis">
            Personal Freedom →
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
              data={compassData}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--compass-grid))"
                opacity={0.5}
              />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-10, 10]}
                tick={{ fontSize: 12, fill: 'hsl(var(--compass-axis))' }}
                tickLine={{ stroke: 'hsl(var(--compass-axis))' }}
                axisLine={{ stroke: 'hsl(var(--compass-axis))' }}
                hide
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-10, 10]}
                tick={{ fontSize: 12, fill: 'hsl(var(--compass-axis))' }}
                tickLine={{ stroke: 'hsl(var(--compass-axis))' }}
                axisLine={{ stroke: 'hsl(var(--compass-axis))' }}
                hide
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Scatter
                dataKey="y"
                shape={<CustomDot />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </motion.div>
  );
}