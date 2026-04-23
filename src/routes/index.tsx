import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Clock, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border/60 bg-surface-elevated/70 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Pulse</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[60rem] rounded-full opacity-40 blur-3xl -z-10"
          style={{ background: "radial-gradient(closest-side, oklch(0.78 0.16 256), transparent)" }}
        />

        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Built for small teams that ship fast
          </div>

          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Team work,
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              beautifully organized.
            </span>
          </h1>

          <p className="mt-6 mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            Assign tasks, track progress, and hit every deadline. Pulse gives small teams a calm, focused space to get real work done.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Button size="lg" asChild className="h-12 px-6 text-base shadow-[var(--shadow-glow)]">
              <Link to="/signup">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-6 text-base">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Users, title: "Shared workspace", desc: "Everyone on your team sees the same source of truth." },
              { icon: CheckCircle2, title: "Clear status", desc: "Pending, in progress, completed — at a glance." },
              { icon: Clock, title: "Deadline aware", desc: "Color-coded due dates so nothing slips through." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group glass-card rounded-2xl p-6 transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5">
                <div className="h-10 w-10 rounded-xl bg-primary-muted flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pulse. Built for teams that care.
        </div>
      </footer>
    </div>
  );
}
