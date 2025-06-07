import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    teal: 'bg-teal-50 text-teal-700'
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        
        <div className="flex items-end">
          <div className="text-2xl font-semibold text-gray-800">{value}</div>
          
          {change && (
            <div className={`ml-2 flex items-center text-sm ${
              change.type === 'increase' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {change.type === 'increase' ? (
                <ArrowUp size={16} className="mr-1" />
              ) : (
                <ArrowDown size={16} className="mr-1" />
              )}
              {change.value}%
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;