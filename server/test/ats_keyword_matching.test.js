import test from 'node:test';
import assert from 'node:assert/strict';
import {
  keywordMatchesText,
  isKeywordInResume,
  calculateAts,
  normalizeTerm,
  filterMissingKeywords
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

// 10. AI compound output Git / GitHub when candidate has Git -> only GitHub is missing
test('ATS Test 10: Compound keyword Git / GitHub is decomposed so Git is omitted and GitHub is missing', () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'React', 'Git']
  };
  const rawMissing = ['Git / GitHub', 'CI/CD', 'Agile'];
  const filtered = filterMissingKeywords(rawMissing, resume);

  assert.ok(!filtered.includes('Git'), 'Git must not appear in missing keywords');
  assert.ok(!filtered.some(kw => kw.toLowerCase() === 'git'), 'No standalone variation of Git in missing keywords');
  assert.ok(filtered.includes('GitHub'), 'GitHub must be retained as genuinely missing');
  assert.ok(filtered.includes('CI/CD'), 'CI/CD must be retained intact');
  assert.ok(filtered.includes('Agile'), 'Agile must be retained intact');
});

// 11. AI compound conjunctions: Git & GitHub and Git and GitHub
test('ATS Test 11: Compound conjunctions Git & GitHub and Git and GitHub credit Git and keep GitHub', () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['React', 'Git']
  };

  const ampFiltered = filterMissingKeywords(['Git & GitHub'], resume);
  assert.deepEqual(ampFiltered, ['GitHub'], 'Git & GitHub should isolate GitHub when Git is present');

  const andFiltered = filterMissingKeywords(['Git and GitHub'], resume);
  assert.deepEqual(andFiltered, ['GitHub'], 'Git and GitHub should isolate GitHub when Git is present');

  // Both present -> completely omitted
  const resumeWithBoth = { skills: ['Git', 'GitHub'] };
  assert.deepEqual(filterMissingKeywords(['Git / GitHub'], resumeWithBoth), [], 'Both present -> nothing missing');
});

// 12. Legitimate technical acronym CI/CD is never split into CI and CD
test('ATS Test 12: CI/CD is never split into CI and CD', () => {
  const resumeWithoutCiCd = {
    skills: ['JavaScript', 'React', 'Git']
  };
  const filtered = filterMissingKeywords(['CI/CD'], resumeWithoutCiCd);
  assert.deepEqual(filtered, ['CI/CD'], 'CI/CD must remain intact as CI/CD without splitting');
  assert.ok(!filtered.includes('CI'), 'Must not create bogus CI token');
  assert.ok(!filtered.includes('CD'), 'Must not create bogus CD token');

  const resumeWithCiCd = {
    skills: ['JavaScript', 'React', 'Git', 'CI/CD']
  };
  assert.deepEqual(filterMissingKeywords(['CI/CD'], resumeWithCiCd), [], 'Candidate with CI/CD has no missing keywords');
});

// 13. Legitimate symbols and multi-word technologies (C++, C#, Node.js, REST API, Automated Testing)
test('ATS Test 13: C++, C#, Node.js, REST API, and Automated Testing are preserved intact', () => {
  const resume = {
    skills: ['C', 'JavaScript']
  };

  // C does not satisfy C++
  assert.equal(keywordMatchesText('C++', 'C'), false, 'C must not satisfy C++');
  assert.equal(isKeywordInResume('C++', resume), false, 'C in resume must not count as C++');

  const rawKeywords = ['C++', 'C#', 'Node.js', 'REST API', 'Automated Testing'];
  const filtered = filterMissingKeywords(rawKeywords, resume);

  assert.ok(filtered.includes('C++'), 'C++ must remain intact');
  assert.ok(filtered.includes('C#'), 'C# must remain intact');
  assert.ok(filtered.includes('Node.js'), 'Node.js must remain intact with dot');
  assert.ok(filtered.includes('REST API'), 'REST API must remain intact as multi-word');
  assert.ok(filtered.includes('Automated Testing'), 'Automated Testing must remain intact as multi-word');
});

