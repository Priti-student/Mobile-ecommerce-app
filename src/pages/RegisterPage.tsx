import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/context/AuthContext'
import { register as registerRequest } from '@/lib/api'
import type { SecurityQuestion } from '@/types/auth'

const SECURITY_QUESTIONS = [
  'In what city or town were you born?',
  'What was the name of your first pet?',
  'What was the last name of your favorite teacher in grade school?',
  'What is the first and last name of your childhood best friend?',
  'What is your favorite movie?',
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [question1, setQuestion1] = useState('')
  const [answer1, setAnswer1] = useState('')
  const [question2, setQuestion2] = useState('')
  const [answer2, setAnswer2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'vendor' ? '/vendor' : '/customer'} replace />
  }

  const availableQuestions2 = SECURITY_QUESTIONS.filter((q) => q !== question1)

  function validate(): string | null {
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    if (!question1 || !answer1?.trim()) return 'Please select security question 1 and enter an answer.'
    if (!question2 || !answer2?.trim()) return 'Please select security question 2 and enter an answer.'
    if (question1 === question2) return 'Please select two different security questions.'
    return null
  }

  function handleConfirmOpen(event: FormEvent) {
    event.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setShowConfirm(true)
  }

  async function handleConfirmSubmit() {
    setShowConfirm(false)
    setLoading(true)
    setError('')

    const securityQuestions: SecurityQuestion[] = [
      { question: question1, answer: answer1.trim() },
      { question: question2, answer: answer2.trim() },
    ]

    try {
      const response = await registerRequest({ name, email, password, securityQuestions })
      login(response)
      navigate('/customer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to sign in
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-text-primary">Create your account</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Register as a customer to add items to cart and checkout.
            </p>
          </div>

          <form onSubmit={handleConfirmOpen} className="space-y-4">
            <TextField
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <TextField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            {/* Security Questions Section */}
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-bold text-red-700">
                ⚠️ Remember the security question and answer! If you forgot your password, it helps to recover your account. Otherwise, you may lose your account forever.
              </p>
            </div>

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
              placeholder="Your answer to question 1"
              value={answer1}
              onChange={(event) => setAnswer1(event.target.value)}
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
              placeholder="Your answer to question 2"
              value={answer2}
              onChange={(event) => setAnswer2(event.target.value)}
              required
            />

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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">
              📋
            </div>
            <h3 className="mt-3 text-lg font-bold text-text-primary">Confirm Account Details</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Please review your details before creating your account.
            </p>

            <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Name</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Email</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{email}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Password</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{'•'.repeat(password.length)}</p>
              </div>
              <hr className="border-border" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Security Question 1</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{question1}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Answer 1</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{answer1}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Security Question 2</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{question2}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Answer 2</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{answer2}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}