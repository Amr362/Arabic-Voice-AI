import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetUserStats, useGetUserCredits, useListHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Mic, Clock, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Creator",
  pro_clone: "Pro Clone",
};

export default function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useGetUserStats();
  const { data: credits, isLoading: creditsLoading } = useGetUserCredits();
  const { data: history, isLoading: historyLoading } = useListHistory(
    { page: 1, limit: 3 },
    { query: { queryKey: getListHistoryQueryKey({ page: 1, limit: 3 }) } }
  );

  const usedPct = credits ? Math.min(100, (credits.creditsUsed / credits.creditsLimit) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">مرحباً بك في ArabVoice AI</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي التوليدات", value: stats?.totalGenerations, icon: Mic, loading: statsLoading },
            { label: "اليوم", value: stats?.todayGenerations, icon: Zap, loading: statsLoading },
            { label: "الخطة الحالية", value: credits ? PLAN_LABELS[credits.plan] : null, icon: TrendingUp, loading: creditsLoading },
            { label: "مدة التوليد", value: stats ? `${Math.round(stats.totalDuration)}s` : null, icon: Clock, loading: statsLoading },
          ].map(({ label, value, icon: Icon, loading }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-border/50 bg-card/60">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold" data-testid={`stat-${label}`}>{value ?? "—"}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Credits */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">استخدام الرصيد</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : credits ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {credits.creditsUsed} / {credits.creditsLimit} توليد
                  </span>
                  <span className="text-primary font-medium">{Math.round(usedPct)}%</span>
                </div>
                <Progress value={usedPct} className="h-2" data-testid="credits-progress" />
                {usedPct >= 90 && (
                  <p className="text-xs text-destructive">اقترب الرصيد من النفاد — يرجى ترقية خطتك</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick generate */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6 pb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">ابدأ التوليد الآن</h3>
              <p className="text-sm text-muted-foreground">حوّل نصك العربي إلى صوت احترافي</p>
            </div>
            <Link href="/dashboard/generate">
              <Button className="flex-shrink-0 gap-2" data-testid="button-quick-generate">
                <Mic className="h-4 w-4" />
                توليد صوت
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent history */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">آخر التوليدات</h2>
            <Link href="/dashboard/history">
              <span className="text-sm text-primary hover:underline cursor-pointer">عرض الكل</span>
            </Link>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : history?.items.length ? (
            <div className="space-y-3">
              {history.items.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AudioPlayer src={item.audioUrl} label={item.text.slice(0, 60)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                لا توجد توليدات بعد — ابدأ أول توليد!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
