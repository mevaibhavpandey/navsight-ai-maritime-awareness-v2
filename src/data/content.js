// ============================================================
// CENTRAL CONTENT DATA — Vaibhav Pandey Portfolio
// ============================================================

export const personalInfo = {
  name: 'Vaibhav Pandey',
  tagline: 'AI/ML Engineer  ·  Autonomous Systems Developer  ·  UAV Researcher  ·  Full-Stack Developer',
  intro:
    'Computer Science & Engineering student (CGPA 8.83) passionate about AI, UAVs, and defense technology. Skilled in developing intelligent systems for aerospace, autonomous navigation, and data analytics. Committed to merging cutting-edge technology with national service.',
  email: 'vaibhav.pandey1661@gmail.com',
  phone: '+91 8683081192',
  linkedin: 'https://www.linkedin.com/in/vaibhav-pandey-7ba67033a/',
  github: 'https://github.com/mevaibhavpandey',
  resumePdf: null, // Add resume PDF path here when available
}

export const aboutParagraphs = [
  'I am a B.E. student in Computer Science & Engineering at BMS Institute of Technology & Management, Bengaluru (2023–2027), maintaining a CGPA of 8.83. My academic journey is driven by a deep fascination with Artificial Intelligence, Machine Learning, and Autonomous Systems.',
  'My technical focus spans ROS/PX4/Gazebo-based UAV systems, computer vision, sensor fusion, and maritime situational awareness. I have developed platforms that process 60+ GB oceanographic datasets and track 20,000+ vessels in real time — bridging software intelligence with real-world defense applications.',
  'Beyond engineering, I am the Founder & President of the ASTRA Club at BMSIT&M, fostering aeromodelling and aerospace culture on campus. As a national-level basketball gold medalist, I bring the same discipline and team spirit to every project I undertake.',
  'My selection as AIR 31 in the 153rd NDA Course (IAF Flying Branch) and AIR 50 in TES-52 (Indian Army) reflects my commitment to national service — a journey of resilience through multiple SSB interviews that sharpened my leadership, mental fortitude, and resolve.',
]

