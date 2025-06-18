import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VocabularyWord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Volume2, Sparkles, Loader2, Edit2, RefreshCw } from "lucide-react";
import { speakWithAccent } from "@/lib/speech";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedPartOfSpeech } from "@/lib/utils";
import { EditEnrichmentModal } from "@/components/edit-enrichment-modal";
import { useState, useEffect } from "react";

export function WordDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);

  // Scroll to top when word detail page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: word, isLoading } = useQuery<VocabularyWord>({
    queryKey: ['/api/vocabulary', id],
    queryFn: async () => {
      const response = await fetch(`/api/vocabulary/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Word not found');
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Try to get initial data from the vocabulary list cache
    initialData: () => {
      const vocabularyData = queryClient.getQueryData<VocabularyWord[]>(['/api/vocabulary']);
      return vocabularyData?.find(w => w.id === parseInt(id!));
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['/api/vocabulary'])?.dataUpdatedAt;
    }
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
        title: t('detail.word_updated'),
        description: t('detail.word_updated_desc')
      });
    },
    onError: () => {
      toast({
        title: t('detail.update_failed'),
        description: t('detail.update_failed_desc'),
        variant: "destructive"
      });
    }
  });

  const enrichWithAIMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/vocabulary/${id}/enrich`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to enrich word');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word enriched successfully",
        description: `Enhanced with pronunciations, part of speech, and 2 example sentences with Japanese translations.`
      });
    },
    onError: () => {
      toast({
        title: "Failed to enrich word",
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
        <h2 className="text-2xl font-bold">{t('detail.not_found')}</h2>
        <Button onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('detail.back_to_vocabulary')}
        </Button>
      </div>
    );
  }

  const exampleSentences = word.exampleSentences 
    ? JSON.parse(word.exampleSentences) 
    : [];

  // Check if sentences have Japanese translations (new format) or are just strings (old format)
  const hasJapaneseTranslations = exampleSentences.length > 0 && 
    typeof exampleSentences[0] === 'object' && 
    exampleSentences[0].english && 
    exampleSentences[0].japanese;

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
            {t('detail.back')}
          </Button>
          
          <div className="flex items-center space-x-2">
            {!hasEnrichedData && (
              <Button
                variant="default"
                onClick={() => enrichWithAIMutation.mutate()}
                disabled={enrichWithAIMutation.isPending}
              >
                {enrichWithAIMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
{t('detail.enrich_with_ai')}
              </Button>
            )}
            
            {hasEnrichedData && (
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
{t('detail.edit')}
              </Button>
            )}
          </div>
        </div>

        {/* Word Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              {word.word}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Part of Speech and Definition */}
            <div>
              {word.partOfSpeech && (
                <div className="mb-3">
                  <Badge variant="secondary" className="text-sm">
                    {getLocalizedPartOfSpeech(word.partOfSpeech, language)}
                  </Badge>
                </div>
              )}
              <p className="text-foreground leading-relaxed text-lg">{word.definition}</p>
            </div>

            {/* Enhanced Pronunciations */}
            {(word.pronunciationUs || word.pronunciationUk || word.pronunciationAu) && (
              <>
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('detail.pronunciations')}</h3>
                  <div className="space-y-2">
                    {word.pronunciationUs && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          US
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationUs}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await speakWithAccent(word.word, 'us', word.audioDataUs);
                            } catch (error) {
                              console.error('Speech synthesis error:', error);
                            }
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {word.pronunciationUk && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          UK
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationUk}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await speakWithAccent(word.word, 'uk', word.audioDataUk);
                            } catch (error) {
                              console.error('Speech synthesis error:', error);
                            }
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {word.pronunciationAu && (
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          AU
                        </Badge>
                        <span className="text-muted-foreground font-mono">{word.pronunciationAu}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await speakWithAccent(word.word, 'au', word.audioDataAu);
                            } catch (error) {
                              console.error('Speech synthesis error:', error);
                            }
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
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
                  <h3 className="text-lg font-semibold mb-3">{t('detail.example_sentences')}</h3>
                  <div className="space-y-3">
                    {exampleSentences.map((sentence: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        {hasJapaneseTranslations ? (
                          <div className="space-y-2">
                            <p className="text-foreground leading-relaxed">{sentence.english}</p>
                            <p className="text-muted-foreground text-sm leading-relaxed">{sentence.japanese}</p>
                          </div>
                        ) : (
                          <p className="text-foreground leading-relaxed">{sentence}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Study Stats */}
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('detail.study_progress')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{word.studyCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground">{t('detail.times_studied')}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {(word.studyCount ?? 0) > 0 ? Math.round(((word.correctAnswers ?? 0) / (word.studyCount ?? 1)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">{t('detail.accuracy')}</div>
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