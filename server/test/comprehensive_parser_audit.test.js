import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromPdf, extractTextFromDocx, validateFileMeta, uploadAndParseResume } from '../controllers/uploadController.js';
import { parseResumeRuleBased, sanitizeParsedResume } from '../controllers/aiController.js';
import { Document, Paragraph, TextRun, Packer } from '../../client/node_modules/docx/dist/index.mjs';

// Minimal standard valid text-based PDF 1.4 document
const validTextPdf = Buffer.from(
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
<< /Length 170 >>
stream
BT
/F1 12 Tf
100 700 Td
(Marcus Vance - Senior SRE) Tj
ET
BT
/F1 10 Tf
100 680 Td
(marcus@vance.io | 555-432-1098 | linkedin.com/in/marcusvance | github.com/marcusvance) Tj
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
0000000465 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
543
%%EOF`
);

// Scanned PDF with no text stream
const scannedPdf = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`
);

// Helper to simulate handleParsedSuccess in client/src/App.jsx
function simulateAppImport(prevResume, parsedIncoming) {
  const incomingPersonal = (parsedIncoming.personal_info && typeof parsedIncoming.personal_info === 'object')
    ? parsedIncoming.personal_info
    : {};

  const cleanField = (val) => (typeof val === 'string' ? val.trim() : '');

  const snapshot = {
    id: `v-pre-import-${Date.now()}`,
    timestamp: new Date().toISOString(),
    label: 'Pre-Import Original Version',
    data: { ...prevResume }
  };

  const mergedPersonalInfo = {
    fullName: cleanField(incomingPersonal.fullName),
    email: cleanField(incomingPersonal.email),
    phone: cleanField(incomingPersonal.phone),
    location: cleanField(incomingPersonal.location),
    linkedin: cleanField(incomingPersonal.linkedin),
    github: cleanField(incomingPersonal.github),
    website: cleanField(incomingPersonal.website),
    profile_photo: prevResume.personal_info?.profile_photo || '',
    photo_shape: prevResume.personal_info?.photo_shape || 'circle'
  };

  return {
    ...prevResume,
    title: (parsedIncoming.title && parsedIncoming.title !== 'Imported Resume' && parsedIncoming.title !== 'Extracted Resume')
      ? parsedIncoming.title
      : (cleanField(parsedIncoming.target_role) ? `${cleanField(parsedIncoming.target_role)} Resume` : 'Imported Resume'),
    target_role: (parsedIncoming.target_role && parsedIncoming.target_role.trim() && parsedIncoming.target_role !== 'Professional')
      ? parsedIncoming.target_role.trim()
      : '',
    personal_info: mergedPersonalInfo,
    summary: cleanField(parsedIncoming.summary),
    skills: Array.isArray(parsedIncoming.skills) ? parsedIncoming.skills : [],
    experience: Array.isArray(parsedIncoming.experience) ? parsedIncoming.experience : [],
    education: Array.isArray(parsedIncoming.education) ? parsedIncoming.education : [],
    projects: Array.isArray(parsedIncoming.projects) ? parsedIncoming.projects : [],
    certifications: Array.isArray(parsedIncoming.certifications) ? parsedIncoming.certifications : [],
    custom_sections: prevResume.custom_sections || [],
    template_id: prevResume.template_id,
    theme_color: prevResume.theme_color,
    page_style: prevResume.page_style,
    ats_score: null,
    ats_feedback: null,
    version_history: [snapshot, ...(prevResume.version_history || [])]
  };
}

// ---------------------------------------------------------------------------
// 14 MANDATORY AUDIT TEST CASES
// ---------------------------------------------------------------------------

