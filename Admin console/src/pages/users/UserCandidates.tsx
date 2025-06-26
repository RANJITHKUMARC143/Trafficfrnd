import React, { useState, useEffect } from 'react';
import { UserPlus, FileDown, Filter, Edit, Trash, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface UserType {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  status?: 'active' | 'pending' | 'inactive';
  registrationDate?: string;
  lastActivity?: string;
  role: string;
  skills?: string[];
  address?: string;
  profileImage?: string;
  expoPushToken?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    updatedAt?: string;
  };
  createdAt?: string;
}

const UserCandidates: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [imageModal, setImageModal] = useState<{ open: boolean; src: string }>({ open: false, src: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; user: UserType | null }>({ open: false, user: null });
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<Partial<UserType>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    registrationDate: '',
    lastActive: '',
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/users`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
        // Filter only users with role 'user'
        setUsers(data.filter((u: UserType) => u.role === 'user'));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  const columns = [
    { key: 'id', header: 'User ID', sortable: true, render: (value: string) => <span className="font-bold">{value}</span> },
    { key: 'username', header: 'Username', sortable: true },
    { key: 'name', header: 'Full Name', sortable: true },
    { key: 'email', header: 'Email Address', sortable: true },
    { key: 'phone', header: 'Phone Number', sortable: true },
    { key: 'address', header: 'Address', sortable: true },
    {
      key: 'profileImage',
      header: 'Profile Image',
      render: (value: string) => value ? (
        <button
          className="text-blue-600 underline hover:text-blue-800"
          onClick={() => setImageModal({ open: true, src: value })}
        >
          View
        </button>
      ) : (
        <span className="text-gray-400">N/A</span>
      )
    },
    { key: 'expoPushToken', header: 'Expo Push Token', sortable: false },
    { key: 'role', header: 'Role', sortable: true },
    {
      key: 'location',
      header: 'Location',
      render: (value: any) => value && (value.latitude || value.longitude) ? (
        <div>
          <div>Lat: {value.latitude ?? 'N/A'}</div>
          <div>Lng: {value.longitude ?? 'N/A'}</div>
          <div>Addr: {value.address ?? 'N/A'}</div>
          <div>Updated: {value.updatedAt ? new Date(value.updatedAt).toLocaleString() : 'N/A'}</div>
        </div>
      ) : <span className="text-gray-400">N/A</span>
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (value: string) => value ? new Date(value).toLocaleString() : 'N/A',
      sortable: true
    },
    { key: 'status', header: 'Account Status', sortable: true },
    { key: 'registrationDate', header: 'Registered On', sortable: true },
    { key: 'lastActive', header: 'Last Active', render: (value: string) => value ? new Date(value).toLocaleString() : 'N/A', sortable: true },
  ];
  
  const rowActions = (row: UserType) => (
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
  
  // Delete user
  const handleDelete = async (user: UserType) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users => users.filter(u => u.id !== user.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open edit modal
  const openEdit = (user: UserType) => {
    setForm({ ...user });
    setEditModal({ open: true, user });
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/users/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();
      setUsers(users => users.map(u => u.id === form.id ? { ...u, ...updated } : u));
      setEditModal({ open: false, user: null });
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.183.3:3000'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to add user');
      const added = await res.json();
      setUsers(users => [...users, added.user]);
      setAddModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Filtering logic
  const filteredUsers = users.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (filters.registrationDate && user.createdAt) {
      if (!user.createdAt.startsWith(filters.registrationDate)) return false;
    }
    if (filters.lastActive && user.lastActive) {
      if (!user.lastActive.startsWith(filters.lastActive)) return false;
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [];
    const headers = columns.map(col => col.header).join(',');
    csvRows.push(headers);
    filteredUsers.forEach(user => {
      const row = columns.map(col => {
        let value = user[col.key as keyof UserType];
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
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredUsers.map(user => {
      const row: any = {};
      columns.forEach(col => {
        let value = user[col.key as keyof UserType];
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        row[col.header] = value ?? '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'users.xlsx');
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="View and manage all users"
        backLink="/users"
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
              icon={<UserPlus size={16} />}
              onClick={openAdd}
            >
              Add User
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.role}
                  onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <select
                  className="w-full border rounded p-2"
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registered On (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={filters.registrationDate}
                  onChange={e => setFilters(f => ({ ...f, registrationDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Active (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={filters.lastActive}
                  onChange={e => setFilters(f => ({ ...f, lastActive: e.target.value }))}
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="w-full">Apply Filters</Button>
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ role: '', status: '', registrationDate: '', lastActive: '' })}>Clear Filters</Button>
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
          <div className="text-center py-10 text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : (
          <DataTable
            title="All Users"
            subtitle="Showing all registered users in the system"
            data={filteredUsers}
            columns={columns}
            rowActions={rowActions}
            searchable={true}
            filterable={true}
            pagination={{
              itemsPerPage: 10,
              totalItems: filteredUsers.length,
              currentPage: currentPage,
              onPageChange: setCurrentPage
            }}
          />
        )}
        {/* Image Modal */}
        {imageModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setImageModal({ open: false, src: '' })}
                aria-label="Close"
              >
                &times;
              </button>
              <img
                src={imageModal.src}
                alt="Profile Preview"
                className="max-w-[80vw] max-h-[80vh] rounded-lg border"
              />
            </div>
          </div>
        )}
        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full max-h-full flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setEditModal({ open: false, user: null })}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Edit User</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <input name="username" value={form.username || ''} onChange={handleFormChange} placeholder="Username" className="w-full border rounded p-2" required />
                <input name="name" value={form.name || ''} onChange={handleFormChange} placeholder="Full Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" />
                <input name="address" value={form.address || ''} onChange={handleFormChange} placeholder="Address" className="w-full border rounded p-2" />
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
              <h2 className="text-lg font-bold mb-4">Add User</h2>
              <form className="space-y-4 w-80" onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
                <input name="username" value={form.username || ''} onChange={handleFormChange} placeholder="Username" className="w-full border rounded p-2" required />
                <input name="name" value={form.name || ''} onChange={handleFormChange} placeholder="Full Name" className="w-full border rounded p-2" required />
                <input name="email" value={form.email || ''} onChange={handleFormChange} placeholder="Email" className="w-full border rounded p-2" required />
                <input name="password" type="password" value={form.password || ''} onChange={handleFormChange} placeholder="Password" className="w-full border rounded p-2" required />
                <input name="phone" value={form.phone || ''} onChange={handleFormChange} placeholder="Phone" className="w-full border rounded p-2" />
                <input name="address" value={form.address || ''} onChange={handleFormChange} placeholder="Address" className="w-full border rounded p-2" />
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

export default UserCandidates;