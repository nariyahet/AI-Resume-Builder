import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeRuleBased, sanitizeParsedResume } from '../controllers/aiController.js';

test('Issue 1: Parser does not invent profile links when absent from input', () => {
  const resumeWithoutLinks = `
John Doe
Software Engineer
john.doe@example.com
(555) 123-4567
New York, NY

Summary
Experienced software developer specializing in React and Node.js.

Skills
JavaScript, React, Node.js, Express, MySQL

Experience
Senior Developer | Acme Corp | 2021 - Present
- Built web applications and microservices using node.js and deployed to vercel.app

Education
B.S. Computer Science | State University | 2017 - 2021
`;

  const parsed = parseResumeRuleBased(resumeWithoutLinks);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.personal_info.linkedin, '', 'LinkedIn should be empty');
  assert.equal(sanitized.personal_info.github, '', 'GitHub should be empty');
  assert.equal(sanitized.personal_info.website, '', 'Website should be empty (not vercel.app or node.js)');
  assert.equal(sanitized.personal_info.fullName, 'John Doe');
  assert.equal(sanitized.personal_info.email, 'john.doe@example.com');
});

test('Issue 1: Placeholder links like N/A, none, or invalid domains are sanitized away', () => {
  const input = {
    personal_info: {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '123-456-7890',
      location: 'San Francisco, CA',
      linkedin: 'N/A',
      github: 'None',
      website: 'jane@example.com'
    }
  };

  const sanitized = sanitizeParsedResume(input);
  assert.equal(sanitized.personal_info.linkedin, '');
  assert.equal(sanitized.personal_info.github, '');
  assert.equal(sanitized.personal_info.website, '');
});

test('Issue 1: Legitimate profile links in header are preserved', () => {
  const resumeWithLinks = `
Jane Doe
jane.doe@example.com
(555) 987-6543
linkedin.com/in/janedoe
github.com/janedoe
janedoe.dev

Summary
Full stack developer
`;

  const parsed = parseResumeRuleBased(resumeWithLinks);
  const sanitized = sanitizeParsedResume(parsed);

  assert.ok(sanitized.personal_info.linkedin.includes('janedoe'), 'LinkedIn should be captured');
  assert.ok(sanitized.personal_info.github.includes('janedoe'), 'GitHub should be captured');
  assert.equal(sanitized.personal_info.website, 'janedoe.dev', 'Personal portfolio should be captured');
});

test('Issues 2 & 3: Experience boundary detection separates multiple jobs and preserves correct dates', () => {
  const multiJobText = `
John Doe
john@example.com

Experience
Senior Software Engineer
Acme Corp
Jan 2022 - Present
• Architected scalable microservices
• Mentored junior engineers

Software Developer
Beta Tech
Jun 2019 - Dec 2021
• Built RESTful APIs with Node.js
• Reduced query latency by 25%
`;

  const parsed = parseResumeRuleBased(multiJobText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.experience.length, 2, 'Should detect exactly 2 distinct jobs');
  
  // Job 1 assertions
  assert.equal(sanitized.experience[0].role, 'Senior Software Engineer');
  assert.equal(sanitized.experience[0].company, 'Acme Corp');
  assert.ok(sanitized.experience[0].startDate.includes('Jan 2022') || sanitized.experience[0].year.includes('Jan 2022'), 'Job 1 dates must match 2022 - Present');
  assert.ok(sanitized.experience[0].description.includes('microservices'), 'Job 1 must have microservices bullet');
  assert.ok(!sanitized.experience[0].description.includes('Beta Tech'), 'Job 1 must not swallow Job 2 company');

  // Job 2 assertions
  assert.equal(sanitized.experience[1].role, 'Software Developer');
  assert.equal(sanitized.experience[1].company, 'Beta Tech');
  assert.ok(sanitized.experience[1].startDate.includes('Jun 2019') || sanitized.experience[1].year.includes('Jun 2019'), 'Job 2 dates must match 2019 - 2021');
  assert.ok(sanitized.experience[1].description.includes('RESTful APIs'), 'Job 2 must have RESTful APIs bullet');
});

test('Issue 4: Distinct projects are separated without merging into one description', () => {
  const projectsText = `
John Doe
john@example.com

Projects
E-Commerce Checkout Engine
React, Node.js, Stripe
• Built full checkout pipeline handling 500+ daily orders.
• Integrated Stripe webhooks with idempotent event processing.

AI Document Search
Python, FastAPI, Pinecone
• Implemented vector similarity search over 50,000 PDFs.
• Created hybrid BM25 and dense retrieval engine.
`;

  const parsed = parseResumeRuleBased(projectsText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.projects.length, 2, 'Should detect exactly 2 distinct projects');
  assert.equal(sanitized.projects[0].name, 'E-Commerce Checkout Engine');
  assert.ok(sanitized.projects[0].description.includes('Stripe'), 'Project 1 description should contain Stripe');
  assert.ok(!sanitized.projects[0].description.includes('AI Document Search'), 'Project 1 must not swallow Project 2 name');

  assert.equal(sanitized.projects[1].name, 'AI Document Search');
  assert.ok(sanitized.projects[1].description.includes('Pinecone'), 'Project 2 description should contain Pinecone');
});

test('Issue 5: Education institution and degree mapping handles comma and multi-line without inverting', () => {
  const eduText = `
Jane Doe
jane@example.com

Education
Stanford University, B.S. in Computer Science
2018 - 2022

IIT Bombay
Bachelor of Technology in Electrical Engineering
2014 - 2018
`;

  const parsed = parseResumeRuleBased(eduText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.education.length, 2, 'Should detect 2 education entries');

  // Entry 1: Comma delimited "Stanford University, B.S. in Computer Science"
  assert.equal(sanitized.education[0].institution, 'Stanford University', 'Institution should be Stanford University');
  assert.equal(sanitized.education[0].degree, 'B.S. in Computer Science', 'Degree should be B.S. in Computer Science');
  assert.ok(sanitized.education[0].year.includes('2018') || sanitized.education[0].year.includes('2022'), 'Year should match');

  // Entry 2: Multi-line where institution has no standard keyword
  assert.equal(sanitized.education[1].institution, 'IIT Bombay', 'Institution should be IIT Bombay');
  assert.equal(sanitized.education[1].degree, 'Bachelor of Technology in Electrical Engineering', 'Degree should be Bachelor of Technology...');
  assert.ok(sanitized.education[1].year.includes('2014') || sanitized.education[1].year.includes('2018'), 'Year should match');
});
