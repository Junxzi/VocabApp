import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VocabularyCard } from "@/components/vocabulary-card";
import { SearchFilter } from "@/components/search-filter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import type { VocabularyWord, InsertVocabularyWord } from "@shared/schema";

interface VocabularyPageProps {
  onEditWord: (word: VocabularyWord) => void;
}

export function VocabularyPage({ onEditWord }: VocabularyPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: words = [], isLoading } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary"],
  });

  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vocabulary/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      toast({
        title: "Success",
        description: "Word deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete word",
        variant: "destructive",
      });
    },
  });

  const filteredWords = words.filter((word) => {
    const matchesSearch = searchQuery === "" || 
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || word.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDeleteWord = (id: number) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      deleteWordMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-muted-foreground rounded mb-2"></div>
              <div className="h-3 bg-muted-foreground rounded mb-4 w-1/2"></div>
              <div className="h-3 bg-muted-foreground rounded mb-2"></div>
              <div className="h-3 bg-muted-foreground rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-muted-foreground rounded w-16"></div>
                <div className="h-3 bg-muted-foreground rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 ios-scroll safe-area-inset-bottom">
      <SearchFilter
        onSearch={setSearchQuery}
        onCategoryFilter={setSelectedCategory}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />

      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t("vocab.title")}</h2>
        <span className="text-sm text-muted-foreground">
          {filteredWords.length} {filteredWords.length !== 1 ? t("vocab.count_plural") : t("vocab.count")}
        </span>
      </div>

      {filteredWords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== "all" 
              ? t("vocab.no_results")
              : t("vocab.empty")}
          </p>
          {!searchQuery && selectedCategory === "all" && (
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))}
              className="touch-manipulation"
            >
              {t("vocab.add_first")}
            </Button>
          )}
        </div>
      ) : (
        <div className="mobile-grid">
          {filteredWords.map((word) => (
            <VocabularyCard
              key={word.id}
              word={word}
              onEdit={onEditWord}
              onDelete={handleDeleteWord}
            />
          ))}
        </div>
      )}
    </main>
  );
}
