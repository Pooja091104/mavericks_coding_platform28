from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import PyPDF2
import io
import json
import re
import uuid
import time
import shutil
from typing import List, Dict, Optional
from pydantic import BaseModel

# Try to import assessment_cache, but don't fail if it's not available
try:
    from assessment_cache import (
        get_cached_assessment, 
        cache_assessment, 
        get_predefined_assessment,
        get_video_recommendations
    )
    assessment_cache_available = True
except ImportError:
    print("⚠️ assessment_cache module not available - some features will be limited")
    assessment_cache_available = False

# Try to import database models and utilities, but don't fail if they're not available
try:
    import cohere
    from database_models import engine, User, Assessment, ChatInteraction, Hackathon, HackathonParticipant, DashboardMetrics
    from sqlalchemy.orm import sessionmaker
    # Create session factory
    Session = sessionmaker(bind=engine)
    from database_utils import get_user, get_user_by_email, create_user, update_user_login, save_assessment, get_user_assessments, save_chat_interaction, get_chat_interactions, create_hackathon, get_hackathons, join_hackathon, update_dashboard_metrics, get_dashboard_metrics, get_all_users_with_login_data, save_login_log, get_user_login_logs, get_recent_login_activity
    database_available = True
except ImportError:
    print("⚠️ Database modules not available - running in limited mode")
    database_available = False

# Load .env
load_dotenv()

# Configure Cohere AI if available
cohere_client = None
cohere_key = os.getenv("COHERE_API_KEY")
if database_available and cohere_key:
    try:
        cohere_client = cohere.Client(cohere_key)
        print("✅ Cohere AI configured successfully")
    except Exception as e:
        print(f"⚠️ Error configuring Cohere AI: {e}")
        print("Assessment features will be limited")
else:
    print("⚠️ Cohere AI not available - assessment features will be limited")

# Init FastAPI
app = FastAPI(title="Resume Skill Extractor & Assessment System", version="2.0.0")

# CORS settings (for frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database if available
if database_available:
    try:
        from database_models import init_db
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization failed: {e}")
        print("Running without database functionality")
        database_available = False
else:
    print("⚠️ Running without database functionality")
    # Create in-memory storage for assessments
    assessments_db = {}

# Pydantic models for request/response
class AssessmentRequest(BaseModel):
    skills: List[str]
    difficulty: str = "intermediate"  # beginner, intermediate, advanced
    
class UserLoginRequest(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None
    role: str = "user"
    loginTimestamp: Optional[str] = None
    deviceInfo: Optional[Dict] = None
    sessionId: Optional[str] = None
    ipAddress: Optional[str] = None
    
class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    role: str
    login_count: int
    last_login: str
    
class DashboardMetricsResponse(BaseModel):
    total_users: int
    active_users: int
    assessments_completed: int
    average_score: float
    last_updated: str

class AssessmentSubmission(BaseModel):
    assessment_id: str
    answers: Dict[str, str]
    time_taken: int  # in minutes

class AssessmentResult(BaseModel):
    assessment_id: str
    score: float
    weak_skills: List[str]
    recommendations: List[Dict[str, str]]

def extract_text_from_pdf(pdf_content):
    """Extract text from PDF content"""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_txt(content):
    """Extract text from TXT content"""
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error extracting TXT text: {e}")
        return ""

def extract_skills_locally(text):
    """Extract skills using local pattern matching"""
    print("🔧 Using local skill extraction")
    
    # Common technical skills patterns
    skill_patterns = {
        'programming_languages': [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server'
        ],
        'web_technologies': [
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
            'spring', 'laravel', 'bootstrap', 'jquery', 'sass', 'less', 'webpack', 'babel',
            'reactjs', 'react.js', 'nodejs', 'node.js'
        ],
        'databases': [
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
            'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'sql'
        ],
        'cloud_devops': [
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
            'terraform', 'ansible', 'chef', 'puppet', 'nagios', 'prometheus', 'grafana'
        ],
        'data_ai': [
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
            'pandas', 'numpy', 'matplotlib', 'seaborn', 'jupyter', 'tableau', 'power bi'
        ],
        'mobile': [
            'android', 'ios', 'react native', 'flutter', 'xamarin', 'cordova', 'ionic'
        ]
    }
    
    found_skills = set()
    text_lower = text.lower()
    
    # Search for skills in text
    for category, skills in skill_patterns.items():
        for skill in skills:
            # Use word boundaries to avoid partial matches
            # Handle special characters properly
            skill_lower = skill.lower()
            if skill_lower in ['c++', 'c#']:
                pattern = r'\b' + re.escape(skill_lower) + r'\b'
            else:
                pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, text_lower):
                # Capitalize properly
                if skill.lower() in ['c++', 'c#']:
                    found_skills.add(skill.upper())
                elif skill.lower() == 'node.js':
                    found_skills.add('Node.js')
                elif skill.lower() == 'machine learning':
                    found_skills.add('Machine Learning')
                elif skill.lower() == 'deep learning':
                    found_skills.add('Deep Learning')
                elif skill.lower() == 'sql':
                    found_skills.add('SQL')
                elif skill.lower() == 'javascript':
                    found_skills.add('JavaScript')
                elif skill.lower() == 'react':
                    found_skills.add('React')
                elif skill.lower() == 'reactjs':
                    found_skills.add('React')
                elif skill.lower() == 'react.js':
                    found_skills.add('React')
                elif skill.lower() == 'nodejs':
                    found_skills.add('Node.js')
                else:
                    found_skills.add(skill.title())
    
    # Convert to sorted list
    skills_list = sorted(list(found_skills))
    print(f"🎯 Local extraction found {len(skills_list)} skills:")
    for i, skill in enumerate(skills_list):
        print(f"  {i+1}. '{skill}'")
    
    return skills_list

