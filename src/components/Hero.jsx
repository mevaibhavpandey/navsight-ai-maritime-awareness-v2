import { motion } from 'framer-motion'
import { FiLinkedin, FiGithub, FiArrowDown } from 'react-icons/fi'
import { personalInfo } from '../data/content'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: 'easeOut' } },
})

export default function Hero() {
  return (
    <section id="hero" className="hero" aria-label="Hero section">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />

      <div className="hero-inner">
        {/* ── Left: Text Content ── */}
        <div>
          <motion.div {...fadeUp(0.1)} className="hero-eyebrow">
            <span>🎖️</span>
            AIR 31 NDA (IAF) · AIR 50 TES-52 (Army)
          </motion.div>

          <motion.h1 {...fadeUp(0.2)} className="hero-name">
            <span className="gradient-text-orange">Vaibhav</span>
            <br />
            <span>Pandey</span>
          </motion.h1>

          <motion.p {...fadeUp(0.35)} className="hero-tagline">
            <strong>AI/ML Engineer</strong> &nbsp;·&nbsp; <strong>Autonomous Systems Developer</strong>
            <br />
            <strong>UAV Researcher</strong> &nbsp;·&nbsp; <strong>Full-Stack Developer</strong>
          </motion.p>

          <motion.p {...fadeUp(0.45)} className="hero-intro">
            Computer Science & Engineering student (CGPA&nbsp;8.83) passionate about AI, UAVs, and
            defense technology. Skilled in developing intelligent systems for aerospace, autonomous
            navigation, and data analytics. Committed to merging cutting-edge tech with national service.
          </motion.p>

          <motion.div {...fadeUp(0.55)} className="hero-buttons">
            <a href="#projects" className="btn btn-primary">
              View Projects <FiArrowDown />
            </a>
            {personalInfo.resumePdf ? (
              <a href={personalInfo.resumePdf} download className="btn btn-secondary">
                Download Resume
              </a>
            ) : (
              <a href="#contact" className="btn btn-secondary">
                Get In Touch
              </a>
            )}
          </motion.div>

          <motion.div {...fadeUp(0.65)} className="hero-socials">
            <a
              href={personalInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-social-btn"
              aria-label="LinkedIn profile"
            >
              <FiLinkedin />
            </a>
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-social-btn"
              aria-label="GitHub profile"
            >
              <FiGithub />
            </a>
          </motion.div>
        </div>

        {/* ── Right: Profile Photo ── */}
        <motion.div
          className="hero-photo-wrap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.3, ease: 'easeOut' } }}
        >
          <div className="hero-photo-ring" aria-hidden="true">
            <img
              src="/assets/images/Profile Photo.jpeg"
              alt="Vaibhav Pandey — profile photo"
              className="hero-photo"
            />
          </div>

          {/* Floating badges */}
          <div className="hero-badge badge-1" aria-label="CGPA 8.83">
            <span>🎓</span>
            <span>CGPA 8.83</span>
          </div>
          <div className="hero-badge badge-2" aria-label="AIR 31 — IAF">
            <span>✈️</span>
            <span>AIR 31 — IAF</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
