import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { useListVoices, useGetUserCredits, getGetUserCreditsQueryKey, customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Copy, RotateCcw, Zap, Cpu, Database, Globe, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Dialect definitions ───────────────────────────────────────────────────────

type Dialect = "msa" | "egyptian";

const DIALECTS: { id: Dialect; label: string; sublabel: string; icon: typeof Zap; badge?: string }[] = [
  {
    id: "msa",
    label: "العربية الفصحى",
    sublabel: "Fast Standard Voice",
    icon: Zap,
  },
  {
    id: "egyptian",
    label: "اللهجة المصرية",
    sublabel: "Premium Egyptian AI Voice",
    icon: Star,
    badge: "AI",
  },
];

// ── Engine badge ──────────────────────────────────────────────────────────────

type EngineUsed = "edge-tts" | "xtts-egyptian" | "edge-tts-fallback" | "cached" | null;

const ENGINE_META: Record<string, { label: string; icon: typeof Zap; color: string; desc: string }> = {
  "edge-tts":         { label: "Edge-TTS",         icon: Zap,      color: "text-primary",     desc: "Railway Edge-TTS السريع" },
  "xtts-egyptian":    { label: "XTTS مصري",         icon: Star,     color: "text-amber-400",   desc: "Hugging Face XTTS-v2 بالمصري" },
  "edge-tts-fallback":{ label: "Edge-TTS احتياطي",  icon: Cpu,      color: "text-orange-400",  desc: "تم التبديل تلقائياً — XTTS غير متاح مؤقتاً" },
  "cached":           { label: "من الكاش",          icon: Database, color: "text-emerald-400", desc: "مخزن مسبقاً — لم يُخصم رصيد" },
};

function EngineBadge({ engine }: { engine: EngineUsed }) {
  if (!engine) return null;
  const meta = ENGINE_META[engine];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-card border border-border/60 ${meta.color}`}
      title={meta.desc}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
      {engine === "cached" && <span className="text-emerald-400/70 text-[10px]">• بدون خصم</span>}
    </motion.div>
  );
}

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { label: "ترحيب",        text: "أهلاً وسهلاً بكم في قناتنا. اشتركوا وفعّلوا جرس الإشعارات." },
  { label: "تيكتوك إعلان", text: "منتج رائع بسعر لا يصدق! اضغط الرابط في البايو الآن." },
  { label: "بودكاست",      text: "مرحباً بكم في برنامجنا. اليوم معنا ضيف مميز." },
  { label: "تنبيه",        text: "تنبيه مهم! يرجى الانتباه للتعليمات التالية." },
  { label: "يوتيوب",       text: "مرحباً بكم في فيديو جديد! لا تنسوا الإعجاب والاشتراك." },
  { label: "إعلان منتج",   text: "جرّب منتجنا الجديد الآن واحصل على خصم ٢٠٪ لفترة محدودة." },
];

const MAX_CHARS = 1000;

type GenerationStep = "idle" | "generating" | "uploading" | "done" | "error";

// ── Main component ────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [text, setText] = useState("");
  const [dialect, setDialect] = useState<Dialect>("msa");
  const [voiceId, setVoiceId] = useState("ar-EG-SalmaNeural");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<EngineUsed>(null);
  const [switched, setSwitched] = useState(false);
  const [step, setStep] = useState<GenerationStep>("idle");

  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | number | null>(null);

  const { data: voices, isLoading: voicesLoading } = useListVoices();
  const { data: credits } = useGetUserCredits();

  const isPending = step === "generating" || step === "uploading";

  // ── Smart dialect switch handler ───────────────────────────────────────────
  const handleDialectChange = (d: Dialect) => {
    setDialect(d);
    setAudioUrl(null);
    setEngineUsed(null);
    setSwitched(false);

    // Auto-set appropriate voice based on dialect
    if (d === "egyptian") {
      setVoiceId("ar-EG-SalmaNeural");
      toast.info("🎙️ تم تفعيل صوت الذكاء الاصطناعي المصري", {
        description: "سيُستخدم XTTS-v2 لتوليد اللهجة المصرية تلقائياً",
        duration: 3000,
      });
    } else {
      setVoiceId("ar-SA-ZariyahNeural");
      toast.info("⚡ تم تفعيل العربية الفصحى السريعة");
    }
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!text.trim()) { toast.error("يرجى إدخال النص أولاً"); return; }

    setStep("generating");
    setAudioUrl(null);
    setEngineUsed(null);
    setSwitched(false);

    const engineLabel = dialect === "egyptian" ? "الصوت المصري بالذكاء الاصطناعي" : "الصوت العربي";
    toastIdRef.current = toast.loading(`جاري توليد ${engineLabel}...`, {
      description: dialect === "egyptian"
        ? "XTTS-v2 يعالج اللهجة المصرية — قد يستغرق 10-20 ثانية"
        : "Edge-TTS جاري العمل...",
      duration: Infinity,
    });

    try {
      const result = await customFetch<{
        audioUrl: string;
        engineUsed: string;
        engine: string;
        dialect: string;
        switched: boolean;
        fromCache: boolean;
        historyId: string | null;
      }>("/api/tts/dialect", {
        method: "POST",
        body: JSON.stringify({ text, dialect, voiceId, speed: speed[0], pitch: pitch[0] }),
      });

      if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current);

      const eng = result.engineUsed as EngineUsed;
      setAudioUrl(result.audioUrl);
      setEngineUsed(eng);
      setSwitched(result.switched ?? false);
      setStep("done");

      queryClient.invalidateQueries({ queryKey: getGetUserCreditsQueryKey() });

      // Engine-specific toasts
      if (result.fromCache) {
        toast.success("صوت محفوظ مسبقاً — لم يُخصم رصيد", { icon: "💾" });
      } else if (result.switched) {
        toast.warning("تم التبديل تلقائياً لـ Edge-TTS", {
          description: "XTTS غير متاح مؤقتاً — جودة جيدة بصوت مصري",
          icon: "🔄",
        });
      } else if (eng === "xtts-egyptian") {
        toast.success("تم توليد الصوت المصري بنجاح!", {
          description: "XTTS-v2 ذكاء اصطناعي مصري 🇪🇬",
          icon: "⭐",
        });
      } else {
        toast.success("تم توليد الصوت بنجاح!", { icon: "🎙️" });
      }
    } catch (err: unknown) {
      if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current);
      setStep("error");
      const msg = (err as { data?: { error?: string } })?.data?.error
        ?? "فشل توليد الصوت. يرجى المحاولة مجدداً.";
      toast.error(msg);
    }
  };

  const copyText = () => { navigator.clipboard.writeText(text); toast.success("تم النسخ"); };
  const clearText = () => { setText(""); setAudioUrl(null); setEngineUsed(null); setStep("idle"); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">توليد صوت</h1>
            <p className="text-muted-foreground text-sm mt-0.5">حوّل نصك العربي إلى صوت احترافي</p>
          </div>
          {credits && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">الرصيد المتبقي</p>
              <p className="text-lg font-bold text-primary">
                {credits.creditsLimit - credits.creditsUsed}
              </p>
            </div>
          )}
        </div>

        {/* ── Dialect Selector ─────────────────────────────────────────────── */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              اختر اللهجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DIALECTS.map((d) => {
                const Icon = d.icon;
                const isSelected = dialect === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleDialectChange(d.id)}
                    className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-right transition-all duration-200
                      ${isSelected
                        ? "border-primary bg-primary/8 shadow-sm shadow-primary/20"
                        : "border-border/50 hover:border-border bg-card/40 hover:bg-card/70"
                      }`}
                  >
                    <div className="flex items-center gap-2 w-full justify-between">
                      <div className={`flex items-center gap-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                        {d.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                            {d.badge}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="h-2 w-2 rounded-full bg-primary"
                        />
                      )}
                    </div>
                    <span className={`font-semibold text-sm ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {d.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">{d.sublabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Engine info banner */}
            <AnimatePresence mode="wait">
              <motion.div
                key={dialect}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                  ${dialect === "egyptian"
                    ? "bg-amber-500/8 border border-amber-500/20 text-amber-400"
                    : "bg-primary/8 border border-primary/20 text-primary"
                  }`}
              >
                {dialect === "egyptian" ? (
                  <>
                    <Star className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>سيُستخدم <strong>XTTS-v2</strong> لتوليد اللهجة المصرية — مع تبديل تلقائي لـ Edge-TTS عند الضرورة</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span><strong>Edge-TTS</strong> — توليد فوري بالعربية الفصحى عالية الجودة</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ── Text input ───────────────────────────────────────────────────── */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">النص</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => setText(t.text)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border/70 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
                placeholder={dialect === "egyptian"
                  ? "اكتب نصك بالعامية المصرية هنا..."
                  : "اكتب نصك بالعربية الفصحى هنا..."
                }
                rows={5}
                className="w-full bg-background border border-input rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-right leading-relaxed"
                dir="rtl"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button onClick={copyText} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="نسخ">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={clearText} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="مسح">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length} / {MAX_CHARS}</span>
              {text.length > MAX_CHARS * 0.9 && (
                <span className="text-xs text-amber-400">اقتربت من الحد الأقصى</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Voice settings (MSA only shows voice select) ─────────────────── */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">إعدادات الصوت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {dialect === "msa" && (
              <div className="space-y-2">
                <Label>الصوت</Label>
                {voicesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={voiceId} onValueChange={setVoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصوت" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices?.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} — {v.locale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {dialect === "egyptian" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                <Star className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">صوت مصري بالذكاء الاصطناعي</p>
                  <p className="text-xs text-muted-foreground mt-0.5">يستخدم XTTS-v2 مع صوت افتراضي مصري — محسّن لتيكتوك وريلز</p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>السرعة</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">{speed[0].toFixed(1)}x</span>
                </div>
                <Slider min={0.5} max={2} step={0.1} value={speed} onValueChange={setSpeed} />
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>بطيء</span><span>طبيعي</span><span>سريع</span>
                </div>
              </div>

              {dialect === "msa" && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>طبقة الصوت</Label>
                    <span className="text-sm text-muted-foreground tabular-nums">{pitch[0] > 0 ? `+${pitch[0]}` : pitch[0]}Hz</span>
                  </div>
                  <Slider min={-20} max={20} step={1} value={pitch} onValueChange={setPitch} />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>منخفض</span><span>طبيعي</span><span>مرتفع</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Generate button ───────────────────────────────────────────────── */}
        <Button
          className={`w-full h-12 text-base font-semibold gap-2 ${dialect === "egyptian" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
          onClick={handleGenerate}
          disabled={isPending || !text.trim()}
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              {dialect === "egyptian" ? "جاري توليد الصوت المصري..." : "جاري التوليد..."}
            </>
          ) : (
            <>
              {dialect === "egyptian" ? <Star className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {dialect === "egyptian" ? "توليد بصوت مصري AI" : "توليد الصوت"}
            </>
          )}
        </Button>

        {/* ── Result ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {audioUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">النتيجة</span>
                <EngineBadge engine={engineUsed} />
              </div>
              {switched && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400"
                >
                  <Cpu className="h-3.5 w-3.5 flex-shrink-0" />
                  تم التبديل تلقائياً لـ Edge-TTS — XTTS غير متاح مؤقتاً
                </motion.div>
              )}
              <AudioPlayer src={audioUrl} label={text.slice(0, 60)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
