import React, { useState, useEffect, useCallback } from 'react';
import { Package, FileDown, Filter, Edit, Trash, User, Building2, Truck, Eye, Share2, CheckCircle, Clock, XCircle, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { io, Socket } from 'socket.io-client';

import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import DataTable from '../components/tables/DataTable';

interface Order {
  _id: string;
  vendorId?: { _id: string; businessName: string } | string;
  deliveryBoyId?: { _id: string; fullName: string } | string;
  routeId?: { _id: string; name: string } | string;
  customerName: string;
  items: any[];
  totalAmount: number;
  deliveryFee?: number;
  feeBreakdown?: any;
  status: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  vehicleNumber?: string;
  timestamp?: string;
  updatedAt?: string;
  locations?: {
    user?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      timestamp?: string;
    };
    vendor?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      timestamp?: string;
    };
    deliveryBoy?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      timestamp?: string;
    };
  };
}

interface RouteDetails {
  destination?: { latitude: number; longitude: number; address: string };
  checkpoints?: { _id: string; name: string; type: string; location: { latitude: number; longitude: number; address: string }; description?: string }[];
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [form, setForm] = useState<Partial<Order>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    deliveryBoy: '',
    createdAt: '',
    searchTerm: '',
  });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/vendors/orders/admin`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    // Realtime updates via Socket.IO
    let socket: Socket | null = null;
    try {
      const token = localStorage.getItem('token') || '';
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        auth: { token, role: 'admin' },
      });
      socket.on('connect', () => {
        console.log('[Admin] Socket connected:', socket && socket.id);
      });
      socket.on('adminOrderCreated', (order: Order) => {
        setOrders(prev => {
          if (prev.some(o => o._id === order._id)) return prev;
          return [order, ...prev];
        });
        toast.info(`New order created: ${order.customerName}`, { autoClose: 3000 });
      });
      socket.on('adminOrderStatusUpdated', ({ orderId, status }: { orderId: string; status: string }) => {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } as any : o));
        toast.success(`Order ${String(orderId).slice(-6)} status: ${status}`);
      });
      socket.on('disconnect', () => {
        console.log('[Admin] Socket disconnected');
      });
    } catch (e) {
      console.warn('Admin socket setup failed:', e);
    }
    return () => {
      if (socket) {
        socket.off('adminOrderCreated');
        socket.off('adminOrderStatusUpdated');
        socket.disconnect();
      }
    };
  }, []);

  // Filtering logic
  const filteredOrders = orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.vendor && typeof order.vendorId === 'object' && order.vendorId && 'businessName' in order.vendorId && order.vendorId.businessName !== filters.vendor) return false;
    if (filters.deliveryBoy && typeof order.deliveryBoyId === 'object' && order.deliveryBoyId && 'fullName' in order.deliveryBoyId && order.deliveryBoyId.fullName !== filters.deliveryBoy) return false;
    if (filters.createdAt && order.timestamp) {
      if (!order.timestamp.startsWith(filters.createdAt)) return false;
    }
    if (filters.searchTerm && !order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [];
    const headers = columns.map(col => col.header).join(',');
    csvRows.push(headers);
    filteredOrders.forEach(order => {
      const row = columns.map(col => {
        let value = (order as any)[col.key];
        if (col.key === 'vendorId' && typeof order.vendorId === 'object' && order.vendorId && 'businessName' in order.vendorId) value = order.vendorId.businessName;
        if (col.key === 'deliveryBoyId' && typeof order.deliveryBoyId === 'object' && order.deliveryBoyId && 'fullName' in order.deliveryBoyId) value = order.deliveryBoyId.fullName;
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        if (typeof value === 'string') value = '"' + value.replace(/"/g, '""') + '"';
        return value ?? '';
      }).join(',');
      csvRows.push(row);
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredOrders.map(order => {
      const row: any = {};
      columns.forEach(col => {
        let value = (order as any)[col.key];
        if (col.key === 'vendorId' && typeof order.vendorId === 'object' && order.vendorId && 'businessName' in order.vendorId) value = order.vendorId.businessName;
        if (col.key === 'deliveryBoyId' && typeof order.deliveryBoyId === 'object' && order.deliveryBoyId && 'fullName' in order.deliveryBoyId) value = order.deliveryBoyId.fullName;
        row[col.header] = value ?? '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  // Delete order
  const handleDelete = async (order: Order) => {
    if (!window.confirm(`Are you sure you want to delete order ${order._id}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/vendors/orders/admin/${order._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to delete order');
      setOrders(orders => orders.filter(o => o._id !== order._id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open edit modal
  const openEdit = (order: Order) => {
    setForm({ ...order });
    setEditModal({ open: true, order });
    setFormError('');
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save edit (status only)
  const handleEditSave = async () => {
    if (!form._id) {
      setFormError('Order ID is missing');
      return;
    }
    
    if (!form.status) {
      setFormError('Please select a status');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/vendors/orders/admin/${form._id}/status`;
      
      console.log('Updating order status:', {
        orderId: form._id,
        newStatus: form.status,
        apiUrl: apiUrl
      });
      
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': token ? `Bearer ${token}` : '' 
        },
        body: JSON.stringify({ status: form.status })
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to update order status`);
      }
      
      const updated = await res.json();
      console.log('Order updated successfully:', updated);
      
      setOrders(orders => orders.map(o => o._id === form._id ? { ...o, ...updated } : o));
      setEditModal({ open: false, order: null });
      
      // Show success message
      toast.success(`Order status updated to ${form.status}`);
      
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setFormError(err.message || 'Failed to update order status. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDetails = (order: Order) => {
    setDetailsModal({ open: true, order });
    setRouteDetails(null);
    if (order.routeId && typeof order.routeId === 'object') {
      fetchRouteDetails(order);
    }
  };

  // Modern columns for Orders table
  const columns = [
    { key: '_id', header: 'Order ID', sortable: true, render: (v: string) => <span className="font-mono text-xs text-gray-500">{v.slice(-8)}</span> },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (v: string) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-900">{v}</span>
        </div>
      )
    },
    {
      key: 'vendorId',
      header: 'Vendor',
      sortable: true,
      render: (v: any) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{typeof v === 'object' && v && 'businessName' in v ? v.businessName : '-'}</span>
        </div>
      )
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      sortable: true,
      render: (_: any, row: Order) => {
        const subtotal = Array.isArray(row.items)
          ? row.items.reduce((sum, it) => sum + Number(it?.price || 0) * Number(it?.quantity || 0), 0)
          : 0;
        return <span className="text-gray-800">₹{subtotal}</span>;
      }
    },
    {
      key: 'deliveryBoyId',
      header: 'Delivery Partner',
      sortable: true,
      render: (v: any) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-purple-500" />
          <span className="font-medium">{typeof v === 'object' && v && 'fullName' in v ? v.fullName : '-'}</span>
        </div>
      )
    },
    {
      key: 'deliveryFee',
      header: 'Delivery Fee',
      sortable: true,
      render: (_: any, row: Order) => (
        <span className="text-gray-800">₹{Number(row.deliveryFee || 0)}</span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      render: (_: any, row: Order) => {
        const subtotal = Array.isArray(row.items)
          ? row.items.reduce((sum, it) => sum + Number(it?.price || 0) * Number(it?.quantity || 0), 0)
          : 0;
        const fee = Number(row.deliveryFee || 0);
        const total = Math.max(0, subtotal + fee);
        return <span className="font-bold text-green-600">₹{total}</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v: string) => {
        const statusConfig = {
          completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
          pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
          cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' },
          confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Confirmed' },
          preparing: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Preparing' },
          ready: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Ready' }
        };
        const config = statusConfig[v as keyof typeof statusConfig] || { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: v };
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'timestamp',
      header: 'Date',
      sortable: true,
      render: (v: string) => v ? (
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{new Date(v).toLocaleString()}</span>
        </div>
      ) : 'N/A'
    }
  ];

  // Modern row actions (keep logic unchanged)
  const rowActions = (row: Order) => (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
        onClick={() => openDetails(row)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Edit size={14} />}
        onClick={() => openEdit(row)}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Trash size={14} />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => handleDelete(row)}
      >
        Delete
      </Button>
    </div>
  );

  // Helper function to copy Google Maps link
  const copyLocationLink = (lat: number, lng: number, label?: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    navigator.clipboard.writeText(url);
    toast.success(`Location link copied to clipboard!`);
  };

  // Calculate map center based on available locations
  const getMapCenter = () => {
    const locations = [];
    
    if (detailsModal.order?.locations?.user?.latitude && detailsModal.order?.locations?.user?.longitude) {
      locations.push([detailsModal.order.locations.user.latitude, detailsModal.order.locations.user.longitude]);
    }
    
    if (detailsModal.order?.locations?.vendor?.latitude && detailsModal.order?.locations?.vendor?.longitude) {
      locations.push([detailsModal.order.locations.vendor.latitude, detailsModal.order.locations.vendor.longitude]);
    }
    
    if (detailsModal.order?.locations?.deliveryBoy?.latitude && detailsModal.order?.locations?.deliveryBoy?.longitude) {
      locations.push([detailsModal.order.locations.deliveryBoy.latitude, detailsModal.order.locations.deliveryBoy.longitude]);
    }
    
    if (locations.length === 0) {
      return [13.138755, 78.216145]; // Default to Kolar area
    }
    
    if (locations.length === 1) {
      return locations[0];
    }
    
    // Calculate center point
    const avgLat = locations.reduce((sum, loc) => sum + loc[0], 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc[1], 0) / locations.length;
    
    return [avgLat, avgLng];
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Order Management"
        description="Manage and monitor all orders with analytics and tools"
        actions={
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="md"
              icon={<FileDown size={16} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Filter size={16} />}
              onClick={() => setFilterModal(true)}
            >
              Filters
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search orders by customer, status, or vendor..."
                value={filters.searchTerm || ''}
                onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{filteredOrders.length}</span>
                <span>orders found</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filter Modal */}
      {filterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={() => setFilterModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Advanced Filters</h2>
            <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); setFilterModal(false); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={filters.vendor}
                  onChange={e => setFilters(f => ({ ...f, vendor: e.target.value }))}
                  placeholder="Vendor Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Partner</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={filters.deliveryBoy}
                  onChange={e => setFilters(f => ({ ...f, deliveryBoy: e.target.value }))}
                  placeholder="Delivery Partner Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={filters.createdAt}
                  onChange={e => setFilters(f => ({ ...f, createdAt: e.target.value }))}
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="w-full">Apply Filters</Button>
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ status: '', vendor: '', deliveryBoy: '', createdAt: '', searchTerm: '' })}>Clear Filters</Button>
            </form>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              title=""
              subtitle=""
              data={filteredOrders}
              columns={columns}
              rowActions={rowActions}
              searchable={false}
              filterable={false}
              pagination={{
                itemsPerPage: 10,
                totalItems: filteredOrders.length,
                currentPage: currentPage,
                onPageChange: setCurrentPage
              }}
            />
          </div>
        )}
        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-xl shadow-lg p-6 relative max-w-md w-full mx-4">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setEditModal({ open: false, order: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Edit Order Status</h2>
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID
                  </label>
                  <div className="text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded border">
                    {form._id}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {form.customerName}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    New Status *
                  </label>
                  <select 
                    id="status"
                    name="status" 
                    value={form.status || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select a status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-600 text-sm font-medium">Error</div>
                    <div className="text-red-500 text-sm">{formError}</div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="md" 
                    onClick={() => setEditModal({ open: false, order: null })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="md" 
                    isLoading={formLoading} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {formLoading ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Order Details Modal */}
        {detailsModal.open && detailsModal.order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setDetailsModal({ open: false, order: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">Order ID:</span> <span className="font-mono">{detailsModal.order._id}</span></div>
                <div><span className="font-semibold">Customer:</span> {detailsModal.order.customerName}</div>
                <div><span className="font-semibold">Vendor:</span> {typeof detailsModal.order.vendorId === 'object' && detailsModal.order.vendorId && 'businessName' in detailsModal.order.vendorId ? detailsModal.order.vendorId.businessName : ''}</div>
                <div><span className="font-semibold">Delivery Partner:</span> {typeof detailsModal.order.deliveryBoyId === 'object' && detailsModal.order.deliveryBoyId && 'fullName' in detailsModal.order.deliveryBoyId ? detailsModal.order.deliveryBoyId.fullName : ''}</div>
                <div><span className="font-semibold">Status:</span> {detailsModal.order.status}</div>
                <div><span className="font-semibold">Subtotal (Items):</span> ₹{Math.max(0, (detailsModal.order.totalAmount || 0) - (Number(detailsModal.order.deliveryFee || 0)) )}</div>
                <div><span className="font-semibold">Delivery Fee:</span> ₹{Number(detailsModal.order.deliveryFee || 0)}</div>
                <div><span className="font-semibold">Total:</span> <span className="font-bold text-green-700">₹{detailsModal.order.totalAmount}</span></div>
                <div><span className="font-semibold">Delivery Address (at time of booking):</span> <span className="font-bold text-blue-700">{detailsModal.order.deliveryAddress || '-'}</span></div>
                <div><span className="font-semibold">Special Instructions:</span> {detailsModal.order.specialInstructions || '-'}</div>
                <div><span className="font-semibold">Vehicle Number:</span> {detailsModal.order.vehicleNumber || '-'}</div>
                <div><span className="font-semibold">Route:</span> {typeof detailsModal.order.routeId === 'object' && detailsModal.order.routeId && 'name' in detailsModal.order.routeId ? detailsModal.order.routeId.name : ''}</div>
                <div><span className="font-semibold">Created At:</span> {detailsModal.order.timestamp ? new Date(detailsModal.order.timestamp).toLocaleString() : '-'}</div>
                <div><span className="font-semibold">Updated At:</span> {detailsModal.order.updatedAt ? new Date(detailsModal.order.updatedAt).toLocaleString() : '-'}</div>
                <div>
                  <span className="font-semibold">Items:</span>
                  <ul className="ml-4 mt-1 list-disc">
                    {detailsModal.order.items && detailsModal.order.items.length > 0 ? (
                      detailsModal.order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x{item.quantity} @ ₹{item.price} = ₹{item.price * item.quantity}
                        </li>
                      ))
                    ) : (
                      <li>No items</li>
                    )}
                  </ul>
                </div>
                
                {/* Selected Delivery Point Section */}
                {detailsModal.order.selectedDeliveryPoint && (
                  <div className="mt-4">
                    <h3 className="font-bold text-base text-gray-800 mb-1">Selected Delivery Point</h3>
                    <div className="flex flex-col space-y-1">
                      <span className="font-semibold text-blue-700">{detailsModal.order.selectedDeliveryPoint.name}</span>
                      <span className="text-xs text-gray-500">{detailsModal.order.selectedDeliveryPoint.address}</span>
                      <span className="text-xs text-gray-500">[lat: {detailsModal.order.selectedDeliveryPoint.latitude}, lng: {detailsModal.order.selectedDeliveryPoint.longitude}]</span>
                    </div>
                  </div>
                )}

                {/* Route destination and checkpoints */}
                {routeLoading ? (
                  <div className="text-blue-600">Loading route details...</div>
                ) : routeDetails && routeDetails.destination && (
                  <div className="mt-4">
                    <h3 className="font-bold text-base text-gray-800 mb-1">Route Map</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      <MapContainer
                        center={[routeDetails.destination.latitude, routeDetails.destination.longitude]}
                        zoom={13}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[routeDetails.destination.latitude, routeDetails.destination.longitude]}
                          icon={L.icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                            iconSize: [30, 40],
                            iconAnchor: [15, 40],
                            popupAnchor: [1, -34],
                            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                            shadowSize: [41, 41]
                          })}
                        >
                          <Popup>
                            <div>
                              <div className="font-semibold">Final Destination</div>
                              <div>{routeDetails.destination.address}</div>
                              <button
                                className="mt-2 flex items-center text-green-700 hover:text-green-900 text-xs"
                                onClick={() => copyLocationLink(routeDetails.destination.latitude, routeDetails.destination.longitude, 'Destination')}
                              >
                                <Share2 size={14} className="mr-1" /> Share
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base text-gray-800 mb-1">Final Destination</h3>
                      <div className="flex items-center">
                        <div className="font-semibold text-green-700">{routeDetails.destination.address || '-'}</div>
                        <button
                          className="ml-2 flex items-center text-green-700 hover:text-green-900 text-xs"
                          onClick={() => copyLocationLink(routeDetails.destination.latitude, routeDetails.destination.longitude, 'Destination')}
                        >
                          <Share2 size={14} className="mr-1" /> Share
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">[lat: {routeDetails.destination.latitude}, lng: {routeDetails.destination.longitude}]</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Orders; 