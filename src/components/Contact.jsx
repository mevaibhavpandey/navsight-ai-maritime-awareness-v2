import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiLinkedin, FiGithub, FiMail, FiSend, FiPhone } from 'react-icons/fi'
import { personalInfo } from '../data/content'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' } }),
}

export default function Contact() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="contact" aria-label="Contact section">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">Open to collaborations, defense tech discussions, and opportunities</p>
        </motion.div>

        <div className="contact-inner">
          {/* Email */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={1}>
            <a
              href={`mailto:${personalInfo.email}`}
              className="contact-email-link"
              aria-label={`Send email to ${personalInfo.email}`}
            >
              <FiMail /> {personalInfo.email}
            </a>

            {personalInfo.phone && (
              <div style={{ marginTop: '-1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <a
                  href={`tel:${personalInfo.phone.replace(/\s/g, '')}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500,
                    transition: 'var(--transition)',
                  }}
                  aria-label={`Call ${personalInfo.phone}`}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <FiPhone /> {personalInfo.phone}
                </a>
              </div>
            )}
          </motion.div>

          {/* Social links */}
          <motion.div
            className="contact-socials"
            variants={fadeUp} initial="hidden"
            animate={inView ? 'visible' : 'hidden'} custom={2}
          >
            <a
              href={personalInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-social"
              aria-label="LinkedIn profile"
            >
              <FiLinkedin /> LinkedIn
            </a>
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-social"
              aria-label="GitHub profile"
            >
              <FiGithub /> GitHub
            </a>
          </motion.div>

          {/* Quick message card */}
          <motion.div
            variants={fadeUp} initial="hidden"
            animate={inView ? 'visible' : 'hidden'} custom={3}
          >
            <div className="card glass-card" style={{ textAlign: 'left', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                🚀 Whether you want to discuss <strong style={{ color: 'var(--accent-orange)' }}>AI/ML engineering</strong>,{' '}
                <strong style={{ color: 'var(--accent-gold)' }}>autonomous drone systems</strong>, or{' '}
                <strong style={{ color: 'var(--accent-emerald)' }}>defense technology</strong> research — I'd love to connect.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); window.open(`mailto:${personalInfo.email}?subject=Portfolio Inquiry`) }}
                aria-label="Contact form"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="contact-name" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Your name"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem',
                        background: 'rgba(248,250,252,0.04)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                        fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      style={{
                        width: '100%', padding: '0.65rem 0.9rem',
                        background: 'rgba(248,250,252,0.04)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                        fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="contact-message" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Hi Vaibhav, I'd like to discuss…"
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem',
                      background: 'rgba(248,250,252,0.04)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <FiSend /> Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
