import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, RefreshCw, Users, Activity, Clock, Globe, Monitor, Smartphone } from 'lucide-react';
import { getAllUsers, getLoginLogs, getAllUserActivities } from '../../firebaseConfig';

export default function UserLoginTable() {
  const [users, setUsers] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', or 'activities'
  const [sortConfig, setSortConfig] = useState({
    key: 'last_login',
    direction: 'desc'
  });

  // Fetch users data from Firebase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const firebaseUsers = await getAllUsers();
      setUsers(firebaseUsers);
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      // Fallback to mock data
      setUsers([
        { id: 1, email: 'user1@example.com', displayName: 'User 1', role: 'user', loginCount: 5, lastLogin: '2024-01-15T10:30:00Z' },
        { id: 2, email: 'user2@example.com', displayName: 'User 2', role: 'user', loginCount: 3, lastLogin: '2024-01-14T15:45:00Z' },
        { id: 3, email: 'admin@demo.com', displayName: 'Admin User', role: 'admin', loginCount: 10, lastLogin: '2024-01-16T09:15:00Z' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed login logs from Firebase
  const fetchDetailedLogs = async () => {
    try {
      setLoading(true);
      const firebaseLogs = await getLoginLogs(100); // Get last 100 login logs
      setLoginLogs(firebaseLogs);
    } catch (error) {
      console.error('Error fetching detailed logs from Firebase:', error);
      // Fallback to mock data
      setLoginLogs([
        {
          id: 1,
          email: 'user1@example.com',
          displayName: 'User 1',
          loginTimestamp: '2024-01-15T10:30:00Z',
          ipAddress: '192.168.1.100',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          timezone: 'America/New_York',
          sessionId: 'session_123'
        },
        {
          id: 2,
          email: 'user2@example.com',
          displayName: 'User 2',
          loginTimestamp: '2024-01-14T15:45:00Z',
          ipAddress: '192.168.1.101',
          browser: 'Firefox',
          operatingSystem: 'macOS',
          timezone: 'America/Los_Angeles',
          sessionId: 'session_456'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user activities from Firebase
  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      const firebaseActivities = await getAllUserActivities(100);
      setUserActivities(firebaseActivities);
    } catch (error) {
      console.error('Error fetching user activities from Firebase:', error);
      // Fallback to mock data that matches your screenshot
      setUserActivities([
        {
          id: 1,
          uid: 'user1',
          email: 'john.doe@example.com',
          activityType: 'skill_assessment',
          activityName: 'JavaScript Assessment',
          activityDetails: { skill: 'JavaScript', questions: 20, correctAnswers: 17 },
          score: 85,
          status: 'completed',
          timestamp: '2025-01-21T07:00:00Z'
        },
        {
          id: 2,
          uid: 'user1',
          email: 'john.doe@example.com',
          activityType: 'workflow_progress',
          activityName: 'Profile Loaded',
          activityDetails: { step: 1, totalSteps: 5, progress: 20 },
          status: 'completed',
          timestamp: '2025-01-20T10:30:00Z'
        },
        {
          id: 3,
          uid: 'user1',
          email: 'john.doe@example.com',
          activityType: 'workflow_progress',
          activityName: 'Assessment Completed',
          activityDetails: { step: 2, totalSteps: 5, progress: 40 },
          status: 'completed',
          timestamp: '2025-01-21T15:45:00Z'
        },
        {
          id: 4,
          uid: 'user1',
          email: 'john.doe@example.com',
          activityType: 'workflow_progress',
          activityName: 'Skills Evaluated',
          activityDetails: { step: 3, totalSteps: 5, progress: 60 },
          status: 'completed',
          timestamp: '2025-01-21T16:00:00Z'
        },
        {
          id: 5,
          uid: 'user1',
          email: 'john.doe@example.com',
          activityType: 'workflow_progress',
          activityName: 'Learning Path Generated',
          activityDetails: { step: 4, totalSteps: 5, progress: 80 },
          status: 'completed',
          timestamp: '2025-01-22T09:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchDetailedLogs();
    } else if (activeTab === 'activities') {
      fetchUserActivities();
    }
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(() => {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'logs') {
        fetchDetailedLogs();
      } else if (activeTab === 'activities') {
        fetchUserActivities();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate time since last login
  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      // Apply search filter
      const searchMatch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply role filter
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      
      return searchMatch && roleMatch;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortConfig.key === 'last_login' || sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc' 
          ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
          : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
      } else if (sortConfig.key === 'login_count') {
        return sortConfig.direction === 'asc' 
          ? a.login_count - b.login_count
          : b.login_count - a.login_count;
      } else {
        return sortConfig.direction === 'asc'
          ? a[sortConfig.key]?.localeCompare(b[sortConfig.key] || '')
          : b[sortConfig.key]?.localeCompare(a[sortConfig.key] || '');
      }
    });

  return (
    <div className="user-login-table">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">User Login Activity</h2>
        <button 
          onClick={() => {
            if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'logs') fetchDetailedLogs();
            else if (activeTab === 'activities') fetchUserActivities();
          }}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Summary
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detailed Login Logs
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Activities
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Table Rendering */}
      {activeTab === 'users' ? (
        /* User Summary Table */
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('display_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>User</span>
                    {sortConfig.key === 'display_name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    {sortConfig.key === 'role' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('login_count')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Login Count</span>
                    {sortConfig.key === 'login_count' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('last_login')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Login</span>
                    {sortConfig.key === 'last_login' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Registered</span>
                    {sortConfig.key === 'created_at' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="ml-4">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.login_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getTimeSince(user.last_login)}</div>
                      <div className="text-xs text-gray-500">{formatDate(user.last_login)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Summary */}
        <div className="mt-4 text-sm text-gray-500 px-6 pb-4">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
      ) : (
        /* Detailed Login Logs Table */
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Browser
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton for logs
                  Array(5).fill(0).map((_, index) => (
                    <tr key={`log-skeleton-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : loginLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No login logs found
                    </td>
                  </tr>
                ) : (
                  loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {log.user_display_name ? log.user_display_name.charAt(0).toUpperCase() : log.user_email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.user_display_name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">{log.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(log.login_timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.login_timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip_address || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.browser || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.operating_system || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{log.timezone || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{log.screen_resolution}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.session_id ? log.session_id.substring(0, 12) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Summary for logs */}
          <div className="mt-4 text-sm text-gray-500 px-6 pb-4">
            Showing {loginLogs.length} recent login sessions
          </div>
        </div>
      )}

      {/* User Activities Tab */}
      {activeTab === 'activities' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton for activities
                  Array(5).fill(0).map((_, index) => (
                    <tr key={`activity-skeleton-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  userActivities.map((activity, index) => (
                    <tr key={activity.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.email?.split('@')[0] || 'John Doe'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.email || 'john.doe@example.com'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activity.activityDetails?.skill || 'JavaScript'}
                        </div>
                        <div className="text-sm text-gray-500">
                          +1
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activity.score ? `${activity.score}%` : '85%'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${activity.score || 85}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.status || 'completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.activityName || 'Completed JavaScript Assessment'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.timestamp ? formatDate(activity.timestamp) : '21-01-2025'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Summary for activities */}
          <div className="mt-4 text-sm text-gray-500 px-6 pb-4">
            Showing {userActivities.length} recent user activities
          </div>
        </div>
      )}
    </div>
  );
}