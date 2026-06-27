import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, Task, Tag, Priority, Category, DailyStat } from '../types';
import { format } from 'date-fns';

const STORAGE_KEY = 'taskflow_v2';

const defaultTags: Tag[] = [
  { id: 'tag-1', name: 'Urgent', color: '#ef4444' },
  { id: 'tag-2', name: 'Meeting', color: '#3b82f6' },
  { id: 'tag-3', name: 'Review', color: '#f59e0b' },
  { id: 'tag-4', name: 'Deep Work', color: '#8b5cf6' },
  { id: 'tag-5', name: 'Quick Win', color: '#10b981' },
];

const sampleTasks: Task[] = [
  {
    id: 'sample-1',
    title: 'Design new landing page',
    description: 'Create wireframes and high-fidelity mockups for Q2 campaign',
    completed: false,
    priority: 'high',
    category: 'work',
    tags: ['tag-4'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedHours: 8,
    createdAt: new Date().toISOString(),
    order: 0,
  },
  {
    id: 'sample-2',
    title: 'Weekly team sync',
    description: 'Prepare agenda and review OKRs',
    completed: false,
    priority: 'medium',
    category: 'work',
    tags: ['tag-2'],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedHours: 1,
    createdAt: new Date().toISOString(),
    order: 1,
  },
  {
    id: 'sample-3',
    title: 'Morning run – 5km',
    description: 'Stick to the training plan',
    completed: true,
    priority: 'medium',
    category: 'health',
    tags: [],
    dueDate: new Date().toISOString(),
    estimatedHours: 0.5,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    order: 2,
  },
  {
    id: 'sample-4',
    title: 'Read "Atomic Habits" – Ch. 7',
    completed: false,
    priority: 'low',
    category: 'learning',
    tags: ['tag-4'],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedHours: 1.5,
    createdAt: new Date().toISOString(),
    order: 3,
  },
  {
    id: 'sample-5',
    title: 'Q1 expense report',
    description: 'Gather receipts and submit to finance',
    completed: false,
    priority: 'high',
    category: 'finance',
    tags: ['tag-1'],
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    estimatedHours: 2,
    createdAt: new Date().toISOString(),
    order: 4,
  },
];

const initialState: AppState = {
  tasks: sampleTasks,
  tags: defaultTags,
  theme: 'dark',
  completionStreak: 3,
  dailyStats: {
    [format(new Date(), 'yyyy-MM-dd')]: { date: format(new Date(), 'yyyy-MM-dd'), completed: 1, total: 5, focusMinutes: 45 },
  },
};

type Action =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'order'> }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'ADD_TAG'; payload: Omit<Tag, 'id'> }
  | { type: 'DELETE_TAG'; payload: string }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'UPDATE_STREAK' }
  | { type: 'LOAD_STATE'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_TASK': {
      const newTask: Task = {
        ...action.payload,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        order: state.tasks.length,
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    }

    case 'DELETE_TASK': {
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    }

    case 'TOGGLE_TASK': {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tasks = state.tasks.map(t =>
        t.id === action.payload
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      );
      const completedToday = tasks.filter(t => {
        if (!t.completedAt) return false;
        return format(new Date(t.completedAt), 'yyyy-MM-dd') === today;
      }).length;
      const totalToday = tasks.filter(t => {
        const created = format(new Date(t.createdAt), 'yyyy-MM-dd');
        return created <= today && (!t.dueDate || format(new Date(t.dueDate), 'yyyy-MM-dd') >= today || t.completed);
      }).length;
      const dailyStats = {
        ...state.dailyStats,
        [today]: { date: today, completed: completedToday, total: Math.max(totalToday, completedToday), focusMinutes: state.dailyStats[today]?.focusMinutes ?? 0 },
      };
      return { ...state, tasks, dailyStats };
    }

    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };

    case 'ADD_TAG': {
      const tag: Tag = { ...action.payload, id: `tag-${Date.now()}` };
      return { ...state, tags: [...state.tags, tag] };
    }

    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter(t => t.id !== action.payload),
        tasks: state.tasks.map(t => ({ ...t, tags: t.tags.filter(tid => tid !== action.payload) })),
      };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'UPDATE_STREAK': {
      const today = format(new Date(), 'yyyy-MM-dd');
      return { ...state, completionStreak: state.completionStreak + 1, lastCompletionDate: today };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  deleteTag: (id: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppState;
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'order'>) => dispatch({ type: 'ADD_TASK', payload: task }), []);
  const updateTask = useCallback((task: Task) => dispatch({ type: 'UPDATE_TASK', payload: task }), []);
  const deleteTask = useCallback((id: string) => dispatch({ type: 'DELETE_TASK', payload: id }), []);
  const toggleTask = useCallback((id: string) => dispatch({ type: 'TOGGLE_TASK', payload: id }), []);
  const reorderTasks = useCallback((tasks: Task[]) => dispatch({ type: 'REORDER_TASKS', payload: tasks }), []);
  const addTag = useCallback((tag: Omit<Tag, 'id'>) => dispatch({ type: 'ADD_TAG', payload: tag }), []);
  const deleteTag = useCallback((id: string) => dispatch({ type: 'DELETE_TAG', payload: id }), []);
  const setTheme = useCallback((theme: 'dark' | 'light') => dispatch({ type: 'SET_THEME', payload: theme }), []);

  return (
    <AppContext.Provider value={{ state, addTask, updateTask, deleteTask, toggleTask, reorderTasks, addTag, deleteTag, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
