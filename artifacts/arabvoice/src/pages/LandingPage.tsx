import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Zap, Shield, Globe, ChevronDown, Star, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Free",
    price: "0",
    currency: "جنيه",
    period: "/شهر",
    description: "للتجربة والاستخدام المحدود",
    features: ["10 توليدات يومياً", "Edge-TTS فقط", "حد أقصى 30 ثانية", "جودة قياسية"],
    cta: "ابدأ مجاناً",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Starter",
    price: "99",
    currency: "جنيه",
    period: "/شهر",
    description: "للمبدعين والمحتوى الرقمي",
    features: ["200 توليد شهرياً", "جودة عالية HD", "بدون علامة مائية", "تحميل MP3"],
    cta: "اشترك الآن",
    whatsapp: "أريد الاشتراك في خطة Starter لـ ArabVoice AI",
    highlight: false,
  },
  {
    name: "Creator",
    price: "249",
    currency: "جنيه",
    period: "/شهر",
    description: "للمحترفين وصناع المحتوى",
    features: ["1000 توليد شهرياً", "تصدير WAV", "طابور أسرع", "كل ميزات Starter"],
    cta: "اشترك الآن",
    whatsapp: "أريد الاشتراك في خطة Creator لـ ArabVoice AI",
    highlight: true,
  },
  {
    name: "Pro Clone",
    price: "499",
    currency: "جنيه",
    period: "/شهر",
    description: "لاستنساخ الأصوات والاحتراف الكامل",
    features: ["استنساخ صوتك بالذكاء الاصطناعي", "أصوات مخصصة", "سجل غير محدود", "كل ميزات Creator"],
    cta: "اشترك الآن",
    whatsapp: "أريد الاشتراك في خطة Pro Clone لـ ArabVoice AI",
    highlight: false,
  },
];

const FEATURES = [
  { icon: Mic, title: "أصوات عربية طبيعية", desc: "أكثر من 10 أصوات عربية بلهجات متعددة — مصري، خليجي، مغربي والمزيد" },
  { icon: Zap, title: "توليد فوري", desc: "احصل على صوتك في ثوانٍ بدون انتظار أو معالجة محلية" },
  { icon: Shield, title: "آمن ومحمي", desc: "بياناتك محمية — لا يتم تخزين أو مشاركة محادثاتك" },
  { icon: Globe, title: "TikTok & Reels", desc: "محسّن لمحتوى منصات التواصل الاجتماعي — مثالي للريلز والتيكتوك" },
];

const FAQS = [
  { q: "ما هو ArabVoice AI؟", a: "منصة متخصصة في توليد الأصوات العربية بالذكاء الاصطناعي، تدعم اللهجة المصرية والعربية الفصحى وعدة لهجات خليجية." },
  { q: "هل يمكنني استنساخ صوتي؟", a: "نعم! خطة Pro Clone تتيح لك رفع عينة صوتية وتوليد محتوى بصوتك الخاص عبر تقنية XTTS-v2." },
  { q: "كيف يتم الدفع؟", a: "ندعم Vodafone Cash، Orange Cash، Etisalat Cash، وInstaPay. بعد إرسال الطلب عبر واتساب يقوم الفريق بتفعيل اشتراكك خلال 24 ساعة." },
  { q: "هل يمكنني إلغاء الاشتراك؟", a: "نعم، يمكنك إلغاء اشتراكك في أي وقت بدون رسوم إضافية." },
];

function WaveformHero() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => {
        const h = 8 + Math.abs(Math.sin(i * 0.4) * 40 + Math.sin(i * 0.15) * 20);
        return (
          <motion.div
            key={i}
            className="rounded-full bg-primary/70"
            style={{ width: 3 }}
            animate={{ height: [h * 0.4, h, h * 0.4] }}
            transition={{ duration: 1.2 + (i % 5) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.03 }}
          />
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/201271284263?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-primary">ArabVoice AI</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a>
            <a href="#faq" className="hover:text-foreground transition-colors">الأسئلة الشائعة</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm" data-testid="link-login">تسجيل الدخول</Button></Link>
            <Link href="/signup"><Button size="sm" data-testid="link-signup">ابدأ مجاناً</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge className="mb-6 px-4 py-1.5 text-sm" variant="outline">
            منصة الأصوات العربية بالذكاء الاصطناعي
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
            حوّل نصك إلى<br />
            <span className="text-primary">صوت عربي احترافي</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            أنشئ تعليقات صوتية لـ TikTok وReels، استنسخ صوتك، وولّد محتوى صوتي عربي عالي الجودة في ثوانٍ معدودة.
          </p>

          <WaveformHero />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/signup">
              <Button size="lg" className="px-8 h-12 text-base font-semibold" data-testid="cta-get-started">
                ابدأ مجاناً الآن
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base" data-testid="cta-login">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-card/30" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold mb-3">كل ما تحتاجه لصوت احترافي</h2>
            <p className="text-muted-foreground">أدوات متكاملة لإنشاء محتوى صوتي عربي مميز</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6 pb-5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">خطط تناسب الجميع</h2>
            <p className="text-muted-foreground">الدفع بالجنيه المصري — Vodafone Cash، Orange Cash، InstaPay</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className={`h-full relative ${plan.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <Badge className="px-3 py-0.5 text-xs">الأكثر شيوعاً</Badge>
                    </div>
                  )}
                  <CardContent className="pt-6 pb-5 flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.currency}{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.whatsapp ? (
                      <Button
                        className="w-full"
                        variant={plan.highlight ? "default" : "outline"}
                        onClick={() => openWhatsApp(plan.whatsapp!)}
                        data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
                      >
                        {plan.cta}
                      </Button>
                    ) : (
                      <Link href={plan.href!}>
                        <Button className="w-full" variant="outline" data-testid="button-free-plan">
                          {plan.cta}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-card/30" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">ماذا يقول المستخدمون</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "أحمد محمود", role: "صانع محتوى", text: "بقيت أعمل فيديوهات TikTok بسهولة مع ArabVoice AI — الصوت مصري طبيعي جداً." },
              { name: "سارة خليل", role: "مدرّبة أونلاين", text: "استنساخ الصوت مذهل، بقيت أسجّل محتوى تعليمي بصوتي بدون ما أتعب من التسجيل طوال اليوم." },
              { name: "محمد العتيبي", role: "مسوّق رقمي", text: "أفضل منصة عربية للأصوات. الأسعار مناسبة والجودة عالية جداً." },
            ].map(({ name, role, text }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{text}</p>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">الأسئلة الشائعة</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-5 text-right font-medium hover:bg-card/80 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    data-testid={`faq-toggle-${i}`}
                  >
                    {q}
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-12 border border-primary/20"
        >
          <h2 className="text-3xl font-bold mb-4">جاهز تبدأ؟</h2>
          <p className="text-muted-foreground mb-8">انضم لآلاف المبدعين العرب الذين يستخدمون ArabVoice AI</p>
          <Link href="/signup">
            <Button size="lg" className="px-10 h-12 text-base font-semibold" data-testid="cta-final">
              ابدأ مجاناً الآن
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-sm text-muted-foreground" dir="rtl">
        <p>© 2024 ArabVoice AI — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
