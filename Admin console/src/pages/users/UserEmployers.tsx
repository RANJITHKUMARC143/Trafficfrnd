import React, { useState } from 'react';
import { Building2, UserPlus, FileDown, Filter, Edit, Trash, MapPin, Building } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Employer {
  id: string;
  name: string;
  industry: string;
  location: string;
  size: string;
  status: 'active' | 'pending' | 'suspended';
  jobsPosted: number;
  joinDate: string;
  lastActive: string;
}

const UserEmployers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock data
  const employers: Employer[] = Array.from({ length: 45 }).map((_, index) => ({
    id: `EMP${1000 + index}`,
    name: `Company ${index + 1} ${index % 3 === 0 ? 'Technologies' : index % 4 === 0 ? 'Solutions' : 'Inc'}`,
    industry: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail'][index % 6],
    location: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston'][index % 6],
    size: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'][index % 6],
    status: index % 7 === 0 ? 'pending' : (index % 11 === 0 ? 'suspended' : 'active'),
    jobsPosted: Math.floor(Math.random() * 20),
    joinDate: new Date(2022, Math.floor(index / 8), (index % 28) + 1).toISOString().split('T')[0],
    lastActive: new Date(2023, Math.floor(index / 4), (index % 28) + 1).toISOString().split('T')[0],
  }));
  
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true
    },
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      render: (value: string, row: Employer) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
            <Building size={14} />
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
      key: 'industry',
      header: 'Industry',
      sortable: true
    },
    {
      key: 'size',
      header: 'Company Size',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Employer['status']) => {
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          suspended: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'jobsPosted',
      header: 'Jobs Posted',
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'joinDate',
      header: 'Join Date',
      sortable: true
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      sortable: true
    }
  ];
  
  const rowActions = (row: Employer) => (
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
        title="Employer Management"
        description="View and manage all employer companies"
        backLink="/users"
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
              Add Employer
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
          title="All Employers"
          subtitle="Showing all registered employer companies in the system"
          data={employers}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: employers.length,
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

export default UserEmployers;