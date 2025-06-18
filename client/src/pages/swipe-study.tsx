import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SwipeCard } from "@/components/swipe-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { RotateCcw, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import type { VocabularyWord } from "@shared/schema";

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
      await apiRequest("PUT", `/api/vocabulary/${id}/spaced-repetition`, {
        known,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/review/50"] });
    },
  });

  useEffect(() => {
    if (words.length > 0) {
      // Shuffle words for variety
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setStudyWords(shuffled);
      setSessionStats(prev => ({ ...prev, total: shuffled.length }));
    }
  }, [words]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentWord = studyWords[currentIndex];
    const known = direction === 'right';
    
    // Update stats
    setSessionStats(prev => ({
      ...prev,
      known: known ? prev.known + 1 : prev.known,
      needReview: known ? prev.needReview : prev.needReview + 1,
    }));

    // Update word with spaced repetition algorithm
    updateWordSpacedRepetitionMutation.mutate({ 
      id: currentWord.id, 
      known 
    });

    // Move to next word
    if (currentIndex < studyWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsSessionComplete(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ known: 0, needReview: 0, total: studyWords.length });
    setIsSessionComplete(false);
    
    // Refetch words for review
    queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/review/50"] });
  };

  const handleManualSwipe = (direction: 'left' | 'right') => {
    if (!showAnswer) {
      setShowAnswer(true);
      return;
    }
    handleSwipe(direction);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (studyWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">All Caught Up!</h2>
            <p className="text-muted-foreground mb-6">
              No words are due for review right now. Come back later or add new words to study.
            </p>
            <Button onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))}>
              Add New Words
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSessionComplete) {
    const accuracy = sessionStats.total > 0 
      ? Math.round((sessionStats.known / sessionStats.total) * 100) 
      : 0;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground">
                Great job! You've completed your swipe study session.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  Known Words
                </span>
                <span className="font-bold">{sessionStats.known}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  Need Review
                </span>
                <span className="font-bold">{sessionStats.needReview}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-primary mr-2" />
                  Accuracy
                </span>
                <span className="font-bold">{accuracy}%</span>
              </div>
            </div>

            <Button onClick={resetSession} size="lg" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / studyWords.length) * 100;
  const currentWord = studyWords[currentIndex];
  const nextWord = studyWords[currentIndex + 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Swipe Study</h1>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {studyWords.length}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Stats */}
        <div className="flex justify-center gap-4 mt-4 text-sm">
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

      {/* Cards Container */}
      <div className="max-w-md mx-auto h-[500px] relative">
        {/* Next card (background) */}
        {nextWord && (
          <SwipeCard
            key={`${nextWord.id}-next`}
            word={nextWord}
            onSwipe={() => {}}
            onShowAnswer={() => {}}
            showAnswer={false}
            isActive={false}
            index={1}
          />
        )}

        {/* Current card */}
        <SwipeCard
          key={`${currentWord.id}-current`}
          word={currentWord}
          onSwipe={handleSwipe}
          onShowAnswer={() => setShowAnswer(true)}
          showAnswer={showAnswer}
          isActive={true}
          index={0}
        />
      </div>

      {/* Manual Controls - Thumb-friendly */}
      <div className="max-w-md mx-auto mt-8 flex justify-center gap-6 px-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleManualSwipe('left')}
          className="flex-1 h-14 border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
        >
          <XCircle className="w-6 h-6 mr-2" />
          <span className="text-base font-medium">Need Review</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleManualSwipe('right')}
          className="flex-1 h-14 border-green-200 text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors touch-manipulation"
        >
          <CheckCircle2 className="w-6 h-6 mr-2" />
          <span className="text-base font-medium">Know It!</span>
        </Button>
      </div>

      {/* Instructions */}
      <div className="max-w-md mx-auto mt-6 text-center text-sm text-muted-foreground">
        <p>Swipe right if you know the word, left if you need to review it</p>
      </div>
    </div>
  );
}