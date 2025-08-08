import React from 'react';
import { 
  Home, 
  Target, 
  Trophy, 
  Users, 
  FileText,
  Settings,
  HelpCircle,
  MessageCircle,
  Activity
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'assessment', label: 'Skill Assessment', icon: Target },
    { id: 'hackathons', label: 'Hackathons', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
  ];

  return (
    <aside className="w-64 bg-white shadow-xl border-r border-gray-200 min-h-screen sticky top-0 left-0 overflow-y-auto transition-all duration-300">
      <div className="p-6">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm transform translate-x-1'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'} transition-colors duration-300`}>
                  <Icon 
                    size={18} 
                    className={isActive ? 'text-blue-600' : 'text-gray-500'} 
                  />
                </div>
                <span className={`font-medium transition-all duration-300 ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-l-full"></div>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className="pt-8 mt-8 border-t border-gray-200">
          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm transition-all duration-300">
              <div className="p-2 rounded-lg bg-gray-100 transition-colors duration-300">
                <Settings size={18} className="text-gray-500" />
              </div>
              <span className="font-medium text-gray-700">Settings</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm transition-all duration-300">
              <div className="p-2 rounded-lg bg-gray-100 transition-colors duration-300">
                <HelpCircle size={18} className="text-gray-500" />
              </div>
              <span className="font-medium text-gray-700">Help & Support</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
}