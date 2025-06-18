import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, SortAsc, SortDesc, Sparkles, X, Tags } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { TagSelectionPopup } from "./tag-selection-popup";

export type SortOption = 'alphabetical' | 'date' | 'difficulty';
export type ViewMode = 'grid' | 'list';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onTagFilter: (tags: string[]) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onGenerateWords?: (tagName: string) => void;
  searchQuery: string;
  selectedTags: string[];
  availableTags: string[];
  sortBy: SortOption;
  viewMode: ViewMode;
  totalCount: number;
}

export function SearchFilter({ 
  onSearch, 
  onTagFilter, 
  onSortChange, 
  onViewModeChange, 
  onGenerateWords,
  searchQuery, 
  selectedTags, 
  availableTags,
  sortBy, 
  viewMode, 
  totalCount 
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [tagSelectionOpen, setTagSelectionOpen] = useState(false);
  const { t, language } = useLanguage();

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearch(value);
  };

  const sortOptions = [
    { value: 'alphabetical', label: t('sort.alphabetical') },
    { value: 'date', label: t('sort.date') },
    { value: 'difficulty', label: t('sort.difficulty') }
  ];

  return (
    <div className="mb-6">
      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-full"
            placeholder={t("vocab.search_placeholder")}
          />
        </div>
      </div>

      {/* Tag Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="outline"
            onClick={() => setTagSelectionOpen(true)}
            className="flex items-center gap-2"
          >
            <Tags className="w-4 h-4" />
            {language === 'ja' ? 'タグ選択' : 'Select Tags'}
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => onTagFilter(selectedTags.filter(t => t !== tag))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">

        {/* Sort Options */}
        <div className="flex-1 min-w-0">
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-full">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex border rounded-md w-fit mx-auto sm:mx-0">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Generate Words Button */}
        {onGenerateWords && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const tagName = prompt("Enter tag name (max 10 characters):", "");
              if (tagName && tagName.trim().length <= 10) {
                onGenerateWords(tagName.trim());
              } else if (tagName) {
                alert("Tag name must be 10 characters or less");
              }
            }}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-300 dark:border-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate 30 Words
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {totalCount} {totalCount !== 1 ? t("vocab.count_plural") : t("vocab.count")} を表示中
      </div>

      {/* Tag Selection Popup */}
      <TagSelectionPopup
        open={tagSelectionOpen}
        onOpenChange={setTagSelectionOpen}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onApply={onTagFilter}
      />
    </div>
  );
}
