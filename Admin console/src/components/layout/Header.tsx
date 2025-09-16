import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, Search, Menu, X, User, Settings, HelpCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationType {
  id: number;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = () => {
      setIsNotificationsOpen(false);
      setIsProfileOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        setCurrentUser(JSON.parse(raw));
      }
    } catch {}
    // Socket for real-time admin notifications
    let socket: Socket | null = null;
    try {
      const token = localStorage.getItem('token') || '';
      socket = io(import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com', {
        transports: ['websocket'],
        auth: { token, role: 'admin' },
      });
      socket.on('adminOrderCreated', (order: any) => {
        setNotifications(prev => [
          { id: Date.now(), message: `New order from ${order.customerName}`, time: 'just now', read: false, type: 'info' },
          ...prev
        ]);
      });
      socket.on('adminOrderStatusUpdated', ({ orderId, status }: { orderId: string; status: string }) => {
        setNotifications(prev => [
          { id: Date.now() + 1, message: `Order ${String(orderId).slice(-6)} status: ${status}`, time: 'just now', read: false, type: 'success' },
          ...prev
        ]);
      });
      socket.on('adminEvent', (evt: any) => {
        let msg = '';
        if (evt?.action === 'order_created') msg = `Order created (${String(evt.orderId).slice(-6)}) - ₹${evt.totalAmount}`;
        else if (evt?.action === 'vendor_confirmed') msg = `Vendor confirmed order ${String(evt.orderId).slice(-6)}`;
        else if (evt?.action === 'order_claimed') msg = `Order ${String(evt.orderId).slice(-6)} claimed by delivery partner`;
        else if (evt?.action === 'status_changed') msg = `Order ${String(evt.orderId).slice(-6)}: ${evt.from} → ${evt.to}`;
        if (msg) {
          setNotifications(prev => [
            { id: Date.now() + Math.floor(Math.random()*1000), message: msg, time: 'just now', read: false, type: 'info' },
            ...prev
          ]);
        }
      });
    } catch {}
    return () => {
      if (socket) {
        socket.off('adminOrderCreated');
        socket.off('adminOrderStatusUpdated');
        socket.disconnect();
      }
    };
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/users')) {
      if (path === '/users/candidates') return 'Candidate Management';
      if (path === '/users/employers') return 'Employer Management';
      if (path === '/users/admins') return 'Admin Management';
      return 'User Management';
    }
    if (path.startsWith('/partners')) {
      if (path === '/partners/vendors') return 'Vendor Management';
      if (path === '/partners/delivery') return 'Delivery Partner Management';
      return 'Partner Management';
    }
    if (path.startsWith('/campaigns')) return 'Campaign Management';
    if (path.startsWith('/payments')) {
      if (path === '/payments/transactions') return 'Transaction Management';
      if (path === '/payments/invoices') return 'Invoice Management';
      if (path === '/payments/reports') return 'Payment Reports';
      return 'Payment Monitoring';
    }
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Admin Console';
  };

  const markAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(
      notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(
      notifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationColor = (type: NotificationType['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-l-4 border-blue-500';
      case 'warning': return 'bg-amber-50 border-l-4 border-amber-500';
      case 'error': return 'bg-red-50 border-l-4 border-red-500';
      case 'success': return 'bg-emerald-50 border-l-4 border-emerald-500';
      default: return 'bg-gray-50';
    }
  };

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center">
          <motion.button 
            onClick={onMenuClick}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-800"
            whileTap={{ scale: 0.9 }}
          >
            <Menu size={24} />
          </motion.button>
          
          <motion.h2 
            className="text-xl font-semibold text-gray-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={getPageTitle()}
            transition={{ duration: 0.3 }}
          >
            {getPageTitle()}
          </motion.h2>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <motion.button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-full hover:bg-gray-100 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
            
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <motion.div 
                          key={notification.id} 
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? getNotificationColor(notification.type) : ''
                          }`}
                          onClick={(e) => markAsRead(notification.id, e)}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-sm text-gray-800 mb-1">{notification.message}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">{notification.time}</p>
                            {!notification.read && (
                              <span className="text-xs text-blue-600">New</span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <motion.button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(currentUser?.name || currentUser?.username || currentUser?.email || 'A').toString().charAt(0).toUpperCase()}
              </div>
            </motion.button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">{currentUser?.name || currentUser?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
                  </div>
                  <div className="py-1">
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User size={16} className="mr-2" />
                      Profile
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Settings size={16} className="mr-2" />
                      Account settings
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <HelpCircle size={16} className="mr-2" />
                      Help & Support
                    </a>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <a href="#" onClick={handleSignOut} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Sign out
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 lg:hidden">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;