import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, AlertCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import type { Category } from "@shared/schema";

interface WordGachaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordGachaModal({ open, onOpenChange }: WordGachaModalProps) {
  const [tagName, setTagName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const generateWordsMutation = useMutation({
    mutationFn: async (data: { tagName: string; selectedTags: string[] }) => {
      const response = await fetch(`/api/word-gacha/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tagName: data.tagName,
          selectedTags: data.selectedTags,
          count: 30 
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate words');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      const duplicateMessage = data.skippedDuplicates > 0 
        ? (language === 'ja' 
          ? ` (${data.skippedDuplicates}個の重複をスキップ)`
          : ` (${data.skippedDuplicates} duplicates skipped)`)
        : '';
      
      toast({
        title: language === 'ja' ? "生成完了" : "Generation Complete",
        description: language === 'ja' 
          ? `「${data.tagName}」タグで${data.totalAdded}個の単語を生成しました${duplicateMessage}`
          : `Generated ${data.totalAdded} words with "${data.tagName}" tag${duplicateMessage}`
      });
      onOpenChange(false);
      setTagName("");
      setSelectedTags([]);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "生成失敗" : "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleTagToggle = (categoryName: string) => {
    setSelectedTags(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleGenerate = () => {
    if (!tagName.trim()) {
      toast({
        title: language === 'ja' ? "タグ名が必要" : "Tag Name Required",
        description: language === 'ja' ? "新しいタグ名を入力してください" : "Please enter a new tag name",
        variant: "destructive"
      });
      return;
    }

    if (tagName.length > 20) {
      toast({
        title: language === 'ja' ? "タグ名が長すぎます" : "Tag Name Too Long",
        description: language === 'ja' ? "タグ名は20文字以内にしてください" : "Tag name must be 20 characters or less",
        variant: "destructive"
      });
      return;
    }

    generateWordsMutation.mutate({ tagName, selectedTags });
  };

  const availableCategories = categories.filter(cat => cat.name !== "TOEFL");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {language === 'ja' ? 'AI単語生成+' : 'AI Word Generator+'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ja' 
              ? '新しいタグ名を作成して、30個の関連単語をAIで生成します。追加タグも選択できます。'
              : 'Create a new tag and generate 30 related words with AI. You can also select additional tags.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Tag Name Input */}
          <div className="space-y-2">
            <Label htmlFor="tagName" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {language === 'ja' ? '新しいタグ名' : 'New Tag Name'}
            </Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder={language === 'ja' ? '例: 料理、スポーツ、映画...' : 'e.g., Cooking, Sports, Movies...'}
              maxLength={20}
              className="text-base"
            />
            <div className="text-xs text-muted-foreground">
              {tagName.length}/20 {language === 'ja' ? '文字' : 'characters'}
            </div>
          </div>

          {/* Additional Tags Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {language === 'ja' ? '追加タグ (オプション)' : 'Additional Tags (Optional)'}
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedTags.includes(category.name)}
                    onCheckedChange={() => handleTagToggle(category.name)}
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {language === 'ja' ? category.displayName : category.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateWordsMutation.isPending || !tagName.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generateWordsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ja' ? '生成中...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === 'ja' ? '30個生成' : 'Generate 30'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}