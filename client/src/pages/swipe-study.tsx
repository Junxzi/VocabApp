import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedPartOfSpeech } from "@/lib/utils";
import { Volume2, Eye, EyeOff, RotateCcw, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
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

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    const distance = info.offset.x;
    const velocity = Math.abs(info.velocity.x);
    
    if (Math.abs(distance) > threshold || velocity > 200) {
      // Animate card off screen
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
      // Return to center
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 35
      });
    }
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
      className="absolute inset-0"
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
      onClick={onTap}
      className="cursor-pointer"
    >
      <Card className="h-full bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          {!showAnswer ? (
            // Front of card
            <div className="text-center flex-1 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-foreground mb-4">{word.word}</h2>
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
              
              <div className="mt-auto">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  {t('tapCardToSeeMeaning')}
                </Badge>
              </div>
            </div>
          ) : (
            // Back of card
            <div className="text-center flex-1 flex flex-col justify-center">
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SwipeStudyPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    known: 0,
    needReview: 0,
    total: 0,
  });
  const [studyWords, setStudyWords] = useState<VocabularyWord[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary/review/50"],
  });

  const updateWordSpacedRepetitionMutation = useMutation({
    mutationFn: async ({ id, known }: { id: number; known: boolean }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, { known });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/review/50"] });
    },
  });

  useEffect(() => {
    if (words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setStudyWords(shuffled);
      setSessionStats(prev => ({ ...prev, total: shuffled.length }));
      setCurrentIndex(0);
      setShowAnswer(false);
      setIsSessionComplete(false);
    }
  }, [words]);

  // Disable scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentWord = studyWords[currentIndex];
    if (!currentWord) return;

    const known = direction === 'right';
    
    // Update stats
    setSessionStats(prev => ({
      ...prev,
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
    }));

    // Update word with spaced repetition
    updateWordSpacedRepetitionMutation.mutate({ 
      id: currentWord.id, 
      known 
    });

    // Move to next word or complete session
    setTimeout(() => {
      if (currentIndex < studyWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setIsSessionComplete(true);
      }
    }, 300);
  };

  const handleCardTap = () => {
    setShowAnswer(!showAnswer);
  };

  const resetSession = () => {
    if (words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setStudyWords(shuffled);
      setCurrentIndex(0);
      setShowAnswer(false);
      setIsSessionComplete(false);
      setSessionStats({ known: 0, needReview: 0, total: shuffled.length });
    }
  };

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

  if (isSessionComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">学習完了！</h2>
              <p className="text-muted-foreground">お疲れ様でした</p>
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
              <Button onClick={resetSession} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                もう一度
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
            <p className="text-muted-foreground mb-4">学習可能な単語がありません</p>
            <Button onClick={() => window.location.href = '/vocabulary'}>
              単語帳に戻る
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
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('swipeStudy')}</h1>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {studyWords.length}
          </div>
        </div>
        <Progress value={progress} className="h-3 mb-4" />
        
        {/* Stats */}
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

      {/* Card Container */}
      <div className="max-w-md mx-auto h-[500px] relative">
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