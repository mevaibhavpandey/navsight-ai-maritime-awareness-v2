import { useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'

export default function Modal({ isOpen, onClose, src, alt, type = 'image' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image viewer'}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <FiX />
        </button>

        {type === 'pdf' ? (
          <embed
            src={src}
            type="application/pdf"
            className="modal-embed"
            title={alt || 'PDF document'}
          />
        ) : (
          <img
            src={src}
            alt={alt || ''}
            className="modal-img"
          />
        )}

        {alt && type !== 'pdf' && (
          <p className="modal-caption">{alt}</p>
        )}
      </div>
    </div>
  )
}
