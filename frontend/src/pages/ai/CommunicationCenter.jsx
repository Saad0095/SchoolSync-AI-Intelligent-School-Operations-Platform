import React, { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, CheckCircle2, Copy, Sparkles, Globe, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import api from "@/utils/api";
import { useAuth } from "../../context/AuthContext";

const CHANNELS = [
  { id: "circular", label: "Official Circular" },
  { id: "sms", label: "SMS (Short)" },
  { id: "whatsapp", label: "WhatsApp (Friendly)" },
  { id: "email", label: "Email (Professional)" },
  { id: "teacherNotice", label: "Teacher Notice" },
  { id: "studentNotice", label: "Student Notice" },
  { id: "website", label: "Website Announcement" },
  { id: "push", label: "Push Notification" },
];

const formatVariantText = (variantContent) => {
  if (!variantContent) return "";
  if (typeof variantContent === "string") return variantContent;
  if (typeof variantContent === "object") {
    const eng = variantContent.english || variantContent.en || "";
    const urd = variantContent.urdu || variantContent.ur || "";
    if (eng && urd) {
      return `${eng}\n\n--------------------------------------------------\nURDU TRANSLATION / اردو ترجمہ\n--------------------------------------------------\n\n${urd}`;
    }
    return eng || urd || Object.values(variantContent).filter(v => typeof v === "string").join("\n\n");
  }
  return String(variantContent);
};

const CommunicationCenter = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("both");
  const [selectedChannels, setSelectedChannels] = useState(["circular", "sms", "whatsapp"]);
  const [targetRoles, setTargetRoles] = useState(
    user?.role === "super-admin" 
      ? ["campus-admin", "teacher", "student"]
      : ["teacher", "student"]
  );
  
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState(null);
  const [activeTab, setActiveTab] = useState("");

  const handleChannelToggle = (channelId) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handleRoleToggle = (roleId) => {
    setTargetRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a message prompt.");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/ai/communications/generate", {
        prompt,
        language,
        channels: selectedChannels
      });
      
      const rawVariants = response.variants || response.data?.variants || {};
      const normalized = {};

      Object.keys(rawVariants).forEach((chId) => {
        normalized[chId] = formatVariantText(rawVariants[chId]);
      });

      setVariants(normalized);
      setActiveTab(selectedChannels[0]);
      toast.success("AI multi-channel communications generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate communication variants.");
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = (channelId, value) => {
    setVariants(prev => ({
      ...prev,
      [channelId]: value
    }));
  };

  const handleSend = async () => {
    if (!variants) return;
    setLoading(true);
    try {
      const primaryContent = variants.circular || variants[selectedChannels[0]] || Object.values(variants)[0];
      const dispatchMessage = formatVariantText(primaryContent);

      await api.post("/ai/communications/dispatch", {
        message: dispatchMessage,
        title: "Official Communication",
        type: "announcement",
        targetRoles
      });
      toast.success("Communications dispatched successfully!");
      setVariants(null);
      setPrompt("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (channelId) => {
    const text = variants?.[channelId];
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied message text to clipboard!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            AI Multi-Channel Communication Center <Sparkles className="text-ai-accent h-6 w-6" aria-hidden="true" />
          </div>
        }
        subtitle="Generate and dispatch tailored multi-channel announcements from a single prompt using Groq + Gemini AI."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Setup */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-ai-accent/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare size={18} aria-hidden="true" className="text-primary" /> Message Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-semibold text-sm">What do you want to communicate?</Label>
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Tomorrow school will remain closed due to heavy rain. Online classes will resume as scheduled."
                  className="min-h-[110px] text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Language Options</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    aria-pressed={language === 'en'}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                      language === 'en'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border/40 bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    English Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('both')}
                    aria-pressed={language === 'both'}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                      language === 'both'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border/40 bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    English + Urdu
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-sm">Delivery Channels</Label>
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  {CHANNELS.map(ch => (
                    <div key={ch.id} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <Checkbox 
                        id={ch.id} 
                        checked={selectedChannels.includes(ch.id)}
                        onCheckedChange={() => handleChannelToggle(ch.id)}
                      />
                      <Label htmlFor={ch.id} className="text-xs font-medium cursor-pointer">{ch.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Target Audience</Label>
                <div className="flex flex-wrap gap-2.5 mt-1">
                  {user?.role === "super-admin" && (
                    <button
                      type="button"
                      onClick={() => handleRoleToggle("campus-admin")}
                      aria-pressed={targetRoles.includes("campus-admin")}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        targetRoles.includes("campus-admin") ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Campus Admins
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("teacher")}
                    aria-pressed={targetRoles.includes("teacher")}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      targetRoles.includes("teacher") ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Teachers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("student")}
                    aria-pressed={targetRoles.includes("student")}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      targetRoles.includes("student") ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Students
                  </button>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="h-11 w-full rounded-xl bg-ai-accent text-sm font-semibold text-ai-accent-foreground hover:bg-ai-accent/90"
              >
                {loading ? (
                  <><Sparkles className="mr-2 h-4 w-4 animate-pulse" aria-hidden="true" /> Generating…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Generate Communications</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Edit */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex h-full min-h-[600px] flex-col">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Edit3 size={18} aria-hidden="true" className="text-primary" /> Preview & Edit Communication Variants
              </CardTitle>
              <CardDescription className="text-sm">
                Review and customize the AI-generated variants before dispatching.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col">
              {!variants ? (
                <div className="flex flex-grow flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-ai-accent/10">
                    <MessageSquare className="size-7 text-ai-accent/60" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">Write a prompt and click Generate.</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">Multi-channel variants (Circular, SMS, WhatsApp, Notices) will display here.</p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-4">
                  <TabsList className="flex flex-wrap h-auto bg-transparent border-b border-border/50 p-0 rounded-none w-full justify-start gap-4 pb-1">
                    {selectedChannels.map(chId => (
                      <TabsTrigger 
                        key={chId} 
                        value={chId}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent transition-all px-2 py-2 text-xs font-bold"
                      >
                        {CHANNELS.find(c => c.id === chId)?.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {selectedChannels.map(chId => (
                    <TabsContent key={chId} value={chId} className="flex-grow pt-2 relative space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Editable Message Content:
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyText(chId)}
                        >
                          <Copy size={12} className="mr-1" aria-hidden="true" /> Copy Text
                        </Button>
                      </div>

                      <Textarea 
                        value={variants[chId] || ""}
                        onChange={(e) => handleVariantChange(chId, e.target.value)}
                        className="w-full h-full min-h-[380px] font-sans text-sm p-5 rounded-xl bg-card border border-border/60 focus-visible:ring-1 focus-visible:ring-primary shadow-xs resize-none leading-relaxed"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>

            {variants && (
              <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/30">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Ready to dispatch announcement?</span>
                  <span className="text-[11px] text-muted-foreground">This will notify targeted users across selected channels.</span>
                </div>
                <Button onClick={handleSend} size="default" disabled={loading} className="gap-2 rounded-xl px-6 font-semibold">
                  <Send className="h-4 w-4" aria-hidden="true" /> Dispatch All Channels
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
