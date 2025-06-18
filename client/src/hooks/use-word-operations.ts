
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VocabularyWord, InsertVocabularyWord } from "@shared/schema";

export function useWordOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createWordMutation = useMutation({
    mutationFn: async (word: InsertVocabularyWord) => {
      const response = await apiRequest("POST", "/api/vocabulary", word);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      toast({
        title: "Success",
        description: "Word added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add word",
        variant: "destructive",
      });
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: async ({ id, word }: { id: number; word: InsertVocabularyWord }) => {
      const response = await apiRequest("PUT", `/api/vocabulary/${id}`, word);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      toast({
        title: "Success",
        description: "Word updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update word",
        variant: "destructive",
      });
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/vocabulary/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      toast({
        title: "Success",
        description: "Word deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete word",
        variant: "destructive",
      });
    },
  });

  const handleSubmitWord = async (word: InsertVocabularyWord, editingWord?: VocabularyWord | null) => {
    if (editingWord) {
      await updateWordMutation.mutateAsync({ id: editingWord.id, word });
    } else {
      await createWordMutation.mutateAsync(word);
    }
  };

  const handleDeleteWord = async (id: number) => {
    await deleteWordMutation.mutateAsync(id);
  };

  return {
    handleSubmitWord,
    handleDeleteWord,
    isLoading: createWordMutation.isPending || updateWordMutation.isPending || deleteWordMutation.isPending,
    isCreating: createWordMutation.isPending,
    isUpdating: updateWordMutation.isPending,
    isDeleting: deleteWordMutation.isPending,
  };
}