def generate_assessment_with_cohere(skills: List[str], difficulty: str = "intermediate") -> Dict:
    """Generate assessment using optimized approach (cache + predefined + AI fallback)"""
    
    # For single skill assessments, try optimized approaches first
    if len(skills) == 1:
        skill = skills[0]
        
        # 1. Check cache first (fastest)
        cached = get_cached_assessment(skill, difficulty)
        if cached:
            print(f"⚡ Using cached assessment for {skill}")
            return cached
        
        # 2. Try predefined assessment (fast)
        predefined = get_predefined_assessment(skill)
        if predefined:
            print(f"📚 Using predefined assessment for {skill}")
            assessment_data = {
                "assessment_id": f"predef_{skill.lower()}_{uuid.uuid4().hex[:8]}",
                "title": f"{skill} Skills Assessment",
                "difficulty": difficulty,
                "skills_tested": skills,
                "questions": predefined["questions"],
                "created_at": int(time.time()),
                "source": "predefined"
            }
            # Cache the predefined assessment
            cache_assessment(skill, difficulty, assessment_data)
            return assessment_data
    
    # 3. Fallback to AI generation (slower but more flexible)
    if not cohere_client:
        print("⚠️ Cohere AI not available, using fallback assessment generation")
        return create_structured_assessment(skills, difficulty, f"Assessment for {', '.join(skills)}")
    
    try:
        print(f"🤖 Generating AI assessment for {len(skills)} skills...")
        prompt = f"""
        Create a technical assessment for the following skills: {', '.join(skills)}
        Difficulty level: {difficulty}
        
        Generate 5 multiple choice questions (1 question per skill) with the following format:
        {{
            "assessment_id": "unique_id_here",
            "title": "Technical Skills Assessment",
            "difficulty": "{difficulty}",
            "skills_tested": {skills},
            "questions": [
                {{
                    "id": "q1",
                    "skill": "skill_name",
                    "question": "Question text here?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A",
                    "explanation": "Why this is correct"
                }}
            ]
        }}
        
        Make questions practical and relevant to real-world scenarios. Return ONLY the JSON, no additional text.
        """
        
        response = cohere_client.generate(
            model="command",
            prompt=prompt,
            max_tokens=1000,
            temperature=0.7
        )
        
        # Parse the response
        assessment_text = response.generations[0].text.strip()
        
        # Try to extract JSON from the response
        try:
            # Find JSON in the response
            start_idx = assessment_text.find('{')
            end_idx = assessment_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = assessment_text[start_idx:end_idx]
                assessment_data = json.loads(json_str)
            else:
                raise Exception("No JSON found in response")
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response
            print(f"⚠️ JSON parsing failed, creating structured assessment from: {assessment_text[:100]}...")
            assessment_data = create_structured_assessment(skills, difficulty, assessment_text)
        
        # Add timestamp and source
        assessment_data["created_at"] = int(time.time())
        assessment_data["source"] = "ai_generated"
        
        # Cache AI-generated assessments
        if len(skills) == 1:
            cache_assessment(skills[0], difficulty, assessment_data)
        
        print(f"✅ Generated AI assessment for {len(skills)} skills")
        return assessment_data
        
    except Exception as e:
        print(f"❌ Error generating assessment: {e}")
        # Fallback to structured assessment
        return create_structured_assessment(skills, difficulty, f"Assessment for {', '.join(skills)}")

