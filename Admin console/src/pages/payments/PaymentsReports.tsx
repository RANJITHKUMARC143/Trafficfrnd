import React, { useState } from 'react';
import { FileText, FileDown, Calendar, DollarSign, BarChart2, PieChart, TrendingUp, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';

const PaymentsReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedReport, setSelectedReport] = useState<'revenue' | 'transactions' | 'invoices'>('revenue');
  
  // Mock data for charts
  const getMonthName = (month: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };
  
  // Generate revenue data for the chart
  const revenueData = Array.from({ length: 6 }).map((_, i) => {
    const month = (new Date().getMonth() - 5 + i + 12) % 12;
    return {
      month: getMonthName(month),
      total: Math.floor(Math.random() * 50000) + 20000,
      growth: (Math.random() * 20 - 5).toFixed(1)
    };
  });
  
  const transactionData = [
    { type: 'Employer Subscriptions', percentage: 45, value: 452000 },
    { type: 'Job Postings', percentage: 30, value: 301500 },
    { type: 'Resume Access', percentage: 15, value: 150750 },
    { type: 'Premium Services', percentage: 10, value: 100500 }
  ];
  
  const summaryMetrics = [
    {
      title: 'Total Revenue',
      value: '$1,004,750',
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      title: 'Average Transaction',
      value: '$532',
      change: '+5.8%',
      changeType: 'positive'
    },
    {
      title: 'Payment Success Rate',
      value: '98.2%',
      change: '+1.5%',
      changeType: 'positive'
    },
    {
      title: 'Refund Rate',
      value: '1.3%',
      change: '-0.4%',
      changeType: 'positive'
    }
  ];
  
  const availableReports = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Overview of all revenue streams with trends and growth analysis',
      icon: <DollarSign size={20} />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'transactions',
      title: 'Transaction Report',
      description: 'Detailed breakdown of all financial transactions',
      icon: <BarChart2 size={20} />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'invoices',
      title: 'Invoice Report',
      description: 'Analysis of invoicing status, payment times, and outstanding amounts',
      icon: <FileText size={20} />,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'trends',
      title: 'Trend Analysis',
      description: 'Comparative analysis of payment and revenue trends over time',
      icon: <TrendingUp size={20} />,
      color: 'bg-amber-50 text-amber-600'
    }
  ];
  
  return (
    <div>
      <PageHeader
        title="Payment Reports"
        description="Generate and analyze financial reports"
        backLink="/payments"
        actions={
          <>
            <Button 
              variant="secondary"
              size="md"
              icon={<Printer size={16} />}
            >
              Print Report
            </Button>
            <Button 
              variant="primary"
              size="md"
              icon={<FileDown size={16} />}
            >
              Export Data
            </Button>
          </>
        }
      />
      
      {/* Report Controls */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Report Type</h3>
            <div className="flex space-x-2">
              {['revenue', 'transactions', 'invoices'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedReport(type as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedReport === type 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Time Period</h3>
            <div className="flex space-x-2">
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="2023-01-01"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              <span className="text-gray-500">to</span>
              <div className="relative">
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="2023-06-30"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryMetrics.map((metric, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">{metric.title}</h3>
            <div className="flex items-end">
              <div className="text-2xl font-semibold text-gray-800">{metric.value}</div>
              <div className={`ml-2 flex items-center text-sm ${
                metric.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {metric.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Main Report Content */}
      {selectedReport === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader 
                title="Revenue Trend" 
                subtitle={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} revenue overview`}
                action={
                  <Button 
                    variant="ghost"
                    size="sm"
                    icon={<Download size={14} />}
                  >
                    Download
                  </Button>
                }
              />
              <CardContent>
                <div className="h-64 flex items-end justify-between px-2">
                  {revenueData.map((data, index) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center">
                      <div className="relative flex justify-center items-center" style={{ height: '200px' }}>
                        <motion.div 
                          className="w-12 bg-blue-500 rounded-t-sm"
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.total / 70000) * 100}%` }}
                          transition={{ duration: 0.7, delay: index * 0.1 }}
                        ></motion.div>
                        <div className="absolute top-0 -mt-6 text-xs font-medium text-gray-600">
                          {data.growth.startsWith('-') ? (
                            <span className="text-red-500">{data.growth}%</span>
                          ) : (
                            <span className="text-emerald-500">+{data.growth}%</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-600">{data.month}</div>
                        <div className="text-sm font-medium text-gray-800">${(data.total / 1000).toFixed(1)}k</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full">
              <CardHeader 
                title="Revenue Breakdown" 
                subtitle="By transaction type"
              />
              <CardContent>
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative w-40 h-40 mb-4">
                    <PieChart size={160} className="text-gray-200" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-lg font-bold text-gray-800">$1.00M</div>
                      <div className="text-xs text-gray-500">Total Revenue</div>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    {transactionData.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.type}</span>
                          <span className="text-sm text-gray-500">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="h-2 rounded-full" 
                            style={{ backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          ></motion.div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">${(item.value / 1000).toFixed(1)}k</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {selectedReport === 'transactions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Report</h3>
          <p className="text-gray-600 mb-6">This report shows detailed transaction data for the selected period. You can export the full data for further analysis.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {['January', 'February', 'March', 'April', 'May', 'June'].map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{month} 2023</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">All Types</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{Math.floor(Math.random() * 500) + 300}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${(Math.floor(Math.random() * 200000) + 50000).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(Math.random() * 2 + 97).toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${(Math.floor(Math.random() * 300) + 200).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">2,432</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">$1,004,750</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">98.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">$413</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
      {selectedReport === 'invoices' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Report</h3>
          <p className="text-gray-600 mb-6">This report provides an overview of invoice status and payment collection efficiency.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Invoice Status Distribution</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Paid</span>
                    <span className="text-sm text-gray-500">70%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '70%' }}
                      transition={{ duration: 1 }}
                    ></motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Pending</span>
                    <span className="text-sm text-gray-500">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '20%' }}
                      transition={{ duration: 1, delay: 0.2 }}
                    ></motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Overdue</span>
                    <span className="text-sm text-gray-500">8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-red-500 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '8%' }}
                      transition={{ duration: 1, delay: 0.4 }}
                    ></motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Cancelled</span>
                    <span className="text-sm text-gray-500">2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-gray-500 h-2 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: '2%' }}
                      transition={{ duration: 1, delay: 0.6 }}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Collection Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Average Days to Payment</div>
                  <div className="text-xl font-semibold text-gray-800">12.4</div>
                  <div className="text-xs text-emerald-600 mt-1">-2.1 days vs. last period</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Collection Rate</div>
                  <div className="text-xl font-semibold text-gray-800">94.8%</div>
                  <div className="text-xs text-emerald-600 mt-1">+1.3% vs. last period</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Overdue Invoices</div>
                  <div className="text-xl font-semibold text-gray-800">42</div>
                  <div className="text-xs text-red-600 mt-1">+5 vs. last period</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Disputed Invoices</div>
                  <div className="text-xl font-semibold text-gray-800">3</div>
                  <div className="text-xs text-emerald-600 mt-1">-2 vs. last period</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Invoice Trends</h4>
            <div className="h-64 flex items-end justify-between px-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                const totalHeight = 90 - (index % 3) * 10;
                const paidHeight = totalHeight * (0.65 + (index % 3) * 0.05);
                
                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full relative flex items-end justify-center" style={{ height: '200px' }}>
                      <motion.div 
                        className="w-12 bg-gray-300 rounded-t-sm"
                        initial={{ height: 0 }}
                        animate={{ height: `${totalHeight}%` }}
                        transition={{ duration: 0.7, delay: index * 0.1 }}
                      ></motion.div>
                      <motion.div 
                        className="w-12 bg-emerald-500 rounded-t-sm absolute"
                        initial={{ height: 0 }}
                        animate={{ height: `${paidHeight}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + index * 0.1 }}
                      ></motion.div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">{month}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                <span className="text-sm text-gray-600">Paid</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                <span className="text-sm text-gray-600">Total Invoiced</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Available Reports */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableReports.map((report, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
              whileHover={{ y: -4 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => setSelectedReport(report.id as any)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                    {report.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileDown size={14} />}
                  className="text-blue-600"
                >
                  Generate Report
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsReports;