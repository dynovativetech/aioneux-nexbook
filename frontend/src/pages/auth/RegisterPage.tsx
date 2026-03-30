import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input      from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(fullName: string, email: string, password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required.';
  else if (fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters.';

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';

  if (!confirm) errors.confirm = 'Please confirm your password.';
  else if (password !== confirm) errors.confirm = 'Passwords do not match.';

  return errors;
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [errors,    setErrors]    = useState<FieldErrors>({});
  const [apiError,  setApiError]  = useState('');
  const [loading,   setLoading]   = useState(false);

  const clearField = (field: keyof FieldErrors) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(fullName, email, password, confirm);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await signUp(fullName.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Create your account</h2>
          <p className="text-gray-500 text-sm">Get started with NexBook today.</p>
        </div>

        {apiError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3.5 text-sm text-red-600 flex items-start gap-2.5">
            <span className="text-red-400 mt-0.5">⚠</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearField('fullName'); }}
            placeholder="Alice Johnson"
            autoComplete="name"
            error={errors.fullName}
            icon={<User size={15} />}
          />

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            icon={<Mail size={15} />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
            placeholder="Min 6 characters"
            autoComplete="new-password"
            error={errors.password}
            icon={<Lock size={15} />}
          />

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="flex gap-1 -mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  password.length < 6 ? (i === 1 ? 'bg-red-400' : 'bg-gray-200') :
                  password.length < 10 ? (i <= 2 ? 'bg-amber-400' : 'bg-gray-200') :
                  (i <= 3 ? 'bg-emerald-400' : (password.length >= 12 ? 'bg-emerald-500' : 'bg-gray-200'))
                }`} />
              ))}
            </div>
          )}

          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); clearField('confirm'); }}
            placeholder="Repeat password"
            autoComplete="new-password"
            error={errors.confirm}
            icon={<Lock size={15} />}
          />

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
              transition-all duration-200 ease-in-out mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account…
              </>
            ) : (
              'Join NexBook'
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0078D7] font-semibold hover:text-[#025DB6] hover:underline transition-colors duration-150">
            Sign in to NexBook
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
