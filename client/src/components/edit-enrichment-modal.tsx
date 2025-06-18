import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VocabularyWord } from "@shared/schema";

interface EditEnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: VocabularyWord;
  onSave: (data: {
    pronunciationUs?: string;
    pronunciationUk?: string;
    pronunciationAu?: string;
    partOfSpeech?: string;
    exampleSentences?: string;
  }) => void;
}

export function EditEnrichmentModal({ 
  open, 
  onOpenChange, 
  word, 
  onSave 
}: EditEnrichmentModalProps) {
  const [pronunciationUs, setPronunciationUs] = useState(word.pronunciationUs || "");
  const [pronunciationUk, setPronunciationUk] = useState(word.pronunciationUk || "");
  const [pronunciationAu, setPronunciationAu] = useState(word.pronunciationAu || "");
  const [partOfSpeech, setPartOfSpeech] = useState(word.partOfSpeech || "");
  
  const exampleSentences = word.exampleSentences ? JSON.parse(word.exampleSentences) : ["", ""];
  const [sentence1, setSentence1] = useState(exampleSentences[0] || "");
  const [sentence2, setSentence2] = useState(exampleSentences[1] || "");

  const handleSave = () => {
    onSave({
      pronunciationUs: pronunciationUs.trim(),
      pronunciationUk: pronunciationUk.trim(),
      pronunciationAu: pronunciationAu.trim(),
      partOfSpeech: partOfSpeech.trim(),
      exampleSentences: JSON.stringify([sentence1.trim(), sentence2.trim()].filter(s => s))
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setPronunciationUs(word.pronunciationUs || "");
    setPronunciationUk(word.pronunciationUk || "");
    setPronunciationAu(word.pronunciationAu || "");
    setPartOfSpeech(word.partOfSpeech || "");
    setSentence1(exampleSentences[0] || "");
    setSentence2(exampleSentences[1] || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Enrichment Data - {word.word}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Part of Speech */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Part of Speech</h3>
            <div>
              <Label htmlFor="part-of-speech">Part of Speech</Label>
              <Input
                id="part-of-speech"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="e.g., noun, verb, adjective"
              />
            </div>
          </div>

          {/* Pronunciations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pronunciations (IPA)</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="pronunciation-us">US English</Label>
                <Input
                  id="pronunciation-us"
                  value={pronunciationUs}
                  onChange={(e) => setPronunciationUs(e.target.value)}
                  placeholder="e.g., /wɜːrd/"
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="pronunciation-uk">UK English</Label>
                <Input
                  id="pronunciation-uk"
                  value={pronunciationUk}
                  onChange={(e) => setPronunciationUk(e.target.value)}
                  placeholder="e.g., /wɜːd/"
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="pronunciation-au">Australian English</Label>
                <Input
                  id="pronunciation-au"
                  value={pronunciationAu}
                  onChange={(e) => setPronunciationAu(e.target.value)}
                  placeholder="e.g., /wɜːd/"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Example Sentences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Example Sentences</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="sentence-1">Example 1</Label>
                <Textarea
                  id="sentence-1"
                  value={sentence1}
                  onChange={(e) => setSentence1(e.target.value)}
                  placeholder="Enter first example sentence..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="sentence-2">Example 2</Label>
                <Textarea
                  id="sentence-2"
                  value={sentence2}
                  onChange={(e) => setSentence2(e.target.value)}
                  placeholder="Enter second example sentence..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}