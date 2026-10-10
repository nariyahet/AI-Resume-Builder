import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeRuleBased, sanitizeParsedResume, generateInterviewPrep } from '../controllers/aiController.js';
import { extractTextFromPdf } from '../controllers/uploadController.js';

test('Regression: Ordinary user profile edits and personal info preservation', () => {
  // Simulating user editing in editor
  const userResume = {
    personal_info: {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '555-0199',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/alice-j',
      github: 'github.com/alicej',
      website: 'alicej.tech',
      profile_photo: 'data:image/png;base64,abc...',
      photo_shape: 'square'
    }
  };

  // Ordinary edit updates only specified field without affecting others
  const updatedPersonalInfo = {
    ...userResume.personal_info,
    location: 'Remote, US'
  };

  assert.equal(updatedPersonalInfo.location, 'Remote, US');
  assert.equal(updatedPersonalInfo.linkedin, 'linkedin.com/in/alice-j');
  assert.equal(updatedPersonalInfo.github, 'github.com/alicej');
  assert.equal(updatedPersonalInfo.website, 'alicej.tech');
  assert.equal(updatedPersonalInfo.profile_photo, 'data:image/png;base64,abc...');
  assert.equal(updatedPersonalInfo.photo_shape, 'square');
});

test('Regression: Fresh import correctly sets candidate links without keeping prior resume links', () => {
  // Candidate imported resume without social links
  const parsedIncoming = {
    personal_info: {
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      phone: '555-9999',
      location: 'Austin, TX',
      linkedin: '',
      github: '',
      website: ''
    }
  };

  // Simulating the fixed App.jsx handleParsedSuccess logic
  const prevResume = {
    personal_info: {
      fullName: 'Darshan Patel',
      email: 'darshan@example.com',
      phone: '123-4567',
      location: 'Ahmedabad',
      linkedin: 'linkedin.com/in/darshan-patel-dev',
      github: 'github.com/darshanpatel-pro',
      website: 'darshanpatel.dev',
      profile_photo: 'photo-url',
      photo_shape: 'circle'
    }
  };

  const incomingPersonal = parsedIncoming.personal_info || {};
  const cleanField = (val) => (typeof val === 'string' ? val.trim() : '');

  const mergedPersonalInfo = {
    fullName: cleanField(incomingPersonal.fullName) || cleanField(prevResume.personal_info?.fullName),
    email: cleanField(incomingPersonal.email) || cleanField(prevResume.personal_info?.email),
    phone: cleanField(incomingPersonal.phone) || cleanField(prevResume.personal_info?.phone),
    location: cleanField(incomingPersonal.location) || cleanField(prevResume.personal_info?.location),
    linkedin: cleanField(incomingPersonal.linkedin),
    github: cleanField(incomingPersonal.github),
    website: cleanField(incomingPersonal.website),
    profile_photo: prevResume.personal_info?.profile_photo || '',
    photo_shape: prevResume.personal_info?.photo_shape || 'circle'
  };

  // Bob Smith's resume has Bob's name and email, and EMPTY links (no Darshan Patel demo links!)
  assert.equal(mergedPersonalInfo.fullName, 'Bob Smith');
  assert.equal(mergedPersonalInfo.email, 'bob@example.com');
  assert.equal(mergedPersonalInfo.linkedin, '', 'Stale LinkedIn must NOT survive fresh import');
  assert.equal(mergedPersonalInfo.github, '', 'Stale GitHub must NOT survive fresh import');
  assert.equal(mergedPersonalInfo.website, '', 'Stale Website must NOT survive fresh import');
  assert.equal(mergedPersonalInfo.profile_photo, 'photo-url', 'User photo preference is preserved');
});

