import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Clock, User, CreditCard, Truck, Settings } from 'lucide-react';

interface Activity {
  id: string | number;
  type: 'user' | 'payment' | 'vendor' | 'system';
  description: string;
  time: string;
}
 
function formatRelativeTime(dateString: string | number | Date) {
  const now = new Date().getTime();
  const ts = new Date(dateString).getTime();
  const diffMs = Math.max(0, now - ts);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError('');
        const baseUrl = 'https://trafficfrnd-2.onrender.com';
        const token = localStorage.getItem('token') || '';

        // Prefer recent call logs as a general activity feed for now
        const res = await fetch(`${baseUrl}/api/call/logs`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to fetch recent activity');
        const data = await res.json();
        const logs: any[] = data?.logs || [];
        const mapped: Activity[] = logs.map((log) => ({
          id: log._id || log.id,
          type: 'system',
          description: log.note || log.description || `Call log from ${log.caller || 'unknown'}`,
          time: formatRelativeTime(log.createdAt || log.timestamp || new Date())
        }));
        setActivities(mapped.slice(0, 10));
      } catch (e: any) {
        setError(e.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="p-6 text-sm text-gray-500">Loading recent activity…</div>
      );
    }
    if (error) {
      return (
        <div className="p-6 text-sm text-red-600">{error}</div>
      );
    }
    if (!activities.length) {
      return (
        <div className="p-6 text-sm text-gray-500">No recent activity.</div>
      );
    }
    return (
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
    );
  }, [activities, loading, error]);

  return (
    <Card className="h-full">
      <CardHeader 
        title="Recent Activity" 
        action={<Button variant="ghost" size="sm">View All</Button>}
      />
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
};

export default RecentActivityTable;