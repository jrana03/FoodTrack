import { useState } from 'react'
import { checkPassword, storeAuth } from '../lib/auth.js'
import styles from '../styles/PasswordModal.module.css'

/**
 * Props:
 *   isOpen   {boolean}  — controls visibility
 *   hint     {string}   — short phrase shown under the title, e.g. "to edit or delete reviews"
 *   onSuccess {fn}      — called after correct password + auth stored
 *   onCancel  {fn}      — called when user dismisses without authenticating
 */
export default function PasswordModal({ isOpen, hint = '', onSuccess, onCancel }) {
  const [value, setValue]     = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError]     = useState('')

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (checkPassword(value)) {
      storeAuth(remember)
      setValue('')
      setError('')
      onSuccess()
    } else {
      setError('Incorrect password.')
    }
  }

  function handleCancel() {
    setValue('')
    setError('')
    onCancel()
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <h3 className={styles.title}>Password required</h3>
        {hint && <p className={styles.hint}>{hint}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <input
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            type="password"
            placeholder="Enter password"
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p className={styles.errorMsg}>{error}</p>}

          <label className={styles.rememberLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Remember for 30 days</span>
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Unlock
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