// 14. Dual Match in Rule-Based Mode: JD has both Git and GitHub, candidate has Git
test('ATS Test 14: Rule-based ATS when JD requires both Git and GitHub and resume has Git -> GitHub missing, Git omitted', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'React', 'Git'],
    summary: 'Experienced developer.'
  };
  const jobDescription = 'Looking for a Frontend Engineer with Git and GitHub repository experience, CI/CD, and Agile.';

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.ok(!data.missingKeywords.includes('Git'), 'Git must NOT appear in missingKeywords');
  assert.ok(!data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'No variation of Git may appear');
  assert.ok(data.missingKeywords.includes('GitHub'), 'GitHub must appear as missing in rule-based mode');
  assert.ok(data.missingKeywords.includes('CI/CD'), 'CI/CD must appear as missing');
  assert.ok(data.missingKeywords.includes('Agile'), 'Agile must appear as missing');
});

// 15. Inverse Dual Match: Candidate has GitHub, JD requires Git and GitHub -> Git is missing, GitHub omitted
test('ATS Test 15: Candidate has GitHub, JD requires Git and GitHub -> Git is missing, GitHub omitted', async () => {
  const resume = {
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'React', 'GitHub'],
    summary: 'Experienced developer with active GitHub profile.'
  };
  const jobDescription = 'Looking for a Frontend Engineer with Git CLI and GitHub workflow experience.';

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.ok(!data.missingKeywords.includes('GitHub'), 'GitHub must NOT appear as missing');
  assert.ok(data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'Git must appear as missing');
});

// 16. Full pipeline test with Alex Morgan parsed resume
test('ATS Test 16: Alex Morgan resume with Git under JD with Git and GitHub', async () => {
  const alexResume = {
    personal_info: { fullName: 'Alex Morgan' },
    target_role: 'Frontend Engineer',
    skills: ['JavaScript', 'TypeScript', 'HTMLS', 'CSS3', 'React', 'Git'],
    summary: 'Frontend Engineer with experience building responsive web applications using React and modern CSS.',
    experience: [{ role: 'Frontend Developer', company: 'Digital Solutions LLC', description: 'Developed React web apps.' }],
    projects: [{ name: 'Portfolio Platform', description: 'Personal web platform. Tech Stack: React, Tailwind CSS' }],
    education: [{ degree: 'B.S. in Computer Science', institution: 'State University' }]
  };

  const jobDescription = 'Seeking a Frontend Engineer experienced in Git, GitHub, Agile methodology, automated testing, and CI/CD workflows.';

  const { data } = await callCalculateAts({
    targetRole: 'Frontend Engineer',
    resume: alexResume,
    jobDescription
  });

  assert.equal(data.success, true);
  assert.equal(typeof data.score, 'number');
  assert.ok(data.score > 0);
  assert.ok(data.dimensions && typeof data.dimensions.skillsAlignment === 'number');

  // Exact missing keywords validation
  assert.ok(!data.missingKeywords.includes('Git'), 'Git must NOT appear under missingKeywords');
  assert.ok(!data.missingKeywords.some(kw => kw.toLowerCase() === 'git'), 'No variation of Git under missingKeywords');
  assert.ok(data.missingKeywords.includes('GitHub'), 'GitHub MUST appear under missingKeywords');
  assert.ok(data.missingKeywords.some(kw => /ci\/cd/i.test(kw)), 'CI/CD must appear under missingKeywords');
  assert.ok(data.missingKeywords.some(kw => /agile/i.test(kw)), 'Agile must appear under missingKeywords');
  assert.ok(data.missingKeywords.some(kw => /automated\s+testing/i.test(kw)), 'Automated Testing must appear under missingKeywords');
});

