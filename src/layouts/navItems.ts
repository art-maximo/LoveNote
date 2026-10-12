import { CalendarDays, FileText, House, ListChecks, ListTodo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/listas', label: 'Listas', icon: ListChecks, end: false },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo, end: false },
  { to: '/notas', label: 'Notas', icon: FileText, end: false },
  { to: '/planos', label: 'Planos', icon: CalendarDays, end: false },
];