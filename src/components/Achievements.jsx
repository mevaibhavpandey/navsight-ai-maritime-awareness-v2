import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { achievements } from '../data/content'
import Modal from './Modal'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' } }),
}

export default function Achievements() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [modal, setModal] = useState(null)

  return (
    <section id="achievements" aria-label="Achievements section">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Achievements</h2>
          <p className="section-subtitle">Milestones in engineering, defense, and athletics</p>
        </motion.div>

        <div className="achievements-grid">
          {achievements.map((ach, i) => (
            <motion.div
              key={ach.id}
              className="achievement-card"
              custom={i + 1}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              style={{ borderTopColor: ach.color + '90' }}
            >
              <style>{`.achievement-card:nth-child(${i + 1})::before { background: ${ach.color}; }`}</style>

              <div className="ach-icon" aria-hidden="true">{ach.icon}</div>
              <h3 className="ach-title">{ach.title}</h3>
              <div className="ach-org" style={{ color: ach.color }}>{ach.org}</div>
              <p className="ach-desc">{ach.description}</p>

              {ach.images && ach.images.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {ach.images.map((img, j) => (
                    <img
                      key={j}
                      src={img}
                      alt={`${ach.title} certificate`}
                      loading="lazy"
                      style={{
                        width: '80px', height: '60px', objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        cursor: 'pointer', transition: 'var(--transition)',
                      }}
                      onClick={() => setModal({ src: img, alt: ach.title })}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setModal({ src: img, alt: ach.title })}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
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