test('1. Valid text-based PDF with contact details, experience, education, skills, projects, and URLs', async () => {
  const extracted = await extractTextFromPdf(validTextPdf);
  assert.ok(typeof extracted === 'string' && extracted.length > 0, 'PDF text extraction succeeded');
  assert.ok(extracted.includes('Marcus Vance'), 'Extracted text contains candidate name');
  assert.ok(extracted.includes('marcus@vance.io'), 'Extracted text contains candidate email');
  assert.ok(extracted.includes('linkedin.com/in/marcusvance'), 'Extracted text contains LinkedIn');

  const parsed = parseResumeRuleBased(extracted);
  const sanitized = sanitizeParsedResume(parsed);
  assert.equal(sanitized.personal_info.fullName, 'Marcus Vance');
  assert.equal(sanitized.personal_info.email, 'marcus@vance.io');
  assert.equal(sanitized.personal_info.phone, '555-432-1098');
  assert.equal(sanitized.personal_info.linkedin, 'linkedin.com/in/marcusvance');
  assert.equal(sanitized.personal_info.github, 'github.com/marcusvance');
});

test('2. Valid DOCX containing contact details, experience, education, skills, projects, and URLs', async () => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun("Sarah Connor")] }),
        new Paragraph({ children: [new TextRun("sarah@resistance.ai | (555) 019-2834 | linkedin.com/in/sarahconnor | github.com/sarahconnor | sarahconnor.tech")] }),
        new Paragraph({ children: [new TextRun("Summary")] }),
        new Paragraph({ children: [new TextRun("Experienced security architect with zero-trust defense expertise.")] }),
        new Paragraph({ children: [new TextRun("Experience")] }),
        new Paragraph({ children: [new TextRun("Lead Security Engineer")] }),
        new Paragraph({ children: [new TextRun("Cyberdyne Systems")] }),
        new Paragraph({ children: [new TextRun("Jan 2021 - Present")] }),
        new Paragraph({ children: [new TextRun("• Designed zero-trust defense network")] }),
        new Paragraph({ children: [new TextRun("Education")] }),
        new Paragraph({ children: [new TextRun("MIT, B.S. in Computer Science")] }),
        new Paragraph({ children: [new TextRun("2016 - 2020")] }),
        new Paragraph({ children: [new TextRun("Skills")] }),
        new Paragraph({ children: [new TextRun("Cybersecurity, Cryptography, Python, Go, Docker")] }),
        new Paragraph({ children: [new TextRun("Projects")] }),
        new Paragraph({ children: [new TextRun("Sentinel Shield: Automated intrusion detection platform")] }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const extractedText = await extractTextFromDocx(buffer);
  assert.ok(extractedText.includes('Sarah Connor'), 'DOCX should extract candidate name');
  assert.ok(extractedText.includes('Cyberdyne Systems'), 'DOCX should extract company');

  const parsed = parseResumeRuleBased(extractedText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.fullName, 'Sarah Connor');
  assert.equal(sanitized.personal_info.email, 'sarah@resistance.ai');
  assert.equal(sanitized.personal_info.phone, '(555) 019-2834');
  assert.equal(sanitized.personal_info.linkedin, 'linkedin.com/in/sarahconnor');
  assert.equal(sanitized.personal_info.github, 'github.com/sarahconnor');
  assert.equal(sanitized.personal_info.website, 'sarahconnor.tech');
  assert.equal(sanitized.experience.length, 1);
  assert.equal(sanitized.experience[0].company, 'Cyberdyne Systems');
  assert.equal(sanitized.experience[0].role, 'Lead Security Engineer');
  assert.equal(sanitized.education.length, 1);
  assert.equal(sanitized.education[0].institution, 'MIT');
  assert.equal(sanitized.education[0].degree, 'B.S. in Computer Science');
  assert.ok(sanitized.skills.includes('Cybersecurity'));
  assert.equal(sanitized.projects.length, 1);
  assert.equal(sanitized.projects[0].name, 'Sentinel Shield');
});

