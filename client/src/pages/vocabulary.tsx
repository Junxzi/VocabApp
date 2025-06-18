import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VocabularyCard } from "@/components/vocabulary-card";
import { VocabularyListView } from "@/components/vocabulary-list-view";
import { SearchFilter, type SortOption, type ViewMode } from "@/components/search-filter";
import { Pagination } from "@/components/pagination";
import { WordGeneratorModal } from "@/components/word-generator-modal";
import { WordGachaModal } from "@/components/word-gacha-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage, type Language } from "@/lib/i18n";
import { Plus, Globe, Upload, Sparkles } from "lucide-react";
import type { VocabularyWord, InsertVocabularyWord } from "@shared/schema";

interface VocabularyPageProps {
  onEditWord: (word: VocabularyWord) => void;
}

export function VocabularyPage({ onEditWord }: VocabularyPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [wordGeneratorModalOpen, setWordGeneratorModalOpen] = useState(false);
  const [generatorTagName, setGeneratorTagName] = useState("");
  const [wordGachaModalOpen, setWordGachaModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useLanguage();

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

  // Filter and sort words
  const filteredAndSortedWords = useMemo(() => {
    let filtered = words.filter((word) => {
      const matchesSearch = searchQuery === "" || 
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (word.tags && word.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesTags = selectedTags.length === 0 || 
        (word.tags && selectedTags.every(selectedTag => word.tags.includes(selectedTag)));
      
      return matchesSearch && matchesTags;
    });

    // Sort words
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'tags':
          // Sort by first tag or empty string if no tags
          const aTag = a.tags && a.tags.length > 0 ? a.tags[0] : '';
          const bTag = b.tags && b.tags.length > 0 ? b.tags[0] : '';
          return aTag.localeCompare(bTag);
        case 'difficulty':
          return (b.difficulty || 0) - (a.difficulty || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [words, searchQuery, selectedTags, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedWords.length / itemsPerPage);
  const paginatedWords = filteredAndSortedWords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get all available tags from vocabulary words
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    words.forEach(word => {
      if (word.tags) {
        word.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [words]);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, sortBy]);

  const handleDeleteWord = (id: number) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      deleteWordMutation.mutate(id);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("vocab.title")}</h1>
        
        {/* Mobile Add Button */}
        <div className="flex md:hidden">
          <Button onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))} size="lg" className="h-10 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="w-5 h-5 mr-2" />
            {t("nav.add")}
          </Button>
        </div>
        
        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-3">
          <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
            <SelectTrigger className="w-20 h-10 p-2 border border-border/50 bg-background/50 rounded-lg hover:bg-muted/50 transition-colors">
              <Globe className="w-5 h-5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="ja">日本</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => window.dispatchEvent(new CustomEvent("openImport"))} variant="outline" size="lg" className="h-10 px-4 rounded-lg">
            <Upload className="w-5 h-5 mr-2" />
            Import
          </Button>
          <Button 
            onClick={() => setWordGachaModalOpen(true)} 
            variant="outline" 
            size="lg" 
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-300 dark:border-purple-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
{language === 'ja' ? 'タグ生成+' : 'Tag Gen+'}
          </Button>
          <Button onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))} size="lg" className="h-10 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="w-5 h-5 mr-2" />
            Add Word
          </Button>
        </div>
      </div>

      <SearchFilter
        onSearch={setSearchQuery}
        onTagFilter={setSelectedTags}
        onSortChange={setSortBy}
        onViewModeChange={setViewMode}
        onGenerateWords={(tagName) => {
          setGeneratorTagName(tagName);
          setWordGeneratorModalOpen(true);
        }}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        availableTags={availableTags}
        sortBy={sortBy}
        viewMode={viewMode}
        totalCount={filteredAndSortedWords.length}
      />

      {filteredAndSortedWords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedTags.length > 0 
              ? t("vocab.no_results")
              : t("vocab.empty")}
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent("openAddWord"))}
              className="touch-manipulation"
            >
              {t("vocab.add_first")}
            </Button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="mobile-grid">
              {paginatedWords.map((word) => (
                <VocabularyCard
                  key={word.id}
                  word={word}
                  onEdit={onEditWord}
                  onDelete={handleDeleteWord}
                />
              ))}
            </div>
          ) : (
            <VocabularyListView
              words={paginatedWords}
              onEdit={onEditWord}
              onDelete={handleDeleteWord}
            />
          )}
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedWords.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}

      {/* Word Generator Modal */}
      <WordGeneratorModal
        open={wordGeneratorModalOpen}
        onOpenChange={setWordGeneratorModalOpen}
        category={generatorTagName}
      />

      {/* Word Gacha Modal */}
      <WordGachaModal
        open={wordGachaModalOpen}
        onOpenChange={setWordGachaModalOpen}
      />
    </main>
  );
}
