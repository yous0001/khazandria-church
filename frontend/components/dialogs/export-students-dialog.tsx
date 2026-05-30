"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { downloadStudentsExportXlsx } from "@/lib/export/students-csv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Activity, Group } from "@/types/domain";

interface ExportStudentsDialogProps {
  trigger?: React.ReactNode;
  defaultActivityId?: string;
  defaultGroupId?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function ExportStudentsDialog({
  trigger,
  defaultActivityId = "",
  defaultGroupId = "",
  defaultStartDate = "",
  defaultEndDate = "",
}: ExportStudentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityId, setActivityId] = useState(defaultActivityId);
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [exporting, setExporting] = useState(false);

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
    enabled: open,
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["groups", activityId],
    queryFn: () => api.groups.list(activityId),
    enabled: open && !!activityId,
  });

  const handleExport = async () => {
    if (!activityId) {
      toast.error("يرجى اختيار النشاط");
      return;
    }

    setExporting(true);
    try {
      const data = await api.reports.exportActivityStudents(
        activityId,
        startDate || undefined,
        endDate || undefined,
        groupId || undefined
      );

      if (data.rows.length === 0) {
        toast.error("لا توجد بيانات للتصدير");
        return;
      }

      downloadStudentsExportXlsx(data);
      toast.success(`تم تصدير ${data.rows.length} طالب`);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء التصدير"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setActivityId(defaultActivityId);
          setGroupId(defaultGroupId);
          setStartDate(defaultStartDate);
          setEndDate(defaultEndDate);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير الطلاب
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تصدير تقرير الطلاب</DialogTitle>
          <DialogDescription>
            تصدير ملف Excel (.xlsx) يحتوي على أسماء الطلاب والمجموعات والحضور والدرجات
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>النشاط</Label>
            <Select
              value={activityId}
              onValueChange={(value) => {
                setActivityId(value);
                setGroupId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النشاط" />
              </SelectTrigger>
              <SelectContent>
                {activities?.map((activity) => (
                  <SelectItem key={activity._id} value={activity._id}>
                    {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>المجموعة (اختياري)</Label>
            <Select
              value={groupId || "all"}
              onValueChange={(value) =>
                setGroupId(value === "all" ? "" : value)
              }
              disabled={!activityId}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل المجموعات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {groups?.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exportStartDate">من تاريخ</Label>
              <Input
                id="exportStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exportEndDate">إلى تاريخ</Label>
              <Input
                id="exportEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleExport} disabled={!activityId || exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
