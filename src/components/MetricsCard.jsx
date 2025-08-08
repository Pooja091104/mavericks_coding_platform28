import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricsCard({ title, value, change, changeType = 'positive', icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg p-6 border border-gray-100 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{value}</h3>
          
          {change && (
            <div className="flex items-center mt-2 bg-gray-50 px-2 py-1 rounded-lg inline-block">
              {changeType === 'positive' ? (
                <TrendingUp size={16} className="text-green-500 mr-1" />
              ) : (
                <TrendingDown size={16} className="text-red-500 mr-1" />
              )}
              <span 
                className={`text-xs font-medium ${
                  changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
            <Icon size={24} className="text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}