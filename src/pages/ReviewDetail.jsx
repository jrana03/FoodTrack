import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getReviewById, deleteReview } from '../services/reviewService.js'
import StarRating from '../components/StarRating.jsx'
import PasswordModal from '../components/PasswordModal.jsx'
import { isAuthenticated } from '../lib/auth.js'
import styles from '../styles/ReviewDetail.module.css'

const STATUS_STYLE = {
  'Go again':       styles.statusGoAgain,
  "Don't go again": styles.statusDontGoAgain,
  'Want to try':    styles.statusWantToTry,
}

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'edit' | 'delete'

  useEffect(() => {
    getReviewById(id).then(r => {
      if (!r) navigate('/')
      else setReview(r)
    })
  }, [id, navigate])

  // ── Auth-gated action flow ─────────────────────────────────────────────────

  function requestAction(action) {
    if (isAuthenticated()) {
      executeAction(action)
    } else {
      setPendingAction(action)
      setShowModal(true)
    }
  }

  async function executeAction(action) {
    if (action === 'edit') {
      navigate(`/review/${id}/edit`)
    } else if (action === 'delete') {
      if (!window.confirm(`Delete review for "${review.name}"?`)) return
      await deleteReview(id)
      navigate('/')
    }
  }

  function handleAuthSuccess() {
    setShowModal(false)
    const action = pendingAction
    setPendingAction(null)
    executeAction(action)
  }

  function handleAuthCancel() {
    setShowModal(false)
    setPendingAction(null)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (!review) return null

  const mapsQuery = [review.name, review.city].filter(Boolean).join(' ')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
  const modalHint = pendingAction === 'delete'
    ? `Enter the password to delete "${review.name}".`
    : `Enter the password to edit "${review.name}".`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
        {/* App name → edit here */}
        <Link to="/" className={styles.logo}>FoodTrack</Link>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => requestAction('edit')}>Edit</button>
          <button className={styles.deleteBtn} onClick={() => requestAction('delete')}>Delete</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div>
              <h2 className={styles.name}>{review.name}</h2>
              {review.city && <p className={styles.cityLabel}>{review.city}</p>}
            </div>
            {review.status && (
              <span className={`${styles.badge} ${STATUS_STYLE[review.status] ?? ''}`}>
                {review.status}
              </span>
            )}
          </div>

          {review.rating > 0 && (
            <StarRating value={review.rating} interactive={false} />
          )}
          {review.comments && (
            <div className={styles.comments}>
              {/* "Comments" section label → edit here */}
              <h3>Comments</h3>
              <p>{review.comments}</p>
            </div>
          )}

          {/* "Open in Google Maps" button label → edit here */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsBtn}
          >
            Open in Google Maps ↗
          </a>
        </div>
      </main>

      <PasswordModal
        isOpen={showModal}
        hint={modalHint}
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
      />
    </div>
  )
}
