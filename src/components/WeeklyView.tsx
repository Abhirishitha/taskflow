import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { getPriorityConfig, getCategoryConfig } from '../utils';

interface WeeklyViewProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function WeeklyView({ onAddTask, onEditTask }: WeeklyViewProps) {
  const { state } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) =>
    state.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day))
      .sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 };
        return pOrder[a.priority] - pOrder[b.priority];
      });

  const totalHoursForDay = (day: Date) =>
    getTasksForDay(day).reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Weekly Schedule</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                <ChevronLeft size={16} style={{ color: 'var(--color-text-2)' }} />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${weekOffset === 0 ? 'bg-purple-600 text-white' : 'hover:bg-purple-500/10'}`}
                style={{ color: weekOffset === 0 ? 'white' : 'var(--color-text-2)' }}
              >
                This week
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                <ChevronRight size={16} style={{ color: 'var(--color-text-2)' }} />
              </button>
            </div>
            <button onClick={onAddTask} className="btn-primary">
              <Plus size={15} /> Add Task
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const totalHours = totalHoursForDay(day);
            const todayDay = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl overflow-hidden flex flex-col min-h-48 ${todayDay ? 'ring-2 ring-purple-500/50' : ''}`}
                style={{
                  background: todayDay
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.06))'
                    : 'var(--color-surface)',
                  border: `1px solid ${todayDay ? 'rgba(139,92,246,0.3)' : 'var(--color-border)'}`,
                }}
              >
                {/* Day header */}
                <div className={`px-3 py-2 border-b ${todayDay ? 'border-purple-500/20' : ''}`}
                  style={{ borderColor: todayDay ? undefined : 'var(--color-border)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-2)' }}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${todayDay ? 'text-purple-400' : ''}`}
                    style={{ color: todayDay ? undefined : 'var(--color-text)' }}>
                    {format(day, 'd')}
                  </p>
                  {totalHours > 0 && (
                    <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>
                      {totalHours}h planned
                    </p>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-2)', opacity: 0.5 }}>Free</p>
                  ) : (
                    dayTasks.slice(0, 4).map(task => {
                      const pc = getPriorityConfig(task.priority);
                      return (
                        <motion.button
                          key={task.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onEditTask(task)}
                          className="w-full text-left rounded-lg p-1.5 text-xs font-medium transition-all"
                          style={{
                            background: pc.bg,
                            borderLeft: `2px solid ${pc.color}`,
                            color: 'var(--color-text)',
                            opacity: task.completed ? 0.5 : 1,
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}
                        >
                          <span className="line-clamp-1">{task.title}</span>
                          {task.estimatedHours && (
                            <span style={{ color: 'var(--color-text-2)' }}> {task.estimatedHours}h</span>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                  {dayTasks.length > 4 && (
                    <p className="text-xs font-medium text-purple-400 text-center">+{dayTasks.length - 4} more</p>
                  )}
                </div>

                {/* Workload bar */}
                {totalHours > 0 && (
                  <div className="px-2 pb-2">
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (totalHours / 8) * 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                        style={{
                          background: totalHours > 8
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                        }}
                      />
                    </div>
                    <p className="text-xs mt-0.5 text-center" style={{ color: 'var(--color-text-2)' }}>
                      {Math.min(100, Math.round((totalHours / 8) * 100))}% capacity
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 justify-center flex-wrap">
          {[
            { color: '#ef4444', label: 'High Priority' },
            { color: '#f59e0b', label: 'Medium Priority' },
            { color: '#10b981', label: 'Low Priority' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: item.color + '30', borderLeft: `2px solid ${item.color}` }} />
              <span className="text-xs" style={{ color: 'var(--color-text-2)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
