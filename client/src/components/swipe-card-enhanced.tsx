import { useState, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
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
  
  // Create motion values with unique instances for each card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  
  // Reset state when component mounts or becomes active
  useEffect(() => {
    x.set(0);
    setIsDragging(false);
    setDragStarted(false);
  }, [word.id]);
  
  // Additional reset when isActive changes
  useEffect(() => {
    if (isActive) {
      setIsDragging(false);
      setDragStarted(false);
    }
  }, [isActive]);
  
  // Threshold for auto-swipe (no visual highlighting)
  const swipeThreshold = 100;

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (!isActive) return;

    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    // Auto-swipe if past threshold or high velocity
    const shouldAutoSwipe = Math.abs(distance) > swipeThreshold || velocity > 200;
    
    if (shouldAutoSwipe) {
      // Animate card flying off screen
      const direction = distance > 0 ? 1 : -1;
      const exitX = direction * window.innerWidth * 1.2;
      
      animate(x, exitX, {
        type: "spring",
        stiffness: 200,
        damping: 15,
        velocity: info.velocity.x
      });
      
      // Trigger swipe callback immediately
      if (distance > 0) {
        onSwipe('right');
      } else {
        onSwipe('left');
      }
    } else {
      // Return to center if not past threshold
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 35
      });
    }
    
    setTimeout(() => setDragStarted(false), 50);
  };

  const handleDragStart = (event: any) => {
    if (!isActive) return;
    setIsDragging(true);
    setDragStarted(true);
  };

  const speakWord = (variant: 'us' | 'uk') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      
      const voices = speechSynthesis.getVoices();
      if (variant === 'us') {
        const usVoice = voices.find(voice => 
          voice.lang.startsWith('en-US') || voice.name.includes('US')
        );
        if (usVoice) utterance.voice = usVoice;
      } else if (variant === 'uk') {
        const ukVoice = voices.find(voice => 
          voice.lang.startsWith('en-GB') || voice.name.includes('UK')
        );
        if (ukVoice) utterance.voice = ukVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  const cardVariants = {
    active: {
      scale: 1,
      opacity: 1,
      zIndex: 50,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    inactive: {
      scale: Math.max(0.9, 1 - index * 0.05),
      opacity: Math.max(0.3, 1 - index * 0.15),
      zIndex: Math.max(0, 40 - index),
      y: index * 10,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      variants={cardVariants}
      animate={isActive ? "active" : "inactive"}
      drag={isActive ? "x" : false}
      dragConstraints={false}
      dragElastic={0.2}
      dragMomentum={true}
      dragPropagation={false}
      dragSnapToOrigin={false}
      whileDrag={{ 
        scale: 1.08, 
        cursor: "grabbing",
        boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)",
        transition: { duration: 0.1, ease: "easeOut" }
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30
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
            className="absolute inset-0 backface-hidden card-front rounded-lg shadow-xl bg-card border border-border"
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
                          <Volume2 className="w-3 h-3 inline mr-1" />
                          US
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord('uk');
                          }}
                          className="px-3 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors"
                        >
                          <Volume2 className="w-3 h-3 inline mr-1" />
                          UK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center mt-6">
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    {showAnswer ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {t('tapCardToSeeMeaning')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Back of card */}
          <motion.div
            className="absolute inset-0 backface-hidden rotate-y-180 card-back rounded-lg shadow-xl bg-card border border-border"
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
                  
                  <div className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {word.definition}
                  </div>
                  
                  {word.exampleSentences && (
                    <div className="space-y-3 text-sm">
                      {word.exampleSentences.split('|||').slice(0, 2).map((sentence, index) => {
                        const [english, japanese] = sentence.split('###');
                        return (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-foreground italic mb-1">{english?.trim()}</p>
                            {japanese && (
                              <p className="text-muted-foreground text-xs">{japanese.trim()}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center mt-6">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      ← {t('notKnown')}
                    </span>
                    <span className="flex items-center gap-1">
                      {t('known')} →
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}