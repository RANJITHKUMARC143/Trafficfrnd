import React, { useState } from 'react';
import { Shield, UserPlus, FileDown, Filter, Edit, Trash, User, Mail, Key } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

const UserAdmins: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // TODO: Fetch admins from backend API
  const admins: Admin[] = [];
  
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
      render: (value: string, row: Admin) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
            <User size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <Mail size={10} className="mr-1" /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (value: Admin['role']) => {
        const roleStyles = {
          super_admin: 'bg-red-100 text-red-800',
          admin: 'bg-purple-100 text-purple-800',
          moderator: 'bg-blue-100 text-blue-800',
          analyst: 'bg-green-100 text-green-800'
        };
        
        const roleNames = {
          super_admin: 'Super Admin',
          admin: 'Admin',
          moderator: 'Moderator',
          analyst: 'Analyst'
        };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${roleStyles[value]}`}>
            {roleNames[value]}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Admin['status']) => {
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((permission, index) => (
            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
              {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          ))}
          {value.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
              +{value.length - 2} more
            </span>
          )}
        </div>
      )
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true
    }
  ];
  
  const rowActions = (row: Admin) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<Key size={14} />}
      >
        Permissions
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Edit size={14} />}
      >
        Edit
      </Button>
      {row.role !== 'super_admin' && (
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash size={14} />}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
      )}
    </div>
  );
  
  return (
    <div>
      <PageHeader
        title="Administrator Management"
        description="View and manage system administrators and their permissions"
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
              icon={<Shield size={16} />}
            >
              Add Administrator
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
          title="All Administrators"
          subtitle="Showing all system administrators with special privileges"
          data={admins}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: admins.length,
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

export default UserAdmins;