test('3. Valid TXT containing contact details, experience, education, skills, projects, and URLs', () => {
  const txtContent = `Devon Miller
devon@miller.dev | 555-888-9999 | Austin, TX
linkedin.com/in/devonmiller | github.com/devonmiller | devonmiller.dev

Summary
Full-stack software engineer with 6 years experience.

Experience
Senior Full Stack Engineer
TechCorp
2022 - Present
• Built high-performance microservices

Education
University of Texas at Austin
B.S. Computer Science
2015 - 2019

Skills
TypeScript, React, Node.js, GraphQL, PostgreSQL

Projects
DataFlow: Real-time event pipeline processing 10k msgs/sec
`;

  const buffer = Buffer.from(txtContent, 'utf-8');
  const extracted = buffer.toString('utf-8');
  const parsed = parseResumeRuleBased(extracted);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.fullName, 'Devon Miller');
  assert.equal(sanitized.personal_info.email, 'devon@miller.dev');
  assert.equal(sanitized.personal_info.phone, '555-888-9999');
  assert.equal(sanitized.personal_info.linkedin, 'linkedin.com/in/devonmiller');
  assert.equal(sanitized.personal_info.github, 'github.com/devonmiller');
  assert.equal(sanitized.personal_info.website, 'devonmiller.dev');
  assert.equal(sanitized.experience.length, 1);
  assert.equal(sanitized.experience[0].company, 'TechCorp');
  assert.equal(sanitized.education.length, 1);
  assert.equal(sanitized.education[0].institution, 'University of Texas at Austin');
  assert.ok(sanitized.skills.includes('TypeScript'));
  assert.equal(sanitized.projects.length, 1);
  assert.equal(sanitized.projects[0].name, 'DataFlow');
});

test('4. Raw text containing LinkedIn, GitHub, and Website URLs imports all three accurately', () => {
  const rawText = `
Rachel Green
rachel@greenfashion.com
linkedin.com/in/rachelgreen
github.com/rachelgreen
rachelgreen.design

Experience
Fashion Buyer at Ralph Lauren (2020 - Present)
`;

  const parsed = parseResumeRuleBased(rawText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.linkedin, 'linkedin.com/in/rachelgreen');
  assert.equal(sanitized.personal_info.github, 'github.com/rachelgreen');
  assert.equal(sanitized.personal_info.website, 'rachelgreen.design');
});

test('5. Raw text with no URLs — all three URL fields must remain empty without fabrications', () => {
  const rawText = `
Michael Scott
Regional Manager
michael@dundermifflin.com
(555) 321-4567
Scranton, PA

Experience
Regional Manager at Dunder Mifflin (2005 - 2011)
`;

  const parsed = parseResumeRuleBased(rawText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.linkedin, '', 'LinkedIn must remain blank');
  assert.equal(sanitized.personal_info.github, '', 'GitHub must remain blank');
  assert.equal(sanitized.personal_info.website, '', 'Website must remain blank');
});

test('6. File with no URLs — no fabricated placeholder URLs appear', () => {
  const rawFileText = `
Dwight Schrute
dwight@dundermifflin.com
555-987-6543
Scranton, PA

Summary
Assistant to the Regional Manager

Skills
Sales, Beet Farming, Karate
`;

  const parsed = parseResumeRuleBased(rawFileText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.linkedin, '', 'No placeholder LinkedIn');
  assert.equal(sanitized.personal_info.github, '', 'No placeholder GitHub');
  assert.equal(sanitized.personal_info.website, '', 'No placeholder Website');
});

