import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileDown, 
  Filter, 
  Edit, 
  Trash, 
  Eye, 
  Search,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Package2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface DeliveryPartner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  vehicleType: string;
  vehicleNumber: string;
  rating?: number;
  totalDeliveries?: number;
  createdAt?: string;
}

const PartnersDeliveryEnhanced: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://trafficfrnd-2.onrender.com/api/delivery`, {
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

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.phone.includes(searchTerm);
    const matchesStatus = !statusFilter || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === 'active').length,
    inactive: partners.filter(p => p.status === 'inactive').length,
    suspended: partners.filter(p => p.status === 'suspended').length,
    averageRating: partners.length > 0 ? (partners.reduce((sum, p) => sum + (p.rating || 0), 0) / partners.length).toFixed(1) : '0.0'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'suspended': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading delivery partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Partners</h1>
              <p className="mt-2 text-gray-600">Manage and monitor your delivery network</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                variant="gradient"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => navigate('/partners/delivery/add')}
              >
                Add Partner
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Partners"
            value={stats.total}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          
          <StatCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={XCircle}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-100"
          />
          
          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
          
          <StatCard
            title="Avg Rating"
            value={stats.averageRating}
            icon={Star}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="text-sm text-gray-600">
                {filteredPartners.length} of {partners.length} partners
              </div>
            </div>
          </div>
        </Card>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover shadow="lg" className="h-full">
                <div className="p-6">
                  {/* Partner Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {partner.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{partner.fullName}</h3>
                        <p className="text-sm text-gray-500">{partner.email}</p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(partner.status)}`}>
                      {getStatusIcon(partner.status)}
                      <span className="text-xs font-medium capitalize">{partner.status}</span>
                    </div>
                  </div>

                  {/* Partner Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono">{partner.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4" />
                      <span>{partner.vehicleType} - {partner.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Package2 className="w-4 h-4" />
                      <span>{partner.totalDeliveries || 0} deliveries</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{partner.rating || 0}/5 rating</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => navigate(`/partners/delivery/${partner.id}`)}
                      className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash className="w-4 h-4" />}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPartners.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery partners found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first delivery partner.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                variant="gradient"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => navigate('/partners/delivery/add')}
              >
                Add First Partner
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PartnersDeliveryEnhanced; 