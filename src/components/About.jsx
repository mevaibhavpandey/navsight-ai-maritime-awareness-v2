import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { aboutParagraphs } from '../data/content'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } }),
}

const stats = [
  { num: '8.83', label: 'CGPA' },
  { num: 'AIR 31', label: 'NDA-153 (IAF)' },
  { num: 'AIR 50', label: 'TES-52 (Army)' },
  { num: '3+', label: 'Major Projects' },
]

const interests = [
  'Artificial Intelligence', 'Machine Learning', 'Autonomous UAVs',
  'ROS / PX4 / Gazebo', 'Defense Technology', 'Computer Vision',
  'Maritime Intelligence', 'Sensor Fusion', 'Data Analytics',
]

export default function About() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section id="about" aria-label="About section">
      <div className="section" ref={ref}>
        <motion.div
          variants={fadeUp} initial="hidden"
          animate={inView ? 'visible' : 'hidden'} custom={0}
        >
          <div className="accent-line" />
          <h2 className="section-title">About Me</h2>
          <p className="section-subtitle">Engineer · Aviator · Innovator</p>
        </motion.div>

        <div className="about-grid">
          {/* ── Left: Visual ── */}
          <motion.div
            className="about-visual"
            variants={fadeUp} initial="hidden"
            animate={inView ? 'visible' : 'hidden'} custom={1}
          >
            <div className="about-image-wrap">
              <img
                src="/assets/images/Profile Photo.jpeg"
                alt="Vaibhav Pandey"
                loading="lazy"
              />
            </div>

            <div className="about-stat-row">
              {stats.map((s, i) => (
                <div key={i} className="about-stat">
                  <div className="about-stat-num">{s.num}</div>
                  <div className="about-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Text ── */}
          <div className="about-text">
            {aboutParagraphs.map((p, i) => (
              <motion.p
                key={i} custom={i + 2}
                variants={fadeUp} initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                {p}
              </motion.p>
            ))}

            <motion.div
              custom={aboutParagraphs.length + 2}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <p style={{ fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                Areas of Interest
              </p>
              <div className="about-tags">
                {interests.map((tag) => (
                  <span key={tag} className="chip">{tag}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
