import React, { useState, useEffect } from 'react';
import { Building2, FileDown, Filter, Edit, Trash, Phone, MapPin, Package } from 'lucide-react';
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

const PartnersVendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; vendor: Vendor | null }>({ open: false, vendor: null });
  const [addModal, setAddModal] = useState(false);
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

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors/${vendor.id}`, {
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
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save edit
  const handleEditSave = async () => {
    if (!form.id) return;
    setFormLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors/${form.id}`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/vendors`, {
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

  const columns = [
    { key: 'id', header: 'ID', sortable: true, render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'businessName', header: 'Business Name', sortable: true },
    { key: 'ownerName', header: 'Owner Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'isVerified', header: 'Verified', render: (v: boolean) => v ? 'Yes' : 'No', sortable: true },
    { key: 'isOpen', header: 'Open', render: (v: boolean) => v ? 'Yes' : 'No', sortable: true },
    { key: 'createdAt', header: 'Created At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
    { key: 'updatedAt', header: 'Updated At', render: (v: string) => v ? new Date(v).toLocaleString() : 'N/A', sortable: true },
  ];

  const rowActions = (row: Vendor) => (
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
            title="All Vendors"
            subtitle="Showing all registered vendor partners in the system"
            data={filteredVendors}
            columns={columns}
            rowActions={rowActions}
            searchable={true}
            filterable={true}
            pagination={{
              itemsPerPage: 10,
              totalItems: filteredVendors.length,
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
      </motion.div>
    </div>
  );
};

export default PartnersVendors;