import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetUserCredits } from "@workspace/api-client-react";
import { Check, MessageCircle, Zap, Star, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const WA_NUMBER = "201271284263";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    currency: "جنيه",
    icon: Zap,
    iconColor: "text-muted-foreground",
    features: ["10 توليدات يومياً", "Edge-TTS فقط", "عربية فصحى", "حد أقصى 600 حرف"],
    whatsapp: null,
    highlight: false,
    badgeText: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: "99",
    currency: "جنيه/شهر",
    icon: Sparkles,
    iconColor: "text-blue-400",
    features: ["200 توليد شهرياً", "جودة HD", "بدون علامة مائية", "تحميل MP3", "لهجة مصرية + فصحى"],
    whatsapp: `أريد الاشتراك في خطة Starter بـ ArabVoice AI 🎙️`,
    highlight: false,
    badgeText: null,
  },
  {
    id: "creator",
    name: "Creator",
    price: "249",
    currency: "جنيه/شهر",
    icon: Star,
    iconColor: "text-amber-400",
    features: ["1000 توليد شهرياً", "تصدير WAV", "طابور أسرع", "XTTS مصري متقدم", "كل ميزات Starter"],
    whatsapp: `أريد الاشتراك في خطة Creator بـ ArabVoice AI ⭐`,
    highlight: true,
    badgeText: "الأكثر شيوعاً",
  },
  {
    id: "pro_clone",
    name: "Pro Clone",
    price: "499",
    currency: "جنيه/شهر",
    icon: Crown,
    iconColor: "text-purple-400",
    features: ["استنساخ صوتك بالذكاء الاصطناعي", "أصوات مخصصة غير محدودة", "XTTS-v2 كامل", "سجل غير محدود", "كل ميزات Creator"],
    whatsapp: `أريد الاشتراك في خطة Pro Clone بـ ArabVoice AI 👑`,
    highlight: false,
    badgeText: "للمحترفين",
  },
];

const PAYMENT_METHODS = ["Vodafone Cash", "Orange Cash", "Etisalat Cash", "InstaPay", "تحويل بنكي"];

export default function SubscriptionPage() {
  const { data: credits } = useGetUserCredits();
  const currentPlan = credits?.plan ?? "free";

  const openWhatsApp = (msg: string) => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6" dir="rtl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">الاشتراك</h1>
          <p className="text-muted-foreground text-sm mt-1">
            خطتك الحالية:{" "}
            <span className="text-primary font-medium capitalize">{currentPlan}</span>
          </p>
        </div>

        {/* Payment notice */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">الدفع عبر واتساب</p>
                <p className="text-xs text-muted-foreground">
                  نقبل: {PAYMENT_METHODS.join(" • ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  بعد إرسال إيصال الدفع يقوم الفريق بتفعيل اشتراكك خلال 24 ساعة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.id;
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`h-full relative ${
                  isCurrent
                    ? "border-primary shadow-md shadow-primary/10"
                    : plan.highlight
                      ? "border-amber-500/40 shadow-sm shadow-amber-500/10"
                      : "border-border/50"
                }`}>
                  {/* Badge */}
                  {(isCurrent || plan.badgeText) && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className={`text-xs px-3 py-0.5 rounded-full font-medium ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-500 text-white"
                      }`}>
                        {isCurrent ? "خطتك الحالية" : plan.badgeText}
                      </span>
                    </div>
                  )}

                  <CardContent className="pt-6 pb-5 flex flex-col h-full">
                    {/* Plan icon + name */}
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-black text-primary">{plan.price}</span>
                      {plan.price !== "0" && (
                        <span className="text-xs text-muted-foreground mr-1">{plan.currency}</span>
                      )}
                      {plan.price === "0" && (
                        <span className="text-xs text-muted-foreground mr-1">مجاناً</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 flex-1 mb-5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    {plan.whatsapp && !isCurrent ? (
                      <Button
                        className={`w-full gap-2 ${plan.highlight ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""}`}
                        variant={plan.highlight ? "default" : "outline"}
                        onClick={() => openWhatsApp(plan.whatsapp!)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        اشترك عبر واتساب
                      </Button>
                    ) : isCurrent ? (
                      <Button className="w-full" variant="secondary" disabled>
                        خطتك الحالية ✓
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* WhatsApp CTA footer */}
        <Card className="border-green-500/20 bg-gradient-to-l from-green-500/5 to-transparent">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div dir="rtl">
                <p className="font-semibold text-sm">هل لديك استفسار؟</p>
                <p className="text-xs text-muted-foreground mt-0.5">فريقنا متاح عبر واتساب لمساعدتك في اختيار الخطة المناسبة</p>
              </div>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                onClick={() => openWhatsApp("مرحباً، أريد الاستفسار عن خطط ArabVoice AI 🎙️")}
              >
                <MessageCircle className="h-4 w-4" />
                تواصل معنا عبر واتساب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
