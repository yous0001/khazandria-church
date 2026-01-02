"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/api/schemas";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await api.auth.login(data);
      toast.success("تم تسجيل الدخول بنجاح");
      
      // Redirect to the original destination or default to /activities
      const redirectTo = searchParams.get("redirect") || "/activities";
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size={100} showText={false} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl text-primary">
              كنيسة السيدة العذراء
            </CardTitle>
            <CardDescription className="text-sm">
              للأقباط الكاثوليك بجزيرة الخزندارية
            </CardDescription>
            <p className="text-lg font-semibold pt-2">تسجيل الدخول</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">البريد الإلكتروني أو رقم الهاتف</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="أدخل البريد الإلكتروني أو رقم الهاتف"
                {...form.register("emailOrPhone")}
                disabled={isLoading}
              />
              {form.formState.errors.emailOrPhone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.emailOrPhone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

