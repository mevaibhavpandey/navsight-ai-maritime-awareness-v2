import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { skills } from '../data/content'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' } }),
}

export default function Skills() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="skills" className="skills-bg" aria-label="Skills section">
      <div className="section" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}>
          <div className="accent-line" />
          <h2 className="section-title">Skills</h2>
          <p className="section-subtitle">Technologies and tools I work with</p>
        </motion.div>

        <div className="skills-grid">
          {skills.map((cat, i) => (
            <motion.div
              key={cat.category}
              className="skill-card"
              custom={i + 1}
              variants={fadeUp} initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <div className="skill-category-icon" aria-hidden="true">{cat.icon}</div>
              <div className="skill-category-name">{cat.category}</div>
              <div className="skill-items">
                {cat.items.map((item) => (
                  <span key={item} className="skill-item">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
