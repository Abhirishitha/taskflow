import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Search, Filter, CheckCircle2, Clock, Zap, TrendingUp, Plus, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, Priority, Category } from '../types';
import TaskCard from './TaskCard';
import confetti from 'canvas-confetti';

interface DashboardProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function Dashboard({ onAddTask, onEditTask }: DashboardProps) {
  const { state, reorderTasks } = useApp();
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const completed = state.tasks.filter(t => t.completed).length;
  const total = state.tasks.length;
  const highPriority = state.tasks.filter(t => !t.completed && t.priority === 'high').length;
  const overdue = state.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

  // Confetti when all tasks completed
  useEffect(() => {
    if (total > 0 && completed === total && prevCompleted < total) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#7c3aed', '#a855f7', '#c084fc', '#e9d5ff', '#fbbf24'] });
    }
    setPrevCompleted(completed);
  }, [completed, total]);

  const filtered = state.tasks
    .filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchCat = filterCategory === 'all' || t.category === filterCategory;
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? !t.completed : t.completed);
      return matchSearch && matchPriority && matchCat && matchStatus;
    })
    .sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = state.tasks.findIndex(t => t.id === active.id);
    const newIndex = state.tasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(state.tasks, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
    reorderTasks(reordered);
  };

  const statCards = [
    {
      icon: <CheckCircle2 size={20} />,
      label: 'Completed',
      value: completed,
      suffix: `/ ${total}`,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      icon: <Zap size={20} />,
      label: 'High Priority',
      value: highPriority,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
    {
      icon: <Clock size={20} />,
      label: 'Overdue',
      value: overdue,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Streak',
      value: state.completionStreak,
      suffix: 'd',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
    },
  ];

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
              {completed === total && total > 0 ? '🎉 All tasks done! Amazing work!' : `You have ${total - completed} task${total - completed !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={onAddTask}
            className="btn-primary"
          >
            <Plus size={16} /> New Task
          </motion.button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {s.value}{s.suffix && <span className="text-sm font-medium ml-0.5" style={{ color: 'var(--color-text-2)' }}>{s.suffix}</span>}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Overall Progress</span>
            <span className="text-sm font-bold text-purple-400">{completionPct}%</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs" style={{ color: 'var(--color-text-2)' }}>{completed} done</span>
            <span className="text-xs" style={{ color: 'var(--color-text-2)' }}>{total - completed} remaining</span>
          </div>
        </motion.div>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost ${showFilters ? 'border-purple-500/40 text-purple-400' : ''}`}
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Status filter */}
                  {(['all', 'active', 'completed'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        filterStatus === s ? 'bg-purple-600 border-transparent text-white' : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <div className="w-px bg-gray-600 mx-1" />
                  {/* Priority filter */}
                  {(['all', 'high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        filterPriority === p ? 'bg-purple-600 border-transparent text-white' : 'border-purple-500/20 text-gray-400 hover:border-purple-500/40'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
                      {search ? 'No tasks match your search' : 'No tasks yet'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
                      {search ? 'Try different keywords' : 'Add your first task to get started'}
                    </p>
                    {!search && (
                      <button onClick={onAddTask} className="btn-primary mt-4">
                        <Plus size={16} /> Add Task
                      </button>
                    )}
                  </motion.div>
                ) : (
                  filtered.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={onEditTask} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </motion.div>
    </div>
  );
}
