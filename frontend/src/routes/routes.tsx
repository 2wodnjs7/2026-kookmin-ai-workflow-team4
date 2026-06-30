import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import HomePage from '@/pages/home/index';
import MeetingCreatePage from '@/pages/meeting-create/index';
import ActionTrackerPage from '@/pages/action-tracker/index';
import MeetingSearchPage from '@/pages/meeting-search/index';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="meetings/create" element={<MeetingCreatePage />} />
          <Route path="actions" element={<ActionTrackerPage />} />
          <Route path="search" element={<MeetingSearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
