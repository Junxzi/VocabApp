import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedPartOfSpeech } from "@/lib/utils";
import type { VocabularyWord } from "@shared/schema";

interface SwipeCardProps {
  word: VocabularyWord;
  onSwipe: (direction: 'left' | 'right') => void;
  onShowAnswer: () => void;
  showAnswer: boolean;
  isActive: boolean;
  index: number;
}

export function SwipeCard({ 
  word, 
  onSwipe, 
  onShowAnswer, 
  showAnswer, 
  isActive, 
  index 
}: SwipeCardProps) {
  const { t, language } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-100, 0, 100], [-15, 0, 15]);
  const opacity = useTransform(x, [-100, -60, 0, 60, 100], [0, 1, 1, 1, 0]);
  
  // Color transforms for swipe feedback - more responsive to lighter swipes
  const leftSwipeIntensity = useTransform(x, [-100, -30, 0], [1, 0.8, 0]);
  const rightSwipeIntensity = useTransform(x, [0, 30, 100], [0, 0.8, 1]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (!isActive) return;

    const velocity = Math.abs(info.velocity.x);
    const distance = Math.abs(info.offset.x);
    
    // Very sensitive detection for light "シュッ" gestures
    const shouldSwipe = 
      distance > 40 || // Light distance
      (velocity > 200 && distance > 20) || // Quick flick with minimal distance
      (velocity > 100 && distance > 30); // Medium flick
    
    if (shouldSwipe) {
      if (info.offset.x > 0) {
        onSwipe('right');
      } else {
        onSwipe('left');
      }
    }
    
    // Reset drag state after a short delay to prevent tap interference
    setTimeout(() => setDragStarted(false), 100);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setDragStarted(true);
  };

  const speakWord = (variant: 'us' | 'uk') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      const voices = speechSynthesis.getVoices();
      
      const voice = voices.find(v => 
        variant === 'us' ? v.lang.startsWith('en-US') : v.lang.startsWith('en-GB')
      );
      
      if (voice) utterance.voice = voice;
      speechSynthesis.speak(utterance);
    }
  };

  const cardVariants = {
    active: { 
      scale: 1, 
      zIndex: 10,
      y: 0,
    },
    inactive: { 
      scale: 0.95, 
      zIndex: 1,
      y: 10,
    }
  };

  // Border color and width based on swipe direction
  const getBorderStyle = () => {
    if (!isDragging) {
      return {
        borderColor: 'hsl(var(--border))',
        borderWidth: '1px',
        boxShadow: 'none'
      };
    }
    
    const rightIntensity = rightSwipeIntensity.get();
    const leftIntensity = leftSwipeIntensity.get();
    
    if (rightIntensity > 0) {
      return {
        borderColor: '#22c55e',
        borderWidth: `${Math.max(2, rightIntensity * 4)}px`,
        boxShadow: `0 0 ${rightIntensity * 20}px rgba(34, 197, 94, ${rightIntensity * 0.3})`
      };
    } else if (leftIntensity > 0) {
      return {
        borderColor: '#ef4444',
        borderWidth: `${Math.max(2, leftIntensity * 4)}px`,
        boxShadow: `0 0 ${leftIntensity * 20}px rgba(239, 68, 68, ${leftIntensity * 0.3})`
      };
    }
    
    return {
      borderColor: 'hsl(var(--border))',
      borderWidth: '1px',
      boxShadow: 'none'
    };
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, opacity }}
      variants={cardVariants}
      animate={isActive ? "active" : "inactive"}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
      whileDrag={{ 
        scale: 1.02, 
        cursor: "grabbing",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
        transition: { duration: 0.1 }
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative w-full h-full perspective-1000">
        <motion.div
          className="relative w-full h-full transform-style-preserve-3d cursor-pointer"
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={(e) => {
            // Only trigger tap if not dragging and drag wasn't recently started
            if (!isDragging && !dragStarted) {
              onShowAnswer();
            }
          }}
        >
          {/* Front of card */}
          <motion.div
            className="absolute inset-0 backface-hidden card-front rounded-lg shadow-xl bg-card"
            style={{
              ...getBorderStyle(),
              borderStyle: 'solid',
              transition: 'all 0.1s ease-out'
            }}
          >
            <Card className="h-full border-0 bg-transparent shadow-none">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="text-center mt-12">
                  <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-foreground mb-3">{word.word}</h2>
                    {word.partOfSpeech && (
                      <Badge variant="outline" className="text-sm mb-2">
                        {getLocalizedPartOfSpeech(word.partOfSpeech, language)}
                      </Badge>
                    )}
                  </div>
                  
                  {word.pronunciation && (
                    <div className="mb-4">
                      <p className="text-lg text-muted-foreground font-mono mb-2">
                        /{word.pronunciation}/
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord('us');
                          }}
                          className="px-3 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors"
                        >
                          🇺🇸 US
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord('uk');
                          }}
                          className="px-3 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors"
                        >
                          🇬🇧 UK
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {word.tags && word.tags.length > 0 && (
                      word.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    )}
                    {word.difficulty && (
                      <Badge 
                        variant={word.difficulty >= 3 ? "destructive" : "default"}
                      >
                        {t('rank')} {word.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center my-8">
                  <div className="text-center">
                    <div className="mb-6 p-6 bg-muted/30 rounded-lg">
                      <EyeOff className="w-16 h-16 mx-auto text-muted-foreground/60" />
                    </div>
                  </div>
                </div>

                <div className="h-4"></div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Back of card */}
          <motion.div
            className="absolute inset-0 backface-hidden rotate-y-180 card-back rounded-lg shadow-xl bg-card"
            style={{
              ...getBorderStyle(),
              borderStyle: 'solid',
              transition: 'all 0.1s ease-out'
            }}
          >
            <Card className="h-full border-0 bg-transparent shadow-none">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="text-center mt-12">
                  <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-foreground mb-3">{word.word}</h2>
                    {word.partOfSpeech && (
                      <Badge variant="outline" className="text-sm mb-2">
                        {getLocalizedPartOfSpeech(word.partOfSpeech, language)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {word.tags && word.tags.length > 0 && (
                      word.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    )}
                    {word.difficulty && (
                      <Badge 
                        variant={word.difficulty >= 3 ? "destructive" : "default"}
                      >
                        {t('rank')} {word.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center my-8">
                  <div className="text-center">
                    <div className="mb-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {t('meaning')}
                      </h3>
                      <p className="text-lg text-foreground leading-relaxed">
                        {word.definition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-4"></div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}