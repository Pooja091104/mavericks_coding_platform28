import requests
import json

def test_resume_upload():
    # Test data - a simple resume text
    test_resume = """
    SOFTWARE ENGINEER
    
    SKILLS:
    - Python, JavaScript, React, Node.js
    - SQL, MongoDB, AWS
    - Machine Learning, TensorFlow
    - Docker, Kubernetes, Git
    
    EXPERIENCE:
    - Developed web applications using React and Node.js
    - Implemented machine learning models with Python and TensorFlow
    - Deployed applications using Docker and AWS
    """
    
    # Create a test file
    with open("test_resume.txt", "w") as f:
        f.write(test_resume)
    
    # Test the API
    try:
        with open("test_resume.txt", "rb") as f:
            files = {"file": ("test_resume.txt", f, "text/plain")}
            response = requests.post("http://127.0.0.1:8002/analyze_resume", files=files)
            
        if response.status_code == 200:
            data = response.json()
            print("✅ Skill extraction successful!")
            print(f"Extracted skills: {data.get('skills', [])}")
            print(f"Skills count: {data.get('skills_count', 0)}")
            return data.get('skills', [])
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return []

if __name__ == "__main__":
    print("Testing resume upload and skill extraction...")
    skills = test_resume_upload()
    if skills:
        print(f"\n🎯 Found {len(skills)} skills: {skills}")