def create_structured_assessment(skills: List[str], difficulty: str, response_text: str) -> Dict:
    """Create structured assessment from Cohere response"""
    import uuid
    
    # Pre-defined questions for common skills
    skill_questions = {
        "JavaScript": {
            "question": "What is the correct way to declare a variable in JavaScript?",
            "options": ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
            "correct_answer": "var x = 5;",
            "explanation": "var is the traditional way to declare variables in JavaScript"
        },
        "Python": {
            "question": "Which of the following is used to create a list in Python?",
            "options": ["[]", "()", "{}", "<>"],
            "correct_answer": "[]",
            "explanation": "Square brackets [] are used to create lists in Python"
        },
        "Java": {
            "question": "What is the main method signature in Java?",
            "options": [
                "public static void main(String[] args)",
                "public void main(String[] args)",
                "static void main(String[] args)",
                "public static main(String[] args)"
            ],
            "correct_answer": "public static void main(String[] args)",
            "explanation": "The main method must be public, static, and return void"
        },
        "React": {
            "question": "What hook is used to manage state in functional components?",
            "options": ["useState", "useEffect", "useContext", "useReducer"],
            "correct_answer": "useState",
            "explanation": "useState is the primary hook for managing state in functional components"
        },
        "SQL": {
            "question": "Which SQL command is used to retrieve data from a database?",
            "options": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "correct_answer": "SELECT",
            "explanation": "SELECT is used to retrieve data from database tables"
        }
    }
    
    questions = []
    for i, skill in enumerate(skills[:5]):  # Limit to 5 questions
        if skill in skill_questions:
            q_data = skill_questions[skill]
            questions.append({
                "id": f"q{i+1}",
                "skill": skill,
                "question": q_data["question"],
                "options": q_data["options"],
                "correct_answer": q_data["correct_answer"],
                "explanation": q_data["explanation"]
            })
        else:
            # Generic question for unknown skills
            questions.append({
                "id": f"q{i+1}",
                "skill": skill,
                "question": f"What is {skill} primarily used for?",
                "options": [
                    "Web development",
                    "Data analysis", 
                    "System programming",
                    "All of the above"
                ],
                "correct_answer": "All of the above",
                "explanation": f"{skill} can be used in various contexts"
            })
    
    return {
        "assessment_id": str(uuid.uuid4()),
        "title": "Technical Skills Assessment",
        "difficulty": difficulty,
        "skills_tested": skills,
        "questions": questions
    }

