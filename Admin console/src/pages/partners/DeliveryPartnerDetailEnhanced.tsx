import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Phone, 
  Truck, 
  Package, 
  Clock, 
  Star, 
  DollarSign,
  Activity,
  Eye,
  Search,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Shield,
  Navigation,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Receipt,
  User,
  Store,
  MapPin as MapPinIcon,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryPartner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  vehicleType: string;
  vehicleNumber: string;
  rating?: number;
  totalDeliveries?: number;
  onTimeRate?: number;
  acceptanceRate?: number;
  cancellationRate?: number;
  currentLocation?: {
    coordinates: [number, number];
    lastUpdated: string;
  };
  earnings?: {
    total: number;
    monthly: number;
    weekly: number;
  };
  address?: any;
  createdAt?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  timestamp: string;
  items?: OrderItem[];
  deliveryAddress?: string;
  specialInstructions?: string;
  vehicleNumber?: string;
  vendorId: {
    businessName: string;
    ownerName: string;
    phone?: string;
    address?: any;
  };
  user?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

const DeliveryPartnerDetailEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'activity'>('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartnerDetails();
      fetchPartnerOrders();
    }
  }, [id]);

  const fetchPartnerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery/${id}`;
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setPartner(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch partner details');
    }
  };

  const fetchPartnerOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery/${id}/orders`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to fetch partner orders');
      const data = await res.json();
      console.log('Fetched orders:', data);
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!order.customerName) return true;
    return order.customerName.toLowerCase().includes(orderSearch.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading partner details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Partner</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/partners/delivery')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Partner Not Found</h3>
          <p className="text-gray-600">The delivery partner you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/partners/delivery')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/partners/delivery')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {partner.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{partner.fullName}</h1>
                <p className="text-gray-600">Delivery Partner Details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Partner Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-3xl font-bold text-blue-600">{partner.totalDeliveries || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-3xl font-bold text-yellow-600">{partner.rating || 0}/5</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                <p className="text-3xl font-bold text-green-600">{partner.onTimeRate || 0}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-purple-600">${partner.earnings?.total || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{partner.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-3 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-lg font-semibold text-gray-900">{partner.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicle</p>
                <p className="text-lg font-semibold text-gray-900">{partner.vehicleType} - {partner.vehicleNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-lg font-semibold text-gray-900">
                  {partner.address ? 
                    `${partner.address.street || ''}, ${partner.address.city || ''}` :
                    'No address provided'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{partner.onTimeRate || 0}%</p>
              <p className="text-sm text-gray-600">On-Time Rate</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-green-600">{partner.acceptanceRate || 0}%</p>
              <p className="text-sm text-gray-600">Acceptance Rate</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-red-600">{partner.cancellationRate || 0}%</p>
              <p className="text-sm text-gray-600">Cancellation Rate</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'activity', label: 'Activity', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {orders.filter(o => o.status === 'completed').length}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {orders.filter(o => o.status === 'pending').length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-purple-600">
                            ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Current Location */}
                  {partner.currentLocation && (
                    <div className="p-6 bg-gray-50 rounded-xl">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                        Current Location
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Coordinates</p>
                          <p className="font-mono text-lg">
                            {partner.currentLocation.coordinates[1].toFixed(6)}, {partner.currentLocation.coordinates[0].toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="text-lg">
                            {new Date(partner.currentLocation.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {filteredOrders.length} orders found
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{order.customerName}</h4>
                              <p className="text-sm text-gray-600">{order.vendorId.businessName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{order.status}</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                          <span>Order ID: {order.id.slice(-8)}</span>
                          <span>{new Date(order.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Log</h3>
                  <p className="text-gray-600">Activity tracking will be available soon.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowOrderModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
                <p className="text-gray-600">Order ID: {selectedOrder.id}</p>
              </div>

              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(selectedOrder.status).split(' ')[0]}`}>
                      {getStatusIcon(selectedOrder.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className="text-lg font-semibold capitalize">{selectedOrder.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">${selectedOrder.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-semibold">{selectedOrder.customerName}</p>
                    </div>
                    {selectedOrder.user?.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{selectedOrder.user.email}</p>
                      </div>
                    )}
                    {selectedOrder.user?.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{selectedOrder.user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Store className="w-5 h-5 mr-2 text-green-600" />
                    Vendor Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-semibold">{selectedOrder.vendorId.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Owner</p>
                      <p className="font-semibold">{selectedOrder.vendorId.ownerName}</p>
                    </div>
                    {selectedOrder.vendorId.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{selectedOrder.vendorId.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Receipt className="w-5 h-5 mr-2 text-purple-600" />
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Information */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Delivery Information
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.deliveryAddress && (
                      <div>
                        <p className="text-sm text-gray-600">Delivery Address</p>
                        <p className="font-semibold">{selectedOrder.deliveryAddress}</p>
                      </div>
                    )}
                    {selectedOrder.vehicleNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Vehicle Number</p>
                        <p className="font-semibold">{selectedOrder.vehicleNumber}</p>
                      </div>
                    )}
                    {selectedOrder.specialInstructions && (
                      <div>
                        <p className="text-sm text-gray-600">Special Instructions</p>
                        <p className="font-semibold">{selectedOrder.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Order Timeline
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Order Placed</p>
                      <p className="font-semibold">{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryPartnerDetailEnhanced; 