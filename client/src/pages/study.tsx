
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Minus, Check, Calendar, Target, Trophy, Flame, BookOpen, Shuffle, Timer, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import type { VocabularyWord } from "@shared/schema";

interface DailyChallengeStatus {
  completed: boolean;
  date: string;
  stats?: {
    totalWords: number;
    correctWords: number;
    accuracy: string;
  };
}

export function StudyPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [studiedWords, setStudiedWords] = useState<number[]>([]);
  const [studySession, setStudySession] = useState<{
    correct: number;
    total: number;
  }>({ correct: 0, total: 0 });
  const [studyMode, setStudyMode] = useState<'daily' | 'review' | 'random'>('daily');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const { data: dailyChallengeStatus } = useQuery<DailyChallengeStatus>({
    queryKey: ["/api/vocabulary/daily-challenge/status"],
  });

  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: studyMode === 'daily' 
      ? ["/api/vocabulary/daily-challenge"] 
      : studyMode === 'review'
      ? ["/api/vocabulary/review/30"]
      : ["/api/vocabulary/study/30"],
  });

  const updateStudyStatsMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: number }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/study`, { difficulty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
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

  const currentWord = words[currentWordIndex];

  const handleDifficultySelect = (difficulty: number) => {
    if (!currentWord) return;

    updateStudyStatsMutation.mutate({ id: currentWord.id, difficulty });
    
    setStudiedWords(prev => [...prev, currentWord.id]);
    setStudySession(prev => ({
      correct: prev.correct + (difficulty === 1 ? 1 : 0),
      total: prev.total + 1
    }));

    // Move to next word
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setShowDefinition(false);
    } else {
      // Study session complete
      const finalStats = {
        correct: studySession.correct + (difficulty === 1 ? 1 : 0),
        total: studySession.total + 1
      };
      
      const accuracy = Math.round((finalStats.correct / finalStats.total) * 100);
      
      if (studyMode === 'daily') {
        completeDailyChallengeMutation.mutate({
          totalWords: finalStats.total,
          correctWords: finalStats.correct,
          accuracy
        });
      }
      
      toast({
        title: language === "en" ? "Study Session Complete!" : "学習セッション完了！",
        description: language === "en" 
          ? `You studied ${finalStats.total} words with ${accuracy}% accuracy.`
          : `${finalStats.total}単語を学習し、正答率は${accuracy}%でした。`,
      });
      setCurrentWordIndex(0);
      setShowDefinition(false);
      setStudySession({ correct: 0, total: 0 });
      setStudiedWords([]);
    }
  };

  const resetStudySession = () => {
    setCurrentWordIndex(0);
    setShowDefinition(false);
    setStudySession({ correct: 0, total: 0 });
    setStudiedWords([]);
  };

  const handleModeChange = (mode: 'daily' | 'review' | 'random') => {
    setStudyMode(mode);
    resetStudySession();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
          </div>
          <div className="bg-muted rounded-2xl p-8 h-64"></div>
          <div className="bg-muted rounded-xl p-6 h-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 ios-scroll">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">
          {language === "en" ? "Study Mode" : "学習モード"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          {language === "en" ? "Review your vocabulary with flashcards" : "フラッシュカードで語彙を復習"}
        </p>
      </div>

      {/* Study Mode Selection */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            {language === "en" ? "Study Mode" : "学習モード"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={studyMode === 'daily' ? "default" : "outline"}
              onClick={() => handleModeChange('daily')}
              className="w-full flex items-center gap-2 h-auto py-3"
              disabled={dailyChallengeStatus?.completed}
            >
              <Calendar className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "en" ? "Daily Challenge" : "デイリーチャレンジ"}
                </div>
                <div className="text-xs opacity-80">
                  {dailyChallengeStatus?.completed 
                    ? (language === "en" ? "Completed" : "完了済み")
                    : (language === "en" ? "30 words" : "30単語")
                  }
                </div>
              </div>
              {dailyChallengeStatus?.completed && <Trophy className="w-4 h-4 text-yellow-500" />}
            </Button>

            <Button
              variant={studyMode === 'review' ? "default" : "outline"}
              onClick={() => handleModeChange('review')}
              className="w-full flex items-center gap-2 h-auto py-3"
            >
              <BookOpen className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "en" ? "Review Mode" : "復習モード"}
                </div>
                <div className="text-xs opacity-80">
                  {language === "en" ? "Due words" : "復習対象"}
                </div>
              </div>
            </Button>

            <Button
              variant={studyMode === 'random' ? "default" : "outline"}
              onClick={() => handleModeChange('random')}
              className="w-full flex items-center gap-2 h-auto py-3"
            >
              <Shuffle className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">
                  {language === "en" ? "Random Study" : "ランダム学習"}
                </div>
                <div className="text-xs opacity-80">
                  {language === "en" ? "30 words" : "30単語"}
                </div>
              </div>
            </Button>
          </div>

          {dailyChallengeStatus?.completed && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  {language === "en" ? "Daily Challenge Completed!" : "デイリーチャレンジ完了！"}
                </span>
              </div>
              {dailyChallengeStatus.stats && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  {dailyChallengeStatus.stats.correctWords}/{dailyChallengeStatus.stats.totalWords} 
                  ({dailyChallengeStatus.stats.accuracy}%)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/swipe-study'}
          className="flex items-center justify-center gap-2 h-12"
        >
          <ArrowRight className="w-4 h-4" />
          {language === "en" ? "Swipe Study" : "スワイプ学習"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/vocabulary'}
          className="flex items-center justify-center gap-2 h-12"
        >
          <BookOpen className="w-4 h-4" />
          {language === "en" ? "Word List" : "単語帳"}
        </Button>
      </div>

      {words.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-bold text-foreground mb-4">
              {language === "en" ? "No words available" : "学習可能な単語がありません"}
            </h3>
            <p className="text-muted-foreground mb-8">
              {studyMode === 'daily' 
                ? (language === "en" ? "Add some vocabulary words to start your daily challenge!" : "単語を追加してデイリーチャレンジを始めましょう！")
                : studyMode === 'review'
                ? (language === "en" ? "No words are due for review today." : "今日復習すべき単語はありません。")
                : (language === "en" ? "Add some vocabulary words to start studying!" : "単語を追加して学習を始めましょう！")
              }
            </p>
            <Button onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))}>
              {language === "en" ? "Add Your First Word" : "最初の単語を追加"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Study Card */}
          <Card className="mb-8 shadow-lg animate-scale-in">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {currentWord?.word}
                  </h3>
                  <p className="text-muted-foreground font-mono text-lg">
                    {currentWord?.pronunciation}
                  </p>
                  {currentWord?.partOfSpeech && (
                    <Badge variant="outline" className="mt-2">
                      {currentWord.partOfSpeech}
                    </Badge>
                  )}
                </div>
                
                {showDefinition ? (
                  <div>
                    <p className="text-foreground text-lg leading-relaxed mb-6">
                      {currentWord?.definition}
                    </p>
                    
                    {currentWord?.exampleSentences && (
                      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left">
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === "en" ? "Example:" : "例文:"}
                        </p>
                        {currentWord.exampleSentences.split('|||').slice(0, 1).map((sentence, index) => {
                          const [english, japanese] = sentence.split('###');
                          return (
                            <div key={index}>
                              <p className="text-foreground italic mb-1">{english?.trim()}</p>
                              {japanese && (
                                <p className="text-muted-foreground text-sm">{japanese.trim()}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <Button
                        onClick={() => handleDifficultySelect(3)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {language === "en" ? "Hard" : "難しい"}
                      </Button>
                      <Button
                        onClick={() => handleDifficultySelect(2)}
                        variant="outline"
                        className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        {language === "en" ? "Medium" : "普通"}
                      </Button>
                      <Button
                        onClick={() => handleDifficultySelect(1)}
                        variant="outline"
                        className="border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {language === "en" ? "Easy" : "簡単"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowDefinition(true)}
                    className="px-8 py-3 font-medium"
                  >
                    {language === "en" ? "Show Definition" : "意味を表示"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  {language === "en" ? "Study Progress" : "学習進捗"}
                </h4>
                <span className="text-muted-foreground">
                  {studySession.total} / {words.length}
                </span>
              </div>
              <Progress 
                value={words.length > 0 ? (studySession.total / words.length) * 100 : 0} 
                className="mb-4" 
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {language === "en" ? "Words reviewed:" : "復習済み:"} {studySession.total}
                </span>
                <span>
                  {language === "en" ? "Accuracy:" : "正答率:"} {studySession.total > 0 ? Math.round((studySession.correct / studySession.total) * 100) : 0}%
                </span>
              </div>
              {studySession.total > 0 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={resetStudySession}>
                    {language === "en" ? "Reset Session" : "セッションをリセット"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