def analyze_assessment_results(assessment_id: str, answers: Dict[str, str], skills: List[str]) -> Dict:
    """Analyze assessment results and identify weak skills using Cohere"""
    if not cohere_client:
        print("⚠️ Cohere AI not available, using fallback assessment analysis")
        # Calculate score for fallback analysis
        total_questions = len(answers)
        correct_answers = sum(1 for answer in answers.values() if answer == "correct")
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        return create_structured_analysis(assessment_id, score, skills)
    
    try:
        # Calculate basic score
        total_questions = len(answers)
        correct_answers = sum(1 for answer in answers.values() if answer == "correct")
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        # Generate analysis prompt
        prompt = f"""
        Analyze the assessment results:
        - Skills tested: {', '.join(skills)}
        - Score: {score}%
        - Total questions: {total_questions}
        - Correct answers: {correct_answers}
        
        Identify weak skills and provide video recommendations. Return JSON format:
        {{
            "assessment_id": "{assessment_id}",
            "score": {score},
            "weak_skills": ["skill1", "skill2"],
            "recommendations": [
                {{
                    "skill": "skill_name",
                    "video_title": "Video Title",
                    "video_url": "https://youtube.com/watch?v=...",
                    "description": "Why this video is recommended"
                }}
            ],
            "improvement_plan": "Personalized improvement suggestions"
        }}
        
        Focus on skills where the user scored poorly or showed gaps. Return ONLY the JSON, no additional text.
        """
        
        response = cohere_client.generate(
            model="command",
            prompt=prompt,
            max_tokens=800,
            temperature=0.5
        )
        
        # Parse the response
        analysis_text = response.generations[0].text.strip()
        
        try:
            # Find JSON in the response
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = analysis_text[start_idx:end_idx]
                analysis_data = json.loads(json_str)
                
                # Enhance AI analysis with curated video recommendations
                if "recommendations" not in analysis_data or not analysis_data["recommendations"]:
                    recommendations = []
                    for skill in skills:
                        skill_videos = get_video_recommendations(skill, score)
                        recommendations.extend(skill_videos)
                    analysis_data["recommendations"] = recommendations
            else:
                raise Exception("No JSON found in response")
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured analysis
            print(f"⚠️ JSON parsing failed for analysis, creating structured response")
            analysis_data = create_structured_analysis(assessment_id, score, skills)
        
        print(f"✅ Analyzed assessment results with Cohere - Score: {score}%")
        return analysis_data
        
    except Exception as e:
        print(f"❌ Error analyzing results: {e}")
        # Fallback to structured analysis
        return create_structured_analysis(assessment_id, score, skills)

def create_structured_analysis(assessment_id: str, score: float, skills: List[str]) -> Dict:
    """Create structured analysis with improved video recommendations"""
    # Determine weak skills based on score
    weak_skills = []
    if score < 40:  # Changed from 80 to 40 to only mark skills below 40% as weak
        weak_skills = skills  # Skills need improvement if score is low
    
    # Generate recommendations using curated video system
    recommendations = []
    for skill in weak_skills:
        skill_videos = get_video_recommendations(skill, score)
        recommendations.extend(skill_videos)
    
    # Create improvement plan based on score
    if score >= 80:
        improvement_plan = "Excellent performance! Keep practicing to maintain your high level of expertise."
    elif score >= 60:
        improvement_plan = "Good foundation! Continue practicing to strengthen your skills further."
    elif score >= 40:
        improvement_plan = "Average performance. Consider additional practice to improve your skills."
    else:
        improvement_plan = f"Need improvement in {', '.join(weak_skills)}. Start with the recommended beginner videos and practice regularly."
    
    return {
        "assessment_id": assessment_id,
        "score": score,
        "weak_skills": weak_skills,
        "recommendations": recommendations,
        "improvement_plan": improvement_plan
    }

# In-memory storage for assessments (in production, use a database)
assessments_db = {}

