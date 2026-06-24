import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { RoleTabs } from '@/components/RoleTabs'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/context/AuthContext'
import { login as loginRequest, getSecurityQuestions, verifySecurityAnswers, resetPassword } from '@/lib/api'
import type { UserRole } from '@/types/auth'

type ForgotStep = 'email' | 'questions' | 'reset' | 'success'

const SECURITY_QUESTIONS = [
  'In what city or town were you born?',
  'What was the name of your first pet?',
  'What was the last name of your favorite teacher in grade school?',
  'What is the first and last name of your childhood best friend?',
  'What is your favorite movie?',
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const [role, setRole] = useState<UserRole>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [question1, setQuestion1] = useState('')
  const [question2, setQuestion2] = useState('')
  const [answer1, setAnswer1] = useState('')
  const [answer2, setAnswer2] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'vendor' ? '/vendor' : '/customer'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginRequest({ email, password, role })
      login(response)
      navigate(response.user.role === 'vendor' ? '/vendor' : '/customer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password handlers
  function openForgotPassword() {
    setShowForgot(true)
    setForgotStep('email')
    setForgotEmail(email)
    setForgotError('')
    setQuestion1('')
    setQuestion2('')
    setAnswer1('')
    setAnswer2('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  function closeForgotPassword() {
    setShowForgot(false)
    setForgotStep('email')
    setForgotError('')
  }

  async function handleForgotEmailSubmit() {
    setForgotError('')
    setForgotLoading(true)

    try {
      await getSecurityQuestions(forgotEmail)
      setQuestion1('')
      setQuestion2('')
      setForgotStep('questions')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to load security questions.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleVerifyAnswers() {
    setForgotError('')

    if (!question1 || !question2) {
      setForgotError('Please select both security questions.')
      return
    }

    if (question1 === question2) {
      setForgotError('Please select two different security questions.')
      return
    }

    if (!answer1?.trim() || !answer2?.trim()) {
      setForgotError('Please answer both security questions.')
      return
    }

    setForgotLoading(true)

    try {
      const answers = [
        { question: question1, answer: answer1.trim() },
        { question: question2, answer: answer2.trim() },
      ]
      const response = await verifySecurityAnswers(forgotEmail, answers)

      if (response.verified) {
        setForgotStep('reset')
      } else {
        setForgotError('Incorrect answers. Please try again.')
      }
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleResetPassword() {
    setForgotError('')

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match.')
      return
    }

    setForgotLoading(true)

    try {
      await resetPassword(forgotEmail, newPassword)
      setForgotStep('success')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setForgotLoading(false)
    }
  }

  function closeSuccessAndRedirect() {
    setShowForgot(false)
    setForgotStep('email')
    setEmail(forgotEmail)
    setForgotEmail('')
    setForgotError('')
  }

  const availableQuestions2 = SECURITY_QUESTIONS.filter((q) => q !== question1)

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f1f3f6] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-md">
              S
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold tracking-tight text-text-primary">Shop</span>
              <span className="text-xl font-extrabold tracking-tight text-brand-500">Ease</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to shop or manage your store
            </p>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              I am signing in as
            </p>
            <RoleTabs value={role} onChange={setRole} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {role === 'customer' ? (
              <button
                type="button"
                onClick={openForgotPassword}
                className="w-full text-right text-xs font-semibold text-brand-500 hover:text-brand-600"
              >
                Forgot password?
              </button>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {role === 'customer' ? (
            <p className="mt-6 text-center text-sm text-text-secondary">
              New here?{' '}
              <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600">
                Create an account
              </Link>
            </p>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-text-secondary">
              Vendor access is restricted. Contact the store administrator if you need help signing in.
            </div>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-medium text-text-secondary hover:text-brand-500"
        >
          ← Continue browsing without signing in
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {showForgot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Step: Enter Email */}
            {forgotStep === 'email' ? (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">
                  🔑
                </div>
                <h3 className="mt-3 text-lg font-bold text-text-primary">Forgot Password</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter your email to retrieve your security questions.
                </p>
                <div className="mt-4">
                  <TextField
                    label="Email"
                    name="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                {forgotError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {forgotError}
                  </div>
                ) : null}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotEmailSubmit}
                    disabled={forgotLoading || !forgotEmail}
                    className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Loading…' : 'Next'}
                  </button>
                </div>
              </>
            ) : null}

            {/* Step: Answer Security Questions */}
            {forgotStep === 'questions' ? (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
                  ❓
                </div>
                <h3 className="mt-3 text-lg font-bold text-text-primary">Security Questions</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Select the security questions you chose during registration and enter your answers.
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Security Question 1
                    </label>
                    <select
                      value={question1}
                      onChange={(e) => {
                        setQuestion1(e.target.value)
                        if (e.target.value === question2) setQuestion2('')
                      }}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      <option value="">Select a security question</option>
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <TextField
                    label="Answer 1"
                    name="answer1"
                    placeholder="Your answer"
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                    required
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Security Question 2
                    </label>
                    <select
                      value={question2}
                      onChange={(e) => setQuestion2(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      <option value="">Select a security question</option>
                      {availableQuestions2.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <TextField
                    label="Answer 2"
                    name="answer2"
                    placeholder="Your answer"
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                    required
                  />
                </div>
                {forgotError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {forgotError}
                  </div>
                ) : null}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setForgotStep('email'); setForgotError('') }}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyAnswers}
                    disabled={forgotLoading || !question1 || !question2 || !answer1 || !answer2}
                    className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </>
            ) : null}

            {/* Step: Reset Password */}
            {forgotStep === 'reset' ? (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                  ✅
                </div>
                <h3 className="mt-3 text-lg font-bold text-text-primary">Verified!</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter a new password for your account.
                </p>
                <div className="mt-5 space-y-4">
                  <TextField
                    label="New password"
                    name="newPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <TextField
                    label="Confirm new password"
                    name="confirmNewPassword"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                {forgotError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {forgotError}
                  </div>
                ) : null}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setForgotStep('questions'); setForgotError('') }}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={forgotLoading || !newPassword || !confirmNewPassword}
                    className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Changing…' : 'Change password'}
                  </button>
                </div>
              </>
            ) : null}

            {/* Step: Success */}
            {forgotStep === 'success' ? (
              <>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                  🎉
                </div>
                <h3 className="mt-3 text-lg font-bold text-text-primary">Password Changed Successfully!</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={closeSuccessAndRedirect}
                    className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    Go to Sign In
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}