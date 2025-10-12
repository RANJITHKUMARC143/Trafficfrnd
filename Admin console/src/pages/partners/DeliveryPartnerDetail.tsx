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
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Map
} from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/tables/DataTable';

interface DeliveryPartner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  vehicleType: string;
  vehicleNumber: string;
  isActive?: boolean;
  address?: any;
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
    lastPayout?: {
      amount: number;
      date: string;
    };
  };
  documents?: {
    license: {
      number: string;
      expiryDate: string;
      verified: boolean;
    };
    insurance: {
      policyNumber: string;
      expiryDate: string;
      verified: boolean;
    };
    idProof: {
      type: string;
      number: string;
      verified: boolean;
    };
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    verified: boolean;
  };
  activityLog?: Array<{
    action: string;
    timestamp: string;
    details: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  timestamp: string;
  vendorId: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    address: any;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  locations?: {
    user: {
      latitude: number;
      longitude: number;
      address: string;
      timestamp: string;
    };
    vendor: {
      latitude: number;
      longitude: number;
      address: string;
      timestamp: string;
    };
    deliveryBoy: {
      latitude: number;
      longitude: number;
      address: string;
      timestamp: string;
    };
  };
  selectedDeliveryPoint?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  totalRatings: number;
  address: any;
  location: {
    coordinates: [number, number];
  };
}

const DeliveryPartnerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'vendors' | 'activity'>('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState({
    status: '',
    dateRange: '',
    amountRange: ''
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailModal, setOrderDetailModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartnerDetails();
      fetchPartnerOrders();
      fetchPartnerVendors();
      fetchActivityLog();
    }
  }, [id]);

  const fetchPartnerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching partner details for ID:', id);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const url = `https://trafficfrnd-2.onrender.com/api/delivery/${id}`;
      console.log('Request URL:', url);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Partner data received:', data);
      setPartner(data);
    } catch (err: any) {
      console.error('Error fetching partner details:', err);
      setError(err.message || 'Failed to fetch partner details');
    }
  };

  const fetchPartnerOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://trafficfrnd-2.onrender.com/api/delivery/${id}/orders`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to fetch partner orders');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://trafficfrnd-2.onrender.com/api/delivery/${id}/vendors`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to fetch partner vendors');
      const data = await res.json();
      setVendors(data);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://trafficfrnd-2.onrender.com/api/delivery/${id}/activity`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to fetch activity log');
      const data = await res.json();
      setActivityLog(data);
    } catch (err: any) {
      console.error('Error fetching activity log:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (orderSearch && !order.customerName.toLowerCase().includes(orderSearch.toLowerCase())) return false;
    if (orderFilter.status && order.status !== orderFilter.status) return false;
    return true;
  });

  const orderColumns = [
    { key: 'id', header: 'Order ID', sortable: true },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'vendorId.businessName', header: 'Vendor', sortable: true },
    { key: 'totalAmount', header: 'Amount', render: (v: number) => `$${v.toFixed(2)}`, sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'timestamp', header: 'Date', render: (v: string) => new Date(v).toLocaleString(), sortable: true },
    { key: 'deliveryAddress', header: 'Delivery Address', sortable: true },
  ];

  const vendorColumns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'businessName', header: 'Business Name', sortable: true },
    { key: 'ownerName', header: 'Owner', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'rating', header: 'Rating', render: (v: number) => `${v}/5`, sortable: true },
    { key: 'status', header: 'Status', sortable: true },
  ];

  const activityColumns = [
    { key: 'action', header: 'Action', sortable: true },
    { key: 'timestamp', header: 'Timestamp', render: (v: string) => new Date(v).toLocaleString(), sortable: true },
    { key: 'details', header: 'Details', render: (v: any) => {
      if (typeof v === 'object' && v !== null) {
        return Object.entries(v).map(([key, value]) => `${key}: ${value}`).join(', ');
      }
      return v || 'No details';
    }, sortable: false },
  ];

  const orderRowActions = (row: Order) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
        onClick={() => {
          setSelectedOrder(row);
          setOrderDetailModal(true);
        }}
      >
        View Details
      </Button>
    </div>
  );

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading partner details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!partner) {
    return <div className="text-center py-10 text-gray-500">Partner not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={`${partner.fullName} - Delivery Partner`}
        description="Detailed view of delivery partner information, orders, and activity"
        backLink="/partners/delivery"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => {/* Export functionality */}}
          >
            Export Data
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Partner Overview Card */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-semibold">{partner.vehicleType} - {partner.vehicleNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="font-semibold">{partner.totalDeliveries || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-semibold">{partner.rating || 0}/5</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="font-semibold">${partner.earnings?.total || 0}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{partner.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{partner.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {partner.address ? 
                    `${partner.address.street || ''}, ${partner.address.city || ''}, ${partner.address.state || ''}` :
                    'No address provided'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  partner.status === 'active' ? 'bg-green-100 text-green-800' :
                  partner.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {partner.status}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{partner.onTimeRate || 0}%</p>
              <p className="text-sm text-gray-600">On-Time Rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{partner.acceptanceRate || 0}%</p>
              <p className="text-sm text-gray-600">Acceptance Rate</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{partner.cancellationRate || 0}%</p>
              <p className="text-sm text-gray-600">Cancellation Rate</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'vendors', label: 'Vendors', icon: Users },
                { id: 'activity', label: 'Activity', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Vendors Worked</p>
                        <p className="text-2xl font-bold text-green-600">{vendors.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completed Orders</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {orders.filter(o => o.status === 'completed').length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
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
                  <div>
                    <h4 className="text-md font-semibold mb-3">Current Location</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Coordinates</p>
                      <p className="font-medium">
                        {partner.currentLocation.coordinates[1].toFixed(6)}, {partner.currentLocation.coordinates[0].toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(partner.currentLocation.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Activity Summary */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {activityLog.slice(0, 5).map((activity, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-gray-600">
                              {typeof activity.details === 'object' && activity.details !== null
                                ? Object.entries(activity.details).map(([key, value]) => `${key}: ${value}`).join(', ')
                                : activity.details || 'No details'
                              }
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {activityLog.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={orderFilter.status}
                      onChange={(e) => setOrderFilter(f => ({ ...f, status: e.target.value }))}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filteredOrders.length} orders found
                  </div>
                </div>
                
                <DataTable
                  data={filteredOrders}
                  columns={orderColumns}
                  rowActions={orderRowActions}
                  searchable={false}
                  pagination={{
                    itemsPerPage: 10,
                    totalItems: filteredOrders.length,
                    currentPage: 1,
                    onPageChange: () => {}
                  }}
                />
              </div>
            )}

            {activeTab === 'vendors' && (
              <div>
                <DataTable
                  data={vendors}
                  columns={vendorColumns}
                  searchable={true}
                  pagination={{
                    itemsPerPage: 10,
                    totalItems: vendors.length,
                    currentPage: 1,
                    onPageChange: () => {}
                  }}
                />
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
                  <p className="text-sm text-gray-600">Recent activities and actions performed by this delivery partner</p>
                </div>
                <DataTable
                  data={activityLog}
                  columns={activityColumns}
                  searchable={true}
                  pagination={{
                    itemsPerPage: 10,
                    totalItems: activityLog.length,
                    currentPage: 1,
                    onPageChange: () => {}
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Order Detail Modal */}
      {orderDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-4xl max-h-full overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={() => setOrderDetailModal(false)}
            >
              &times;
            </button>
            
            <h2 className="text-xl font-bold mb-4">Order Details - {selectedOrder.id}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(selectedOrder.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Delivery Address:</span>
                    <span className="text-right">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Vendor Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Business Name:</span>
                    <span>{selectedOrder.vendorId.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Owner:</span>
                    <span>{selectedOrder.vendorId.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{selectedOrder.vendorId.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder.selectedDeliveryPoint && (
              <div className="mt-4">
                <h3 className="font-bold text-base text-gray-800 mb-1">Selected Delivery Point</h3>
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-blue-700">{selectedOrder.selectedDeliveryPoint.name}</span>
                  <span className="text-xs text-gray-500">{selectedOrder.selectedDeliveryPoint.address}</span>
                  <span className="text-xs text-gray-500">[lat: {selectedOrder.selectedDeliveryPoint.latitude}, lng: {selectedOrder.selectedDeliveryPoint.longitude}]</span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Order Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-center">Quantity</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.locations && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Location Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedOrder.locations.user && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Customer Location</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.locations.user.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedOrder.locations.user.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedOrder.locations.vendor && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Vendor Location</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.locations.vendor.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedOrder.locations.vendor.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedOrder.locations.deliveryBoy && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Delivery Partner Location</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.locations.deliveryBoy.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedOrder.locations.deliveryBoy.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnerDetail; 