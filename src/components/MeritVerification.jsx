import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiExternalLink, FiCheckCircle } from 'react-icons/fi'
import { meritLinks } from '../data/content'
import Modal from './Modal'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' } }),
}

export default function MeritVerification() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [modal, setModal] = useState(null)

  const entries = [meritLinks.nda, meritLinks.tes]

  return (
    <section id="merit" aria-label="Merit list verification">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Merit Verification</h2>
          <p className="section-subtitle">
            Official merit lists verifiable on government defense portals
          </p>
        </motion.div>

        <div className="merit-grid">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.title}
              className="merit-card"
              custom={i + 1}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <img
                src={entry.image}
                alt={`${entry.title} merit list document`}
                className="merit-image"
                loading="lazy"
                onClick={() => setModal({ src: entry.image, alt: `${entry.title} merit list` })}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setModal({ src: entry.image, alt: `${entry.title} merit list` })}
                title="Click to enlarge"
              />

              <div className="merit-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <FiCheckCircle style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                  <h3 className="merit-title" style={{ margin: 0 }}>{entry.title}</h3>
                </div>
                <div className="merit-subtitle">{entry.subtitle}</div>
                <p className="merit-desc">{entry.description}</p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    aria-label={`${entry.linkLabel} — opens in new tab`}
                  >
                    {entry.linkLabel} <FiExternalLink />
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModal({ src: entry.image, alt: `${entry.title} merit list` })}
                  >
                    View Document
                  </button>
                </div>
              </div>
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
