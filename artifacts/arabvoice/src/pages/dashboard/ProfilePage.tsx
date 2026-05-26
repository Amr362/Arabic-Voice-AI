import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserProfile, useUpdateUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [name, setName] = useState("");

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: { name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          toast.success("تم حفظ الملف الشخصي");
        },
        onError: () => toast.error("فشل الحفظ"),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">الملف الشخصي</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة بيانات حسابك</p>
        </div>

        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">المعلومات الشخصية</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                {/* Avatar placeholder */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground flex-shrink-0">
                    {(profile?.name ?? profile?.email ?? "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{profile?.name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{profile?.plan}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name">الاسم</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="اسمك الكريم"
                    data-testid="input-profile-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">البريد الإلكتروني</Label>
                  <Input
                    id="profile-email"
                    value={profile?.email ?? user?.email ?? ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                    data-testid="input-profile-email"
                  />
                  <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                </div>

                <div className="space-y-2">
                  <Label>الخطة الحالية</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium" data-testid="text-current-plan">
                      {profile?.plan ?? "free"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الانضمام</Label>
                  <p className="text-sm text-muted-foreground" data-testid="text-joined">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="gap-2"
                  data-testid="button-save-profile"
                >
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  حفظ التغييرات
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
