import React from 'react';
import { User, UserPlus, UserX, UserCog, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const userCategories = [
    {
      title: 'Candidates',
      count: 3254,
      icon: <User size={20} />,
      path: '/users/candidates',
      color: 'bg-blue-50 text-blue-600',
      change: '+124 this month',
      description: 'Job seekers looking for employment opportunities'
    },
    {
      title: 'Employers',
      count: 872,
      icon: <UserPlus size={20} />,
      path: '/users/employers',
      color: 'bg-emerald-50 text-emerald-600',
      change: '+32 this month',
      description: 'Companies and organizations offering jobs'
    },
    {
      title: 'Administrators',
      count: 24,
      icon: <UserCog size={20} />,
      path: '/users/admins',
      color: 'bg-purple-50 text-purple-600',
      change: '+2 this month',
      description: 'System administrators with elevated permissions'
    },
    {
      title: 'Inactive Users',
      count: 126,
      icon: <UserX size={20} />,
      path: '/users/inactive',
      color: 'bg-gray-50 text-gray-600',
      change: '-8 this month',
      description: 'Users who haven\'t logged in for over 90 days'
    },
  ];
  
  const userStats = [
    { label: 'Total Users', value: 4276 },
    { label: 'New This Month', value: 158 },
    { label: 'Active Now', value: 243 },
    { label: 'Verification Rate', value: '94%' },
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
  
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage all users across the platform"
        actions={
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            <Button 
              variant="primary"
              size="md"
              icon={<UserPlus size={16} />}
            >
              Add New User
            </Button>
          </>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {userStats.map((stat, index) => (
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
      
      {/* User Categories */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {userCategories.map((category, index) => (
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
      
      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent User Activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((item) => (
                <motion.div 
                  key={item}
                  className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: item * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">John Doe</span> {item % 2 === 0 ? 'updated their profile information' : 'registered as a new candidate'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item} hour{item !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;