import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "حدث خطأ. يرجى المحاولة مجدداً.");
    } else {
      toast.success("تم إنشاء الحساب! يرجى تأكيد بريدك الإلكتروني.");
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-black text-primary cursor-pointer">ArabVoice AI</span>
          </Link>
          <h1 className="text-xl font-bold mt-4 mb-1">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground text-sm">ابدأ رحلتك مع الأصوات العربية بالذكاء الاصطناعي</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  placeholder="اسمك الكريم"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6 أحرف على الأقل"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading} data-testid="button-signup">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء الحساب"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <Link href="/login">
                  <span className="text-primary hover:underline cursor-pointer font-medium">تسجيل الدخول</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
