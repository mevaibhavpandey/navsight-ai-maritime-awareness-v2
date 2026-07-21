import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiEye } from 'react-icons/fi'
import { certifications } from '../data/content'
import Modal from './Modal'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' } }),
}

export default function Certifications() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [modal, setModal] = useState(null)

  return (
    <section id="certifications" className="skills-bg" aria-label="Certifications section">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Certifications</h2>
          <p className="section-subtitle">Professional development and verified learning credentials</p>
        </motion.div>

        <div className="certs-grid">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.id}
              className="cert-card"
              custom={i + 1}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <div className="cert-icon" aria-hidden="true">{cert.icon}</div>
              <h3 className="cert-title">{cert.title}</h3>
              <div className="cert-issuer">{cert.issuer}</div>
              <p className="cert-desc">{cert.description}</p>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                onClick={() => {
                  if (cert.type === 'external') {
                    window.open(cert.link, '_blank', 'noopener,noreferrer')
                  } else {
                    setModal({ src: cert.file, alt: cert.title, type: cert.type })
                  }
                }}
                aria-label={`View certificate: ${cert.title}`}
              >
                <FiEye /> View Certificate
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        src={modal?.src}
        alt={modal?.alt}
        type={modal?.type}
      />
    </section>
  )
}
