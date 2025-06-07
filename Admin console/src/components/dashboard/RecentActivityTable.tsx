import React from 'react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Clock, User, CreditCard, Truck, Settings } from 'lucide-react';

interface Activity {
  id: number;
  type: 'user' | 'payment' | 'vendor' | 'system';
  description: string;
  time: string;
}

const activities: Activity[] = [
  { 
    id: 1, 
    type: 'user', 
    description: 'New employer "Tech Solutions Inc." registered', 
    time: '10 minutes ago' 
  },
  { 
    id: 2, 
    type: 'payment', 
    description: 'Payment of $1,500 processed for invoice #INV-2023-004', 
    time: '1 hour ago' 
  },
  { 
    id: 3, 
    type: 'vendor', 
    description: 'Vendor "Logistics Partners" updated their information', 
    time: '3 hours ago' 
  },
  { 
    id: 4, 
    type: 'system', 
    description: 'System maintenance completed successfully', 
    time: '5 hours ago' 
  },
  { 
    id: 5, 
    type: 'user', 
    description: 'User John Doe updated profile information', 
    time: '8 hours ago' 
  },
];

const ActivityIcon: React.FC<{ type: Activity['type'] }> = ({ type }) => {
  const iconMap = {
    user: <User size={16} />,
    payment: <CreditCard size={16} />,
    vendor: <Truck size={16} />,
    system: <Settings size={16} />
  };

  const colorMap = {
    user: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    vendor: 'bg-purple-100 text-purple-600',
    system: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorMap[type]}`}>
      {iconMap[type]}
    </div>
  );
};

const RecentActivityTable: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader 
        title="Recent Activity" 
        action={<Button variant="ghost" size="sm">View All</Button>}
      />
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start px-6 py-4 hover:bg-gray-50 transition-colors">
              <ActivityIcon type={activity.type} />
              <div className="ml-4 flex-1">
                <p className="text-sm text-gray-800">{activity.description}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityTable;