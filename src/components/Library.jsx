import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownWideNarrow,
  ArrowUpAZ,
  Check,
  Clock,
  ImagePlus,
  Layers,
  ListPlus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useLibrary } from '../lib/library'
import { useAuth } from '../lib/auth'
import { useGenres } from '../lib/genres'
import MovieCard from './MovieCard'
import SkeletonCard, { EmptyState } from './SkeletonCard'
import Button from './ui/Button'

const SORTS = [
  { key: 'recent', label: 'Recently added', icon: Clock },
  { key: 'title', label: 'Title A–Z', icon: ArrowUpAZ },
  { key: 'rating', label: 'Rating', icon: Star },
]

const getMovie = (item) => item.movie || item

function resizeCover(file, maxSide = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function BackgroundPanel() {
  const { preferences, updatePreferences } = useLibrary()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const background = preferences.background

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await resizeCover(file)
      await updatePreferences({ background: dataUrl })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <ImagePlus className="h-4 w-4 text-cyan-400" />
        Library cover
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        {background
          ? 'Background image set. Upload a new one to replace it.'
          : 'Upload a background image shown behind your board.'}
      </p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button
        variant="outline"
        className="mt-3 w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Processing…' : background ? 'Change cover' : 'Upload cover'}
      </Button>
      {background && (
        <button
          type="button"
          className="mt-2 w-full text-center text-xs text-neutral-500 transition-colors hover:text-white"
          onClick={() => updatePreferences({ background: null })}
        >
          Remove cover
        </button>
      )}
    </section>
  )
}

