"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { LogOut, Info, Shield, Bell, Moon, Smartphone, Users, Code, Heart } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/login");
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">الإعدادات</h2>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">الحساب</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">التطبيق</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">الإشعارات</p>
                <p className="text-sm text-muted-foreground">تلقي إشعارات التطبيق</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">قريباً</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">الوضع الداكن</p>
                <p className="text-sm text-muted-foreground">تغيير مظهر التطبيق</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">قريباً</span>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">حول التطبيق</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo and App Name */}
          <div className="flex flex-col items-center py-4">
            <Logo size={80} showText={false} />
            <h3 className="text-lg font-bold text-primary mt-3">نظام إدارة الأنشطة</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              كنيسة السيدة العذراء للأقباط الكاثوليك
              <br />
              بجزيرة الخزندارية
            </p>
          </div>
          
          <Separator />
          
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">الإصدار</span>
            <span className="font-medium">1.0.0</span>
          </div>
        </CardContent>
      </Card>

      {/* Developers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">فريق التطوير</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Developer 1 - Yousef Emad */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-secondary/50">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md">
                <Image
                  src="/yousef.jpeg"
                  alt="يوسف عماد"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-semibold mt-3">يوسف عماد</h4>
              <p className="text-xs text-muted-foreground">مطور</p>
            </div>

            {/* Developer 2 - Waseam Nashat */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-secondary/50">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md">
                <Image
                  src="/waseam.jpeg"
                  alt="وسيم نشأت"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-semibold mt-3">وسيم نشأت</h4>
              <p className="text-xs text-muted-foreground">مطور</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>صُنع بـ</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>لخدمة الكنيسة</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
