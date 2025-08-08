from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from database_models import engine, User, Assessment, ChatInteraction, Hackathon, HackathonParticipant, DashboardMetrics, UserLoginLog

# Create session factory
Session = sessionmaker(bind=engine)

# User management functions
def get_user(user_id):
    """Get user by ID"""
    session = Session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        return user
    finally:
        session.close()

def get_user_by_email(email):
    """Get user by email"""
    session = Session()
    try:
        user = session.query(User).filter(User.email == email).first()
        return user
    finally:
        session.close()

def get_all_users_with_login_data():
    """Get all users with their login data"""
    session = Session()
    try:
        users = session.query(User).order_by(User.last_login.desc()).all()
        return users
    finally:
        session.close()

def create_user(user_data):
    """Create a new user"""
    session = Session()
    try:
        user = User(
            id=user_data["uid"],
            email=user_data["email"],
            display_name=user_data["displayName"],
            role=user_data["role"],
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            login_count=1
        )
        session.add(user)
        session.commit()
        return user
    finally:
        session.close()

def update_user_login(user_id):
    """Update user login timestamp and count"""
    session = Session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if user:
            user.last_login = datetime.utcnow()
            user.login_count += 1
            session.commit()
            return user
        return None
    finally:
        session.close()

def save_login_log(login_data):
    """Save detailed login tracking data"""
    session = Session()
    try:
        device_info = login_data.get('deviceInfo', {})
        
        login_log = UserLoginLog(
            user_id=login_data['uid'],
            session_id=login_data.get('sessionId'),
            login_timestamp=datetime.fromisoformat(login_data['loginTimestamp'].replace('Z', '+00:00')),
            ip_address=login_data.get('ipAddress'),
            browser=device_info.get('browser'),
            operating_system=device_info.get('os'),
            platform=device_info.get('platform'),
            language=device_info.get('language'),
            screen_resolution=device_info.get('screen'),
            timezone=device_info.get('timezone'),
            user_agent=device_info.get('userAgent'),
            device_info=device_info
        )
        
        session.add(login_log)
        session.commit()
        return login_log
    except Exception as e:
        session.rollback()
        print(f"Error saving login log: {e}")
        return None
    finally:
        session.close()

def get_user_login_logs(user_id=None, limit=100):
    """Get user login logs with optional user filter"""
    session = Session()
    try:
        query = session.query(UserLoginLog)
        if user_id:
            query = query.filter(UserLoginLog.user_id == user_id)
        
        logs = query.order_by(UserLoginLog.login_timestamp.desc()).limit(limit).all()
        return logs
    finally:
        session.close()

def get_recent_login_activity(days=30):
    """Get recent login activity for analytics"""
    session = Session()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logs = session.query(UserLoginLog).filter(
            UserLoginLog.login_timestamp >= cutoff_date
        ).order_by(UserLoginLog.login_timestamp.desc()).all()
        return logs
    finally:
        session.close()

# Assessment functions
def save_assessment(assessment_data):
    """Save assessment results"""
    session = Session()
    try:
        assessment = Assessment(
            id=assessment_data["assessment_id"],
            user_id=assessment_data["user_id"],
            title=assessment_data["title"],
            skills=assessment_data["skills"],
            difficulty=assessment_data["difficulty"],
            score=assessment_data["score"],
            status="completed",
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        session.add(assessment)
        session.commit()
        return assessment
    finally:
        session.close()

def get_user_assessments(user_id):
    """Get all assessments for a user"""
    session = Session()
    try:
        assessments = session.query(Assessment).filter(Assessment.user_id == user_id).all()
        return assessments
    finally:
        session.close()

# Chat interaction functions
def save_chat_interaction(user_id, message, response):
    """Save chat interaction"""
    session = Session()
    try:
        interaction = ChatInteraction(
            user_id=user_id,
            message=message,
            response=response,
            timestamp=datetime.utcnow()
        )
        session.add(interaction)
        session.commit()
        return interaction
    finally:
        session.close()

def get_chat_interactions(user_id=None, start_date=None, end_date=None):
    """Get chat interactions with optional filters"""
    session = Session()
    try:
        query = session.query(ChatInteraction)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(ChatInteraction.user_id == user_id)
        
        if start_date:
            query = query.filter(ChatInteraction.timestamp >= start_date)
        
        if end_date:
            query = query.filter(ChatInteraction.timestamp <= end_date)
        
        # Order by timestamp descending
        query = query.order_by(ChatInteraction.timestamp.desc())
        
        return query.all()
    finally:
        session.close()

# Hackathon functions
def create_hackathon(hackathon_data):
    """Create a new hackathon"""
    session = Session()
    try:
        hackathon = Hackathon(
            title=hackathon_data["title"],
            description=hackathon_data["description"],
            start_date=hackathon_data["start_date"],
            end_date=hackathon_data["end_date"],
            status=hackathon_data["status"],
            skill_level=hackathon_data["skill_level"],
            technologies=hackathon_data["technologies"],
            created_at=datetime.utcnow()
        )
        session.add(hackathon)
        session.commit()
        return hackathon
    finally:
        session.close()

def get_hackathons(status=None):
    """Get all hackathons with optional status filter"""
    session = Session()
    try:
        query = session.query(Hackathon)
        
        if status:
            query = query.filter(Hackathon.status == status)
        
        return query.all()
    finally:
        session.close()

def join_hackathon(user_id, hackathon_id):
    """Add user as participant to hackathon"""
    session = Session()
    try:
        # Check if already joined
        existing = session.query(HackathonParticipant).filter(
            HackathonParticipant.user_id == user_id,
            HackathonParticipant.hackathon_id == hackathon_id
        ).first()
        
        if existing:
            return existing
        
        # Add new participant
        participant = HackathonParticipant(
            user_id=user_id,
            hackathon_id=hackathon_id,
            joined_at=datetime.utcnow()
        )
        session.add(participant)
        session.commit()
        return participant
    finally:
        session.close()

# Dashboard metrics functions
def update_dashboard_metrics():
    """Update dashboard metrics based on current data"""
    session = Session()
    try:
        # Get metrics record (should only be one)
        metrics = session.query(DashboardMetrics).first()
        if not metrics:
            metrics = DashboardMetrics()
            session.add(metrics)
        
        # Calculate total users
        metrics.total_users = session.query(func.count(User.id)).scalar()
        
        # Calculate active users (logged in within last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        metrics.active_users = session.query(func.count(User.id)).filter(
            User.last_login >= thirty_days_ago
        ).scalar()
        
        # Calculate total completed assessments
        metrics.assessments_completed = session.query(func.count(Assessment.id)).filter(
            Assessment.status == "completed"
        ).scalar()
        
        # Calculate average assessment score
        avg_score = session.query(func.avg(Assessment.score)).filter(
            Assessment.status == "completed"
        ).scalar()
        metrics.average_score = avg_score if avg_score else 0.0
        
        # Update timestamp
        metrics.last_updated = datetime.utcnow()
        
        session.commit()
        return metrics
    finally:
        session.close()

def get_dashboard_metrics():
    """Get current dashboard metrics"""
    session = Session()
    try:
        metrics = session.query(DashboardMetrics).first()
        return metrics
    finally:
        session.close()