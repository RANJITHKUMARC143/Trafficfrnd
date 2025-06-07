import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* User Management Routes */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/candidates" element={<UserCandidates />} />
            <Route path="/users/employers" element={<UserEmployers />} />
            <Route path="/users/admins" element={<UserAdmins />} />
            
            {/* Partners Routes */}
            <Route path="/partners" element={<Partners />} />
            <Route path="/partners/vendors" element={<PartnersVendors />} />
            <Route path="/partners/delivery" element={<PartnersDelivery />} />
            
            {/* Campaigns Route */}
            <Route path="/campaigns" element={<Campaigns />} />
            
            {/* Payments Routes */}
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/transactions" element={<PaymentsTransactions />} />
            <Route path="/payments/invoices" element={<PaymentsInvoices />} />
            <Route path="/payments/reports" element={<PaymentsReports />} />
            
            {/* Settings Route */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  );
}

export default App;