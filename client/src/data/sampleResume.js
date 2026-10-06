export const sampleResume = {
  title: "Senior Full Stack Engineer Resume",
  target_role: "Senior Full Stack Developer",
  template_id: "modern",
  theme_color: "#2563eb",
  page_style: "modern",
  personal_info: {
    fullName: "Darshan Patel",
    email: "darshan.patel@example.com",
    phone: "+91 98250 88990",
    location: "Ahmedabad, Gujarat, India",
    linkedin: "linkedin.com/in/darshan-patel-dev",
    github: "github.com/darshanpatel-pro",
    website: "darshanpatel.dev",
    profile_photo: "",
    photo_shape: "circle"
  },
  summary: "Results-driven Senior Full Stack Developer with 4+ years of hands-on expertise building enterprise-grade web applications with React, Node.js, and MySQL. Proven track record of architecting scalable microservices, slashing API latency by 35%, and driving agile team sprints.",
  skills: [
    "React.js",
    "Node.js",
    "Express.js",
    "MySQL",
    "JavaScript (ES6+)",
    "TypeScript",
    "RESTful APIs",
    "Tailwind / Modern CSS",
    "Git & GitHub",
    "Docker Basics",
    "JWT Authentication"
  ],
  experience: [
    {
      id: "exp-1",
      role: "Lead Full Stack Engineer",
      company: "Apex Cloud Innovations",
      location: "Ahmedabad, IN (Hybrid)",
      startDate: "Jan 2023",
      endDate: "Present",
      description: "• Architected and deployed micro-frontend architecture supporting 80,000+ daily active users.\n• Engineered optimized MySQL indexing and caching mechanisms, cutting DB query latency by 42%.\n• Mentored 5 junior developers on code quality standards, unit testing, and agile sprint delivery."
    },
    {
      id: "exp-2",
      role: "Software Developer",
      company: "Cognitive Tech Solutions",
      location: "Surat, IN",
      startDate: "Jun 2021",
      endDate: "Dec 2022",
      description: "• Developed reusable UI component libraries in React with modern CSS and state management.\n• Integrated secure JWT authentication, role-based access control, and bcrypt password encryption.\n• Collaborated with product managers and QA to resolve 120+ critical issues ahead of production rollouts."
    }
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Technology in Computer Engineering",
      institution: "Gujarat Technological University (GTU)",
      year: "2017 - 2021",
      score: "8.75 CGPA"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "AI Resume & ATS Optimization Engine",
      link: "github.com/darshanpatel-pro/ai-resume",
      description: "Full-stack application utilizing React, Node.js, MySQL, and Gemini API to generate ATS-optimized resumes with 1-click export and real-time score auditing."
    },
    {
      id: "proj-2",
      name: "Cloud Fleet Management Dashboard",
      link: "github.com/darshanpatel-pro/fleet-tracker",
      description: "Real-time telemetry dashboard monitoring 500+ commercial vehicles with live map tracking and automated maintenance alerts."
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      year: "2023"
    },
    {
      id: "cert-2",
      name: "Meta Front-End Developer Professional Certificate",
      issuer: "Coursera / Meta",
      year: "2022"
    }
  ]
};

export const emptyResume = {
  title: "My Professional Resume",
  target_role: "",
  template_id: "modern",
  theme_color: "#2563eb",
  page_style: "modern",
  personal_info: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    profile_photo: "",
    photo_shape: "circle"
  },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: []
};
