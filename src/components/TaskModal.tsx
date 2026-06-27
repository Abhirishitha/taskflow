import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, Tag, Folder, AlertCircle } from 'lucide-react';
import { Task, Priority, Category } from '../types';
import { useApp } from '../context/AppContext';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, getCategoryConfig, getPriorityConfig } from '../utils';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

const defaultForm = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  category: 'work' as Category,
  tags: [] as string[],
  dueDate: '',
  estimatedHours: '',
};

export default function TaskModal({ isOpen, onClose, editTask }: TaskModalProps) {
  const { addTask, updateTask, state } = useApp();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description || '',
        priority: editTask.priority,
        category: editTask.category,
        tags: editTask.tags,
        dueDate: editTask.dueDate ? format(new Date(editTask.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
        estimatedHours: editTask.estimatedHours?.toString() || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editTask, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Task title is required';
    if (form.estimatedHours && isNaN(Number(form.estimatedHours))) e.estimatedHours = 'Must be a number';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const taskData = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      category: form.category,
      tags: form.tags,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
      completed: editTask?.completed ?? false,
    };

    if (editTask) {
      updateTask({ ...editTask, ...taskData });
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter(t => t !== tagId) : [...f.tags, tagId],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {editTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                <X size={18} style={{ color: 'var(--color-text-2)' }} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(ev => ({ ...ev, title: '' })); }}
                  className="input-field text-base font-medium"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                {errors.title && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <textarea
                placeholder="Add description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="input-field resize-none"
                style={{ minHeight: 60 }}
              />

              {/* Priority and Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-2)' }}>
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(p => {
                      const cfg = getPriorityConfig(p);
                      return (
                        <button
                          key={p}
                          onClick={() => setForm(f => ({ ...f, priority: p }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            form.priority === p ? 'border-transparent text-white' : 'bg-transparent'
                          }`}
                          style={{
                            background: form.priority === p ? cfg.color : 'transparent',
                            borderColor: form.priority === p ? 'transparent' : cfg.border,
                            color: form.priority === p ? 'white' : cfg.color,
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-2)' }}>
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="input-field py-2 text-xs"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c} style={{ background: 'var(--color-surface)' }}>
                        {getCategoryConfig(c).icon} {getCategoryConfig(c).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due date and Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-2)' }}>
                    <Calendar size={11} /> Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="input-field text-xs"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-2)' }}>
                    <Clock size={11} /> Est. Hours
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2.5"
                    min="0"
                    step="0.5"
                    value={form.estimatedHours}
                    onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Tags */}
              {state.tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--color-text-2)' }}>
                    <Tag size={11} /> Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {state.tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                          form.tags.includes(tag.id) ? 'text-white' : ''
                        }`}
                        style={{
                          background: form.tags.includes(tag.id) ? tag.color : 'transparent',
                          borderColor: tag.color + '50',
                          color: form.tags.includes(tag.id) ? 'white' : tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                className="btn-primary"
              >
                <Plus size={16} />
                {editTask ? 'Save Changes' : 'Add Task'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
