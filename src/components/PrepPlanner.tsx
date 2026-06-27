import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, AlertTriangle, Timer, Calendar, Zap, Clock, TrendingUp } from 'lucide-react';
import { differenceInDays, differenceInHours, format, isPast } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Task, getUrgency } from '../types';
import { getPriorityConfig, getCategoryConfig, getUrgencyConfig } from '../utils';

interface PrepPlannerProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

interface PrepTask extends Task {
  daysLeft: number;
  hoursLeft: number;
  hoursPerDay: number;
  urgency: ReturnType<typeof getUrgency>;
}

export default function PrepPlanner({ onAddTask, onEditTask }: PrepPlannerProps) {
  const { state } = useApp();

  const prepTasks = useMemo((): PrepTask[] => {
    return state.tasks
      .filter(t => !t.completed && t.dueDate && t.estimatedHours)
      .map(t => {
        const dueDate = new Date(t.dueDate!);
        const now = new Date();
        const daysLeft = Math.max(0, differenceInDays(dueDate, now));
        const hoursLeft = Math.max(0, differenceInHours(dueDate, now));
        const effectiveDays = Math.max(1, daysLeft);
        const hoursPerDay = Math.ceil((t.estimatedHours! / effectiveDays) * 10) / 10;
        return {
          ...t,
          daysLeft,
          hoursLeft,
          hoursPerDay,
          urgency: getUrgency(t.dueDate),
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { overdue: 0, critical: 1, urgent: 2, normal: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
  }, [state.tasks]);

  const totalDailyHours = prepTasks.reduce((s, t) => s + t.hoursPerDay, 0);
  const overdueCount = prepTasks.filter(t => t.urgency === 'overdue').length;
  const criticalCount = prepTasks.filter(t => t.urgency === 'critical').length;

  const tasksWithoutEstimate = state.tasks.filter(t => !t.completed && !t.estimatedHours && t.dueDate);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Rocket size={24} className="text-purple-400" /> Preparation Planner
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
              How many hours per day you need to finish each task before its deadline
            </p>
          </div>
          <button onClick={onAddTask} className="btn-primary">Add Task</button>
        </div>

        {/* Daily workload summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(139,92,246,0.05))',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-400" />
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Daily Workload Summary</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${totalDailyHours > 8 ? 'bg-red-500/20 text-red-400' : totalDailyHours > 6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
              {Math.round(totalDailyHours * 10) / 10}h/day total
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <AlertTriangle size={16} />, val: overdueCount, label: 'Overdue', color: '#ef4444' },
              { icon: <Zap size={16} />, val: criticalCount, label: 'Critical (<24h)', color: '#f97316' },
              { icon: <Timer size={16} />, val: prepTasks.length, label: 'Tasks tracked', color: '#8b5cf6' },
              {
                icon: <Clock size={16} />,
                val: `${Math.round(totalDailyHours * 10) / 10}h`,
                label: 'Hours needed today',
                color: totalDailyHours > 8 ? '#ef4444' : '#10b981',
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{s.val}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {totalDailyHours > 8 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                <AlertTriangle size={14} />
                Overloaded! You need {Math.round(totalDailyHours * 10) / 10}h/day. Consider rescheduling some tasks.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Task list */}
        {prepTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>No tasks with deadlines & estimates</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-2)' }}>
              Add estimated hours and due dates to your tasks to see prep planning
            </p>
            <button onClick={onAddTask} className="btn-primary mt-4">Add a task</button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {['overdue', 'critical', 'urgent', 'normal'].map(urgency => {
              const group = prepTasks.filter(t => t.urgency === urgency);
              if (group.length === 0) return null;
              const urgencyConfig = getUrgencyConfig(urgency as any);

              return (
                <div key={urgency}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: urgencyConfig.color }} />
                    <h3 className="text-sm font-semibold" style={{ color: urgencyConfig.color }}>
                      {urgencyConfig.label} ({group.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {group.map((task, i) => {
                      const pc = getPriorityConfig(task.priority);
                      const cc = getCategoryConfig(task.category);
                      const capacityPct = Math.min(100, (task.hoursPerDay / 8) * 100);

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="card p-4 cursor-pointer"
                          onClick={() => onEditTask(task)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <h4 className="font-semibold text-sm leading-snug" style={{ color: 'var(--color-text)' }}>
                                  {task.title}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                                  style={{ background: cc.bg, color: cc.color }}>
                                  {cc.icon} {cc.label}
                                </span>
                              </div>

                              {/* Prep stats row */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <p style={{ color: 'var(--color-text-2)' }}>Due</p>
                                  <p className="font-semibold" style={{ color: urgencyConfig.color }}>
                                    {task.urgency === 'overdue' ? 'Overdue!' : `${task.daysLeft}d left`}
                                  </p>
                                </div>
                                <div>
                                  <p style={{ color: 'var(--color-text-2)' }}>Total estimate</p>
                                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {task.estimatedHours}h
                                  </p>
                                </div>
                                <div>
                                  <p style={{ color: 'var(--color-text-2)' }}>Hours/day needed</p>
                                  <p className="font-bold" style={{ color: task.hoursPerDay > 4 ? '#ef4444' : '#10b981' }}>
                                    {task.hoursPerDay}h
                                  </p>
                                </div>
                                <div>
                                  <p style={{ color: 'var(--color-text-2)' }}>Deadline</p>
                                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {format(new Date(task.dueDate!), 'MMM d')}
                                  </p>
                                </div>
                              </div>

                              {/* Daily capacity bar */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'var(--color-text-2)' }}>
                                    Daily capacity usage
                                  </span>
                                  <span className="text-xs font-semibold" style={{
                                    color: capacityPct > 100 ? '#ef4444' : capacityPct > 50 ? '#f59e0b' : '#10b981'
                                  }}>
                                    {Math.round(capacityPct)}%
                                  </span>
                                </div>
                                <div className="progress-bar">
                                  <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, capacityPct)}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.07 }}
                                    style={{
                                      background: capacityPct > 75
                                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                        : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tasks without estimates */}
        {tasksWithoutEstimate.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <p className="text-sm font-medium text-yellow-500 flex items-center gap-2 mb-2">
              <AlertTriangle size={14} /> {tasksWithoutEstimate.length} task{tasksWithoutEstimate.length > 1 ? 's' : ''} without time estimates
            </p>
            <div className="flex flex-wrap gap-2">
              {tasksWithoutEstimate.map(t => (
                <button
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="text-xs px-3 py-1 rounded-full font-medium transition-all hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
