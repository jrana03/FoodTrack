import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { getReviews } from '../services/reviewService.js'
import StarRating from '../components/StarRating.jsx'
import styles from '../styles/Home.module.css'

// ── Edit these to change sort/filter labels ───────────────────────────────────
const STATUS_OPTIONS = ['Go again', "Don't go again", 'Want to try']
const MIN_RATING_OPTIONS = [
  { label: 'Any ★', value: 0 },
  { label: '1★ +',  value: 1 },
  { label: '2★ +',  value: 2 },
  { label: '3★ +',  value: 3 },
  { label: '4★ +',  value: 4 },
  { label: '5★',    value: 5 },
]
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  'Go again':       'statusGoAgain',
  "Don't go again": 'statusDontGoAgain',
  'Want to try':    'statusWantToTry',
}

// Filters persist across navigation (e.g. open a card → back) until cleared.
const FILTER_KEY = 'foodtrack_filters'
function loadFilters() {
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) || {} }
  catch { return {} }
}

export default function Home() {
  const saved = loadFilters()
  const [reviews, setReviews]                   = useState([])
  const [sortBy, setSortBy]                     = useState(saved.sortBy ?? 'alpha')
  const [searchQuery, setSearchQuery]           = useState(saved.searchQuery ?? '')
  const [minRating, setMinRating]               = useState(saved.minRating ?? 0)
  const [statusFilter, setStatusFilter]         = useState(saved.statusFilter ?? '')
  const [cityFilter, setCityFilter]             = useState(saved.cityFilter ?? '')
  const [contributorFilter, setContributorFilter] = useState(saved.contributorFilter ?? '')
  const navigate = useNavigate()

  useEffect(() => {
    getReviews().then(setReviews)
  }, [])

  // Persist filter/sort/search state so it survives navigation
  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      sortBy, searchQuery, minRating, statusFilter, cityFilter, contributorFilter,
    }))
  }, [sortBy, searchQuery, minRating, statusFilter, cityFilter, contributorFilter])

  // Fuzzy search index — searches restaurant name and comments, tolerates typos
  const fuse = useMemo(() => new Fuse(reviews, {
    keys: ['name', 'comments'],
    threshold: 0.4,       // 0 = exact only, 1 = match anything
    ignoreLocation: true, // don't penalise matches found deep inside a string
  }), [reviews])

  // Dropdown options derived from whatever cities/contributors exist in reviews
  const availableCities = useMemo(() =>
    [...new Set(reviews.map(r => r.city).filter(Boolean))].sort()
  , [reviews])

  const availableContributors = useMemo(() =>
    [...new Set(reviews.map(r => r.contributor).filter(Boolean))].sort()
  , [reviews])

  const hasActiveFilter = minRating > 0 || statusFilter !== '' || cityFilter !== '' || contributorFilter !== ''

  const results = useMemo(() => {
    // 1. Apply fuzzy search (Fuse returns results ranked by relevance)
    let list = searchQuery.trim()
      ? fuse.search(searchQuery).map(r => r.item)
      : [...reviews]

    // 2. Apply dropdown filters on top of search results
    if (minRating > 0)      list = list.filter(r => r.rating >= minRating)
    if (statusFilter)       list = list.filter(r => r.status === statusFilter)
    if (cityFilter)         list = list.filter(r => r.city === cityFilter)
    if (contributorFilter)  list = list.filter(r => r.contributor === contributorFilter)

    // 3. Sort — skipped when a search query is active (Fuse already ranks by relevance)
    if (!searchQuery.trim()) {
      list.sort((a, b) =>
        sortBy === 'alpha' ? a.name.localeCompare(b.name) : b.rating - a.rating
      )
    }

    return list
  }, [reviews, fuse, searchQuery, sortBy, minRating, statusFilter, cityFilter, contributorFilter])

  function clearFilters() {
    setMinRating(0)
    setStatusFilter('')
    setCityFilter('')
    setContributorFilter('')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>FoodTrack</Link>

        {/* Search bar — searches name + comments, handles minor typos */}
        <div className={styles.searchWrapper}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search restaurants…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Link to="/add" className={styles.addButton}>+ Add Review</Link>
      </header>

      <main className={styles.main}>
        {reviews.length > 0 && (
          <div className={styles.controls}>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Sort</span>
              <div className={styles.btnRow}>
                <button
                  className={`${styles.pill} ${sortBy === 'alpha' ? styles.active : ''}`}
                  onClick={() => setSortBy('alpha')}
                >A–Z</button>
                <button
                  className={`${styles.pill} ${sortBy === 'rating' ? styles.active : ''}`}
                  onClick={() => setSortBy('rating')}
                >★ Rating</button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Filter</span>
              <div className={styles.btnRow}>

                {/* Min-rating dropdown */}
                <select
                  className={`${styles.ratingSelect} ${minRating > 0 ? styles.active : ''}`}
                  value={minRating}
                  onChange={e => setMinRating(Number(e.target.value))}
                >
                  {MIN_RATING_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Status filter pills */}
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`${styles.pill} ${statusFilter === opt ? styles.active : ''}`}
                    onClick={() => setStatusFilter(s => s === opt ? '' : opt)}
                  >{opt}</button>
                ))}

                {/* City filter dropdown */}
                {availableCities.length > 0 && (
                  <select
                    className={`${styles.ratingSelect} ${cityFilter ? styles.active : ''}`}
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                  >
                    <option value="">Any City</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}

                {/* Contributor filter dropdown */}
                {availableContributors.length > 0 && (
                  <select
                    className={`${styles.ratingSelect} ${contributorFilter ? styles.active : ''}`}
                    value={contributorFilter}
                    onChange={e => setContributorFilter(e.target.value)}
                  >
                    <option value="">Any Contributor</option>
                    {availableContributors.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                {hasActiveFilter && (
                  <button className={styles.clearBtn} onClick={clearFilters}>
                    Clear ✕
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {results.length === 0 ? (
          reviews.length === 0 ? (
            <div className={styles.empty}>
              <p>No reviews yet.</p>
              <p>Start by adding your first restaurant.</p>
              <Link to="/add" className={styles.emptyLink}>Add a Review</Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>No reviews match your search or filters.</p>
              <button className={styles.emptyLink} onClick={() => { clearFilters(); setSearchQuery('') }}>
                Clear all
              </button>
            </div>
          )
        ) : (
          <div className={styles.grid}>
            {results.map(review => (
              <div
                key={review.id}
                className={styles.card}
                onClick={() => navigate(`/review/${review.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/review/${review.id}`)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardNameGroup}>
                    <h2 className={styles.cardName}>{review.name}</h2>
                    {review.city && (
                      <p className={styles.cardCity}>{review.city}</p>
                    )}
                  </div>
                  {review.status && (
                    <span className={`${styles.badge} ${styles[STATUS_STYLE[review.status]] ?? ''}`}>
                      {review.status}
                    </span>
                  )}
                </div>
                {review.rating > 0 && (
                  <StarRating value={review.rating} interactive={false} />
                )}
                {review.comments && (
                  <p className={styles.cardComment}>{review.comments}</p>
                )}
                {review.contributor && (
                  <p className={styles.cardContributor}>Added by {review.contributor}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
