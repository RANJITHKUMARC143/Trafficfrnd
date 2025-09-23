import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, FileText, TrendingUp, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const paymentRoutes = [
    {
      title: 'Transactions',
      description: 'Monitor and manage all payment transactions',
      icon: <CreditCard size={20} />,
      path: '/payments/transactions',
      color: 'bg-blue-50 text-blue-600',
      count: '1,245'
    },
    {
      title: 'Invoices',
      description: 'Manage invoice generation and tracking',
      icon: <FileText size={20} />,
      path: '/payments/invoices',
      color: 'bg-purple-50 text-purple-600',
      count: '327'
    },
    {
      title: 'Reports',
      description: 'Access financial reports and analytics',
      icon: <TrendingUp size={20} />,
      path: '/payments/reports',
      color: 'bg-emerald-50 text-emerald-600',
      count: '48'
    }
  ];
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError('');
        const baseUrl = 'http://localhost:3000';
        const token = localStorage.getItem('token') || '';

        // Use vendor orders as transactions proxy for now
        const ordersRes = await fetch(`${baseUrl}/api/vendors/orders/admin`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const ordersData = await ordersRes.json();
        if (!ordersRes.ok) throw new Error(ordersData?.message || 'Failed to fetch orders');

        // Fetch analytics for revenue/averages
        const analyticsRes = await fetch(`${baseUrl}/api/analytics/metrics`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const analytics = await analyticsRes.json();
        if (!analyticsRes.ok) throw new Error(analytics?.message || 'Failed to fetch analytics');

        const tx = (ordersData || []).slice(0, 20).map((o: any) => ({
          id: o._id,
          description: o.items?.map((i: any) => i.name).join(', ') || 'Order',
          amount: Number(o.totalAmount || 0),
          date: new Date(o.timestamp || o.createdAt || Date.now()).toISOString().slice(0, 10),
          status: (o.payment?.status === 'paid' || o.status === 'completed') ? 'completed' : (o.payment?.status === 'failed' ? 'failed' : 'pending'),
          method: o.payment?.method ? String(o.payment.method).toUpperCase() : 'ONLINE'
        }));
        setRecentTransactions(tx);

        const monthRevenue = analytics?.metrics?.lastMonth?.revenue ?? 0;
        const todayRevenue = analytics?.metrics?.today?.revenue ?? 0;
        const totalOrders = (ordersData || []).length;
        const failedCount = (ordersData || []).filter((o: any) => o.payment?.status === 'failed').length;
        const pendingAmount = (ordersData || []).filter((o: any) => !(o.payment?.status === 'paid'))
          .reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
        const avgTx = totalOrders ? (ordersData.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0) / totalOrders) : 0;

        setPaymentStats([
          { label: 'Monthly Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(monthRevenue), change: '+', changeType: 'positive' },
          { label: 'Pending Transactions', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(pendingAmount), change: '', changeType: 'positive' },
          { label: 'Failed Transactions', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(failedCount), change: '', changeType: 'negative' },
          { label: 'Average Transaction', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(avgTx), change: '', changeType: 'positive' },
        ]);
      } catch (e: any) {
        setError(e.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <DollarSign size={14} />;
      case 'pending': return <ExternalLink size={14} />;
      case 'failed': return <AlertTriangle size={14} />;
      default: return null;
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div>
      <PageHeader
        title="Payment Monitoring"
        description="Track and manage all financial transactions"
        actions={
          <Button 
            variant="primary"
            size="md"
            icon={<FileText size={16} />}
          >
            Generate Report
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {paymentStats.map((stat, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <div className="flex items-end">
              <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
              {stat.change && (
                <div className={`ml-2 flex items-center text-sm ${
                  stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Payment Routes */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {paymentRoutes.map((route, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            onClick={() => navigate(route.path)}
            className="cursor-pointer"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${route.color}`}>
                    {route.icon}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    {route.count}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{route.title}</h3>
                <p className="text-sm text-gray-600">{route.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Recent Transactions */}
      <Card>
        <CardHeader 
          title="Recent Transactions" 
          subtitle="Showing the latest payment activities"
          action={
            <Button 
              variant="ghost"
              size="sm"
              icon={<Download size={16} />}
            >
              Export
            </Button>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction, index) => (
                  <motion.tr 
                    key={transaction.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{
                      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(transaction.amount || 0))
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(transaction.status)}`}>
                          <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                          {String(transaction.status || '').charAt(0).toUpperCase() + String(transaction.status || '').slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Analytics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            title="Revenue Breakdown" 
            subtitle="By payment method"
          />
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Credit Card</span>
                  <span className="text-sm text-gray-500">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-blue-600 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1 }}
                  ></motion.div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">PayPal</span>
                  <span className="text-sm text-gray-500">20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-purple-500 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: '20%' }}
                    transition={{ duration: 1, delay: 0.2 }}
                  ></motion.div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Bank Transfer</span>
                  <span className="text-sm text-gray-500">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: '10%' }}
                    transition={{ duration: 1, delay: 0.4 }}
                  ></motion.div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Other</span>
                  <span className="text-sm text-gray-500">5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-amber-500 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: '5%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                  ></motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader 
            title="Transaction Success Rate" 
            subtitle="Last 7 days"
          />
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="96, 100"
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: "96, 100" }}
                    transition={{ duration: 2 }}
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-3xl font-bold text-gray-800">96%</div>
                  <div className="text-xs text-gray-500">Success</div>
                </div>
              </div>
              
              <div className="ml-6">
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Successful</div>
                  <div className="flex items-center">
                    <span className="text-xl font-semibold text-gray-800">1,198</span>
                    <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">96%</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Failed</div>
                  <div className="flex items-center">
                    <span className="text-xl font-semibold text-gray-800">47</span>
                    <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">4%</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total</div>
                  <div className="text-xl font-semibold text-gray-800">1,245</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payments;