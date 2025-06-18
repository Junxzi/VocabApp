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