import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Task, TaskStatus } from "@/lib/task-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormDialog, type TaskFormValues } from "@/components/tasks/TaskFormDialog";
import { toast } from "sonner";
import {
  Plus, Search, Sparkles, LogOut, CheckCircle2, Clock, ListTodo,
  AlertCircle, Loader2, Filter,
} from "lucide-react";
import { isPast, isToday, parseISO } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pulse" },
      { name: "description", content: "Your team's task workspace." },
    ],
  }),
  component: Dashboard,
});

type FilterTab = "all" | "mine" | "overdue";

function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      if (cancelled) return;
      if (tasksRes.error) toast.error(tasksRes.error.message);
      else setTasks((tasksRes.data ?? []) as Task[]);
      if (membersRes.error) toast.error(membersRes.error.message);
      else setMembers((membersRes.data ?? []) as Profile[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTasks((prev) => [payload.new as Task, ...prev.filter((t) => t.id !== (payload.new as Task).id)]);
        } else if (payload.eventType === "UPDATE") {
          setTasks((prev) => prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
        } else if (payload.eventType === "DELETE") {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const memberMap = useMemo(() => {
    const m = new Map<string, Profile>();
    members.forEach((p) => m.set(p.id, p));
    return m;
  }, [members]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter((t) => {
      if (t.status === "completed" || !t.due_date) return false;
      const d = parseISO(t.due_date);
      return isPast(d) && !isToday(d);
    }).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (tab === "mine" && t.assignee_id !== user?.id) return false;
      if (tab === "overdue") {
        if (t.status === "completed" || !t.due_date) return false;
        const d = parseISO(t.due_date);
        if (!isPast(d) || isToday(d)) return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, tab, statusFilter, search, user]);

  const handleCreate = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (task: Task) => { setEditing(task); setDialogOpen(true); };

  const handleSubmit = async (values: TaskFormValues) => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: values.title,
          description: values.description || null,
          status: values.status,
          priority: values.priority,
          assignee_id: values.assignee_id,
          due_date: values.due_date,
        })
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert({
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        assignee_id: values.assignee_id,
        due_date: values.due_date,
        created_by: user.id,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Task created");
    }
    setDialogOpen(false);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    // Optimistic
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Task deleted");
  };

  const me = user ? memberMap.get(user.id) : undefined;
  const myInitials = (me?.full_name ?? me?.email ?? "?").split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Pulse</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} className="shadow-[var(--shadow-soft)]">
              <Plus className="h-4 w-4" /> New task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-primary-muted text-primary text-sm font-semibold">
                  {myInitials}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{me?.full_name ?? "Member"}</div>
                  <div className="text-xs text-muted-foreground">{me?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Hello, {me?.full_name?.split(" ")[0] ?? "team"} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's on the team's plate today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={ListTodo} label="Total" value={stats.total} tone="default" />
          <StatCard icon={Clock} label="In progress" value={stats.inProgress} tone="primary" />
          <StatCard icon={AlertCircle} label="Overdue" value={stats.overdue} tone="destructive" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="success" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All tasks</TabsTrigger>
              <TabsTrigger value="mine">Assigned to me</TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue
                {stats.overdue > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                    {stats.overdue}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-surface-elevated"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-surface-elevated">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["all", "pending", "in_progress", "completed"] as const).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                    {statusFilter === s && "✓ "}
                    {s === "all" ? "All statuses" : s === "in_progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={handleCreate} hasAny={tasks.length > 0} />
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={task.assignee_id ? memberMap.get(task.assignee_id) : undefined}
                currentUserId={user.id}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        members={members}
        currentUserId={user.id}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "default" | "primary" | "success" | "destructive";
}) {
  const toneStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-muted text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneStyles}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary-muted flex items-center justify-center text-primary">
        <ListTodo className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">
        {hasAny ? "No tasks match your filters" : "No tasks yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAny ? "Try clearing search or switching tabs." : "Create your first task to get the team rolling."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate} className="mt-6">
          <Plus className="h-4 w-4" /> Create first task
        </Button>
      )}
    </div>
  );
}
