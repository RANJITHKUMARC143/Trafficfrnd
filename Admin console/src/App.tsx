import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import UserCandidates from './pages/users/UserCandidates';
import UserEmployers from './pages/users/UserEmployers';
import UserAdmins from './pages/users/UserAdmins';
import Partners from './pages/Partners';
import PartnersVendors from './pages/partners/PartnersVendors';
import PartnersDelivery from './pages/partners/PartnersDelivery';
import Campaigns from './pages/Campaigns';
import Payments from './pages/Payments';
import PaymentsTransactions from './pages/payments/PaymentsTransactions';
import PaymentsInvoices from './pages/payments/PaymentsInvoices';
import PaymentsReports from './pages/payments/PaymentsReports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/users/candidates" element={<UserCandidates />} />
                    <Route path="/users/employers" element={<UserEmployers />} />
                    <Route path="/users/admins" element={<UserAdmins />} />
                    <Route path="/partners" element={<Partners />} />
                    <Route path="/partners/vendors" element={<PartnersVendors />} />
                    <Route path="/partners/delivery" element={<PartnersDelivery />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/payments/transactions" element={<PaymentsTransactions />} />
                    <Route path="/payments/invoices" element={<PaymentsInvoices />} />
                    <Route path="/payments/reports" element={<PaymentsReports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;