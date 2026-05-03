/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './frontend/context/AuthContext';
import ProtectedRoute from './frontend/components/ProtectedRoute';
import Login from './frontend/pages/Login';
import Channels from './frontend/pages/Channels';
import AdminDashboard from './frontend/pages/AdminDashboard';
import { Dashboard } from './frontend/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

