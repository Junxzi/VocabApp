import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

interface WordGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
}

export function WordGeneratorModal({ open, onOpenChange, category }: WordGeneratorModalProps) {
  const [tagName, setTagName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const generateWordsMutation = useMutation({
    mutationFn: async (data: { tagName: string }) => {
      const response = await fetch(`/api/gacha/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: data.tagName, count: 30 })
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
        title: language === 'ja' ? "単語生成完了" : "Words Generated",
        description: language === 'ja' 
          ? `${tagName}タグに${data.totalAdded}個の単語を追加しました`
          : `Added ${data.totalAdded} words with ${tagName} tag`
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "生成失敗" : "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getSampleWords = () => {
    const samples = {
      "Academic": ["hypothesis", "analyze", "synthesize", "methodology", "criterion"],
      "Business": ["negotiate", "stakeholder", "revenue", "strategy", "efficiency"],
      "Daily Life": ["grocery", "laundry", "commute", "neighborhood", "routine"],
      "Technical": ["algorithm", "database", "framework", "debugging", "optimization"]
    };
    return samples[category as keyof typeof samples] || [];
  };

  const handleGenerate = () => {
    if (!tagName.trim()) {
      toast({
        title: language === 'ja' ? "タグ名が必要" : "Tag Name Required",
        description: language === 'ja' ? "タグ名を入力してください" : "Please enter a tag name",
        variant: "destructive"
      });
      return;
    }
    if (tagName.trim().length > 10) {
      toast({
        title: language === 'ja' ? "タグ名が長すぎます" : "Tag Name Too Long",
        description: language === 'ja' ? "10文字以下で入力してください" : "Please use 10 characters or less",
        variant: "destructive"
      });
      return;
    }
    generateWordsMutation.mutate({ tagName: tagName.trim() });
  };

  const sampleWords = getSampleWords();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {language === 'ja' ? `${category}カテゴリの単語を自動生成` : `Generate ${category} Words`}
          </DialogTitle>
          <DialogDescription>
            {language === 'ja' 
              ? "AIが適切な英単語を生成し、日本語の意味を付けて追加します。"
              : "AI will generate appropriate English words with Japanese definitions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sample words preview */}
          <div>
            <Label className="text-sm font-medium">
              {language === 'ja' ? "例:" : "Examples:"}
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {sampleWords.map((word) => (
                <Badge key={word} variant="outline" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tag name input */}
          <div>
            <Label htmlFor="tagName">
              {language === 'ja' ? "タグ名" : "Tag Name"}
            </Label>
            <Input
              id="tagName"
              type="text"
              maxLength={10}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="mt-1"
              placeholder={language === 'ja' ? "例: 科学技術" : "e.g. Science"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ja' ? "10文字以下で入力してください（30単語を生成）" : "Enter up to 10 characters (generates 30 words)"}
            </p>
          </div>

          {/* Warning for TOEFL */}
          {category === "TOEFL" && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {language === 'ja' 
                  ? "TOEFLカテゴリでは自動生成はご利用いただけません"
                  : "Word generation is not available for TOEFL category"}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'ja' ? "キャンセル" : "Cancel"}
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generateWordsMutation.isPending || category === "TOEFL"}
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