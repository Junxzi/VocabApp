import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formatRelativeTime, getLocalizedPartOfSpeech } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { VocabularyWord } from "@shared/schema";

interface VocabularyListViewProps {
  words: VocabularyWord[];
  onEdit: (word: VocabularyWord) => void;
  onDelete: (id: number) => void;
}

export function VocabularyListView({ words, onEdit, onDelete }: VocabularyListViewProps) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-2">
      {words.map((word) => (
        <div
          key={word.id}
          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {word.word}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(word.word);
                          utterance.lang = 'en-US';
                          speechSynthesis.speak(utterance);
                        }
                      }}
                      className="h-5 px-1 text-xs hover:bg-muted"
                      title="US pronunciation"
                    >
                      🇺🇸
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(word.word);
                          utterance.lang = 'en-GB';
                          speechSynthesis.speak(utterance);
                        }
                      }}
                      className="h-5 px-1 text-xs hover:bg-muted"
                      title="UK pronunciation"
                    >
                      🇬🇧
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {word.pronunciation}
                </p>
              </div>
              <div className="hidden md:block min-w-0 flex-2">
                <p className="text-sm text-foreground line-clamp-2">
                  {word.definition}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {word.category}
                </Badge>
                {word.difficulty && (
                  <Badge 
                    variant={word.difficulty >= 3 ? "destructive" : "default"} 
                    className="text-xs"
                  >
                    Rank {word.difficulty}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(new Date(word.createdAt))}
                </span>
              </div>
            </div>
            {/* Mobile definition */}
            <div className="md:hidden mt-2">
              <p className="text-sm text-foreground line-clamp-2">
                {word.definition}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(word)}
              className="h-8 w-8 p-0 hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(word.id)}
              className="h-8 w-8 p-0 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}