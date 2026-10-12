import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ListsPage } from './pages/ListsPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { TasksPage } from './pages/TasksPage';
import { NotesPage } from './pages/NotesPage';
import { NoteDetailPage } from './pages/NoteDetailPage';
import { PlansPage } from './pages/PlansPage';
import { PlanDetailPage } from './pages/PlanDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listas" element={<ListsPage />} />
          <Route path="/listas/:listId" element={<ListDetailPage />} />
          <Route path="/tarefas" element={<TasksPage />} />
          <Route path="/notas" element={<NotesPage />} />
          <Route path="/notas/:noteId" element={<NoteDetailPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/planos/:planId" element={<PlanDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}