import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AddWordModal } from "@/components/add-word-modal";
import { ApkgImport } from "@/components/apkg-import";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { VocabularyPage } from "@/pages/vocabulary";
import { LanguageProvider } from "@/lib/i18n";
import { SwipeStudyPage } from "@/pages/swipe-study-fixed";
import { ProgressPage } from "@/pages/progress";
import { SettingsPage } from "@/pages/settings";
import { WordDetailPage } from "@/pages/word-detail";
import NotFound from "@/pages/not-found";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWordOperations } from "@/hooks/use-word-operations";
import type { VocabularyWord } from "@shared/schema";

function AppContent() {
  const [addWordModalOpen, setAddWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { handleSubmitWord, isLoading } = useWordOperations();

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

  const handleModalClose = (open: boolean) => {
    setAddWordModalOpen(open);
    if (!open) {
      setEditingWord(null);
    }
  };

  const onSubmitWord = async (word: any) => {
    await handleSubmitWord(word, editingWord);
    setEditingWord(null);
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
          <Route path="/word/:id" component={WordDetailPage} />
          <Route path="/swipe-study" component={SwipeStudyPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/" exact component={() => <VocabularyPage onEditWord={handleEditWord} />} />
          <Route component={NotFound} />
        </Switch>
      </div>

      <AddWordModal
        open={addWordModalOpen}
        onOpenChange={handleModalClose}
        onSubmit={onSubmitWord}
        editingWord={editingWord}
      />

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <ApkgImport onClose={() => setImportModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;