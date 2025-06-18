import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Link } from "wouter";
import type { VocabularyWord } from "@shared/schema";

interface VocabularyCardProps {
  word: VocabularyWord;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (id: number) => void;
}

export function VocabularyCard({ word, onEdit, onDelete }: VocabularyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-lg md:hover:scale-105 animate-fade-in touch-manipulation",
        isHovered && "shadow-lg"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base md:text-lg font-semibold text-foreground break-words">
                {word.word}
                {word.pronunciationUs && (
                  <span className="text-sm text-muted-foreground font-mono ml-2">
                    [{word.pronunciationUs}]
                  </span>
                )}
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
                  className="h-6 px-2 text-xs hover:bg-muted"
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
                  className="h-6 px-2 text-xs hover:bg-muted"
                  title="UK pronunciation"
                >
                  🇬🇧
                </Button>
              </div>
            </div>
            {word.partOfSpeech && (
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {word.partOfSpeech}
                </Badge>
              </div>
            )}

          </div>
          <div
            className={cn(
              "flex items-center space-x-1 transition-opacity duration-200 ml-2",
              "md:opacity-0 md:group-hover:opacity-100",
              isHovered ? "opacity-100" : "opacity-70 md:opacity-0"
            )}
          >
            <Link href={`/word/${word.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-foreground touch-manipulation"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(word)}
              className="h-8 w-8 p-0 hover:text-foreground touch-manipulation"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(word.id)}
              className="h-8 w-8 p-0 hover:text-destructive touch-manipulation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-foreground mb-3 leading-relaxed text-sm md:text-base">
          {word.definition}
        </p>
        
        <div className="flex items-center justify-between">
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
          </div>
          <span className="text-xs text-muted-foreground">
            Added {formatRelativeTime(new Date(word.createdAt))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
