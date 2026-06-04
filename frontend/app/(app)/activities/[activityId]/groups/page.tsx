"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ArrowRight, Users } from "lucide-react";
import { CreateGroupDialog } from "@/components/dialogs/create-group-dialog";
import { EditActivityExamsDialog } from "@/components/dialogs/edit-activity-exams-dialog";
import { EditActivityDialog } from "@/components/dialogs/edit-activity-dialog";
import { PageHeader } from "@/components/layout/page-header";
import type { Group, Activity } from "@/types/domain";

export default function GroupsPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["groups", activityId],
    queryFn: () => api.groups.list(activityId),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="المجموعات" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Link href="/activities">
          <Button variant="ghost" size="icon" className="shrink-0 mt-0.5">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          className="flex-1 min-w-0"
          title="المجموعات"
          description={activity?.name}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <EditActivityDialog activityId={activityId} />
              <EditActivityExamsDialog activityId={activityId} />
              <CreateGroupDialog activityId={activityId} />
            </div>
          }
        />
      </div>

      {activity && (
        <Card className="surface-card">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">امتحانات النشاط</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.globalGrades.length === 0
                    ? "لم تُضف امتحانات بعد"
                    : `${activity.globalGrades.length} امتحان`}
                </p>
              </div>
              {activity.globalGrades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activity.globalGrades.map((grade) => (
                    <Badge key={grade.name} variant="secondary">
                      {grade.name}: {grade.fullMark}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {groups?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              لا توجد مجموعات متاحة
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <EditActivityExamsDialog activityId={activityId} />
              <CreateGroupDialog activityId={activityId} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {groups?.map((group) => (
            <li key={group._id}>
              <Link
                href={`/groups/${group._id}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="surface-card-interactive cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-lg font-semibold">
                      {group.name}
                    </CardTitle>
                    <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardHeader>
                  {group.labels.length > 0 && (
                    <CardContent className="pt-0 pb-4">
                      <div className="flex gap-2 flex-wrap">
                        {group.labels.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
