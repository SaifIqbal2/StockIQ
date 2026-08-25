import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, Briefcase, Calendar, Target, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1); // 1: Credentials, 2: Profile Data, 3: OTP Verification
  
  // Step 1: Credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Investor Profile
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('Working Professional');
  const [ageGroup, setAgeGroup] = useState('22 - 30');
  const [location, setLocation] = useState('Karachi');
  const [investmentInterest, setInvestmentInterest] = useState('Capital Growth');

  // Step 3: OTP Verification
  const [otpToken, setOtpToken] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetFormState = () => {
    setIsSignUp(false);
    setSignUpStep(1);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setOtpToken('');
    setError('');
    setResendStatus('');
  };

  // Step 1 -> Step 2 Validation
  const handleProceedToProfile = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match! Please check your confirm password entry.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setSignUpStep(2);
  };

  // Step 2 Submit: Call Supabase SignUp
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const profileData = {
      full_name: fullName,
      phone_number: phone,
      occupation,
      age_group: ageGroup,
      location,
      investment_interest: investmentInterest
    };

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        setSignUpStep(3); // Move to OTP demo screen
      }, 600);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profileData
        }
      });

      if (error) throw error;

      setSignUpStep(3); // Move to OTP verification screen
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        onAuthSuccess({
          email,
          id: 'demo-user-123',
          user_metadata: { full_name: fullName, location }
        });
        setLoading(false);
        onClose();
        resetFormState();
      }, 600);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'signup'
      });

      if (error) throw error;

      onAuthSuccess(data.user);
      onClose();
      resetFormState();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please check your email or click Resend.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    setResendStatus('');
    setError('');
    if (!isSupabaseConfigured) {
      setResendStatus('Demo OTP code resent to your email.');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) throw error;
      setResendStatus('Verification code successfully resent to your email!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        onAuthSuccess({ email, id: 'demo-user-123' });
        setLoading(false);
        onClose();
        resetFormState();
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      onAuthSuccess(data.user);
      onClose();
      resetFormState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: isSignUp && signUpStep === 2 ? '540px' : '440px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          color: '#ffffff',
          boxSizing: 'border-box',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            resetFormState();
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Close modal"
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}
          >
            {isSignUp && signUpStep === 3 ? (
              <ShieldCheck style={{ width: '24px', height: '24px', color: '#10b981' }} />
            ) : (
              <Lock style={{ width: '24px', height: '24px' }} />
            )}
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {!isSignUp
              ? 'Welcome Back'
              : signUpStep === 1
              ? 'Create Account (Step 1 of 2)'
              : signUpStep === 2
              ? 'Investor Profile (Step 2 of 2)'
              : 'Verify Your Email (OTP)'}
          </h3>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
            {!isSignUp
              ? 'Sign in to access your saved PSX portfolios and watchlists'
              : signUpStep === 1
              ? 'Enter your security credentials to get started'
              : signUpStep === 2
              ? 'Customize your PSX investment preferences and profile'
              : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: '#f43f5e',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Resend Status Notification */}
        {resendStatus && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldCheck style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {!isSignUp && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <Mail style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@psx.pk"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#3b82f6', color: '#ffffff', fontWeight: 600, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '6px', fontSize: '14px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* SIGN UP STEP 1: Account Credentials */}
        {isSignUp && signUpStep === 1 && (
          <form onSubmit={handleProceedToProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <User style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Muhammad Ali"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <Mail style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@psx.pk"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              style={{ width: '100%', background: '#3b82f6', color: '#ffffff', fontWeight: 600, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px' }}
            >
              Continue to Investor Profile
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </form>
        )}

        {/* SIGN UP STEP 2: Investor Profile Data */}
        {isSignUp && signUpStep === 2 && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              {/* Phone */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  <Phone style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Occupation */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  <Briefcase style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  Occupation / Status
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Working Professional">Working Professional</option>
                  <option value="Student">Student</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Full-time Investor">Full-time Investor</option>
                </select>
              </div>

              {/* Age Group */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  <Calendar style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  Age Group
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Under 22">Under 22</option>
                  <option value="22 - 30">22 - 30</option>
                  <option value="31 - 45">31 - 45</option>
                  <option value="45+">45+</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  <MapPin style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  City / Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Other">Other</option>
                </select>
              </div>

            </div>

            {/* Investment Interest */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                <Target style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                Primary Investment Goal
              </label>
              <select
                value={investmentInterest}
                onChange={(e) => setInvestmentInterest(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="Capital Growth">Capital Growth (High ROE Stocks)</option>
                <option value="Dividend Income">Dividend Income (High Yield)</option>
                <option value="Long-term Value">Long-term Value (Low P/E)</option>
                <option value="Day Trading / Momentum">Day Trading / Momentum</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSignUpStep(1)}
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: '#10b981', color: '#030712', fontWeight: 800, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP STEP 3: Supabase Email OTP Verification */}
        {isSignUp && signUpStep === 3 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                A 6-digit confirmation OTP code has been sent to <strong>{email}</strong>. Please enter the code below to complete account activation.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', textAlign: 'center' }}>
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.trim())}
                placeholder="123456"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px', color: '#ffffff', fontSize: '20px', fontWeight: 800, letterSpacing: '0.3em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpToken.length < 6}
              style={{ width: '100%', background: '#10b981', color: '#030712', fontWeight: 800, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: (loading || otpToken.length < 6) ? 0.6 : 1 }}
            >
              {loading ? 'Verifying OTP...' : 'Verify & Activate Account'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '6px', margin: '0 auto' }}
            >
              <RefreshCw style={{ width: '12px', height: '12px' }} />
              Resend OTP Code
            </button>
          </form>
        )}

        {/* Toggle Sign In / Sign Up Link */}
        {signUpStep !== 3 && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setSignUpStep(1);
                setError('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                marginLeft: '4px'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
