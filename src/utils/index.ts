import { formatDistanceToNow, format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { Priority, Category, UrgencyLevel } from '../types';

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date)) return `${Math.abs(differenceInDays(date, new Date()))}d overdue`;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 0) return 'Overdue';
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffH < 1) return `${diffM}m left`;
  if (diffH < 24) return `${diffH}h ${diffM}m left`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ${diffH % 24}h left`;
}

export function getPriorityConfig(priority: Priority) {
  const configs = {
    high: {
      label: 'High',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.3)',
      dot: '#ef4444',
    },
    medium: {
      label: 'Medium',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      dot: '#f59e0b',
    },
    low: {
      label: 'Low',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
      dot: '#10b981',
    },
  };
  return configs[priority];
}

export function getCategoryConfig(category: Category) {
  const configs: Record<Category, { label: string; color: string; icon: string; bg: string }> = {
    work: { label: 'Work', color: '#3b82f6', icon: '💼', bg: 'rgba(59,130,246,0.1)' },
    personal: { label: 'Personal', color: '#ec4899', icon: '✨', bg: 'rgba(236,72,153,0.1)' },
    health: { label: 'Health', color: '#10b981', icon: '🏃', bg: 'rgba(16,185,129,0.1)' },
    learning: { label: 'Learning', color: '#f59e0b', icon: '📚', bg: 'rgba(245,158,11,0.1)' },
    finance: { label: 'Finance', color: '#8b5cf6', icon: '💰', bg: 'rgba(139,92,246,0.1)' },
    other: { label: 'Other', color: '#6b7280', icon: '🔖', bg: 'rgba(107,114,128,0.1)' },
  };
  return configs[category];
}

export function getUrgencyConfig(urgency: UrgencyLevel) {
  const configs = {
    overdue: { label: 'Overdue', color: '#ef4444', pulse: true },
    critical: { label: 'Critical', color: '#f97316', pulse: true },
    urgent: { label: 'Urgent', color: '#eab308', pulse: false },
    normal: { label: 'On track', color: '#10b981', pulse: false },
  };
  return configs[urgency];
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const CATEGORY_OPTIONS: Category[] = ['work', 'personal', 'health', 'learning', 'finance', 'other'];
export const PRIORITY_OPTIONS: Priority[] = ['high', 'medium', 'low'];

export function getTagColors(): string[] {
  return ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280'];
}
