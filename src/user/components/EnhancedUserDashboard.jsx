import { useState, useEffect } from "react";
import agentManager, { AGENT_TYPES, AGENT_STATUS } from "../../agents/AgentManager";
import SkillAssessmentDashboard from "./SkillAssessmentDashboard";
import ResumeUploader from "./ResumeUploader";
import ProgressStepper from "./ProgressStepper";
import Leaderboard from "./Leaderboard";

export default function EnhancedUserDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [workflowResults, setWorkflowResults] = useState(null);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    // Subscribe to agent events
    agentManager.subscribe('profile_completed', handleProfileCompleted);
    agentManager.subscribe('assessment_completed', handleAssessmentCompleted);
    agentManager.subscribe('recommender_completed', handleRecommenderCompleted);
    agentManager.subscribe('tracker_completed', handleTrackerCompleted);
    agentManager.subscribe('workflow_error', handleWorkflowError);

    // Load existing user data
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }

    return () => {
      // Cleanup subscriptions
      agentManager.eventListeners.clear();
    };
  }, []);

  const handleProfileCompleted = (profileData) => {
    console.log("Profile completed:", profileData);
    setUserProfile(profileData);
    localStorage.setItem("userProfile", JSON.stringify(profileData));
  };

  const handleAssessmentCompleted = (assessmentData) => {
    console.log("Assessment completed:", assessmentData);
    setWorkflowResults(prev => ({ ...prev, assessment: assessmentData }));
  };

  const handleRecommenderCompleted = (recommenderData) => {
    console.log("Recommender completed:", recommenderData);
    setWorkflowResults(prev => ({ ...prev, recommender: recommenderData }));
  };

  const handleTrackerCompleted = (trackerData) => {
    console.log("Tracker completed:", trackerData);
    setWorkflowResults(prev => ({ ...prev, tracker: trackerData }));
    setIsWorkflowRunning(false);
  };

  const handleWorkflowError = (error) => {
    console.error("Workflow error:", error);
    setIsWorkflowRunning(false);
  };

  const startAgentWorkflow = async (userData) => {
    setIsWorkflowRunning(true);
    setWorkflowResults(null);
    
    try {
      const results = await agentManager.executeWorkflow(userData);
      setWorkflowResults(results);
      console.log("Workflow completed successfully:", results);
    } catch (error) {
      console.error("Workflow failed:", error);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleResumeUpload = async (resumeFile) => {
    setResumeData(resumeFile);
    
    const userData = {
      resume: resumeFile,
      name: "User", // This could be collected from a form
      email: "user@example.com",
      experience: "beginner"
    };

    await startAgentWorkflow(userData);
  };

  const getWorkflowProgress = () => {
    const status = agentManager.getWorkflowStatus();
    const totalAgents = Object.keys(AGENT_TYPES).length;
    const completedAgents = Object.values(status).filter(
      agent => agent.status === AGENT_STATUS.COMPLETED
    ).length;
    
    return Math.round((completedAgents / totalAgents) * 100);
  };

  const getCurrentStep = () => {
    if (!userProfile) return 1;
    if (!workflowResults?.assessment) return 2;
    if (!workflowResults?.recommender) return 3;
    if (!workflowResults?.tracker) return 4;
    return 5;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-100 transform hover:-translate-y-1 transition-all duration-300">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Mavericks AI Learning Platform
          </h1>
          <p className="text-gray-600 font-medium">
            Your personalized AI-powered learning journey
          </p>
        </div>

        {/* Workflow Progress */}
        {isWorkflowRunning && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-blue-100 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <span className="animate-pulse mr-2">🤖</span> AI Agents Processing...
              </h3>
              <div className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {getWorkflowProgress()}% Complete
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${getWorkflowProgress()}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              {Object.entries(agentManager.getWorkflowStatus()).map(([type, agent]) => (
                <div key={type} className="text-center p-3 rounded-lg hover:bg-blue-50 transition-all duration-300">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 shadow-sm ${
                    agent.status === AGENT_STATUS.COMPLETED ? 'bg-green-500 animate-none' :
                    agent.status === AGENT_STATUS.PROCESSING ? 'bg-yellow-500 animate-pulse' :
                    agent.status === AGENT_STATUS.ERROR ? 'bg-red-500 animate-none' : 'bg-gray-300 animate-none'
                  }`}></div>
                  <div className="text-xs font-medium text-gray-700 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        <ProgressStepper currentStep={getCurrentStep()} />

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex space-x-2 px-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "overview"
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-gray-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                <span className={`p-1.5 rounded-lg ${activeTab === "overview" ? "bg-blue-100" : "bg-gray-100"}`}>📊</span>
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "profile"
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-gray-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                <span className={`p-1.5 rounded-lg ${activeTab === "profile" ? "bg-blue-100" : "bg-gray-100"}`}>👤</span>
                <span>Profile & Resume</span>
              </button>
              <button
                onClick={() => setActiveTab("assessments")}
                className={`py-4 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "assessments"
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-gray-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                <span className={`p-1.5 rounded-lg ${activeTab === "assessments" ? "bg-blue-100" : "bg-gray-100"}`}>📝</span>
                <span>Skill Assessments</span>
              </button>

              <button
                onClick={() => setActiveTab("hackathons")}
                className={`py-4 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "hackathons"
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-gray-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                <span className={`p-1.5 rounded-lg ${activeTab === "hackathons" ? "bg-blue-100" : "bg-gray-100"}`}>🏆</span>
                <span>Hackathons</span>
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-4 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "leaderboard"
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-gray-200"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                <span className={`p-1.5 rounded-lg ${activeTab === "leaderboard" ? "bg-blue-100" : "bg-gray-100"}`}>🏅</span>
                <span>Leaderboard</span>
              </button>
            </nav>
          </div>

          <div className="p-6 bg-white shadow-inner">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-blue-400">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl shadow-inner">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium opacity-90">Skills Identified</p>
                        <p className="text-3xl font-bold">
                          {userProfile?.skills?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-green-400">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl shadow-inner">
                        <span className="text-2xl">📝</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium opacity-90">Assessments</p>
                        <p className="text-3xl font-bold">
                          {workflowResults?.assessment?.generatedAssessments || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-purple-400">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl shadow-inner">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium opacity-90">Recommendations</p>
                        <p className="text-3xl font-bold">
                          {workflowResults?.recommender?.totalRecommendations || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-orange-400">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl shadow-inner">
                        <span className="text-2xl">🏆</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium opacity-90">Active Hackathons</p>
                        <p className="text-3xl font-bold">
                          {workflowResults?.hackathon?.activeHackathons?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!userProfile && (
                  <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100">
                    <div className="inline-block text-6xl mb-6 p-6 bg-white rounded-full shadow-lg animate-bounce">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">🚀</span>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      Welcome to Mavericks AI Learning Platform
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto font-medium">
                      Upload your resume to start your personalized AI-powered learning journey and unlock your full potential
                    </p>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-semibold flex items-center mx-auto"
                    >
                      <span className="mr-2">Get Started</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}

                {userProfile && (
                  <div className="space-y-6">
                    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <span className="text-xl">🎯</span>
                        </div>
                        <h4 className="text-lg font-semibold text-blue-800">Your Skills Profile</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-lg text-sm font-medium shadow-sm hover:shadow hover:bg-blue-100 transition-all duration-300 border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {workflowResults?.recommender && (
                      <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <span className="text-xl">📚</span>
                          </div>
                          <h4 className="text-lg font-semibold text-blue-800">Learning Recommendations</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-green-200">
                            <div className="inline-block text-3xl mb-3 p-3 bg-white rounded-full shadow-sm">📺</div>
                            <div className="font-semibold text-green-800 text-lg mb-1">Videos</div>
                            <div className="text-sm text-green-700 font-medium bg-white bg-opacity-50 rounded-full py-1 px-3 inline-block">
                              {workflowResults.recommender.recommendations.filter(r => r.type === 'video').length}
                            </div>
                          </div>
                          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-blue-200">
                            <div className="inline-block text-3xl mb-3 p-3 bg-white rounded-full shadow-sm">📖</div>
                            <div className="font-semibold text-blue-800 text-lg mb-1">Courses</div>
                            <div className="text-sm text-blue-700 font-medium bg-white bg-opacity-50 rounded-full py-1 px-3 inline-block">
                              {workflowResults.recommender.recommendations.filter(r => r.type === 'course').length}
                            </div>
                          </div>
                          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-200">
                            <div className="inline-block text-3xl mb-3 p-3 bg-white rounded-full shadow-sm">🛠️</div>
                            <div className="font-semibold text-purple-800 text-lg mb-1">Projects</div>
                            <div className="text-sm text-purple-700 font-medium bg-white bg-opacity-50 rounded-full py-1 px-3 inline-block">
                              {workflowResults.recommender.recommendations.filter(r => r.type === 'project').length}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-6">👤 Profile & Resume Analysis</h3>
                <ResumeUploader user={user} onResumeUpload={handleResumeUpload} />
                
                {userProfile && (
                  <div className="mt-8 bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <span className="text-xl">✅</span>
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800">Profile Created Successfully</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                        <h5 className="font-medium mb-3 text-blue-700">Personal Information</h5>
                        <div className="space-y-3 text-sm">
                          <div className="p-2 bg-white rounded-lg flex justify-between"><span className="font-medium text-gray-700">Name:</span> <span className="text-blue-800">{userProfile.name}</span></div>
                          <div className="p-2 bg-white rounded-lg flex justify-between"><span className="font-medium text-gray-700">Email:</span> <span className="text-blue-800">{userProfile.email}</span></div>
                          <div className="p-2 bg-white rounded-lg flex justify-between"><span className="font-medium text-gray-700">Experience:</span> <span className="text-blue-800">{userProfile.experience}</span></div>
                          <div className="p-2 bg-white rounded-lg flex justify-between"><span className="font-medium text-gray-700">Created:</span> <span className="text-blue-800">{new Date(userProfile.createdAt).toLocaleDateString()}</span></div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                        <h5 className="font-medium mb-3 text-blue-700">Skills Identified ({userProfile.skills?.length || 0})</h5>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.skills?.map((skill, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-lg text-sm font-medium shadow-sm hover:shadow hover:bg-blue-100 transition-all duration-300 border border-blue-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assessments Tab */}
            {activeTab === "assessments" && (
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-6">📝 Skill Assessments</h3>
                <SkillAssessmentDashboard />
              </div>
            )}


                

            {/* Hackathons Tab */}
            {activeTab === "hackathons" && (
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-6">🏆 Hackathons & Challenges</h3>
                {workflowResults?.hackathon ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <span className="text-xl">🔥</span>
                        </div>
                        <h4 className="text-lg font-semibold text-blue-800">Active Hackathons</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workflowResults.hackathon.activeHackathons.map((hackathon) => (
                          <div key={hackathon.id} className="border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                            <h5 className="font-semibold mb-2 text-purple-800">{hackathon.name}</h5>
                            <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg">{hackathon.description}</p>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">{hackathon.prize}</span>
                              <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{hackathon.participants} participants</span>
                            </div>
                            <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 font-medium flex items-center justify-center">
                              <span className="mr-2">Join Hackathon</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <span className="text-xl">🎯</span>
                        </div>
                        <h4 className="text-lg font-semibold text-blue-800">Recommended Challenges</h4>
                      </div>
                      <div className="space-y-4">
                        {workflowResults.hackathon.challenges.map((challenge) => (
                          <div key={challenge.id} className="border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold text-blue-800">{challenge.title}</h5>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs border border-purple-200">
                                {challenge.points} points
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg">{challenge.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex gap-2">
                                {challenge.skills.map((skill) => (
                                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs border border-blue-200">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{challenge.estimatedTime}</span>
                            </div>
                            <button className="w-full mt-3 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium flex items-center justify-center">
                              <span className="mr-2">Start Challenge</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-8 shadow-md">
                    <div className="inline-block text-4xl mb-4 p-4 bg-white rounded-full shadow-sm">🏆</div>
                    <h4 className="text-xl font-semibold text-yellow-800 mb-3">
                      Hackathon System Not Initialized
                    </h4>
                    <p className="text-yellow-700 mb-6">
                      Complete your profile to access hackathons and challenges.
                    </p>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 font-medium flex items-center justify-center mx-auto"
                    >
                      <span className="mr-2">Go to Profile</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <span className="text-xl">🏅</span>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800">Leaderboard & Achievements</h3>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                  <Leaderboard />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}