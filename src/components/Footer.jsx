import { FiLinkedin, FiGithub, FiHeart } from 'react-icons/fi'
import { personalInfo } from '../data/content'

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo" aria-label="Site footer">
      <div className="footer-inner">
        <p className="footer-text">
          Built with <FiHeart style={{ display: 'inline', color: 'var(--accent-orange)', verticalAlign: 'middle' }} /> by{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Vaibhav Pandey</strong>
        </p>

        <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} aria-hidden="true" />

        <p className="footer-text">
          AI/ML Engineer · Autonomous Systems · UAV Research
        </p>

        <div aria-hidden="true" style={{ width: '1px', height: '18px', background: 'var(--border)' }} />

        <div className="footer-socials" aria-label="Social links">
          <a
            href={personalInfo.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            aria-label="LinkedIn profile"
          >
            <FiLinkedin />
          </a>
          <a
            href={personalInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            aria-label="GitHub profile"
          >
            <FiGithub />
          </a>
        </div>

        <p className="footer-text" style={{ fontSize: '0.78rem' }}>
          © {new Date().getFullYear()} · AIR 31 NDA (IAF) · AIR 50 TES-52 (Army)
        </p>
      </div>
    </footer>
  )
}
