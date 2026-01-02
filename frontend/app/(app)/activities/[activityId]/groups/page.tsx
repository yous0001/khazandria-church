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
  });

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["groups", activityId],
    queryFn: () => api.groups.list(activityId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/activities">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">المجموعات</h2>
          {activity && (
            <p className="text-sm text-muted-foreground">{activity.name}</p>
          )}
        </div>
        <CreateGroupDialog activityId={activityId} />
      </div>

      {groups?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              لا توجد مجموعات متاحة
            </p>
            <CreateGroupDialog activityId={activityId} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups?.map((group) => (
            <Link key={group._id} href={`/groups/${group._id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {group.name}
                  </CardTitle>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                {group.labels.length > 0 && (
                  <CardContent>
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
          ))}
        </div>
      )}
    </div>
  );
}

