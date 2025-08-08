# Resume Upload and Skill Extraction Instructions

## Overview
This document provides instructions for using the resume upload and skill extraction functionality in the Mavericks Coding Platform.

## Setup Instructions

### 1. Start the Backend Server on Port 8002
The frontend is configured to connect to the backend on port 8002. Use the provided batch file to start the server:

```
cd mavericks-backend
start_server_port_8002.bat
```

Alternatively, you can run the Python script directly:

```
cd mavericks-backend
python start_server_port_8002.py
```

### 2. Verify the Server is Running
You should see output indicating that the server is running on port 8002:

```
🚀 Starting Mavericks Resume Analyzer Backend...
📍 Server will be available at: http://localhost:8002
```

### 3. Test the Resume Upload Functionality
You can test the resume upload and skill extraction functionality using the provided test script:

```
python test_resume_upload.py
```

This script will create a sample resume, upload it to the server, and display the extracted skills.

## Using the Resume Upload Feature

1. Navigate to the Resume Upload tab in the application
2. Click "Choose File" to select a resume file (PDF, TXT, or DOCX)
3. Click "Upload and Extract Skills"
4. The extracted skills will be displayed below

## Troubleshooting

- If you encounter connection errors, ensure the backend server is running on port 8002
- If skills are not being extracted correctly, check the format of your resume
- For any other issues, check the console logs in both the frontend and backend

## Notes

- The backend server must be running on port 8002 for the resume upload functionality to work
- The skill extraction uses pattern matching to identify common technical skills
- No database connection is required for the basic resume upload and skill extraction functionality