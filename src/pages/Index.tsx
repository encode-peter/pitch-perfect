import { useState, useRef } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 500 * 1024; // 500KB

const Index = () => {
  const [companyName, setCompanyName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".srt")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an .srt file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "SRT file must be under 500KB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscript(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileName(null);
    setTranscript("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!companyName.trim() || !transcript.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both a company name and transcript.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_HOST}/api/generate/doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          transcript: transcript.trim(),
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${companyName.trim().replace(/\s+/g, "_")}_Fundability_Report.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Document generated!",
        description: "Your pitch doc has been downloaded.",
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <h1 className="text-2xl text-foreground">Pitch Perfect</h1>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-lg border-border">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl text-foreground">Generate a Pitch Doc</h2>
              <p className="text-muted-foreground">
                Paste your transcript or upload an SRT file and we'll craft a polished pitch
                document.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Name</label>
                <Input
                  placeholder="e.g. Pitch Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Transcript</label>

                {/* File upload area */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".srt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload SRT
                  </Button>
                  {fileName && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{fileName}</span>
                      <button
                        onClick={clearFile}
                        className="ml-1 hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">.srt up to 500KB</span>
                </div>

                <Textarea
                  placeholder="Paste the full meeting transcript here or upload an SRT file..."
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (fileName) setFileName(null);
                  }}
                  className="min-h-[220px] resize-y"
                  maxLength={50000}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Pitch Doc
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Pitch Perfect. All rights reserved. Powered by{" "}
          <a href="https://ziotag.com">Ziotag</a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
