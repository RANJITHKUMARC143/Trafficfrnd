import React from 'react';
import { Truck, Building2, BarChart3, AlertTriangle, CheckCircle, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

const Partners: React.FC = () => {
  const navigate = useNavigate();
  
  const partnerCategories = [
    {
      title: 'Vendors',
      count: 24,
      icon: <Building2 size={20} />,
      path: '/partners/vendors',
      color: 'bg-emerald-50 text-emerald-600',
      change: '+3 this month',
      description: 'Service providers and product suppliers'
    },
    {
      title: 'Delivery Partners',
      count: 12,
      icon: <Truck size={20} />,
      path: '/partners/delivery',
      color: 'bg-blue-50 text-blue-600',
      change: '+1 this month',
      description: 'Logistics and delivery service partners'
    },
  ];
  
  const partnerApplications = [
    {
      id: 'APP001',
      name: 'Logistics Express',
      type: 'Delivery Partner',
      status: 'pending',
      date: '2023-06-15',
    },
    {
      id: 'APP002',
      name: 'Office Supply Co.',
      type: 'Vendor',
      status: 'approved',
      date: '2023-06-12',
    },
    {
      id: 'APP003',
      name: 'Training Solutions',
      type: 'Vendor',
      status: 'rejected',
      date: '2023-06-10',
    },
    {
      id: 'APP004',
      name: 'Quick Delivery Inc.',
      type: 'Delivery Partner',
      status: 'under_review',
      date: '2023-06-08',
    },
  ];
  
  const partnerStats = [
    { label: 'Total Partners', value: 36 },
    { label: 'Active Partners', value: 32 },
    { label: 'Pending Applications', value: 5 },
    { label: 'Partner Satisfaction', value: '92%' },
  ];
  
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FileQuestion size={16} className="text-amber-500" />;
      case 'approved':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'rejected':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'under_review':
        return <BarChart3 size={16} className="text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      default:
        return status;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'approved':
        return 'text-emerald-600 bg-emerald-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'under_review':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  return (
    <div>
      <PageHeader
        title="Partner Management"
        description="Manage all partner relationships"
        actions={
          <Button 
            variant="primary"
            size="md"
            icon={<Building2 size={16} />}
          >
            Add New Partner
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {partnerStats.map((stat, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Partner Categories */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {partnerCategories.map((category, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            onClick={() => navigate(category.path)}
            className="cursor-pointer"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                    {category.icon}
                  </div>
                  <div className="text-sm text-gray-500">{category.change}</div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{category.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                
                <div className="text-2xl font-bold text-gray-800">{category.count.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Partner Applications */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Partner Applications</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partnerApplications.map((application, index) => (
                    <motion.tr 
                      key={application.id}
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{application.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(application.status)}
                          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
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
      </div>
      
      {/* Partner Performance */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Partner Performance Overview</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="h-64 flex items-end justify-between">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
              const height = [65, 85, 45, 75, 90, 70][index];
              return (
                <motion.div 
                  key={month} 
                  className="flex flex-col items-center"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {month}
                  </div>
                  <motion.div 
                    className="w-12 bg-blue-500 rounded-t-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  ></motion.div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">24 hrs</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Partner Retention</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">89%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Active Contracts</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">28</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;