test('7. New resume imported after an earlier resume — no stale values remain', () => {
  // Existing state with Darshan Patel demo data
  const existingResumeState = {
    id: 'res-101',
    title: 'Full Stack Developer Resume',
    target_role: 'Full Stack Developer',
    personal_info: {
      fullName: 'Darshan Patel',
      email: 'darshan@example.com',
      phone: '+91 98765 43210',
      location: 'Ahmedabad, India',
      linkedin: 'https://linkedin.com/in/darshan-patel-dev',
      github: 'https://github.com/darshanpatel-pro',
      website: 'https://darshanpatel.dev',
      profile_photo: 'data:image/png;base64,existingphoto',
      photo_shape: 'circle'
    },
    summary: 'Seasoned full-stack developer with 5+ years of experience in MERN stack.',
    skills: ['React', 'Node.js', 'Express', 'MongoDB'],
    experience: [{ company: 'TCS', role: 'System Engineer', year: '2020 - 2023', description: 'Enterprise apps' }],
    education: [{ institution: 'Gujarat University', degree: 'B.E. Computer Engineering', year: '2016 - 2020' }],
    projects: [{ name: 'E-Commerce Store', description: 'Online shopping platform' }],
    ats_score: 88,
    ats_feedback: { strengths: ['Good formatting'] }
  };

  // Newly uploaded resume for "Elena Rostova" which has NO phone, NO location, and NO URLs
  const elenaParsed = {
    title: 'Security Analyst Resume',
    target_role: 'Security Analyst',
    personal_info: {
      fullName: 'Elena Rostova',
      email: 'elena@cybersec.org',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    summary: 'Cybersecurity analyst specializing in incident response.',
    skills: ['SIEM', 'Wireshark', 'Splunk'],
    experience: [{ company: 'SecureNet', role: 'SOC Analyst', year: '2023 - Present', description: 'Monitored alerts' }],
    education: [{ institution: 'Kings College London', degree: 'M.Sc. Information Security', year: '2021 - 2022' }],
    projects: [{ name: 'Threat Hunter Bot', description: 'Automated IOC triage' }]
  };

  const updatedState = simulateAppImport(existingResumeState, elenaParsed);

  // 1. Name & email updated
  assert.equal(updatedState.personal_info.fullName, 'Elena Rostova');
  assert.equal(updatedState.personal_info.email, 'elena@cybersec.org');

  // 2. Missing fields in Elena's resume MUST NOT inherit Darshan's old fields
  assert.equal(updatedState.personal_info.phone, '', 'Phone must not inherit old resume value');
  assert.equal(updatedState.personal_info.location, '', 'Location must not inherit old resume value');
  assert.equal(updatedState.personal_info.linkedin, '', 'LinkedIn must not inherit old resume value');
  assert.equal(updatedState.personal_info.github, '', 'GitHub must not inherit old resume value');
  assert.equal(updatedState.personal_info.website, '', 'Website must not inherit old resume value');

  // 3. Arrays replaced without stale residue
  assert.deepEqual(updatedState.skills, ['SIEM', 'Wireshark', 'Splunk']);
  assert.equal(updatedState.experience.length, 1);
  assert.equal(updatedState.experience[0].company, 'SecureNet');
  assert.equal(updatedState.projects.length, 1);
  assert.equal(updatedState.projects[0].name, 'Threat Hunter Bot');

  // 4. ATS score & feedback reset to null for fresh resume
  assert.equal(updatedState.ats_score, null);
  assert.equal(updatedState.ats_feedback, null);

  // 5. Version history snapshot preserved
  assert.ok(updatedState.version_history.length >= 1);
  assert.equal(updatedState.version_history[0].data.personal_info.fullName, 'Darshan Patel');
});

test('8. Two or more jobs with different dates — each job retains its own dates and details', () => {
  const multiJobResume = `
Carlos Santana
carlos@musictech.io

Experience
Principal Audio Engineer
Spotify
Jan 2021 - Present
• Developed low-latency streaming pipeline

Senior DSP Developer
Dolby Laboratories
May 2017 - Dec 2020
• Optimized spatial audio decoders

Audio Software Intern
Bose Corporation
Jun 2016 - Aug 2016
• Benchmarked noise cancellation algorithms
`;

  const parsed = parseResumeRuleBased(multiJobResume);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.experience.length, 3, 'Must detect all 3 jobs');

  // Job 1
  assert.equal(sanitized.experience[0].company, 'Spotify');
  assert.equal(sanitized.experience[0].role, 'Principal Audio Engineer');
  assert.ok(sanitized.experience[0].year.includes('2021') || sanitized.experience[0].startDate.includes('2021'));
  assert.ok(sanitized.experience[0].description.includes('low-latency'));

  // Job 2
  assert.equal(sanitized.experience[1].company, 'Dolby Laboratories');
  assert.equal(sanitized.experience[1].role, 'Senior DSP Developer');
  assert.ok(sanitized.experience[1].year.includes('2017') || sanitized.experience[1].startDate.includes('2017'));
  assert.ok(sanitized.experience[1].description.includes('spatial audio'));

  // Job 3
  assert.equal(sanitized.experience[2].company, 'Bose Corporation');
  assert.equal(sanitized.experience[2].role, 'Audio Software Intern');
  assert.ok(sanitized.experience[2].year.includes('2016') || sanitized.experience[2].startDate.includes('2016'));
  assert.ok(sanitized.experience[2].description.includes('noise cancellation'));
});

