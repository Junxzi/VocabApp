import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PhoneticKeyboardProps {
  onInsert: (symbol: string) => void;
  onClose: () => void;
  visible: boolean;
}

const PHONETIC_SYMBOLS = [
  // Vowels
  { symbol: "æ", label: "æ", category: "vowel" },
  { symbol: "ə", label: "ə", category: "vowel" },
  { symbol: "ɜ", label: "ɜ", category: "vowel" },
  { symbol: "ɪ", label: "ɪ", category: "vowel" },
  { symbol: "ʊ", label: "ʊ", category: "vowel" },
  { symbol: "ʌ", label: "ʌ", category: "vowel" },
  { symbol: "ɔ", label: "ɔ", category: "vowel" },
  { symbol: "ɑ", label: "ɑ", category: "vowel" },
  { symbol: "eɪ", label: "eɪ", category: "vowel" },
  { symbol: "aɪ", label: "aɪ", category: "vowel" },
  { symbol: "ɔɪ", label: "ɔɪ", category: "vowel" },
  { symbol: "aʊ", label: "aʊ", category: "vowel" },
  { symbol: "oʊ", label: "oʊ", category: "vowel" },
  { symbol: "ɪə", label: "ɪə", category: "vowel" },
  { symbol: "eə", label: "eə", category: "vowel" },
  { symbol: "ʊə", label: "ʊə", category: "vowel" },
  
  // Consonants
  { symbol: "θ", label: "θ", category: "consonant" },
  { symbol: "ð", label: "ð", category: "consonant" },
  { symbol: "ʃ", label: "ʃ", category: "consonant" },
  { symbol: "ʒ", label: "ʒ", category: "consonant" },
  { symbol: "tʃ", label: "tʃ", category: "consonant" },
  { symbol: "dʒ", label: "dʒ", category: "consonant" },
  { symbol: "ŋ", label: "ŋ", category: "consonant" },
  { symbol: "j", label: "j", category: "consonant" },
  { symbol: "w", label: "w", category: "consonant" },
  { symbol: "h", label: "h", category: "consonant" },
  { symbol: "r", label: "r", category: "consonant" },
  { symbol: "l", label: "l", category: "consonant" },
  
  // Stress and other
  { symbol: "ˈ", label: "ˈ", category: "stress" },
  { symbol: "ˌ", label: "ˌ", category: "stress" },
  { symbol: "ː", label: "ː", category: "length" },
];

export function PhoneticKeyboard({ onInsert, onClose, visible }: PhoneticKeyboardProps) {
  if (!visible) return null;

  const vowels = PHONETIC_SYMBOLS.filter(s => s.category === "vowel");
  const consonants = PHONETIC_SYMBOLS.filter(s => s.category === "consonant");
  const others = PHONETIC_SYMBOLS.filter(s => s.category === "stress" || s.category === "length");

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Phonetic Symbols</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-xs text-muted-foreground mb-2">Vowels</h4>
            <div className="grid grid-cols-8 gap-1">
              {vowels.map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 font-mono text-sm hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onInsert(item.symbol)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs text-muted-foreground mb-2">Consonants</h4>
            <div className="grid grid-cols-8 gap-1">
              {consonants.map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 font-mono text-sm hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onInsert(item.symbol)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs text-muted-foreground mb-2">Stress & Length</h4>
            <div className="grid grid-cols-8 gap-1">
              {others.map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 font-mono text-sm hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onInsert(item.symbol)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}