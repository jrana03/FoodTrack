import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { addReview, getReviews, getReviewById, updateReview } from '../services/reviewService.js'
import StarRating from '../components/StarRating.jsx'
import PasswordModal from '../components/PasswordModal.jsx'
import { isAuthenticated } from '../lib/auth.js'
import styles from '../styles/AddReview.module.css'
import { log, error } from '../lib/logger.js'

// ── Edit these arrays to change form options ──────────────────────────────────
const STATUS_OPTIONS        = ['Go again', "Don't go again", 'Want to try']
const CITY_OPTIONS          = ['Ottawa', 'Montreal', 'Toronto']
const CONTRIBUTOR_OPTIONS   = ['Jai']
// Contributors in this list require a password before the review can be saved
const PROTECTED_CONTRIBUTORS = ['Jai']
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', rating: 0, status: '', city: '', contributor: '', comments: '' }

// Trim ends, collapse internal whitespace, capitalise first letter, lowercase the rest.
//   "  jAI "       → "Jai"
//   "new   YORK"   → "New york"
function normalizeText(s) {
  const trimmed = (s ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default function AddReview() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(isEditing)
  const [showModal, setShowModal]       = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    getReviewById(id).then(review => {
      if (!review) { navigate('/'); return }
      setForm({
        name:        review.name,
        rating:      review.rating ?? 0,
        status:      review.status ?? '',
        city:        review.city ?? '',
        contributor: review.contributor ?? '',
        comments:    review.comments ?? '',
      })
      setLoading(false)
    })
  }, [id, isEditing, navigate])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  // Single-select: clicking an already-checked option deselects it
  function handleStatusChange(value) {
    setForm(f => ({ ...f, status: f.status === value ? '' : value }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())        errs.name = 'Restaurant name is required.'
    if (!form.contributor.trim()) errs.contributor = 'Contributor is required.'
    return errs
  }

  // Returns an error message if a review with the same restaurant + contributor
  // already exists (case/space-insensitive); otherwise null.
  async function checkDuplicate() {
    const name        = form.name.trim().toLowerCase()
    const contributor = normalizeText(form.contributor).toLowerCase()
    try {
      const reviews = await getReviews()
      const clash = reviews.some(r =>
        // Route params are strings, while a database ID may be returned as a
        // number. Compare their string forms so the review being edited does
        // not count as a duplicate of itself.
        String(r.id) !== String(id) &&
        (r.name ?? '').trim().toLowerCase() === name &&
        normalizeText(r.contributor).toLowerCase() === contributor
      )
      return clash
        ? 'A review for this restaurant by this contributor already exists.'
        : null
    } catch (err) {
      error('[FoodTrack] Duplicate check failed', err)
      return null // don't block saving if the lookup itself fails
    }
  }

  // ── Auth-gated submit flow ─────────────────────────────────────────────────

  function isContributorProtected() {
    return PROTECTED_CONTRIBUTORS.some(
      c => c.toLowerCase() === form.contributor.trim().toLowerCase()
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    log('[FoodTrack] Save button clicked', { isEditing, id })

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      log('[FoodTrack] Validation failed', errs)
      setErrors(errs)
      return
    }

    // Block duplicates (same restaurant + contributor)
    const dupError = await checkDuplicate()
    if (dupError) {
      log('[FoodTrack] Duplicate detected', dupError)
      setErrors(e => ({ ...e, name: dupError }))
      return
    }

    // If contributor is protected and not authenticated, ask for password first
    if (isContributorProtected() && !isAuthenticated()) {
      setPendingSubmit(true)
      setShowModal(true)
      return
    }

    await doSave()
  }

  async function doSave() {
    // Normalise free-text fields before persisting
    const payload = {
      ...form,
      name:        form.name.trim(),
      city:        normalizeText(form.city),
      contributor: normalizeText(form.contributor),
    }
    log('[FoodTrack] Submitting review data', payload)
    try {
      if (isEditing) {
        const updated = await updateReview(id, payload)
        log('[FoodTrack] Update complete', updated)
      } else {
        const created = await addReview(payload)
        log('[FoodTrack] Save complete', created)
      }
      navigate('/')
    } catch (err) {
      error('[FoodTrack] Save failed', err)
    }
  }

  function handleAuthSuccess() {
    setShowModal(false)
    if (pendingSubmit) {
      setPendingSubmit(false)
      doSave()
    }
  }

  function handleAuthCancel() {
    setShowModal(false)
    setPendingSubmit(false)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>FoodTrack</Link>
      </header>

      <main className={styles.main}>
        <h2 className={styles.title}>{isEditing ? 'Edit Review' : 'Add Review'}</h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            {/* Label text → change "Restaurant Name" here */}
            <label htmlFor="name">
              Restaurant Name <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder=" "
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            {/* Label text → change "Rating" here */}
            <label>Rating</label>
            <StarRating
              value={form.rating}
              interactive={true}
              onChange={rating => set('rating', rating)}
            />
          </div>

          <div className={styles.field}>
            {/* Label text → change "Status" here */}
            {/* Checkbox options → edit STATUS_OPTIONS at the top of this file */}
            <label>Status</label>
            <div className={styles.checkboxGroup}>
              {STATUS_OPTIONS.map(opt => (
                <label key={opt} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.status === opt}
                    onChange={() => handleStatusChange(opt)}
                  />
                  <span className={styles.checkboxText}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            {/* Label text → change "City" here */}
            {/* Default suggestions → edit CITY_OPTIONS at the top of this file */}
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              list="foodtrack-city-datalist"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder=""
              autoComplete="off"
            />
            <datalist id="foodtrack-city-datalist">
              {CITY_OPTIONS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className={styles.field}>
            {/* Label text → change "Contributor" here */}
            {/* Default suggestions → edit CONTRIBUTOR_OPTIONS at the top of this file */}
            {/* Protected names → edit PROTECTED_CONTRIBUTORS at the top of this file */}
            <label htmlFor="contributor">
              Contributor <span className={styles.required}>*</span>
            </label>
            <input
              id="contributor"
              type="text"
              list="foodtrack-contributor-datalist"
              value={form.contributor}
              onChange={e => set('contributor', e.target.value)}
              placeholder=""
              autoComplete="off"
            />
            <datalist id="foodtrack-contributor-datalist">
              {CONTRIBUTOR_OPTIONS.map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.contributor && <span className={styles.error}>{errors.contributor}</span>}
          </div>

          <div className={styles.field}>
            {/* Label text → change "Comments" here */}
            <label htmlFor="comments">Comments</label>
            <textarea
              id="comments"
              rows={4}
              value={form.comments}
              onChange={e => set('comments', e.target.value)}
              placeholder=" "
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className={styles.save}>
              {isEditing ? 'Save Changes' : 'Save Review'}
            </button>
          </div>
        </form>
      </main>

      <PasswordModal
        isOpen={showModal}
        hint={`"${form.contributor}" is a protected contributor. Enter the password to post as them.`}
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
      />
    </div>
  )
}
