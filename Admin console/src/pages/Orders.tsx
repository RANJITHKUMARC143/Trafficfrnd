import React, { useState, useEffect, useCallback } from 'react';
import { Package, FileDown, Filter, Edit, Trash, User, Building2, Truck, Eye, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';

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
  status: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  vehicleNumber?: string;
  timestamp?: string;
  updatedAt?: string;
}

interface RouteDetails {
  destination?: { latitude: number; longitude: number; address: string };
  checkpoints?: { _id: string; name: string; type: string; location: { latitude: number; longitude: number; address: string }; description?: string }[];
}

interface SelectedCheckpoint {
  checkpoint: string;
  status: string;
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
  });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<SelectedCheckpoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors/orders/admin`, {
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
  }, []);

  // Filtering logic
  const filteredOrders = orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.vendor && typeof order.vendorId === 'object' && order.vendorId && 'businessName' in order.vendorId && order.vendorId.businessName !== filters.vendor) return false;
    if (filters.deliveryBoy && typeof order.deliveryBoyId === 'object' && order.deliveryBoyId && 'fullName' in order.deliveryBoyId && order.deliveryBoyId.fullName !== filters.deliveryBoy) return false;
    if (filters.createdAt && order.timestamp) {
      if (!order.timestamp.startsWith(filters.createdAt)) return false;
    }
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors/orders/admin/${order._id}`, {
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
    if (!form._id) return;
    setFormLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors/orders/admin/${form._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status: form.status })
      });
      if (!res.ok) throw new Error('Failed to update order');
      const updated = await res.json();
      setOrders(orders => orders.map(o => o._id === form._id ? { ...o, ...updated } : o));
      setEditModal({ open: false, order: null });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const fetchRouteDetails = useCallback(async (order: Order) => {
    if (!order.routeId || typeof order.routeId === 'string') return;
    setRouteLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch route details
      const routeRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/routes/${order.routeId._id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const routeData = await routeRes.json();
      setRouteDetails({
        destination: routeData.destination,
        checkpoints: routeData.checkpoints
      });
      // Fetch selected checkpoints for this route and user (if deliveryBoyId exists)
      if (order.deliveryBoyId && typeof order.deliveryBoyId === 'object') {
        const scRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/checkpoints/selected?route=${order.routeId._id}&user=${order.deliveryBoyId._id}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const scData = await scRes.json();
        setSelectedCheckpoints(scData);
      } else {
        setSelectedCheckpoints([]);
      }
    } catch (err) {
      setRouteDetails(null);
      setSelectedCheckpoints([]);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const openDetails = (order: Order) => {
    setDetailsModal({ open: true, order });
    setRouteDetails(null);
    setSelectedCheckpoints([]);
    if (order.routeId && typeof order.routeId === 'object') {
      fetchRouteDetails(order);
    }
  };

  const columns = [
    { key: '_id', header: 'Order ID', sortable: true, render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'vendorId', header: 'Vendor', sortable: true, render: (v: any) => v && v.businessName ? v.businessName : '' },
    { key: 'deliveryBoyId', header: 'Delivery Partner', sortable: true, render: (v: any) => v && v.fullName ? v.fullName : '' },
    { key: 'totalAmount', header: 'Total Amount', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'timestamp', header: 'Created At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
    { key: 'updatedAt', header: 'Updated At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
  ];

  const rowActions = (row: Order) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
        onClick={() => openDetails(row)}
      >
        View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Edit size={14} />}
        onClick={() => openEdit(row)}
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
    toast.success(`${label ? label + ' ' : ''}Location link copied!`);
  };

  return (
    <div>
      <PageHeader
        title="Order Management"
        description="View and manage all orders in the system"
        backLink="/dashboard"
        actions={
          <>
            <div className="relative inline-block text-left mr-2">
              <Button
                variant="secondary"
                size="md"
                icon={<FileDown size={16} />}
                onClick={e => {
                  const menu = document.getElementById('export-menu');
                  if (menu) menu.classList.toggle('hidden');
                }}
              >
                Export
              </Button>
              <div id="export-menu" className="hidden absolute z-10 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { handleExportCSV(); document.getElementById('export-menu')?.classList.add('hidden'); }}>Export to CSV</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { handleExportExcel(); document.getElementById('export-menu')?.classList.add('hidden'); }}>Export to Excel</button>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter size={14} />}
              onClick={() => setFilterModal(true)}
            >
              Advanced Filters
            </Button>
          </>
        }
      />
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
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ status: '', vendor: '', deliveryBoy: '', createdAt: '' })}>Clear Filters</Button>
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
          <div className="text-center py-10 text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : (
          <DataTable
            title="All Orders"
            subtitle="Showing all orders in the system"
            data={filteredOrders}
            columns={columns}
            rowActions={rowActions}
            searchable={true}
            filterable={true}
            pagination={{
              itemsPerPage: 10,
              totalItems: filteredOrders.length,
              currentPage: currentPage,
              onPageChange: setCurrentPage
            }}
          />
        )}
        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setEditModal({ open: false, order: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Edit Order Status</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <select name="status" value={form.status || ''} onChange={handleFormChange} className="w-full border rounded p-2">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                <Button type="submit" variant="primary" size="md" isLoading={formLoading} className="w-full">Save</Button>
              </form>
            </div>
          </div>
        )}
        {/* Order Details Modal */}
        {detailsModal.open && detailsModal.order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-lg w-full max-h-full overflow-y-auto">
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
                <div><span className="font-semibold">Total Amount:</span> ₹{detailsModal.order.totalAmount}</div>
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
                {/* Route destination and checkpoints */}
                {routeLoading ? (
                  <div className="text-blue-600">Loading route details...</div>
                ) : routeDetails && (
                  <>
                    {/* Map Section */}
                    <div className="mt-4">
                      <h3 className="font-bold text-base text-gray-800 mb-1">Route Map</h3>
                      <div style={{ height: '300px', width: '100%' }}>
                        <MapContainer
                          center={routeDetails.destination ? [routeDetails.destination.latitude, routeDetails.destination.longitude] : (routeDetails.checkpoints && routeDetails.checkpoints.length > 0 ? [routeDetails.checkpoints[0].location.latitude, routeDetails.checkpoints[0].location.longitude] : [0,0])}
                          zoom={13}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {/* Checkpoint markers */}
                          {routeDetails.checkpoints && routeDetails.checkpoints.map((cp, idx) => (
                            <Marker
                              key={cp._id}
                              position={[cp.location.latitude, cp.location.longitude]}
                              icon={L.icon({
                                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                                shadowSize: [41, 41]
                              })}
                            >
                              <Popup>
                                <div>
                                  <div className="font-semibold">Checkpoint</div>
                                  <div>{cp.location.address}</div>
                                  <div className="text-xs text-gray-500">({cp.type})</div>
                                  <button
                                    className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-xs"
                                    onClick={() => copyLocationLink(cp.location.latitude, cp.location.longitude, 'Checkpoint')}
                                  >
                                    <Share2 size={14} className="mr-1" /> Share
                                  </button>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                          {/* Final destination marker (different color) */}
                          {routeDetails.destination && (
                            <Marker
                              position={[routeDetails.destination.latitude, routeDetails.destination.longitude]}
                              icon={L.icon({
                                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // green marker
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
                          )}
                        </MapContainer>
                      </div>
                    </div>
                    {/* Delivery Checkpoints Section */}
                    <div className="mt-4">
                      <h3 className="font-bold text-base text-gray-800 mb-1">Delivery Checkpoints</h3>
                      <ul className="ml-4 mt-1 list-disc">
                        {routeDetails.checkpoints && routeDetails.checkpoints.length > 0 ? (
                          routeDetails.checkpoints.map((cp, idx) => {
                            const selected = selectedCheckpoints.find(s => s.checkpoint === cp._id);
                            return (
                              <li key={cp._id} className="mb-2 flex items-center">
                                <div>
                                  <span className="font-semibold text-blue-700">{cp.location.address}</span>
                                  <span className="ml-2 text-xs text-gray-500">({cp.type})</span>
                                  <span className="ml-2 text-xs text-gray-500">[lat: {cp.location.latitude}, lng: {cp.location.longitude}]</span>
                                  {selected && (
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${selected.status === 'completed' ? 'bg-green-100 text-green-700' : selected.status === 'arrived' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                                    </span>
                                  )}
                                  <button
                                    className="ml-2 flex items-center text-blue-600 hover:text-blue-800 text-xs"
                                    onClick={() => copyLocationLink(cp.location.latitude, cp.location.longitude, 'Checkpoint')}
                                  >
                                    <Share2 size={14} className="mr-1" /> Share
                                  </button>
                                </div>
                                {cp.description && <div className="ml-2 text-xs text-gray-500">{cp.description}</div>}
                              </li>
                            );
                          })
                        ) : (
                          <li>No checkpoints</li>
                        )}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base text-gray-800 mb-1">Final Destination</h3>
                      <div className="flex items-center">
                        <div className="font-semibold text-green-700">{routeDetails.destination?.address || '-'}</div>
                        {routeDetails.destination && (
                          <button
                            className="ml-2 flex items-center text-green-700 hover:text-green-900 text-xs"
                            onClick={() => copyLocationLink(routeDetails.destination.latitude, routeDetails.destination.longitude, 'Destination')}
                          >
                            <Share2 size={14} className="mr-1" /> Share
                          </button>
                        )}
                      </div>
                      {routeDetails.destination && (
                        <div className="text-xs text-gray-500">[lat: {routeDetails.destination.latitude}, lng: {routeDetails.destination.longitude}]</div>
                      )}
                    </div>
                  </>
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