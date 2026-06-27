import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2, Circle, Trash2, Edit3, GripVertical, Clock,
  AlertTriangle, Zap, Timer, Tag, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import { Task, getUrgency } from '../types';
import { useApp } from '../context/AppContext';
import { getPriorityConfig, getCategoryConfig, getUrgencyConfig, formatTime, formatDate } from '../utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  compact?: boolean;
}

export default function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
  const { toggleTask, deleteTask } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const urgency = task.dueDate ? getUrgency(task.dueDate) : 'normal';
  const urgencyConfig = getUrgencyConfig(urgency);
  const priorityConfig = getPriorityConfig(task.priority);
  const categoryConfig = getCategoryConfig(task.category);

  const hoursLeft = task.estimatedHours && task.dueDate ? (() => {
    const daysLeft = Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return Math.ceil((task.estimatedHours / daysLeft) * 10) / 10;
  })() : null;

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 200));
    deleteTask(task.id);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`task-card relative group ${deleting ? 'pointer-events-none' : ''}`}
    >
      <div
        className={`card p-4 ${task.completed ? 'opacity-60' : ''} ${
          urgency === 'overdue' && !task.completed ? 'border-red-500/30' : ''
        } ${urgency === 'critical' && !task.completed ? 'border-orange-500/30' : ''}`}
      >
        {/* Priority stripe */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
          style={{ background: priorityConfig.color }}
        />

        <div className="flex items-start gap-3 pl-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="drag-handle mt-0.5 text-gray-400 hover:text-purple-400 flex-shrink-0"
          >
            <GripVertical size={16} />
          </button>

          {/* Checkbox */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleTask(task.id)}
            className="mt-0.5 flex-shrink-0 transition-colors"
          >
            <AnimatePresence mode="wait">
              {task.completed ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0.5, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <CheckCircle2 size={20} className="text-purple-500" />
                </motion.div>
              ) : (
                <motion.div key="unchecked" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <Circle size={20} className="text-gray-400 hover:text-purple-400 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm leading-snug ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}
                  style={{ color: task.completed ? undefined : 'var(--color-text)' }}
                >
                  {task.title}
                </p>
                {task.description && !compact && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-2)' }}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Edit3 size={13} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </motion.button>
                {task.description && !compact && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Priority */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: priorityConfig.bg, color: priorityConfig.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityConfig.color }} />
                {priorityConfig.label}
              </span>

              {/* Category */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: categoryConfig.bg, color: categoryConfig.color }}
              >
                {categoryConfig.icon} {categoryConfig.label}
              </span>

              {/* Due date */}
              {task.dueDate && !task.completed && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: urgencyConfig.color }}
                >
                  {urgency === 'overdue' ? <AlertTriangle size={11} /> :
                   urgency === 'critical' ? <Zap size={11} /> :
                   <Clock size={11} />}
                  {formatTime(task.dueDate)}
                </span>
              )}

              {task.dueDate && task.completed && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {/* Hours per day indicator */}
              {hoursLeft !== null && !task.completed && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-2)' }}>
                  <Timer size={11} />
                  {hoursLeft}h/day needed
                </span>
              )}
            </div>

            {/* Expanded description */}
            <AnimatePresence>
              {expanded && task.description && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs mt-2 pt-2 border-t border-purple-500/10 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                    {task.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Urgency pulse for critical/overdue */}
        {!task.completed && (urgency === 'critical' || urgency === 'overdue') && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${urgencyConfig.color}15, transparent 70%)`
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