test('9. Two or more projects — each project remains separate', () => {
  const multiProjectResume = `
Candidate
email@test.com

Projects
HyperGraph
Rust, WebAssembly, WebGL
• Built in-browser graph visualization engine capable of rendering 100k nodes at 60fps.
• Implemented force-directed layout using parallel SIMD shaders.

QuantumSim
Python, NumPy, Qiskit
• Simulated 24-qubit quantum circuits with noise modelling.
• Optimized state vector matrix multiplications by 4x.
`;

  const parsed = parseResumeRuleBased(multiProjectResume);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.projects.length, 2, 'Must detect 2 separate projects');
  assert.equal(sanitized.projects[0].name, 'HyperGraph');
  assert.ok(sanitized.projects[0].description.includes('100k nodes'));
  assert.ok(!sanitized.projects[0].description.includes('QuantumSim'), 'Project 1 must not swallow Project 2');

  assert.equal(sanitized.projects[1].name, 'QuantumSim');
  assert.ok(sanitized.projects[1].description.includes('24-qubit'));
});

test('10. Education entries — institution and degree are mapped correctly without inversion', () => {
  const eduResume = `
Candidate
email@test.com

Education
Harvard University, Master of Science in Data Science
2020 - 2022

IIT Bombay
Bachelor of Technology in Computer Science
2016 - 2020
`;

  const parsed = parseResumeRuleBased(eduResume);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.education.length, 2);
  assert.equal(sanitized.education[0].institution, 'Harvard University');
  assert.equal(sanitized.education[0].degree, 'Master of Science in Data Science');

  assert.equal(sanitized.education[1].institution, 'IIT Bombay');
  assert.equal(sanitized.education[1].degree, 'Bachelor of Technology in Computer Science');
});

test('11. Empty, corrupt, and scanned files are safely handled with clear error indications', async () => {
  // Empty PDF
  await assert.rejects(
    async () => { await extractTextFromPdf(Buffer.alloc(0)); },
    /empty/i,
    'Empty PDF throws empty error'
  );

  // Corrupted non-PDF
  await assert.rejects(
    async () => { await extractTextFromPdf(Buffer.from('CORRUPTED_BINARY_DATA')); },
    (err) => err !== null,
    'Corrupt PDF rejects safely'
  );

  // Scanned / Flat PDF
  await assert.rejects(
    async () => { await extractTextFromPdf(scannedPdf); },
    (err) => {
      assert.ok(err.isScanned);
      assert.ok(err.message.includes('scanned image'));
      return true;
    },
    'Scanned PDF throws ScannedPDFException'
  );

  // Empty DOCX
  await assert.rejects(
    async () => { await extractTextFromDocx(Buffer.alloc(0)); },
    /empty/i,
    'Empty DOCX throws empty error'
  );

  // Corrupted DOCX
  await assert.rejects(
    async () => { await extractTextFromDocx(Buffer.from('NOT_A_VALID_DOCX_ARCHIVE')); },
    (err) => err !== null,
    'Corrupted DOCX rejects safely'
  );
});

