import React, { useState, useEffect } from "react";
import { getUserActivities } from "../../firebaseConfig";

export default function RecentActivityTable() {
  // Removed filter states - showing all users
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real user activities from Firebase
  useEffect(() => {
    const loadUserActivities = async () => {
      try {
        setLoading(true);
        const userActivities = await getUserActivities();
        
        // Transform Firebase data to match component format
        const transformedActivities = userActivities.map((activity, index) => ({
          id: activity.id || index + 1,
          user: activity.displayName || activity.email?.split('@')[0] || 'Unknown User',
          email: activity.email || 'unknown@example.com',
          action: activity.activityName || 'Unknown Activity',
          date: activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          skills: activity.activityDetails?.extractedSkills || activity.activityDetails?.skill ? [activity.activityDetails.skill] : [],
          assessmentScore: activity.score || activity.activityDetails?.score || null,
          status: activity.status || 'completed',
          activityType: activity.activityType || 'unknown',
          progress: {
            profileLoaded: {
              completed: true,
              timestamp: activity.timestamp || new Date().toISOString(),
              details: activity.activityDetails?.fileName ? `Resume uploaded: ${activity.activityDetails.fileName}` : 'Profile loaded'
            },
            assessmentCompleted: {
              completed: activity.activityType === 'assessment_completed',
              timestamp: activity.timestamp || new Date().toISOString(),
              details: activity.score ? `Assessment completed with score: ${activity.score}%` : 'Assessment in progress'
            },
            skillsEvaluated: {
              completed: activity.activityType === 'resume_upload' || activity.activityType === 'skill_identified',
              timestamp: activity.timestamp || new Date().toISOString(),
              details: activity.activityDetails?.extractedSkills ? 
                `Skills extracted: ${activity.activityDetails.extractedSkills.join(', ')}` : 
                `Skill identified: ${activity.activityDetails?.skill || 'Unknown'}`
            },
            learningPathGenerated: {
              completed: activity.activityDetails?.weakSkillIdentified || false,
              timestamp: activity.timestamp || new Date().toISOString(),
              details: activity.activityDetails?.weakSkillIdentified ? 'Learning path recommended' : 'No learning path needed'
            }
          }
        }));
        
        setActivities(transformedActivities);
        setError(null);
      } catch (err) {
        console.error('Error loading user activities:', err);
        setError('Failed to load user activities');
        // Fallback to mock data if Firebase fails
        setActivities(getMockActivities());
      } finally {
        setLoading(false);
      }
    };

    loadUserActivities();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadUserActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fallback mock data
  const getMockActivities = () => [
    {
      id: 1,
      user: "John Doe",
      email: "john.doe@example.com",
      action: "Completed JavaScript Assessment",
      date: "21-07-2025",
      skills: ["JavaScript", "React", "Node.js"],
      assessmentScore: 85,
      status: "completed",
      progress: {
        profileLoaded: {
          completed: true,
          timestamp: "2025-01-20T09:00:00Z",
          details: "Profile created successfully",
        },
        assessmentCompleted: {
          completed: true,
          timestamp: "2025-01-21T14:30:00Z",
          details: "Assessment took 45 minutes, Score: 85%",
        },
        skillsEvaluated: {
          completed: true,
          timestamp: "2025-01-21T15:00:00Z",
          details: "Skills evaluated: JavaScript, React, Node.js",
        },
        learningPathGenerated: {
          completed: true,
          timestamp: "2025-01-22T10:00:00Z",
          details: "5 modules recommended",
        },
      },
    },
    {
      id: 2,
      user: "Jane Smith",
      email: "jane.smith@example.com",
      action: "Enrolled in React Course",
      date: "22-07-2025",
      skills: ["Python", "Django", "Machine Learning"],
      assessmentScore: 92,
      status: "completed",
      progress: {
        profileLoaded: {
          completed: true,
          timestamp: "2025-01-21T11:00:00Z",
          details: "Profile created successfully",
        },
        assessmentCompleted: {
          completed: true,
          timestamp: "2025-01-22T13:15:00Z",
          details: "Assessment took 38 minutes, Score: 92%",
        },
        skillsEvaluated: {
          completed: true,
          timestamp: "2025-01-22T13:45:00Z",
          details: "Skills evaluated: Python, Django, ML",
        },
        learningPathGenerated: {
          completed: true,
          timestamp: "2025-01-23T09:30:00Z",
          details: "3 modules recommended",
        },
      },
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading user activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <p className="text-yellow-800 font-medium">Warning</p>
            <p className="text-yellow-700 text-sm">{error}. Showing sample data.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show all activities without filtering
  const filteredActivities = activities;

  const toggleRowExpansion = (userId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(userId)) {
      newExpandedRows.delete(userId);
    } else {
      newExpandedRows.add(userId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleManualAction = (userId, action) => {
    console.log(`Performing ${action} for user ${userId}`);
    switch (action) {
      case "reassess":
        alert(`Re-assessment initiated for user ${userId}`);
        break;
      case "updateProfile":
        alert(`Profile update initiated for user ${userId}`);
        break;
      case "generateReport":
        alert(`Report generation initiated for user ${userId}`);
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status) => {
    let className = "status-badge";
    if (status === "completed") {
      className += " status-completed";
    } else if (status === "in-progress") {
      className += " status-in-progress";
    } else if (status === "pending") {
      className += " status-pending";
    }

    return <span className={className}>{status.replace("-", " ")}</span>;
  };

  const ProgressBar = ({ progress }) => {
    const steps = [
      { key: "profileLoaded", label: "Profile Loaded", icon: "👤" },
      { key: "assessmentCompleted", label: "Assessment Completed", icon: "📝" },
      { key: "skillsEvaluated", label: "Skills Evaluated", icon: "🎯" },
      {
        key: "learningPathGenerated",
        label: "Learning Path Generated",
        icon: "🛤️",
      },
    ];

    return (
      <div className="progress-bar-container-inline">
        {steps.map((step, index) => {
          const stepData = progress[step.key];
          const isCompleted = stepData?.completed;

          return (
            <div key={step.key} className="progress-step-inline">
              <div
                className={`progress-icon ${
                  isCompleted ? "completed" : "pending"
                }`}
                title={stepData?.details || step.label}
              >
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`progress-line ${
                    isCompleted ? "completed" : "pending"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="recent-activity-table">
      <div className="table-header">
        <h3 className="table-title">All Logged-in Users</h3>
      </div>

      <div className="table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Date</th>
              <th>Skills</th>
              <th>Score</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((activity) => (
              <React.Fragment key={activity.id}>
                <tr className="activity-row">
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-name">{activity.user}</div>
                      <div className="user-email">{activity.email}</div>
                    </div>
                  </td>
                  <td className="action-cell">{activity.action}</td>
                  <td className="date-cell">{activity.date}</td>
                  <td className="skills-cell">
                    <div className="skills-container">
                      {activity.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                      {activity.skills.length > 2 && (
                        <span className="skill-tag more">
                          +{activity.skills.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="score-cell">
                    {activity.assessmentScore ? (
                      <span className="score-badge">
                        {activity.assessmentScore}%
                      </span>
                    ) : (
                      <span className="no-score">-</span>
                    )}
                  </td>
                  <td className="status-cell">
                    {getStatusBadge(activity.status)}
                  </td>
                  <td className="progress-cell">
                    <ProgressBar progress={activity.progress} />
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => toggleRowExpansion(activity.id)}
                        className="expand-btn"
                        title="View Details"
                      >
                        {expandedRows.has(activity.id) ? "▼" : "▶"}
                      </button>
                      <button
                        onClick={() =>
                          handleManualAction(activity.id, "reassess")
                        }
                        className="action-btn reassess"
                        title="Reassess User"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() =>
                          handleManualAction(activity.id, "generateReport")
                        }
                        className="action-btn report"
                        title="Generate Report"
                      >
                        📊
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(activity.id) && (
                  <tr className="expanded-row">
                    <td colSpan="8">
                      <div className="expanded-content">
                        <div className="expanded-section">
                          <h4>All Skills</h4>
                          <div className="all-skills">
                            {activity.skills.map((skill, index) => (
                              <span key={index} className="skill-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h4>Progress Details</h4>
                          <div className="progress-details">
                            {Object.entries(activity.progress).map(
                              ([key, step]) => (
                                <div key={key} className="progress-detail-item">
                                  <div
                                    className={`progress-status ${
                                      step.completed ? "completed" : "pending"
                                    }`}
                                  >
                                    {step.completed ? "✅" : "⏳"}
                                  </div>
                                  <div className="progress-info">
                                    <div className="progress-label">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                    </div>
                                    <div className="progress-details-text">
                                      {step.details}
                                    </div>
                                    {step.timestamp && (
                                      <div className="progress-timestamp">
                                        {new Date(
                                          step.timestamp
                                        ).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredActivities.length === 0 && (
        <div className="no-results">
          <p>No user activities found.</p>
        </div>
      )}
    </div>
  );
}
