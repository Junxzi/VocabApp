import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, AlertCircle, Dices } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import type { Category } from "@shared/schema";

interface WordGachaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordGachaModal({ open, onOpenChange }: WordGachaModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const generateWordsMutation = useMutation({
    mutationFn: async (data: { categoryName: string; selectedCategories: string[] }) => {
      const response = await fetch(`/api/word-gacha/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryName: data.categoryName,
          selectedCategories: data.selectedCategories,
          count: 50 
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
      toast({
        title: language === 'ja' ? "生成完了" : "Generation Complete",
        description: language === 'ja' 
          ? `${categoryName}から${data.totalAdded}個の単語を生成しました`
          : `Generated ${data.totalAdded} words from ${categoryName}`
      });
      onOpenChange(false);
      setCategoryName("");
      setSelectedCategories([]);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "生成失敗" : "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleGenerate = () => {
    if (!categoryName.trim()) {
      toast({
        title: language === 'ja' ? "カテゴリ名が必要" : "Category Name Required",
        description: language === 'ja' ? "カテゴリ名を入力してください" : "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: language === 'ja' ? "カテゴリを選択" : "Select Categories",
        description: language === 'ja' ? "少なくとも1つのカテゴリを選択してください" : "Please select at least one category",
        variant: "destructive"
      });
      return;
    }

    generateWordsMutation.mutate({ categoryName, selectedCategories });
  };

  const availableCategories = categories.filter(cat => cat.name !== "TOEFL");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {language === 'ja' ? "AI単語生成+" : "AI Word Generator+"}
          </DialogTitle>
          <DialogDescription>
            {language === 'ja' 
              ? "カスタムテーマから50個の単語を生成。生成された単語は選択したカテゴリに自動分類されます。"
              : "Generate 50 words from custom themes. Generated words will be automatically categorized into your selected categories."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Name Input */}
          <div>
            <Label htmlFor="categoryName">
              {language === 'ja' ? "カテゴリ名（テーマ）" : "Category Name (Theme)"}
            </Label>
            <Input
              id="categoryName"
              placeholder={language === 'ja' ? "例: 料理、スポーツ、音楽..." : "e.g., Cooking, Sports, Music..."}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ja' ? "このテーマに関連する単語を50個生成します" : "50 words related to this theme will be generated"}
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <Label>
              {language === 'ja' ? "分類先カテゴリ" : "Target Categories"}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              {language === 'ja' ? "生成された単語を追加するカテゴリを選択" : "Select categories to add generated words to"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.name}
                    checked={selectedCategories.includes(category.name)}
                    onCheckedChange={() => handleCategoryToggle(category.name)}
                  />
                  <Label 
                    htmlFor={category.name}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {categoryName && selectedCategories.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {language === 'ja' ? "生成予定:" : "Will Generate:"}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">"{categoryName}"</span>{' '}
                {language === 'ja' ? "テーマで50個の単語" : "theme with 50 words"}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map(cat => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'ja' ? "キャンセル" : "Cancel"}
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generateWordsMutation.isPending || !categoryName.trim() || selectedCategories.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generateWordsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ja' ? "生成中..." : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'ja' ? "生成開始" : "Generate"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}