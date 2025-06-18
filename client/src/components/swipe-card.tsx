import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
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
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-30, 0, 30]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (!isActive) return;

    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const speakWord = (accent: 'us' | 'uk' | 'au' = 'us') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      switch (accent) {
        case 'us':
          utterance.lang = 'en-US';
          break;
        case 'uk':
          utterance.lang = 'en-GB';
          break;
        case 'au':
          utterance.lang = 'en-AU';
          break;
      }
      speechSynthesis.speak(utterance);
    }
  };

  const cardVariants = {
    active: { 
      scale: 1, 
      zIndex: 2,
      y: 0,
    },
    inactive: { 
      scale: 0.95, 
      zIndex: 1,
      y: 10,
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, opacity }}
      variants={cardVariants}
      animate={isActive ? "active" : "inactive"}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      <div className="relative w-full h-full perspective-1000">
        <motion.div
          className="relative w-full h-full transform-style-preserve-3d cursor-pointer"
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onShowAnswer}
          style={{
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {/* Front of card */}
          <Card className={`absolute inset-0 shadow-xl border-2 backface-hidden ${
            isDragging ? 'border-primary' : 'border-border'
          } bg-card`}>
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="text-center mt-12">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-foreground mb-3">{word.word}</h2>
                  {word.partOfSpeech && (
                    <Badge variant="outline" className="text-sm mb-2">
                      {word.partOfSpeech}
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
                  {word.category && (
                    <Badge variant="secondary">
                      {word.category}
                    </Badge>
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
                  <div className="mb-6 p-6 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <EyeOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {t('tapToSeeMeaning')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-4"></div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card className={`absolute inset-0 shadow-xl border-2 backface-hidden rotate-y-180 ${
            isDragging ? 'border-primary' : 'border-border'
          } bg-card`}>
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="text-center mt-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">{word.word}</h2>
                <div className="flex items-center justify-center gap-2">
                  {word.category && (
                    <Badge variant="secondary">
                      {word.category}
                    </Badge>
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
                  <p className="text-sm text-muted-foreground">
                    {t('tapAgainToFlipBack')}
                  </p>
                </div>
              </div>

              <div className="h-4"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Swipe Indicators (only show when dragging) */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-8 transform -translate-y-1/2 text-red-500 font-bold text-2xl"
            style={{
              opacity: isDragging && x.get() < -50 ? Math.min(1, Math.abs(x.get()) / 100) : 0
            }}
          >
            {t('review')}
          </div>
          <div
            className="absolute top-1/2 right-8 transform -translate-y-1/2 text-green-500 font-bold text-2xl"
            style={{
              opacity: isDragging && x.get() > 50 ? Math.min(1, x.get() / 100) : 0
            }}
          >
            {t('know')}
          </div>
        </div>
      )}
    </motion.div>
  );
}