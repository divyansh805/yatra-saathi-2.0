import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { SafeImage } from '../components/SafeImage';
import { Reveal } from '../components/Reveal';
import { IMAGES } from '../data/destinations';
import { useApp } from '../contexts/AppContext';
import { DURATION_FAST, EASE_PRIMARY } from '../motion/tokens';

type AuthMode = 'login' | 'register' | 'forgot';

interface FloatingFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string | null;
  required?: boolean;
  rightSlot?: ReactNode;
  inputClassName?: string;
}

function FloatingField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  onBlur,
  error,
  required,
  rightSlot,
  inputClassName = '',
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder=" "
          className={`peer w-full px-4 pt-6 pb-2.5 min-h-[56px] rounded-xl bg-white border text-base text-[#142322] transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-600 focus:ring-red-200'
              : 'border-[#D7CFC1] focus:border-[#123D3A] focus:ring-[#123D3A]/15'
          } ${rightSlot ? 'pr-12' : ''} ${inputClassName}`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 transition-all duration-200 origin-left ${
            floated
              ? 'top-2 text-sm font-semibold text-[#123D3A] scale-[0.86]'
              : 'top-1/2 -translate-y-1/2 text-base text-[#5A6664]'
          }`}
        >
          {label}
        </label>
        {rightSlot}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION_FAST, ease: EASE_PRIMARY }}
            className="mt-1.5 text-sm font-medium text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AuthPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { login, register, runtimeConfig } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedFrom = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Forgot/Reset password flow
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
    setResetRequested(false);
    setDevCodeHint(null);
    setTouched({});
  }, [initialMode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
    setResetRequested(false);
    setDevCodeHint(null);
    setTouched({});
  };

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const emailError =
    touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address (e.g. name@domain.com).'
      : null;

  const nameError =
    mode === 'register' && touched.name && name.trim().length > 0 && name.trim().length < 2
      ? 'Full name should be at least 2 characters.'
      : null;

  const passwordError =
    mode === 'register' && touched.password && password.length > 0 && password.length < 8
      ? 'Use at least 8 characters for a strong password.'
      : null;

  const confirmError =
    mode === 'register' &&
    touched.confirm &&
    confirmPassword.length > 0 &&
    password !== confirmPassword
      ? 'Passwords do not match yet.'
      : null;

  const newPasswordError =
    mode === 'forgot' &&
    resetRequested &&
    touched.newPassword &&
    newPassword.length > 0 &&
    newPassword.length < 8
      ? 'New password must be at least 8 characters.'
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter both your email address and password.');
        return;
      }
      setLoading(true);
      try {
        await login(email.trim(), password);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      setTouched({ name: true, email: true, password: true, confirm: true });
      if (name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        await register(name.trim(), email.trim(), password, confirmPassword);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Forgot password flow
    if (!resetRequested) {
      setTouched({ email: true });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Enter the email address registered with your account.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          devResetCode?: string;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || 'Could not process reset request.');
        setResetRequested(true);
        setSuccessMsg(data.message || 'Verification code generated.');
        if (data.devResetCode) setDevCodeHint(data.devResetCode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reset request failed.');
      } finally {
        setLoading(false);
      }
    } else {
      setTouched({ newPassword: true });
      if (!resetCode.trim() || newPassword.length < 8) {
        setError('Enter the verification code and a new password of at least 8 characters.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            code: resetCode.trim(),
            newPassword,
          }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        if (!res.ok) throw new Error(data.error || 'Unable to reset password.');
        setSuccessMsg(data.message || 'Password updated. You may now sign in.');
        setTimeout(() => switchMode('login'), 900);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Password reset failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8F6F0]">
      {/* Left Split Visual with Gentle Ken-Burns Motion */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-[#123D3A] overflow-hidden flex-col justify-between p-10">
        <motion.div
          className="absolute inset-0 will-change-transform"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.07, 1.02] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }
          }
        >
          <SafeImage
            src={IMAGES.spitiRoad}
            alt="Winding Himalayan highway through Spiti Valley at dawn"
            priority
            darkSkeleton
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B29]/92 via-[#0D2B29]/45 to-[#0D2B29]/55 pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <BrandMark light />
          </Link>
        </div>

        <Reveal immediate className="relative z-10 space-y-4 max-w-sm">
          <p className="eyebrow-mono text-[#E9A34A]">YATRA SAATHI · INDIA</p>
          <p className="font-editorial text-3xl text-white leading-snug text-balance">
            “Know what awaits beyond the station gate before your train arrives.”
          </p>
          <p className="text-base text-[#F8F6F0]/85 leading-relaxed">
            Plan smart local hops, save attraction routes, and check ground-level stay notes across India.
          </p>
        </Reveal>
      </div>

      {/* Right Split Form */}
      <div className="lg:col-span-7 flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-[44px] text-[15px] font-medium text-[#495553] hover:text-[#123D3A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
          <div className="lg:hidden">
            <BrandMark />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_PRIMARY }}
              className="mb-7"
            >
              <p className="eyebrow-mono text-[#5A6664] mb-2">
                {mode === 'login' ? 'ACCOUNT SIGN IN' : mode === 'register' ? 'NEW TRAVELLER' : 'ACCOUNT RECOVERY'}
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#123D3A] leading-tight">
                {mode === 'login'
                  ? 'Welcome back, traveller'
                  : mode === 'register'
                  ? 'Create your Yatra Saathi account'
                  : 'Reset your password'}
              </h1>
              <p className="text-[15px] sm:text-base text-[#495553] mt-2 leading-relaxed">
                {mode === 'login'
                  ? 'Sign in to access your travel dashboard, arrival ride planner, and saved itineraries.'
                  : mode === 'register'
                  ? 'Join Yatra Saathi to sync your plans across sessions.'
                  : 'Recover access to your saved travel plans.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {redirectedFrom && mode === 'login' && !error && !successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#8CC9E8]/20 border border-[#8CC9E8]/60 text-[#123D3A] text-sm font-medium">
              Please sign in to access your Yatra Saathi travel tools.
            </div>
          )}

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                key="auth-error"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DURATION_FAST, ease: EASE_PRIMARY }}
                className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-[15px] flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {successMsg && (
              <motion.div
                key="auth-success"
                role="status"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DURATION_FAST, ease: EASE_PRIMARY }}
                className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[15px] flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" aria-hidden="true" />
                <div>
                  <p>{successMsg}</p>
                  {devCodeHint && (
                    <p className="mt-1 font-mono text-sm font-semibold">
                      Verification code: {devCodeHint}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <FloatingField
                id="auth-name"
                label="Full Name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={setName}
                onBlur={() => markTouched('name')}
                error={nameError}
              />
            )}

            <FloatingField
              id="auth-email"
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
              onBlur={() => markTouched('email')}
              error={emailError}
            />

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <FloatingField
                  id="auth-password"
                  label={mode === 'register' ? 'Password (min. 8 characters)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={setPassword}
                  onBlur={() => markTouched('password')}
                  error={passwordError}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#5A6664] hover:text-[#123D3A] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-sm font-medium text-[#123D3A] hover:text-[#E9A34A] py-1 cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <FloatingField
                id="auth-confirm"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={() => markTouched('confirm')}
                error={confirmError}
              />
            )}

            {mode === 'forgot' && resetRequested && (
              <>
                <FloatingField
                  id="reset-code"
                  label="Verification Code (6 characters)"
                  type="text"
                  required
                  value={resetCode}
                  onChange={setResetCode}
                  inputClassName="font-mono uppercase"
                />
                <FloatingField
                  id="reset-new-pw"
                  label="New Password (min. 8 characters)"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={setNewPassword}
                  onBlur={() => markTouched('newPassword')}
                  error={newPasswordError}
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 min-h-[50px] rounded-xl bg-[#123D3A] text-white font-semibold text-base hover:bg-[#194E4A] active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              {mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : resetRequested
                ? 'Update Password'
                : 'Request Reset Code'}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[#E5DFD3] text-[15px] text-[#495553] flex items-center justify-between">
            {mode === 'login' ? (
              <>
                <span>New to Yatra Saathi?</span>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-[#123D3A] hover:text-[#E9A34A] min-h-[44px] cursor-pointer transition-colors"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-[#123D3A] hover:text-[#E9A34A] min-h-[44px] cursor-pointer transition-colors"
                >
                  Sign in instead
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-[#5A6664] text-center">
          Authenticated via HTTP-only signed server session (
          {runtimeConfig.authMode === 'production-session' ? 'Production' : 'Development server store'}).
        </p>
      </div>
    </div>
  );
}
