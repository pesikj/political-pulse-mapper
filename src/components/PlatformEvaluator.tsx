import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PoliticalParty } from '@/types/political';

interface PlatformEvaluatorProps {
  party: PoliticalParty | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PolicyAnalysis {
  category: string;
  promises: Array<{
    promise: string;
    feasibility: 'high' | 'medium' | 'low';
    evidence: string;
    sources: string[];
    factCheck: 'verified' | 'disputed' | 'unclear';
  }>;
}

export function PlatformEvaluator({ party, isOpen, onClose }: PlatformEvaluatorProps) {
  if (!party) return null;

  // Mock data - in a real app this would come from an API
  const analysisData: PolicyAnalysis[] = [
    {
      category: "Economic Policy",
      promises: [
        {
          promise: "Reduce corporate tax rate to boost business investment",
          feasibility: "medium",
          evidence: "Similar policies in neighboring countries showed mixed results with 2-4% GDP growth but also increased inequality.",
          sources: ["Economic Research Institute 2023", "Tax Policy Center Analysis"],
          factCheck: "verified"
        },
        {
          promise: "Create 1 million new jobs in renewable energy sector",
          feasibility: "high",
          evidence: "Current market trends and government investment capacity support this target over 5-year period.",
          sources: ["Green Jobs Report 2024", "Energy Transition Analysis"],
          factCheck: "verified"
        }
      ]
    },
    {
      category: "Social Policy",
      promises: [
        {
          promise: "Universal basic healthcare for all citizens",
          feasibility: "low",
          evidence: "Current budget projections show significant funding gap. Would require 25% increase in government spending.",
          sources: ["Healthcare Economics Study", "Budget Analysis 2024"],
          factCheck: "disputed"
        }
      ]
    }
  ];

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

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFactCheckIcon = (factCheck: string) => {
    switch (factCheck) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disputed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'unclear': return <Info className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const overallScore = 75; // Mock score

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
                    Independent fact-checking and feasibility analysis of political promises
                  </p>
                </div>
              </div>

              {/* Overall Score */}
              <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Overall Feasibility Score</h3>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {overallScore}/100
                  </Badge>
                </div>
                <Progress value={overallScore} className="h-3" />
                <p className="text-sm text-muted-foreground mt-3">
                  Based on economic analysis, historical precedents, and expert evaluations
                </p>
              </Card>

              {/* Policy Analysis */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Policy Breakdown</h3>
                
                {analysisData.map((category, categoryIndex) => (
                  <Card key={categoryIndex} className="p-6">
                    <h4 className="text-lg font-semibold mb-4 text-primary">
                      {category.category}
                    </h4>
                    
                    <div className="space-y-4">
                      {category.promises.map((promise, promiseIndex) => (
                        <div key={promiseIndex} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {getFactCheckIcon(promise.factCheck)}
                            <div className="flex-1">
                              <p className="font-medium mb-2">{promise.promise}</p>
                              <Badge 
                                className={`${getFeasibilityColor(promise.feasibility)} border-0`}
                              >
                                {promise.feasibility.toUpperCase()} FEASIBILITY
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="ml-7">
                            <p className="text-sm text-muted-foreground mb-3">
                              {promise.evidence}
                            </p>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                              {promise.sources.map((source, sourceIndex) => (
                                <div key={sourceIndex} className="flex items-center gap-2">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{source}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => {
                    // Mock download - in real app would generate PDF report
                    alert('Detailed report would be downloaded as PDF');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Report
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => window.open('https://factcheck.org', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Methodology
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground text-center">
                  This analysis is generated by independent fact-checking organizations and economic research institutes. 
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}