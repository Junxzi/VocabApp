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
import { CATEGORIES, detectLanguage, getLanguageLabel, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import type { InsertVocabularyWord, VocabularyWord } from "@shared/schema";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (word: InsertVocabularyWord) => void;
  editingWord?: VocabularyWord | null;
}

export function AddWordModal({ open, onOpenChange, onSubmit, editingWord }: AddWordModalProps) {
  
  const form = useForm<InsertVocabularyWord>({
    resolver: zodResolver(insertVocabularyWordSchema.omit({ pronunciation: true })),
    defaultValues: {
      word: "",
      definition: "",
      category: "Academic",
      language: "en",
      difficulty: undefined,
    },
  });

  // Update form values when editingWord changes
  useEffect(() => {
    if (editingWord) {
      form.reset({
        word: editingWord.word,
        definition: editingWord.definition,
        category: editingWord.category,
        language: editingWord.language,
        difficulty: editingWord.difficulty,
      });
    } else {
      form.reset({
        word: "",
        definition: "",
        category: "Academic",
        language: "en",
        difficulty: undefined,
      });
    }
  }, [editingWord, form]);

  const handleSubmit = (data: InsertVocabularyWord) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Rank</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "unset" ? null : parseInt(value))} value={field.value ? field.value.toString() : "unset"}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unset">未設定 (Unset)</SelectItem>
                      <SelectItem value="1">Rank 1 (Easiest)</SelectItem>
                      <SelectItem value="2">Rank 2 (Easy)</SelectItem>
                      <SelectItem value="3">Rank 3 (Hard)</SelectItem>
                      <SelectItem value="4">Rank 4 (Hardest)</SelectItem>
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
        

      </DialogContent>
    </Dialog>
  );
}
