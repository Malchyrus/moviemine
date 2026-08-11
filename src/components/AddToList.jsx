import { useEffect, useRef, useState } from 'react'
import { Check, ListPlus, Plus } from 'lucide-react'
import { useLibrary } from '../lib/library'
import { useAuth } from '../lib/auth'

export default function AddToList({ movie, align = 'right', className = '' }) {
  const { lists, addToList, removeFromList, createList } = useLibrary()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const membership = (listId) =>
    (lists.find((l) => l.id === listId)?.movies || []).some((m) => m.id === movie.id)

  async function handleToggle(listId) {
    try {
      if (membership(listId)) await removeFromList(movie.id, listId)
      else await addToList(movie, listId)
    } catch {
      // ignored
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createList(trimmed)
      setName('')
    } catch {
      // ignored
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Add to list"
        title="Add to list"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-neutral-950/60 backdrop-blur transition-colors hover:bg-neutral-950"
      >
        <ListPlus className="h-4 w-4 text-white" />
      </button>

      {open && (
        <div
          className={`absolute top-11 z-50 w-60 rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-[0_16px_60px_-12px_rgba(0,0,0,0.9)] ring-1 ring-black/40 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!user ? (
            <p className="px-3 py-4 text-center text-xs text-neutral-500">
              Log in to save to lists.
            </p>
          ) : lists.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-neutral-500">
              No lists yet.
            </p>
          ) : (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Add to list
              </p>
              <div className="max-h-64 overflow-y-auto">
                {lists.map((list) => {
                  const inIt = membership(list.id)
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => handleToggle(list.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-neutral-200 transition-colors hover:bg-white/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{list.name}</span>
                        <span className="shrink-0 text-[10px] text-neutral-500">
                          {list.movies_count ?? list.movies?.length ?? 0}
                        </span>
                      </span>
                      {inIt && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-400" />}
                    </button>
                  )
                })}
              </div>
              <div className="mt-1 border-t border-white/10 pt-1">
                {creating ? (
                  <form onSubmit={handleCreate} className="flex items-center gap-2 px-1">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="New list name"
                      className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="submit"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-400"
                      aria-label="Create list"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-cyan-300 transition-colors hover:bg-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New list
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
