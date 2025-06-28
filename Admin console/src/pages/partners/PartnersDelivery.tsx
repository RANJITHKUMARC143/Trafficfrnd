import React, { useState, useEffect } from 'react';
import { Truck, FileDown, Filter, Edit, Trash, MapPin, Mail, Phone, Package2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
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
  createdAt?: string;
  updatedAt?: string;
}

const PartnersDelivery: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; partner: DeliveryPartner | null }>({ open: false, partner: null });
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<Partial<DeliveryPartner & { password?: string }>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    createdAt: '',
  });

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch delivery partners');
        setPartners(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // Filtering logic
  const filteredPartners = partners.filter(partner => {
    if (filters.status && partner.status !== filters.status) return false;
    if (filters.vehicleType && partner.vehicleType !== filters.vehicleType) return false;
    if (filters.createdAt && partner.createdAt) {
      if (!partner.createdAt.startsWith(filters.createdAt)) return false;
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [];
    const headers = columns.map(col => col.header).join(',');
    csvRows.push(headers);
    filteredPartners.forEach(partner => {
      const row = columns.map(col => {
        let value = partner[col.key as keyof DeliveryPartner];
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
    a.download = 'delivery_partners.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredPartners.map(partner => {
      const row: any = {};
      columns.forEach(col => {
        let value = partner[col.key as keyof DeliveryPartner];
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        row[col.header] = value ?? '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DeliveryPartners');
    XLSX.writeFile(workbook, 'delivery_partners.xlsx');
  };

  // Delete partner
  const handleDelete = async (partner: DeliveryPartner) => {
    if (!window.confirm(`Are you sure you want to delete partner ${partner.fullName}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery/${partner.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to delete delivery partner');
      setPartners(partners => partners.filter(p => p.id !== partner.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open edit modal
  const openEdit = (partner: DeliveryPartner) => {
    setForm({ ...partner });
    setEditModal({ open: true, partner });
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update delivery partner');
      const updated = await res.json();
      setPartners(partners => partners.map(p => p.id === form.id ? { ...p, ...updated } : p));
      setEditModal({ open: false, partner: null });
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.4.176:3000'}/api/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to add delivery partner');
      const added = await res.json();
      setPartners(partners => [...partners, added.deliveryBoy]);
      setAddModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };
  
  const columns = [
    { key: 'id', header: 'ID', sortable: true, render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'fullName', header: 'Full Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'vehicleType', header: 'Vehicle Type', sortable: true },
    { key: 'vehicleNumber', header: 'Vehicle Number', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'isActive', header: 'Active', render: (v: boolean) => v ? 'Yes' : 'No', sortable: true },
    { key: 'totalDeliveries', header: 'Total Deliveries', sortable: true },
    { key: 'rating', header: 'Rating', sortable: true },
    { key: 'createdAt', header: 'Created At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
    { key: 'updatedAt', header: 'Updated At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
  ];
  
  const rowActions = (row: DeliveryPartner) => (
    <div className="flex space-x-2">
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
  
  return (
    <div>
      <PageHeader
        title="Delivery Partner Management"
        description="View and manage delivery and logistics partners"
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
              icon={<Truck size={16} />}
              onClick={openAdd}
            >
              Add Delivery Partner
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.vehicleType}
                  onChange={e => setFilters(f => ({ ...f, vehicleType: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="Walker">Walker</option>
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
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
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ status: '', vehicleType: '', createdAt: '' })}>Clear Filters</Button>
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
          <div className="text-center py-10 text-gray-500">Loading delivery partners...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : (
        <DataTable
          title="All Delivery Partners"
          subtitle="Showing all registered delivery and logistics partners"
            data={filteredPartners}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
              totalItems: filteredPartners.length,
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
                onClick={() => setEditModal({ open: false, partner: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Edit Delivery Partner</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <input name="fullName" value={form.fullName || ''} onChange={handleFormChange} placeholder="Full Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" required />
                <input name="vehicleType" value={form.vehicleType || ''} onChange={handleFormChange} placeholder="Vehicle Type" className="w-full border rounded p-2" required />
                <input name="vehicleNumber" value={form.vehicleNumber || ''} onChange={handleFormChange} placeholder="Vehicle Number" className="w-full border rounded p-2" required />
                <select name="status" value={form.status || ''} onChange={handleFormChange} className="w-full border rounded p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <span>Active</span>
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
              <h2 className="text-lg font-bold mb-4">Add Delivery Partner</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
                <input name="fullName" value={form.fullName || ''} onChange={handleFormChange} placeholder="Full Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" required />
                <input name="password" type="password" value={form.password || ''} onChange={handleFormChange} placeholder="Password" className="w-full border rounded p-2" required />
                <input name="vehicleType" value={form.vehicleType || ''} onChange={handleFormChange} placeholder="Vehicle Type" className="w-full border rounded p-2" required />
                <input name="vehicleNumber" value={form.vehicleNumber || ''} onChange={handleFormChange} placeholder="Vehicle Number" className="w-full border rounded p-2" required />
                <select name="status" value={form.status || ''} onChange={handleFormChange} className="w-full border rounded p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <span>Active</span>
                </label>
                {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                <Button type="submit" variant="primary" size="md" isLoading={formLoading} className="w-full">Add</Button>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PartnersDelivery;