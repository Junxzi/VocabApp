import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, SortAsc, SortDesc } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export type SortOption = 'alphabetical' | 'date' | 'category' | 'difficulty';
export type ViewMode = 'grid' | 'list';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  selectedCategory: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  totalCount: number;
}

export function SearchFilter({ 
  onSearch, 
  onCategoryFilter, 
  onSortChange, 
  onViewModeChange, 
  searchQuery, 
  selectedCategory, 
  sortBy, 
  viewMode, 
  totalCount 
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const { t } = useLanguage();

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearch(value);
  };

  const sortOptions = [
    { value: 'alphabetical', label: t('sort.alphabetical') },
    { value: 'date', label: t('sort.date') },
    { value: 'category', label: t('sort.category') },
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

      {/* Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Category Filter */}
        <div className="flex-1 min-w-0">
          <Select value={selectedCategory} onValueChange={onCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("vocab.all_categories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("vocab.all_categories")}</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {totalCount} {totalCount !== 1 ? t("vocab.count_plural") : t("vocab.count")} を表示中
      </div>
    </div>
  );
}
