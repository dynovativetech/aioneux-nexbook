import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input      from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

interface FieldErrors { email?: string; password?: string; }

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-10">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome back</h2>
          <p className="text-gray-500 text-sm">Sign in to your NexBook account</p>
        </div>

        {/* API error */}
        {apiError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3.5 text-sm text-red-600 flex items-start gap-2.5">
            <span className="text-red-400 mt-0.5">⚠</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            icon={<Mail size={15} />}
          />

          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password}
              icon={<Lock size={15} />}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-[#0078D7] to-[#025DB6]
              hover:from-[#0087e0] hover:to-[#0169C9]
              shadow-[0_4px_14px_-2px_rgb(0_120_215_/_0.45)]
              hover:shadow-[0_6px_18px_-2px_rgb(0_120_215_/_0.55)]
              hover:-translate-y-0.5
              disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0
              transition-all duration-200 ease-in-out"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in to NexBook
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-7 text-center text-sm text-gray-500">
          New to NexBook?{' '}
          <Link
            to="/register"
            className="text-[#0078D7] font-semibold hover:text-[#025DB6] hover:underline transition-colors duration-150"
          >
            Create your account
          </Link>
        </p>

        {/* Divider */}
        <div className="mt-7 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Demo accounts</p>
          <div className="space-y-2">
            {[
              { role: 'Customer',    creds: 'alice@example.com / password123' },
              { role: 'Tenant Admin', creds: 'admin@example.com / password123' },
              { role: 'Super Admin', creds: 'superadmin@dynovative.com / password123' },
            ].map(({ role, creds }) => (
              <div key={role} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-400 font-medium shrink-0">{role}</span>
                <code className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-600 text-[11px] truncate">{creds}</code>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
