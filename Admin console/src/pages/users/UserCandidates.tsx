import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  FileDown, 
  Filter, 
  Edit, 
  Trash, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Search,
  Plus,
  Users,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

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
    searchTerm: ''
  });
  const navigate = useNavigate();

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    verified: users.filter(u => u.role === 'verified').length
  };
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  const columns = [
    { key: 'id', header: 'ID', sortable: true, render: (v: string) => <span className="font-mono text-xs text-gray-500">{v ? v.slice(-8) : 'N/A'}</span> },
    { 
      key: 'name', 
      header: 'User', 
      sortable: true,
      render: (v: string, row: UserType) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {v?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{v || 'N/A'}</div>
            <div className="text-sm text-gray-500">{row.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'username', 
      header: 'Username', 
      sortable: true,
      render: (v: string) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{v || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      header: 'Contact', 
      sortable: true,
      render: (v: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm">{v || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'Role', 
      sortable: true,
      render: (v: string) => {
        const roleConfig = {
          candidate: { icon: User, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Candidate' },
          employer: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100', label: 'Employer' },
          admin: { icon: User, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Admin' },
          verified: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Verified' }
        };
        const config = roleConfig[v as keyof typeof roleConfig] || { icon: User, color: 'text-gray-600', bg: 'bg-gray-100', label: v };
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
      key: 'status', 
      header: 'Status', 
      sortable: true,
      render: (v: string) => {
        const statusConfig = {
          active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
          pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
          inactive: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' }
        };
        const config = statusConfig[v as keyof typeof statusConfig] || { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: v };
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
      key: 'address', 
      header: 'Location', 
      sortable: true,
      render: (v: string) => (
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{v || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'registrationDate', 
      header: 'Registered', 
      render: (v: string) => v ? (
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{new Date(v).toLocaleDateString()}</span>
        </div>
      ) : 'N/A', 
      sortable: true 
    },
    {
      key: 'profileImage',
      header: 'Profile',
      render: (value: string) => value ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye size={14} />}
          onClick={() => setImageModal({ open: true, src: value })}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          View
        </Button>
      ) : (
        <span className="text-gray-400">N/A</span>
      )
    },
  ];
  
  const rowActions = (row: UserType) => (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        icon={<Edit size={14} />}
        onClick={e => {
          e.stopPropagation();
          openEdit(row);
        }}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Trash size={14} />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={e => {
          e.stopPropagation();
          handleDelete(row);
        }}
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
      const res = await fetch(`http://localhost:3000/api/${user.id}`, {
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
      const res = await fetch(`http://localhost:3000/api/${form.id}`, {
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
      const res = await fetch(`http://localhost:3000/api`, {
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
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(filters.searchTerm);
      if (!matchesSearch) return false;
    }
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (filters.registrationDate && user.registrationDate) {
      const userDate = new Date(user.registrationDate).toISOString().split('T')[0];
      if (userDate !== filters.registrationDate) return false;
    }
    if (filters.lastActive && user.lastActivity) {
      const userDate = new Date(user.lastActivity).toISOString().split('T')[0];
      if (userDate !== filters.lastActive) return false;
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
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="User Management"
        description="Manage and monitor all users with comprehensive analytics and tools"
        backLink="/users"
        actions={
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button 
                variant="secondary"
                size="md"
                icon={<Download size={16} />}
                onClick={() => {
                  const menu = document.getElementById('export-menu');
                  if (menu) menu.classList.toggle('hidden');
                }}
                className="relative"
              >
                Export
              </Button>
              <div id="export-menu" className="hidden absolute z-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100" 
                  onClick={() => { handleExportCSV(); document.getElementById('export-menu')?.classList.add('hidden'); }}
                >
                  <FileDown size={14} className="mr-2" />
                  Export to CSV
                </button>
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100" 
                  onClick={() => { handleExportExcel(); document.getElementById('export-menu')?.classList.add('hidden'); }}
                >
                  <Upload size={14} className="mr-2" />
                  Export to Excel
                </button>
              </div>
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={<Filter size={16} />}
              onClick={() => setFilterModal(true)}
            >
              Filters
            </Button>
            <Button 
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={openAdd}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              Add User
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, username, email, or phone..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{filteredUsers.length}</span>
                <span>users found</span>
                {(filters.role || filters.status || filters.registrationDate || filters.lastActive) && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Filtered
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
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
              data={filteredUsers}
              columns={columns}
              rowActions={rowActions}
              searchable={false}
              filterable={false}
              pagination={{
                itemsPerPage: 10,
                totalItems: filteredUsers.length,
                currentPage: currentPage,
                onPageChange: setCurrentPage
              }}
            />
          </div>
        )}
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
              <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setFilters({ role: '', status: '', registrationDate: '', lastActive: '', searchTerm: '' })}>Clear Filters</Button>
            </form>
          </div>
        </div>
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
    </div>
  );
};

export default UserCandidates;