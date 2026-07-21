import { Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Timeline from './components/Timeline'
import MeritVerification from './components/MeritVerification'
import Certifications from './components/Certifications'
import Achievements from './components/Achievements'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'

function SectionDivider() {
  return <hr className="divider" aria-hidden="true" />
}

export default function App() {
  return (
    <>
      <Navbar />

      <main id="main-content">
        <Hero />
        <SectionDivider />

        <Suspense fallback={null}>
          <About />
          <SectionDivider />

          <Skills />
          <SectionDivider />

          <Projects />
          <SectionDivider />

          <Timeline />
          <SectionDivider />

          <MeritVerification />
          <SectionDivider />

          <Certifications />
          <SectionDivider />

          <Achievements />
          <SectionDivider />

          <Gallery />
          <SectionDivider />

          <Contact />
        </Suspense>
      </main>

      <Footer />
    </>
  )
}