function AutomationsPanel({ onRequireAuth }) {
  const {
    automations,
    preferences,
    updatePreferences,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    lists,
  } = useLibrary()
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    event: 'movie_added',
    field: 'rating',
    op: '>=',
    value: '7',
    actionType: 'add_to_list',
    listId: '',
  })

  const defaultAdd = preferences.default_add_list_id || ''

  function guarded(fn) {
    return (...args) => {
      if (!user) {
        onRequireAuth?.()
        return
      }
      fn(...args)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!draft.listId) return
    await createAutomation({
      name: draft.name || null,
      event: draft.event,
      condition:
        draft.op === 'none' || draft.field === 'none'
          ? null
          : { field: draft.field, op: draft.op, value: draft.value },
      action: { type: draft.actionType, list_id: Number(draft.listId) },
      enabled: true,
    })
    setDraft({
      name: '',
      event: 'movie_added',
      field: 'rating',
      op: '>=',
      value: '7',
      actionType: 'add_to_list',
      listId: '',
    })
    setAdding(false)
  }

  const ruleSummary = (a) => {
    const event = a.event.replace('movie_', '')
    let cond = 'any'
    if (a.condition) {
      cond = `${a.condition.field} ${a.condition.op} ${a.condition.value}`
    }
    const actionType = a.action?.type?.replace('_to_list', '').replace('_', ' ') || 'add'
    return `when ${event}, ${cond} → ${actionType}`
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        Automations
      </h3>

      <label className="mt-4 block">
        <span className="text-xs text-neutral-300">Default add list</span>
        <select
          value={defaultAdd}
          onChange={(e) =>
            guarded(() => updatePreferences({ default_add_list_id: e.target.value || null }))()
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-neutral-200 outline-none transition-colors focus:border-cyan-500/50 [&>option]:bg-neutral-900"
        >
          <option value="">Plan to Watch (default)</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Rules
        </p>
        {automations.length === 0 && (
          <p className="text-xs text-neutral-500">No rules yet.</p>
        )}
        {automations.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-neutral-950/40 p-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-neutral-200">
                {a.name || a.event}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">{ruleSummary(a)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                role="switch"
                aria-checked={!!a.enabled}
                onClick={() => updateAutomation(a.id, { enabled: !a.enabled })}
                className={`relative h-4 w-7 rounded-full transition-colors ${
                  a.enabled ? 'bg-cyan-500' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                    a.enabled ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </button>
              <button
                type="button"
                aria-label="Delete rule"
                onClick={() => deleteAutomation(a.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-3 space-y-2.5 rounded-xl border border-white/10 bg-neutral-950/40 p-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Rule name (optional)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500/50"
          />
          <select
            value={draft.event}
            onChange={(e) => setDraft({ ...draft, event: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
          >
            <option value="movie_added">When a movie is added</option>
            <option value="movie_rated">When a movie is rated</option>
            <option value="movie_watched">When a movie is watched</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={draft.field}
              onChange={(e) => setDraft({ ...draft, field: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
            >
              <option value="none">Any</option>
              <option value="watched">Watched</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
              <option value="genres">Genres</option>
            </select>
            {draft.field !== 'none' && (
              <>
                <select
                  value={draft.op}
                  onChange={(e) => setDraft({ ...draft, op: e.target.value })}
                  className="w-20 shrink-0 rounded-lg border border-white/10 bg-white/5 px-1 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
                >
                  {['=', '!=', '>', '>=', '<', '<=', 'contains'].map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                {draft.field === 'watched' ? (
                  <select
                    value={draft.value}
                    onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    value={draft.value}
                    onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                    placeholder="value"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500/50"
                  />
                )}
              </>
            )}
          </div>
          <select
            value={draft.actionType}
            onChange={(e) => setDraft({ ...draft, actionType: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
          >
            <option value="add_to_list">Add to list</option>
            <option value="move_to_list">Move to list</option>
          </select>
          <select
            value={draft.listId}
            onChange={(e) => setDraft({ ...draft, listId: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 [&>option]:bg-neutral-900"
          >
            <option value="">Target list…</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="accent" className="flex-1">
              <Check className="h-4 w-4" /> Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={guarded(() => setAdding(true))}
        >
          <Plus className="h-4 w-4" /> Add rule
        </Button>
      )}
    </section>
  )
}

function ListsPanel({ view, onSelect }) {
  const { lists, createList, renameList, deleteList, counts } = useLibrary()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')

  function submitNew(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    createList(name)
    setNewName('')
    setAdding(false)
  }

  function submitRename(e) {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    renameList(editing, name)
    setEditing(null)
  }

  function confirmDelete(list) {
    if (window.confirm(`Delete “${list.name}”? Movies stay in your library.`)) {
      deleteList(list.id)
      if (view === list.id) onSelect('all')
    }
  }

  const navItem = (id, name, count, extra) => (
    <div
      key={id}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
        view === id
          ? 'bg-white/10 text-white'
          : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
      }`}
    >
      <button type="button" onClick={() => onSelect(id)} className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="truncate text-xs font-medium">{name}</span>
        <span className="ml-auto shrink-0 text-[10px] text-neutral-500">{count}</span>
      </button>
      {extra}
    </div>
  )

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Layers className="h-4 w-4 text-cyan-400" />
        Lists
      </h3>

      <div className="mt-3 space-y-1">
        {navItem('all', 'All movies', counts.total, null)}

        {lists.map((list) => {
          if (editing === list.id) {
            return (
              <form key={list.id} onSubmit={submitRename} className="px-1">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-8 w-full rounded-lg border border-cyan-500/50 bg-white/5 px-2.5 text-xs text-white outline-none"
                />
              </form>
            )
          }
          const controls = (
            <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                aria-label="Rename list"
                onClick={() => {
                  setEditing(list.id)
                  setDraft(list.name)
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label="Delete list"
                onClick={() => confirmDelete(list)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          )
          return navItem(list.id, list.name, list.movies_count ?? list.movies?.length ?? 0, controls)
        })}
      </div>

      {adding ? (
        <form onSubmit={submitNew} className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name"
            className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-400"
            aria-label="Create list"
          >
            <Check className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-white/5"
        >
          <ListPlus className="h-4 w-4" />
          New list
        </button>
      )}
    </section>
  )
}

function GenreColumn({ genreCounts, genreIds, onToggle, onClear }) {
  const genres = useGenres()
  const entries = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return null

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Genres</h3>
        {genreIds.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {entries.map(([id, count]) => {
          const checked = genreIds.has(Number(id))
          const name = genres[Number(id)] || `Genre ${id}`
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(Number(id))}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  checked ? 'border-cyan-400 bg-cyan-500' : 'border-white/20 bg-white/5'
                }`}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span
                className={`flex-1 truncate text-xs ${
                  checked ? 'text-white' : 'text-neutral-400'
                }`}
              >
                {name}
              </span>
              <span className="shrink-0 text-[10px] text-neutral-600">{count}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function Library({ onView, onOpenAuth }) {
  const { user } = useAuth()
  const { entries, lists, loading, error, counts } = useLibrary()
  const genres = useGenres()
  const [view, setView] = useState('all')
  const [genreIds, setGenreIds] = useState(() => new Set())
  const [sort, setSort] = useState('recent')
  const [query, setQuery] = useState('')

  const activeList = view === 'all' ? null : lists.find((l) => l.id === view) || null

  const movies = useMemo(() => {
    if (view === 'all') return entries
    return activeList?.movies || []
  }, [view, entries, activeList])

  const entryOf = useCallback(
    (item) => {
      const m = getMovie(item)
      const e = entries.find((x) => x.movie.id === m.id)
      return e ? e.rating : null
    },
    [entries],
  )

  const genreCounts = useMemo(() => {
    const map = new Map()
    for (const item of movies) {
      const m = getMovie(item)
      for (const g of m.genres || []) {
        map.set(g.id, (map.get(g.id) || 0) + 1)
      }
    }
    return map
  }, [movies])

  const filtered = useMemo(() => {
    let list = [...movies]
    if (genreIds.size > 0) {
      list = list.filter((item) =>
        (getMovie(item).genres || []).some((g) => genreIds.has(g.id)),
      )
    }
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((item) => getMovie(item).title.toLowerCase().includes(q))

    switch (sort) {
      case 'title':
        list.sort((a, b) =>
          getMovie(a).title.localeCompare(getMovie(b).title, undefined, { sensitivity: 'base' }),
        )
        break
      case 'rating':
        list.sort(
          (a, b) =>
            (entryOf(b) ?? -1) - (entryOf(a) ?? -1) ||
            (b.addedAt || b.added_at || 0) - (a.addedAt || a.added_at || 0),
        )
        break
      default:
        list.sort(
          (a, b) => (b.addedAt || b.added_at || 0) - (a.addedAt || a.added_at || 0),
        )
    }
    return list
  }, [movies, genreIds, query, sort, entryOf])

  const viewTitle = activeList ? activeList.name : 'All movies'
  const viewCount = activeList ? activeList.movies_count ?? activeList.movies?.length ?? 0 : counts.total

  const toggleGenre = (id) => {
    setGenreIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const searching = query.trim().length > 0
  const emptyMessage = activeList
    ? `“${activeList.name}” is empty.`
    : searching
      ? `No matches for “${query.trim()}”`
      : 'Your library is empty.'

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-28 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">My library</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {counts.total} saved · {counts.watched} watched · {counts.rated} rated
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
          <ArrowDownWideNarrow className="h-3.5 w-3.5 text-neutral-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-xs font-medium text-neutral-300 outline-none [&>option]:bg-neutral-900"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr_300px]">
        <aside className="order-2 hidden lg:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library…"
              className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-9 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-300 focus:border-cyan-500/50 focus:bg-white/10"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-4">
            <GenreColumn
              genreCounts={genreCounts}
              genreIds={genreIds}
              onToggle={toggleGenre}
              onClear={() => setGenreIds(new Set())}
            />
          </div>
        </aside>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="font-semibold text-white">{viewTitle}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                {viewCount}
              </span>
              {genreIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setGenreIds(new Set())}
                  className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  Clear genres
                </button>
              )}
            </div>

            <div className="relative lg:hidden">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your library…"
                className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-9 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-300 focus:border-cyan-500/50 focus:bg-white/10"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {Object.entries(genreCounts).map(([id, count]) => {
                const checked = genreIds.has(Number(id))
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGenre(Number(id))}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? 'bg-cyan-500 text-white'
                        : 'border border-white/10 bg-white/5 text-neutral-400'
                    }`}
                  >
                    {genres[Number(id)] || `Genre ${id}`}
                    <span className="ml-1 opacity-60">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState
                  title="Your library is waiting"
                  message="Log in to save movies, build lists, and track what you've watched."
                >
                  <Button variant="accent" onClick={onOpenAuth}>
                    Log in
                  </Button>
                </EmptyState>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 xl:grid-cols-5"
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState
                  title="Library unavailable"
                  message="Couldn't reach the backend. Check the Railway service is running and VITE_API_URL is set."
                />
              </motion.div>
            ) : filtered.length > 0 ? (
              <motion.div
                key={`${view}-${sort}-${query}-${genreIds.size}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 xl:grid-cols-5"
              >
                {filtered.map((item, i) => (
                  <MovieCard key={getMovie(item).id} movie={getMovie(item)} index={i} onView={onView} />
                ))}
              </motion.div>
            ) : (
              <motion.div key={`${view}-empty`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState
                  title={searching && view === 'all' ? `No matches for “${query.trim()}”` : emptyMessage}
                  message={
                    activeList
                      ? 'Add movies to this list using the "Add to list" button on any movie.'
                      : 'Tap the bookmark icon on any movie to save it to your library.'
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="order-3 space-y-4">
          <ListsPanel view={view} onSelect={setView} />
          <AutomationsPanel onRequireAuth={onOpenAuth} />
          <BackgroundPanel />
        </aside>
      </div>
    </main>
  )
}
