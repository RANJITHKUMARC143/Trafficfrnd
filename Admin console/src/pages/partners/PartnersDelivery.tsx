import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileDown, 
  Filter, 
  Edit, 
  Trash, 
  MapPin, 
  Mail, 
  Phone, 
  Package2, 
  Eye, 
  Search,
  Plus,
  Users,
  TrendingUp,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    rating: '',
    totalDeliveries: '',
    searchTerm: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com'}/api/delivery`, {
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

  // Enhanced filtering logic
  const filteredPartners = partners.filter(partner => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        partner.fullName.toLowerCase().includes(searchLower) ||
        partner.email.toLowerCase().includes(searchLower) ||
        partner.phone.includes(filters.searchTerm) ||
        partner.vehicleNumber.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && partner.status !== filters.status) return false;
    
    // Vehicle type filter
    if (filters.vehicleType && partner.vehicleType !== filters.vehicleType) return false;
    
    // Created date filter
    if (filters.createdAt && partner.createdAt) {
      if (!partner.createdAt.startsWith(filters.createdAt)) return false;
    }
    
    // Rating filter
    if (filters.rating) {
      const ratingNum = parseFloat(filters.rating);
      if (partner.rating < ratingNum) return false;
    }
    
    // Total deliveries filter
    if (filters.totalDeliveries) {
      const deliveriesNum = parseInt(filters.totalDeliveries);
      if ((partner.totalDeliveries || 0) < deliveriesNum) return false;
    }
    
    return true;
  });

  // Calculate statistics
  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === 'active').length,
    inactive: partners.filter(p => p.status === 'inactive').length,
    suspended: partners.filter(p => p.status === 'suspended').length,
    averageRating: partners.length > 0 ? (partners.reduce((sum, p) => sum + (p.rating || 0), 0) / partners.length).toFixed(1) : '0.0'
  };

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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com'}/api/delivery/${partner.id}`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com'}/api/delivery/${form.id}`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com'}/api/delivery`, {
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
    { key: 'id', header: 'ID', sortable: true, render: (v: string) => <span className="font-mono text-xs text-gray-500">{v ? v.slice(-8) : 'N/A'}</span> },
    { 
      key: 'fullName', 
      header: 'Partner', 
      sortable: true,
      render: (v: string, row: DeliveryPartner) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {v ? v.charAt(0).toUpperCase() : 'D'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{v || 'N/A'}</div>
            <div className="text-sm text-gray-500">{row.email || 'N/A'}</div>
          </div>
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
      key: 'vehicleType', 
      header: 'Vehicle', 
      sortable: true,
      render: (v: string, row: DeliveryPartner) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium">{v || 'N/A'}</div>
            <div className="text-xs text-gray-500">{row.vehicleNumber || 'N/A'}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      render: (v: string) => {
        const statusConfig = {
          active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
          inactive: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
          suspended: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Suspended' }
        };
        const config = statusConfig[v as keyof typeof statusConfig] || { 
          icon: AlertCircle, 
          color: 'text-gray-600', 
          bg: 'bg-gray-100', 
          label: v || 'Unknown' 
        };
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
      key: 'rating', 
      header: 'Rating', 
      sortable: true,
      render: (v: number) => (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-medium">{v || 0}</span>
          <span className="text-gray-400">/5</span>
        </div>
      )
    },
    { 
      key: 'totalDeliveries', 
      header: 'Deliveries', 
      sortable: true,
      render: (v: number) => (
        <div className="flex items-center space-x-1">
          <Package2 className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{v || 0}</span>
        </div>
      )
    },
    { 
      key: 'createdAt', 
      header: 'Joined', 
      render: (v: string) => v ? (
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{new Date(v).toLocaleDateString()}</span>
        </div>
      ) : 'N/A', 
      sortable: true 
    },
  ];
  
  const rowActions = (row: DeliveryPartner) => (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        icon={<CheckCircle size={14} />}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trafficfrnd-2.onrender.com'}/api/delivery/${row.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
              body: JSON.stringify({ status: 'active', isActive: true })
            });
            if (!res.ok) throw new Error('Failed to approve partner');
            const updated = await res.json();
            setPartners(list => list.map(p => p.id === row.id ? { ...p, ...updated } as DeliveryPartner : p));
          } catch (e: any) {
            alert(e.message || 'Approval failed');
          }
        }}
      >
        Approve
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
        onClick={() => navigate(`/partners/delivery/${row.id}`)}
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Delivery Partner Management"
        description="Manage and monitor your delivery partners with comprehensive analytics and tools"
        backLink="/partners"
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Add Partner
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
                <p className="text-sm font-medium text-gray-600">Total Partners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
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
                placeholder="Search partners by name, email, phone, or vehicle number..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{filteredPartners.length}</span>
                <span>partners found</span>
                {(filters.status || filters.vehicleType || filters.rating || filters.totalDeliveries || filters.createdAt) && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading delivery partners...</p>
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
            data={filteredPartners}
          columns={columns}
          rowActions={rowActions}
              searchable={false}
              filterable={false}
          pagination={{
            itemsPerPage: 10,
              totalItems: filteredPartners.length,
            currentPage: currentPage,
            onPageChange: setCurrentPage
          }}
          />
          </div>
        )}
      </motion.div>

      {/* Enhanced Filter Modal */}
      <AnimatePresence>
        {filterModal && (
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
              className="bg-white rounded-2xl shadow-2xl p-8 relative max-w-md w-full mx-4"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setFilterModal(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Advanced Filters</h2>
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); setFilterModal(false); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.vehicleType}
                    onChange={e => setFilters(f => ({ ...f, vehicleType: e.target.value }))}
                  >
                    <option value="">All Vehicles</option>
                    <option value="Walker">Walker</option>
                    <option value="Bike">Bike</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.rating}
                    onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}
                  >
                    <option value="">Any Rating</option>
                    <option value="1">1+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Deliveries</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum total deliveries"
                    value={filters.totalDeliveries}
                    onChange={e => setFilters(f => ({ ...f, totalDeliveries: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.createdAt}
                    onChange={e => setFilters(f => ({ ...f, createdAt: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="md" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Apply Filters
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="md" 
                    className="flex-1"
                    onClick={() => setFilters({ status: '', vehicleType: '', createdAt: '', rating: '', totalDeliveries: '', searchTerm: '' })}
                  >
                    Clear All
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Edit Modal */}
      <AnimatePresence>
        {editModal.open && (
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
              className="bg-white rounded-2xl shadow-2xl p-8 relative max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setEditModal({ open: false, partner: null })}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Edit Delivery Partner</h2>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    name="fullName" 
                    value={form.fullName || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    name="email" 
                    value={form.email || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    name="phone" 
                    value={form.phone || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <input 
                    name="vehicleType" 
                    value={form.vehicleType || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                  <input 
                    name="vehicleNumber" 
                    value={form.vehicleNumber || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    name="status" 
                    value={form.status || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={!!form.isActive} 
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  isLoading={formLoading} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Save Changes
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Add Modal */}
      <AnimatePresence>
        {addModal && (
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
              className="bg-white rounded-2xl shadow-2xl p-8 relative max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setAddModal(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-6 text-gray-900">Add Delivery Partner</h2>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    name="fullName" 
                    value={form.fullName || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    name="email" 
                    value={form.email || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    name="phone" 
                    value={form.phone || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input 
                    name="password" 
                    type="password" 
                    value={form.password || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <input 
                    name="vehicleType" 
                    value={form.vehicleType || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                  <input 
                    name="vehicleNumber" 
                    value={form.vehicleNumber || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    name="status" 
                    value={form.status || ''} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={!!form.isActive} 
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  isLoading={formLoading} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Add Partner
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnersDelivery;