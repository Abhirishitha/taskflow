import React from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, CheckCircle2, Clock, Zap } from 'lucide-react';
import { isToday } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface FocusModeProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function FocusMode({ onAddTask, onEditTask }: FocusModeProps) {
  const { state } = useApp();

  // Focus: today's tasks + high priority tasks, incomplete first
  const todayTasks = state.tasks.filter(t => {
    if (!t.dueDate) return false;
    return isToday(new Date(t.dueDate));
  });

  const highPriorityTasks = state.tasks.filter(t =>
    t.priority === 'high' && !t.completed &&
    !todayTasks.find(tt => tt.id === t.id)
  );

  const focusTasks = [
    ...todayTasks.filter(t => !t.completed),
    ...highPriorityTasks,
    ...todayTasks.filter(t => t.completed),
  ];

  const todayComplete = todayTasks.filter(t => t.completed).length;
  const pct = todayTasks.length > 0 ? Math.round((todayComplete / todayTasks.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Focus header */}
        <div className="text-center py-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
          >
            <Target size={28} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Focus Mode</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
            Today's tasks and high-priority items
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <CheckCircle2 size={18} />, val: `${todayComplete}/${todayTasks.length}`, label: "Today's Tasks", color: '#10b981' },
            { icon: <Zap size={18} />, val: highPriorityTasks.length, label: 'High Priority', color: '#ef4444' },
            { icon: <Flame size={18} />, val: `${state.completionStreak}d`, label: 'Streak', color: '#f97316' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card text-center"
            >
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{s.val}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Today's progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Today's Progress</span>
            </div>
            <span className="text-sm font-bold text-purple-400">{pct}%</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>

          {pct === 100 && todayTasks.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-medium text-purple-400 mt-3"
            >
              🎉 All today's tasks complete! Incredible focus!
            </motion.p>
          )}
        </div>

        {/* Focus tasks */}
        <div className="space-y-3">
          {focusTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>Nothing urgent!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
                No tasks due today or high-priority items
              </p>
              <button onClick={onAddTask} className="btn-primary mt-4">Add a task</button>
            </motion.div>
          ) : (
            <>
              {focusTasks.filter(t => !t.completed).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-2)' }}>
                    In Progress ({focusTasks.filter(t => !t.completed).length})
                  </p>
                  <div className="space-y-3">
                    {focusTasks.filter(t => !t.completed).map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <TaskCard task={task} onEdit={onEditTask} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {focusTasks.filter(t => t.completed).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4" style={{ color: 'var(--color-text-2)' }}>
                    Completed ({focusTasks.filter(t => t.completed).length})
                  </p>
                  <div className="space-y-3">
                    {focusTasks.filter(t => t.completed).map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <TaskCard task={task} onEdit={onEditTask} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
