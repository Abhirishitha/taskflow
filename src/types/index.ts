export type Priority = 'high' | 'medium' | 'low';
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'other';
export type View = 'dashboard' | 'weekly' | 'monthly' | 'focus' | 'planner';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  tags: string[];
  dueDate?: string; // ISO string
  estimatedHours?: number;
  createdAt: string;
  completedAt?: string;
  order: number;
}

export interface AppState {
  tasks: Task[];
  tags: Tag[];
  theme: 'dark' | 'light';
  completionStreak: number;
  lastCompletionDate?: string;
  dailyStats: Record<string, DailyStat>;
}

export interface DailyStat {
  date: string;
  completed: number;
  total: number;
  focusMinutes: number;
}

export type UrgencyLevel = 'overdue' | 'critical' | 'urgent' | 'normal';

export function getUrgency(dueDate?: string): UrgencyLevel {
  if (!dueDate) return 'normal';
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffMs < 0) return 'overdue';
  if (diffHours < 24) return 'critical';
  if (diffHours < 72) return 'urgent';
  return 'normal';
}

export function getHoursPerDay(dueDate?: string, estimatedHours?: number): number | null {
  if (!dueDate || !estimatedHours) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return Math.ceil((estimatedHours / diffDays) * 10) / 10;
}
