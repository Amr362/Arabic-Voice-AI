import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminStats, useListAdminUsers, useUpdateUserSubscription, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Users, Zap, TrendingUp, CreditCard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const PLANS = ["free", "starter", "creator", "pro_clone"];
const PLAN_LABELS: Record<string, string> = { free: "Free", starter: "Starter", creator: "Creator", pro_clone: "Pro Clone" };

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [changingUser, setChangingUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({});

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListAdminUsers(
    { page, limit: 20 },
    { query: { queryKey: getListAdminUsersQueryKey({ page, limit: 20 }) } }
  );

  const updateSub = useUpdateUserSubscription();

  const handleUpdatePlan = (userId: string) => {
    const plan = selectedPlan[userId];
    if (!plan) return;
    setChangingUser(userId);
    updateSub.mutate(
      { id: userId, data: { plan } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ page, limit: 20 }) });
          toast.success("تم تحديث الاشتراك");
          setChangingUser(null);
        },
        onError: () => {
          toast.error("فشل التحديث");
          setChangingUser(null);
        },
      }
    );
  };

  // Basic admin check — in production use proper RBAC
  if (!user?.email) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <span className="text-xl font-black text-primary cursor-pointer">ArabVoice AI</span>
          </Link>
          <span className="text-sm text-muted-foreground">Admin Panel</span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Platform Overview</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats?.totalUsers, icon: Users },
            { label: "Total Generations", value: stats?.totalGenerations, icon: Zap },
            { label: "Today's Generations", value: stats?.todayGenerations, icon: TrendingUp },
            { label: "Active Subscriptions", value: stats?.activeSubscriptions, icon: CreditCard },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-border/50 bg-card/60">
                <CardContent className="pt-5 pb-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold" data-testid={`admin-stat-${label}`}>{value ?? "—"}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Users table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Users Management</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 pr-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Current Plan</th>
                      <th className="text-left py-3 px-4 font-medium">Credits Used</th>
                      <th className="text-left py-3 px-4 font-medium">Joined</th>
                      <th className="text-left py-3 pl-4 font-medium">Update Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.items.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-card/40" data-testid={`user-row-${u.id}`}>
                        <td className="py-3 pr-4 truncate max-w-[200px]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {PLAN_LABELS[u.plan] ?? u.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.creditsUsed}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedPlan[u.id] ?? u.plan}
                              onValueChange={v => setSelectedPlan(prev => ({ ...prev, [u.id]: v }))}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs" data-testid={`select-plan-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PLANS.map(p => (
                                  <SelectItem key={p} value={p} className="text-xs">
                                    {PLAN_LABELS[p]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleUpdatePlan(u.id)}
                              disabled={changingUser === u.id || (selectedPlan[u.id] ?? u.plan) === u.plan}
                              data-testid={`button-update-plan-${u.id}`}
                            >
                              Save
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users && users.total > 20 && (
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">Page {page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={users.items.length < 20}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
