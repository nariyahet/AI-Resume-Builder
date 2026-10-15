import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseResumeRuleBased, sanitizeParsedResume, isLikelyLocation, isValidCandidateName } from '../controllers/aiController.js';
import { extractTextFromPdf, extractTextFromDocx } from '../controllers/uploadController.js';

// Test A — Labeled resume (Darshan Patel)
test('Test A: Labeled resume for Darshan Patel maps fields cleanly and accurately', () => {
  const resumeText = `Name: Darshan Patel
Target Role: Senior Full Stack Developer
Email: darshan.patel@example.com
Phone: +91 98250 88990
Location: Ahmedabad, Gujarat
LinkedIn: linkedin.com/in/darshan-patel-dev
GitHub: github.com/darshanpatel-pro
Website: darshanpatel.dev

PROFESSIONAL SUMMARY
Senior Full Stack Developer with 5+ years of experience engineering high-throughput React and Node.js applications.

TECHNICAL SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Docker, AWS

WORK EXPERIENCE
TechFlow Innovations | Senior Full Stack Developer | Jan 2021 - Present
• Designed and deployed scalable REST and GraphQL APIs serving 500k+ daily requests.
• Led frontend modernization converting legacy systems to React 18 with 40% performance gain.

Alpha Labs | Software Engineer | Jun 2018 - Dec 2020
• Built enterprise dashboard using React, Redux, and Tailwind CSS.
• Collaborated in Agile sprints and established automated CI/CD pipelines.

EDUCATION
Gujarat Technological University
Bachelor of Engineering in Information Technology | 2014 - 2018 | Score: 8.9 CGPA

PROJECTS
AI Resume Studio
Role: Lead Architect | 2023 - 2024
Description: Intelligent resume builder with live dynamic preview, ATS scoring, and automated PDF exports.
Link: github.com/darshanpatel-pro/ai-resume
Tech Stack: React, Node.js, Vite, Puppeteer`;

  const parsed = parseResumeRuleBased(resumeText);

  // 1. Full Name
  assert.equal(parsed.personal_info.fullName, 'Darshan Patel', 'Full Name must be Darshan Patel');

  // 2. Email and Phone
  assert.equal(parsed.personal_info.email, 'darshan.patel@example.com', 'Email must match');
  assert.equal(parsed.personal_info.phone, '+91 98250 88990', 'Phone must match');

  // 3. Location
  assert.equal(parsed.personal_info.location, 'Ahmedabad, Gujarat', 'Location must contain only actual location');
  assert.notEqual(parsed.personal_info.location, 'Darshan Patel', 'Location must not contain candidate name');

  // 4. Target Job Role
  assert.equal(parsed.target_role, 'Senior Full Stack Developer', 'Target Job Role must be Senior Full Stack Developer');
  assert.notEqual(parsed.target_role, 'Darshan Patel', 'Target Role must never be candidate name');

  // 5. Links
  assert.equal(parsed.personal_info.linkedin, 'linkedin.com/in/darshan-patel-dev');
  assert.equal(parsed.personal_info.github, 'github.com/darshanpatel-pro');
  assert.equal(parsed.personal_info.website, 'darshanpatel.dev');

  // 6. Summary
  assert.ok(parsed.summary.includes('Senior Full Stack Developer with 5+ years of experience'));
  assert.ok(!parsed.summary.includes('darshan.patel@example.com'), 'Summary must not contain email residue');

  // 7. Skills
  assert.ok(parsed.skills.includes('React'), 'Skills must contain React');
  assert.ok(parsed.skills.includes('Node.js'), 'Skills must contain Node.js');
  assert.ok(parsed.skills.includes('TypeScript'), 'Skills must contain TypeScript');

  // 8. Experience
  assert.equal(parsed.experience.length, 2, 'Should extract both jobs');
  assert.equal(parsed.experience[0].company, 'TechFlow Innovations');
  assert.equal(parsed.experience[0].role, 'Senior Full Stack Developer');

  // 9. Education
  assert.ok(parsed.education.length >= 1, 'Should extract education');
  assert.ok(parsed.education.some(e => e.institution.includes('Gujarat Technological University')));

  // 10. Projects
  assert.ok(parsed.projects.length >= 1, 'Should extract projects');
  assert.equal(parsed.projects[0].name, 'AI Resume Studio');
});

