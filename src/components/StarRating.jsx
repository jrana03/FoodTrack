import { useState, useRef } from 'react'
import styles from '../styles/StarRating.module.css'

const STARS = [1, 2, 3, 4, 5]

export default function StarRating({ value, interactive, onChange }) {
  const [hovered, setHovered] = useState(0)
  const starsRef = useRef([])

  function getValueAtEvent(e, index) {
    const el = starsRef.current[index]
    if (!el) return index
    const rect = el.getBoundingClientRect()
    return e.clientX - rect.left < rect.width / 2 ? index - 0.5 : index
  }

  const display = interactive ? (hovered || value) : value

  return (
    <div
      className={`${styles.container} ${interactive ? styles.interactive : ''}`}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {STARS.map(i => {
        const full = display >= i
        const half = !full && display >= i - 0.5
        return (
          <span
            key={i}
            ref={el => { starsRef.current[i] = el }}
            className={`${styles.star} ${full ? styles.full : half ? styles.half : styles.empty}`}
            onMouseMove={interactive ? e => setHovered(getValueAtEvent(e, i)) : undefined}
            onClick={interactive ? e => onChange(getValueAtEvent(e, i)) : undefined}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${i} stars` : undefined}
          >
            ★
          </span>
        )
      })}
      {!interactive && (
        <span className={styles.value}>{Number(value).toFixed(1)}</span>
      )}
    </div>
  )
}
