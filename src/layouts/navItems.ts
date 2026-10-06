import { House, ListChecks, ListTodo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

// Novas seções (Notas, Planos) entram aqui nas próximas fases.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/listas', label: 'Listas', icon: ListChecks, end: false },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo, end: false },
];