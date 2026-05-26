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

export default function LoginPage() {
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("خطأ في تسجيل الدخول. تحقق من بريدك الإلكتروني وكلمة المرور.");
    } else {
      toast.success("مرحباً بك!");
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
          <h1 className="text-xl font-bold mt-4 mb-1">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm">أهلاً بك مجدداً</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading} data-testid="button-login">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link href="/signup">
                  <span className="text-primary hover:underline cursor-pointer font-medium">إنشاء حساب</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
