import { Clapperboard } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Clapperboard className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold text-white">
            Cine<span className="text-violet-400">Track</span>
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          Data provided by{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-neutral-700 underline-offset-2 hover:text-neutral-300"
          >
            TMDB
          </a>
          . Built with React, Tailwind & Framer Motion.
        </p>
      </div>
    </footer>
  )
}
