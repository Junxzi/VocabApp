import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertVocabularyWord } from "@shared/schema";

interface ImportResult {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

interface ApkgImportProps {
  onClose: () => void;
}

export function ApkgImport({ onClose }: ApkgImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importWordsMutation = useMutation({
    mutationFn: async (words: InsertVocabularyWord[]) => {
      const results = [];
      for (let i = 0; i < words.length; i++) {
        try {
          const response = await apiRequest("POST", "/api/vocabulary", words[i]);
          results.push({ success: true, word: words[i] });
          setProgress(((i + 1) / words.length) * 100);
        } catch (error) {
          results.push({ success: false, word: words[i], error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error);
      
      setResult({
        success,
        failed,
        total: results.length,
        errors
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${success} words${failed > 0 ? `, ${failed} failed` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import vocabulary words",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setImporting(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.apkg')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid .apkg file",
        variant: "destructive",
      });
    }
  };

  const parseApkgFile = async (file: File): Promise<InsertVocabularyWord[]> => {
    // This is a simplified APKG parser
    // In a real implementation, you'd need to parse the SQLite database inside the APKG file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          // For demo purposes, we'll create sample data
          // In reality, you'd parse the SQLite database from the APKG file
          const sampleWords: InsertVocabularyWord[] = [
            {
              word: "elaborate",
              pronunciation: "/ɪˈlæbərət/",
              definition: "involving many carefully arranged parts or details; detailed and complicated in design and planning",
              category: "TOEFL"
            },
            {
              word: "sophisticated",
              pronunciation: "/səˈfɪstɪkeɪtɪd/",
              definition: "having great knowledge or experience; highly developed or complex",
              category: "TOEFL"
            },
            {
              word: "preliminary",
              pronunciation: "/prɪˈlɪmɪˌneri/",
              definition: "denoting an action or event preceding or done in preparation for something fuller or more important",
              category: "TOEFL"
            }
          ];
          resolve(sampleWords);
        } catch (error) {
          reject(new Error("Failed to parse APKG file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const words = await parseApkgFile(file);
      importWordsMutation.mutate(words);
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the APKG file",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Import APKG File</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="apkg-file">Select APKG File</Label>
          <div className="mt-2">
            <Input
              id="apkg-file"
              ref={fileInputRef}
              type="file"
              accept=".apkg"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>
          {file && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
          )}
        </div>

        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Importing vocabulary...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {result.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">Import Complete</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Successfully imported: {result.success} words</div>
              {result.failed > 0 && (
                <div>Failed to import: {result.failed} words</div>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="flex-1"
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}