import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-15, 0, 15]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);
  
  // Color transforms for swipe feedback
  const leftSwipeIntensity = useTransform(x, [-150, -50, 0], [1, 0.8, 0]);
  const rightSwipeIntensity = useTransform(x, [0, 50, 150], [0, 0.8, 1]);

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
        >
          {/* Front of card */}
          <motion.div
            className="absolute inset-0 backface-hidden card-front rounded-lg shadow-xl"
            style={{
              backgroundColor: isDragging 
                ? `rgba(${rightSwipeIntensity.get() > 0 ? '34, 197, 94' : leftSwipeIntensity.get() > 0 ? '239, 68, 68' : '255, 255, 255'}, ${Math.max(rightSwipeIntensity.get(), leftSwipeIntensity.get()) * 0.1 + 0.9})`
                : 'hsl(var(--card))',
              borderColor: isDragging 
                ? rightSwipeIntensity.get() > 0 ? '#22c55e' : leftSwipeIntensity.get() > 0 ? '#ef4444' : 'hsl(var(--border))'
                : 'hsl(var(--border))',
              borderWidth: '2px',
              borderStyle: 'solid'
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
            className="absolute inset-0 backface-hidden rotate-y-180 card-back rounded-lg shadow-xl"
            style={{
              backgroundColor: isDragging 
                ? `rgba(${rightSwipeIntensity.get() > 0 ? '34, 197, 94' : leftSwipeIntensity.get() > 0 ? '239, 68, 68' : '255, 255, 255'}, ${Math.max(rightSwipeIntensity.get(), leftSwipeIntensity.get()) * 0.1 + 0.9})`
                : 'hsl(var(--card))',
              borderColor: isDragging 
                ? rightSwipeIntensity.get() > 0 ? '#22c55e' : leftSwipeIntensity.get() > 0 ? '#ef4444' : 'hsl(var(--border))'
                : 'hsl(var(--border))',
              borderWidth: '2px',
              borderStyle: 'solid'
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