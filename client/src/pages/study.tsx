import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Minus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VocabularyWord } from "@shared/schema";

export function StudyPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [studiedWords, setStudiedWords] = useState<number[]>([]);
  const [studySession, setStudySession] = useState<{
    correct: number;
    total: number;
  }>({ correct: 0, total: 0 });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary/study/50"],
  });

  const updateStudyStatsMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: number }) => {
      await apiRequest("PUT", `/api/vocabulary/${id}/study`, { difficulty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
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
      toast({
        title: "Study Session Complete!",
        description: `You studied ${studySession.total + 1} words with ${Math.round(((studySession.correct + (difficulty === 1 ? 1 : 0)) / (studySession.total + 1)) * 100)}% accuracy.`,
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

  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Study Mode</h2>
          <p className="text-muted-foreground mb-8">
            Add some vocabulary words to start studying!
          </p>
          <Button onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))}>
            Add Your First Word
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = words.length > 0 ? (studySession.total / words.length) * 100 : 0;
  const accuracy = studySession.total > 0 ? Math.round((studySession.correct / studySession.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">Study Mode</h2>
        <p className="text-muted-foreground">Review your vocabulary with flashcards</p>
      </div>

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
            </div>
            
            {showDefinition ? (
              <div>
                <p className="text-foreground text-lg leading-relaxed mb-6">
                  {currentWord?.definition}
                </p>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <Button
                    onClick={() => handleDifficultySelect(3)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hard
                  </Button>
                  <Button
                    onClick={() => handleDifficultySelect(2)}
                    variant="outline"
                    className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Medium
                  </Button>
                  <Button
                    onClick={() => handleDifficultySelect(1)}
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Easy
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowDefinition(true)}
                className="px-8 py-3 font-medium"
              >
                Show Definition
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Study Progress</h4>
            <span className="text-muted-foreground">
              {studySession.total} / {words.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="mb-4" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Words reviewed: {studySession.total}</span>
            <span>Accuracy: {accuracy}%</span>
          </div>
          {studySession.total > 0 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={resetStudySession}>
                Reset Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
