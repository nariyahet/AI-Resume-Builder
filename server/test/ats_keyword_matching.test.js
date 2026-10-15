import test from 'node:test';
import assert from 'node:assert/strict';
import {
  keywordMatchesText,
  isKeywordInResume,
  calculateAts,
  normalizeTerm
} from '../controllers/aiController.js';

// Helper to invoke calculateAts in test environment
async function callCalculateAts(payload) {
  let resultData = null;
  let statusCode = 200;
  const req = {
    body: payload,
    headers: {}
  };
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (d) => { resultData = d; }
      };
    },
    json: (d) => { resultData = d; }
  };
  await calculateAts(req, res);
  return { status: statusCode, data: resultData };
}

// 1. Resume skills contain Git, JD contains Git -> Git must not be missing
test('ATS Test 1: Resume skills contain Git, JD contains Git -> Git must not be missing', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'React', 'Git'],
    summary: 'Frontend Engineer with experience building responsive web apps with React and TypeScript.',
    experience: [{ role: 'Frontend Developer', company: 'WebStudio LLC', description: 'Developed React web apps.' }],
    projects: [{ name: 'Portfolio Platform', description: 'Personal web platform. Tech Stack: React, Tailwind CSS' }]
  };
  const jobDescription = 'Seeking a Frontend Developer experienced in Git, Agile methodology, automated testing, and CI/CD workflows.';

  assert.equal(isKeywordInResume('Git', resume), true, 'isKeywordInResume must detect Git in skills');

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.missingKeywords));
  assert.ok(!data.missingKeywords.includes('Git'), 'Git must NOT appear in missingKeywords');
  assert.ok(!data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'No variation of Git may appear in missingKeywords');
});

// 2. Resume contains git (lowercase), JD contains Git -> must match
test('ATS Test 2: Resume contains git (lowercase), JD contains Git -> must match', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['javascript', 'react', 'git']
  };
  const jobDescription = 'Must be proficient in Git version control.';

  assert.equal(isKeywordInResume('Git', resume), true, 'Case-insensitive match: Git matches git');

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.ok(!data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'Git must not be reported as missing when lowercase git is present');
});

// 3. Resume contains GitHub but not Git -> do not assume Git is present
test('ATS Test 3: Resume contains GitHub but not Git -> token boundary prevents false match', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'React', 'GitHub Actions', 'GitHub']
  };
  const jobDescription = 'Requires hands-on expertise with Git CLI and repository branching workflows.';

  assert.equal(keywordMatchesText('Git', 'GitHub Actions'), false, 'Git must not match GitHub Actions');
  assert.equal(keywordMatchesText('Git', 'GitHub'), false, 'Git must not match GitHub');
  assert.equal(isKeywordInResume('Git', resume), false, 'Git must be false when only GitHub is present');

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription: 'Must know Git'
  });

  assert.equal(data.success, true);
  assert.ok(data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'Git should be reported as missing when only GitHub is present');
});

// 4. Token boundary: Digital does not match Git
test('ATS Test 4: Token boundary prevents Git from matching Digital', () => {
  assert.equal(keywordMatchesText('Git', 'Digital Marketing Specialist'), false);
  assert.equal(keywordMatchesText('Git', 'Enterprise Digital Systems'), false);
  assert.equal(isKeywordInResume('Git', { skills: ['Digital Strategy', 'Digital Marketing'] }), false);
});

// 5. Resume contains CI/CD, JD contains CI CD -> verify consistent normalization
test('ATS Test 5: Resume contains CI/CD, JD contains CI CD -> consistent normalization', async () => {
  const resume = {
    target_role: 'DevOps Engineer',
    skills: ['Docker', 'Kubernetes', 'CI/CD']
  };

  assert.equal(isKeywordInResume('CI CD', resume), true, 'CI/CD matches CI CD via normalization');
  assert.equal(isKeywordInResume('CI-CD', resume), true, 'CI/CD matches CI-CD via normalization');

  const { data } = await callCalculateAts({
    targetRole: 'DevOps Engineer',
    resume,
    jobDescription: 'Experience configuring CI CD pipelines and automated deployment.'
  });

  assert.equal(data.success, true);
  assert.ok(!data.missingKeywords.some(kw => normalizeTerm(kw) === 'ci cd'), 'CI CD must not appear in missingKeywords');
});

// 6. Resume lacks Agile and JD requires Agile -> correctly appears as missing
test('ATS Test 6: Resume lacks Agile and JD requires Agile -> correctly appears as missing', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['React', 'TypeScript', 'Git']
  };
  const jobDescription = 'Position requires working in an Agile methodology environment with sprint planning.';

  assert.equal(isKeywordInResume('Agile', resume), false);

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.ok(data.missingKeywords.some(kw => /agile/i.test(kw)), 'Agile should appear in missingKeywords');
});

// 7. Keywords present only in work experience or projects are handled correctly
test('ATS Test 7: Keywords present only in work experience or projects are credited', async () => {
  const resumeWithExpKeyword = {
    target_role: 'Backend Developer',
    skills: ['Node.js', 'Express'],
    experience: [{ role: 'Developer', description: 'Managed repositories and code reviews using Git.' }],
    projects: [{ name: 'Cloud Monitor', tech_stack: 'Docker, AWS' }]
  };

  assert.equal(isKeywordInResume('Git', resumeWithExpKeyword), true, 'Git found in experience bullet');
  assert.equal(isKeywordInResume('Docker', resumeWithExpKeyword), true, 'Docker found in project tech stack');
  assert.equal(isKeywordInResume('AWS', resumeWithExpKeyword), true, 'AWS found in project tech stack');

  const { data } = await callCalculateAts({
    targetRole: 'Backend Developer',
    resume: resumeWithExpKeyword,
    jobDescription: 'Looking for a developer with Git, Docker, and AWS skills.'
  });

  assert.equal(data.success, true);
  assert.ok(!data.missingKeywords.includes('Git'), 'Git from experience must not be missing');
  assert.ok(!data.missingKeywords.includes('Docker'), 'Docker from project must not be missing');
  assert.ok(!data.missingKeywords.includes('AWS'), 'AWS from project must not be missing');
});

// 8. Empty resume and empty job description are handled safely
test('ATS Test 8: Empty resume and empty job description handled safely without crashing', async () => {
  const { status, data } = await callCalculateAts({
    targetRole: '',
    resume: {},
    jobDescription: ''
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(typeof data.score, 'number');
  assert.ok(data.dimensions && typeof data.dimensions.skillsAlignment === 'number');
  assert.ok(Array.isArray(data.missingKeywords));
  assert.ok(Array.isArray(data.strengths));
  assert.ok(Array.isArray(data.suggestions));
});

// 9. Existing general ATS mode continues to work
test('ATS Test 9: Existing general ATS mode continues to work for standard role', async () => {
  const resume = {
    target_role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'Express', 'MySQL'],
    summary: 'Experienced developer with 4 years building scalable web services.',
    experience: [{ role: 'Software Engineer', company: 'Tech Inc', description: 'Built REST APIs' }]
  };

  const { data } = await callCalculateAts({
    targetRole: 'Full Stack Developer',
    resume,
    jobDescription: ''
  });

  assert.equal(data.success, true);
  assert.ok(data.score >= 50, 'General score should evaluate reasonable baseline');
  assert.equal(data.dimensions.skillsAlignment, 70);
  assert.ok(Array.isArray(data.missingKeywords));
});
