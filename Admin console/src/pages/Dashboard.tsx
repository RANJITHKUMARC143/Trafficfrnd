import React, { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import OverviewChart from '../components/dashboard/OverviewChart';
import RecentActivityTable from '../components/dashboard/RecentActivityTable';
import { Users, Briefcase, CreditCard, Truck } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [counts, setCounts] = useState<{ users: number; vendors: number; delivery: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const baseUrl = 'https://trafficfrnd-2.onrender.com';
        const token = localStorage.getItem('token') || '';

        const [usersRes, vendorsRes, deliveryRes, ordersRes] = await Promise.all([
          fetch(`${baseUrl}/api`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
          fetch(`${baseUrl}/api/vendors`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
          fetch(`${baseUrl}/api/delivery`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
          fetch(`${baseUrl}/api/vendors/orders/admin`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
        ]);

        const [users, vendors, delivery, orders] = await Promise.all([
          usersRes.json(), vendorsRes.json(), deliveryRes.json(), ordersRes.json()
        ]);

        if (!usersRes.ok) throw new Error(users?.message || 'Failed to fetch users');
        if (!vendorsRes.ok) throw new Error(vendors?.message || 'Failed to fetch vendors');
        if (!deliveryRes.ok) throw new Error(delivery?.message || 'Failed to fetch delivery partners');
        if (!ordersRes.ok) throw new Error(orders?.message || 'Failed to fetch orders');

        // Compute admin-wide metrics as a fallback from orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ordersArray = Array.isArray(orders) ? orders : [];
        const todayOrders = ordersArray.filter((o: any) => {
          const t = new Date(o.timestamp || o.createdAt || 0).getTime();
          return t >= today.getTime() && t < tomorrow.getTime();
        });
        const revenueToday = todayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
        const activeOrders = ordersArray.filter((o: any) => ['pending','confirmed','preparing','ready'].includes(o.status));

        setMetrics({
          revenue: revenueToday,
          orders: todayOrders.length,
          rating: 0,
          activeOrders,
        });
        setCounts({ users: (users || []).length, vendors: (vendors || []).length, delivery: (delivery || []).length });
      } catch (e: any) {
        setError(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to your admin console</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={counts?.users ?? '-'} 
          icon={<Users size={18} />}
          color="blue"
        />
        <StatCard 
          title="Active Orders" 
          value={metrics?.activeOrders?.length ?? 0} 
          icon={<Briefcase size={18} />}
          color="green"
        />
        <StatCard 
          title="Revenue (Today)" 
          value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(metrics?.revenue || 0))} 
          icon={<CreditCard size={18} />}
          color="purple"
        />
        <StatCard 
          title="Partners" 
          value={(counts?.vendors ?? 0) + (counts?.delivery ?? 0)} 
          icon={<Truck size={18} />}
          color="teal"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart />
        </div>
        <div>
          <RecentActivityTable />
        </div>
      </div>
      
      {/* Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Distribution</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Candidates</span>
                <span className="text-sm text-gray-500">35%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Vendors</span>
                <span className="text-sm text-gray-500">15%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Server Uptime</h4>
              <div className="flex items-center">
                <div className="text-2xl font-semibold text-gray-800">99.8%</div>
                <div className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Healthy</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">API Response</h4>
              <div className="flex items-center">
                <div className="text-2xl font-semibold text-gray-800">247ms</div>
                <div className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Good</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Usage</h4>
              <div className="flex items-center">
                <div className="text-2xl font-semibold text-gray-800">68%</div>
                <div className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Normal</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">DB Queries</h4>
              <div className="flex items-center">
                <div className="text-2xl font-semibold text-gray-800">1.2k</div>
                <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Avg/min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;