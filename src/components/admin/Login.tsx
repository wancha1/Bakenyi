import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight,
  Database,
  CheckCircle,
  AlertCircle,
  User,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { getSupabaseConfig, getSupabase } from '../../lib/supabaseClient';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Validation, error and success messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isConfigured } = getSupabaseConfig();

  // Simple inline validation
  function validateForm(): boolean {
    setError(null);
    if (!email) {
      setError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Full Name is required.');
        return false;
      }
      if (!password) {
        setError('Password is required.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }

    if (mode === 'signin' && !password) {
      setError('Password is required.');
      return false;
    }

    return true;
  }

  // Handle standard email/password submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const client = getSupabase();

    if (client) {
      try {
        if (mode === 'signin') {
          // Real Supabase Authentication Sign In
          const { data, error: authError } = await client.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            setError(authError.message);
          } else if (data?.user) {
            onLoginSuccess(data.user);
          }
        } else if (mode === 'signup') {
          // Real Supabase Authentication Sign Up
          const { data, error: authError } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: 'admin', // Default register as admin for this admin portal context
              },
            },
          });

          if (authError) {
            setError(authError.message);
          } else {
            setSuccessMsg('Account created successfully! Please check your email inbox to verify your account.');
            // Switch back to signin mode after sign-up
            setMode('signin');
            setPassword('');
            setConfirmPassword('');
          }
        } else if (mode === 'forgot') {
          // Real Supabase Forgot Password Request
          const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
          });

          if (resetError) {
            setError(resetError.message);
          } else {
            setSuccessMsg('Password reset instructions have been sent to your email address.');
            setMode('signin');
          }
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during authentication.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sandbox Mode Emulation
      setTimeout(() => {
        setIsLoading(false);
        const lowerEmail = email.toLowerCase();

        if (mode === 'signin') {
          // Match standard sandbox credentials
          if (
            (lowerEmail === 'admin@bakenye.com' || lowerEmail === 'wanchaaaron@gmail.com' || lowerEmail === 'aaronwancha@gmail.com' || lowerEmail === 'admin@bakenyi.org') && 
            password === 'admin123'
          ) {
            const mockUser = {
              id: 'sandbox-admin-user-uuid',
              email: lowerEmail,
              role: 'admin',
              user_metadata: { name: fullName || 'Artisan Admin' }
            };
            onLoginSuccess(mockUser);
          } else {
            setError('Invalid credentials. (Hint: For sandbox mode, use: admin@bakenye.com and admin123)');
          }
        } else if (mode === 'signup') {
          // Sandbox Account Creation
          setSuccessMsg(`Sandbox Mode Account created successfully for ${fullName}! You can now sign in using your credentials.`);
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        } else if (mode === 'forgot') {
          // Sandbox Forgot Password
          setSuccessMsg(`Sandbox Mode: A mock password reset email has been successfully sent to ${email}.`);
          setMode('signin');
        }
      }, 800);
    }
  }

  // Handle Google OAuth Sign-In
  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const client = getSupabase();

    if (client) {
      try {
        const { error: authError } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/admin`,
          },
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during Google Sign-In.');
        setIsLoading(false);
      }
    } else {
      // Sandbox Google Login Emulation
      setTimeout(() => {
        setIsLoading(false);
        const mockUser = {
          id: 'sandbox-google-user-uuid',
          email: 'aaronwancha@gmail.com',
          role: 'admin',
          user_metadata: { name: 'Google Admin' }
        };
        onLoginSuccess(mockUser);
      }, 800);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Radial Ambiance */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20 select-none">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-sans leading-tight">
              Bakenye Admin Portal
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              Secure Storefront Management
            </p>
          </div>
        </div>

        {/* Login/Signup/Forgot Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xl space-y-5">
          {/* Card Header text depends on Auth mode */}
          <div className="space-y-1 text-left">
            {mode === 'signin' && (
              <>
                <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Staff Sign In</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Provide credentials to enter your management dashboard</p>
              </>
            )}
            {mode === 'signup' && (
              <>
                <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Create Administrator Account</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Register a new profile to access store administrative features</p>
              </>
            )}
            {mode === 'forgot' && (
              <>
                <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Reset Security Password</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">We will send reset instructions to your verified email</p>
              </>
            )}
          </div>

          {/* Alert Message Banner (Success or Error) */}
          {error && (
            <div className="p-3.5 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 text-rose-500 text-[11px] font-semibold leading-relaxed rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold leading-relaxed rounded-xl flex items-start gap-2.5 animate-fade-in">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Google Sign-In (Kept and fully integrated at top) */}
          {mode !== 'forgot' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.71 14.93 1 12 1 7.37 1 3.42 3.66 1.48 7.55l3.77 2.92C6.14 7.07 8.84 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.98 3.7-8.63z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.53c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38L1.48 6.85C.53 8.75 0 10.88 0 13.15c0 2.27.53 4.4 1.48 6.3l3.77-2.92z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.2 1.1-3.16 0-5.86-2.03-6.75-5.43l-3.77 2.92C3.42 19.34 7.37 22 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700/60"></div>
                </div>
                <span className="relative bg-white dark:bg-slate-800 px-3 text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                  or use email credentials
                </span>
              </div>
            </div>
          )}

          {/* Primary Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name (Only for signup) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 dark:text-slate-400 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@bakenye.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>
            </div>

            {/* Password Field (Only for signin and signup) */}
            {mode !== 'forgot' && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500 dark:text-slate-400 block">Security Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Field (Only for signup) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-600/15 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {mode === 'signup' && (
                    <>
                      <span>Register Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {mode === 'forgot' && (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Toggle Switch links for Account Sign In / Sign Up / Forgot */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {mode === 'signin' && (
              <p>
                Don't have an administrator account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Create one here
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already have an administrator profile?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-indigo-500 hover:text-indigo-600 hover:underline flex items-center gap-1 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sandbox Instruction Help Indicator */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 border-b dark:border-slate-700 pb-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">
              {isConfigured ? 'Live Supabase Environment' : 'Sandbox Mode active'}
            </h4>
          </div>

          <div className="space-y-1 text-slate-500 dark:text-slate-400 font-medium text-left">
            {isConfigured ? (
              <p className="text-[11px]">
                Supabase credentials loaded. Run SQL editor migrations first, and enter your real registered user accounts to sign in.
              </p>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                <p>No keys detected. To explore this premium storefront dashboard, sign in with these bypass sandbox details:</p>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                  <div>📩 Email: <span className="font-bold text-indigo-500">admin@bakenye.com</span></div>
                  <div>🔑 Password: <span className="font-bold text-indigo-500">admin123</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
