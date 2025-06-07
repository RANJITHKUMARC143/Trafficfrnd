import React, { useState } from 'react';
import { UserPlus, FileDown, Filter, Edit, Trash, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'inactive';
  registrationDate: string;
  lastActivity: string;
  skills: string[];
}

const UserCandidates: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock data
  const candidates: Candidate[] = Array.from({ length: 50 }).map((_, index) => ({
    id: `C${1000 + index}`,
    name: `Candidate ${index + 1}`,
    email: `candidate${index + 1}@example.com`,
    phone: `+1 (555) ${100 + index}-${1000 + index}`,
    status: index % 5 === 0 ? 'pending' : (index % 10 === 0 ? 'inactive' : 'active'),
    registrationDate: new Date(2023, Math.floor(index / 10), (index % 28) + 1).toISOString().split('T')[0],
    lastActivity: new Date(2023, Math.floor(index / 5), (index % 28) + 1).toISOString().split('T')[0],
    skills: [
      'JavaScript',
      'React',
      'Node.js',
      'Python',
      'SQL',
      'UI/UX Design',
      'Project Management',
      'Marketing'
    ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1)
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
      render: (value: string, row: Candidate) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Candidate['status']) => {
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
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
      key: 'phone',
      header: 'Phone',
      sortable: true
    },
    {
      key: 'registrationDate',
      header: 'Registration Date',
      sortable: true
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      sortable: true
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((skill, index) => (
            <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              {skill}
            </span>
          ))}
        </div>
      )
    }
  ];
  
  const rowActions = (row: Candidate) => (
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
        title="Candidate Management"
        description="View and manage all job seekers"
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
              icon={<UserPlus size={16} />}
            >
              Add Candidate
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
          title="All Candidates"
          subtitle="Showing all registered candidates in the system"
          data={candidates}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: candidates.length,
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

export default UserCandidates;