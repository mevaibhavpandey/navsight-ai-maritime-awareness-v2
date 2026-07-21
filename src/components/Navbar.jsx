import { useState, useEffect } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { personalInfo } from '../data/content'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#defense', label: 'Defense' },
  { href: '#certifications', label: 'Certifications' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <a href="#hero" className="nav-logo" aria-label="Go to top">
          <span className="gradient-text-orange">VP</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>.</span>
        </a>

        <div className="nav-links" role="menubar">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} role="menuitem">{l.label}</a>
          ))}
        </div>

        {personalInfo.resumePdf ? (
          <a href={personalInfo.resumePdf} download className="nav-cta">Download CV</a>
        ) : (
          <a href="#contact" className="nav-cta">Hire Me</a>
        )}

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} role="menu">
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} role="menuitem" onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
      </div>
    </>
  )
}
