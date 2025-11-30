import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from './Dashboard'
import Account from './Account'
import Reservation from './Reservation'
import Books from './Books'
import Logs from './Logs'
import Announcement from './Announcement'

export default function SecondWindow() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
          <Route path="reservation" element={<Reservation />} />
          <Route path="books" element={<Books />} />
          <Route path="logs" element={<Logs />} />
          <Route path="announcement" element={<Announcement />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
