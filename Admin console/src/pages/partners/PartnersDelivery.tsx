import React, { useState } from 'react';
import { Truck, FileDown, Filter, Edit, Trash, MapPin, Mail, Phone, Package2 } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface DeliveryPartner {
  id: string;
  name: string;
  serviceAreas: string[];
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  deliveriesCompleted: number;
  onTime: string;
  onboardedDate: string;
  vehicleType: string;
}

const PartnersDelivery: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock data
  const deliveryPartners: DeliveryPartner[] = Array.from({ length: 12 }).map((_, index) => ({
    id: `DP${100 + index}`,
    name: `${['Fast', 'Express', 'Quick', 'Reliable'][index % 4]} ${['Delivery', 'Logistics', 'Transport', 'Shipping'][index % 4]} ${index + 1}`,
    serviceAreas: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => 
      ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Phoenix', 'Seattle', 'Boston', 'Denver'][Math.floor(Math.random() * 8)]
    ),
    contactPerson: `Contact ${index + 1}`,
    email: `delivery${index + 1}@example.com`,
    phone: `+1 (555) ${100 + index}-${1000 + index}`,
    status: index % 5 === 0 ? 'pending' : (index % 7 === 0 ? 'inactive' : 'active'),
    deliveriesCompleted: Math.floor(Math.random() * 5000) + 500,
    onTime: `${Math.floor(Math.random() * 10) + 90}%`,
    onboardedDate: new Date(2022, Math.floor(index / 4), (index % 28) + 1).toISOString().split('T')[0],
    vehicleType: ['Van', 'Truck', 'Motorcycle', 'Car'][index % 4],
  }));
  
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true
    },
    {
      key: 'name',
      header: 'Partner Name',
      sortable: true,
      render: (value: string, row: DeliveryPartner) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
            <Truck size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">
              {row.vehicleType} Fleet
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'serviceAreas',
      header: 'Service Areas',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((area, index) => (
            <span key={index} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
              <MapPin size={10} className="mr-1" /> {area}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: 'Contact Information',
      sortable: true,
      render: (value: string, row: DeliveryPartner) => (
        <div>
          <div className="text-gray-800">{value}</div>
          <div className="text-xs text-gray-500 flex flex-col gap-1">
            <span className="flex items-center"><Mail size={10} className="mr-1" />{row.email}</span>
            <span className="flex items-center"><Phone size={10} className="mr-1" />{row.phone}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: DeliveryPartner['status']) => {
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
      key: 'deliveriesCompleted',
      header: 'Deliveries',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <Package2 size={14} className="mr-1.5 text-blue-600" />
          <span>{value.toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'onTime',
      header: 'On-Time Rate',
      sortable: true,
      render: (value: string) => {
        const percentage = parseInt(value.replace('%', ''));
        let color = 'text-green-600';
        if (percentage < 90) color = 'text-yellow-600';
        if (percentage < 80) color = 'text-red-600';
        
        return <span className={`font-medium ${color}`}>{value}</span>;
      }
    },
    {
      key: 'onboardedDate',
      header: 'Onboarded',
      sortable: true
    },
  ];
  
  const rowActions = (row: DeliveryPartner) => (
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
        title="Delivery Partner Management"
        description="View and manage delivery and logistics partners"
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
              icon={<Truck size={16} />}
            >
              Add Delivery Partner
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
          title="All Delivery Partners"
          subtitle="Showing all registered delivery and logistics partners"
          data={deliveryPartners}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: deliveryPartners.length,
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
      
      {/* Performance Metrics */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Delivery Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Average Delivery Time</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-800">24.5</div>
              <div className="text-sm text-gray-500">minutes</div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Target: 30 min</span>
              <span className="text-green-600">18% better than target</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Customer Satisfaction</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-800">4.8</div>
              <div className="text-sm text-gray-500">out of 5</div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: '96%' }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Target: 4.5</span>
              <span className="text-blue-600">+0.3 points vs last quarter</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Delivery Success Rate</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-800">99.2%</div>
              <div className="text-sm text-gray-500">success</div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-500"
                initial={{ width: 0 }}
                animate={{ width: '99.2%' }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Target: 98%</span>
              <span className="text-purple-600">+0.8% vs target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersDelivery;