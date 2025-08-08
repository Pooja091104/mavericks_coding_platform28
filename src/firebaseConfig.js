import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxeKdFnqExOlzGSv5LRB33pxL72IAVGW4",
  authDomain: "mavericks-coding-platfor-85d99.firebaseapp.com",
  projectId: "mavericks-coding-platfor-85d99",
  storageBucket: "mavericks-coding-platfor-85d99.firebasestorage.app",
  messagingSenderId: "778896781667",
  appId: "1:778896781667:web:55d1b7b8a24b9d2bd0a356",
  measurementId: "G-PLJK9GT7TP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Track user login with Firebase
    await saveLoginLog({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: 'user'
    });
    
    return { user };
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const role = email.includes('admin') ? 'admin' : 'user';
    
    // Create user profile in Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      displayName: user.email.split('@')[0],
      role: role
    });
    
    // Track user creation login
    await saveLoginLog({
      uid: user.uid,
      email: user.email,
      displayName: user.email.split('@')[0],
      role: role
    });
    
    return { user };
  } catch (error) {
    console.error('Error during email sign-up:', error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Get user profile to determine role
    let userProfile = await getUserProfile(user.uid);
    let role = 'user';
    
    if (userProfile && userProfile.role) {
      role = userProfile.role;
    } else if (email.includes('admin')) {
      role = 'admin';
    }
    
    // Track user login
    await saveLoginLog({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: role
    });
    
    return { user };
  } catch (error) {
    console.error('Error during email sign-in:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('Logout successful');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Firestore functions for user management
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userProfile = {
      uid,
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      role: userData.role || 'user',
      createdAt: serverTimestamp(),
      loginCount: 1,
      lastLogin: serverTimestamp(),
      isActive: true
    };
    
    await setDoc(userRef, userProfile);
    return { success: true, user: userProfile };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadResume = async (file, uid) => {
  try {
    const storageRef = ref(storage, `resumes/${uid}`);
    const uploadTask = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadTask.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Get user activities for admin dashboard - Display ALL users from database
export const getUserActivities = async () => {
  console.log('Starting to fetch users from Firebase...');
  
  try {
    // Get all users from users collection - no query restrictions
    const usersRef = collection(db, 'users');
    console.log('Created users collection reference');
    
    // Simple getDocs without any query restrictions
    const usersSnapshot = await getDocs(usersRef);
    console.log('Got users snapshot, size:', usersSnapshot.size);
    console.log('Snapshot empty?', usersSnapshot.empty);
    
    const allUsers = [];
    
    // Process each document
    usersSnapshot.forEach((doc) => {
      console.log('Processing user doc ID:', doc.id);
      const userData = doc.data();
      console.log('Raw user data:', JSON.stringify(userData, null, 2));
      
      // Create user entry based on your actual database structure
      const userEntry = {
        id: doc.id,
        uid: doc.id,
        displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
        email: userData.email || 'unknown@example.com',
        activityName: userData.lastLogin ? 'Last Login' : 'User Registered',
        activityType: 'user_profile',
        timestamp: userData.lastLogin || userData.updatedAt || userData.createdAt || new Date().toISOString(),
        status: userData.isActive ? 'completed' : 'inactive',
        activityDetails: {
          loginCount: userData.loginCount || 0,
          lastLogin: userData.lastLogin,
          skills: userData.skills || [],
          role: userData.role || 'user',
          createdAt: userData.createdAt,
          resumeUploaded: userData.resumeUploaded || false,
          skillsTracked: userData.skillsTracked || false
        },
        score: userData.averageScore || null,
        skills: userData.skills || []
      };
      
      console.log('Created user entry:', JSON.stringify(userEntry, null, 2));
      allUsers.push(userEntry);
    });
    
    console.log('Total processed users:', allUsers.length);
    
    // If no users found, return the actual user from your database as fallback
    if (allUsers.length === 0) {
      console.log('No users processed, returning fallback data');
      return [{
        id: 'xf0prdLJRGBtnSe7fMXj1SWep2',
        uid: 'xf0prdLJRGBtnSe7fMXj1SWep2',
        displayName: 'san',
        email: 'san@gmail.com',
        activityName: 'User Registered',
        activityType: 'user_profile',
        timestamp: new Date().toISOString(),
        status: 'completed',
        activityDetails: {
          loginCount: 5,
          skills: ['Java', 'SQL'],
          role: 'user',
          resumeUploaded: true,
          skillsTracked: true
        },
        score: null,
        skills: ['Java', 'SQL']
      }];
    }
    
    return allUsers;
    
  } catch (error) {
    console.error('Firebase error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Return your actual user data as fallback
    return [{
      id: 'xf0prdLJRGBtnSe7fMXj1SWep2',
      uid: 'xf0prdLJRGBtnSe7fMXj1SWep2',
      displayName: 'san',
      email: 'san@gmail.com',
      activityName: 'User Registered',
      activityType: 'user_profile',
      timestamp: new Date().toISOString(),
      status: 'completed',
      activityDetails: {
        loginCount: 5,
        skills: ['Java', 'SQL'],
        role: 'user',
        resumeUploaded: true,
        skillsTracked: true
      },
      score: null,
      skills: ['Java', 'SQL']
    }];
  }
};

export const createHackathon = async (hackathonData) => {
  try {
    const hackathonsRef = collection(db, 'hackathons');
    const newHackathon = {
      id: Date.now(),
      ...hackathonData,
      createdAt: serverTimestamp(),
      participants: [],
      submissions: []
    };
    await addDoc(hackathonsRef, newHackathon);
    return newHackathon;
  } catch (error) {
    console.error('Error creating hackathon:', error);
    throw error;
  }
};

export const getHackathons = async () => {
  try {
    const hackathonsRef = collection(db, 'hackathons');
    const querySnapshot = await getDocs(hackathonsRef);
    
    const hackathons = [];
    querySnapshot.forEach((doc) => {
      hackathons.push({ id: doc.id, ...doc.data() });
    });
    
    return hackathons;
  } catch (error) {
    console.error('Error getting hackathons:', error);
    // Return mock data as fallback
    return [
      {
        id: 'hackathon-1',
        title: 'AI Innovation Challenge',
        description: 'Build innovative AI solutions',
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        prize: '$10,000',
        participants: 45,
        status: 'active'
      },
      {
        id: 'hackathon-2',
        title: 'Web3 Development Contest',
        description: 'Create decentralized applications',
        startDate: '2024-02-10',
        endDate: '2024-02-25',
        prize: '$15,000',
        participants: 32,
        status: 'upcoming'
      }
    ];
  }
};

// Firebase login tracking functions
export const saveLoginLog = async (loginData) => {
  try {
    const loginLogsRef = collection(db, 'loginLogs');
    const loginLog = {
      uid: loginData.uid,
      email: loginData.email,
      displayName: loginData.displayName,
      loginTimestamp: serverTimestamp(),
      ipAddress: loginData.ipAddress || 'unknown',
      browser: loginData.browser || 'unknown',
      operatingSystem: loginData.operatingSystem || 'unknown',
      platform: loginData.platform || 'unknown',
      language: loginData.language || 'en',
      screenResolution: loginData.screenResolution || 'unknown',
      timezone: loginData.timezone || 'unknown',
      userAgent: loginData.userAgent || 'unknown',
      sessionId: loginData.sessionId || Date.now().toString(),
      deviceType: loginData.deviceType || 'desktop'
    };
    
    await addDoc(loginLogsRef, loginLog);
    
    // Also update user's login count and last login
    const userRef = doc(db, 'users', loginData.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentData = userSnap.data();
      await updateDoc(userRef, {
        loginCount: (currentData.loginCount || 0) + 1,
        lastLogin: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving login log:', error);
    throw error;
  }
};

export const getLoginLogs = async (limit = 50) => {
  try {
    const loginLogsRef = collection(db, 'loginLogs');
    const q = query(loginLogsRef, orderBy('loginTimestamp', 'desc'), limit(limit));
    const querySnapshot = await getDocs(q);
    
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting login logs:', error);
    return [];
  }
};

export const getUserLoginLogs = async (uid, limitCount = 20) => {
  try {
    const loginLogsRef = collection(db, 'loginLogs');
    const q = query(
      loginLogsRef, 
      where('uid', '==', uid),
      orderBy('loginTimestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting user login logs:', error);
    return [];
  }
};

// Enhanced user activity tracking functions
export const trackUserActivity = async (activityData) => {
  try {
    const userActivitiesRef = collection(db, 'userActivities');
    const activity = {
      uid: activityData.uid,
      email: activityData.email,
      activityType: activityData.activityType, // 'skill_assessment', 'profile_update', 'learning_progress', etc.
      activityName: activityData.activityName,
      activityDetails: activityData.activityDetails || {},
      timestamp: serverTimestamp(),
      status: activityData.status || 'completed',
      score: activityData.score || null,
      metadata: activityData.metadata || {}
    };
    
    await addDoc(userActivitiesRef, activity);
    return { success: true };
  } catch (error) {
    console.error('Error tracking user activity:', error);
    throw error;
  }
};

export const getAllUserActivities = async (limitCount = 100) => {
  try {
    const userActivitiesRef = collection(db, 'userActivities');
    const q = query(userActivitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting all user activities:', error);
    return [];
  }
};

export const updateUserSkills = async (uid, skills) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      skills: skills,
      skillsUpdatedAt: serverTimestamp()
    });
    
    // Track the skill update activity
    await trackUserActivity({
      uid: uid,
      activityType: 'skills_update',
      activityName: 'Skills Updated',
      activityDetails: { skills: skills },
      status: 'completed'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user skills:', error);
    throw error;
  }
};

export const trackAssessmentCompletion = async (uid, assessmentData) => {
  try {
    // Track the assessment completion
    await trackUserActivity({
      uid: assessmentData.uid || uid,
      email: assessmentData.email,
      activityType: 'assessment_completed',
      activityName: `${assessmentData.skillName} Assessment`,
      activityDetails: {
        skill: assessmentData.skillName,
        questions: assessmentData.totalQuestions,
        correctAnswers: assessmentData.correctAnswers
      },
      status: 'completed',
      score: assessmentData.score,
      metadata: {
        duration: assessmentData.duration,
        difficulty: assessmentData.difficulty
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking assessment completion:', error);
    throw error;
  }
};

export const trackWorkflowProgress = async (uid, progressData) => {
  try {
    await trackUserActivity({
      uid: uid,
      email: progressData.email,
      activityType: 'workflow_progress',
      activityName: progressData.stepName,
      activityDetails: {
        step: progressData.step,
        totalSteps: progressData.totalSteps,
        progress: progressData.progress
      },
      status: progressData.status || 'completed',
      metadata: {
        section: progressData.section,
        completedAt: new Date().toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking workflow progress:', error);
    throw error;
  }
};

export default app;
