import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, GraduationCap, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand/5 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size={120} showText={false} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                كنيسة السيدة العذراء
              </h1>
              <p className="text-lg text-muted-foreground">
                للأقباط الكاثوليك بجزيرة الخزندارية
              </p>
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>إدارة الأنشطة</CardTitle>
                </div>
                <CardDescription>
                  إدارة وتنظيم جميع أنشطة الكنيسة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>إدارة الطلاب</CardTitle>
                </div>
                <CardDescription>
                  متابعة سجلات الطلاب والحضور
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <CardTitle>تسجيل الدرجات</CardTitle>
                </div>
                <CardDescription>
                  تسجيل ومتابعة درجات الطلاب
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle>التقارير والإحصائيات</CardTitle>
                </div>
                <CardDescription>
                  تقارير مفصلة عن الأداء والإحصائيات
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Login Button */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <Link href="/login">
              <Button size="lg" className="w-48">
                تسجيل الدخول
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground text-center">
              سجل الدخول للوصول إلى نظام إدارة الأنشطة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
