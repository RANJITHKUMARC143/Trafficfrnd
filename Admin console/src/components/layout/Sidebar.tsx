import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Truck, Megaphone, CreditCard, Settings, ChevronDown, ChevronRight, LogOut, X, Building2, Package, MapPin, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  subItems?: { title: string; path: string }[];
}

const NavItem: React.FC<NavItemProps> = ({ icon, title, path, subItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(location.pathname.startsWith(path));
  
  useEffect(() => {
    if (location.pathname.startsWith(path)) {
      setIsOpen(true);
    }
  }, [location.pathname, path]);
  
  const isActive = location.pathname === path;
  const hasSubItems = subItems.length > 0;
  
  const handleClick = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen);
    } else {
      navigate(path);
    }
  };

  return (
    <div>
      <motion.div 
        className={`flex items-center px-4 py-3 my-1 rounded-lg cursor-pointer transition-colors ${
          isActive ? 'bg-blue-700 text-white' : 'text-gray-700 hover:bg-blue-50'
        }`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="mr-3">{icon}</span>
        <span className="flex-1">{title}</span>
        {hasSubItems && (
          <motion.span 
            className="ml-auto"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </motion.span>
        )}
      </motion.div>
      
      {hasSubItems && (
        <motion.div 
          className="pl-10 pr-4 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isOpen ? 'auto' : 0,
            opacity: isOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {subItems.map((item, idx) => (
            <motion.div
              key={idx}
              className={`py-2 my-1 text-sm rounded-md cursor-pointer ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
              onClick={() => navigate(item.path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.title}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/users', label: 'Users', icon: <Users size={18} /> },
    { to: '/partners/vendors', label: 'Vendors', icon: <Building2 size={18} /> },
    { to: '/partners/delivery', label: 'Delivery Partners', icon: <Truck size={18} /> },
    { to: '/orders', label: 'Orders', icon: <Package size={18} /> },
    { to: '/payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <motion.div 
      className="h-full flex flex-col bg-white"
      initial={{ x: -80 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-800">Admin Console</h1>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          title="Dashboard"
          path="/" 
        />
        <NavItem 
          icon={<Users size={20} />} 
          title="User Management"
          path="/users"
          subItems={[
            { title: "Users", path: "/users/candidates" },
            { title: "Employers", path: "/users/employers" },
            { title: "Administrators", path: "/users/admins" },
          ]} 
        />
        <NavItem 
          icon={<Truck size={20} />} 
          title="Partners"
          path="/partners"
          subItems={[
            { title: "Vendors", path: "/partners/vendors" },
            { title: "Delivery Partners", path: "/partners/delivery" },
          ]} 
        />
        <NavItem 
          icon={<Megaphone size={20} />} 
          title="Campaigns"
          path="/campaigns" 
        />
        <NavItem 
          icon={<CreditCard size={20} />} 
          title="Payments"
          path="/payments"
          subItems={[
            { title: "Transactions", path: "/payments/transactions" },
            { title: "Invoices", path: "/payments/invoices" },
            { title: "Reports", path: "/payments/reports" },
          ]} 
        />
        <NavItem 
          icon={<Package size={20} />} 
          title="Orders"
          path="/orders"
          subItems={[
            { title: 'All Orders', path: '/orders' },
            { title: 'Create Order', path: '/orders/create' },
          ]}
        />
        <NavItem 
          icon={<MapPin size={20} />} 
          title="Delivery Point"
          path="/delivery-points" 
        />
        <NavItem 
          icon={<Bell size={20} />} 
          title="Alerts"
          path="/alerts" 
        />
        <NavItem 
          icon={<Settings size={20} />} 
          title="Settings"
          path="/settings" 
        />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">admin@example.com</p>
          </div>
        </div>
        <motion.button
          className="mt-4 flex items-center text-sm text-gray-600 hover:text-red-600 w-full"
          whileHover={{ x: 2 }}
          onClick={handleSignOut}
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;