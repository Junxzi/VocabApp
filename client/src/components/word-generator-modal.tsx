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
  const [wordCount, setWordCount] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const generateWordsMutation = useMutation({
    mutationFn: async (data: { category: string; count: number }) => {
      const response = await fetch(`/api/categories/${data.category}/generate-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: data.count })
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
          ? `${category}カテゴリに${data.totalAdded}個の単語を追加しました`
          : `Added ${data.totalAdded} words to ${category} category`
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
    if (wordCount < 1 || wordCount > 50) {
      toast({
        title: language === 'ja' ? "無効な数値" : "Invalid Number",
        description: language === 'ja' ? "1から50の間で指定してください" : "Please specify between 1 and 50",
        variant: "destructive"
      });
      return;
    }
    generateWordsMutation.mutate({ category, count: wordCount });
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

          {/* Word count input */}
          <div>
            <Label htmlFor="wordCount">
              {language === 'ja' ? "生成する単語数" : "Number of words to generate"}
            </Label>
            <Input
              id="wordCount"
              type="number"
              min="1"
              max="50"
              value={wordCount}
              onChange={(e) => setWordCount(parseInt(e.target.value) || 10)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ja' ? "1-50個の範囲で指定" : "Specify between 1-50 words"}
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