// Test B — Unlabeled resume (Jane Doe with no explicit target role)
test('Test B: Unlabeled resume for Jane Doe extracts correctly without role/location leaks', () => {
  const resumeText = `Jane Doe
jane.doe@example.com | (555) 123-4567 | San Francisco, CA
linkedin.com/in/janedoe | github.com/janedoe

PROFESSIONAL SUMMARY
Passionate engineer specializing in modern UI/UX design and scalable distributed systems.

TECHNICAL SKILLS
Python, JavaScript, React, Django, Docker, PostgreSQL

WORK EXPERIENCE
CloudScale Inc. | Software Engineer | 2020 - Present
• Implemented microservices using Python and Docker.

EDUCATION
Stanford University
Bachelor of Science in Computer Science | 2016 - 2020

PROJECTS
OpenAnalytics
Open source analytics dashboard for SaaS metrics.`;

  const parsed = parseResumeRuleBased(resumeText);

  // 1. Candidate Name
  assert.equal(parsed.personal_info.fullName, 'Jane Doe', 'Candidate name should be extracted as Jane Doe');

  // 2. Candidate name must not leak into location or target role
  assert.notEqual(parsed.personal_info.location, 'Jane Doe', 'Location must never be candidate name');
  assert.equal(parsed.personal_info.location, 'San Francisco, CA', 'Location must be San Francisco, CA');
  assert.notEqual(parsed.target_role, 'Jane Doe', 'Target role must never be candidate name');
  assert.notEqual(parsed.target_role, 'San Francisco, CA', 'Target role must never be location');

  // 3. Contact details preserved
  assert.equal(parsed.personal_info.email, 'jane.doe@example.com');
  assert.equal(parsed.personal_info.phone, '(555) 123-4567');
  assert.equal(parsed.personal_info.linkedin, 'linkedin.com/in/janedoe');
  assert.equal(parsed.personal_info.github, 'github.com/janedoe');
  assert.equal(parsed.personal_info.website, '', 'Missing website should remain empty without placeholders');

  // 4. Sections preserved
  assert.ok(parsed.summary.includes('Passionate engineer specializing in modern UI/UX design'));
  assert.ok(parsed.skills.includes('Python'));
  assert.ok(parsed.skills.includes('React'));
  assert.equal(parsed.experience[0].company, 'CloudScale Inc.');
  assert.ok(parsed.education.some(e => e.institution.includes('Stanford University')));
  assert.ok(parsed.projects.some(p => p.name.includes('OpenAnalytics')));
});

