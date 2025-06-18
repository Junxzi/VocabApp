import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVocabularyWordSchema } from "@shared/schema";
import { CATEGORIES, detectLanguage, getLanguageLabel, SUPPORTED_LANGUAGES, type SupportedLanguage, cn } from "@/lib/utils";
import { PhoneticKeyboard } from "@/components/phonetic-keyboard";
import { Keyboard, Globe } from "lucide-react";
import type { InsertVocabularyWord, VocabularyWord } from "@shared/schema";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (word: InsertVocabularyWord) => void;
  editingWord?: VocabularyWord | null;
}

export function AddWordModal({ open, onOpenChange, onSubmit, editingWord }: AddWordModalProps) {
  const [showPhoneticKeyboard, setShowPhoneticKeyboard] = useState(false);
  
  const form = useForm<InsertVocabularyWord>({
    resolver: zodResolver(insertVocabularyWordSchema),
    defaultValues: {
      word: editingWord?.word || "",
      pronunciation: editingWord?.pronunciation || "",
      definition: editingWord?.definition || "",
      category: editingWord?.category || "Academic",
    },
  });

  const handleSubmit = (data: InsertVocabularyWord) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    setShowPhoneticKeyboard(false);
    onOpenChange(false);
  };

  const insertPhoneticSymbol = (symbol: string) => {
    const currentValue = form.getValues("pronunciation");
    form.setValue("pronunciation", currentValue + symbol);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md animate-scale-in",
        showPhoneticKeyboard && "mb-80 md:mb-0"
      )}>
        <DialogHeader>
          <DialogTitle>
            {editingWord ? "Edit Word" : "Add New Word"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Word</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter the word"
                      className="bg-muted"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pronunciation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronunciation</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          placeholder="/pronunciation/"
                          className="bg-muted font-mono pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPhoneticKeyboard(!showPhoneticKeyboard)}
                        >
                          <Keyboard className="h-4 w-4" />
                        </Button>
                      </div>
                      {showPhoneticKeyboard && (
                        <div className="p-2 bg-primary/5 rounded border text-sm font-mono">
                          Preview: /{field.value || ''}/
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the definition"
                      className="bg-muted resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingWord ? "Update Word" : "Add Word"}
              </Button>
            </div>
          </form>
        </Form>
        
        <PhoneticKeyboard
          visible={showPhoneticKeyboard}
          onInsert={insertPhoneticSymbol}
          onClose={() => setShowPhoneticKeyboard(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
