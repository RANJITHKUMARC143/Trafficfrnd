import React, { useState } from 'react';
import { Building2, FileDown, Filter, Edit, Trash, Phone, MapPin, Package } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Vendor {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  productsOffered: number;
  onboardedDate: string;
  contractRenewal: string;
}

const PartnersVendors: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock data
  const vendors: Vendor[] = Array.from({ length: 24 }).map((_, index) => ({
    id: `V${1000 + index}`,
    name: `Vendor ${index + 1} ${index % 3 === 0 ? 'Solutions' : index % 4 === 0 ? 'Products' : 'Services'}`,
    type: ['Product Supplier', 'Service Provider', 'Training Partner', 'Software Vendor'][index % 4],
    contactPerson: `Contact ${index + 1}`,
    email: `vendor${index + 1}@example.com`,
    phone: `+1 (555) ${100 + index}-${1000 + index}`,
    location: ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Phoenix', 'Seattle'][index % 6],
    status: index % 7 === 0 ? 'pending' : (index % 9 === 0 ? 'inactive' : 'active'),
    productsOffered: Math.floor(Math.random() * 30) + 1,
    onboardedDate: new Date(2022, Math.floor(index / 8), (index % 28) + 1).toISOString().split('T')[0],
    contractRenewal: new Date(2023, Math.floor(index / 4) + 6, (index % 28) + 1).toISOString().split('T')[0],
  }));
  
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value: string, row: Vendor) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
            <Building2 size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <MapPin size={10} className="mr-1" /> {row.location}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      sortable: true,
      render: (value: string, row: Vendor) => (
        <div>
          <div className="text-gray-800">{value}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>{row.email}</span>
            <span className="flex items-center"><Phone size={10} className="mr-1" />{row.phone}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Vendor['status']) => {
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'productsOffered',
      header: 'Products',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <Package size={14} className="mr-1.5 text-emerald-600" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'onboardedDate',
      header: 'Onboarded',
      sortable: true
    },
    {
      key: 'contractRenewal',
      header: 'Contract Renewal',
      sortable: true
    }
  ];
  
  const rowActions = (row: Vendor) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<Edit size={14} />}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Trash size={14} />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <Button 
              variant="secondary"
              size="md"
              icon={<FileDown size={16} />}
            >
              Export
            </Button>
            <Button 
              variant="primary"
              size="md"
              icon={<Building2 size={16} />}
            >
              Add Vendor
            </Button>
          </>
        }
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DataTable
          title="All Vendors"
          subtitle="Showing all registered vendor partners in the system"
          data={vendors}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: vendors.length,
            currentPage: currentPage,
            onPageChange: setCurrentPage
          }}
          actions={
            <Button
              variant="secondary"
              size="sm"
              icon={<Filter size={14} />}
            >
              Advanced Filters
            </Button>
          }
        />
      </motion.div>
    </div>
  );
};

export default PartnersVendors;