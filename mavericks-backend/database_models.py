from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mavericks_platform.db")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create base class for declarative models
Base = declarative_base()

# Define User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)  # UID from Firebase or other auth provider
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String)
    role = Column(String, default="user")  # user, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    login_count = Column(Integer, default=1)
    
    # Relationships
    assessments = relationship("Assessment", back_populates="user")
    chat_interactions = relationship("ChatInteraction", back_populates="user")
    hackathon_participants = relationship("HackathonParticipant", back_populates="user")
    login_logs = relationship("UserLoginLog", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"

# Define Assessment model
class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True)  # Generated assessment ID
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    skills = Column(JSON)  # List of skills tested
    difficulty = Column(String)  # beginner, intermediate, advanced
    score = Column(Float)  # Percentage score
    status = Column(String)  # completed, in_progress
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="assessments")
    
    def __repr__(self):
        return f"<Assessment {self.id} - {self.title}>"

# Define ChatInteraction model
class ChatInteraction(Base):
    __tablename__ = "chat_interactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_interactions")
    
    def __repr__(self):
        return f"<ChatInteraction {self.id}>"

# Define Hackathon model
class Hackathon(Base):
    __tablename__ = "hackathons"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String)  # active, upcoming, completed
    skill_level = Column(String)  # beginner, intermediate, advanced
    technologies = Column(JSON)  # List of technologies/skills
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    participants = relationship("HackathonParticipant", back_populates="hackathon")
    
    def __repr__(self):
        return f"<Hackathon {self.id} - {self.title}>"

# Define HackathonParticipant model (many-to-many relationship)
class HackathonParticipant(Base):
    __tablename__ = "hackathon_participants"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    hackathon_id = Column(Integer, ForeignKey("hackathons.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="hackathon_participants")
    hackathon = relationship("Hackathon", back_populates="participants")
    
    def __repr__(self):
        return f"<HackathonParticipant {self.id}>"

# Define UserLoginLog model for detailed login tracking
class UserLoginLog(Base):
    __tablename__ = "user_login_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String)
    login_timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
    browser = Column(String)
    operating_system = Column(String)
    platform = Column(String)
    language = Column(String)
    screen_resolution = Column(String)
    timezone = Column(String)
    user_agent = Column(Text)
    device_info = Column(JSON)  # Store complete device info as JSON
    
    # Relationship
    user = relationship("User", back_populates="login_logs")
    
    def __repr__(self):
        return f"<UserLoginLog {self.user_id} at {self.login_timestamp}>"

# Define DashboardMetrics model for caching dashboard statistics
class DashboardMetrics(Base):
    __tablename__ = "dashboard_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    total_users = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    assessments_completed = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<DashboardMetrics {self.last_updated}>"

# Create all tables
def init_db():
    Base.metadata.create_all(engine)
    
    # Create a session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Initialize dashboard metrics if not exists
    if not session.query(DashboardMetrics).first():
        metrics = DashboardMetrics()
        session.add(metrics)
        session.commit()
    
    session.close()

# Initialize database if this file is run directly
if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")