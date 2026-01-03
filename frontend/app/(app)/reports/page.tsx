"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, TrendingUp, Award, CheckCircle, XCircle, Calendar, X } from "lucide-react";
import type { Activity, Group, StudentSummary, GroupPerformance } from "@/types/domain";

export default function ReportsPage() {
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["groups", selectedActivity],
    queryFn: () => api.groups.list(selectedActivity),
    enabled: !!selectedActivity,
  });

  const { data: students } = useQuery<any[]>({
    queryKey: ["group-students", selectedGroup],
    queryFn: () => api.enrollments.list(selectedGroup),
    enabled: !!selectedGroup,
  });

  const { data: studentSummary, isLoading: summaryLoading } = useQuery<StudentSummary>({
    queryKey: ["student-summary", selectedActivity, selectedStudent, startDate, endDate],
    queryFn: () =>
      api.reports.studentSummary(
        selectedActivity,
        selectedStudent,
        startDate || undefined,
        endDate || undefined
      ),
    enabled: !!selectedActivity && !!selectedStudent,
  });

  const { data: groupPerformance, isLoading: performanceLoading } = useQuery<GroupPerformance[]>({
    queryKey: ["group-performance", selectedGroup, startDate, endDate],
    queryFn: () =>
      api.reports.groupPerformance(selectedGroup, startDate || undefined, endDate || undefined),
    enabled: !!selectedGroup,
  });

  const handleActivityChange = (value: string) => {
    setSelectedActivity(value);
    setSelectedGroup("");
    setSelectedStudent("");
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    setSelectedStudent("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">التقارير</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>النشاط</Label>
              <Select value={selectedActivity} onValueChange={handleActivityChange}>
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
              <Label>المجموعة</Label>
              <Select
                value={selectedGroup}
                onValueChange={handleGroupChange}
                disabled={!selectedActivity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الطالب</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={!selectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((enrollment: any) => (
                    <SelectItem
                      key={enrollment._id}
                      value={enrollment.studentId?._id || enrollment.studentId}
                    >
                      {enrollment.studentId?.name || "طالب"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="startDate">من تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                disabled={!startDate && !endDate}
                className="w-full"
              >
                <X className="h-4 w-4 ml-2" />
                إزالة الفلتر
              </Button>
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="text-sm text-muted-foreground pt-2 border-t">
              <span className="font-medium">الفترة المحددة:</span>{" "}
              {startDate
                ? new Date(startDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "من البداية"}{" "}
              -{" "}
              {endDate
                ? new Date(endDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "حتى الآن"}
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedActivity ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              اختر نشاط لعرض التقارير
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="group" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" />
              أداء المجموعة
            </TabsTrigger>
            <TabsTrigger value="student" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              ملخص الطالب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="mt-4">
            {!selectedGroup ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    اختر مجموعة لعرض أداء الطلاب
                  </p>
                </CardContent>
              </Card>
            ) : performanceLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-4">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groupPerformance?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    لا توجد بيانات للعرض
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupPerformance?.map((student, index) => (
                  <Card key={student.studentId}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span>
                                الحضور: {student.sessionsPresent}/{student.totalSessions}
                              </span>
                              <span>
                                درجات الجلسات: {student.totalSessionMark}
                              </span>
                              {student.totalGlobalMark > 0 && (
                                <span>
                                  الدرجات الإجمالية: {student.totalGlobalMark}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-bold text-primary">
                            {student.totalFinalMark}
                          </div>
                          <div className="text-xs text-muted-foreground">المجموع النهائي</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {student.totalSessions > 0
                              ? Math.round((student.sessionsPresent / student.totalSessions) * 100)
                              : 0}% حضور
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="student" className="mt-4">
            {!selectedStudent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    اختر طالب لعرض ملخص أدائه
                  </p>
                </CardContent>
              </Card>
            ) : summaryLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-6">
                      <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : studentSummary ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{studentSummary.studentName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                        label="أيام الحضور"
                        value={studentSummary.sessionsPresent}
                        subtext={`من ${studentSummary.totalSessions} جلسة`}
                      />
                      <StatCard
                        icon={<XCircle className="h-5 w-5 text-red-500" />}
                        label="أيام الغياب"
                        value={studentSummary.sessionsAbsent}
                        subtext={`${Math.round(studentSummary.attendanceRate)}% حضور`}
                      />
                      <StatCard
                        icon={<Award className="h-5 w-5 text-primary" />}
                        label="درجات الجلسات"
                        value={studentSummary.totalSessionMark}
                      />
                      <StatCard
                        icon={<TrendingUp className="h-5 w-5 text-primary" />}
                        label="المجموع النهائي"
                        value={studentSummary.totalFinalMark}
                        highlight
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">نسبة الحضور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>الحضور</span>
                        <span>{Math.round(studentSummary.attendanceRate)}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${studentSummary.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Details */}
                {studentSummary.attendanceDetails && studentSummary.attendanceDetails.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">تفاصيل الحضور</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studentSummary.attendanceDetails.map((detail, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                              detail.present
                                ? "bg-green-50 dark:bg-green-950/20"
                                : "bg-red-50 dark:bg-red-950/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {detail.present ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                {new Date(detail.date).toLocaleDateString("ar-EG", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  detail.present
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                    : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                }`}
                              >
                                {detail.present ? "حاضر" : "غائب"}
                              </span>
                              {detail.present && (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {detail.sessionMark} درجة
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Global Grades Summary */}
                {studentSummary.globalGradesSummary &&
                  studentSummary.globalGradesSummary.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">ملخص الدرجات الإجمالية</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {studentSummary.globalGradesSummary.map((grade, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary"
                          >
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{grade.gradeName}</span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  grade.status === "taken"
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {grade.status === "taken" ? "تم الأداء" : "لم يتم الأداء"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {grade.mark} / {grade.fullMark}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t flex justify-between items-center">
                          <span className="font-semibold">المجموع:</span>
                          <span className="font-bold text-primary">
                            {studentSummary.totalGlobalMark}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Grades Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">تفصيل الدرجات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">درجات الجلسات</span>
                      <span className="font-medium">{studentSummary.totalSessionMark}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">الدرجات الإجمالية</span>
                      <span className="font-medium">{studentSummary.totalGlobalMark}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">المجموع الكلي</span>
                      <span className="font-bold text-primary text-lg">
                        {studentSummary.totalFinalMark}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
                    لا توجد بيانات للطالب
          </p>
        </CardContent>
      </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg ${
        highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </div>
  );
}
