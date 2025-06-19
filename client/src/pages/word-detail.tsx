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

  // Get default accent from settings
  const getDefaultAccent = (): 'us' | 'uk' | 'au' => {
    const stored = localStorage.getItem("pronunciationAccent");
    return (stored as 'us' | 'uk' | 'au') || 'us';
  };

  const speakWord = async (variant?: 'us' | 'uk' | 'au') => {
    if (!word) return;
    
    const accent = variant || getDefaultAccent();
    console.log(`Speaking "${word.word}" with ${accent.toUpperCase()} accent`);
    
    try {
      const { azureTTS } = await import('@/lib/azure-tts');
      await azureTTS.speak(word.word, accent);
      console.log(`✓ Azure TTS successful for "${word.word}"`);
    } catch (error) {
      console.error('Azure TTS failed, using browser TTS:', error);
      
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(word.word);
          utterance.rate = 0.8;
          utterance.volume = 1.0;
          utterance.pitch = 1.0;

          const languageMap = {
            us: 'en-US',
            uk: 'en-GB', 
            au: 'en-AU'
          };
          utterance.lang = languageMap[accent];

          const voices = speechSynthesis.getVoices();
          const targetVoice = voices.find(voice => 
            voice.lang.startsWith(languageMap[accent])
          );
          
          if (targetVoice) {
            utterance.voice = targetVoice;
          }

          speechSynthesis.speak(utterance);
        }, 100);
      }
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            Back
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
                Enrich with AI
              </Button>
            )}
            
            {hasEnrichedData && (
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
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
                  <h3 className="text-lg font-semibold mb-3">Pronunciations</h3>
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
                              const { azureTTS } = await import('@/lib/azure-tts');
                              await azureTTS.speak(word.word, 'us');
                            } catch (error) {
                              console.error('Azure TTS failed, using fallback:', error);
                              if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance(word.word);
                                utterance.lang = 'en-US';
                                speechSynthesis.speak(utterance);
                              }
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
                              const { azureTTS } = await import('@/lib/azure-tts');
                              await azureTTS.speak(word.word, 'uk');
                            } catch (error) {
                              console.error('Azure TTS failed, using fallback:', error);
                              if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance(word.word);
                                utterance.lang = 'en-GB';
                                speechSynthesis.speak(utterance);
                              }
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
                              const { azureTTS } = await import('@/lib/azure-tts');
                              await azureTTS.speak(word.word, 'au');
                            } catch (error) {
                              console.error('Azure TTS failed, using fallback:', error);
                              if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance(word.word);
                                utterance.lang = 'en-AU';
                                speechSynthesis.speak(utterance);
                              }
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
                  <h3 className="text-lg font-semibold mb-3">Example Sentences</h3>
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