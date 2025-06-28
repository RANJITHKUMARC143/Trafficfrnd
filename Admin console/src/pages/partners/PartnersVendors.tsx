import React, { useState, useEffect } from 'react';
import { Building2, FileDown, Filter, Edit, Trash, Phone, MapPin, Package, Eye, Clock, TrendingUp, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  isVerified?: boolean;
  isOpen?: boolean;
  address?: any;
  businessHours?: any;
  rating?: number;
  totalRatings?: number;
  createdAt?: string;
  updatedAt?: string;
  expoPushToken?: string;
}

interface VendorOrder {
  _id: string;
  customerName: string;
  items: any[];
  totalAmount: number;
  status: string;
  timestamp: string;
  updatedAt: string;
  deliveryBoyId?: any;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
}

interface VendorActivity {
  type: 'order_created' | 'order_completed' | 'menu_updated' | 'status_changed';
  description: string;
  timestamp: string;
  orderId?: string;
}

const PartnersVendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; vendor: Vendor | null }>({ open: false, vendor: null });
  const [addModal, setAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor & { password?: string }>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    isVerified: '',
    isOpen: '',
    createdAt: '',
  });

  // Vendor details data
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [vendorMenuItems, setVendorMenuItems] = useState<MenuItem[]>([]);
  const [vendorActivity, setVendorActivity] = useState<VendorActivity[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [showMoreOrders, setShowMoreOrders] = useState(false);

  // Filtered orders for search
  const filteredVendorOrders = vendorOrders.filter((order: any) => {
    const search = orderSearch.toLowerCase();
    const orderDate = new Date(order.timestamp).toLocaleDateString().toLowerCase();
    return (
      (order._id && order._id.toString().toLowerCase().includes(search)) ||
      (order.status && order.status.toLowerCase().includes(search)) ||
      (order.customerName && order.customerName.toLowerCase().includes(search)) ||
      orderDate.includes(search)
    );
  });

  // Get orders to display based on showMoreOrders state
  const ordersToShow = showMoreOrders ? filteredVendorOrders : filteredVendorOrders.slice(0, 5);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch vendors');
        setVendors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  // Filtering logic
  const filteredVendors = vendors.filter(vendor => {
    if (filters.status && vendor.status !== filters.status) return false;
    if (filters.isVerified && String(vendor.isVerified) !== filters.isVerified) return false;
    if (filters.isOpen && String(vendor.isOpen) !== filters.isOpen) return false;
    if (filters.createdAt && vendor.createdAt) {
      if (!vendor.createdAt.startsWith(filters.createdAt)) return false;
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [];
    const headers = columns.map(col => col.header).join(',');
    csvRows.push(headers);
    filteredVendors.forEach(vendor => {
      const row = columns.map(col => {
        let value = vendor[col.key as keyof Vendor];
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
    a.download = 'vendors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredVendors.map(vendor => {
      const row: any = {};
      columns.forEach(col => {
        let value = vendor[col.key as keyof Vendor];
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        row[col.header] = value ?? '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');
    XLSX.writeFile(workbook, 'vendors.xlsx');
  };

  // Delete vendor
  const handleDelete = async (vendor: Vendor) => {
    if (!window.confirm(`Are you sure you want to delete vendor ${vendor.businessName}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors/${vendor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to delete vendor');
      setVendors(vendors => vendors.filter(v => v.id !== vendor.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open edit modal
  const openEdit = (vendor: Vendor) => {
    setForm({ ...vendor });
    setEditModal({ open: true, vendor });
    setFormError('');
  };

  // Open add modal
  const openAdd = () => {
    setForm({});
    setAddModal(true);
    setFormError('');
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save edit
  const handleEditSave = async () => {
    if (!form.id) return;
    setFormLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      const updated = await res.json();
      setVendors(vendors => vendors.map(v => v.id === form.id ? { ...v, ...updated } : v));
      setEditModal({ open: false, vendor: null });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Save add
  const handleAddSave = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to add vendor');
      const added = await res.json();
      setVendors(vendors => [...vendors, added.vendor]);
      setAddModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch vendor details
  const fetchVendorDetails = async (vendorId: string) => {
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch vendor orders
      const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors/orders/admin?vendorId=${vendorId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      // Fetch vendor menu items
      const menuRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors/menu/vendor/${vendorId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      // Fetch vendor activity
      const activityRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/vendors/${vendorId}/activity?limit=10`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        setVendorOrders(orders);
      }
      
      if (menuRes.ok) {
        const menuItems = await menuRes.json();
        setVendorMenuItems(menuItems);
      }
      
      if (activityRes.ok) {
        const activity = await activityRes.json();
        setVendorActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open details modal
  const openDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    fetchVendorDetails(vendor.id);
  };
  
  const columns = [
    { key: 'businessName', header: 'Business Name', sortable: true },
    { key: 'ownerName', header: 'Owner Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { 
      key: 'status', 
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const rowActions = (row: Vendor) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openDetails(row)}
        className="p-1 text-blue-600 hover:text-blue-800"
        title="View Details"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => setEditModal({ open: true, vendor: row })}
        className="p-1 text-green-600 hover:text-green-800"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => handleDelete(row.id)}
        className="p-1 text-red-600 hover:text-red-800"
        title="Delete"
      >
        <Trash size={16} />
      </button>
    </div>
  );
  
  return (
    <div>
      <PageHeader
        title="Vendor Management"
        description="View and manage product and service vendors"
        backLink="/partners"
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
            <Button 
              variant="primary"
              size="md"
              icon={<Building2 size={16} />}
              onClick={openAdd}
            >
              Add Vendor
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.isVerified}
                  onChange={e => setFilters(f => ({ ...f, isVerified: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.isOpen}
                  onChange={e => setFilters(f => ({ ...f, isOpen: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
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
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ status: '', isVerified: '', isOpen: '', createdAt: '' })}>Clear Filters</Button>
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
          <div className="text-center py-10 text-gray-500">Loading vendors...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : (
        <DataTable
          title="Vendors"
          subtitle={`${vendors.length} vendors found`}
          data={filteredVendors}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: filteredVendors.length,
            currentPage: 1,
            onPageChange: () => {},
          }}
        />
        )}
        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setEditModal({ open: false, vendor: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Edit Vendor</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <input name="businessName" value={form.businessName || ''} onChange={handleFormChange} placeholder="Business Name" className="w-full border rounded p-2" required />
                <input name="ownerName" value={form.ownerName || ''} onChange={handleFormChange} placeholder="Owner Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" required />
                <select name="status" value={form.status || ''} onChange={handleFormChange} className="w-full border rounded p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isVerified" checked={!!form.isVerified} onChange={e => setForm(f => ({ ...f, isVerified: e.target.checked }))} />
                  <span>Verified</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isOpen" checked={!!form.isOpen} onChange={e => setForm(f => ({ ...f, isOpen: e.target.checked }))} />
                  <span>Open</span>
                </label>
                {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                <Button type="submit" variant="primary" size="md" isLoading={formLoading} className="w-full">Save</Button>
              </form>
            </div>
          </div>
        )}
        {/* Add Modal */}
        {addModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setAddModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Add Vendor</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
                <input name="businessName" value={form.businessName || ''} onChange={handleFormChange} placeholder="Business Name" className="w-full border rounded p-2" required />
                <input name="ownerName" value={form.ownerName || ''} onChange={handleFormChange} placeholder="Owner Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" required />
                <input name="password" type="password" value={form.password || ''} onChange={handleFormChange} placeholder="Password" className="w-full border rounded p-2" required />
                <select name="status" value={form.status || ''} onChange={handleFormChange} className="w-full border rounded p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isVerified" checked={!!form.isVerified} onChange={e => setForm(f => ({ ...f, isVerified: e.target.checked }))} />
                  <span>Verified</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isOpen" checked={!!form.isOpen} onChange={e => setForm(f => ({ ...f, isOpen: e.target.checked }))} />
                  <span>Open</span>
                </label>
                {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                <Button type="submit" variant="primary" size="md" isLoading={formLoading} className="w-full">Add</Button>
              </form>
            </div>
          </div>
        )}

        {/* Vendor Details Modal */}
        {selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedVendor.businessName}</h2>
                    <p className="text-blue-100">{selectedVendor.ownerName} • {selectedVendor.email}</p>
                  </div>
                  <button
                    className="text-white hover:text-blue-200 text-2xl"
                    onClick={() => setSelectedVendor(null)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {detailsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vendor Info */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Building2 className="w-5 h-5 mr-2" />
                          Business Information
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              selectedVendor.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedVendor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedVendor.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Verified:</span>
                            <span className={selectedVendor.isVerified ? 'text-green-600' : 'text-red-600'}>
                              {selectedVendor.isVerified ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Open:</span>
                            <span className={selectedVendor.isOpen ? 'text-green-600' : 'text-red-600'}>
                              {selectedVendor.isOpen ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {selectedVendor.rating && (
                            <div className="flex justify-between">
                              <span className="font-medium">Rating:</span>
                              <span className="flex items-center">
                                ⭐ {selectedVendor.rating}/5 ({selectedVendor.totalRatings || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Phone className="w-5 h-5 mr-2" />
                          Contact Information
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{selectedVendor.phone}</span>
                          </div>
                          {selectedVendor.address && (
                            <div className="flex items-start">
                              <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                              <span>{selectedVendor.address.street}, {selectedVendor.address.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Activity Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{vendorOrders.length}</div>
                            <div className="text-sm text-gray-600">Total Orders</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{vendorMenuItems.length}</div>
                            <div className="text-sm text-gray-600">Menu Items</div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          Recent Orders ({vendorOrders.length})
                        </h3>
                        <input
                          type="text"
                          placeholder="Search orders by ID, status, or customer..."
                          className="mb-4 px-3 py-2 border border-gray-300 rounded w-full"
                          value={orderSearch}
                          onChange={e => setOrderSearch(e.target.value)}
                        />
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {ordersToShow.length > 0 ? (
                            ordersToShow.map((order: any) => (
                              <div key={order._id} className="bg-white rounded p-2 border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Order ID: <span className="font-mono">{order._id}</span></span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  ₹{order.totalAmount} • {order.customerName || ''} • {new Date(order.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No orders found</p>
                          )}
                        </div>
                        {filteredVendorOrders.length > 5 && (
                          <div className="text-center mt-2">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                // Navigate to vendor orders page with vendor ID
                                window.open(`/partners/orders?vendorId=${selectedVendor?.id}`, '_blank');
                              }}
                            >
                              See More
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items Section */}
                {!detailsLoading && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Menu Items ({vendorMenuItems.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendorMenuItems.length > 0 ? (
                        vendorMenuItems.map((item: any) => (
                          <div key={item._id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="font-bold text-green-600">₹{item.price}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8 col-span-full">No menu items found</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Section */}
                {!detailsLoading && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Recent Activity ({vendorActivity.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {vendorActivity.length > 0 ? (
                          vendorActivity.map((activity: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                activity.type === 'order' ? 'bg-blue-500' :
                                activity.type === 'menu' ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{activity.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </div>
                                {activity.data && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {activity.type === 'order' && (
                                      <span>Order ID: <span className="font-mono">{activity.data.orderId}</span> • ₹{activity.data.amount} • {activity.data.customerName}</span>
                                    )}
                                    {activity.type === 'menu' && (
                                      <span>₹{activity.data.price} • {activity.data.isAvailable ? 'Available' : 'Unavailable'}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No recent activity</p>
                        )}
                      </div>
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

export default PartnersVendors;