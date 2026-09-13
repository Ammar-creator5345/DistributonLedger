import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;

  return (
    <Card className="w-full max-w-sm py-8">
      <CardHeader className="items-center gap-3 px-8 text-center">
        <BrandLogo className="mx-auto h-12 w-auto" />
        <CardTitle className="font-heading text-xl">Welcome back</CardTitle>
        <CardDescription>Enter your details to continue.</CardDescription>
      </CardHeader>
      <CardContent className="px-8">
        <LoginForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
