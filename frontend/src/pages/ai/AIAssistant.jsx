import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, RefreshCw, Pencil, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import api from "@/utils/api";

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState("lesson-plan");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    topic: "",
    language: "English",
    bloomLevel: "Understanding",
    count: 5,
  });
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error("Topic is required");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await api.post("/ai/teacher/generate", {
        type: activeTab,
        ...formData
      });
      setResult(response.data);
      setIsEditing(false); // Reset to preview mode on new generation
      toast.success("Content generated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            AI Teacher Assistant <Sparkles className="text-ai-accent h-6 w-6" aria-hidden="true" />
          </div>
        }
        subtitle="Generate lesson plans, quizzes, homework, and more instantly."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-ai-accent/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">What do you need?</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 lg:grid-cols-3 gap-2 bg-transparent h-auto p-0">
                  <TabsTrigger value="lesson-plan" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Lesson Plan</TabsTrigger>
                  <TabsTrigger value="quiz" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Quiz</TabsTrigger>
                  <TabsTrigger value="homework" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Homework</TabsTrigger>
                  <TabsTrigger value="explain" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Explain</TabsTrigger>
                  <TabsTrigger value="simplify" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Simplify</TabsTrigger>
                  <TabsTrigger value="translate" className="rounded-xl border border-border/40 py-2.5 transition-all data-[state=active]:border-transparent data-[state=active]:bg-ai-accent data-[state=active]:text-ai-accent-foreground data-[state=active]:shadow-sm">Translate</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="e.g., Science, Math" />
                </div>
                <div className="space-y-2">
                  <Label>Grade/Class</Label>
                  <Input name="grade" value={formData.grade} onChange={handleInputChange} placeholder="e.g., Grade 8" />
                </div>
                <div className="space-y-2">
                  <Label>Topic / Text *</Label>
                  <Textarea 
                    name="topic" 
                    value={formData.topic} 
                    onChange={handleInputChange} 
                    placeholder="Enter the topic or paste text to simplify/translate" 
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {activeTab === "quiz" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Questions</Label>
                      <Input type="number" name="count" value={formData.count} onChange={handleInputChange} min="1" max="20" />
                    </div>
                    <div>
                      <Label>Bloom's Level</Label>
                      <Select value={formData.bloomLevel} onValueChange={(val) => setFormData(prev => ({...prev, bloomLevel: val}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Remembering">Remembering</SelectItem>
                          <SelectItem value="Understanding">Understanding</SelectItem>
                          <SelectItem value="Applying">Applying</SelectItem>
                          <SelectItem value="Analyzing">Analyzing</SelectItem>
                          <SelectItem value="Evaluating">Evaluating</SelectItem>
                          <SelectItem value="Creating">Creating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {(activeTab === "translate" || activeTab === "explain") && (
                  <div>
                    <Label>Output Language</Label>
                    <Select value={formData.language} onValueChange={(val) => setFormData(prev => ({...prev, language: val}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Urdu">Urdu</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !formData.topic}
                className="h-12 w-full rounded-xl bg-ai-accent text-base font-semibold text-ai-accent-foreground hover:bg-ai-accent/90"
              >
                {loading ? (
                  <><RefreshCw className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Generating…</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" aria-hidden="true" /> Generate with AI</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex h-full min-h-[600px] flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
              <div>
                <CardTitle className="text-base font-semibold">Generated Content</CardTitle>
                <CardDescription>Review and edit before saving</CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Check className="h-4 w-4 mr-2" aria-hidden="true" /> Done Editing</> : <><Pencil className="h-4 w-4 mr-2" aria-hidden="true" /> Edit</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" /> Copy
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-grow flex-col">
              {loading ? (
                <div className="flex flex-grow flex-col items-center justify-center space-y-6 text-muted-foreground/60 animate-pulse">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <RefreshCw className="h-9 w-9 animate-spin text-ai-accent/60" aria-hidden="true" />
                  </div>
                  <p className="text-base font-medium">Our AI is crafting the perfect {activeTab.replace("-", " ")}…</p>
                </div>
              ) : result ? (
                isEditing ? (
                  <Textarea 
                    value={result} 
                    onChange={(e) => setResult(e.target.value)} 
                    className="flex-grow min-h-[400px] font-mono text-base p-6 rounded-2xl bg-secondary/20 border-0 focus-visible:ring-1 focus-visible:ring-ai-accent/50 shadow-inner resize-none"
                  />
                ) : (
                  <div className="flex-grow overflow-y-auto max-h-[600px] min-h-[400px] p-8 rounded-2xl bg-card border border-border/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-5 prose-headings:mt-10 prose-headings:mb-5 prose-li:my-2 prose-ul:my-6 prose-table:border-collapse prose-th:bg-muted/50 prose-td:border-b [&_.katex-display]:my-8 [&_.katex-display]:py-2">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                )
              ) : (
                <div className="flex flex-grow flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-ai-accent/10">
                    <Sparkles className="size-7 text-ai-accent/60" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-medium text-foreground">Nothing generated yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Fill out the form and generate your first lesson plan, quiz, or homework.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
