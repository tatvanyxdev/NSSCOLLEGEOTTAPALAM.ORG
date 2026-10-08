/**
 * ==============================================================================
 * NSS COLLEGE OTTAPALAM - OFFICIAL INSTITUTIONAL CONFIGURATION
 * ==============================================================================
 * Verified Information sourced directly from:
 * https://nsscollegeottapalam.org/
 *
 * This file serves as the single source of truth for static institutional data.
 * Dynamic academic data (departments, courses, faculty, registrations, attendance)
 * is maintained authoritative by the ERP Database & CollegeDataContext.
 * ==============================================================================
 */

export interface CollegeContact {
  institutionName: string;
  road: string;
  postOffice: string;
  city: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
  formattedAddress: string;
  phone: string;
  phoneFormatted: string;
  email: string;
  website: string;
  googleMapsUrl: string;
}

export interface CollegeLeader {
  name: string;
  title: string;
  role: string;
  photoUrl?: string;
  briefMessage: string;
  fullMessage?: string[];
}

export interface CollegeFacility {
  id: string;
  name: string;
  shortTag: string;
  description: string;
  highlights: string[];
}

export interface StudentClubCell {
  id: string;
  name: string;
  category: 'Service' | 'Academic & Cultural' | 'Support & Welfare' | 'Entrepreneurship';
  description: string;
}

export interface ImportantLinkItem {
  title: string;
  url: string;
  category: 'Affiliation & Regulatory' | 'Institutional';
  description?: string;
}

