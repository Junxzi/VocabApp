import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InsertVocabularyWord, VocabularyWord, insertVocabularyWordSchema } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (word: InsertVocabularyWord) => void;
  editingWord?: VocabularyWord | null;
}

export function AddWordModal({ open, onOpenChange, onSubmit, editingWord }: AddWordModalProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");
  
  const form = useForm<InsertVocabularyWord>({
    resolver: zodResolver(insertVocabularyWordSchema),
    defaultValues: {
      word: "",
      definition: "",
      tags: [],
      language: "en",
    },
  });

  // Update form values when editingWord changes
  useEffect(() => {
    if (editingWord) {
      form.reset({
        word: editingWord.word,
        definition: editingWord.definition,
        tags: editingWord.tags || [],
        language: editingWord.language,
        difficulty: editingWord.difficulty,
      });
    } else {
      form.reset({
        word: "",
        definition: "",
        tags: [],
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

  const addTag = () => {
    if (newTagName.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(newTagName.trim())) {
        form.setValue("tags", [...currentTags, newTagName.trim()]);
        setNewTagName("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>Word *</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-muted" placeholder="Enter the word" />
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
                  <FormLabel>Definition *</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-muted" placeholder="Enter the definition" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="bg-muted flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
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
                  <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue placeholder="Select difficulty (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Rank 1 (Easy)</SelectItem>
                      <SelectItem value="2">Rank 2</SelectItem>
                      <SelectItem value="3">Rank 3</SelectItem>
                      <SelectItem value="4">Rank 4 (Hard)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingWord ? "Update Word" : "Add Word"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}