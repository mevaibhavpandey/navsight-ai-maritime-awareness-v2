import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { timelineEvents } from '../data/content'
import Modal from './Modal'

const ssbPhotos = [
  { src: '/assets/images/ssb/SSB-1.jpeg', alt: 'Vaibhav Pandey at SSB Interview (NDA-1 2023)' },
  { src: '/assets/images/ssb/SSB-2.jpeg', alt: 'Vaibhav Pandey at SSB Interview (NDA-1 2023)' },
  { src: '/assets/images/ssb/SSB-3.jpeg', alt: 'Group at SSB (NDA-2 2023)' },
  { src: '/assets/images/ssb/SSb-4.jpeg', alt: 'Group at SSB (NDA-2 2023)' },
  { src: '/assets/images/ssb/SSB-5.jpeg', alt: 'Vaibhav Pandey with peers at SSB (NDA-153, IAF)' },
  { src: '/assets/images/ssb/SSB-6.jpeg', alt: 'Vaibhav Pandey at SSB (TES-52, Indian Army)' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } }),
}

export default function Timeline() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 })
  const [modal, setModal] = useState(null)

  return (
    <section id="defense" className="skills-bg" aria-label="Defense selection journey">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Defense Selection Journey</h2>
          <p className="section-subtitle">
            A story of perseverance, resilience, and commitment to national service
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
          {/* ── Timeline ── */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={1}>
            <div className="timeline-wrap" role="list" aria-label="SSB Interview Timeline">
              {timelineEvents.map((ev, i) => (
                <div key={i} className="timeline-item" role="listitem">
                  <div
                    className={`timeline-dot ${ev.status === 'selected' ? 'dot-selected' : 'dot-progress'}`}
                    aria-hidden="true"
                  />
                  <div className="timeline-date">{ev.date}</div>
                  <div
                    className="timeline-event"
                    style={{ color: ev.status === 'selected' ? 'var(--accent-orange)' : 'var(--text-primary)' }}
                  >
                    {ev.event}
                  </div>
                  <div className="timeline-detail">{ev.detail}</div>
                  {ev.rank && (
                    <div className="rank-badge">
                      ✦ {ev.rank}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Selection highlights + SSB history image ── */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={2}>
            <div className="selection-cards">
              {/* IAF Card */}
              <div className="selection-card iaf" aria-label="Selected NDA-153 IAF Flying Branch">
                <div className="selection-card-rank gradient-text-orange">AIR 31</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>153rd NDA Course</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Indian Air Force · Flying Branch
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <span className="chip" style={{ fontSize: '0.72rem' }}>✈️ IAF Flying</span>
                </div>
              </div>

              {/* Army Card */}
              <div className="selection-card army" aria-label="Selected TES-52 Indian Army">
                <div className="selection-card-rank" style={{ background: 'var(--gradient-emerald)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AIR 50</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>52nd TES Course</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Indian Army · Technical Entry
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <span className="chip chip-emerald" style={{ fontSize: '0.72rem' }}>⭐ Indian Army</span>
                </div>
              </div>
            </div>

            {/* History of SSB image */}
            <div style={{ marginTop: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setModal({ src: '/assets/images/gallery/HIstory of SSB.png', alt: 'History of SSB interviews — timeline graphic' })}>
              <img
                src="/assets/images/gallery/HIstory of SSB.png"
                alt="Defense selection & SSB interview history timeline"
                loading="lazy"
                style={{ width: '100%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Defense selection history graphic — click to enlarge
            </p>
          </motion.div>
        </div>

        {/* ── SSB Photo Gallery Strip ── */}
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={3}>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            SSB Interview Gallery
          </p>
          <div className="ssb-gallery" role="list" aria-label="SSB interview photos">
            {ssbPhotos.map((ph, i) => (
              <img
                key={i}
                src={ph.src}
                alt={ph.alt}
                loading="lazy"
                role="listitem"
                tabIndex={0}
                onClick={() => setModal(ph)}
                onKeyDown={(e) => e.key === 'Enter' && setModal(ph)}
              />
            ))}
          </div>
        </motion.div>
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
