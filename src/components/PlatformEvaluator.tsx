import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PoliticalParty, PolicyAnalysis } from '@/types/political';
import { fetchPartyPolicies } from '@/data/databaseService';

interface PlatformEvaluatorProps {
  party: PoliticalParty | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to categorize policies based on their categories
interface CategorizedPolicy {
  category: string;
  policies: PolicyAnalysis[];
}

export function PlatformEvaluator({ party, isOpen, onClose }: PlatformEvaluatorProps) {
  if (!party) return null;

  // Fetch real policy data from database
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['partyPolicies', party.id],
    queryFn: () => fetchPartyPolicies(party.id),
    enabled: isOpen && !!party.id,
  });

  // Group policies by their primary category
  const categorizedPolicies = useMemo<CategorizedPolicy[]>(() => {
    const groups: Record<string, PolicyAnalysis[]> = {
      'Economic': [],
      'Authority': [],
      'Other': []
    };

    policies.forEach(policy => {
      const primaryCategory = policy.categories[0]?.toLowerCase() || '';

      // Categorize based on keywords
      if (primaryCategory.includes('left') || primaryCategory.includes('right')) {
        groups['Economic'].push(policy);
      } else if (primaryCategory.includes('authoritarian') || primaryCategory.includes('libertarian')) {
        groups['Authority'].push(policy);
      } else {
        groups['Other'].push(policy);
      }
    });

    // Convert to array and filter out empty categories
    return Object.entries(groups)
      .filter(([_, policies]) => policies.length > 0)
      .map(([category, policies]) => ({ category, policies }));
  }, [policies]);

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

  const getFactCheckIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryBadgeStyle = (category: string): string => {
    const lowerCategory = category.toLowerCase();

    // Economic axis colors
    if (lowerCategory.includes('far left')) {
      return 'bg-red-600 text-white border-red-600';
    }
    if (lowerCategory.includes('moderately left') || lowerCategory.includes('left')) {
      return 'bg-red-400 text-white border-red-400';
    }
    if (lowerCategory.includes('far right')) {
      return 'bg-blue-600 text-white border-blue-600';
    }
    if (lowerCategory.includes('moderately right') || lowerCategory.includes('right')) {
      return 'bg-blue-400 text-white border-blue-400';
    }

    // Authority axis colors
    if (lowerCategory.includes('very authoritarian') || lowerCategory.includes('far authoritarian')) {
      return 'bg-purple-600 text-white border-purple-600';
    }
    if (lowerCategory.includes('moderately authoritarian') || lowerCategory.includes('authoritarian')) {
      return 'bg-purple-400 text-white border-purple-400';
    }
    if (lowerCategory.includes('very libertarian') || lowerCategory.includes('far libertarian')) {
      return 'bg-green-600 text-white border-green-600';
    }
    if (lowerCategory.includes('moderately libertarian') || lowerCategory.includes('libertarian')) {
      return 'bg-green-400 text-white border-green-400';
    }

    // Centrist
    if (lowerCategory.includes('centrist') || lowerCategory.includes('center')) {
      return 'bg-gray-400 text-white border-gray-400';
    }

    // Default style
    return 'bg-muted text-muted-foreground border-border';
  };

  const getImpactBadgeStyle = (impact: string): string => {
    switch (impact) {
      case 'high':
        return 'bg-red-500 text-white border-red-500';
      case 'medium':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'low':
        return 'bg-green-500 text-white border-green-500';
      default:
        return 'bg-gray-400 text-white border-gray-400';
    }
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-card-foreground">
                      Platform Analysis: {party.name}
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
                  
                  <p className="text-muted-foreground">
                    AI-powered analysis of political platform and policy positions
                  </p>
                </div>
              </div>

              {/* Policy Analysis */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : categorizedPolicies.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                      No policy analysis data available for this party yet.
                    </p>
                  </Card>
                ) : (
                  categorizedPolicies.map((categoryGroup, categoryIndex) => (
                    <Card key={categoryIndex} className="p-6">
                      <h4 className="text-lg font-semibold mb-4 text-primary">
                        {categoryGroup.category}
                      </h4>

                      <div className="space-y-4">
                        {categoryGroup.policies.map((policy, policyIndex) => (
                          <div key={policyIndex} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-3">
                              {getFactCheckIcon(policy.impact)}
                              <div className="flex-1">
                                <p className="font-medium mb-2">{policy.shortName}</p>
                                <p className="text-sm text-muted-foreground mb-2">{policy.policyText}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge className={`text-xs ${getImpactBadgeStyle(policy.impact)}`}>
                                    {policy.impact} impact
                                  </Badge>
                                  {policy.categories.map((cat, idx) => (
                                    <Badge key={idx} className={`text-xs ${getCategoryBadgeStyle(cat)}`}>
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="ml-7 space-y-3">
                              {policy.explanation && (
                                <p className="text-sm text-muted-foreground">
                                  {policy.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground text-center">
                  This analysis is generated by AI based on party platforms and policy documents.
                  {policies.length > 0 && ` Analyzing ${policies.length} ${policies.length === 1 ? 'policy' : 'policies'}.`}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}