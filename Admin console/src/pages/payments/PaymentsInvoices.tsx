import React, { useState } from 'react';
import { FileText, FileDown, Filter, Eye, Calendar, DollarSign, Building2, CreditCard, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';

interface Invoice {
  id: string;
  customerName: string;
  customerType: 'employer' | 'vendor' | 'candidate';
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  paymentDate?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const PaymentsInvoices: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // TODO: Fetch invoices from backend API
  const invoices: Invoice[] = [];
  
  const columns = [
    {
      key: 'id',
      header: 'Invoice #',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-blue-600">{value}</div>
      )
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (value: string, row: Invoice) => (
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            row.customerType === 'employer' ? 'bg-blue-100 text-blue-600' : 
            row.customerType === 'vendor' ? 'bg-emerald-100 text-emerald-600' : 
            'bg-purple-100 text-purple-600'
          }`}>
            {row.customerType === 'employer' ? <Building2 size={14} /> : 
             row.customerType === 'vendor' ? <CreditCard size={14} /> : 
             <FileText size={14} />}
          </div>
          <div>
            <div className="font-medium text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">
              {row.customerType.charAt(0).toUpperCase() + row.customerType.slice(1)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <Calendar size={14} className="mr-1.5 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center font-medium text-gray-800">
          <DollarSign size={14} className="mr-0.5" />
          {value.toFixed(2)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Invoice['status']) => {
        const statusStyles = {
          paid: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          overdue: 'bg-red-100 text-red-800',
          cancelled: 'bg-gray-100 text-gray-800'
        };
        
        const statusIcons = {
          paid: <DollarSign size={12} />,
          pending: <Calendar size={12} />,
          overdue: <ExternalLink size={12} />,
          cancelled: <FileText size={12} />
        };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center ${statusStyles[value]}`}>
            <span className="mr-1">{statusIcons[value]}</span>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      sortable: true,
      render: (value: string | undefined) => (
        value ? <span>{value}</span> : <span className="text-gray-400">-</span>
      )
    },
  ];
  
  const rowActions = (row: Invoice) => (
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
        icon={<Download size={14} />}
        className="text-blue-600"
      >
        Download
      </Button>
    </div>
  );
  
  // Calculate statistics
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
    
  const totalPending = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);
    
  const totalOverdue = invoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const stats = [
    {
      label: 'Total Paid',
      value: `$${totalPaid.toFixed(2)}`,
      icon: <DollarSign size={18} />,
      color: 'bg-green-100 text-green-600'
    },
    {
      label: 'Pending',
      value: `$${totalPending.toFixed(2)}`,
      icon: <Calendar size={18} />,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      label: 'Overdue',
      value: `$${totalOverdue.toFixed(2)}`,
      icon: <ExternalLink size={18} />,
      color: 'bg-red-100 text-red-600'
    }
  ];
  
  const getMonthName = (month: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };
  
  // Generate monthly invoice data for the chart
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const month = (new Date().getMonth() - 5 + i + 12) % 12;
    return {
      month: getMonthName(month),
      paid: Math.floor(Math.random() * 50000) + 20000,
      pending: Math.floor(Math.random() * 15000) + 5000,
    };
  });
  
  return (
    <div>
      <PageHeader
        title="Invoice Management"
        description="View and manage all customer invoices"
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
              icon={<FileText size={16} />}
            >
              Create Invoice
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
      
      {/* Monthly Invoices Chart */}
      <div className="mb-6">
        <Card>
          <CardHeader 
            title="Monthly Invoice Overview" 
            subtitle="Last 6 months"
            action={
              <select className="text-sm border-gray-300 rounded-md">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>Year to date</option>
              </select>
            }
          />
          <CardContent>
            <div className="h-64 flex items-end justify-between px-2">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative flex items-end" style={{ height: '200px' }}>
                    <motion.div 
                      className="w-10 bg-blue-500 rounded-t-sm mx-auto"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.paid / 70000) * 100}%` }}
                      transition={{ duration: 0.7, delay: index * 0.1 }}
                    ></motion.div>
                    <motion.div 
                      className="w-10 bg-yellow-400 rounded-t-sm mx-auto absolute"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.pending / 70000) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + index * 0.1 }}
                      style={{ opacity: 0.7 }}
                    ></motion.div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{data.month}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-600">Paid</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DataTable
          title="All Invoices"
          subtitle="Showing all customer invoices in the system"
          data={invoices}
          columns={columns}
          rowActions={rowActions}
          searchable={true}
          filterable={true}
          pagination={{
            itemsPerPage: 10,
            totalItems: invoices.length,
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
      
      {/* Invoice Distribution */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader 
              title="By Customer Type" 
              subtitle="Distribution of invoices by customer category"
            />
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Employers</span>
                    <span className="text-sm text-gray-500">60%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 1 }}
                    ></motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Vendors</span>
                    <span className="text-sm text-gray-500">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      transition={{ duration: 1, delay: 0.2 }}
                    ></motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Candidates</span>
                    <span className="text-sm text-gray-500">15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-purple-500 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '15%' }}
                      transition={{ duration: 1, delay: 0.4 }}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader 
              title="By Status" 
              subtitle="Current status of all invoices"
            />
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    {/* Background circles */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#eee"
                      strokeWidth="3"
                    />
                    
                    {/* Paid segment - 70% */}
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeDasharray="70, 100"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: "70, 100" }}
                      transition={{ duration: 1.5 }}
                    />
                    
                    {/* Pending segment - 20% */}
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="3"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-70"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: "20, 100" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    
                    {/* Overdue segment - 10% */}
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeDasharray="10, 100"
                      strokeDashoffset="-90"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: "10, 100" }}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold text-gray-800">100%</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
                
                <div className="ml-6">
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Paid</span>
                    </div>
                    <div className="text-xl font-semibold text-gray-800">70%</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                      <span>Pending</span>
                    </div>
                    <div className="text-xl font-semibold text-gray-800">20%</div>
                  </div>
                  
                  <div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span>Overdue</span>
                    </div>
                    <div className="text-xl font-semibold text-gray-800">10%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentsInvoices;