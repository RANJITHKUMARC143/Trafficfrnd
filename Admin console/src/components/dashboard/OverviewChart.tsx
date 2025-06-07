import React from 'react';
import Card, { CardHeader, CardContent } from '../ui/Card';

// This is a simplified chart component
// In a real application, you would use a charting library like Chart.js or Recharts
const OverviewChart: React.FC = () => {
  // Mock data for the chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = [35, 45, 30, 60, 50, 75];
  const maxValue = Math.max(...values);
  
  return (
    <Card className="h-full">
      <CardHeader 
        title="Performance Overview" 
        subtitle="Monthly user acquisition metrics"
        action={
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Users</span>
            </div>
            <select className="text-sm border-gray-300 rounded-md">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
        }
      />
      <CardContent className="pb-6">
        <div className="h-64 flex items-end justify-between px-2">
          {values.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t-sm mx-1 transition-all duration-500 ease-in-out hover:bg-blue-600"
                style={{ 
                  height: `${(value / maxValue) * 100}%`,
                  maxWidth: '40px',
                  margin: '0 auto'
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2">{months[index]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverviewChart;