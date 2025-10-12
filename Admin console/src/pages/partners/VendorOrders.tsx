import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Eye, Clock, TrendingUp, Share2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';

interface Order {
  _id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  timestamp: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress?: string;
  specialInstructions?: string;
  vehicleNumber?: string;
  vendorId?: {
    _id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    address?: any;
  };
  deliveryBoyId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    currentLocation?: {
      coordinates: [number, number];
      lastUpdated: string;
    };
  };
  routeId?: {
    _id: string;
    startLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
    destination: {
      latitude: number;
      longitude: number;
      address: string;
    };
    checkpoints: Array<{
      _id: string;
      location: {
        latitude: number;
        longitude: number;
        address: string;
      };
      type: string;
      name: string;
      description?: string;
    }>;
    distance?: number;
    duration?: number;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
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
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
}

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'user-marker',
});
const vendorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'vendor-marker',
});
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'delivery-marker',
});
const checkpointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'checkpoint-marker',
});

const copyLocationLink = (lat: number, lng: number, label?: string) => {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  navigator.clipboard.writeText(url);
  toast.success(`${label || 'Location'} link copied to clipboard!`);
};

const VendorOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendorId');
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (vendorId) {
      fetchVendorOrders();
      fetchVendorDetails();
    }
  }, [vendorId]);

  const fetchVendorOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://trafficfrnd-2.onrender.com/api/vendors/orders/admin?vendorId=${vendorId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://trafficfrnd-2.onrender.com/api/vendors/${vendorId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendor(data);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://trafficfrnd-2.onrender.com/api/vendors/orders/admin/${orderId}/details`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
      } else {
        console.error('Error fetching order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(order.timestamp).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/partners/vendors')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {vendor?.businessName || 'Vendor'} Orders
              </h1>
              <p className="text-gray-600 mt-2">
                {orders.length} orders • ₹{totalRevenue.toFixed(2)} total revenue
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders by ID, customer, status, or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {order._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.name} - ₹{item.price}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => fetchOrderDetails(order._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Order Details</h2>
                  <p className="text-blue-100">Order ID: {selectedOrder._id}</p>
                </div>
                <button
                  className="text-white hover:text-blue-200 text-2xl"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Order ID:</span>
                        <span className="font-mono">{selectedOrder._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Customer:</span>
                        <span>{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600">₹{selectedOrder.totalAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{new Date(selectedOrder.timestamp).toLocaleString()}</span>
                      </div>
                      {selectedOrder.vehicleNumber && (
                        <div className="flex justify-between">
                          <span className="font-medium">Vehicle Number:</span>
                          <span>{selectedOrder.vehicleNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vendor Information */}
                  {selectedOrder.vendorId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Vendor Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Business:</span>
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
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedOrder.vendorId.email}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Boy Information */}
                  {selectedOrder.deliveryBoyId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Delivery Boy Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Name:</span>
                          <span>{selectedOrder.deliveryBoyId.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span>{selectedOrder.deliveryBoyId.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Vehicle:</span>
                          <span>{selectedOrder.deliveryBoyId.vehicleType} - {selectedOrder.deliveryBoyId.vehicleNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedOrder.deliveryBoyId.email}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Route Information */}
                  {selectedOrder.routeId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Route Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Start Location:</span>
                          <p className="text-sm text-gray-600 mt-1">{selectedOrder.routeId.startLocation.address}</p>
                        </div>
                        <div>
                          <span className="font-medium">Destination:</span>
                          <p className="text-sm text-gray-600 mt-1">{selectedOrder.routeId.destination.address}</p>
                        </div>
                        {selectedOrder.routeId.distance && (
                          <div className="flex justify-between">
                            <span className="font-medium">Distance:</span>
                            <span>{(selectedOrder.routeId.distance / 1000).toFixed(2)} km</span>
                          </div>
                        )}
                        {selectedOrder.routeId.duration && (
                          <div className="flex justify-between">
                            <span className="font-medium">Duration:</span>
                            <span>{Math.round(selectedOrder.routeId.duration / 60)} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items and Location Data */}
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Order Items ({selectedOrder.items.length})</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-white rounded p-3 border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">₹{item.price}</div>
                              <div className="text-sm text-gray-600">Total: ₹{item.price * item.quantity}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-green-600">₹{selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Data */}
                  {selectedOrder.locations && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Location Data (at order time)</h3>
                      <div className="space-y-3">
                        {/* User Location */}
                        {selectedOrder.locations.user && (
                          <div className="bg-white rounded p-3 border">
                            <h4 className="font-semibold text-blue-600 mb-2">👤 User Location</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Address:</span> {selectedOrder.locations.user.address}</div>
                              <div><span className="font-medium">Coordinates:</span> {selectedOrder.locations.user.latitude}, {selectedOrder.locations.user.longitude}</div>
                              <div><span className="font-medium">Time:</span> {new Date(selectedOrder.locations.user.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {/* Vendor Location */}
                        {selectedOrder.locations.vendor && (
                          <div className="bg-white rounded p-3 border">
                            <h4 className="font-semibold text-green-600 mb-2">🏪 Vendor Location</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Address:</span> {selectedOrder.locations.vendor.address}</div>
                              <div><span className="font-medium">Coordinates:</span> {selectedOrder.locations.vendor.latitude}, {selectedOrder.locations.vendor.longitude}</div>
                              <div><span className="font-medium">Time:</span> {new Date(selectedOrder.locations.vendor.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {/* Delivery Boy Location */}
                        {selectedOrder.locations.deliveryBoy && (
                          <div className="bg-white rounded p-3 border">
                            <h4 className="font-semibold text-purple-600 mb-2">🚚 Delivery Boy Location</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Address:</span> {selectedOrder.locations.deliveryBoy.address}</div>
                              <div><span className="font-medium">Coordinates:</span> {selectedOrder.locations.deliveryBoy.latitude}, {selectedOrder.locations.deliveryBoy.longitude}</div>
                              <div><span className="font-medium">Time:</span> {new Date(selectedOrder.locations.deliveryBoy.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {/* Current Delivery Boy Location */}
                        {selectedOrder.deliveryBoyId && selectedOrder.deliveryBoyId.currentLocation && (
                          <div className="bg-white rounded p-3 border">
                            <h4 className="font-semibold text-orange-600 mb-2">📍 Current Delivery Boy Location</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Coordinates:</span> {selectedOrder.deliveryBoyId.currentLocation.coordinates[1]}, {selectedOrder.deliveryBoyId.currentLocation.coordinates[0]}</div>
                              <div><span className="font-medium">Last Updated:</span> {new Date(selectedOrder.deliveryBoyId.currentLocation.lastUpdated).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Information */}
                  {(selectedOrder.deliveryAddress || selectedOrder.specialInstructions) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
                      <div className="space-y-2">
                        {selectedOrder.deliveryAddress && (
                          <div>
                            <span className="font-medium">Address:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedOrder.deliveryAddress}</p>
                          </div>
                        )}
                        {selectedOrder.specialInstructions && (
                          <div>
                            <span className="font-medium">Special Instructions:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedOrder.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Delivery Point */}
                  {selectedOrder.selectedDeliveryPoint && (
                    <div className="mt-4">
                      <h3 className="font-bold text-base text-gray-800 mb-1">Selected Delivery Point (User Chosen)</h3>
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-blue-700">{selectedOrder.selectedDeliveryPoint.name}</span>
                        <span className="text-xs text-gray-500">{selectedOrder.selectedDeliveryPoint.address}</span>
                        <span className="text-xs text-gray-500">[lat: {selectedOrder.selectedDeliveryPoint.latitude}, lng: {selectedOrder.selectedDeliveryPoint.longitude}]
                          {selectedOrder.selectedDeliveryPoint.latitude && selectedOrder.selectedDeliveryPoint.longitude && (
                            <button
                              className="ml-2 text-blue-700 hover:text-blue-900 text-xs inline-flex items-center"
                              onClick={() => copyLocationLink(selectedOrder.selectedDeliveryPoint.latitude, selectedOrder.selectedDeliveryPoint.longitude, 'Selected Delivery Point')}
                            >
                              <Share2 size={14} className="mr-1" /> Share
                            </button>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Destination */}
              <div className="mt-4">
                <h3 className="font-bold text-base text-gray-800 mb-1">Destination (User Entered)</h3>
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-green-700">{selectedOrder.routeId?.destination?.address || '-'}</span>
                  <span className="text-xs text-gray-500">[lat: {selectedOrder.routeId?.destination?.latitude}, lng: {selectedOrder.routeId?.destination?.longitude}]
                    {selectedOrder.routeId?.destination?.latitude && selectedOrder.routeId?.destination?.longitude && (
                      <button
                        className="ml-2 text-green-700 hover:text-green-900 text-xs inline-flex items-center"
                        onClick={() => copyLocationLink(selectedOrder.routeId.destination.latitude, selectedOrder.routeId.destination.longitude, 'Destination')}
                      >
                        <Share2 size={14} className="mr-1" /> Share
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders; 