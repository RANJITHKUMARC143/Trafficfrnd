import React, { useState } from 'react';
import { Megaphone, CalendarDays, TrendingUp, ArrowRight, Plus, BarChart3, LineChart, PieChart, FileEdit, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  type: 'email' | 'social' | 'advertisement' | 'event' | 'promotion';
  startDate: string;
  endDate: string;
  budget?: number;
  reach: number;
  conversion: number;
  roi?: number;
}

const Campaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed' | 'all'>('active');
  
  const campaigns: Campaign[] = [
    {
      id: 'CAM001',
      name: 'Summer Job Fair 2023',
      status: 'active',
      type: 'event',
      startDate: '2023-06-01',
      endDate: '2023-06-30',
      budget: 5000,
      reach: 15000,
      conversion: 12.5,
      roi: 2.8
    },
    {
      id: 'CAM002',
      name: 'Graduate Recruitment Campaign',
      status: 'active',
      type: 'advertisement',
      startDate: '2023-05-15',
      endDate: '2023-07-15',
      budget: 8000,
      reach: 25000,
      conversion: 8.2,
      roi: 1.9
    },
    {
      id: 'CAM003',
      name: 'Tech Talent Attraction',
      status: 'scheduled',
      type: 'social',
      startDate: '2023-07-01',
      endDate: '2023-08-31',
      budget: 6000,
      reach: 0,
      conversion: 0
    },
    {
      id: 'CAM004',
      name: 'Healthcare Professionals Recruitment',
      status: 'completed',
      type: 'email',
      startDate: '2023-03-01',
      endDate: '2023-04-30',
      budget: 3500,
      reach: 12000,
      conversion: 10.8,
      roi: 2.4
    },
    {
      id: 'CAM005',
      name: 'Remote Work Opportunities',
      status: 'draft',
      type: 'advertisement',
      startDate: '',
      endDate: '',
      reach: 0,
      conversion: 0
    },
    {
      id: 'CAM006',
      name: 'Seasonal Hiring Promotion',
      status: 'scheduled',
      type: 'promotion',
      startDate: '2023-08-15',
      endDate: '2023-10-15',
      budget: 4500,
      reach: 0,
      conversion: 0
    },
  ];
  
  const filteredCampaigns = activeTab === 'all'
    ? campaigns
    : campaigns.filter(campaign => campaign.status === activeTab);
  
  const campaignStats = [
    { 
      label: 'Active Campaigns', 
      value: campaigns.filter(c => c.status === 'active').length,
      icon: <Megaphone size={18} />,
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      label: 'Total Reach', 
      value: campaigns.reduce((sum, campaign) => sum + campaign.reach, 0).toLocaleString(),
      icon: <TrendingUp size={18} />,
      color: 'bg-emerald-100 text-emerald-600' 
    },
    { 
      label: 'Avg. Conversion', 
      value: `${(campaigns.filter(c => c.conversion > 0).reduce((sum, campaign) => sum + campaign.conversion, 0) / campaigns.filter(c => c.conversion > 0).length).toFixed(2)}%`,
      icon: <BarChart3 size={18} />,
      color: 'bg-purple-100 text-purple-600' 
    },
    { 
      label: 'Upcoming Campaigns', 
      value: campaigns.filter(c => c.status === 'scheduled').length,
      icon: <CalendarDays size={18} />,
      color: 'bg-amber-100 text-amber-600' 
    },
  ];
  
  const getCampaignStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCampaignTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail size={16} />;
      case 'social': return <Share2 size={16} />;
      case 'advertisement': return <BarChart2 size={16} />;
      case 'event': return <CalendarDays size={16} />;
      case 'promotion': return <Tag size={16} />;
      default: return <Megaphone size={16} />;
    }
  };
  
  return (
    <div>
      <PageHeader
        title="Campaign Management"
        description="Create and manage marketing campaigns"
        actions={
          <Button 
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
          >
            Create Campaign
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {campaignStats.map((stat, index) => (
          <motion.div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="ml-2 text-sm text-gray-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader 
              title="Campaign Performance" 
              subtitle="Last 6 months performance metrics"
              action={
                <select className="text-sm border-gray-300 rounded-md">
                  <option>Last 6 months</option>
                  <option>Last 12 months</option>
                  <option>Year to date</option>
                </select>
              }
            />
            <CardContent>
              <div className="h-64 flex items-end justify-between px-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                  const reachHeight = [45, 65, 35, 80, 55, 70][index];
                  const conversionHeight = [35, 55, 25, 70, 45, 60][index];
                  
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative flex items-end" style={{ height: '200px' }}>
                        <motion.div 
                          className="w-8 bg-blue-200 rounded-t-sm mx-auto"
                          initial={{ height: 0 }}
                          animate={{ height: `${reachHeight}%` }}
                          transition={{ duration: 0.7, delay: index * 0.1 }}
                        ></motion.div>
                        <motion.div 
                          className="w-8 bg-blue-600 rounded-t-sm mx-auto absolute"
                          initial={{ height: 0 }}
                          animate={{ height: `${conversionHeight}%` }}
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
                  <div className="w-3 h-3 rounded-full bg-blue-200 mr-2"></div>
                  <span className="text-sm text-gray-600">Reach</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Conversion</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader 
              title="Campaign Distribution" 
              subtitle="By campaign type"
            />
            <CardContent className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 mb-4">
                <PieChart size={192} className="text-gray-200" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-2xl font-bold text-gray-800">6</div>
                  <div className="text-sm text-gray-500">Total Campaigns</div>
                </div>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Email (15%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Social (20%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Ads (30%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Events (20%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Promo (15%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Campaign List */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {['active', 'scheduled', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Campaigns
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign, index) => (
                  <motion.tr 
                    key={campaign.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCampaignStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">
                          {getCampaignTypeIcon(campaign.type)}
                        </span>
                        {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.startDate ? (
                        <div className="text-sm text-gray-700">
                          {campaign.startDate} <ArrowRight size={12} className="inline mx-1" /> {campaign.endDate}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.budget ? (
                        <div className="text-sm text-gray-700">${campaign.budget.toLocaleString()}</div>
                      ) : (
                        <span className="text-xs text-gray-500">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.status === 'active' || campaign.status === 'completed' ? (
                        <div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 mr-2">Reach:</span>
                            <span className="font-medium text-gray-800">{campaign.reach.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 mr-2">Conv:</span>
                            <span className="font-medium text-gray-800">{campaign.conversion}%</span>
                          </div>
                          {campaign.roi && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600 mr-2">ROI:</span>
                              <span className="font-medium text-emerald-600">{campaign.roi}x</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No data yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={campaign.status === 'draft' ? <FileEdit size={14} /> : <LineChart size={14} />}
                        >
                          {campaign.status === 'draft' ? 'Edit' : 'Analytics'}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Import missing Lucide icons
const Mail = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const Share2 = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
  </svg>
);

const Tag = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
    <path d="M7 7h.01"></path>
  </svg>
);

export default Campaigns;