import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface TagSelectionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTags: string[];
  selectedTags: string[];
  onApply: (tags: string[]) => void;
}

export function TagSelectionPopup({ 
  open, 
  onOpenChange, 
  availableTags, 
  selectedTags, 
  onApply 
}: TagSelectionPopupProps) {
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>(selectedTags);
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useLanguage();

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagToggle = (tag: string) => {
    setTempSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleApply = () => {
    onApply(tempSelectedTags);
    onOpenChange(false);
  };

  const handleClear = () => {
    setTempSelectedTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {language === 'ja' ? "タグ選択" : "Select Tags"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ja' ? "タグを検索..." : "Search tags..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-muted-foreground">
            {language === 'ja' 
              ? `${tempSelectedTags.length}個のタグを選択中`
              : `${tempSelectedTags.length} tags selected`}
          </div>

          {/* Tags grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {filteredTags.map((tag) => (
                <Button
                  key={tag}
                  variant={tempSelectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTagToggle(tag)}
                  className="justify-start h-auto py-2 px-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 text-left truncate">{tag}</div>
                    {tempSelectedTags.includes(tag) && (
                      <Check className="h-3 w-3 flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClear}>
              {language === 'ja' ? "クリア" : "Clear"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'ja' ? "キャンセル" : "Cancel"}
              </Button>
              <Button onClick={handleApply}>
                {language === 'ja' ? "適用" : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}