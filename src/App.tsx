import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import FocusMode from './components/FocusMode';
import PrepPlanner from './components/PrepPlanner';
import TaskModal from './components/TaskModal';
import { View, Task } from './types';
import { Plus, Menu, X } from 'lucide-react';

function AppContent() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const renderView = () => {
    const props = { onAddTask: handleAddTask, onEditTask: handleEditTask };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'weekly': return <WeeklyView {...props} />;
      case 'monthly': return <MonthlyView {...props} />;
      case 'focus': return <FocusMode {...props} />;
      case 'planner': return <PrepPlanner {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - desktop always visible, mobile overlay */}
      <div className={`
        fixed lg:relative lg:flex lg:flex-shrink-0 z-50 h-full transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => { setActiveView(view); setSidebarOpen(false); }}
          onAddTask={handleAddTask}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
            <Menu size={20} style={{ color: 'var(--color-text)' }} />
          </button>
          <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            {{
              dashboard: 'Dashboard',
              weekly: 'Weekly',
              monthly: 'Monthly',
              focus: 'Focus',
              planner: 'Planner',
            }[activeView]}
          </span>
          <button onClick={handleAddTask} className="p-2 rounded-lg bg-purple-600 text-white">
            <Plus size={18} />
          </button>
        </div>

        {/* View content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex overflow-hidden"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB - mobile only */}
      <motion.button
        className="fab lg:hidden"
        whileTap={{ scale: 0.9 }}
        onClick={handleAddTask}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
      >
        <Plus size={24} />
      </motion.button>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editTask={editingTask}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
