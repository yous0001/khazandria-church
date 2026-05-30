"use client";

import Link from "next/link";
import { BarChart3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentEnrollmentSummary } from "@/types/domain";

interface StudentReportButtonProps {
  studentId: string;
  enrollments: StudentEnrollmentSummary[];
}

export function StudentReportButton({
  studentId,
  enrollments,
}: StudentReportButtonProps) {
  if (enrollments.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled
        title="الطالب غير مسجل في أي نشاط"
      >
        <BarChart3 className="h-4 w-4" />
        التقرير
      </Button>
    );
  }

  const reportHref = (activityId: string) =>
    `/reports?tab=student&activity=${activityId}&student=${studentId}`;

  if (enrollments.length === 1) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" asChild>
        <Link href={reportHref(enrollments[0].activityId)}>
          <BarChart3 className="h-4 w-4" />
          التقرير
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BarChart3 className="h-4 w-4" />
          التقرير
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {enrollments.map((enrollment) => (
          <DropdownMenuItem key={enrollment.activityId} asChild>
            <Link href={reportHref(enrollment.activityId)}>
              {enrollment.activityName}
              <span className="text-xs text-muted-foreground mr-1">
                ({enrollment.groupName})
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