export const skills = [
  {
    category: 'Programming & Databases',
    icon: '💻',
    items: ['Python', 'C/C++', 'Java', 'SQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'REST APIs'],
  },
  {
    category: 'AI / ML & Data',
    icon: '🧠',
    items: [
      'Machine Learning',
      'Predictive Modeling',
      'Anomaly Detection',
      'Data Analytics',
      'Computer Vision',
      'OpenCV',
      'Object Detection',
      'RAG (Retrieval-Augmented Generation)',
      'Data Visualization',
      'Image Processing',
    ],
  },
  {
    category: 'Autonomous Systems',
    icon: '🛸',
    items: [
      'ROS',
      'PX4',
      'Gazebo',
      'ArduPilot',
      'Sensor Fusion',
      'Visual-Inertial Odometry (VIO)',
      'Autonomous Navigation',
      'Path Planning',
      'ORB-SLAM3',
    ],
  },
  {
    category: 'Cloud & DevOps',
    icon: '☁️',
    items: ['Docker', 'Kubernetes', 'AWS', 'Google Cloud Console', 'Linux', 'Git', 'GitHub'],
  },
  {
    category: 'Engineering Tools',
    icon: '⚙️',
    items: ['MATLAB', 'Simulink', 'SolidWorks', 'TensorFlow', 'Scikit-Learn', 'Dask', 'Vector Databases'],
  },
]

export const projects = [
  {
    id: 1,
    title: 'Argo-Based FloatChat AI',
    subtitle: 'Oceanographic AI Platform',
    description:
      'An AI-powered chatbot for analyzing massive ocean datasets. Capable of processing 60+ GB NETCDF files and generating rich summaries, visualizations, and anomaly-based maritime threat identification — enabling real-time oceanographic intelligence.',
    tech: ['Python', 'Pandas', 'Xarray', 'PostgreSQL', 'NumPy', 'Scikit-Learn', 'Dask', 'Node.js', 'REST API'],
    metrics: [
      { label: 'Dataset Size', value: '60+ GB' },
      { label: 'Response Time', value: 'Sub-second' },
      { label: 'User Satisfaction', value: '95%+' },
    ],
    color: '#F97316',
    icon: '🌊',
  },
  {
    id: 2,
    title: 'Maritime Situational Awareness Dashboard',
    subtitle: 'Vessel Monitoring Platform',
    description:
      'Real-time dashboard for tracking 20,000+ vessels across the Indian maritime zone. Integrates AIS data streams with ML-based anomaly detection to flag suspicious movement patterns and support maritime domain awareness.',
    tech: ['Python', 'React.js', 'Streamlit', 'Folium', 'Matplotlib', 'Pandas', 'NumPy'],
    metrics: [
      { label: 'Vessels Tracked', value: '20,000+' },
      { label: 'API Response', value: '8ms' },
      { label: 'Detection Accuracy', value: '98%' },
    ],
    color: '#EAB308',
    icon: '🛥️',
  },
  {
    id: 3,
    title: 'AURA-X Autonomous UAV',
    subtitle: 'GPS-Denied Reconnaissance Drone',
    description:
      'A low-cost autonomous UAV for reconnaissance in GPS-denied environments. Implements SLAM (ORB-SLAM3) and sensor fusion for navigation, with visual-inertial odometry enabling robust localization without external positioning signals.',
    tech: ['ROS', 'C++', 'Python', 'OpenCV', 'ORB-SLAM3', 'PX4', 'Gazebo', 'TensorFlow', 'MATLAB'],
    metrics: [
      { label: 'Cost Reduction', value: '~80%' },
      { label: 'Nav Accuracy', value: '88%' },
      { label: 'Environment', value: 'GPS-Denied' },
    ],
    color: '#10B981',
    icon: '\uD83D\uDE80',
  },
]

export const timelineEvents = [
  {
    date: 'Sep 2023',
    event: 'NDA-1 2023',
    detail: 'Cleared Stage 1 at SSB — demonstrated potential; pursued growth.',
    status: 'progress',
  },
  {
    date: 'Nov 2023',
    event: 'TES-50',
    detail: 'Cleared SSB (Indian Army) — building resilience with each attempt.',
    status: 'progress',
  },
  {
    date: 'Jan 2024',
    event: 'NDA-2 2023',
    detail: 'Cleared Stage 1 at SSB — continued progress and determination.',
    status: 'progress',
  },
  {
    date: 'Mar 2024',
    event: 'TES-51',
    detail: 'Cleared SSB, qualified and waitlisted — closer than ever.',
    status: 'progress',
  },
  {
    date: 'May 2024',
    event: 'NDA-153 (IAF)',
    detail: 'Cleared SSB ✦ Selected — AIR 31, Indian Air Force Flying Branch.',
    status: 'selected',
    rank: 'AIR 31',
  },
  {
    date: 'Nov 2024',
    event: 'TES-52 (Army)',
    detail: 'Cleared SSB ✦ Selected — AIR 50, Indian Army.',
    status: 'selected',
    rank: 'AIR 50',
  },
]

export const certifications = [
  {
    id: 1,
    title: 'Oracle AI Foundations Associate',
    issuer: 'Oracle Cloud Infrastructure',
    description:
      "Completed Oracle's AI Foundations Associate program covering AI/ML fundamentals, deep learning, neural networks, and LLMs on Oracle Cloud Infrastructure (OCI).",
    file: '/assets/pdfs/Oracle Certificate.pdf',
    type: 'pdf',
    icon: '\uD83D\uDEDB\uFE0F',
  },
  {
    id: 2,
    title: 'Introduction to Advanced Robotics',
    issuer: 'NPTEL (IIT)',
    description:
      'Completed NPTEL course on advanced robotics: manipulators, kinematics, dynamics, workspace analysis, and motion planning.',
    file: '/assets/pdfs/NPTEL Robotics.pdf',
    type: 'pdf',
    icon: '🤖',
  },
  {
    id: 3,
    title: 'Introduction to Large Language Models',
    issuer: 'NPTEL (IIT)',
    description:
      'Completed NPTEL certification on LLMs covering transformer architecture, prompt engineering, fine-tuning, and generative AI applications.',
    file: '/assets/pdfs/NPTEL LLM.pdf',
    type: 'pdf',
    icon: '🧬',
  },
  {
    id: 4,
    title: 'ICMOTA Participation Certificate',
    issuer: 'IIT BHU — Indian Conference on Military Technology & Applications',
    description:
      'Certificate of participation at ICMOTA (Indian Conference on Military Technology & Applications) hosted at IIT Varanasi (BHU).',
    file: '/assets/images/certifications/ICMOTA Certificate.jpeg',
    type: 'image',
    icon: '\uD83C\uDF96\uFE0F',
  },
  {
    id: 5,
    title: 'Life Skills & Employability Certificate',
    issuer: 'Life Skills Program',
    description:
      'Certificate from a comprehensive Life Skills and Employability Skills program covering workplace communication, professional ethics, and teamwork.',
    file: '/assets/images/certifications/Life Skill Certificate.jpeg',
    type: 'image',
    icon: '🌱',
  },
  {
    id: 6,
    title: 'Prepare Data for ML APIs on Google Cloud',
    issuer: 'Google Cloud — Smart Analytics Skill Badge',
    description:
      "Completed Google Cloud's Skill Badge for Smart Analytics: preparing data for ML APIs on Google Cloud, covering BigQuery, Cloud Storage, and AI/ML API integrations (Introductory level).",
    file: null,
    link: 'https://www.cloudskillsboost.google/',
    type: 'external',
    icon: '\u2601\uFE0F',
  },
]

export const achievements = [
  {
    id: 1,
    title: 'Founder & President — ASTRA Club',
    org: 'BMSIT&M, Bengaluru',
    description: 'Founded and lead the ASTRA aeromodelling & aerospace technology club, building a community of drone enthusiasts and innovators.',
    icon: '🚀',
    color: '#F97316',
  },
  {
    id: 2,
    title: 'Track Prize — ANVESHANA National Hackathon',
    org: 'UIIT Mandi (National Level)',
    description: 'Won a track prize at ANVESHANA National Hackathon, competing against top engineering teams across India.',
    icon: '🥇',
    color: '#EAB308',
    images: [
      '/assets/images/achievements/Anveshana Certificate.jpeg',
      '/assets/images/achievements/Anveshana Prize distribution.jpeg',
    ],
  },
  {
    id: 3,
    title: '2nd Place — InCSEption Inter-College Hackathon',
    org: 'Inter-College Software Hackathon',
    description: 'Secured 2nd place at InCSEption, an inter-college software hackathon, demonstrating strong software engineering and problem-solving skills.',
    icon: '🥈',
    color: '#94A3B8',
    images: [
      '/assets/images/achievements/Incsepetion Team certificate.jpeg',
      '/assets/images/achievements/Incseption Personal Certificate.jpeg',
    ],
  },
  {
    id: 4,
    title: 'AIR 31 — 153rd NDA Course (IAF Flying Branch)',
    org: 'Union Public Service Commission (UPSC)',
    description: 'Secured All-India Rank 31 in NDA (I) 2024 examination, selected for the prestigious Indian Air Force Flying Branch.',
    icon: '\u2708\uFE0F',
    color: '#60A5FA',
  },
  {
    id: 5,
    title: 'AIR 50 — 52nd TES Course (Indian Army)',
    org: 'Indian Army Technical Entry Scheme',
    description: 'Secured All-India Rank 50 in TES-52, selected for the Indian Army Technical Entry Scheme — a testament to technical aptitude and leadership potential.',
    icon: '\u2B50',
    color: '#10B981',
  },
  {
    id: 6,
    title: 'National-Level Basketball — Gold Medalist',
    org: 'Regional / College Athletics',
    description: 'Competed at national level in basketball and clinched a gold medal at the regional tournament, demonstrating team leadership and athletic excellence.',
    icon: '\uD83C\uDFC0',
    color: '#F97316',
  },
]

export const galleryImages = [
  // SSB
  { src: '/assets/images/ssb/SSB-1.jpeg', alt: 'Vaibhav Pandey at SSB Interview (NDA-1 2023)', category: 'SSB / Defense' },
  { src: '/assets/images/ssb/SSB-2.jpeg', alt: 'Vaibhav Pandey at SSB Interview (NDA-1 2023)', category: 'SSB / Defense' },
  { src: '/assets/images/ssb/SSB-3.jpeg', alt: 'Group at SSB (NDA-2 2023 interview)', category: 'SSB / Defense' },
  { src: '/assets/images/ssb/SSb-4.jpeg', alt: 'Group at SSB (NDA-2 2023 interview)', category: 'SSB / Defense' },
  { src: '/assets/images/ssb/SSB-5.jpeg', alt: 'Vaibhav Pandey with peers at SSB (NDA-153, IAF)', category: 'SSB / Defense' },
  { src: '/assets/images/ssb/SSB-6.jpeg', alt: 'Vaibhav Pandey at SSB (TES-52, Indian Army)', category: 'SSB / Defense' },
  // ICMOTA
  { src: '/assets/images/events/ICMOTA group photo.jpeg', alt: 'Group photo at ICMOTA conference (IIT BHU)', category: 'ICMOTA' },
  { src: '/assets/images/events/ICMOTA photo.jpeg', alt: 'Vaibhav at ICMOTA conference (IIT BHU)', category: 'ICMOTA' },
  // Life Skills
  { src: '/assets/images/events/Life Skill photo-1.jpeg', alt: 'Group photo from Life Skills workshop', category: 'Life Skills' },
  { src: '/assets/images/events/Life Skill photo-2.jpeg', alt: 'Activity photo from Life Skills training', category: 'Life Skills' },
  // Achievements
  { src: '/assets/images/achievements/Anveshana Prize distribution.jpeg', alt: 'Prize distribution at ANVESHANA Hackathon', category: 'Achievements' },
  { src: '/assets/images/achievements/Incsepetion group photo.jpeg', alt: 'Team photo at InCSEption Hackathon', category: 'Achievements' },
  // Recommendations
  { src: '/assets/images/recommendations/Recommendation photo.jpeg', alt: 'Recommendation letter photo', category: 'Recommendations' },
  { src: '/assets/images/recommendations/Recommendation photo-2.jpeg', alt: 'Recommendation letter photo', category: 'Recommendations' },
  // General gallery
  { src: '/assets/images/gallery/Photo Gallery-1.jpeg', alt: 'Event photo', category: 'General' },
  { src: '/assets/images/gallery/Photo Gallery-2.jpeg', alt: 'Event photo', category: 'General' },
  { src: '/assets/images/gallery/Photo Gallery-3.jpeg', alt: 'Event photo', category: 'General' },
  { src: '/assets/images/gallery/TES photo.jpeg', alt: 'Vaibhav Pandey at TES interview session', category: 'TES' },
]

export const meritLinks = {
  nda: {
    title: 'NDA-153 (NDA-I 2024)',
    subtitle: 'Indian Air Force Flying Branch · AIR 31',
    description:
      'Official UPSC / Defense recommended candidates list for the 153rd NDA Course (NDA-I 2024 examination). Vaibhav Pandey secured All-India Rank 31.',
    image: '/assets/images/merit/NDA merit list.jpeg',
    link: 'https://upsc.gov.in/sites/default/files/MksRcdCndts-NDA-I-24-Engl-051124.pdf',
    linkLabel: 'Verify NDA-153 Merit',
  },
  tes: {
    title: 'TES-52 (Indian Army)',
    subtitle: 'Indian Army Technical Entry Scheme · AIR 50',
    description:
      'Official Indian Army merit list for the 52nd Technical Entry Scheme (TES-52) course. Vaibhav Pandey secured All-India Rank 50.',
    image: '/assets/images/merit/TES merit list.jpeg',
    link: 'https://www.joinindianarmy.nic.in/writereaddata/Portal/Images/pdf/MERIT_LIST_FOR_TES_52_COURSE.pdf',
    linkLabel: 'Verify TES-52 Merit',
  },
}
