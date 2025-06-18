import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, AlertCircle } from "lucide-react";

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
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");
  const [wordExists, setWordExists] = useState(false);
  const [checkingWord, setCheckingWord] = useState(false);
  
  // Get all vocabulary words to extract existing tags
  const { data: allWords = [] } = useQuery<VocabularyWord[]>({
    queryKey: ["/api/vocabulary"],
  });

  // Extract available tags from existing vocabulary and include default categories
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    // Add default categories as always available tags
    const defaultCategories = ["Academic", "Business", "Daily Life", "Technical", "TOEFL"];
    defaultCategories.forEach(category => tagSet.add(category));
    
    // Add tags from existing vocabulary words
    allWords.forEach(word => {
      if (word.tags) {
        word.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }, [allWords]);

  // Check for word duplicates
  const checkWordExists = (inputWord: string) => {
    if (!inputWord.trim()) {
      setWordExists(false);
      return;
    }
    
    // Skip check if editing the same word
    if (editingWord && inputWord.toLowerCase() === editingWord.word.toLowerCase()) {
      setWordExists(false);
      return;
    }
    
    const exists = allWords.some(word => 
      word.word.toLowerCase() === inputWord.toLowerCase()
    );
    setWordExists(exists);
  };
  
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
    // Prevent submission if word already exists
    if (wordExists) {
      return;
    }
    onSubmit(data);
    form.reset();
    setWordExists(false);
    setNewTagName("");
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
            {editingWord ? t('add.edit_title') : t('add.title')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('add.word')} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        className={`bg-muted ${wordExists ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder={t('add.wordPlaceholder')}
                        onChange={(e) => {
                          field.onChange(e);
                          checkWordExists(e.target.value);
                        }}
                      />
                      {wordExists && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {wordExists && (
                    <div className="flex items-center gap-2 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-500">
                        {language === 'ja' 
                          ? 'この単語は既に登録されています' 
                          : 'This word already exists in your vocabulary'
                        }
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('add.definition')} *</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-muted" placeholder={t('add.definitionPlaceholder')} />
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
                  <FormLabel>{t('add.tags')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('add.newTag')}
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
                      {/* Existing tags selection */}
                      {availableTags.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            {t('add.existingTags')}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {availableTags
                              .filter(tag => !field.value?.includes(tag))
                              .map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-muted text-xs"
                                  onClick={() => {
                                    const currentTags = field.value || [];
                                    field.onChange([...currentTags, tag]);
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Selected tags */}
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
                  <FormLabel>{t('add.difficulty')}</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue placeholder={t('add.selectDifficulty')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t('add.difficulty1')}</SelectItem>
                      <SelectItem value="2">{t('add.difficulty2')}</SelectItem>
                      <SelectItem value="3">{t('add.difficulty3')}</SelectItem>
                      <SelectItem value="4">{t('add.difficulty4')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('add.cancel')}
              </Button>
              <Button type="submit" disabled={wordExists}>
                {editingWord ? t('add.update') : t('add.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}