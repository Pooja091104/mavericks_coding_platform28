// src/pages/LoginPage.jsx
import { useState } from "react";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, saveLoginLog, createUserProfile, getUserProfile } from '../firebaseConfig';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import "../styles.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper function to get user device and browser info
  const getUserDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    };
    return deviceInfo;
  };

  // Function to track user login with detailed information using Firebase
  const trackUserLogin = async (user, role = 'user') => {
    try {
      const deviceInfo = captureDeviceInfo();
      const loginData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: role,
        ...deviceInfo
      };

      // Save login log to Firebase
      await saveLoginLog(loginData);
      
      // Check if user profile exists, create if not
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: role
        });
      }

      console.log('Firebase login tracking successful');
    } catch (error) {
      console.error('Error tracking login in Firebase:', error);
      // Don't block login if tracking fails
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmail(email, password);

      console.log("Logged in:", userCredential.user);
      
      // Track the login with detailed information
      await trackUserLogin(userCredential.user);
      
      onLogin(userCredential.user); // callback to parent
    } catch (err) {
      console.error("Login Error:", err);
      // Show user-friendly errors
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 bg-pattern">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Mavericks Coding Platform</h1>
          <p className="text-gray-600 text-lg">Learn • Build • Grow</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm bg-white/90 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to continue your learning journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 bg-gray-50 p-1 rounded-md">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 bg-gray-50 p-1 rounded-md">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm animate-pulse">
                <p className="text-red-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-lg mt-6 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Login */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <p className="mx-4 text-sm text-gray-500 font-medium">Or try our demo</p>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            <button
              onClick={async () => {
                const demoUser = {
                  uid: 'demo-user',
                  email: 'admin@demo.com', // Changed to admin email to get admin access
                  displayName: 'Demo Admin User',
                  role: 'admin' // Changed to admin role
                };
                // Track demo login as well
                await trackUserLogin(demoUser);
                onLogin(demoUser);
              }}
              className="w-full btn btn-secondary shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Continue as Demo User
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 border-b border-blue-200 hover:border-blue-600">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 border-b border-blue-200 hover:border-blue-600">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
