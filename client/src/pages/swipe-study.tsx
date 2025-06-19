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
import { getLocalizedPartOfSpeech } from "@/lib/utils";
import { azureTTS } from "@/lib/azure-tts";
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
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(distance) > threshold || velocity > 200) {
      const direction = distance > 0 ? 1 : -1;
      const exitX = direction * window.innerWidth;
      
      animate(x, exitX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
        velocity: info.velocity.x
      }).then(() => {
        onSwipe(direction > 0 ? 'right' : 'left');
      });
    } else {
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 35
      });
    }
  };

  const handleCardTap = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      onTap();
      setIsFlipping(false);
    }, 150);
  };

  const speakWord = async (variant: 'us' | 'uk' | 'au', e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Speaking "${word.word}" with ${variant.toUpperCase()} accent`);
    
    try {
      await azureTTS.speak(word.word, variant);
      console.log(`✓ Azure TTS successful for "${word.word}"`);
    } catch (error) {
      console.error(`Azure TTS failed for "${word.word}":`, error);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer"
      style={{ 
        x, 
        rotate, 
        opacity,
        zIndex,
        scale: isVisible ? 1 : 0.95
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
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
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <Card className="absolute inset-0 bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl" 
              style={{ backfaceVisibility: 'hidden' }}>
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">{word.word}</h2>
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
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => speakWord('us', e)}
                      className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      US
                    </button>
                    <button
                      onClick={(e) => speakWord('uk', e)}
                      className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      UK
                    </button>
                    <button
                      onClick={(e) => speakWord('au', e)}
                      className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      AU
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-auto">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  {t('tapCardToSeeMeaning')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className="absolute inset-0 bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl" 
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-4">{word.word}</h2>
                {word.partOfSpeech && (
                  <Badge variant="outline" className="text-sm mb-4">
                    {getLocalizedPartOfSpeech(word.partOfSpeech, language)}
                  </Badge>
                )}
              </div>
              
              <div className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {word.definition}
              </div>
              
              {word.exampleSentences && (
                <div className="space-y-4 mb-8">
                  {word.exampleSentences.split('|||').slice(0, 2).map((sentence, index) => {
                    const [english, japanese] = sentence.split('###');
                    return (
                      <div key={index} className="p-4 bg-muted/50 rounded-xl text-left">
                        <p className="text-foreground italic mb-2">{english?.trim()}</p>
                        {japanese && (
                          <p className="text-muted-foreground text-sm">{japanese.trim()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="mt-auto">
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-2">
                    ← {t('notKnown')}
                  </span>
                  <span className="flex items-center gap-2">
                    {t('known')} →
                  </span>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <EyeOff className="w-4 h-4 mr-2" />
                  スワイプして評価
                </Badge>
              </div>
            </div>
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
  const { t } = useLanguage();

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

  const { data: words = [], isLoading, refetch } = useQuery<VocabularyWord[]>({
    queryKey: currentMode === 'random' 
      ? ["/api/vocabulary/random/30"] 
      : ["/api/vocabulary/tag", selectedTag],
    enabled: studyMode === 'studying',
  });

  const updateWordSpacedRepetitionMutation = useMutation({
    mutationFn: async ({ id, known }: { id: number; known: boolean }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, { known });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/random/30"] });
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
      setShowAnswer(false);
    }
  }, [words, studyMode]);

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
    refetch();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentWord = studyWords[currentIndex];
    if (!currentWord) return;

    const known = direction === 'right';
    
    setSessionStats(prev => ({
      ...prev,
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
    }));

    updateWordSpacedRepetitionMutation.mutate({ 
      id: currentWord.id, 
      known 
    });

    setTimeout(() => {
      if (currentIndex < studyWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setStudyMode('complete');
      }
    }, 300);
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
  const currentWord = studyWords[currentIndex];

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
        
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            <span>{sessionStats.known}</span>
          </div>
          <div className="flex items-center text-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            <span>{sessionStats.needReview}</span>
          </div>
        </div>
      </div>

      {/* Card Container - positioned lower for thumb accessibility */}
      <div className="max-w-md mx-auto h-[450px] relative mt-20">
        {currentWord && (
          <StudyCard
            key={`card-${currentIndex}-${currentWord.id}`}
            word={currentWord}
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