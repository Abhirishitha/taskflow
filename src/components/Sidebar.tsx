import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, CalendarRange, Target, Rocket,
  Sun, Moon, Flame, CheckCircle2, ListTodo, Zap
} from 'lucide-react';
import { View } from '../types';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onAddTask: () => void;
}

const navItems: Array<{ view: View; icon: React.ReactNode; label: string; badge?: string }> = [
  { view: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { view: 'focus', icon: <Target size={18} />, label: 'Focus Mode' },
  { view: 'weekly', icon: <CalendarDays size={18} />, label: 'Weekly View' },
  { view: 'monthly', icon: <CalendarRange size={18} />, label: 'Monthly View' },
  { view: 'planner', icon: <Rocket size={18} />, label: 'Prep Planner' },
];

export default function Sidebar({ activeView, onViewChange, onAddTask }: SidebarProps) {
  const { state, setTheme } = useApp();

  const todayTasks = state.tasks.filter(t => {
    if (!t.dueDate) return false;
    return format(new Date(t.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  const todayComplete = todayTasks.filter(t => t.completed).length;
  const overdueTasks = state.tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 p-4"
      style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-none" style={{ color: 'var(--color-text)' }}>TaskFlow</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-2)' }}>Productivity Suite</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="rounded-xl p-3 mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-2)' }}>Today</span>
          <span className="text-xs font-bold text-purple-400">{todayComplete}/{todayTasks.length}</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${todayTasks.length > 0 ? (todayComplete / todayTasks.length) * 100 : 0}%` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">{state.completionStreak} day streak</span>
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-red-400">⚠ {overdueTasks} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <motion.button
            key={item.view}
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewChange(item.view)}
            className={`sidebar-link ${activeView === item.view ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.view === 'dashboard' && state.tasks.filter(t => !t.completed).length > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(139,92,246,0.2)', color: 'var(--color-accent-2)' }}>
                {state.tasks.filter(t => !t.completed).length}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {[
          { icon: <ListTodo size={14} />, val: state.tasks.length, label: 'Total' },
          { icon: <CheckCircle2 size={14} />, val: state.tasks.filter(t => t.completed).length, label: 'Done' },
          { icon: <Zap size={14} />, val: state.tasks.filter(t => !t.completed && t.priority === 'high').length, label: 'High' },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="flex justify-center mb-0.5" style={{ color: 'var(--color-text-2)' }}>{s.icon}</div>
            <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{s.val}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Theme toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs" style={{ color: 'var(--color-text-2)' }}>Theme</span>
        <button
          onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
          className="relative w-12 h-6 rounded-full transition-all duration-300 flex items-center"
          style={{ background: state.theme === 'dark' ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.2)' }}
        >
          <motion.div
            className="w-5 h-5 rounded-full flex items-center justify-center shadow-lg absolute"
            animate={{ x: state.theme === 'dark' ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            {state.theme === 'dark' ? <Moon size={10} className="text-white" /> : <Sun size={10} className="text-white" />}
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}
