import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Activity, Settings, LogOut } from 'lucide-react';
import RecentActivityTable from '../analytics/components/RecentActivityTable';
import ChatBox from '../analytics/components/ChatBox';
import ChatInteractions from '../analytics/components/ChatInteractions';
import HackathonManagement from '../analytics/components/HackathonManagement';
import UserLoginTable from '../analytics/components/UserLoginTable';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    assessmentsCompleted: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dashboard metrics from API
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8002/api/dashboard/metrics');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard metrics: ${response.status}`);
        }
        
        const data = await response.json();
        setStats({
          totalUsers: data.total_users,
          activeUsers: data.active_users,
          assessmentsCompleted: data.assessments_completed,
          averageScore: data.average_score
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError('Failed to load dashboard metrics. Using default values.');
        // Use default values if API fails
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          assessmentsCompleted: 3456,
          averageScore: 78.5
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardMetrics();
    
    // Refresh metrics every 5 minutes
    const intervalId = setInterval(fetchDashboardMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'hackathons', label: 'Hackathons', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.displayName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {error && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+12%</span>
                  </div>
                </div>
                <div className="metrics-title">Total Users</div>
                {loading ? (
                  <div className="metrics-value flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="metrics-value">{stats.totalUsers.toLocaleString()}</div>
                )}
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity size={20} className="text-green-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+8%</span>
                  </div>
                </div>
                <div className="metrics-title">Active Users</div>
                {loading ? (
                  <div className="metrics-value flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="metrics-value">{stats.activeUsers.toLocaleString()}</div>
                )}
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award size={20} className="text-yellow-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+15%</span>
                  </div>
                </div>
                <div className="metrics-title">Assessments</div>
                {loading ? (
                  <div className="metrics-value flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="metrics-value">{stats.assessmentsCompleted.toLocaleString()}</div>
                )}
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp size={20} className="text-purple-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+5%</span>
                  </div>
                </div>
                <div className="metrics-title">Avg Score</div>
                {loading ? (
                  <div className="metrics-value flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="metrics-value">{stats.averageScore}%</div>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Recent Activity</h2>
                    <p className="card-subtitle">Latest user activities and assessments</p>
                  </div>
                  <RecentActivityTable />
                </div>
              </div>

              {/* Quick Actions and Admin Chat */}
              <div className="space-y-6">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full btn btn-primary">
                      Add New User
                    </button>
                    <button className="w-full btn btn-secondary">
                      Create Assessment
                    </button>
                    <button className="w-full btn btn-secondary">
                      Schedule Hackathon
                    </button>
                    <button className="w-full btn btn-secondary">
                      Generate Report
                    </button>
                  </div>
                </div>

                {/* Admin AI Assistant */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Admin AI Assistant</h2>
                    <p className="card-subtitle">Get help with administrative tasks</p>
                  </div>
                  <div className="p-4">
                    <ChatBox user={user} trackUserInteraction={false} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Platform Status</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Server Status</span>
                      <span className="badge badge-success">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <span className="badge badge-success">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Services</span>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Backup</span>
                      <span className="text-sm text-gray-900">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">User Management</h2>
                <p className="card-subtitle">Manage platform users and their access</p>
              </div>
              <div className="p-6">
                <UserLoginTable />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Analytics Dashboard</h2>
                <p className="card-subtitle">Detailed platform analytics and insights</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="metrics-title">Total Interactions</div>
                  <div className="metrics-value">1,248</div>
                  <div className="metrics-subtitle">User-AI conversations</div>
                </div>
                
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity size={20} className="text-green-600" />
                    </div>
                  </div>
                  <div className="metrics-title">Avg. Response Time</div>
                  <div className="metrics-value">1.8s</div>
                  <div className="metrics-subtitle">AI response latency</div>
                </div>
                
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp size={20} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="metrics-title">User Satisfaction</div>
                  <div className="metrics-value">92%</div>
                  <div className="metrics-subtitle">Based on feedback</div>
                </div>
              </div>
            </div>
            
            {/* Chat Interactions Section */}
            <div className="card">
              <ChatInteractions />
            </div>
          </div>
        )}

        {activeTab === 'hackathons' && (
          <div className="card">
            <HackathonManagement />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Platform Settings</h2>
              <p className="card-subtitle">Configure platform settings and preferences</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500">Settings interface coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}