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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  // Calculate border color with threshold and gradient
  const getBorderColor = () => {
    if (!isDragging) return undefined;
    
    const threshold = 20; // Center threshold zone - reduced for quicker response
    const maxDistance = 80; // Maximum distance for full intensity - shorter distance
    
    if (Math.abs(dragX) <= threshold) {
      return undefined; // No highlight in center zone
    }
    
    const distance = Math.abs(dragX) - threshold;
    const intensity = Math.min(distance / (maxDistance - threshold), 1);
    
    if (dragX > threshold) {
      // Green with gradient opacity
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    } else if (dragX < -threshold) {
      // Red with gradient opacity
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
    }
    
    return undefined;
  };

  // Calculate content opacity and overlay intensity
  const getContentOpacity = () => {
    if (!isDragging) return 1;
    
    const threshold = 20;
    const maxDistance = 80;
    
    if (Math.abs(dragX) <= threshold) {
      return 1; // Full opacity in center zone
    }
    
    const distance = Math.abs(dragX) - threshold;
    const fadeIntensity = Math.min(distance / (maxDistance - threshold), 1);
    
    return 1 - (fadeIntensity * 0.8); // Fade out more aggressively to 20% opacity
  };

  const getOverlayOpacity = () => {
    if (!isDragging) return 0;
    
    const threshold = 20;
    const maxDistance = 80;
    
    if (Math.abs(dragX) <= threshold) {
      return 0; // No overlay in center zone
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
    const threshold = 80; // Reduced threshold for more responsive swiping
    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(distance) > threshold || velocity > 300) {
      const direction = distance > 0 ? 1 : -1;
      const exitX = direction * (window.innerWidth + 100);
      
      // Trigger word change immediately when finger lifts
      onSwipe(direction > 0 ? 'right' : 'left');
      
      // Slower, more natural exit animation
      animate(x, exitX, {
        type: "spring",
        stiffness: 300,
        damping: 25,
        velocity: info.velocity.x * 0.8
      });
      
      // Subtle Y movement for more natural exit
      animate(y, direction * 30, {
        type: "spring",
        stiffness: 300,
        damping: 25
      });
    } else {
      // Smooth return to center with better spring physics
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

  // Get default accent from settings
  const getDefaultAccent = (): 'us' | 'uk' | 'au' => {
    const stored = localStorage.getItem("pronunciationAccent");
    return (stored as 'us' | 'uk' | 'au') || 'us';
  };

  const speakWord = async (variant?: 'us' | 'uk' | 'au', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const accent = variant || getDefaultAccent();
    console.log(`[Swipe Card] Speaking "${word.word}" with ${accent.toUpperCase()} accent`);
    
    try {
      await azureTTS.speak(word.word, accent);
      console.log(`[Swipe Card] ✓ Azure TTS successful for "${word.word}"`);
    } catch (error) {
      console.error('[Swipe Card] Azure TTS failed:', error);
    }
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
            {/* Pronunciation button in top-left corner (uses settings preference) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                speakWord(undefined, e);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute top-4 left-4 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full transition-all duration-150 z-10 shadow-sm haptic-light active:scale-95"
              style={{ minHeight: '44px', minWidth: '44px' }}
              title="発音を聞く"
            >
              <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>

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

interface ModeSelectionProps {
  onStartStudy: (mode: 'random' | 'tag' | 'daily', selectedTag?: string) => void;
  availableTags: string[];
}

function ModeSelection({ onStartStudy, availableTags }: ModeSelectionProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Query daily challenge status
  const { data: dailyStatus } = useQuery<{ completed: boolean; date: string; stats?: any }>({
    queryKey: ["/api/vocabulary/daily-challenge/status"],
  });

  // Disable scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">学習モード選択</h1>
            <p className="text-muted-foreground">学習方法を選択してください</p>
          </div>

          <div className="space-y-4">
            {/* Daily Challenge */}
            <Button
              onClick={() => onStartStudy('daily')}
              className={`w-full h-auto p-6 flex items-center gap-4 relative overflow-hidden transition-all duration-300 ${
                dailyStatus?.completed 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 opacity-60"
                  : "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-xl border-0 hover:shadow-2xl hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
              }`}
              variant="ghost"
              disabled={dailyStatus?.completed}
            >
              {/* Animated sparkle overlay for uncompleted daily challenge */}
              {!dailyStatus?.completed && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="relative">
                    <div className="animate-pulse">
                      <Trophy className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 relative z-20">
                <div className="relative">
                  <div className={`p-2 rounded-full ${dailyStatus?.completed ? "" : "bg-white/20 backdrop-blur-sm"}`}>
                    <Calendar className={`w-6 h-6 ${dailyStatus?.completed ? "" : "text-white drop-shadow-lg"}`} />
                  </div>
                  {dailyStatus?.completed && (
                    <CheckCircle2 className="w-4 h-4 absolute -top-1 -right-1 text-green-500" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold flex items-center gap-2 text-lg">
                    <span className={dailyStatus?.completed ? "" : "text-white drop-shadow-lg"}>
                      今日の問題
                    </span>
                    {dailyStatus?.completed ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">完了</Badge>
                    ) : (
                      <Badge className="text-xs bg-yellow-400 text-yellow-900 font-bold animate-pulse">特別</Badge>
                    )}
                  </div>
                  <div className={`text-sm ${dailyStatus?.completed ? "text-muted-foreground" : "text-white/90 drop-shadow"}`}>
                    {dailyStatus?.completed 
                      ? `本日は完了済み (${dailyStatus.stats?.correctWords || 0}/${dailyStatus.stats?.totalWords || 0})`
                      : "SuperMemoアルゴリズムで選ばれた30問"
                    }
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => onStartStudy('random')}
              className="w-full h-auto p-6 flex items-center gap-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <Shuffle className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">ランダム学習</div>
                  <div className="text-sm text-muted-foreground">全語彙から30問出題</div>
                </div>
              </div>
            </Button>

            <div className="space-y-3">
              <Button
                onClick={() => selectedTag && onStartStudy('tag', selectedTag)}
                disabled={!selectedTag}
                className="w-full h-auto p-6 flex flex-col items-center gap-3"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <Tags className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">タグ別学習</div>
                    <div className="text-sm text-muted-foreground">特定のタグから出題</div>
                  </div>
                </div>
              </Button>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="学習するタグを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          
        </CardContent>
      </Card>
    </div>
  );
}

export function SwipeStudyPage() {
  const [studyMode, setStudyMode] = useState<'selection' | 'studying' | 'complete'>('selection');
  const [currentMode, setCurrentMode] = useState<'random' | 'tag' | 'daily'>('random');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCardSwiping, setIsCardSwiping] = useState(false);
  const [displayedWord, setDisplayedWord] = useState<VocabularyWord | null>(null);
  const [sessionStats, setSessionStats] = useState({
    known: 0,
    needReview: 0,
    total: 0,
  });
  const [studyWords, setStudyWords] = useState<VocabularyWord[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

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
    // Don't invalidate queries during study session to prevent refetching
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
      const autoplay = localStorage.getItem("autoplay") === "true";
      if (autoplay && shuffled[0]) {
        // Delay auto-play to allow card to render
        setTimeout(async () => {
          try {
            const { azureTTS } = await import('@/lib/azure-tts');
            const defaultAccent = (localStorage.getItem("pronunciationAccent") as 'us' | 'uk' | 'au') || 'us';
            await azureTTS.speak(shuffled[0].word, defaultAccent);
          } catch (error) {
            console.error('Auto-play failed:', error);
          }
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
      const autoplay = localStorage.getItem("autoplay") === "true";
      if (autoplay && newWord && currentIndex > 0) { // Don't auto-play the first card (handled in initial load)
        setTimeout(async () => {
          try {
            const { azureTTS } = await import('@/lib/azure-tts');
            const defaultAccent = (localStorage.getItem("pronunciationAccent") as 'us' | 'uk' | 'au') || 'us';
            await azureTTS.speak(newWord.word, defaultAccent);
          } catch (error) {
            console.error('Auto-play failed for new card:', error);
          }
        }, 300);
      }
    }
  }, [currentIndex, studyWords, isCardSwiping]);

  useEffect(() => {
    if (studyMode === 'studying') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, [studyMode]);

  const handleStartStudy = (mode: 'random' | 'tag' | 'daily', tag?: string) => {
    setCurrentMode(mode);
    if (tag) setSelectedTag(tag);
    setStudyMode('studying');
    setSessionStats({ known: 0, needReview: 0, total: 0 });
    setStudyWords([]); // Clear existing words to trigger new fetch
    setCurrentIndex(0);
    setIsCardSwiping(false);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!displayedWord) return;

    const known = direction === 'right';
    const wordId = displayedWord.id;
    const nextIndex = currentIndex + 1;
    
    // Update stats immediately
    setSessionStats(prev => ({
      ...prev,
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
      total: prev.total + 1,
    }));

    updateWordSpacedRepetitionMutation.mutate({ 
      id: wordId, 
      known 
    });

    // Show next word instantly without any delay state
    if (nextIndex < studyWords.length) {
      setCurrentIndex(nextIndex);
      setDisplayedWord(studyWords[nextIndex]);
      setShowAnswer(false);
    } else {
      // Complete daily challenge if it's daily mode
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
          <ModeSelection onStartStudy={handleStartStudy} availableTags={availableTags} />
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

  if (!studyWords.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {currentMode === 'random' ? '学習可能な単語がありません' : 
               currentMode === 'daily' ? '今日の問題が準備できませんでした' :
               `${selectedTag}タグの単語が見つかりません`}
            </p>
            <Button onClick={resetStudy}>
              モード選択に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / studyWords.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 overflow-hidden">
      {/* Safe area spacing for Dynamic Island */}
      <div className="pt-12 sm:pt-8">
        <div className="max-w-md mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {currentMode === 'random' ? 'ランダム学習' : 
                 currentMode === 'daily' ? '今日の問題' : 
                 `${selectedTag}`}
              </h1>
              {currentMode === 'random' ? (
                <Shuffle className="w-5 h-5 text-muted-foreground" />
              ) : currentMode === 'daily' ? (
                <Calendar className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Tags className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} / {studyWords.length}
            </div>
          </div>
          <Progress value={progress} className="h-3 mb-4" />
        </div>
      </div>
      {/* Card Container - positioned with Dynamic Island consideration */}
      <div className="max-w-md mx-auto h-[580px] relative mt-8">
        {/* Large counters in upper corners */}
        <div className="absolute -top-20 left-0 z-20">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full shadow-lg mt-[705px] mb-[705px]">
            <div className="text-center">
              <XCircle className="w-6 h-6 mx-auto mb-1" />
              <span className="text-lg font-bold">{sessionStats.needReview}</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-20 right-0 z-20">
          <div className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full shadow-lg mt-[705px] mb-[705px]">
            <div className="text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
              <span className="text-lg font-bold">{sessionStats.known}</span>
            </div>
          </div>
        </div>
        
        {/* Background blank card frame for smoother transitions */}
        <div className="absolute inset-0 bg-card border-2 border-border/30 rounded-2xl shadow-lg opacity-50 z-0"></div>
        
        {displayedWord && (
          <StudyCard
            key={`card-${currentIndex}-${displayedWord.id}`}
            word={displayedWord}
            onSwipe={handleSwipe}
            onTap={handleCardTap}
            showAnswer={showAnswer}
            isVisible={true}
            zIndex={10}
          />
        )}
      </div>
      
      {/* Back button at bottom center during study */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={resetStudy}
          variant="outline"
          size="lg"
          className="bg-background/80 backdrop-blur-sm border-2 hover:bg-muted/80 transition-all duration-200 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          戻る
        </Button>
      </div>
    </div>
  );
}