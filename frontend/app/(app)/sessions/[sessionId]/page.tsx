"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, CheckCircle, XCircle, Save, Trash2, AlertTriangle, Image as ImageIcon, Video, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Session, SessionGrade, User, SessionContent, SessionContentFile } from "@/types/domain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentFormData {
  present: boolean;
  bonusMark: number;
  sessionGrades: SessionGrade[];
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Local state for form data per student
  const [formData, setFormData] = useState<Record<string, StudentFormData>>({});
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  // Content state
  const [contentText, setContentText] = useState("");
  const [contentImages, setContentImages] = useState<File[]>([]);
  const [contentVideos, setContentVideos] = useState<File[]>([]);
  const [contentPdfs, setContentPdfs] = useState<File[]>([]);
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Get current user to check if superadmin
  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => api.users.getCurrent(),
  });

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessions.get(sessionId),
  });

  // Initialize form data when session loads
  useEffect(() => {
    if (session) {
      const initialData: Record<string, StudentFormData> = {};
      session.students.forEach((student: any) => {
        const studentId = student.studentId?._id || student.studentId;
        initialData[studentId] = {
          present: student.present,
          bonusMark: student.bonusMark || 0,
          sessionGrades: student.sessionGrades || [],
        };
      });
      setFormData(initialData);
      
      // Initialize content
      if (session.content) {
        setContentText(session.content.text || "");
      }
    }
  }, [session]);

  const updateMutation = useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: any;
    }) => api.sessions.updateStudent(sessionId, studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      toast.success("تم حفظ البيانات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحفظ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.sessions.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("تم حذف الجلسة بنجاح");
      router.back();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف الجلسة");
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: (data: {
      text?: string;
      images?: File[];
      videos?: File[];
      pdfs?: File[];
      removeImageIds?: string[];
      removeVideoIds?: string[];
      removePdfIds?: string[];
    }) => api.sessions.updateContent(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      toast.success("تم حفظ المحتوى بنجاح");
      setIsEditingContent(false);
      setContentImages([]);
      setContentVideos([]);
      setContentPdfs([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ المحتوى");
    },
  });

  const handleSaveContent = () => {
    updateContentMutation.mutate({
      text: contentText,
      images: contentImages.length > 0 ? contentImages : undefined,
      videos: contentVideos.length > 0 ? contentVideos : undefined,
      pdfs: contentPdfs.length > 0 ? contentPdfs : undefined,
    });
  };

  const handleRemoveFile = (
    type: "image" | "video" | "pdf",
    publicId: string
  ) => {
    const removeIds = type === "image" 
      ? { removeImageIds: [publicId] }
      : type === "video"
      ? { removeVideoIds: [publicId] }
      : { removePdfIds: [publicId] };
    
    updateContentMutation.mutate(removeIds);
  };

  const handleFileSelect = (
    type: "image" | "video" | "pdf",
    files: FileList | null
  ) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    if (type === "image") {
      setContentImages((prev) => [...prev, ...fileArray]);
    } else if (type === "video") {
      setContentVideos((prev) => [...prev, ...fileArray]);
    } else {
      setContentPdfs((prev) => [...prev, ...fileArray]);
    }
  };

  const removePendingFile = (
    type: "image" | "video" | "pdf",
    index: number
  ) => {
    if (type === "image") {
      setContentImages((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "video") {
      setContentVideos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setContentPdfs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateStudentData = (studentId: string, updates: Partial<StudentFormData>) => {
    setFormData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        ...updates,
      },
    }));
  };

  const updateSessionGrade = (studentId: string, gradeIndex: number, mark: number) => {
    setFormData((prev) => {
      const studentData = prev[studentId];
      if (!studentData) return prev;
      
      const newGrades = [...studentData.sessionGrades];
      newGrades[gradeIndex] = {
        ...newGrades[gradeIndex],
        mark: Math.min(mark, newGrades[gradeIndex].fullMark),
      };
      
      return {
        ...prev,
        [studentId]: {
          ...studentData,
          sessionGrades: newGrades,
        },
      };
    });
  };

  const saveStudent = (studentId: string) => {
    const data = formData[studentId];
    if (data) {
      updateMutation.mutate({
        studentId,
        data,
      });
    }
  };

  const togglePresence = (studentId: string) => {
    const data = formData[studentId];
    if (!data) return;
    
    const newPresent = !data.present;
    
    // If marking as present, set all grades to full mark
    let updatedGrades = data.sessionGrades;
    if (newPresent && updatedGrades.length > 0) {
      updatedGrades = updatedGrades.map((grade) => ({
        ...grade,
        mark: grade.fullMark, // Set to full mark when present
      }));
    } else if (!newPresent) {
      // If marking as absent, set all grades to 0
      updatedGrades = updatedGrades.map((grade) => ({
        ...grade,
        mark: 0,
      }));
    }
    
    updateStudentData(studentId, { 
      present: newPresent,
      sessionGrades: updatedGrades,
    });
    
    // Auto-save when toggling presence
    updateMutation.mutate({
      studentId,
      data: {
        ...data,
        present: newPresent,
        sessionGrades: updatedGrades,
      },
    });
  };

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

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">الجلسة غير موجودة</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          العودة
        </Button>
      </div>
    );
  }

  const presentCount = Object.values(formData).filter((d) => d.present).length;
  const absentCount = session.students.length - presentCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">تسجيل الحضور والدرجات</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(session.sessionDate).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {currentUser?.role === "superadmin" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف الجلسة
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <Badge variant="default" className="gap-1 py-1.5 px-3">
          <CheckCircle className="h-3.5 w-3.5" />
          حاضر: {presentCount}
        </Badge>
        <Badge variant="secondary" className="gap-1 py-1.5 px-3">
          <XCircle className="h-3.5 w-3.5" />
          غائب: {absentCount}
        </Badge>
      </div>

      {/* Content Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>محتوى الجلسة</CardTitle>
            {!isEditingContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingContent(true)}
              >
                تعديل المحتوى
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingContent ? (
            <div className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="text">نص</TabsTrigger>
                  <TabsTrigger value="images">صور</TabsTrigger>
                  <TabsTrigger value="videos">فيديوهات</TabsTrigger>
                  <TabsTrigger value="pdfs">ملفات PDF</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-2">
                  <Label>النص</Label>
                  <textarea
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="w-full min-h-[200px] p-3 border rounded-md resize-y"
                    placeholder="أدخل نص المحتوى هنا..."
                  />
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  <div>
                    <Label>إضافة صور</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileSelect("image", e.target.files)}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Pending uploads */}
                  {contentImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>الصور المضافة (قيد الرفع)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {contentImages.map((file, idx) => (
                          <div key={idx} className="relative border rounded p-2">
                            <X
                              className="absolute top-1 right-1 h-4 w-4 cursor-pointer text-destructive"
                              onClick={() => removePendingFile("image", idx)}
                            />
                            <p className="text-xs truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Existing images */}
                  {session.content?.images && session.content.images.length > 0 && (
                    <div className="space-y-2">
                      <Label>الصور الحالية</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {session.content.images.map((img) => (
                          <div key={img.publicId} className="relative group">
                            <img
                              src={img.url}
                              alt={img.originalName || "صورة"}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFile("image", img.publicId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="videos" className="space-y-4">
                  <div>
                    <Label>إضافة فيديوهات</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileSelect("video", e.target.files)}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Pending uploads */}
                  {contentVideos.length > 0 && (
                    <div className="space-y-2">
                      <Label>الفيديوهات المضافة (قيد الرفع)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {contentVideos.map((file, idx) => (
                          <div key={idx} className="relative border rounded p-2">
                            <X
                              className="absolute top-1 right-1 h-4 w-4 cursor-pointer text-destructive"
                              onClick={() => removePendingFile("video", idx)}
                            />
                            <p className="text-xs truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Existing videos */}
                  {session.content?.videos && session.content.videos.length > 0 && (
                    <div className="space-y-2">
                      <Label>الفيديوهات الحالية</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {session.content.videos.map((vid) => (
                          <div key={vid.publicId} className="relative group">
                            <video
                              src={vid.url}
                              controls
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFile("video", vid.publicId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pdfs" className="space-y-4">
                  <div>
                    <Label>إضافة ملفات PDF</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => handleFileSelect("pdf", e.target.files)}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Pending uploads */}
                  {contentPdfs.length > 0 && (
                    <div className="space-y-2">
                      <Label>الملفات المضافة (قيد الرفع)</Label>
                      <div className="space-y-2">
                        {contentPdfs.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between border rounded p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <p className="text-sm">{file.name}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePendingFile("pdf", idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Existing PDFs */}
                  {session.content?.pdfs && session.content.pdfs.length > 0 && (
                    <div className="space-y-2">
                      <Label>الملفات الحالية</Label>
                      <div className="space-y-2">
                        {session.content.pdfs.map((pdf) => (
                          <div key={pdf.publicId} className="flex items-center justify-between border rounded p-2 group">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <a
                                href={pdf.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {pdf.originalName || "ملف PDF"}
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile("pdf", pdf.publicId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingContent(false);
                    setContentImages([]);
                    setContentVideos([]);
                    setContentPdfs([]);
                    if (session.content) {
                      setContentText(session.content.text || "");
                    }
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSaveContent}
                  disabled={updateContentMutation.isPending}
                >
                  {updateContentMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session.content?.text && (
                <div>
                  <Label className="mb-2 block">النص</Label>
                  <p className="text-sm whitespace-pre-wrap border rounded p-3 bg-muted">
                    {session.content.text}
                  </p>
                </div>
              )}
              
              {session.content?.images && session.content.images.length > 0 && (
                <div>
                  <Label className="mb-2 block">الصور</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {session.content.images.map((img) => (
                      <img
                        key={img.publicId}
                        src={img.url}
                        alt={img.originalName || "صورة"}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {session.content?.videos && session.content.videos.length > 0 && (
                <div>
                  <Label className="mb-2 block">الفيديوهات</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {session.content.videos.map((vid) => (
                      <video
                        key={vid.publicId}
                        src={vid.url}
                        controls
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {session.content?.pdfs && session.content.pdfs.length > 0 && (
                <div>
                  <Label className="mb-2 block">ملفات PDF</Label>
                  <div className="space-y-2">
                    {session.content.pdfs.map((pdf) => (
                      <a
                        key={pdf.publicId}
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline border rounded p-2"
                      >
                        <FileText className="h-4 w-4" />
                        {pdf.originalName || "ملف PDF"}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {!session.content?.text && 
               (!session.content?.images || session.content.images.length === 0) &&
               (!session.content?.videos || session.content.videos.length === 0) &&
               (!session.content?.pdfs || session.content.pdfs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا يوجد محتوى للجلسة
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {session.students.map((student: any) => {
          const studentIdValue = student.studentId?._id || student.studentId;
          const studentName = student.studentId?.name || "طالب";
          const data = formData[studentIdValue];

          if (!data) return null;

          const totalGradesMark = data.sessionGrades.reduce((sum, g) => sum + g.mark, 0);

          return (
            <Card
              key={studentIdValue}
              className={data.present ? "border-green-200 bg-green-50/50" : "border-red-100 bg-red-50/30"}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {data.present ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>{studentName}</span>
                  </div>
                  <Switch
                    checked={data.present}
                    onCheckedChange={() => togglePresence(studentIdValue)}
                  />
                </CardTitle>
              </CardHeader>
              {data.present && (
                <CardContent className="space-y-4 pt-0">
                  {/* Session Grades - Editable */}
                  {data.sessionGrades.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">درجات الجلسة</Label>
                      <div className="grid gap-3">
                        {data.sessionGrades.map((grade, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <Label className="flex-1 text-sm">{grade.gradeName}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={grade.fullMark}
                                value={grade.mark}
                                onChange={(e) =>
                                  updateSessionGrade(
                                    studentIdValue,
                                    idx,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 h-9 text-center"
                              />
                              <span className="text-sm text-muted-foreground">
                                / {grade.fullMark}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bonus Mark */}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Label className="flex-1 text-sm">درجة المكافأة</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.bonusMark}
                      onChange={(e) =>
                        updateStudentData(studentIdValue, {
                          bonusMark: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 h-9 text-center"
                    />
                  </div>

                  {/* Total and Save */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">الإجمالي: </span>
                      <span className="text-lg font-bold text-primary">
                        {totalGradesMark + data.bonusMark}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveStudent(studentIdValue)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 ml-2" />
                      حفظ
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                هل أنت متأكد من حذف هذه الجلسة؟
              </p>
              <p className="text-destructive font-medium">
                سيتم حذف جميع البيانات المرتبطة بهذه الجلسة نهائياً:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>جميع سجلات الحضور</li>
                <li>جميع الدرجات المسجلة</li>
                <li>جميع درجات المكافأة</li>
              </ul>
              <p className="text-sm font-medium text-destructive">
                هذا الإجراء لا يمكن التراجع عنه!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate();
                setDeleteDialog(false);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف الجلسة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
