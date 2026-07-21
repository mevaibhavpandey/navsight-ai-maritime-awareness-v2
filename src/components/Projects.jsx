import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { projects } from '../data/content'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' } }),
}

const CHIP_COLORS = ['chip', 'chip chip-gold', 'chip chip-emerald', 'chip chip-blue']

export default function Projects() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="projects" aria-label="Projects section">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Projects</h2>
          <p className="section-subtitle">Real-world systems with measurable impact</p>
        </motion.div>

        <div className="projects-grid">
          {projects.map((proj, i) => (
            <motion.article
              key={proj.id}
              className="project-card"
              custom={i + 1}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              aria-label={proj.title}
            >
              {/* Header */}
              <div
                className="project-header"
                style={{
                  background: `linear-gradient(135deg, ${proj.color}18, ${proj.color}05)`,
                  borderBottom: `1px solid ${proj.color}30`,
                }}
              >
                <div className="project-icon" aria-hidden="true">{proj.icon}</div>
                <h3 className="project-title">{proj.title}</h3>
                <p className="project-subtitle" style={{ color: proj.color }}>{proj.subtitle}</p>
              </div>

              {/* Body */}
              <div className="project-body">
                <p className="project-desc">{proj.description}</p>

                <div className="project-tech" aria-label="Technologies used">
                  {proj.tech.map((t, idx) => (
                    <span key={t} className={CHIP_COLORS[idx % CHIP_COLORS.length]}>{t}</span>
                  ))}
                </div>

                <div className="project-metrics" aria-label="Key metrics">
                  {proj.metrics.map((m) => (
                    <div key={m.label} className="metric-row">
                      <span className="metric-label">{m.label}</span>
                      <span className="metric-value" style={{ color: proj.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
