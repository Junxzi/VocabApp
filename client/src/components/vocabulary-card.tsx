import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
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
        "transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fade-in",
        isHovered && "shadow-lg"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {word.word}
            </h3>
            <p className="text-muted-foreground font-mono text-sm">
              {word.pronunciation}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center space-x-2 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
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
        
        <p className="text-foreground mb-3 leading-relaxed">
          {word.definition}
        </p>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {word.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Added {formatRelativeTime(new Date(word.createdAt))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
