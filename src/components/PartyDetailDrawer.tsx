import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Users, MapPin, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PoliticalParty, IDEOLOGY_LABELS, IDEOLOGY_COLORS } from '@/types/political';
import { cn } from '@/lib/utils';
import { PlatformEvaluator } from './PlatformEvaluator';

interface PartyDetailDrawerProps {
  party: PoliticalParty | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PartyDetailDrawer({ party, isOpen, onClose }: PartyDetailDrawerProps) {
  const [showEvaluator, setShowEvaluator] = useState(false);
  
  if (!party) return null;

  const drawerVariants = {
    hidden: { 
      x: '100%',
      opacity: 0
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const getPositionDescription = (econ: number, personal: number) => {
    const economicDesc = econ > 3 ? 'Free Market' : econ < -3 ? 'Regulated Economy' : 'Mixed Economy';
    const personalDesc = personal > 3 ? 'Libertarian' : personal < -3 ? 'Authoritarian' : 'Moderate';
    return `${economicDesc}, ${personalDesc}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-card-foreground">
                      {party.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="shrink-0 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <Badge 
                    className="mb-4"
                    style={{ 
                      backgroundColor: IDEOLOGY_COLORS[party.ideology],
                      color: 'white'
                    }}
                  >
                    {IDEOLOGY_LABELS[party.ideology]}
                  </Badge>
                </div>
              </div>

              {/* Position on Compass */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Political Position</h3>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {party.econFreedom > 0 ? '+' : ''}{party.econFreedom}
                      </div>
                      <div className="text-sm text-muted-foreground">Economic</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {party.personalFreedom > 0 ? '+' : ''}{party.personalFreedom}
                      </div>
                      <div className="text-sm text-muted-foreground">Personal</div>
                    </div>
                  </div>
                  <div className="text-sm text-center text-muted-foreground">
                    {getPositionDescription(party.econFreedom, party.personalFreedom)}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Party Details */}
              <div className="space-y-4 mb-6">
                {party.founded && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Founded in {party.founded}</span>
                  </div>
                )}
                
                {party.support && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{party.support}% public support</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {party.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="default"
                  className="w-full rounded-xl"
                  onClick={() => setShowEvaluator(true)}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Fact-Check Platform
                </Button>
                
                {party.website && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => window.open(party.website, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Official Website
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Platform Evaluator */}
          <PlatformEvaluator
            party={party}
            isOpen={showEvaluator}
            onClose={() => setShowEvaluator(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
}