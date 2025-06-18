import { useState, useEffect } from "react";
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
import { Volume2, Eye, EyeOff, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Shuffle, Tags } from "lucide-react";
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
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
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
    const threshold = 100;
    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(distance) > threshold || velocity > 200) {
      const direction = distance > 0 ? 1 : -1;
      const exitX = direction * (window.innerWidth + 200);
      
      // Trigger word change immediately when finger lifts
      onSwipe(direction > 0 ? 'right' : 'left');
      
      animate(x, exitX, {
        type: "spring",
        stiffness: 400,
        damping: 25,
        velocity: info.velocity.x
      });
    } else {
      // Return to center position for both x and y
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 35
      });
      animate(y, 0, {
        type: "spring",
        stiffness: 500,
        damping: 35
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

  const speakWord = (variant: 'us' | 'uk', e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer"
      style={{ 
        x, 
        y,
        rotate, 
        opacity,
        zIndex,
        scale: 1
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        scale: 1.05,
        cursor: "grabbing",
        transition: { duration: 0.1 }
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
              
              {word.pronunciation && (
                <div className="mb-6">
                  <p className="text-xl text-muted-foreground font-mono mb-3">
                    /{word.pronunciation}/
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => speakWord('us', e)}
                      className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      US
                    </button>
                    <button
                      onClick={(e) => speakWord('uk', e)}
                      className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      UK
                    </button>
                  </div>
                </div>
              )}
              
              
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
  onStartStudy: (mode: 'random' | 'tag', selectedTag?: string) => void;
  availableTags: string[];
}

function ModeSelection({ onStartStudy, availableTags }: ModeSelectionProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">学習モード選択</h1>
            <p className="text-muted-foreground">学習方法を選択してください</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => onStartStudy('random')}
              className="w-full h-auto p-6 flex flex-col items-center gap-3"
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

          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/vocabulary'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              単語帳に戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SwipeStudyPage() {
  const [studyMode, setStudyMode] = useState<'selection' | 'studying' | 'complete'>('selection');
  const [currentMode, setCurrentMode] = useState<'random' | 'tag'>('random');
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
      : ["/api/vocabulary/tag", selectedTag],
    enabled: studyMode === 'studying' && studyWords.length === 0,
  });

  const updateWordSpacedRepetitionMutation = useMutation({
    mutationFn: async ({ id, known }: { id: number; known: boolean }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, { known });
    },
    // Don't invalidate queries during study session to prevent refetching
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
    }
  }, [words, studyMode]);

  // Update displayed word when current index changes
  useEffect(() => {
    if (studyWords.length > 0 && currentIndex < studyWords.length && !isCardSwiping) {
      setDisplayedWord(studyWords[currentIndex]);
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

  const handleStartStudy = (mode: 'random' | 'tag', tag?: string) => {
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
    return <ModeSelection onStartStudy={handleStartStudy} availableTags={availableTags} />;
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
                {currentMode === 'random' ? 'ランダム学習' : `${selectedTag}タグ学習`}が完了しました
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
              {currentMode === 'random' ? '学習可能な単語がありません' : `${selectedTag}タグの単語が見つかりません`}
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
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {currentMode === 'random' ? 'ランダム学習' : `${selectedTag}`}
            </h1>
            {currentMode === 'random' ? (
              <Shuffle className="w-5 h-5 text-muted-foreground" />
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

      {/* Card Container - positioned lower for thumb accessibility */}
      <div className="max-w-md mx-auto h-[600px] relative mt-20">
        {/* Large counters in upper corners */}
        <div className="absolute -top-12 left-0 z-20">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full shadow-lg">
            <div className="text-center">
              <XCircle className="w-6 h-6 mx-auto mb-1" />
              <span className="text-lg font-bold">{sessionStats.needReview}</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-12 right-0 z-20">
          <div className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full shadow-lg">
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
    </div>
  );
}