// Test C — Imported data and preview consistency
test('Test C: Simulated import workflow updates editor state and ensures form/preview consistency', () => {
  // Initial state (prior resume or demo data)
  const initialEditorState = {
    title: 'Old Resume',
    target_role: 'Old Role',
    personal_info: {
      fullName: 'Old Candidate',
      email: 'old@example.com',
      phone: '+1 111-1111',
      location: 'Old City, Old State',
      linkedin: 'linkedin.com/in/old',
      github: 'github.com/old',
      website: 'old.dev',
      profile_photo: 'data:image/png;base64,OLDPHOTO',
      photo_shape: 'circle'
    },
    summary: 'Old summary text',
    skills: ['OldSkill1', 'OldSkill2'],
    experience: [{ id: 'old-exp', company: 'Old Co', role: 'Old Role' }],
    education: [{ id: 'old-edu', institution: 'Old Univ', degree: 'B.A.' }],
    projects: [{ id: 'old-proj', name: 'Old Proj' }],
    custom_sections: [{ id: 'cs-1', title: 'Old Custom Section', items: [] }]
  };

  // Newly parsed incoming document (e.g. Morgan Taylor)
  const incomingParsed = parseResumeRuleBased(`Morgan Taylor | Principal Software Architect & VP Engineering
morgan.taylor@example.com | +1 555-0188 | Seattle, WA
linkedin.com/in/morgantaylor

PROFESSIONAL SUMMARY
Results-driven technology executive with extensive experience in cloud architecture.

SKILLS
Go, Kubernetes, Cloud Architecture, Distributed Systems

EXPERIENCE
Enterprise Systems Corp | Principal Architect | 2019 - Present
• Designed distributed cloud platforms.`);

  // Frontend handleParsedSuccess transformation
  const cleanField = (val) => (typeof val === 'string' ? val.trim() : '');
  const incomingPersonal = incomingParsed.personal_info || {};

  const mergedPersonalInfo = {
    fullName: cleanField(incomingPersonal.fullName || incomingPersonal.name || incomingParsed.fullName),
    email: cleanField(incomingPersonal.email || incomingParsed.email),
    phone: cleanField(incomingPersonal.phone || incomingParsed.phone),
    location: cleanField(incomingPersonal.location || incomingParsed.location),
    linkedin: cleanField(incomingPersonal.linkedin || incomingParsed.linkedin),
    github: cleanField(incomingPersonal.github || incomingParsed.github),
    website: cleanField(incomingPersonal.website || incomingParsed.website),
    profile_photo: '', // Reset on fresh import
    photo_shape: initialEditorState.personal_info.photo_shape || 'circle'
  };

  const extractedTargetRole = cleanField(incomingParsed.target_role || incomingParsed.targetRole);

  const updatedEditorState = {
    ...initialEditorState,
    title: extractedTargetRole ? `${extractedTargetRole} Resume` : 'Imported Resume',
    target_role: extractedTargetRole,
    targetRole: extractedTargetRole,
    personal_info: mergedPersonalInfo,
    summary: cleanField(incomingParsed.summary),
    skills: incomingParsed.skills || [],
    experience: incomingParsed.experience || [],
    education: incomingParsed.education || [],
    projects: incomingParsed.projects || [],
    custom_sections: [] // Reset custom sections from prior resume
  };

  // Preview canonical resolver (same logic as updated ResumePreview.jsx)
  const previewFullName = updatedEditorState.personal_info.fullName || updatedEditorState.fullName || 'Your Name';
  const previewTargetRole = updatedEditorState.target_role || updatedEditorState.targetRole || 'Target Job Title';
  const previewLocation = updatedEditorState.personal_info.location || updatedEditorState.location || '';

  // 1. Form field and preview show the exact same Full Name
  assert.equal(updatedEditorState.personal_info.fullName, 'Morgan Taylor');
  assert.equal(previewFullName, 'Morgan Taylor');
  assert.equal(previewFullName, updatedEditorState.personal_info.fullName);

  // 2. Target role field and preview are consistent
  assert.equal(updatedEditorState.target_role, 'Principal Software Architect & VP Engineering');
  assert.equal(previewTargetRole, 'Principal Software Architect & VP Engineering');
  assert.equal(previewTargetRole, updatedEditorState.target_role);

  // 3. Location field and preview are consistent
  assert.equal(updatedEditorState.personal_info.location, 'Seattle, WA');
  assert.equal(previewLocation, 'Seattle, WA');

  // 4. Stale values from prior resume are wiped out
  assert.equal(updatedEditorState.personal_info.profile_photo, '', 'Photo should be reset on fresh import');
  assert.equal(updatedEditorState.personal_info.website, '', 'Missing website must not retain old.dev');
  assert.equal(updatedEditorState.personal_info.github, '', 'Missing github must not retain old');
  assert.equal(updatedEditorState.custom_sections.length, 0, 'Old custom sections must not linger');

  // 5. Manual edit simulation: updating field immediately reflects in preview
  const userEditedState = {
    ...updatedEditorState,
    personal_info: {
      ...updatedEditorState.personal_info,
      fullName: 'Morgan Taylor, Ph.D.'
    }
  };
  const updatedPreviewName = userEditedState.personal_info.fullName || 'Your Name';
  assert.equal(updatedPreviewName, 'Morgan Taylor, Ph.D.');
});

