import { useState, useRef, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swipe right - knows the word
      setExitX(200);
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      // Swipe left - doesn't know the word
      setExitX(-200);
      onSwipe('left');
    }
  };

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.8,
      rotate: direction > 0 ? 25 : -25,
    }),
    center: {
      zIndex: index === 0 ? 1 : 0,
      x: 0,
      opacity: 1,
      scale: index === 0 ? 1 : 0.95,
      rotate: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotate: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? -200 : 200,
      opacity: 0,
      scale: 0.8,
      rotate: direction < 0 ? -25 : 25,
      transition: {
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 cursor-grab active:cursor-grabbing",
        !isActive && "pointer-events-none"
      )}
      style={{
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        opacity: isActive ? opacity : index === 1 ? 0.7 : 0.4,
        zIndex: isActive ? 10 : 1,
      }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={exitX}
    >
      <Card className="h-full w-full shadow-2xl border-2 select-none">
        <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center relative">
          {/* Swipe indicators */}
          <div className="absolute top-6 left-6 opacity-0 motion-safe:opacity-100">
            <motion.div
              className="flex items-center text-red-500"
              style={{
                opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]),
              }}
            >
              <XCircle className="w-8 h-8 mr-2" />
              <span className="font-bold text-lg">Need Review</span>
            </motion.div>
          </div>
          
          <div className="absolute top-6 right-6 opacity-0 motion-safe:opacity-100">
            <motion.div
              className="flex items-center text-green-500"
              style={{
                opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]),
              }}
            >
              <span className="font-bold text-lg">Know It!</span>
              <CheckCircle className="w-8 h-8 ml-2" />
            </motion.div>
          </div>

          {/* Word content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">
                {word.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 break-words">
                {word.word}
              </h1>
              <p className="text-xl text-muted-foreground font-mono mb-6 break-words">
                {word.pronunciation}
              </p>
            </div>

            {showAnswer ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted rounded-lg p-6 mb-6"
              >
                <p className="text-lg text-foreground leading-relaxed">
                  {word.definition}
                </p>
              </motion.div>
            ) : (
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  Do you know what this word means?
                </p>
                <Button 
                  onClick={onShowAnswer}
                  variant="outline"
                  size="lg"
                  className="touch-manipulation"
                >
                  Show Definition
                </Button>
              </div>
            )}
          </div>

          {/* Swipe instructions */}
          <div className="flex items-center justify-between w-full max-w-md text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-red-600 text-xs">←</span>
              </div>
              <span>Need Review</span>
            </div>
            <div className="flex items-center">
              <span>Know It!</span>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center ml-2">
                <span className="text-green-600 text-xs">→</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}