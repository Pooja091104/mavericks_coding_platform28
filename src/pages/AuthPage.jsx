import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../firebaseConfig';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Shield } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithGoogle();
      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: userCredential.user.email === 'admin@demo.com' || userCredential.user.email === 'admin@mavericks.com' ? 'admin' : 'user'
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Check for admin credentials first
        if (email === 'mavadmin@gmail.com' && password === 'mavAdd') {
          // Direct admin login with specific credentials
          onLogin({
            uid: 'admin-user',
            email: 'mavadmin@gmail.com',
            displayName: 'Admin User',
            role: 'admin'
          });
        } else {
          const userCredential = await signInWithEmail(email, password);
          // For login, check if email is admin@demo.com or has admin role in profile
          const isAdmin = email === 'admin@demo.com' || email === 'admin@mavericks.com' || email === 'mavadmin@gmail.com';
          onLogin({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || email.split('@')[0],
            role: isAdmin ? 'admin' : 'user'
          });
        }
      } else {
        const userCredential = await signUpWithEmail(email, password);
        // For signup, use the selected role but restrict admin role to specific emails
        const requestedRole = role;
        const actualRole = (email === 'mavadmin@gmail.com' || email === 'admin@demo.com' || email === 'admin@mavericks.com') ? 'admin' : 'user';
        
        onLogin({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name || email.split('@')[0],
          role: actualRole
        });
      }
    } catch (error) {
      setError(error.message);
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

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm bg-white/90 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to continue your learning journey' 
                : 'Join our community of developers'
              }
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 shadow-inner">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 bg-gray-50 p-1 rounded-md">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input pl-10 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <div className="flex space-x-4 mt-2">
                    <div
                      onClick={() => setRole('user')}
                      className={`flex-1 p-4 border rounded-xl flex items-center cursor-pointer transition-all duration-300 ${role === 'user' ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow'}`}
                    >
                      <div className={`p-2 rounded-full mr-3 ${role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <User className={`${role === 'user' ? 'text-blue-600' : 'text-gray-500'}`} size={20} />
                      </div>
                      <div>
                        <p className={`font-medium ${role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>User</p>
                        <p className="text-xs text-gray-500">For learners and participants</p>
                      </div>
                    </div>
                    
                    <div
                      onClick={() => setRole('admin')}
                      className={`flex-1 p-4 border rounded-xl flex items-center cursor-pointer transition-all duration-300 ${role === 'admin' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow'}`}
                    >
                      <div className={`p-2 rounded-full mr-3 ${role === 'admin' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <Shield className={`${role === 'admin' ? 'text-purple-600' : 'text-gray-500'}`} size={20} />
                      </div>
                      <div>
                        <p className={`font-medium ${role === 'admin' ? 'text-purple-700' : 'text-gray-700'}`}>Admin</p>
                        <p className="text-xs text-gray-500">For platform administrators</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

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
              className="w-full btn btn-primary btn-lg mt-6 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
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
              onClick={() => onLogin({
                uid: 'demo-user',
                email: 'demo@mavericks.com',
                displayName: 'Demo User',
                role: 'user'
              })}
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
          <div className="mt-4 flex justify-center space-x-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}