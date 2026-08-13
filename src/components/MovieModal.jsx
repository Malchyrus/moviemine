import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Calendar, Check, Clapperboard, Clock, ExternalLink, Eye, EyeOff, MonitorPlay, Play, Star, X } from 'lucide-react'
import { fetchTitleDetails, fetchWatchProviders, fetchSeason, fetchRegions, IMG, mediaTypeOf } from '../lib/api'
import { useLibrary } from '../lib/library'
import { useAuth } from '../lib/auth'
import { formatDate, formatRuntime } from '../lib/format'
import Button from './ui/Button'
import RatingStars from './ui/RatingStars'
import AddToList from './AddToList'

const GROUPS = [
  { key: 'flatrate', label: 'Streaming' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
]

const episodeKey = (season, episode) => `${season}:${episode}`

export default function MovieModal({ movie, onClose, onRequireAuth }) {
  const mediaType = mediaTypeOf(movie)
  const isTv = mediaType === 'tv'
  const [details, setDetails] = useState(null)
  const [providers, setProviders] = useState(null)
  const [regions, setRegions] = useState([])
  const [region, setRegion] = useState('')
  const [providersLoading, setProvidersLoading] = useState(true)
  const [providersError, setProvidersError] = useState(false)
  const [activeSeason, setActiveSeason] = useState(null)
  const [seasonEpisodes, setSeasonEpisodes] = useState([])
  const [seasonLoading, setSeasonLoading] = useState(false)
  const { has, toggle, entry, setWatched, setRating, setEpisode, preferences } = useLibrary()
  const { user } = useAuth()
  const inList = has(movie.id, mediaType)
  const showEntry = entry(movie.id, mediaType)
  const watched = showEntry?.watched || false
  const myRating = showEntry?.rating || null
  const bestMovie = details && details.genres ? details : movie

  function guarded(action) {
    return (...args) => {
      if (!user) {
        onRequireAuth?.()
        return
      }
      action(...args)
    }
  }

  useEffect(() => {
    fetchTitleDetails(movie.id, mediaType)
      .then(setDetails)
      .catch(() => setDetails({}))
  }, [movie.id, mediaType])

  function resolveRegion(list) {
    const codes = new Set((list || []).map((r) => r.iso_3166_1))
    const preferred = preferences.default_region
    if (preferred && codes.has(preferred)) {
      setRegion(preferred)
      return
    }
    const parts = (navigator.language || 'en-US').split('-')
    const guess = (parts[1] || parts[0]).toUpperCase()
    setRegion(codes.has(guess) ? guess : 'US')
  }

  useEffect(() => {
    let active = true
    fetchRegions()
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data.results) ? data.results : []
        setRegions(list)
        resolveRegion(list)
      })
      .catch(() => {
        if (active) resolveRegion([])
      })
    return () => {
      active = false
    }
  }, [preferences.default_region])

  useEffect(() => {
    if (!region) return
    let active = true
    setProvidersLoading(true)
    setProvidersError(false)
    fetchWatchProviders(movie.id, region, mediaType)
      .then(setProviders)
      .catch(() => {
        if (active) setProvidersError(true)
      })
      .finally(() => {
        if (active) setProvidersLoading(false)
      })
    return () => {
      active = false
    }
  }, [movie.id, region, mediaType])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const seasonList = useMemo(
    () => (details?.seasons || []).filter((s) => s.season_number > 0),
    [details],
  )

  useEffect(() => {
    if (!isTv || activeSeason !== null) return
    const last = seasonList[seasonList.length - 1]
    if (last) setActiveSeason(last.season_number)
  }, [isTv, activeSeason, seasonList])

  useEffect(() => {
    if (!isTv || activeSeason == null) return
    let active = true
    setSeasonLoading(true)
    fetchSeason(movie.id, activeSeason)
      .then((data) => {
        if (active) setSeasonEpisodes(data.episodes || [])
      })
      .catch(() => {
        if (active) setSeasonEpisodes([])
      })
      .finally(() => {
        if (active) setSeasonLoading(false)
      })
    return () => {
      active = false
    }
  }, [isTv, movie.id, activeSeason])

  const watchedSet = useMemo(
    () => new Set(showEntry?.watched_episodes || []),
    [showEntry?.watched_episodes],
  )
  const tvTotal = showEntry?.total_episodes || 0
  const tvWatched = showEntry?.watched ? tvTotal : watchedSet.size

  const episodeOn = (ep) =>
    showEntry?.watched ? true : watchedSet.has(episodeKey(activeSeason, ep.episode_number))

  const toggleEpisode = (ep) => {
    if (!user) {
      onRequireAuth?.()
      return
    }
    setEpisode(bestMovie, activeSeason, ep.episode_number, !episodeOn(ep))
  }

  const trailer = details?.videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  const regionData = providers?.results?.[region] || null
  const watchLink = regionData?.link || null
  const regionName =
    regions.find((r) => r.iso_3166_1 === region)?.english_name || region || 'your region'

  const runtimeLabel = isTv
    ? formatRuntime(details?.episode_run_time?.[0])
    : formatRuntime(details?.runtime)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-neutral-900 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] ring-1 ring-black/40 sm:max-h-[calc(100vh-3rem)]"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-neutral-950/60 text-neutral-200 backdrop-blur transition-colors hover:bg-neutral-950"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-44 sm:h-60">
            {details?.backdrop_path ? (
              <img
                src={IMG.backdrop(details.backdrop_path, 'w1280')}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={IMG.backdrop(movie.backdrop_path || movie.poster_path, 'w780')}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-neutral-900/25" />
            {watched && (
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur">
                <Eye className="h-3.5 w-3.5" />
                Watched
              </span>
            )}
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
            <div className="pt-44 sm:pt-60">
              <div className="rounded-t-[24px] bg-neutral-900/85 px-6 pb-8 pt-6 backdrop-blur-xl sm:px-8 sm:pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  {details?.genres?.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {isTv && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/70 px-3 py-1 text-xs font-semibold text-cyan-300">
                    <Clapperboard className="h-3.5 w-3.5" />
                    TV Show
                  </span>
                )}

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
                  {details?.title || movie.title}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {details?.tagline || '—'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
                  <span className="flex items-center gap-1.5 font-semibold text-yellow-400">
                    <Star className="h-4 w-4 fill-yellow-400" />
                    {Number(details?.vote_average ?? movie.vote_average) > 0
                      ? (details?.vote_average ?? movie.vote_average).toFixed(1)
                      : 'Unrated'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(details?.release_date)}
                  </span>
                  {runtimeLabel && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {runtimeLabel}
                    </span>
                  )}
                  {isTv && (details?.number_of_seasons ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5">
                      <MonitorPlay className="h-4 w-4" />
                      {details.number_of_seasons}{' '}
                      {details.number_of_seasons === 1 ? 'season' : 'seasons'}
                    </span>
                  )}
                </div>

                <p className="mt-5 text-[15px] leading-relaxed text-neutral-300">
                  {details?.overview || movie.overview}
                </p>

                <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Your rating
                      </p>
                      <RatingStars
                        value={myRating}
                        onChange={guarded((r) => setRating(bestMovie, r))}
                      />
                    </div>

                    <Button
                      variant={watched ? 'success' : 'outline'}
                      onClick={guarded(() => setWatched(bestMovie, !watched))}
                    >
                      {watched ? (
                        <>
                          <EyeOff className="h-4 w-4" /> Mark as{' '}
                          {isTv ? 'whole show' : ''} unwatched
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" /> Mark as{' '}
                          {isTv ? 'whole show' : ''} watched
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {trailer && (
                      <Button
                        variant="accent"
                        as="a"
                        href={`https://www.youtube.com/watch?v=${trailer.key}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Trailer
                      </Button>
                    )}
                    <Button
                      variant={inList ? 'accent' : 'outline'}
                      onClick={guarded(() => toggle(details || movie))}
                    >
                      {inList ? (
                        <>
                          <Check className="h-4 w-4" /> Remove from library
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4" /> Add to library
                        </>
                      )}
                    </Button>

                    <AddToList movie={details || movie} align="left" />
                  </div>
                </div>

                {isTv && inList && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                        <Clapperboard className="h-4 w-4 text-cyan-400" />
                        Episodes
                      </h3>
                      {tvTotal > 0 && (
                        <span className="text-xs font-medium text-neutral-400">
                          {tvWatched} / {tvTotal} watched
                        </span>
                      )}
                    </div>

                    {seasonList.length > 0 && (
                      <select
                        value={activeSeason ?? ''}
                        onChange={(e) => setActiveSeason(Number(e.target.value))}
                        aria-label="Season"
                        className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 outline-none transition-colors focus:border-cyan-500/50 [&>option]:bg-neutral-900"
                      >
                        {seasonList.map((s) => (
                          <option key={s.season_number} value={s.season_number}>
                            {s.name || `Season ${s.season_number}`} · {s.episode_count}{' '}
                            {s.episode_count === 1 ? 'episode' : 'episodes'}
                          </option>
                        ))}
                      </select>
                    )}

                    {seasonLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
                        ))}
                      </div>
                    ) : seasonEpisodes.length === 0 ? (
                      <p className="text-sm text-neutral-500">Couldn't load episodes.</p>
                    ) : (
                      <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                        {seasonEpisodes.map((ep) => {
                          const on = episodeOn(ep)
                          return (
                            <li key={ep.id ?? episodeKey(activeSeason, ep.episode_number)}>
                              <button
                                type="button"
                                onClick={() => toggleEpisode(ep)}
                                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-colors hover:border-cyan-500/40"
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
                                    on
                                      ? 'border-cyan-400 bg-cyan-500 text-white'
                                      : 'border-white/20 text-transparent'
                                  }`}
                                >
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="w-8 shrink-0 text-xs font-semibold text-neutral-400">
                                  E{ep.episode_number}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">
                                  {ep.name || `Episode ${ep.episode_number}`}
                                </span>
                                {ep.runtime ? (
                                  <span className="shrink-0 text-xs text-neutral-500">
                                    {formatRuntime(ep.runtime)}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                      <MonitorPlay className="h-4 w-4 text-cyan-400" />
                      Where to watch
                    </h3>
                    {regions.length > 0 && (
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        aria-label="Region"
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 outline-none transition-colors focus:border-cyan-500/50 [&>option]:bg-neutral-900"
                      >
                        {regions.map((r) => (
                          <option key={r.iso_3166_1} value={r.iso_3166_1}>
                            {r.english_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {providersLoading ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-11 w-36 animate-pulse rounded-2xl bg-white/5" />
                      ))}
                    </div>
                  ) : providersError ? (
                    <p className="text-sm text-neutral-500">
                      Couldn't load providers for this {isTv ? 'show' : 'movie'}.
                    </p>
                  ) : regionData ? (
                    GROUPS.map((group) => {
                      const items = regionData[group.key] || []
                      if (items.length === 0) return null
                      return (
                        <div key={group.key} className="mb-4 last:mb-0">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((p) => (
                              <a
                                key={p.provider_id}
                                href={watchLink || '#'}
                                target="_blank"
                                rel="noreferrer"
                                title={`${p.provider_name} · ${group.label} · ${regionName}`}
                                className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-cyan-500/40 hover:bg-white/10"
                              >
                                {p.logo_path ? (
                                  <img
                                    src={IMG.provider(p.logo_path)}
                                    alt={p.provider_name}
                                    loading="lazy"
                                    className="h-8 w-8 rounded-lg bg-white object-contain p-0.5"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-[10px] font-semibold text-neutral-300">
                                    {p.provider_name.charAt(0)}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-neutral-200">
                                  {p.provider_name}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-neutral-400">
                      Not available to stream, rent, or buy in {regionName}.
                    </p>
                  )}
                </div>

                {details?.credits?.cast?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                      Cast
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {details.credits.cast.slice(0, 8).map((c) => (
                        <div key={c.cast_id} className="w-20 shrink-0 text-center">
                          <img
                            src={IMG.profile(c.profile_path)}
                            alt={c.name}
                            className="h-20 w-20 rounded-full object-cover ring-1 ring-white/10"
                          />
                          <p className="mt-2 truncate text-xs font-medium text-neutral-200">
                            {c.name}
                          </p>
                          <p className="truncate text-[10px] text-neutral-500">
                            {c.character}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
