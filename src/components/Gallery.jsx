import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { galleryImages } from '../data/content'
import Modal from './Modal'

// Duplicate images for seamless infinite loop
const doubled = [...galleryImages, ...galleryImages]

export default function Gallery() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 })
  const [modal, setModal] = useState(null)

  return (
    <section id="gallery" className="skills-bg" aria-label="Photo gallery section">
      <div style={{ padding: 'var(--section-pad)' }} ref={ref}>
        <div className="section" style={{ marginBottom: '2rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="accent-line" />
            <h2 className="section-title">Photo Gallery</h2>
            <p className="section-subtitle">
              A glimpse into the journey — SSB camps, hackathons, conferences & more
            </p>
          </motion.div>
        </div>

        {/* ── Scrolling Marquee ── */}
        <motion.div
          className="gallery-outer"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          aria-label="Scrolling photo gallery — hover to pause"
        >
          <div className="gallery-track" role="list">
            {doubled.map((img, i) => (
              <div
                key={i}
                className="gallery-item"
                role="listitem"
                tabIndex={0}
                onClick={() => setModal(img)}
                onKeyDown={(e) => e.key === 'Enter' && setModal(img)}
                aria-label={`Open photo: ${img.alt}`}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
                <div className="gallery-item-overlay">
                  <span className="gallery-caption">{img.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category legend */}
        <div className="section" style={{ marginTop: '1.5rem', paddingTop: 0, paddingBottom: 0 }}>
          <motion.div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {['SSB / Defense', 'ICMOTA', 'Life Skills', 'Achievements', 'Recommendations', 'TES', 'General'].map((cat) => (
              <span key={cat} className="chip" style={{ fontSize: '0.72rem' }}>{cat}</span>
            ))}
          </motion.div>
        </div>
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        src={modal?.src}
        alt={modal?.alt}
        type="image"
      />
    </section>
  )
}
