import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Pulse" },
      { name: "description", content: "Sign in to your Pulse team workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12" style={{ background: "var(--gradient-hero)" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(at 30% 30%, oklch(0.78 0.16 256 / 0.4), transparent 60%)" }} />
        <div className="relative max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12">
            <div className="h-9 w-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Pulse</span>
          </Link>
          <h2 className="font-display text-4xl font-semibold tracking-tight leading-tight">
            Welcome back to your team's workspace.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Pick up where you left off and keep your team moving.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-surface-elevated">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Pulse</span>
          </Link>

          <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email to access your workspace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            New to Pulse?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
