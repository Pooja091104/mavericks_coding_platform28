import { useState, useEffect } from "react";
import SkillChart from "./SkillChart";
import SkillAssessment from "./SkillAssessment";
import VideoRecorder from "./VideoRecorder";
import ProgressStepper from "./ProgressStepper";
import VideoRecommendations from "./VideoRecommendations";
import SkillProgressTracker from "./SkillProgressTracker";
import { uploadResume, updateUserProfile, trackUserActivity, trackWorkflowProgress } from "../../firebaseConfig";

export default function ResumeUploader({ user }) {
  const [files, setFiles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [skillsExtracted, setSkillsExtracted] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [weakSkills, setWeakSkills] = useState([]);
  const [completedVideos, setCompletedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("resume"); // resume, assessment, videos, progress

  const progressSteps = [
    { label: "Resume Upload", completed: resumeUploaded },
    { label: "Skills Extraction", completed: skillsExtracted },
    { label: "Skill Assessment", completed: assessmentResults.length > 0 },
    { label: "Video Learning", completed: completedVideos.length > 0 }
  ];
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedAssessments = localStorage.getItem("assessmentResults");
    if (savedAssessments) {
      setAssessmentResults(JSON.parse(savedAssessments));
    }
    
    const savedVideos = localStorage.getItem("completedVideos");
    if (savedVideos) {
      setCompletedVideos(JSON.parse(savedVideos));
    }
  }, []);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setError("");
  };

  // Extract skills ONLY from actual resume content
  const extractSkillsFromResumeContent = (resumeText) => {
    const comprehensiveSkills = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Objective-C',
      // Frontend Technologies
      'React', 'Angular', 'Vue.js', 'Vue', 'HTML', 'CSS', 'SCSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'jQuery', 'TypeScript', 'Webpack', 'Vite',
      // Backend Technologies
      'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Spring', 'Laravel', 'Ruby on Rails', 'ASP.NET', '.NET', 'FastAPI',
      // Databases
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle', 'Cassandra', 'DynamoDB',
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'DevOps', 'Terraform', 'Ansible',
      // Mobile Development
      'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic',
      // Data Science & AI
      'Machine Learning', 'Deep Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Keras',
      // Tools & Others
      'Git', 'GitHub', 'GitLab', 'Linux', 'Unix', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Confluence',
      // Testing
      'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Unit Testing', 'Integration Testing',
      // Design & UI/UX
      'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX', 'Responsive Design',
      // Business Intelligence
      'Tableau', 'Power BI', 'Excel', 'Google Analytics'
    ];
    
    const foundSkills = [];
    const lowerText = resumeText.toLowerCase();
    
    // More precise skill matching
    comprehensiveSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check for exact matches and common variations
      if (lowerText.includes(skillLower) || 
          lowerText.includes(skillLower.replace(/\./g, '')) || // Remove dots (e.g., Node.js -> nodejs)
          lowerText.includes(skillLower.replace(/\s/g, '')) || // Remove spaces
          lowerText.includes(skillLower.replace(/-/g, '')) ||  // Remove hyphens
          lowerText.includes(skillLower.replace(/\//g, ' '))) { // Replace slashes with spaces
        foundSkills.push(skill);
      }
    });
    
    // Remove duplicates and return only skills actually found in resume
    const uniqueSkills = [...new Set(foundSkills)];
    console.log(`Found ${uniqueSkills.length} skills in resume content:`, uniqueSkills);
    
    return uniqueSkills; // Return empty array if no skills found - no defaults!
  };
  
  // Keep the old function for backward compatibility but rename it
  const extractSkillsFromText = extractSkillsFromResumeContent;

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files first!");
      return;
    }
    
    // Clear any previous errors and notifications
    setError("");
    setNotification(null);
    setLoading(true);

    try {
      console.log('Starting resume upload process...');
      
      // Set upload status immediately to prevent hanging
      setResumeUploaded(true);
      console.log('Resume upload status set to true');
      
      // Track workflow progress - Profile Loading (non-blocking)
      if (user?.uid) {
        trackWorkflowProgress(user.uid, {
          email: user.email,
          stepName: 'Profile Loaded',
          step: 1,
          totalSteps: 4,
          progress: 25,
          section: 'resume_upload'
        }).catch(trackingError => {
          console.warn('Workflow tracking failed, continuing:', trackingError.message);
        });
      }
      
      const uploadedProfiles = [];

      for (const file of files) {
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);
        
        // Optional: Try Firebase Storage upload (non-blocking)
        if (user?.uid) {
          uploadResume(file, user.uid)
            .then(() => console.log('File uploaded to Firebase Storage successfully'))
            .catch(storageError => {
              console.warn('Firebase Storage upload failed, continuing with skill extraction:', storageError.message);
            });
        }

        // EXTRACT SKILLS ONLY FROM ACTUAL RESUME CONTENT
        let extractedSkills = [];
        let extractionMethod = 'content_based';
        let resumeText = '';
        
        console.log('Starting skill extraction from resume content...');
        
        // Read actual file content
        try {
          if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
            resumeText = await file.text();
            console.log('Resume text content length:', resumeText.length);
            console.log('Resume content preview:', resumeText.substring(0, 200) + '...');
          } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // For PDF files, try to call backend for text extraction
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const response = await fetch('http://localhost:8000/analyze_resume', {
                method: 'POST',
                body: formData,
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.skills && result.skills.length > 0) {
                  extractedSkills = result.skills;
                  extractionMethod = 'backend_pdf_extraction';
                  console.log('Skills extracted from PDF via backend:', extractedSkills);
                }
              }
            } catch (pdfError) {
              console.warn('PDF extraction via backend failed:', pdfError.message);
            }
          }
          
          // If we have resume text, extract skills from it
          if (resumeText && extractedSkills.length === 0) {
            extractedSkills = extractSkillsFromResumeContent(resumeText);
            console.log('Skills extracted from resume text:', extractedSkills);
          }
          
        } catch (readError) {
          console.error('Could not read resume content:', readError.message);
        }
        
        // ONLY use skills that were actually found in the resume content
        if (extractedSkills.length === 0) {
          console.warn('No skills found in resume content. Please ensure your resume contains skill keywords.');
          extractionMethod = 'no_skills_found';
          // Don't add default skills - leave empty if nothing found
        }
        
        console.log(`Final extracted skills from ${file.name}:`, extractedSkills);
        console.log(`Extraction method: ${extractionMethod}`);

        uploadedProfiles.push({
          filename: file.name,
          skills: extractedSkills,
          extractionMethod: extractionMethod
        });
      }

      setProfiles(uploadedProfiles);
      setSkillsExtracted(true);

      // Track workflow progress - Skills Extracted (non-blocking)
      if (user?.uid) {
        trackWorkflowProgress(user.uid, {
          email: user.email,
          stepName: 'Skills Evaluated',
          step: 2,
          totalSteps: 4,
          progress: 50,
          section: 'skill_extraction'
        }).catch(trackingError => {
          console.warn('Workflow tracking failed:', trackingError.message);
        });
      }

      // Update user profile and track activity (non-blocking)
      if (uploadedProfiles.length > 0 && user?.uid) {
        const allSkills = uploadedProfiles.flatMap(profile => profile.skills);
        const uniqueSkills = [...new Set(allSkills)];

        // Update user profile with extracted skills (non-blocking)
        updateUserProfile(user.uid, {
          skills: uniqueSkills,
          resumeUploaded: true,
          skillsExtracted: true
        }).catch(profileError => {
          console.warn('Profile update failed:', profileError.message);
        });

        // Track skill extraction activity (non-blocking)
        trackUserActivity({
          uid: user.uid,
          email: user.email,
          activityType: 'skills_update',
          activityName: 'Skills Extracted from Resume',
          activityDetails: { 
            skills: uniqueSkills,
            resumeFilename: files[0].name,
            extractionMethod: uploadedProfiles[0]?.extractionMethod || 'unknown'
          },
          status: 'completed'
        }).catch(activityError => {
          console.warn('Activity tracking failed:', activityError.message);
        });
      }

      console.log('Upload process completed successfully');
      console.log('Total profiles created:', uploadedProfiles.length);
      console.log('All extracted skills:', uploadedProfiles.flatMap(p => p.skills));
      
      // ENHANCED ADMIN TRACKING - Track detailed resume upload activity
      if (user?.uid && uploadedProfiles.length > 0) {
        const allSkills = uploadedProfiles.flatMap(profile => profile.skills);
        const uniqueSkills = [...new Set(allSkills)];
        
        // Track comprehensive resume upload activity for admin dashboard
        trackUserActivity({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Unknown User',
          activityType: 'resume_upload',
          activityName: 'Resume Upload & Skill Extraction',
          activityDetails: {
            fileName: files[0].name,
            fileSize: files[0].size,
            fileType: files[0].type,
            extractedSkills: uniqueSkills,
            skillCount: uniqueSkills.length,
            extractionMethod: uploadedProfiles[0]?.extractionMethod || 'unknown',
            uploadTimestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionInfo: {
              timestamp: Date.now(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: navigator.language
            }
          },
          status: 'completed',
          score: null, // No score for upload activity
          metadata: {
            category: 'skill_extraction',
            priority: 'high',
            trackingVersion: '2.0'
          }
        }).catch(error => {
          console.warn('Admin activity tracking failed:', error.message);
        });
        
        // Track individual skills for detailed analytics
        uniqueSkills.forEach(skill => {
          trackUserActivity({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Unknown User',
            activityType: 'skill_identified',
            activityName: `Skill Identified: ${skill}`,
            activityDetails: {
              skill: skill,
              source: 'resume_extraction',
              fileName: files[0].name,
              extractionMethod: uploadedProfiles[0]?.extractionMethod || 'unknown',
              timestamp: new Date().toISOString()
            },
            status: 'completed',
            metadata: {
              category: 'skill_tracking',
              skillType: skill,
              source: 'resume'
            }
          }).catch(error => {
            console.warn(`Skill tracking failed for ${skill}:`, error.message);
          });
        });
      }
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `✅ Successfully uploaded ${files.length} file(s) and extracted ${uploadedProfiles.flatMap(p => p.skills).length} skills!`
      });

      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);

    } catch (err) {
      console.error("Error in resume upload process:", err);
      
      // Only show error if it's a critical failure (not Firebase Storage permissions)
      if (err.message && !err.message.includes('Missing or insufficient permissions')) {
        setError(`Upload failed: ${err.message}`);
        
        // Show error notification
        setNotification({
          type: 'error',
          message: 'Resume upload failed. Please try again.'
        });
      } else {
        // For Firebase Storage permission errors, show success since skill extraction worked
        setNotification({
          type: 'success',
          message: 'Skills extracted successfully! (File storage requires additional setup)'
        });
      }

      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Save assessment results to localStorage when they change
  useEffect(() => {
    if (assessmentResults.length > 0) {
      localStorage.setItem("assessmentResults", JSON.stringify(assessmentResults));
    }
  }, [assessmentResults]);

  // Save completed videos to localStorage when they change
  useEffect(() => {
    if (completedVideos.length > 0) {
      localStorage.setItem("completedVideos", JSON.stringify(completedVideos));
    }
  }, [completedVideos]);

  const handleAssessmentComplete = (result) => {
    const newResult = {
      ...result,
      id: Date.now(),
      completedAt: new Date().toISOString()
    };
    
    const updatedResults = [...assessmentResults, newResult];
    setAssessmentResults(updatedResults);
    
    // Save to localStorage
    localStorage.setItem("assessmentResults", JSON.stringify(updatedResults));
    
    // Identify weak skills (score < 70%)
    const weakSkillsFound = updatedResults
      .filter(r => r.score < 70)
      .map(r => r.skill);
    
    setWeakSkills(weakSkillsFound);
    
    // ENHANCED ADMIN TRACKING - Track detailed assessment completion
    if (user?.uid) {
      trackUserActivity({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Unknown User',
        activityType: 'assessment_completed',
        activityName: `${result.skill} Assessment Completed`,
        activityDetails: {
          skill: result.skill,
          score: result.score,
          timeTaken: result.timeTaken || 0,
          totalQuestions: result.results?.total_questions || 0,
          correctAnswers: result.results?.correct_answers || 0,
          completedAt: newResult.completedAt,
          assessmentId: result.results?.assessment_id || newResult.id,
          performance: result.score >= 80 ? 'excellent' : result.score >= 60 ? 'good' : 'needs_improvement',
          weakSkillIdentified: result.score < 70,
          sessionInfo: {
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userAgent: navigator.userAgent
          }
        },
        status: 'completed',
        score: result.score,
        metadata: {
          category: 'assessment',
          skillType: result.skill,
          difficulty: 'intermediate',
          trackingVersion: '2.0'
        }
      }).catch(error => {
        console.warn('Assessment tracking failed:', error.message);
      });
    }

    setShowAssessment(false);
    setCurrentAssessment(null);
    setActiveTab("videos"); // Automatically switch to videos tab after assessment
  };

  const handleStartAssessment = (skill) => {
    setCurrentAssessment(skill);
    setShowAssessment(true);
  };

  const handleRetakeAssessment = (skill) => {
    handleStartAssessment(skill);
  };

  const handleVideoComplete = (video) => {
    setCompletedVideos(prev => {
      const exists = prev.find(v => v.id === video.id);
      if (!exists) {
        return [...prev, { ...video, completedAt: new Date().toISOString() }];
      }
      return prev;
    });
  };

  const getCurrentStep = () => {
    if (!resumeUploaded) return 0;
    if (!skillsExtracted) return 1;
    if (assessmentResults.length === 0) return 2;
    if (completedVideos.length === 0) return 3;
    return 4;
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("resume")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "resume"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📄 Resume Upload
          </button>
          <button
            onClick={() => setActiveTab("assessment")}
            disabled={!skillsExtracted}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${!skillsExtracted ? "text-gray-400 cursor-not-allowed" : 
              activeTab === "assessment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📝 Skill Assessment
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            disabled={weakSkills.length === 0}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${weakSkills.length === 0 ? "text-gray-400 cursor-not-allowed" :
              activeTab === "videos"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📚 Video Learning
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            disabled={assessmentResults.length === 0}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${assessmentResults.length === 0 ? "text-gray-400 cursor-not-allowed" :
              activeTab === "progress"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📊 Progress Tracker
          </button>
        </nav>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={getCurrentStep()} steps={progressSteps} />

      {/* Resume Upload Tab */}
      {activeTab === "resume" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Upload Resume and Extract Skills</h2>
          
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Uploading..." : "Upload and Extract Skills"}
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}

          {profiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Extracted Skills:</h3>
              {profiles.map((profile, idx) => (
                <div key={idx} className="mb-4">
                  <p className="font-medium">{profile.filename}</p>
                  <ul className="list-disc ml-6">
                    {profile.skills.map((skill, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{skill}</span>
                        <button 
                          onClick={() => {
                            handleStartAssessment(skill);
                            setActiveTab("assessment");
                          }}
                          className="ml-4 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Assess
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {skillsExtracted && (
                <button
                  onClick={() => setActiveTab("assessment")}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Continue to Skill Assessment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skill Assessment Tab */}
      {activeTab === "assessment" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Skill Assessment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.flatMap(profile => profile.skills).map((skill) => {
              const existingResult = assessmentResults.find(r => r.skill === skill);
              const isCompleted = !!existingResult;
              const score = existingResult?.score || 0;

              return (
                <div
                  key={skill}
                  className={`border rounded-lg p-6 transition-all duration-200 ${
                    isCompleted
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">{skill}</h4>
                    {isCompleted && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {score}%
                      </span>
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRetakeAssessment(skill)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Retake
                        </button>
                        <button
                          onClick={() => setActiveTab("progress")}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartAssessment(skill)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                    >
                      Start Assessment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {assessmentResults.length > 0 && weakSkills.length > 0 && (
            <button
              onClick={() => setActiveTab("videos")}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Continue to Video Learning
            </button>
          )}
        </div>
      )}

      {/* Video Learning Tab */}
      {activeTab === "videos" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Video Learning for Weak Skills</h2>
          <VideoRecommendations
            weakSkills={weakSkills}
            onVideoComplete={handleVideoComplete}
          />
          
          {completedVideos.length > 0 && (
            <button
              onClick={() => setActiveTab("progress")}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Progress Tracker
            </button>
          )}
        </div>
      )}

      {/* Progress Tracker Tab */}
      {activeTab === "progress" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Skill Progress Tracker</h2>
          <SkillProgressTracker
            assessmentResults={assessmentResults}
            onRetakeAssessment={(skill) => {
              handleRetakeAssessment(skill);
              setActiveTab("assessment");
            }}
          />
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessment && currentAssessment && (
        <SkillAssessment
          skill={currentAssessment}
          onComplete={handleAssessmentComplete}
          onClose={() => {
            setShowAssessment(false);
            setCurrentAssessment(null);
          }}
        />
      )}
    </div>
  );
}
