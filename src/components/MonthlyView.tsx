import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameDay,
  startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth
} from 'date-fns';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { getPriorityConfig } from '../utils';

interface MonthlyViewProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function MonthlyView({ onAddTask, onEditTask }: MonthlyViewProps) {
  const { state } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day: Date) =>
    state.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Monthly Calendar</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                <ChevronLeft size={16} style={{ color: 'var(--color-text-2)' }} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-500/10 transition-all"
                style={{ color: 'var(--color-text-2)' }}
              >
                Today
              </button>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                <ChevronRight size={16} style={{ color: 'var(--color-text-2)' }} />
              </button>
            </div>
            <button onClick={onAddTask} className="btn-primary">
              <Plus size={15} /> Add Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--color-text-2)' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <motion.div
                key={currentMonth.toISOString()}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
              >
                {days.map(day => {
                  const tasks = getTasksForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const today = isToday(day);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                      className={`cal-cell ${today ? 'today' : ''} ${isSelected ? 'ring-2 ring-purple-500' : ''} ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        today ? 'bg-purple-600 text-white' : ''
                      }`}
                        style={{ color: today ? 'white' : 'var(--color-text)' }}>
                        {format(day, 'd')}
                      </span>
                      {/* Task dots */}
                      {tasks.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {tasks.slice(0, 3).map((t, i) => {
                            const pc = getPriorityConfig(t.priority);
                            return (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: pc.color, opacity: t.completed ? 0.4 : 1 }}
                              />
                            );
                          })}
                          {tasks.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Month summary */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Tasks this month', val: state.tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth)).length },
                { label: 'Completed', val: state.tasks.filter(t => t.completed && t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth)).length },
                { label: 'Total hours', val: `${state.tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth)).reduce((s, t) => s + (t.estimatedHours || 0), 0)}h` },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="stat-card text-center">
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{s.val}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Day detail panel */}
          <div>
            <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div
                  key={selectedDay.toISOString()}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {format(selectedDay, 'EEEE')}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
                        {format(selectedDay, 'MMMM d, yyyy')}
                      </p>
                    </div>
                    {isToday(selectedDay) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-600 text-white">Today</span>
                    )}
                  </div>

                  {selectedDayTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🌟</div>
                      <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>No tasks scheduled</p>
                      <button onClick={onAddTask} className="btn-ghost mt-3 text-xs">
                        <Plus size={13} /> Schedule a task
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayTasks.map(task => {
                        const pc = getPriorityConfig(task.priority);
                        return (
                          <motion.button
                            key={task.id}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => onEditTask(task)}
                            className="w-full text-left rounded-xl p-3 transition-all"
                            style={{
                              background: pc.bg,
                              borderLeft: `3px solid ${pc.color}`,
                              opacity: task.completed ? 0.6 : 1,
                            }}
                          >
                            <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}
                              style={{ color: 'var(--color-text)' }}>
                              {task.title}
                            </p>
                            {task.estimatedHours && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-2)' }}>
                                ⏱ {task.estimatedHours}h estimated
                              </p>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {selectedDayTasks.length > 0 && (
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>
                        Total: {selectedDayTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)}h planned
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-8 text-center"
                >
                  <div className="text-4xl mb-3">📅</div>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>Select a day</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-2)' }}>Click any date to see tasks</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
