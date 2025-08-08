import { useState, useEffect } from 'react';
import { getHackathons } from '../../firebaseConfig';

export default function HackathonPanel({ user }) {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    try {
      // For demo purposes, using mock data
      const mockHackathons = [
        {
          id: '1',
          title: 'Build a Todo App',
          description: 'Create a full-stack todo application with React and Node.js',
          prize: '$500',
          deadline: '2024-02-15',
          participants: 24,
          difficulty: 'Intermediate',
          status: 'active',
          tags: ['React', 'Node.js', 'MongoDB'],
          requirements: [
            'User authentication',
            'CRUD operations',
            'Responsive design',
            'Real-time updates'
          ]
        },
        {
          id: '2',
          title: 'AI Chatbot Challenge',
          description: 'Build an intelligent chatbot using OpenAI API',
          prize: '$1000',
          deadline: '2024-02-20',
          participants: 18,
          difficulty: 'Advanced',
          status: 'active',
          tags: ['Python', 'OpenAI', 'Flask'],
          requirements: [
            'Natural language processing',
            'Context awareness',
            'Multi-platform support',
            'Analytics dashboard'
          ]
        },
        {
          id: '3',
          title: 'E-commerce Platform',
          description: 'Create a complete e-commerce solution',
          prize: '$750',
          deadline: '2024-01-30',
          participants: 32,
          difficulty: 'Advanced',
          status: 'completed',
          tags: ['React', 'Express', 'PostgreSQL'],
          requirements: [
            'Product catalog',
            'Shopping cart',
            'Payment integration',
            'Admin dashboard'
          ]
        }
      ];
      
      setHackathons(mockHackathons);
    } catch (error) {
      console.error('Error loading hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHackathon = (hackathonId) => {
    // Mock join functionality
    setHackathons(prev => 
      prev.map(h => 
        h.id === hackathonId 
          ? { ...h, participants: h.participants + 1, joined: true }
          : h
      )
    );
  };

  const handleSubmitSolution = (hackathonId) => {
    // Mock submission functionality
    alert('Solution submitted successfully! Good luck! 🚀');
  };

  const filteredHackathons = hackathons.filter(h => h.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">🏆 Hackathon Challenges</h2>
        <p className="text-purple-100 text-lg">
          Join exciting coding challenges, showcase your skills, and win amazing prizes!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="text-lg font-semibold text-gray-800">Active Challenges</h3>
          <p className="text-2xl font-bold text-purple-600">
            {hackathons.filter(h => h.status === 'active').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-lg font-semibold text-gray-800">Total Participants</h3>
          <p className="text-2xl font-bold text-blue-600">
            {hackathons.reduce((sum, h) => sum + h.participants, 0)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-gray-800">Total Prize Pool</h3>
          <p className="text-2xl font-bold text-green-600">$2,250</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🚀 Active Challenges
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✅ Completed
            </button>
          </nav>
        </div>

        <div className="p-6">
          {filteredHackathons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No {activeTab} hackathons
              </h3>
              <p className="text-gray-600">
                {activeTab === 'active' 
                  ? 'Check back soon for new challenges!' 
                  : 'Complete challenges to see them here.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredHackathons.map((hackathon) => (
                <div key={hackathon.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {hackathon.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{hackathon.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {hackathon.prize}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hackathon.difficulty === 'Advanced' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {hackathon.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hackathon.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Requirements */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {hackathon.requirements.map((req, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      {hackathon.participants} participants
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">⏰</span>
                      Deadline: {new Date(hackathon.deadline).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {hackathon.status === 'active' && (
                      <>
                        {hackathon.joined ? (
                          <button
                            onClick={() => handleSubmitSolution(hackathon.id)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                          >
                            Submit Solution
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinHackathon(hackathon.id)}
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
                          >
                            Join Challenge
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                      </>
                    )}
                    
                    {hackathon.status === 'completed' && (
                      <div className="w-full text-center py-2 bg-gray-100 text-gray-600 rounded">
                        Challenge Completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How to Participate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Participate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">1️⃣</div>
            <h4 className="font-semibold text-gray-800 mb-2">Join a Challenge</h4>
            <p className="text-sm text-gray-600">
              Browse available hackathons and join the ones that interest you
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">2️⃣</div>
            <h4 className="font-semibold text-gray-800 mb-2">Build Your Solution</h4>
            <p className="text-sm text-gray-600">
              Use your skills to create an innovative solution within the deadline
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">3️⃣</div>
            <h4 className="font-semibold text-gray-800 mb-2">Submit & Win</h4>
            <p className="text-sm text-gray-600">
              Submit your solution and compete for prizes and recognition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}