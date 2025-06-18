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
import { detectLanguage, getLanguageLabel, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Globe, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import type { InsertVocabularyWord, VocabularyWord, Category } from "@shared/schema";

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

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
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
                  <FormLabel>{t('add.word')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('add.wordPlaceholder')}
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
                  <FormLabel>{t('add.definition')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('add.definitionPlaceholder')}
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
                  <FormLabel>{t('add.category')} (Primary Tag)</FormLabel>
                  {!showNewCategoryForm ? (
                    <Select 
                      onValueChange={(value) => {
                        if (value === "__create_new__") {
                          setShowNewCategoryForm(true);
                        } else {
                          field.onChange(value);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder={t('add.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span>{category.displayName}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="__create_new__">
                          <div className="flex items-center gap-2 text-primary">
                            <Plus className="w-4 h-4" />
                            <span>{t('add.createNewCategory')}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder={t('add.newCategoryName')}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="bg-muted"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateNewCategory();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateNewCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          {t('add.createCategory')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowNewCategoryForm(false);
                            setNewCategoryName("");
                          }}
                        >
                          {t('add.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
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
                  <Select onValueChange={(value) => field.onChange(value === "unset" ? null : parseInt(value))} value={field.value ? field.value.toString() : "unset"}>
                    <FormControl>
                      <SelectTrigger className="bg-muted">
                        <SelectValue placeholder={t('add.selectDifficulty')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unset">{t('add.difficultyUnset')}</SelectItem>
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
            
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                {t('add.cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                {editingWord ? t('add.update') : t('add.save')}
              </Button>
            </div>
          </form>
        </Form>
        

      </DialogContent>
    </Dialog>
  );
}
