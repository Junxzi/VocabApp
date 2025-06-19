import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedPartOfSpeech, cn } from "@/lib/utils";
import { azureTTS } from "@/lib/azure-tts";
import { Volume2, Eye, EyeOff, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Shuffle, Tags, Calendar, Trophy, Clock } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import type { VocabularyWord } from "@shared/schema";

interface StudyCardProps {
  word: VocabularyWord;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap: () => void;
  showAnswer: boolean;
  isVisible: boolean;
  zIndex: number;
}

function StudyCard({ word, onSwipe, onTap, showAnswer, isVisible, zIndex }: StudyCardProps) {
  const { t, language } = useLanguage();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-15, 0, 15]);
  const opacity = useTransform(x, [-150, -75, 0, 75, 150], [0.6, 0.9, 1, 0.9, 0.6]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  // Simple audio playback system for swipe cards
  const playWordAudio = async (forcePlay: boolean = false) => {
    const accent = (localStorage.getItem("pronunciationAccent") as 'us' | 'uk' | 'au') || 'us';
    const autoplayEnabled = localStorage.getItem("autoplay") === "true";
    
    // Only auto-play if enabled, but always play if manually triggered
    if (!forcePlay && !autoplayEnabled) {
      console.log(`[Audio] Skipping auto-play - disabled in settings`);
      return;
    }
    
    const playType = forcePlay ? 'Manual' : 'Auto';
    console.log(`[${playType} Audio] Playing "${word.word}" with ${accent.toUpperCase()} accent`);
    
    try {
      await azureTTS.speak(word.word, accent);
      console.log(`[${playType} Audio] ✓ Playback completed`);
    } catch (error) {
      console.error(`[${playType} Audio] ❌ Azure TTS failed:`, error);
      
      // Simple browser TTS fallback
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(word.word);
          utterance.rate = 0.8;
          utterance.lang = accent === 'uk' ? 'en-GB' : accent === 'au' ? 'en-AU' : 'en-US';
          speechSynthesis.speak(utterance);
          console.log(`[${playType} Audio] ✓ Browser fallback completed`);
        }, 100);
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  // Calculate border color with threshold and gradient
  const getBorderColor = () => {
    if (!isDragging) return undefined;
    
    const threshold = 20;
    const maxDistance = 80;
    
    if (Math.abs(dragX) <= threshold) {
      return undefined;
    }
    
    const distance = Math.abs(dragX) - threshold;
    const intensity = Math.min(distance / (maxDistance - threshold), 1);
    
    if (dragX > threshold) {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    } else if (dragX < -threshold) {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
    }
    
    return undefined;
  };

  const getContentOpacity = () => {
    if (!isDragging) return 1;
    
    const threshold = 20;
    const maxDistance = 80;
    
    if (Math.abs(dragX) <= threshold) {
      return 1;
    }
    
    const distance = Math.abs(dragX) - threshold;
    const fadeIntensity = Math.min(distance / (maxDistance - threshold), 1);
    
    return 1 - (fadeIntensity * 0.8);
  };

  const getOverlayOpacity = () => {
    if (!isDragging) return 0;
    
    const threshold = 20;
    const maxDistance = 80;
    
    if (Math.abs(dragX) <= threshold) {
      return 0;
    }
    
    const distance = Math.abs(dragX) - threshold;
    return Math.min(distance / (maxDistance - threshold), 1);
  };

  const getOverlayText = () => {
    if (dragX > 20) return "Know it!";
    if (dragX < -20) return "Still learning";
    return "";
  };

  const getOverlayColor = () => {
    if (dragX > 20) return "text-green-500";
    if (dragX < -20) return "text-red-500";
    return "";
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    setDragX(0);
    const threshold = 80;
    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(distance) > threshold || velocity > 300) {
      const direction = distance > 0 ? 1 : -1;
      const exitX = direction * (window.innerWidth + 100);
      
      onSwipe(direction > 0 ? 'right' : 'left');
      
      animate(x, exitX, {
        type: "spring",
        stiffness: 300,
        damping: 25,
        velocity: info.velocity.x * 0.8
      });
      
      animate(y, direction * 30, {
        type: "spring",
        stiffness: 300,
        damping: 25
      });
    } else {
      animate(x, 0, {
        type: "spring",
        stiffness: 800,
        damping: 40
      });
      animate(y, 0, {
        type: "spring",
        stiffness: 800,
        damping: 40
      });
    }
  };

  const handleCardTap = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    onTap();
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer"
      style={{ 
        x, 
        y,
        rotate, 
        opacity,
        scale,
        zIndex,
        touchAction: 'none'
      }}
      drag
      dragConstraints={{ left: -400, right: 400, top: -60, bottom: 60 }}
      dragElastic={0.15}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        scale: 1.03,
        transition: { duration: 0.15, ease: "easeOut" }
      }}
      onClick={handleCardTap}
    >
      <motion.div
        className="h-full relative"
        animate={{ rotateY: showAnswer ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <Card className="absolute inset-0 bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl" 
              style={{ 
                backfaceVisibility: 'hidden',
                borderColor: getBorderColor()
              }}>
          <CardContent className="p-6 h-full flex flex-col justify-center relative">
            {/* Audio playback button - rebuilt from scratch */}
            <div
              className="absolute top-4 left-4 w-12 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg"
              style={{ zIndex: 9999 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[NEW AUDIO] Manual button clicked!');
                playWordAudio(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title="単語を再生"
            >
              <Volume2 className="w-6 h-6 text-white" />
            </div>

            {/* Content with fading opacity */}
            <div className="text-center" style={{ opacity: getContentOpacity() }}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-6">{word.word}</h2>
                
                {/* US pronunciation in small grey text */}
                {word.pronunciationUs && (
                  <div className="text-sm text-muted-foreground font-mono mb-3">
                    /{word.pronunciationUs}/
                  </div>
                )}
                
                {/* Part of speech moved down */}
                {word.partOfSpeech && (
                  <Badge variant="outline" className="text-sm">
                    {getLocalizedPartOfSpeech(word.partOfSpeech, language)}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Overlay text that appears when dragging */}
            {getOverlayText() && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: getOverlayOpacity() }}
              >
                <h1 className={`text-4xl font-black ${getOverlayColor()}`}>
                  {getOverlayText()}
                </h1>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className="absolute inset-0 bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl" 
              style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)',
                borderColor: getBorderColor()
              }}>
          <CardContent className="p-6 h-full flex items-center justify-center relative">
            {/* Japanese definition prominently displayed in center */}
            <div className="text-center" style={{ opacity: getContentOpacity() }}>
              <h1 className="text-4xl font-bold text-black dark:text-white leading-relaxed px-4">
                {word.definition}
              </h1>
            </div>
            
            {/* Overlay text that appears when dragging */}
            {getOverlayText() && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: getOverlayOpacity() }}
              >
                <h1 className={`text-4xl font-black ${getOverlayColor()}`}>
                  {getOverlayText()}
                </h1>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { SwipeStudyPage };

function SwipeStudyPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [studyMode, setStudyMode] = useState<'selection' | 'studying' | 'complete'>('selection');
  const [currentMode, setCurrentMode] = useState<'random' | 'tag' | 'daily'>('random');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [studyWords, setStudyWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState<VocabularyWord | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, needReview: 0, total: 0 });
  const [isCardSwiping, setIsCardSwiping] = useState(false);

  const { data: allWords = [] } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary"],
  });

  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: currentMode === 'random' 
      ? ["/api/vocabulary/random/30"] 
      : currentMode === 'daily'
      ? ["/api/vocabulary/daily-challenge"]
      : ["/api/vocabulary/tag", selectedTag],
    enabled: studyMode === 'studying' && studyWords.length === 0,
  });

  const updateWordSpacedRepetitionMutation = useMutation({
    mutationFn: async ({ id, known }: { id: number; known: boolean }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, { known });
    },
  });

  const completeDailyChallengeMutation = useMutation({
    mutationFn: async (stats: { totalWords: number; correctWords: number; accuracy: number }) => {
      await apiRequest("POST", "/api/vocabulary/daily-challenge/complete", stats);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/daily-challenge/status"] });
    },
  });

  const availableTags = Array.from(
    new Set(
      allWords
        .flatMap(word => word.tags || [])
        .filter(tag => tag && tag.trim() !== '')
    )
  ).sort();

  // Simple auto-play function
  const playWordAudio = async (forcePlay: boolean = false) => {
    if (!displayedWord) return;
    
    const accent = (localStorage.getItem("pronunciationAccent") as 'us' | 'uk' | 'au') || 'us';
    const autoplayEnabled = localStorage.getItem("autoplay") === "true";
    
    if (!forcePlay && !autoplayEnabled) {
      console.log(`[Audio] Skipping auto-play - disabled in settings`);
      return;
    }
    
    const playType = forcePlay ? 'Manual' : 'Auto';
    console.log(`[${playType} Audio] Playing "${displayedWord.word}" with ${accent.toUpperCase()} accent`);
    
    try {
      await azureTTS.speak(displayedWord.word, accent);
      console.log(`[${playType} Audio] ✓ Playback completed`);
    } catch (error) {
      console.error(`[${playType} Audio] ❌ Azure TTS failed:`, error);
    }
  };

  useEffect(() => {
    if (words.length > 0 && studyMode === 'studying') {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setStudyWords(shuffled);
      setSessionStats(prev => ({ ...prev, total: shuffled.length }));
      setCurrentIndex(0);
      setDisplayedWord(shuffled[0]);
      setShowAnswer(false);
      setIsCardSwiping(false);
      
      // Auto-play pronunciation if enabled
      if (shuffled[0]) {
        setTimeout(() => {
          playWordAudio(false); // Auto-play (not forced)
        }, 500);
      }
    }
  }, [words, studyMode]);

  // Update displayed word when current index changes
  useEffect(() => {
    if (studyWords.length > 0 && currentIndex < studyWords.length && !isCardSwiping) {
      const newWord = studyWords[currentIndex];
      setDisplayedWord(newWord);
      
      // Auto-play pronunciation if enabled for new cards
      if (newWord && currentIndex > 0) {
        setTimeout(() => {
          playWordAudio(false); // Auto-play (not forced)
        }, 300);
      }
    }
  }, [currentIndex, studyWords, isCardSwiping]);

  const handleStartStudy = (mode: 'random' | 'tag' | 'daily', tag?: string) => {
    setCurrentMode(mode);
    if (mode === 'tag' && tag) {
      setSelectedTag(tag);
    }
    setStudyMode('studying');
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ known: 0, needReview: 0, total: 0 });
    setStudyWords([]);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!displayedWord) return;
    
    const known = direction === 'right';
    const wordId = displayedWord.id;
    const nextIndex = currentIndex + 1;
    
    setIsCardSwiping(true);
    
    setTimeout(() => {
      setIsCardSwiping(false);
    }, 300);

    setSessionStats(prev => ({
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
      total: prev.total + 1,
    }));

    updateWordSpacedRepetitionMutation.mutate({ 
      id: wordId, 
      known 
    });

    if (nextIndex < studyWords.length) {
      setCurrentIndex(nextIndex);
      setDisplayedWord(studyWords[nextIndex]);
      setShowAnswer(false);
    } else {
      if (currentMode === 'daily') {
        const accuracy = sessionStats.total > 0 ? (sessionStats.known / sessionStats.total) * 100 : 0;
        completeDailyChallengeMutation.mutate({
          totalWords: sessionStats.total,
          correctWords: sessionStats.known,
          accuracy
        });
      }
      setStudyMode('complete');
    }
  };

  const handleCardTap = () => {
    setShowAnswer(!showAnswer);
  };

  const resetStudy = () => {
    setStudyMode('selection');
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ known: 0, needReview: 0, total: 0 });
    setStudyWords([]);
  };

  if (studyMode === 'selection') {
    return (
      <>
        <div className="pb-20">
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-6">学習モード選択</h1>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => handleStartStudy('random')}
                    className="w-full h-16 text-lg"
                    variant="outline"
                  >
                    <Shuffle className="w-6 h-6 mr-3" />
                    ランダム学習 (30問)
                  </Button>
                  
                  <Button 
                    onClick={() => handleStartStudy('daily')}
                    className="w-full h-16 text-lg"
                    variant="outline"
                  >
                    <Calendar className="w-6 h-6 mr-3" />
                    今日の問題
                  </Button>
                  
                  {availableTags.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">タグ別学習:</label>
                      <div className="space-y-2">
                        {availableTags.slice(0, 5).map(tag => (
                          <Button
                            key={tag}
                            onClick={() => handleStartStudy('tag', tag)}
                            className="w-full h-12"
                            variant="outline"
                          >
                            <Tags className="w-4 h-4 mr-2" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">学習カードを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (studyMode === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">学習完了！</h2>
              <p className="text-muted-foreground">
                {currentMode === 'random' ? 'ランダム学習' : 
                 currentMode === 'daily' ? '今日の問題' : 
                 `${selectedTag}タグ学習`}が完了しました
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sessionStats.known}</div>
                <div className="text-sm text-green-600">習得済み</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{sessionStats.needReview}</div>
                <div className="text-sm text-red-600">要復習</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={resetStudy} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                別の学習
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/vocabulary'}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-background/90 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={resetStudy}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {studyWords.length}
          </div>
          <Progress 
            value={((currentIndex + 1) / studyWords.length) * 100} 
            className="w-32 h-2 mt-1"
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          {sessionStats.known}✓ / {sessionStats.needReview}✗
        </div>
      </div>

      {/* Cards Container */}
      <div className="absolute inset-0 p-4 pt-20">
        <div className="relative w-full h-full max-w-md mx-auto">
          {displayedWord && (
            <StudyCard
              key={`${currentIndex}-${displayedWord.id}`}
              word={displayedWord}
              onSwipe={handleSwipe}
              onTap={handleCardTap}
              showAnswer={showAnswer}
              isVisible={true}
              zIndex={1}
            />
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-0 right-0 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center text-sm text-muted-foreground bg-background/90 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>もう一度</span>
            </div>
            <div className="flex items-center gap-2">
              <span>習得済み</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}