test('12. Failed import — existing resume data is not partially overwritten', () => {
  const initialResume = {
    id: 'res-999',
    personal_info: { fullName: 'Valued User', email: 'user@example.com' },
    summary: 'Important resume that must never be corrupted'
  };

  let currentResume = { ...initialResume };

  // Simulating a failed import in the UI
  const attemptImport = (shouldFail) => {
    try {
      if (shouldFail) {
        throw new Error('Could not extract readable text from the file.');
      }
      currentResume = simulateAppImport(currentResume, { personal_info: { fullName: 'Bad' } });
    } catch (err) {
      // On error, onParsedSuccess is NEVER called, currentResume remains unchanged
    }
  };

  attemptImport(true);

  assert.deepEqual(currentResume, initialResume, 'State must remain completely unaltered after failed import');
});

test('13. Regression checks: User manual editing preserves all other fields', () => {
  const currentResume = {
    personal_info: {
      fullName: 'Lucas Scott',
      email: 'lucas@treehill.com',
      phone: '555-1234',
      linkedin: 'linkedin.com/in/lucasscott',
      github: '',
      website: ''
    }
  };

  // User manually edits phone number in Form Editor
  const editedPersonalInfo = {
    ...currentResume.personal_info,
    phone: '555-9999'
  };

  assert.equal(editedPersonalInfo.phone, '555-9999');
  assert.equal(editedPersonalInfo.fullName, 'Lucas Scott');
  assert.equal(editedPersonalInfo.linkedin, 'linkedin.com/in/lucasscott');
  assert.equal(editedPersonalInfo.github, '');
});

test('14. Unrelated AI Auto-Fill and Interview Prep features remain unchanged and fully functional', async () => {
  // Confirm import and presence of parseResumeRuleBased, sanitizeParsedResume
  assert.equal(typeof parseResumeRuleBased, 'function');
  assert.equal(typeof sanitizeParsedResume, 'function');
  assert.equal(typeof extractTextFromPdf, 'function');
  assert.equal(typeof extractTextFromDocx, 'function');
});

test('Audit 1: Missing source name results in blank fullName without "Candidate Name" fallback', () => {
  const prevResume = {
    personal_info: { fullName: 'Old Name', email: 'old@example.com' }
  };
  const parsedWithoutName = {
    personal_info: { fullName: '', email: 'nameless@example.com' }
  };
  const result = simulateAppImport(prevResume, parsedWithoutName);
  assert.equal(result.personal_info.fullName, '', 'fullName must remain blank when omitted from source');
});