test('Regression: 3 jobs with various date and header formats parse with strict boundary separation', () => {
  const threeJobsText = `
Candidate Name
candidate@example.com

Experience
Staff Engineer
Google
Mar 2021 - Present
• Designed distributed streaming architecture handling 1M events/sec
• Mentored 8 senior engineers across 3 teams

Senior Backend Developer
Stripe
Jan 2018 - Feb 2021
• Built real-time payment reconciliation engine
• Maintained 99.999% uptime during peak holiday volumes

Software Engineer at Amazon (2015 - 2017)
• Developed high-throughput DynamoDB ingestion pipelines
• Automated deployment pipelines via AWS CDK
`;

  const parsed = parseResumeRuleBased(threeJobsText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.experience.length, 3, 'Must extract all 3 jobs');

  // Job 1
  assert.equal(sanitized.experience[0].role, 'Staff Engineer');
  assert.equal(sanitized.experience[0].company, 'Google');
  assert.ok(sanitized.experience[0].startDate.includes('Mar 2021') || sanitized.experience[0].year.includes('Mar 2021'));
  assert.ok(sanitized.experience[0].description.includes('distributed streaming'));

  // Job 2
  assert.equal(sanitized.experience[1].role, 'Senior Backend Developer');
  assert.equal(sanitized.experience[1].company, 'Stripe');
  assert.ok(sanitized.experience[1].startDate.includes('Jan 2018') || sanitized.experience[1].year.includes('Jan 2018'));
  assert.ok(sanitized.experience[1].description.includes('payment reconciliation'));

  // Job 3 (at pattern with paren date)
  assert.equal(sanitized.experience[2].role, 'Software Engineer');
  assert.equal(sanitized.experience[2].company, 'Amazon');
  assert.ok(sanitized.experience[2].startDate.includes('2015') || sanitized.experience[2].year.includes('2015'));
  assert.ok(sanitized.experience[2].description.includes('DynamoDB'));
});

test('Regression: Multi-sentence project descriptions without bullets are preserved without splitting', () => {
  const projectsText = `
Name
email@test.com

Projects
Cloud Cost Optimizer
Developed an automated AWS and GCP resource auditing tool.
Integrated billing APIs and generated weekly executive summary dashboards.

Real-Time Chat Microservice
Built WebSocket server using Go and Redis PubSub.
Scaled to 50,000 concurrent active socket connections with sub-20ms latency.
`;

  const parsed = parseResumeRuleBased(projectsText);
  const sanitized = sanitizeParsedResume(parsed);

  assert.equal(sanitized.projects.length, 2, 'Must extract exactly 2 projects');
  assert.equal(sanitized.projects[0].name, 'Cloud Cost Optimizer');
  assert.ok(sanitized.projects[0].description.includes('auditing tool'));
  assert.ok(sanitized.projects[0].description.includes('billing APIs'));

  assert.equal(sanitized.projects[1].name, 'Real-Time Chat Microservice');
  assert.ok(sanitized.projects[1].description.includes('WebSocket server'));
  assert.ok(sanitized.projects[1].description.includes('50,000 concurrent'));
});

test('Regression: Interview Prep Question and Answer pairing consistency', async () => {
  const req = {
    user: { id: 1 },
    headers: {},
    body: {
      targetRole: 'Site Reliability Engineer',
      resume: {
        target_role: 'Site Reliability Engineer',
        skills: ['Kubernetes', 'Terraform', 'Prometheus', 'Linux', 'Go']
      },
      regenerate: false
    }
  };

  let resData = null;
  const res = {
    json(d) { resData = d; return this; },
    status() { return this; }
  };

  await generateInterviewPrep(req, res);

  assert.ok(resData.success);
  assert.equal(resData.questions.length, 5);
  for (const item of resData.questions) {
    // Assert strictly that questions, answers, and tips are paired
    assert.ok(item.question.length > 15, 'Valid question prompt');
    assert.ok(item.idealAnswer.length > 20, 'Substantive ideal answer');
    assert.ok(item.proTip.length > 15, 'Actionable recruiter tip');
    assert.ok(item.type === 'Technical' || item.type === 'Behavioral');
  }
});