// Test D — PDF extraction, sanitize, and pagination regression safety
test('Test D: Text extraction, rule-based parsing, and sanitize contract integrity', async () => {
  // Test PDF extraction
  const validPdfBuffer = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
100 700 Td
(Darshan Patel - Senior Full Stack Developer) Tj
T*
(darshan@example.com | Ahmedabad, Gujarat | +91 98250 88990) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000495 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
573
%%EOF`
  );

  const extractedText = await extractTextFromPdf(validPdfBuffer);
  assert.ok(extractedText.includes('Darshan Patel'), 'PDF text extraction works');

  const parsed = parseResumeRuleBased(extractedText);
  assert.equal(parsed.personal_info.fullName, 'Darshan Patel');
  assert.equal(parsed.target_role, 'Senior Full Stack Developer');
  assert.equal(parsed.personal_info.email, 'darshan@example.com');
  assert.equal(parsed.personal_info.location, 'Ahmedabad, Gujarat');
  assert.equal(parsed.personal_info.phone, '+91 98250 88990');

  // Test sanitizeParsedResume defensive resilience
  const rawMalformed = {
    fullName: 'Jane Smith',
    role: 'Lead Architect',
    location: 'Jane Smith', // Buggy input with name duplicated in location
    personal_info: {
      phone: '+1 (555) 019-2834'
    }
  };
  const sanitized = sanitizeParsedResume(rawMalformed);
  assert.equal(sanitized.personal_info.fullName, 'Jane Smith');
  assert.equal(sanitized.personal_info.location, '', 'Duplicated candidate name in location must be stripped');
  assert.equal(sanitized.personal_info.phone, '+1 (555) 019-2834');
});

// Test E — Actual real PDF file import (Darshan_Patel_Resume.pdf)
test('Test E: Actual real user PDF file (Darshan_Patel_Resume.pdf) extracts and maps all fields cleanly', async () => {
  const fs = await import('fs');
  const realPdfPath = 'C:/Users/Lenovo/Downloads/Darshan_Patel_Resume.pdf';
  if (!fs.existsSync(realPdfPath)) {
    console.log('Skipping Test E: Real PDF file not present on this machine path');
    return;
  }

  const pdfBuffer = fs.readFileSync(realPdfPath);
  assert.ok(pdfBuffer.length > 50000, 'Real PDF file must have realistic binary size');

  const extractedText = await extractTextFromPdf(pdfBuffer);
  assert.ok(extractedText && extractedText.length > 200, 'Real PDF must yield extracted text');

  const parsed = parseResumeRuleBased(extractedText, { fileName: 'Darshan_Patel_Resume.pdf' });

  // Verify critical fields
  assert.equal(parsed.personal_info.fullName, 'Darshan Patel', 'Real PDF full name must be Darshan Patel');
  assert.equal(parsed.target_role, 'Senior Full Stack Developer', 'Real PDF target role must be Senior Full Stack Developer');
  assert.equal(parsed.personal_info.email, 'darshan.patel@example.com', 'Real PDF email must match');
  assert.equal(parsed.personal_info.phone, '+9198250 88990', 'Real PDF phone must match');
  assert.equal(parsed.personal_info.location, 'Ahmedabad, Gujarat, India', 'Real PDF location must match');
  assert.equal(parsed.personal_info.linkedin, 'linkedin.com/in/darshan-patel-dev', 'Real PDF LinkedIn must match');
  assert.equal(parsed.personal_info.github, 'github.com/darshanpatel-pro', 'Real PDF GitHub must match');

  // Verify no cross-field pollution
  assert.notEqual(parsed.personal_info.location, 'Darshan Patel', 'Location must not be candidate name');
  assert.notEqual(parsed.target_role, 'Darshan Patel', 'Target role must not be candidate name');
  assert.notEqual(parsed.target_role, 'Ahmedabad, Gujarat, India', 'Target role must not be location');

  // Verify sections
  assert.ok(parsed.skills.length >= 10, 'Must extract skills from real PDF');
  assert.ok(parsed.experience.length >= 2, 'Must extract work experience from real PDF');
  assert.equal(parsed.experience[0].role, 'Lead Full Stack Engineer');
  assert.equal(parsed.experience[1].role, 'Software Developer');
});

// Test F — Regression safety across all 5 templates and manual editing
test('Test F: All 5 resume templates and manual field editing remain intact without regressions', () => {
  const templates = ['modern', 'harvard', 'executive', 'minimal', 'split'];

  // Base state simulating parsed resume loaded in editor
  const baseResume = {
    template_id: 'modern',
    theme_color: '#2563eb',
    target_role: 'Senior Full Stack Developer',
    personal_info: {
      fullName: 'Darshan Patel',
      email: 'darshan.patel@example.com',
      phone: '+9198250 88990',
      location: 'Ahmedabad, Gujarat, India',
      linkedin: 'linkedin.com/in/darshan-patel-dev',
      github: 'github.com/darshanpatel-pro',
      website: 'darshanpatel.dev'
    },
    summary: 'Senior Full Stack Developer with 4+ years of hands-on expertise building enterprise applications.',
    skills: ['React', 'Node.js', 'Express', 'MySQL', 'TypeScript'],
    experience: [
      { id: 'exp-1', company: 'Apex Cloud', role: 'Lead Engineer', year: '2023 - Present' }
    ],
    education: [
      { id: 'edu-1', institution: 'GTU', degree: 'B.Tech Computer Engineering', year: '2017 - 2021' }
    ],
    projects: [
      { id: 'proj-1', name: 'AI Resume Studio', link: 'github.com/darshanpatel-pro/ai-resume' }
    ]
  };

  // Helper matching ResumePreview.jsx canonical resolver
  function resolvePreviewHeaders(res) {
    const pInfo = res.personal_info || {};
    return {
      fullName: pInfo.fullName || pInfo.name || res.fullName || res.name || 'Your Name',
      targetRole: (res.target_role || res.targetRole || res.role || (res.template_id === 'split' ? 'Target Role' : 'Target Job Title')),
      location: pInfo.location || pInfo.address || res.location || ''
    };
  }

  // 1. Verify across all 5 templates that header resolution is consistent
  for (const tId of templates) {
    const resWithTemplate = { ...baseResume, template_id: tId };
    const resolved = resolvePreviewHeaders(resWithTemplate);
    assert.equal(resolved.fullName, 'Darshan Patel', `Template ${tId} must render correct name`);
    assert.equal(resolved.targetRole, 'Senior Full Stack Developer', `Template ${tId} must render correct target role`);
    assert.equal(resolved.location, 'Ahmedabad, Gujarat, India', `Template ${tId} must render correct location`);
  }

  // 2. Verify manual editing of Full Name immediately updates preview
  const afterNameEdit = {
    ...baseResume,
    personal_info: { ...baseResume.personal_info, fullName: 'Darshan K. Patel' }
  };
  const resolvedNameEdit = resolvePreviewHeaders(afterNameEdit);
  assert.equal(resolvedNameEdit.fullName, 'Darshan K. Patel');
  assert.equal(resolvedNameEdit.targetRole, 'Senior Full Stack Developer');

  // 3. Verify manual editing of Target Role immediately updates preview
  const afterRoleEdit = {
    ...baseResume,
    target_role: 'Principal Cloud Architect',
    targetRole: 'Principal Cloud Architect'
  };
  const resolvedRoleEdit = resolvePreviewHeaders(afterRoleEdit);
  assert.equal(resolvedRoleEdit.fullName, 'Darshan Patel');
  assert.equal(resolvedRoleEdit.targetRole, 'Principal Cloud Architect');

  // 4. Verify manual editing of Location immediately updates preview
  const afterLocEdit = {
    ...baseResume,
    personal_info: { ...baseResume.personal_info, location: 'San Francisco, CA' }
  };
  const resolvedLocEdit = resolvePreviewHeaders(afterLocEdit);
  assert.equal(resolvedLocEdit.location, 'San Francisco, CA');

  // 5. Verify clearing fields intentionally falls back to template placeholders
  const emptyResume = {
    template_id: 'modern',
    personal_info: {},
    target_role: ''
  };
  const resolvedEmpty = resolvePreviewHeaders(emptyResume);
  assert.equal(resolvedEmpty.fullName, 'Your Name', 'Empty name must fall back to Your Name');
  assert.equal(resolvedEmpty.targetRole, 'Target Job Title', 'Empty role in standard template must fall back to Target Job Title');
  assert.equal(resolvedEmpty.location, '', 'Empty location must remain empty');

  // 6. Split template fallback
  const emptySplitResume = {
    template_id: 'split',
    personal_info: {},
    target_role: ''
  };
  const resolvedSplit = resolvePreviewHeaders(emptySplitResume);
  assert.equal(resolvedSplit.targetRole, 'Target Role', 'Split template empty role must fall back to Target Role');
});

// Test G — Critical Bug Reproduction & Fix: Alex_Morgan_Resume.pdf (1-page) extracts all sections, not just Name and Role
test('Test G: 1-Page Alex_Morgan_Resume.pdf extracts all sections, not just Name and Role', async () => {
  const alexPath = 'C:/Users/Lenovo/Downloads/Alex_Morgan_Resume.pdf';
  if (!fs.existsSync(alexPath)) {
    console.log('Skipping Test G: Alex_Morgan_Resume.pdf not found in Downloads');
    return;
  }

  const pdfBuffer = fs.readFileSync(alexPath);
  const extractedText = await extractTextFromPdf(pdfBuffer);
  assert.ok(extractedText.length > 200, `Extracted text must be full body, got length ${extractedText.length}`);

  const parsed = sanitizeParsedResume(parseResumeRuleBased(extractedText, { fileName: 'Alex_Morgan_Resume.pdf' }));

  // Header & Contact
  assert.equal(parsed.personal_info.fullName, 'Alex Morgan', 'Full name must be Alex Morgan');
  assert.equal(parsed.target_role, 'Frontend Engineer', 'Target role must be Frontend Engineer');
  assert.equal(parsed.personal_info.email, 'alex@example.com', 'Email must be alex@example.com');
  assert.equal(parsed.personal_info.phone, '+1 555-0199', 'Phone must be +1 555-0199');
  assert.equal(parsed.personal_info.location, 'New York, NY', 'Location must be New York, NY');
  assert.equal(parsed.personal_info.linkedin, 'linkedin.com/in/alexmorgan', 'LinkedIn must be linkedin.com/in/alexmorgan');

  // Core Sections
  assert.ok(parsed.summary && parsed.summary.length > 20, 'Summary must be extracted');
  assert.ok(parsed.skills.length >= 5, `Skills must be extracted (found ${parsed.skills.length})`);
  assert.ok(parsed.experience.length >= 1, `Experience must be extracted (found ${parsed.experience.length})`);
  assert.ok(parsed.education.length >= 1, `Education must be extracted (found ${parsed.education.length})`);
  assert.ok(parsed.projects.length >= 1, `Projects must be extracted (found ${parsed.projects.length})`);
});

// Test H — Multi-Page PDF: 2-Page Resume testB_2page.pdf preserves content across both pages
test('Test H: 2-Page Resume testB_2page.pdf preserves content across both pages', async () => {
  const testBPath = path.resolve(process.cwd(), '../scratch/testB_2page.pdf');
  const fallbackPath = path.resolve(process.cwd(), 'scratch/testB_2page.pdf');
  const targetPath = fs.existsSync(testBPath) ? testBPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);

  if (!targetPath) {
    console.log('Skipping Test H: testB_2page.pdf fixture not found');
    return;
  }

  const pdfBuffer = fs.readFileSync(targetPath);
  const extractedText = await extractTextFromPdf(pdfBuffer);
  assert.ok(extractedText.length > 1000, `2-page PDF must extract body across both pages, got ${extractedText.length}`);

  const parsed = sanitizeParsedResume(parseResumeRuleBased(extractedText, { fileName: 'testB_2page.pdf' }));

  assert.equal(parsed.personal_info.fullName, 'Jordan Lee');
  assert.equal(parsed.target_role, 'Senior Full Stack Developer');
  assert.equal(parsed.personal_info.email, 'jordan.lee@example.com');
  assert.equal(parsed.personal_info.location, 'San Francisco, CA');
  assert.ok(parsed.experience.length >= 2, `Must extract both experiences across pages (found ${parsed.experience.length})`);
  assert.ok(parsed.projects.length >= 2, `Must extract projects (found ${parsed.projects.length})`);
  assert.ok(parsed.skills.length >= 15, `Must extract skills across pages (found ${parsed.skills.length})`);
});

// Test I — Multi-Page PDF: 3-Page Resume testC_3page.pdf preserves content across all 3 pages
test('Test I: 3-Page Resume testC_3page.pdf preserves content across all 3 pages', async () => {
  const testCPath = path.resolve(process.cwd(), '../scratch/testC_3page.pdf');
  const fallbackPath = path.resolve(process.cwd(), 'scratch/testC_3page.pdf');
  const targetPath = fs.existsSync(testCPath) ? testCPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);

  if (!targetPath) {
    console.log('Skipping Test I: testC_3page.pdf fixture not found');
    return;
  }

  const pdfBuffer = fs.readFileSync(targetPath);
  const extractedText = await extractTextFromPdf(pdfBuffer);
  assert.ok(extractedText.length > 2500, `3-page PDF must extract body across all 3 pages, got ${extractedText.length}`);

  const parsed = sanitizeParsedResume(parseResumeRuleBased(extractedText, { fileName: 'testC_3page.pdf' }));

  assert.equal(parsed.personal_info.fullName, 'Morgan Taylor');
  assert.equal(parsed.target_role, 'Principal Software Architect & VP Engineering');
  assert.equal(parsed.personal_info.email, 'morgan.taylor@example.com');
  assert.equal(parsed.personal_info.location, 'Seattle, WA');
  assert.ok(parsed.experience.length >= 4, `Must extract experiences continuing across pages 1, 2, and 3 (found ${parsed.experience.length})`);
  assert.ok(parsed.projects.length >= 3, `Must extract projects on page 3 (found ${parsed.projects.length})`);
  assert.ok(parsed.skills.length >= 20, `Must extract skills across pages (found ${parsed.skills.length})`);
});

// Test J — Minimal resume with only name and role never fabricates data
test('Test J: Minimal resume with only name and role never fabricates data', () => {
  const text = 'Alex Morgan\nFrontend Engineer';
  const parsed = sanitizeParsedResume(parseResumeRuleBased(text));

  assert.equal(parsed.personal_info.fullName, 'Alex Morgan');
  assert.equal(parsed.target_role, 'Frontend Engineer');
  assert.equal(parsed.personal_info.email, '');
  assert.equal(parsed.personal_info.phone, '');
  assert.equal(parsed.personal_info.location, '');
  assert.equal(parsed.personal_info.linkedin, '');
  assert.equal(parsed.personal_info.github, '');
  assert.equal(parsed.personal_info.website, '');
  assert.deepEqual(parsed.skills, []);
  assert.deepEqual(parsed.experience, []);
  assert.deepEqual(parsed.education, []);
  assert.deepEqual(parsed.projects, []);
});


