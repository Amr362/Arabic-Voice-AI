import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useGenerateXtts, useGetUserCredits } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Upload, Wand2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const MAX_CHARS = 2000;

export default function ClonePage() {
  const { user } = useAuth();
  const { data: credits } = useGetUserCredits();
  const [text, setText] = useState("");
  const [speakerUrl, setSpeakerUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = useGenerateXtts();
  const canClone = credits?.canUseXtts;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSpeakerUrl(url);
    toast.success("تم رفع الملف الصوتي");
  };

  const handleGenerate = () => {
    if (!text.trim()) { toast.error("يرجى إدخال النص"); return; }
    if (!speakerUrl) { toast.error("يرجى رفع عينة صوتية أولاً"); return; }
    if (!user) { toast.error("يرجى تسجيل الدخول"); return; }

    generate.mutate(
      { data: { text, speakerAudioUrl: speakerUrl, language: "ar" } },
      {
        onSuccess: (res) => {
          setAudioUrl(res.audioUrl);
          toast.success("تم استنساخ الصوت بنجاح!");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "فشل استنساخ الصوت";
          toast.error(msg);
        },
      }
    );
  };

  if (!canClone) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">استنساخ الصوت — Pro Clone</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              هذه الميزة متاحة فقط لمشتركي خطة Pro Clone. قم بالترقية للحصول على صوتك الشخصي بالذكاء الاصطناعي.
            </p>
            <Link href="/dashboard/subscription">
              <Button size="lg" className="gap-2" data-testid="button-upgrade-clone">
                <Wand2 className="h-4 w-4" />
                ترقية إلى Pro Clone
              </Button>
            </Link>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">استنساخ الصوت</h1>
          <p className="text-muted-foreground text-sm mt-1">ولّد محتوى صوتي بصوتك الشخصي</p>
        </div>

        {/* Upload */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">عينة الصوت</CardTitle></CardHeader>
          <CardContent>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} data-testid="input-audio-file" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-primary rounded-xl py-10 flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-upload-voice"
            >
              <Upload className="h-8 w-8" />
              <p className="font-medium">ارفع عينة صوتية (MP3, WAV)</p>
              <p className="text-xs">يُنصح بتسجيل 10-30 ثانية بصوت واضح</p>
            </button>
            {speakerUrl && (
              <div className="mt-4">
                <AudioPlayer src={speakerUrl} label="عينة الصوت المرفوعة" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Text */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">النص المراد نطقه</CardTitle></CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="اكتب النص الذي تريد نطقه بصوتك..."
              rows={5}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-right"
              dir="rtl"
              data-testid="input-clone-text"
            />
            <p className="text-xs text-muted-foreground text-left mt-1">{text.length} / {MAX_CHARS}</p>
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-base font-semibold gap-2"
          onClick={handleGenerate}
          disabled={generate.isPending || !text.trim() || !speakerUrl}
          data-testid="button-clone-generate"
        >
          {generate.isPending ? (
            <><span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />جاري الاستنساخ...</>
          ) : (
            <><Wand2 className="h-5 w-5" />استنساخ الصوت</>
          )}
        </Button>

        {audioUrl && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AudioPlayer src={audioUrl} label={text.slice(0, 50)} />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