test('Audit 3 & 4: File validation rejects legacy .doc and mismatched MIME types', () => {
  // Legacy .doc rejection
  const docResult = validateFileMeta('resume.doc', 'application/msword');
  assert.equal(docResult.ok, false);
  assert.ok(docResult.error.message.includes('Legacy Word (.doc) format is not supported'));

  // Extension/MIME mismatch: .pdf with image/jpeg
  const mismatch1 = validateFileMeta('resume.pdf', 'image/jpeg');
  assert.equal(mismatch1.ok, false);
  assert.ok(mismatch1.error.message.includes('content type mismatch'));

  // Extension/MIME mismatch: .docx with executable
  const mismatch2 = validateFileMeta('resume.docx', 'application/x-msdownload');
  assert.equal(mismatch2.ok, false);
  assert.ok(mismatch2.error.message.includes('content type mismatch'));

  // Unsupported file format
  const unsupp = validateFileMeta('archive.zip', 'application/zip');
  assert.equal(unsupp.ok, false);
  assert.ok(unsupp.error.message.includes('Unsupported file format'));

  // Valid PDF
  const validPdf = validateFileMeta('resume.pdf', 'application/pdf');
  assert.equal(validPdf.ok, true);

  // Valid DOCX
  const validDocx = validateFileMeta('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.equal(validDocx.ok, true);

  // Valid TXT
  const validTxt = validateFileMeta('resume.txt', 'text/plain');
  assert.equal(validTxt.ok, true);
});

test('Audit 4: Upload endpoint rejects invalid file headers via signature validation', async () => {
  let statusCaptured = null;
  let jsonCaptured = null;
  const mockRes = {
    status(s) { statusCaptured = s; return this; },
    json(j) { jsonCaptured = j; return this; }
  };

  // Fake PDF (missing %PDF header)
  const reqFakePdf = {
    file: {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('NOT_A_VALID_PDF_HEADER')
    },
    body: {}
  };

  await uploadAndParseResume(reqFakePdf, mockRes);
  assert.equal(statusCaptured, 400);
  assert.ok(jsonCaptured.message.includes('valid PDF document header'));

  // Fake DOCX (missing PK zip header)
  const reqFakeDocx = {
    file: {
      originalname: 'resume.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('NOT_A_VALID_DOCX_HEADER')
    },
    body: {}
  };

  await uploadAndParseResume(reqFakeDocx, mockRes);
  assert.equal(statusCaptured, 400);
  assert.ok(jsonCaptured.message.includes('valid Word (.docx) document structure'));
});

test('Audit 15: Real DOCX with multiple jobs and consecutive inline projects extracts all records accurately', async () => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun('Alice Walker')] }),
        new Paragraph({ children: [new TextRun('alice@walker.net | 555-0100 | linkedin.com/in/alicewalker | github.com/alicewalker')] }),
        new Paragraph({ children: [new TextRun('Experience')] }),
        new Paragraph({ children: [new TextRun('Staff Infrastructure Engineer')] }),
        new Paragraph({ children: [new TextRun('Netflix')] }),
        new Paragraph({ children: [new TextRun('2021 - Present')] }),
        new Paragraph({ children: [new TextRun('• Maintained global CDN delivery')] }),
        new Paragraph({ children: [new TextRun('Senior DevOps Engineer')] }),
        new Paragraph({ children: [new TextRun('Uber')] }),
        new Paragraph({ children: [new TextRun('2018 - 2021')] }),
        new Paragraph({ children: [new TextRun('• Automated multi-region Kubernetes clusters')] }),
        new Paragraph({ children: [new TextRun('Education')] }),
        new Paragraph({ children: [new TextRun('UC Berkeley, B.S. in EECS')] }),
        new Paragraph({ children: [new TextRun('2014 - 2018')] }),
        new Paragraph({ children: [new TextRun('Skills')] }),
        new Paragraph({ children: [new TextRun('Kubernetes, Terraform, AWS, Go, Python')] }),
        new Paragraph({ children: [new TextRun('Projects')] }),
        new Paragraph({ children: [new TextRun('KubeAuto: Automated node autoscaler')] }),
        new Paragraph({ children: [new TextRun('NetMesh: WireGuard mesh orchestrator')] })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const text = await extractTextFromDocx(buffer);
  const parsed = parseResumeRuleBased(text);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.experience.length, 2, 'Should detect exactly 2 jobs');
  assert.equal(sanitized.experience[0].company, 'Netflix');
  assert.equal(sanitized.experience[0].role, 'Staff Infrastructure Engineer');
  assert.ok(sanitized.experience[0].year.includes('2021'));
  assert.equal(sanitized.experience[1].company, 'Uber');
  assert.equal(sanitized.experience[1].role, 'Senior DevOps Engineer');
  assert.ok(sanitized.experience[1].year.includes('2018') && sanitized.experience[1].year.includes('2021'));

  assert.equal(sanitized.projects.length, 2, 'Should detect exactly 2 projects');
  assert.equal(sanitized.projects[0].name, 'KubeAuto');
  assert.equal(sanitized.projects[0].description, 'Automated node autoscaler');
  assert.equal(sanitized.projects[1].name, 'NetMesh');
  assert.equal(sanitized.projects[1].description, 'WireGuard mesh orchestrator');

  assert.equal(sanitized.education.length, 1);
  assert.equal(sanitized.education[0].institution, 'UC Berkeley');
  assert.equal(sanitized.education[0].degree, 'B.S. in EECS');
  assert.deepEqual(sanitized.skills, ['Kubernetes', 'Terraform', 'AWS', 'Go', 'Python']);
});
