import { format, isPast, isToday, differenceInCalendarDays, parseISO } from "date-fns";
import { Calendar, MoreHorizontal, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Profile, Task, TaskStatus } from "@/lib/task-types";

interface Props {
  task: Task;
  assignee: Profile | undefined;
  currentUserId: string;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function dueDateMeta(dateStr: string | null, status: TaskStatus) {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  const isCompleted = status === "completed";
  const overdue = !isCompleted && isPast(date) && !isToday(date);
  const today = isToday(date);
  const days = differenceInCalendarDays(date, new Date());

  let label = format(date, "MMM d");
  if (today) label = "Today";
  else if (days === 1) label = "Tomorrow";
  else if (days === -1) label = "Yesterday";
  else if (days > 1 && days < 7) label = `In ${days}d`;

  return {
    label,
    overdue,
    today,
    soon: !overdue && !today && days >= 0 && days <= 2,
  };
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

const STATUS_DOT: Record<TaskStatus, string> = {
  pending: "bg-muted-foreground/40",
  in_progress: "bg-primary",
  completed: "bg-success",
};

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  return source.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function TaskCard({ task, assignee, currentUserId, onStatusChange, onEdit, onDelete }: Props) {
  const due = dueDateMeta(task.due_date, task.status);
  const isCreator = task.created_by === currentUserId;
  const isCompleted = task.status === "completed";

  return (
    <div className={cn(
      "group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-[var(--shadow-elevated)] hover:border-primary/20",
      isCompleted && "opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[task.status])} />
            <Badge variant="outline" className={cn("h-5 px-2 text-[10px] uppercase tracking-wider font-semibold", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </Badge>
          </div>

          <h3 className={cn("font-medium text-foreground leading-snug", isCompleted && "line-through text-muted-foreground")}>
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {assignee ? (
                <>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-muted text-[10px] font-semibold text-primary">
                    {initials(assignee.full_name, assignee.email)}
                  </span>
                  <span className="truncate max-w-[140px]">
                    {assignee.full_name ?? assignee.email}
                    {assignee.id === currentUserId && <span className="text-muted-foreground/70"> (you)</span>}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  Unassigned
                </span>
              )}
            </div>

            {due && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md",
                due.overdue && "bg-destructive/10 text-destructive",
                due.today && "bg-warning/15 text-warning-foreground",
                due.soon && !due.today && "bg-accent text-accent-foreground",
                !due.overdue && !due.today && !due.soon && "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {due.label}
                {due.overdue && " · overdue"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              {isCreator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
