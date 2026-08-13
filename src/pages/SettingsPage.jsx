import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useLibrary } from '../lib/library'
import { changePassword, fetchRegions, updateMe } from '../lib/api'
import Button from '../components/ui/Button'

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { preferences, updatePreferences } = useLibrary()

  const [email, setEmail] = useState(user?.email || '')
  const [emailError, setEmailError] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [regions, setRegions] = useState([])
  const [region, setRegion] = useState(preferences.default_region || 'US')
  const [savingRegion, setSavingRegion] = useState(false)
  const [regionSaved, setRegionSaved] = useState(false)

  useEffect(() => {
    fetchRegions()
      .then((data) => {
        const list = (data.results || []).slice().sort((a, b) =>
          a.english_name.localeCompare(b.english_name),
        )
        setRegions(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setEmail(user?.email || '')
  }, [user])

  if (!user) return null

  const saveEmail = async (e) => {
    e.preventDefault()
    setSavingEmail(true)
    setEmailSaved(false)
    setEmailError('')
    try {
      const data = await updateMe({ email: email.trim() })
      updateUser(data.user)
      setEmailSaved(true)
    } catch (err) {
      const errors = err?.data?.errors
      setEmailError(
        errors?.email?.[0] || errors?.email || err?.message || 'Failed to update email.',
      )
    } finally {
      setSavingEmail(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordSaved(false)
    setPasswordErrors({})
    try {
      await changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setPasswordSaved(true)
    } catch (err) {
      if (err?.data?.errors) setPasswordErrors(err.data.errors)
      else setPasswordErrors({ _: err?.message || 'Failed to change password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const saveRegion = async (e) => {
    e.preventDefault()
    setSavingRegion(true)
    setRegionSaved(false)
    try {
      await updatePreferences({ default_region: region })
      setRegionSaved(true)
    } finally {
      setSavingRegion(false)
    }
  }

  const passwordErrorFor = (key) => {
    const list = passwordErrors[key]
    return Array.isArray(list) ? list[0] : list
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-28 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage your account and app preferences.</p>

      <div className="mt-8 space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Account</h2>

          <form onSubmit={saveEmail} className="mt-4 space-y-4">
            <Field label="Email" error={emailError}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
              />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="accent" size="sm" disabled={savingEmail}>
                {savingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save email
              </Button>
              {emailSaved && <span className="text-sm text-emerald-400">Saved</span>}
            </div>
          </form>

          <form onSubmit={savePassword} className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <Field label="Current password" error={passwordErrorFor('current_password')}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
              />
            </Field>
            <Field label="New password" error={passwordErrorFor('password')}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
              />
            </Field>
            <Field label="Confirm new password" error={passwordErrorFor('password_confirmation')}>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
              />
            </Field>
            {passwordErrorFor('_') && (
              <p className="text-sm text-red-400">{passwordErrorFor('_')}</p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" variant="outline" size="sm" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Change password
              </Button>
              {passwordSaved && <span className="text-sm text-emerald-400">Saved</span>}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Display</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Used as the default region when checking streaming availability.
          </p>

          <form onSubmit={saveRegion} className="mt-4 space-y-4">
            <Field label="Default watch region">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 [&>option]:bg-neutral-900"
              >
                {regions.map((r) => (
                  <option key={r.iso_3166_1} value={r.iso_3166_1}>
                    {r.english_name} ({r.iso_3166_1})
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="outline" size="sm" disabled={savingRegion}>
                {savingRegion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save region
              </Button>
              {regionSaved && <span className="text-sm text-emerald-400">Saved</span>}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
