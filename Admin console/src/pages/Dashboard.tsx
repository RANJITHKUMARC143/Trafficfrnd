import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import OverviewChart from '../components/dashboard/OverviewChart';
import RecentActivityTable from '../components/dashboard/RecentActivityTable';
import { Users, Briefcase, CreditCard, Truck } from 'lucide-react';

const Dashboard: React.FC = () => {
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
          value="4,276" 
          icon={<Users size={18} />}
          change={{ value: 12, type: 'increase' }}
          color="blue"
        />
        <StatCard 
          title="Active Jobs" 
          value="843" 
          icon={<Briefcase size={18} />}
          change={{ value: 5, type: 'increase' }}
          color="green"
        />
        <StatCard 
          title="Revenue" 
          value="$128,540" 
          icon={<CreditCard size={18} />}
          change={{ value: 8, type: 'increase' }}
          color="purple"
        />
        <StatCard 
          title="Partners" 
          value="36" 
          icon={<Truck size={18} />}
          change={{ value: 2, type: 'decrease' }}
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
                <span className="text-sm font-medium text-gray-700">Employers</span>
                <span className="text-sm text-gray-500">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
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
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Administrators</span>
                <span className="text-sm text-gray-500">5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '5%' }}></div>
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