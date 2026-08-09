import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clapperboard, Loader2, LogIn, UserPlus, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import Button from './ui/Button'

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    setError('')
  }, [mode])

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({
          name,
          username: username || null,
          email,
          password,
          password_confirmation: password,
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-300 focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-neutral-950/60 text-neutral-200 backdrop-blur transition-colors hover:bg-neutral-950"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-[0_4px_20px_rgba(34,211,238,0.4)]">
            <Clapperboard className="h-6 w-6 text-white" />
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === 'login'
              ? 'Sign in to sync your library across devices.'
              : 'Save movies, track what you watch, and rate them.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {(['login', 'register']).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`relative rounded-full py-2 text-sm font-medium transition-colors ${
                mode === m ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/15"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative">{m === 'login' ? 'Log in' : 'Register'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === 'register' && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className={inputClass}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (optional)"
                className={inputClass}
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className={inputClass}
          />

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-2.5 text-xs font-medium text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  )
}
