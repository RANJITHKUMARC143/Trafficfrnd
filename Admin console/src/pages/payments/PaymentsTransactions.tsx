import React, { useState } from 'react';
import { CreditCard, FileDown, Filter, Eye, ArrowRight, DollarSign, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';

interface Transaction {
  id: string;
  description: string;
  type: 'subscription' | 'one-time' | 'refund';
  amount: number;
  currency: string;
  date: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

const PaymentsTransactions: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock data
  const transactions: Transaction[] = Array.from({ length: 50 }).map((_, index) => ({
    id: `TRX${10000 + index}`,
    description: [
      'Premium Job Posting',
      'Resume Database Access - 1 Month',
      'Featured Employer Package',
      'Candidate Spotlight',
      'Background Check Service',
      'Profile Verification',
      'Job Boost - 7 Days',
    ][index % 7],
    type: index % 10 === 0 ? 'refund' : (index % 3 === 0 ? 'subscription' : 'one-time'),
    amount: index % 10 === 0 ? -(Math.floor(Math.random() * 200) + 50) : (Math.floor(Math.random() * 500) + 50),
    currency: 'USD',
    date: new Date(2023, 5, 30 - (index % 30)).toISOString().split('T')[0],
    customer: {
      id: `CUS${1000 + Math.floor(index / 2)}`,
      name: `Customer ${1000 + Math.floor(index / 2)}`,
      email: `customer${1000 + Math.floor(index / 2)}@example.com`,
    },
    paymentMethod: ['Credit Card', 'PayPal', 'Bank Transfer', 'Apple Pay'][index % 4],
    status: index % 15 === 0 ? 'failed' : (index % 10 === 0 ? 'refunded' : (index % 7 === 0 ? 'pending' : 'completed')),
  }));
  
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <Calendar size={14} className="mr-2 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (value: string, row: Transaction) => (
        <div>
          <div className="font-medium text-gray-800">{value}</div>
          <div className="text-xs text-gray-500">
            {row.type === 'subscription' ? 'Subscription' : row.type === 'refund' ? 'Refund' : 'One-time payment'}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (value: Transaction['customer']) => (
        <div>
          <div className="text-sm font-medium text-gray-800">{value.name}</div>
          <div className="text-xs text-gray-500">{value.email}</div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (value: number, row: Transaction) => (
        <div className={`text-sm font-semibold ${value < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {value < 0 ? '-' : ''}{row.currency} {Math.abs(value).toFixed(2)}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <CreditCard size={14} className="mr-2 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Transaction['status']) => {
        const statusStyles = {
          completed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          failed: 'bg-red-100 text-red-800',
          refunded: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
  ];
  
  const rowActions = (row: Transaction) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
      >
        View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<FileText size={14} />}
        className="text-blue-600"
      >
        Receipt
      </Button>
    </div>
  );
  
  // Calculate statistics
  const totalAmount = transactions
    .filter(t => t.status === 'completed' || t.status === 'refunded')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const failedAmount = transactions
    .filter(t => t.status === 'failed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const stats = [
    {
      label: 'Total Processed',
      value: `$${totalAmount.toFixed(2)}`,
      icon: <DollarSign size={18} />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Pending',
      value: `$${pendingAmount.toFixed(2)}`,
      icon: <ArrowRight size={18} />,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      label: 'Failed',
      value: `$${failedAmount.toFixed(2)}`,
      icon: <CreditCard size={18} />,
      color: 'bg-red-100 text-red-600'
    }
  ];
  
  return (
    <div>
      <PageHeader
        title="Transaction Management"
        description="View and manage all payment transactions"
        backLink="/payments"
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
              icon={<CreditCard size={16} />}
            >
              Process Payment
            </Button>
          </>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="ml-2 text-sm text-gray-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DataTable
          title="All Transactions"
          subtitle="Showing all payment transactions in the system"
          data={transactions}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: transactions.length,
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

export default PaymentsTransactions;