# Create uploads directory if it doesn't exist
UPLOADS_DIR = "uploads"
VIDEOS_DIR = os.path.join(UPLOADS_DIR, "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)

# Mount static files for video access
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/")
def root():
    return {"message": "Resume Skill Extractor & Assessment System is running!", "version": "2.0.0"}

@app.post("/analyze_resume")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = extract_text_from_txt(content)
        
        if not text.strip():
            return {"error": "Could not extract text from the uploaded file"}

        # Extract skills using local method
        skills = extract_skills_locally(text)
        
        return {
            "skills": skills,
            "filename": file.filename,
            "text_length": len(text),
            "skills_count": len(skills),
            "extraction_method": "local_patterns"
        }

    except Exception as e:
        print(f"Error processing resume: {e}")
        return {"error": f"Error processing resume: {str(e)}"}

@app.post("/generate_assessment")
async def generate_assessment(request: AssessmentRequest):
    """Generate assessment based on extracted skills"""
    try:
        if not request.skills:
            raise HTTPException(status_code=400, detail="No skills provided")
        
        # Generate assessment using Cohere AI
        assessment = generate_assessment_with_cohere(request.skills, request.difficulty)
        
        # Store assessment in memory
        assessment_id = assessment["assessment_id"]
        assessments_db[assessment_id] = assessment
        
        return {
            "success": True,
            "assessment": assessment,
            "message": f"Assessment generated for {len(request.skills)} skills"
        }
        
    except Exception as e:
        print(f"Error generating assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_skill_assessment")
async def generate_skill_assessment(request: AssessmentRequest):
    """Generate individual assessment for a single skill"""
    try:
        if not request.skills or len(request.skills) != 1:
            raise HTTPException(status_code=400, detail="Please provide exactly one skill for individual assessment")
        
        skill = request.skills[0]
        
        # Generate assessment using Cohere AI for single skill
        assessment = generate_assessment_with_cohere([skill], request.difficulty)
        
        # Store assessment in memory
        assessment_id = assessment["assessment_id"]
        assessments_db[assessment_id] = assessment
        
        return {
            "success": True,
            "assessment": assessment,
            "message": f"Individual assessment generated for {skill}"
        }
        
    except Exception as e:
        print(f"Error generating skill assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_all_skill_assessments")
async def generate_all_skill_assessments(request: AssessmentRequest):
    """Generate individual assessments for each skill"""
    try:
        if not request.skills:
            raise HTTPException(status_code=400, detail="No skills provided")
        
        assessments = []
        
        # Generate individual assessment for each skill
        for skill in request.skills:
            try:
                assessment = generate_assessment_with_cohere([skill], request.difficulty)
                assessment_id = assessment["assessment_id"]
                assessments_db[assessment_id] = assessment
                assessments.append({
                    "skill": skill,
                    "assessment_id": assessment_id,
                    "assessment": assessment
                })
            except Exception as e:
                print(f"Error generating assessment for {skill}: {e}")
                assessments.append({
                    "skill": skill,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "assessments": assessments,
            "message": f"Generated {len(assessments)} individual skill assessments"
        }
        
    except Exception as e:
        print(f"Error generating all skill assessments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit_assessment")
async def submit_assessment(submission: AssessmentSubmission):
    """Submit assessment answers and get analysis"""
    try:
        # Get the original assessment
        assessment = assessments_db.get(submission.assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check answers against correct answers
        checked_answers = {}
        for question_id, user_answer in submission.answers.items():
            # Find the question in the assessment
            question = next((q for q in assessment["questions"] if q["id"] == question_id), None)
            if question:
                # Check if the answer is correct
                is_correct = user_answer == question["correct_answer"]
                checked_answers[question_id] = "correct" if is_correct else "incorrect"
            else:
                checked_answers[question_id] = "incorrect"
        
        try:
            # Analyze results
            analysis = analyze_assessment_results(
                submission.assessment_id,
                checked_answers,
                assessment["skills_tested"]
            )
            
            if "error" in analysis:
                raise HTTPException(status_code=500, detail=analysis["error"])
            
            return {
                "success": True,
                "analysis": analysis,
                "message": "Assessment submitted and analyzed successfully"
            }
        except Exception as analysis_error:
            print(f"Error analyzing assessment: {analysis_error}")
            # Calculate basic score for fallback
            total_questions = len(checked_answers)
            correct_answers = sum(1 for answer in checked_answers.values() if answer == "correct")
            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            # Use structured analysis as fallback
            analysis = create_structured_analysis(submission.assessment_id, score, assessment["skills_tested"])
            
            return {
                "success": True,
                "analysis": analysis,
                "message": "Assessment analyzed with fallback system"
            }
        
    except Exception as e:
        print(f"Error submitting assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_skill_video")
async def upload_skill_video(
    video: UploadFile = File(...),
    skill: str = None,
    duration: int = None
):
    """Upload a skill demonstration video"""
    try:
        # Validate file type
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Generate unique filename
        timestamp = int(time.time())
        filename = f"{skill}_{timestamp}_{uuid.uuid4().hex[:8]}.webm"
        file_path = os.path.join(VIDEOS_DIR, filename)
        
        # Save video file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        # Generate video URL
        video_url = f"/uploads/videos/{filename}"
        
        print(f"✅ Video uploaded: {filename} for skill: {skill}")
        
        return {
            "success": True,
            "video_url": video_url,
            "filename": filename,
            "skill": skill,
            "duration": duration,
            "uploaded_at": timestamp
        }
        
    except Exception as e:
        print(f"❌ Error uploading video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "service": "resume-skill-extractor-assessment",
        "cohere_configured": cohere_client is not None
    }

# User management endpoints
@app.post("/api/users/login", response_model=UserResponse)
async def user_login(user_data: UserLoginRequest, request: Request):
    """Record user login and return user data with detailed tracking"""
    try:
        # Get client IP address
        client_ip = request.client.host
        if "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
        elif "x-real-ip" in request.headers:
            client_ip = request.headers["x-real-ip"]
        
        # Check if database is available
        if not database_available:
            # Return mock data if database is not available
            return {
                "id": user_data.uid,
                "email": user_data.email,
                "display_name": user_data.displayName,
                "role": user_data.role,
                "login_count": 1,
                "last_login": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
            }
            
        # Check if user exists
        user = get_user_by_email(user_data.email)
        
        if user:
            # Update existing user login
            update_user_login(user.id)
        else:
            # Create new user
            user = create_user(user_data.dict())
        
        # Save detailed login tracking data
        login_tracking_data = user_data.dict()
        login_tracking_data['ipAddress'] = client_ip
        if not login_tracking_data.get('loginTimestamp'):
            login_tracking_data['loginTimestamp'] = datetime.utcnow().isoformat()
        
        save_login_log(login_tracking_data)
        
        # Update dashboard metrics
        update_dashboard_metrics()
        
        # Return user data
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role,
            "login_count": user.login_count,
            "last_login": user.last_login.isoformat()
        }
    except Exception as e:
        print(f"Error in user login: {e}")
        # Return mock data in case of error
        return {
            "id": user_data.uid,
            "email": user_data.email,
            "display_name": user_data.displayName,
            "role": user_data.role,
            "login_count": 1,
            "last_login": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
        }

# Define UserLoginData response model
class UserLoginData(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    role: str
    login_count: int
    last_login: str
    created_at: str

@app.get("/api/users/logins", response_model=List[UserLoginData])
async def get_user_logins():
    """Get all users with their login data for admin dashboard"""
    try:
        if not database_available:
            # Return mock data if database is not available
            return []
            
        users = get_all_users_with_login_data()
        return [
            {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "role": user.role,
                "login_count": user.login_count,
                "last_login": user.last_login.isoformat(),
                "created_at": user.created_at.isoformat()
            }
            for user in users
        ]
    except Exception as e:
        print(f"Error getting user logins: {e}")
        return []

# Define detailed login log response model
class LoginLogData(BaseModel):
    id: int
    user_id: str
    user_email: str
    user_display_name: Optional[str] = None
    session_id: Optional[str] = None
    login_timestamp: str
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    platform: Optional[str] = None
    language: Optional[str] = None
    screen_resolution: Optional[str] = None
    timezone: Optional[str] = None

@app.get("/api/users/login-logs", response_model=List[LoginLogData])
async def get_login_logs(limit: int = 100):
    """Get detailed login logs for admin dashboard"""
    try:
        if not database_available:
            # Return mock data if database is not available
            return []
            
        logs = get_user_login_logs(limit=limit)
        result = []
        
        for log in logs:
            # Get user info for each log
            user = get_user(log.user_id)
            result.append({
                "id": log.id,
                "user_id": log.user_id,
                "user_email": user.email if user else "Unknown",
                "user_display_name": user.display_name if user else "Unknown",
                "session_id": log.session_id,
                "login_timestamp": log.login_timestamp.isoformat(),
                "ip_address": log.ip_address,
                "browser": log.browser,
                "operating_system": log.operating_system,
                "platform": log.platform,
                "language": log.language,
                "screen_resolution": log.screen_resolution,
                "timezone": log.timezone
            })
        
        return result
    except Exception as e:
        print(f"Error getting login logs: {e}")
        return []

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user_data(user_id: str):
    """Get user data by ID"""
    user = get_user(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role,
        "login_count": user.login_count,
        "last_login": user.last_login.isoformat()
    }

@app.get("/api/dashboard/metrics", response_model=DashboardMetricsResponse)
async def get_metrics():
    """Get dashboard metrics"""
    # Update metrics before returning
    metrics = update_dashboard_metrics()
    
    if not metrics:
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard metrics")
    
    return {
        "total_users": metrics.total_users,
        "active_users": metrics.active_users,
        "assessments_completed": metrics.assessments_completed,
        "average_score": metrics.average_score,
        "last_updated": metrics.last_updated.isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
