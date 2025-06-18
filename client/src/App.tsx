import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { AddWordModal } from "@/components/add-word-modal";
import { ApkgImport } from "@/components/apkg-import";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { VocabularyPage } from "@/pages/vocabulary";
import { StudyPage } from "@/pages/study";
import { SwipeStudyPage } from "@/pages/swipe-study";
import { ProgressPage } from "@/pages/progress";
import NotFound from "@/pages/not-found";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { VocabularyWord, InsertVocabularyWord } from "@shared/schema";

function AppContent() {
  const [addWordModalOpen, setAddWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
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

  const handleAddWord = () => {
    setEditingWord(null);
    setAddWordModalOpen(true);
  };

  const handleImport = () => {
    setImportModalOpen(true);
  };

  const handleEditWord = (word: VocabularyWord) => {
    setEditingWord(word);
    setAddWordModalOpen(true);
  };

  const handleSubmitWord = (word: InsertVocabularyWord) => {
    if (editingWord) {
      updateWordMutation.mutate({ id: editingWord.id, word });
    } else {
      createWordMutation.mutate(word);
    }
    setEditingWord(null);
  };

  const handleModalClose = (open: boolean) => {
    setAddWordModalOpen(open);
    if (!open) {
      setEditingWord(null);
    }
  };

  // Listen for custom events to open modals
  useEffect(() => {
    const handleOpenAddWord = () => handleAddWord();
    const handleOpenImport = () => handleImport();
    window.addEventListener("openAddWord", handleOpenAddWord);
    window.addEventListener("openImport", handleOpenImport);
    return () => {
      window.removeEventListener("openAddWord", handleOpenAddWord);
      window.removeEventListener("openImport", handleOpenImport);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={() => <VocabularyPage onEditWord={handleEditWord} />} />
          <Route path="/study" component={StudyPage} />
          <Route path="/swipe-study" component={SwipeStudyPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route component={NotFound} />
        </Switch>
      </div>

      <AddWordModal
        open={addWordModalOpen}
        onOpenChange={handleModalClose}
        onSubmit={handleSubmitWord}
        editingWord={editingWord}
      />

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <ApkgImport onClose={() => setImportModalOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <MobileBottomNav onAddWordClick={handleAddWord} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
