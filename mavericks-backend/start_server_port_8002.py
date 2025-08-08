#!/usr/bin/env python3
"""
Startup script for the Mavericks Resume Analyzer Backend on port 8002
"""

import uvicorn
import os
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Check if API keys are set
    gemini_key = os.getenv("GEMINI_API_KEY")
    cohere_key = os.getenv("COHERE_API_KEY")
    
    if not gemini_key and not cohere_key:
        print("⚠️ Warning: No API keys found - using fallback mode")
        print("Some features may be limited. For full functionality, create a .env file with:")
        print("GEMINI_API_KEY=your_api_key_here")
        print("COHERE_API_KEY=your_cohere_api_key_here")
    else:
        if gemini_key:
            print("✅ Gemini API Key loaded successfully")
        if cohere_key:
            print("✅ Cohere API Key loaded successfully")
    
    print("🚀 Starting Mavericks Resume Analyzer Backend...")
    print("📍 Server will be available at: http://localhost:8002")
    print("📊 Health check: http://localhost:8002/health")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Start the server on port 8002 to match frontend expectations
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()