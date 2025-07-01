import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import PartnersDeliveryEnhanced from './pages/partners/PartnersDeliveryEnhanced';
import DeliveryPartnerDetail from './pages/partners/DeliveryPartnerDetail';
import DeliveryPartnerDetailEnhanced from './pages/partners/DeliveryPartnerDetailEnhanced';
import VendorOrders from './pages/partners/VendorOrders';
import Campaigns from './pages/Campaigns';
import Payments from './pages/Payments';
import PaymentsTransactions from './pages/payments/PaymentsTransactions';
import PaymentsInvoices from './pages/payments/PaymentsInvoices';
import PaymentsReports from './pages/payments/PaymentsReports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import DeliveryPoints from './pages/DeliveryPoints';
import Alerts from './pages/Alerts';

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
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/users/candidates" element={<ProtectedRoute><UserCandidates /></ProtectedRoute>} />
            <Route path="/users/employers" element={<ProtectedRoute><UserEmployers /></ProtectedRoute>} />
            <Route path="/users/admins" element={<ProtectedRoute><UserAdmins /></ProtectedRoute>} />
            <Route path="/users/inactive" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
            <Route path="/partners/vendors" element={<ProtectedRoute><PartnersVendors /></ProtectedRoute>} />
            <Route path="/partners/delivery" element={<ProtectedRoute><PartnersDelivery /></ProtectedRoute>} />
            <Route path="/partners/delivery/:id" element={<ProtectedRoute><DeliveryPartnerDetailEnhanced /></ProtectedRoute>} />
            <Route path="/partners/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/payments/transactions" element={<ProtectedRoute><PaymentsTransactions /></ProtectedRoute>} />
            <Route path="/payments/invoices" element={<ProtectedRoute><PaymentsInvoices /></ProtectedRoute>} />
            <Route path="/payments/reports" element={<ProtectedRoute><PaymentsReports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/delivery-points" element={<ProtectedRoute><DeliveryPoints /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
        <ToastContainer position="top-right" autoClose={2000} />
      </Layout>
    </Router>
  );
}

export default App;