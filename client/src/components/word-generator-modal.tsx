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
      const response = await fetch(`/api/word-gacha/generate`, {
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
      const duplicateMessage = data.skippedDuplicates > 0 
        ? (language === 'ja' 
          ? ` (${data.skippedDuplicates}個の重複をスキップ)`
          : ` (${data.skippedDuplicates} duplicates skipped)`)
        : '';
      
      toast({
        title: language === 'ja' ? "単語生成完了" : "Words Generated",
        description: language === 'ja' 
          ? `${tagName}タグに${data.totalAdded}個の単語を追加しました${duplicateMessage}`
          : `Added ${data.totalAdded} words with ${tagName} tag${duplicateMessage}`
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t('generate.title')}
          </DialogTitle>
          <DialogDescription>
            {language === 'ja' 
              ? "任意のタグで30個の英単語と日本語訳を生成します"
              : "Generate 30 English words with Japanese translations for any tag"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* Tag name input */}
          <div>
            <Label htmlFor="tagName">
              {t('generate.category')}
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

          {/* Generation info */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {language === 'ja' 
                ? "AI が指定されたタグに基づいて30個の英単語と日本語訳を生成します"
                : "AI will generate 30 English words with Japanese translations based on your tag"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('generate.cancel')}
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generateWordsMutation.isPending || !tagName.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generateWordsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('generate.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('generate.generate')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}