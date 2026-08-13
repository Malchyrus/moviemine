import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { updateMe } from '../lib/api'
import { resizeCover } from '../lib/image'
import Button from '../components/ui/Button'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    setName(user?.name || '')
    setUsername(user?.username || '')
    setBio(user?.bio || '')
    setAvatar(user?.avatar || null)
  }, [user])

  if (!user) return null

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeCover(file, 512)
      setAvatar(dataUrl)
      setSaved(false)
    } catch {
      setError('Could not process that image.')
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    setFieldErrors({})
    try {
      const payload = { name: name.trim() }
      payload.username = username.trim() || null
      payload.bio = bio.trim() || null
      if (avatar && avatar !== user.avatar) payload.avatar = avatar
      const data = await updateMe(payload)
      updateUser(data.user)
      setSaved(true)
    } catch (err) {
      if (err?.data?.errors) setFieldErrors(err.data.errors)
      else setError(err?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const errorFor = (key) => {
    const list = fieldErrors[key]
    return Array.isArray(list) ? list[0] : list
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-28 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Profile</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage your public profile details.
      </p>

      <form onSubmit={save} className="mt-8 space-y-6">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5"
            title="Change avatar"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-500">
                {(name || user.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </span>
          </button>
          <div className="min-w-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
            />
            <p className="truncate text-lg font-semibold text-white">
              {name || 'Your name'}
              {username && <span className="ml-2 text-sm font-normal text-neutral-500">@{username}</span>}
            </p>
            <p className="text-sm text-neutral-500">Click the avatar to upload a photo.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
            />
            {errorFor('name') && (
              <span className="mt-1 block text-xs text-red-400">{errorFor('name')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
            />
            {errorFor('username') && (
              <span className="mt-1 block text-xs text-red-400">{errorFor('username')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell people what you're into…"
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-cyan-500/50"
            />
            {errorFor('bio') && (
              <span className="mt-1 block text-xs text-red-400">{errorFor('bio')}</span>
            )}
          </label>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
            {saved && <span className="text-sm text-emerald-400">Saved</span>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </form>
    </main>
  )
}