export const COLLEGE_INFO = {
  // Institutional Identity
  collegeName: 'N.S.S. College, Ottapalam',
  shortName: 'NSS College Ottapalam',
  establishedYear: 1961,
  inaugurationDate: '10 July 1961',
  management: 'Nair Service Society',
  affiliation: 'University of Calicut',
  accreditation: "NAAC Grade A",
  accreditationFull: "Accredited with 'A' Grade by NAAC",
  
  // Motto & Philosophical Heritage
  motto: 'Lucerna Pedibus Meis',
  mottoMeaning: 'Thy word is a lamp unto my feet',
  vision: 'Lead me from darkness to Light',
  mission: 'To foster intellectual excellence, upright character, ethical leadership, and inclusive community empowerment guided by eternal values.',

  // Founder & Visionary
  founder: {
    name: 'Bharatha Kesari Sri. Mannath Padmanabhan',
    title: 'Founder & Visionary Leader',
    summary: 'A legendary social reformer, freedom fighter, and educational visionary who spearheaded modern community empowerment through educational access in Kerala.',
    legacy: 'Founded under the benevolent stewardship of the Nair Service Society (NSS) to illuminate generations with universal knowledge and egalitarian principles.'
  },

  // Leadership
  principal: {
    name: 'Dr. Rajesh R',
    title: 'Principal in Charge',
    role: 'Head of Institution',
    photoUrl: '/principal.jpg',
    briefMessage: 'Welcome to N.S.S. College, Ottapalam. Our institution is dedicated to academic rigor, holistic character-building, and active research within Kerala\'s vibrant Four Year Undergraduate Programme (FYUGP) framework.',
    fullMessage: [
      'Welcome to N.S.S. College, Ottapalam. Since its formal inauguration on 10 July 1961, our institution has stood as an iconic beacon of higher learning in Palakkad District under the visionary stewardship of the Nair Service Society.',
      'Affiliated with the University of Calicut and accredited with \'A\' Grade by NAAC, we provide our diverse student fraternity with transformative pedagogy, comprehensive laboratories, and rich student welfare bodies.',
      'As we implement the Four Year Undergraduate Programme (FYUGP), we empower every scholar with multidisciplinary choice, research aptitude, and ethical leadership to serve the nation and society with distinction.'
    ]
  } as CollegeLeader,

  // Campus Profile
  campus: {
    areaAcres: '41 Acres',
    locationDescription: 'Situated in an expansive, scenic 41-acre landscape near Palakkad-Ponnani Road in the serene Palappuram area.',
    environment: 'Eco-friendly green campus with natural foliage, botanical specimens, wide open athletic grounds, and modern academic blocks.'
  },

  // Verified Academic Numbers
  academicStats: {
    established: '1961',
    ugProgrammesCount: 13,
    pgProgrammesCount: 6,
    campusAcres: '41 Acres',
    naacGrade: "Grade 'A'",
    university: 'University of Calicut'
  },

  // Contact Information
  contact: {
    institutionName: 'NSS College Ottapalam',
    road: 'Palakkad – Ponnani Road',
    postOffice: 'Palappuram P O',
    city: 'Palakkad',
    pincode: '679103',
    district: 'Palakkad',
    state: 'Kerala',
    country: 'India',
    formattedAddress: 'NSS College Ottapalam, Palakkad – Ponnani Road, Palappuram P O, Palakkad – 679103, Kerala, India',
    phone: '0466 224 4382',
    phoneFormatted: '+91 466 2244382',
    email: 'support@nsscollegeottapalam.org',
    website: 'https://nsscollegeottapalam.org/',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=NSS+College+Ottapalam+Palappuram+Kerala'
  } as CollegeContact,

  // Key Facilities (Verified from Official Website)
  facilities: [
    {
      id: 'fac-library',
      name: 'Automated Central Library',
      shortTag: 'Learning & Research',
      description: 'Well-stocked automated repository housing extensive subject volumes, academic journals, reference titles, and high-speed digital browsing terminals for research scholars and students.',
      highlights: ['Automated Cataloging', 'Reference & Reading Halls', 'Digital Access Stations', 'Periodical Subscriptions']
    },
    {
      id: 'fac-ict',
      name: 'ICT & Computing Infrastructure',
      shortTag: 'Technology Resources',
      description: 'Dedicated computer laboratories, campus-wide network connectivity, and smart multimedia-enabled classrooms supporting modern computational coursework and FYUGP digital modules.',
      highlights: ['High-Speed Campus LAN', 'Modern Computer Labs', 'Smart Seminar Classrooms', 'Digital Examination Centers']
    },
    {
      id: 'fac-sports',
      name: 'Sports & Athletic Facilities',
      shortTag: 'Physical Education & Wellness',
      description: 'Extensive physical education infrastructure including large sports fields, outdoor athletics tracks, and training setups actively cultivating state and university sports competitors.',
      highlights: ['Athletic Tracks & Ground', 'University Sports Training', 'Indoor Sports Facilities', 'Fitness & Physical Fitness']
    },
    {
      id: 'fac-campus-nature',
      name: '41-Acre Scenic Green Campus',
      shortTag: 'Eco-Friendly Heritage',
      description: 'Sprawling natural landscape with rich canopy cover, medicinal flora, and tranquil study corners fostering focused intellectual contemplation away from urban noise.',
      highlights: ['41-Acre Serene Ecosystem', 'Biodiversity & Green Shrubbery', 'Eco-Conscious Infrastructure', 'Solar & Rainwater Systems']
    },
    {
      id: 'fac-support',
      name: 'Student Support & Guidance Center',
      shortTag: 'Scholar Welfare',
      description: 'Dedicated mentorship, career counseling, remedial academic support, and student welfare desks committed to personal and professional development.',
      highlights: ['Faculty Mentorship Scheme', 'Remedial Coaching Support', 'Career Guidance Cells', 'Scholarship Help Desk']
    }
  ] as CollegeFacility[],

  // Verified Active Clubs & Cells (Official Website)
  studentClubsAndCells: [
    {
      id: 'club-nss',
      name: 'National Service Scheme (NSS Units 36 & 94)',
      category: 'Service',
      description: 'NSS Units 36 & 94 of N.S.S. College, Ottapalam spearhead dedicated community outreach, youth character building, blood donation camps, disaster relief, village adoptions, and social service under the University of Calicut.'
    },
    {
      id: 'club-bhoomitra',
      name: 'Bhoomitra Sena Club',
      category: 'Service',
      description: 'Environmental stewardship cell conducting tree plantations, eco-audits, biodiversity mapping, and campus green drives.'
    },
    {
      id: 'club-quiz',
      name: 'Quiz Club',
      category: 'Academic & Cultural',
      description: 'Platform fostering intellectual curiosity, general knowledge, current affairs acumen, and intercollegiate quiz contests.'
    },
    {
      id: 'club-ed',
      name: 'Entrepreneurship Development (ED) Club',
      category: 'Entrepreneurship',
      description: 'Incubates innovative business ideas, startup skills, product pitching, and industry interaction for aspiring student founders.'
    },
    {
      id: 'club-cultural',
      name: 'Cultural & Arts Club',
      category: 'Academic & Cultural',
      description: 'Celebrates Kerala\'s traditional arts, theatrical performances, music, literary forums, and university youth festivals.'
    },
    {
      id: 'cell-placement',
      name: 'Placement & Career Guidance Cell',
      category: 'Entrepreneurship',
      description: 'Coordinates recruitment drives, resume clinics, interview preparation, and skill enhancement workshops.'
    },
    {
      id: 'cell-counselling',
      name: 'Student Counselling & Mental Health Cell',
      category: 'Support & Welfare',
      description: 'Confidential psychological support, emotional guidance, stress management, and mental health awareness programs.'
    },
    {
      id: 'cell-grievance',
      name: 'Grievance Redressal & Anti-Ragging Cell',
      category: 'Support & Welfare',
      description: 'Strict statutory body safeguarding student dignity, immediate resolution of complaints, and ensuring a zero-tolerance ragging-free campus.'
    },
    {
      id: 'cell-women',
      name: 'Women’s Cell & Internal Complaints Committee (ICC)',
      category: 'Support & Welfare',
      description: 'Promoting gender equity, self-defense workshops, leadership training, and statutory protection against harassment.'
    }
  ] as StudentClubCell[],

  // Important Verified External Links
  importantLinks: [
    {
      title: 'University of Calicut',
      url: 'https://uoc.ac.in/',
      category: 'Affiliation & Regulatory',
      description: 'Official Parent University Portal & Examination Services'
    },
    {
      title: 'University Grants Commission (UGC)',
      url: 'https://www.ugc.gov.in/',
      category: 'Affiliation & Regulatory',
      description: 'Higher Education Apex Statutory Body'
    },
    {
      title: 'Ministry of Education (India)',
      url: 'https://www.education.gov.in/',
      category: 'Affiliation & Regulatory',
      description: 'Government of India Higher Education Directives'
    },
    {
      title: 'Right to Information (RTI)',
      url: 'https://nsscollegeottapalam.org/',
      category: 'Institutional',
      description: 'Public Information Officer & Statutory Disclosures'
    },
    {
      title: 'Official College Website',
      url: 'https://nsscollegeottapalam.org/',
      category: 'Institutional',
      description: 'Main Institutional Web Portal & Archive'
    }
  ] as ImportantLinkItem[]
};

export const COLLEGE_PHOTO_URL = 'https://i.postimg.cc/K8G79dLH/1000145711-(1)-(1).jpg';
export const PRINCIPAL_PHOTO_URL = '/principal.jpg';
export const PRINCIPAL_PHOTO_FALLBACKS = [
  '/principal.jpg',
  'https://i.postimg.cc/tYsdMCgr/principal15012025-scaled-(2).jpg',
  'https://i.postimg.cc/Yq3XjvBw/principal15012025-scaled-(2).jpg'
];
