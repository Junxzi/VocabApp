import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VocabularyWord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Volume2, Sparkles, Loader2, Edit2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { EditEnrichmentModal } from "@/components/edit-enrichment-modal";
import { useState } from "react";

export function WordDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: word, isLoading } = useQuery<VocabularyWord>({
    queryKey: ['/api/vocabulary', id],
    queryFn: async () => {
      const response = await fetch(`/api/vocabulary/${id}`);
      if (!response.ok) throw new Error('Word not found');
      return response.json();
    },
    enabled: !!id
  });

  const updateEnrichmentMutation = useMutation({
    mutationFn: async (data: {
      pronunciationUs?: string;
      pronunciationUk?: string;
      pronunciationAu?: string;
      partOfSpeech?: string;
      exampleSentences?: string;
    }) => {
      const response = await fetch(`/api/vocabulary/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to update word');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word updated successfully",
        description: "Enrichment data has been saved."
      });
    },
    onError: () => {
      toast({
        title: "Failed to update word",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h2 className="text-2xl font-bold">Word not found</h2>
        <Button onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vocabulary
        </Button>
      </div>
    );
  }

  const exampleSentences = word.exampleSentences 
    ? JSON.parse(word.exampleSentences) 
    : [];

  const hasEnrichedData = word.pronunciationUs || word.pronunciationUk || word.pronunciationAu || exampleSentences.length > 0;

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return "bg-gray-500";
    switch (difficulty) {
      case 1: return "bg-green-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-orange-500";
      case 4: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {(word.pronunciationUs || word.pronunciationUk || word.pronunciationAu || exampleSentences.length > 0) && (
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {/* Word Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                {word.word}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {word.partOfSpeech && (
                  <Badge variant="secondary">
                    {word.partOfSpeech}
                  </Badge>
                )}
                <Badge className={`${getDifficultyColor(word.difficulty)} text-white`}>
                  Rank {word.difficulty || "?"}
                </Badge>
                <Badge variant="outline">
                  {word.category}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">


            {/* Definition */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Definition</h3>
              <p className="text-muted-foreground leading-relaxed">{word.definition}</p>
            </div>

            {/* Enhanced Pronunciations */}
            {(word.pronunciationUs || word.pronunciationUk || word.pronunciationAu) && (
              <>
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Pronunciations</h3>
                  <div className="space-y-2">
                    {word.pronunciationUs && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          US
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationUs}</span>
                      </div>
                    )}
                    {word.pronunciationUk && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          UK
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationUk}</span>
                      </div>
                    )}
                    {word.pronunciationAu && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          AU
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationAu}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Example Sentences */}
            {exampleSentences.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Example Sentences</h3>
                  <div className="space-y-3">
                    {exampleSentences.map((sentence: string, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-foreground leading-relaxed">{sentence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Study Stats */}
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Study Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{word.studyCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Times Studied</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {(word.studyCount ?? 0) > 0 ? Math.round(((word.correctAnswers ?? 0) / (word.studyCount ?? 1)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {word && (
        <EditEnrichmentModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          word={word}
          onSave={(data) => updateEnrichmentMutation.mutate(data)}
        />
      )}
    </div>
  );
}