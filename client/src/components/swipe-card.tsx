import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Eye, EyeOff } from "lucide-react";
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

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
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
      <Card className={`h-full shadow-xl border-2 ${
        isDragging ? 'border-primary' : 'border-border'
      } bg-card`}>
        <CardContent className="p-8 h-full flex flex-col justify-center pt-[32px] pb-[32px]">
          {/* Word Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-3xl font-bold text-foreground">{word.word}</h2>
              {word.pronunciation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={speakWord}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {word.pronunciation && (
              <p className="text-lg text-muted-foreground font-mono">
                /{word.pronunciation}/
              </p>
            )}
            
            {word.category && (
              <Badge variant="secondary" className="mt-2">
                {word.category}
              </Badge>
            )}
          </div>

          {/* Answer Section */}
          <div className="flex-1 flex flex-col justify-center">
            {!showAnswer ? (
              <div className="text-center">
                <div className="mb-6 p-6 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <EyeOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Think about the meaning...
                  </p>
                </div>
                
                <Button 
                  onClick={onShowAnswer}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Answer
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    Meaning
                  </h3>
                  <p className="text-lg text-foreground leading-relaxed">
                    {word.definition}
                  </p>
                </div>


              </div>
            )}
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
                REVIEW
              </div>
              <div
                className="absolute top-1/2 right-8 transform -translate-y-1/2 text-green-500 font-bold text-2xl"
                style={{
                  opacity: isDragging && x.get() > 50 ? Math.min(1, x.get() / 100) : 0
                }}
              >
                KNOW
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}