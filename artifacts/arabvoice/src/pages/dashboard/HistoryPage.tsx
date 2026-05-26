import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useListHistory, useDeleteHistory, getListHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const LIMIT = 10;

const ENGINE_LABELS: Record<string, string> = {
  "edge-tts": "Edge-TTS",
  "xtts": "XTTS (Clone)",
};

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListHistory(
    { page, limit: LIMIT },
    { query: { queryKey: getListHistoryQueryKey({ page, limit: LIMIT }) } }
  );

  const deleteItem = useDeleteHistory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey({ page, limit: LIMIT }) });
        toast.success("تم الحذف");
      },
      onError: () => toast.error("فشل الحذف"),
    },
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">سجل التوليدات</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? `${data.total} توليد إجمالاً` : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : data?.items.length ? (
          <div className="space-y-4">
            {data.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`history-item-${item.id}`}
              >
                <Card className="border-border/50 bg-card/60">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2" dir="rtl">{item.text}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric", month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {ENGINE_LABELS[item.engine] ?? item.engine}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem.mutate({ id: item.id })}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <AudioPlayer src={item.audioUrl} label={item.text.slice(0, 40)} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              لا توجد توليدات بعد
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline" size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline" size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              data-testid="button-next-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
