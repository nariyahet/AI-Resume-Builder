import dotenv from 'dotenv';
import { getDB, getIsConnected } from '../config/db.js';
dotenv.config();

// Helper to call Gemini REST API with configurable output token limits and truncation handling
async function callGemini(prompt, clientApiKey = null, options = {}) {
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null; // Will trigger smart fallback
  }

  const maxOutputTokens = typeof options === 'number'
    ? options
    : (options?.maxOutputTokens || 2500);
  const temperature = typeof options === 'object' && options?.temperature !== undefined
    ? options.temperature
    : 0.7;

  // Use Gemini 2.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    throw new Error(`Gemini API responded with status ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason === 'MAX_TOKENS') {
    console.warn(`Gemini output truncated: hit maxOutputTokens limit of ${maxOutputTokens}.`);
    const truncErr = new Error(`Gemini response was truncated due to output token limit (${maxOutputTokens}).`);
    truncErr.code = 'RESPONSE_TRUNCATED';
    truncErr.isTruncated = true;
    throw truncErr;
  }

  const text = candidate?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

// Server-controlled AI operations counter: increments only upon successful AI execution
async function recordAiOperation(userId) {
  if (!userId || !getIsConnected()) return;
  try {
    const db = getDB();
    await db.query(
      'UPDATE users SET ai_daily_count = COALESCE(ai_daily_count, 0) + 1, ai_last_reset = CURRENT_DATE() WHERE id = ?',
      [userId]
    );
  } catch (err) {
    console.warn('Failed to record AI operation counter:', err.message);
  }
}

// 1. AI Professional Summary Generator
export async function enhanceSummary(req, res) {
  try {
    const userId = req.user?.id;
    const { targetRole, experience, skills, rawSummary } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const prompt = `
You are an expert HR and Executive Resume Writer.
Create an impressive, high-impact 3 to 4 sentence professional executive summary for a resume.
Target Role: ${targetRole || 'Software Professional'}
Skills: ${Array.isArray(skills) ? skills.join(', ') : skills || 'Technical & Soft Skills'}
Experience Highlights: ${typeof experience === 'string' ? experience : JSON.stringify(experience || [])}
Existing draft/notes: ${rawSummary || 'None'}

Rules:
- Write in concise, third-person active voice without "I" or "my".
- Emphasize business impact, leadership, and technical mastery.
- Make it ATS-friendly and tailored to the target role.
- Output ONLY the summary text, no extra markdown or quotes.
`;

    let summary = null;
    let isAi = false;
    let truncationError = false;
    try {
      summary = await callGemini(prompt, clientKey, { maxOutputTokens: 1500 });
      if (summary) isAi = true;
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini API call failed, falling back to smart template generator:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'AI summary generation was truncated. Please try again with shorter input.'
      });
    }

    if (!summary) {
      // High-quality honest fallback without fabricating achievements or metrics
      const role = targetRole || 'Software Professional';
      const skillText = Array.isArray(skills) && skills.length > 0 ? skills.slice(0, 4).join(', ') : 'modern industry technologies';
      summary = `Dedicated and proactive ${role} with practical experience applying ${skillText} across core project deliverables. Adept at collaborative problem-solving, structured code implementation, and meeting team milestones. Committed to continuous technical growth and delivering reliable results.`;
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      summary,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('Enhance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to enhance summary.' });
  }
}

// 2. AI Bullet Point Polisher (STAR Method)
export async function enhanceBullets(req, res) {
  try {
    const userId = req.user?.id;
    const { rawBullets, role, company } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const prompt = `
You are a senior tech recruiter and resume specialist.
Rewrite the following raw job duty notes into 3 high-impact, ATS-optimized bullet points using the STAR method (Situation, Task, Action, Result) with strong action verbs.
Role: ${role || 'Team Member'} at ${company || 'Company'}
Raw Notes: "${rawBullets || 'Developed software features, worked with team, solved bugs.'}"

RULES:
- Improve wording, action verbs, clarity, and technical precision.
- Do NOT fabricate metrics, percentages, uptime, or user numbers that were not provided.
- If the candidate notes do not contain a quantifiable result, suggest: "[Add measurable result if known]".

Format your response as a valid JSON array of 3 strings:
["Action verb + responsibility [add measurable result if known]", "Engineered and streamlined ...", "Collaborated with ..."]
Output ONLY the raw JSON array.
`;

    let bullets = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 1500 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        bullets = JSON.parse(cleaned);
        if (Array.isArray(bullets) && bullets.length > 0) {
          isAi = true;
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini bullets parsing failed or no key:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'AI bullet enhancement was truncated. Please try again.'
      });
    }

    if (!bullets || !Array.isArray(bullets)) {
      bullets = [
        `Contributed to the development and release of core features for ${company || 'the team'} [add measurable result if known].`,
        `Architected and maintained component workflows utilizing modern engineering best practices to improve overall system reliability.`,
        `Collaborated cross-functionally with team members and technical stakeholders to troubleshoot issues and deliver project milestones.`
      ];
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      bullets,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('Enhance bullets error:', error);
    res.status(500).json({ success: false, message: 'Failed to enhance bullet points.' });
  }
}

// 3. AI ATS Score & Optimization Calculator (Supports General Mode & Job-Specific Mode)
export async function calculateAts(req, res) {
  try {
    const userId = req.user?.id;
    const { targetRole, resume, jobDescription } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const role = targetRole || resume?.target_role || 'Software Professional';
    const skills = resume?.skills || [];
    const experience = resume?.experience || [];
    const summary = resume?.summary || '';
    const hasJd = !!(jobDescription && jobDescription.trim());

    const prompt = `
You are an expert technical recruiter and Applicant Tracking System (ATS) optimization specialist.
Perform an honest ATS optimization analysis on the following candidate resume.
${hasJd ? `ANALYSIS MODE: Job-Specific ATS Optimization (targeting supplied Job Description)
TARGET JOB DESCRIPTION:
"""${jobDescription.trim().substring(0, 3000)}"""` : `ANALYSIS MODE: General Resume ATS Optimization (targeting general industry standards for "${role}")`}

CANDIDATE RESUME:
Target Role: ${role}
Summary: ${summary || 'None'}
Skills: ${JSON.stringify(skills)}
Experience: ${JSON.stringify(experience)}

EVALUATION GUIDELINES:
- Score realistically from 0 to 100 based strictly on provided facts. Do not artificially inflate or force high scores.
- Evaluate 4 core dimensions (each 0 to 100):
  1. skillsAlignment: Alignment of candidate skills with ${hasJd ? 'the Job Description' : `the target role "${role}"`}
  2. keywordAlignment: Keyword density and presence of relevant domain terms
  3. experienceRelevance: Relevance, depth, and clarity of work experience
  4. resumeReadability: Chronological formatting, ATS parsability, and structure
- ${hasJd ? 'Only identify missing keywords that are actually present or directly required in the target Job Description. Do not fabricate keywords.' : 'Identify standard, relevant industry keywords commonly sought for this role that are currently absent from the resume.'}
- Suggestions should be actionable and truthful.

Return ONLY a strict JSON object with this exact structure:
{
  "score": <overall optimization score 0-100>,
  "verdict": "<Concise verdict, e.g. Strong ATS Alignment | Good Foundation with Gaps | Needs Optimization>",
  "dimensions": {
    "skillsAlignment": <number 0-100>,
    "keywordAlignment": <number 0-100>,
    "experienceRelevance": <number 0-100>,
    "resumeReadability": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missingKeywords": ["<relevant missing keyword 1>", "<relevant missing keyword 2>"],
  "suggestions": ["<practical optimization tip 1>", "<practical optimization tip 2>"]
}
`;

    let result = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 3000 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        result = JSON.parse(cleaned);
        if (result && typeof result.score === 'number' && result.dimensions) {
          isAi = true;
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini ATS score call failed, using rule-based scoring:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'ATS analysis was truncated due to length. Please try again.'
      });
    }

    if (!result || typeof result.score !== 'number') {
      // Evidence-based rule-based ATS evaluation fallback
      const skillsCount = Array.isArray(skills) ? skills.length : 0;
      const expCount = Array.isArray(experience) ? experience.length : 0;

      let skillsAlignment = skillsCount >= 8 ? 84 : skillsCount >= 4 ? 70 : skillsCount >= 1 ? 55 : 30;
      let experienceRelevance = expCount >= 3 ? 85 : expCount >= 1 ? 68 : 35;
      let resumeReadability = 65;
      if (summary && summary.length > 60) resumeReadability += 15;
      if (resume?.education && resume.education.length > 0) resumeReadability += 10;
      resumeReadability = Math.min(95, resumeReadability);

      let keywordAlignment = 60;
      let missingKeys = [];

      if (hasJd) {
        const jdLower = jobDescription.toLowerCase();
        const matched = (skills || []).filter(s => jdLower.includes(String(s).toLowerCase()));
        keywordAlignment = Math.min(95, Math.max(25, Math.round((matched.length / Math.max(1, skillsCount)) * 100)));
        const commonTech = ['Git', 'REST APIs', 'Docker', 'Agile', 'CI/CD', 'Testing', 'Cloud', 'SQL', 'TypeScript'];
        missingKeys = commonTech.filter(t => jdLower.includes(t.toLowerCase()) && !(skills || []).some(s => String(s).toLowerCase().includes(t.toLowerCase()))).slice(0, 4);
      } else {
        keywordAlignment = Math.min(85, Math.max(35, skillsCount * 8));
        missingKeys = ['CI/CD Workflow', 'Agile Methodology', 'Automated Testing', 'Performance Optimization'];
      }

      const score = Math.round((skillsAlignment + keywordAlignment + experienceRelevance + resumeReadability) / 4);

      result = {
        score,
        verdict: score >= 80 ? 'Strong ATS Alignment' : score >= 60 ? 'Moderate Alignment with Growth Opportunities' : 'Needs Optimization',
        dimensions: {
          skillsAlignment,
          keywordAlignment,
          experienceRelevance,
          resumeReadability
        },
        strengths: [
          skillsCount >= 5 ? 'Good coverage of core technical proficiencies' : 'Foundational skills listed',
          expCount > 0 ? 'Chronological career progression is parsable' : 'Basic background provided',
          summary ? 'Professional summary provides immediate role context' : 'Clear layout structure'
        ],
        missingKeywords: missingKeys.length > 0 ? missingKeys : ['Version Control', 'Agile Development'],
        suggestions: [
          hasJd
            ? 'Add a missing keyword only if it accurately reflects your genuine skills and experience.'
            : 'Incorporate industry-standard keywords that reflect the core competencies of your target role.',
          'Where applicable, include real quantifiable outcomes in your experience bullet points to demonstrate impact.'
        ]
      };
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      ...result,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('ATS calculate error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate ATS score.' });
  }
}

// 4. 1-Click Complete Resume Auto-Generator from Raw Bio / Description
export async function oneClickGenerate(req, res) {
  try {
    const userId = req.user?.id;
    const { promptText, targetRole } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const prompt = `
Convert the following user background notes into a polished, structured resume JSON:
Target Role: ${targetRole || 'Professional'}
User Background Notes: "${promptText || 'Developer with web experience.'}"

INTEGRITY RULES:
- Extract and structure ONLY the candidate's actual background from the notes.
- If personal details (name, email, phone, location, links) are not provided, leave them as empty strings ("").
- NEVER invent fictional candidate identities, fabricated degrees, imaginary employers, or fake metric percentages.
- If information for a section is missing from the notes, return an empty array ([]).

Return ONLY a strict JSON object with this exact structure:
{
  "title": "${targetRole || 'Professional'} Resume",
  "target_role": "${targetRole || 'Software Professional'}",
  "personal_info": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "Concise professional summary reflecting provided experience...",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "location": "Location",
      "startDate": "Start Date",
      "endDate": "End Date",
      "description": "• Responsibilities described in notes"
    }
  ],
  "education": [],
  "projects": []
}
Output ONLY raw JSON.
`;

    let generated = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 8192 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        generated = JSON.parse(cleaned);
        if (generated && typeof generated === 'object') {
          isAi = true;
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini 1-click generation failed, using clean structured template:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'Resume generation was truncated due to output length. Please try again with shorter input.'
      });
    }

    if (!generated) {
      // Safe, honest template scaffold without inventing a fictional identity or fake achievements
      const notesSnippet = promptText ? promptText.slice(0, 120).trim() : '';
      generated = {
        title: `${targetRole || 'Professional'} Resume`,
        target_role: targetRole || 'Software Professional',
        personal_info: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          website: ''
        },
        summary: notesSnippet
          ? `Motivated ${targetRole || 'professional'} with experience in ${notesSnippet}. Focused on continuous technical growth, code reliability, and contributing effectively to team goals.`
          : `Dedicated ${targetRole || 'professional'} skilled in technical implementation and problem-solving. Seeking to apply core proficiencies to high-impact software development deliverables.`,
        skills: [],
        experience: [],
        education: [],
        projects: []
      };
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      resume: generated,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('1-click generate error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate resume.' });
  }
}

// 5. Job Description (JD) Matcher & Auto-Tailor
export async function matchJobDescription(req, res) {
  try {
    const userId = req.user?.id;
    const { jobDescription, resume } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ success: false, message: 'Job Description is required.' });
    }

    const prompt = `
You are an expert HR recruiter and ATS compliance specialist.
Compare this candidate's resume against the target Job Description (JD):

TARGET JOB DESCRIPTION:
"""${jobDescription.substring(0, 2500)}"""

CANDIDATE RESUME:
Target Role: ${resume?.target_role || ''}
Summary: ${resume?.summary || ''}
Skills: ${(resume?.skills || []).join(', ')}
Experience: ${JSON.stringify(resume?.experience || [])}

RULES:
- Evaluate actual alignment objectively. Score between 0 and 100 based strictly on evidence.
- Identify matching keywords that are ACTUALLY present in both the JD and the candidate resume.
- Identify missing keywords that are genuinely required in the JD but absent from the candidate resume.
- Do NOT fabricate skills, technologies, or candidate achievements.
- In tailoredSummary, rewrite the candidate's existing background to emphasize relevance without fabricating qualifications.

Return ONLY a strict JSON object with this exact structure:
{
  "matchScore": <number between 0 and 100>,
  "verdict": "<Strong Match | Moderate Match | Low Alignment>",
  "matchingKeywords": ["<keyword 1>", "<keyword 2>"],
  "missingKeywords": ["<missing keyword 1>", "<missing keyword 2>"],
  "tailoredSummary": "<A tailored 3-sentence summary highlighting existing candidate facts matching the JD>",
  "actionableTips": [
    "Add a missing keyword only if it accurately reflects your genuine experience or skills.",
    "<Practical tip on emphasizing relevant existing experience>"
  ]
}
`;

    let result = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 3000 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        result = JSON.parse(cleaned);
        if (result && typeof result.matchScore === 'number') {
          isAi = true;
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini JD matcher fallback:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'Job Description matching was truncated. Please try again with shorter input.'
      });
    }

    if (!result) {
      // Evidence-based JD matching fallback
      const jdWords = jobDescription.toLowerCase();
      const candidateSkills = (resume?.skills || []).map(s => String(s).trim());
      const matched = candidateSkills.filter(s => s && jdWords.includes(s.toLowerCase()));

      const commonTech = ['Git', 'REST APIs', 'Docker', 'Agile', 'CI/CD', 'Testing', 'Cloud', 'SQL', 'TypeScript'];
      const missing = commonTech.filter(t => jdWords.includes(t.toLowerCase()) && !candidateSkills.some(s => s.toLowerCase() === t.toLowerCase())).slice(0, 5);

      const ratio = candidateSkills.length > 0 ? (matched.length / candidateSkills.length) : 0;
      const score = Math.min(95, Math.max(20, Math.round(ratio * 70 + (matched.length > 0 ? 25 : 10))));

      result = {
        matchScore: score,
        verdict: score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match with Gaps' : 'Low Alignment with Target Role',
        matchingKeywords: matched,
        missingKeywords: missing,
        tailoredSummary: `Dedicated ${resume?.target_role || 'Software Professional'} with hands-on background in ${matched.slice(0, 3).join(', ') || 'software engineering'}. Experienced in designing reliable features, working within development workflows, and delivering deliverables aligned with project objectives.`,
        actionableTips: [
          'Add a missing keyword only if it accurately reflects your genuine skills and experience.',
          'Highlight your direct experience with the primary responsibilities emphasized in the Job Description.'
        ]
      };
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      ...result,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('JD match error:', error);
    res.status(500).json({ success: false, message: 'Failed to match Job Description.' });
  }
}

// 6. AI Cover Letter Generator
export async function generateCoverLetter(req, res) {
  try {
    const userId = req.user?.id;
    const { companyName, jobRole, hiringManager, resume, tone = 'professional' } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const targetCompany = companyName || 'your esteemed company';
    const targetRole = jobRole || resume?.target_role || 'the position';
    const candidateName = resume?.personal_info?.fullName || 'Candidate';

    const prompt = `
You are an executive career advisor.
Write an engaging, compelling, 3 to 4 paragraph professional Cover Letter from ${candidateName} applying for the position of "${targetRole}" at "${targetCompany}".
Hiring Manager: ${hiringManager || 'Hiring Team'}
Tone: ${tone} (e.g. professional, enthusiastic, executive)

Candidate Highlights:
Summary: ${resume?.summary || ''}
Skills: ${(resume?.skills || []).slice(0, 8).join(', ')}
Key Experience: ${JSON.stringify((resume?.experience || []).slice(0, 2))}

Output ONLY the formatted cover letter text with proper salutation, body paragraphs, and formal closing.
`;

    let letter = null;
    let isAi = false;
    let truncationError = false;
    try {
      letter = await callGemini(prompt, clientKey, { maxOutputTokens: 3000 });
      if (letter) isAi = true;
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini cover letter fallback:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'Cover letter generation was truncated. Please try again.'
      });
    }

    if (!letter) {
      const skillsText = (resume?.skills || []).slice(0, 4).join(', ') || 'modern software engineering principles';
      letter = `Dear ${hiringManager || 'Hiring Manager'},

I am writing to express my interest in the ${targetRole} role at ${targetCompany}. With practical experience applying ${skillsText} to deliver robust technical solutions, I am eager to contribute to your engineering initiatives.

Throughout my background, I have focused on writing clean, maintainable code, collaborating with cross-functional teams, and implementing scalable workflows. My approach emphasizes structured problem-solving, attention to detail, and a commitment to continuous learning.

I welcome the opportunity to discuss how my background and technical skills align with the goals of ${targetCompany}.

Sincerely,
${candidateName}
${resume?.personal_info?.email || ''} | ${resume?.personal_info?.phone || ''}`;
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      coverLetter: letter,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('Cover letter error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate cover letter.' });
  }
}

// Helper for comparing interview questions and preventing repetition across regenerations
function normalizeQuestionText(q) {
  if (typeof q !== 'string') return '';
  return q.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function areQuestionsSimilar(q1, q2) {
  const norm1 = normalizeQuestionText(q1);
  const norm2 = normalizeQuestionText(q2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  const words1 = new Set(norm1.split(' ').filter(w => w.length > 3));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return false;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return (intersection / union) >= 0.5;
}

// 7. AI Interview Preparation Q&A Generator
export async function generateInterviewPrep(req, res) {
  try {
    const userId = req.user?.id;
    const { targetRole, resume, regenerate, previousQuestions } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    const role = targetRole || resume?.target_role || 'Software Engineer';
    const isRegenerate = Boolean(regenerate) || (Array.isArray(previousQuestions) && previousQuestions.length > 0);
    const prevList = Array.isArray(previousQuestions)
      ? previousQuestions.map(q => (typeof q === 'string' ? q.trim() : '')).filter(Boolean)
      : [];

    // Comprehensive 36-question bank (22 technical, 14 behavioral) to guarantee zero repetition across 5+ consecutive regenerations
    const fallbackPool = [
      // Technical Questions (22)
      {
        type: 'Technical',
        question: `How do you approach performance optimization and architecture design for core features in ${role}?`,
        idealAnswer: 'Explain how you identify bottlenecks with profiling tools, structure efficient algorithms and data access, implement caching where appropriate, and ensure clean separation of concerns.',
        proTip: 'Highlight real engineering habits and trade-offs rather than generic definitions.'
      },
      {
        type: 'Technical',
        question: 'How do you ensure application security and reliable state management in your projects?',
        idealAnswer: 'Discuss input validation, parameterized queries, secure credential handling, and keeping state predictable through structured patterns.',
        proTip: 'Show security-conscious habits and thorough unit testing approaches.'
      },
      {
        type: 'Technical',
        question: 'Can you describe your component and API design methodology to ensure maintainability?',
        idealAnswer: 'Detail modular decomposition, clear interface contracts, handling edge cases gracefully, and comprehensive documentation.',
        proTip: 'Interviewers look for maintainability and scalability thinking.'
      },
      {
        type: 'Technical',
        question: `What strategies do you use for automated testing and preventing regressions in ${role}?`,
        idealAnswer: 'Discuss unit testing critical business logic, integration tests for API workflows, end-to-end regression checks, and CI pipeline automation.',
        proTip: 'Demonstrate balance between test coverage speed and defect prevention.'
      },
      {
        type: 'Technical',
        question: 'How do you diagnose and resolve complex asynchronous data synchronization or race conditions?',
        idealAnswer: 'Explain tracing data flow, reproducing race conditions in isolated environments, implementing idempotent operations, and leveraging appropriate locking or optimistic concurrency controls.',
        proTip: 'Concrete examples of distributed or stateful edge cases show senior technical maturity.'
      },
      {
        type: 'Technical',
        question: 'How do you handle technical debt while keeping velocity high on active deliverables?',
        idealAnswer: 'Walk through incremental refactoring alongside feature work, documenting high-risk modules, establishing clear code standards, and negotiating tech debt time during sprint planning.',
        proTip: 'Frame technical debt pragmatically in terms of delivery risk and maintenance cost.'
      },
      {
        type: 'Technical',
        question: 'How do you design database indexing, query execution planning, and schema migrations for high concurrency?',
        idealAnswer: 'Detail compound indexing strategies, examining EXPLAIN query plans, avoiding full table scans, and using non-blocking schema migration patterns in production.',
        proTip: 'Discuss specific SQL query performance improvements and latency measurements.'
      },
      {
        type: 'Technical',
        question: 'What caching patterns do you leverage and how do you handle cache invalidation and stampedes?',
        idealAnswer: 'Cover Cache-Aside, Write-Through, stale-while-revalidate, setting deterministic TTLs, and using mutexes or probabilistic early expiration to avoid cache stampedes.',
        proTip: 'Mentioning cache consistency guarantees and invalidation trade-offs demonstrates production depth.'
      },
      {
        type: 'Technical',
        question: 'How do you implement resilient error handling, graceful degradation, and centralized observability?',
        idealAnswer: 'Discuss structured error hierarchies, circuit breakers for upstream service calls, fallback states for users, and correlated request ID logging with APM metrics.',
        proTip: 'Recruiters want to see that failure modes are anticipated rather than reactive.'
      },
      {
        type: 'Technical',
        question: 'Can you explain your approach to containerization with Docker and automated CI/CD pipeline deployments?',
        idealAnswer: 'Cover multi-stage Docker builds to minimize attack surface and image size, automated test gates in CI, and blue-green or rolling canary deployments.',
        proTip: 'Demonstrating end-to-end ownership from local dev to cloud deployment is a huge differentiator.'
      },
      {
        type: 'Technical',
        question: 'How do you evaluate trade-offs between real-time WebSockets and lightweight REST polling?',
        idealAnswer: 'Explain connection overhead, stateful socket server scalability, proxy buffering, versus simple stateless HTTP polling with conditional headers like If-None-Match.',
        proTip: 'Base your choice on message frequency, latency tolerance, and infrastructure complexity.'
      },
      {
        type: 'Technical',
        question: 'How do you isolate and eliminate memory leaks or CPU bottlenecks in modern Node.js and client applications?',
        idealAnswer: 'Detail capturing heap snapshots, tracking unreleased event listeners or closures, inspecting flame graphs in Chrome DevTools/v8-profiler, and verifying GC behaviour.',
        proTip: 'Give a specific debugging war story rather than theoretical advice.'
      },
      {
        type: 'Technical',
        question: 'How do you enforce robust authentication and authorization (JWT, OAuth2, RBAC) across multi-tenant applications?',
        idealAnswer: 'Explain short-lived access tokens, secure httpOnly refresh cookies, cryptographic signature verification, and tenant-scoped database query filters.',
        proTip: 'Highlighting multi-tenant data isolation shows enterprise security readiness.'
      },
      {
        type: 'Technical',
        question: 'What architectural considerations guide your decision between microservices and a modular monolith?',
        idealAnswer: 'Evaluate team size, domain boundary maturity, deployment cadence, operational overhead, network latency, and distributed transaction complexity.',
        proTip: 'Emphasize starting with a clean modular monolith and decomposing only when scale or organizational boundaries demand it.'
      },
      {
        type: 'Technical',
        question: 'How do you optimize initial frontend bundle sizes, code splitting, and Core Web Vitals?',
        idealAnswer: 'Cover dynamic route imports, tree-shaking dead code, optimizing critical rendering path (LCP/CLS), compressing static assets, and deferring non-critical scripts.',
        proTip: 'Connecting front-end performance directly to user retention and SEO builds credibility.'
      },
      {
        type: 'Technical',
        question: 'How do you design idempotent RESTful APIs and handle webhook retries safely?',
        idealAnswer: 'Detail idempotent tokens, unique transaction keys in database constraints, exponential backoff with jitter for retries, and acknowledging webhooks before long-running async tasks.',
        proTip: 'Idempotency in payments and data updates is a favorite senior interview topic.'
      },
      {
        type: 'Technical',
        question: 'How do you manage database transaction isolation levels and prevent phantom reads or dirty writes?',
        idealAnswer: 'Walk through Read Committed versus Serializable isolation, row-level pessimistic locking (SELECT FOR UPDATE) versus optimistic locking via version columns.',
        proTip: 'Explain when optimistic locking is preferable for high-read, low-contention workloads.'
      },
      {
        type: 'Technical',
        question: 'How do you design a scalable message queue architecture for background tasks and batch jobs?',
        idealAnswer: 'Discuss producer-consumer patterns, dead-letter queues (DLQ) for failed messages, worker autoscaling, and ensuring at-least-once processing idempotence.',
        proTip: 'Focus on failure recovery and preventing queue poisoning.'
      },
      {
        type: 'Technical',
        question: 'What is your strategy for maintaining backward compatibility when evolving public API contracts?',
        idealAnswer: 'Explain semantic versioning, URI/header versioning, non-breaking additive schema changes, contract testing with OpenAPI/Pact, and deprecation schedules.',
        proTip: 'Shows respect for client consumers and zero-downtime deployment practices.'
      },
      {
        type: 'Technical',
        question: 'How do you handle large file uploads and binary streaming without exhausting server memory?',
        idealAnswer: 'Explain streaming multipart form data directly to cloud storage via presigned S3 URLs or chunked uploads, avoiding buffering large payloads in memory.',
        proTip: 'Presigned upload URLs show modern cloud architectural competence.'
      },
      {
        type: 'Technical',
        question: 'How do you secure third-party API integrations, rate limits, and secret management in production?',
        idealAnswer: 'Discuss KMS / secret managers, rotation policies, outbound egress filtering, circuit breakers, and adhering to third-party rate limits via leaky bucket algorithms.',
        proTip: 'Emphasize least-privilege API keys and never hardcoding secrets in source control.'
      },
      {
        type: 'Technical',
        question: 'How do you approach refactoring a legacy monolithic codebase without introducing regressions?',
        idealAnswer: 'Explain characterization tests (approval tests) to snapshot existing behavior, the Strangler Fig pattern for incremental extraction, and continuous regression verification.',
        proTip: 'Demonstrates surgical, disciplined engineering over risky ground-up rewrites.'
      },

      // Behavioral & Situational Questions (14)
      {
        type: 'Behavioral',
        question: 'Describe a time when you disagreed with a teammate or technical decision. How did you handle it?',
        idealAnswer: 'Use STAR: Situation was a differing viewpoint on architecture or priorities; Task was reaching alignment; Action was evaluating trade-offs with data objectively; Result was consensus and delivery.',
        proTip: 'Focus on collaborative resolution and shared project goals.'
      },
      {
        type: 'Behavioral',
        question: 'Tell me about a challenging bug or production incident you investigated and resolved under pressure.',
        idealAnswer: 'Walk through isolating symptoms via logs/metrics, identifying the root cause, deploying a safe fix, and adding automated regression tests.',
        proTip: 'Emphasize root-cause analysis and preventative measures.'
      },
      {
        type: 'Behavioral',
        question: 'Describe a situation where project requirements were ambiguous or rapidly changing. How did you succeed?',
        idealAnswer: 'Explain clarifying requirements with stakeholders, breaking scope into verifiable iterative milestones, and maintaining frequent communication.',
        proTip: 'Shows adaptability, proactive initiative, and stakeholder management skills.'
      },
      {
        type: 'Behavioral',
        question: 'How do you balance high code quality with aggressive delivery timelines?',
        idealAnswer: 'Discuss prioritizing critical path architecture and security while identifying non-critical polish that can be phased cleanly, avoiding premature optimization.',
        proTip: 'Hiring managers value engineers who align technical excellence with business outcomes.'
      },
      {
        type: 'Behavioral',
        question: 'Tell me about a time you mentored a junior engineer or championed code review best practices.',
        idealAnswer: 'Explain pairing sessions, explaining the "why" behind patterns, creating constructive review checklists, and celebrating team members milestones.',
        proTip: 'Demonstrates leadership, empathy, and positive cultural impact.'
      },
      {
        type: 'Behavioral',
        question: 'Describe an instance where a deployment caused a regression and how you took ownership to remediate it.',
        idealAnswer: 'Walk through immediate rollback/fix-forward, communicating transparently with impacted users, and conducting a blameless post-mortem with preventative tests.',
        proTip: 'Blameless accountability and systemic prevention impress engineering leaders.'
      },
      {
        type: 'Behavioral',
        question: 'How do you collaborate with non-technical stakeholders to translate business goals into technical milestones?',
        idealAnswer: 'Discuss framing technical choices in terms of user experience, conversion impact, and risk reduction rather than technical jargon.',
        proTip: 'Proves cross-functional empathy and product-minded engineering.'
      },
      {
        type: 'Behavioral',
        question: 'Tell me about a time you had to learn an unfamiliar library or framework rapidly to deliver a critical milestone.',
        idealAnswer: 'Explain building a rapid proof of concept, reviewing official documentation and source code, validating edge cases, and delivering on schedule.',
        proTip: 'Highlights high velocity, self-direction, and fast ramp-up capabilities.'
      },
      {
        type: 'Behavioral',
        question: 'Describe a situation where you identified an inefficiency in team workflow and took initiative to fix it.',
        idealAnswer: 'Detail noticing repetitive manual deployments or test runs, automating the workflow with scripts/CI, and measuring the saved engineering hours.',
        proTip: 'Shows multiplier effect and proactive ownership.'
      },
      {
        type: 'Behavioral',
        question: 'How do you prioritize competing high-priority tasks during an intensive release sprint?',
        idealAnswer: 'Discuss assessing user impact, consulting with product managers on critical paths, time-boxing tasks, and communicating blockers early.',
        proTip: 'Demonstrates composure, executive presence, and pragmatic execution.'
      },
      {
        type: 'Behavioral',
        question: 'Tell me about a time you had to advocate for technical refactoring against pressure to only ship new features.',
        idealAnswer: 'Explain quantifying maintenance cost, increased error rates, or sprint delays to business stakeholders to secure dedicated refactoring bandwidth.',
        proTip: 'Framing technical health in business terms is the hallmark of a senior engineer.'
      },
      {
        type: 'Behavioral',
        question: 'Describe an experience receiving difficult constructive feedback. How did you process and apply it?',
        idealAnswer: 'Explain listening with an open mind, asking clarifying questions for examples, creating an action plan, and following up on progress.',
        proTip: 'Shows coachability, emotional intelligence, and growth mindset.'
      },
      {
        type: 'Behavioral',
        question: 'Tell me about a project that did not achieve its intended goal or was cancelled. What was your takeaway?',
        idealAnswer: 'Focus on retrospective insights, recognizing early warning signals, and carrying valuable architectural components into future initiatives.',
        proTip: 'Authentic resilience and analytical reflection signal mature professionalism.'
      },
      {
        type: 'Behavioral',
        question: 'How do you maintain focus, code quality, and team morale during high-pressure release deadlines?',
        idealAnswer: 'Discuss breaking complex problems into achievable daily tasks, peer check-ins, avoiding shortcuts on critical test paths, and maintaining transparent communication.',
        proTip: 'Shows steady team leadership under stressful conditions.'
      }
    ];

    let prompt = `
You are a Lead Technical Interviewer and Recruiter.
Based on the candidate's resume and target role "${role}", generate 5 realistic interview questions (3 technical + 2 behavioral/situational) along with expert model answers and key advice.
Candidate Skills: ${(resume?.skills || []).join(', ')}
`;

    if (isRegenerate && prevList.length > 0) {
      prompt += `
CRITICAL INSTRUCTION FOR REGENERATION:
The candidate requested a fresh set of questions. You MUST generate 5 completely NEW, DIVERSE questions covering different topics.
DO NOT repeat, rephrase, or duplicate any of these previously seen questions:
${prevList.slice(0, 25).map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
    }

    prompt += `
Return a strict JSON array of 5 objects:
[
  {
    "type": "Technical" or "Behavioral",
    "question": "Question text",
    "idealAnswer": "Key points of a top-tier answer using STAR method",
    "proTip": "Insider tip on what recruiters are looking for"
  }
]
Output ONLY raw JSON.
`;

    let questions = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, {
        maxOutputTokens: 4000,
        temperature: isRegenerate ? 0.9 : 0.7
      });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedQuestions = JSON.parse(cleaned);
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          // Filter candidate questions against all previously seen questions
          const uniqueAiQuestions = [];
          for (const cand of parsedQuestions) {
            if (!cand || !cand.question) continue;
            const isDup = prevList.some(prev => areQuestionsSimilar(prev, cand.question))
              || uniqueAiQuestions.some(seen => areQuestionsSimilar(seen.question, cand.question));
            if (!isDup) {
              uniqueAiQuestions.push(cand);
            }
          }
          if (uniqueAiQuestions.length > 0) {
            questions = uniqueAiQuestions;
            isAi = true;
          }
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini interview prep fallback:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'Interview prep generation was truncated. Please try again.'
      });
    }

    // If AI did not produce a full set of 5 unique questions, backfill from non-seen fallbackPool
    if (!questions || !Array.isArray(questions) || questions.length < 5) {
      const existing = Array.isArray(questions) ? [...questions] : [];
      const combinedHistory = [...prevList, ...existing.map(q => q.question)];

      // Filter fallback pool excluding all questions seen previously or in current batch
      const remainingPool = fallbackPool.filter(item =>
        !combinedHistory.some(seen => areQuestionsSimilar(seen, item.question))
      );

      const needed = 5 - existing.length;
      let techNeeded = Math.max(0, 3 - existing.filter(q => q.type === 'Technical').length);
      let behavNeeded = Math.max(0, 2 - existing.filter(q => q.type === 'Behavioral').length);

      const availableTech = remainingPool.filter(q => q.type === 'Technical');
      const availableBehav = remainingPool.filter(q => q.type === 'Behavioral');

      const pickedTech = availableTech.slice(0, techNeeded);
      const pickedBehav = availableBehav.slice(0, behavNeeded);
      let filler = [...pickedTech, ...pickedBehav];

      // If needed remaining count is still not met, pull from any remaining items in pool
      if (filler.length < needed) {
        const stillNeeded = needed - filler.length;
        const extra = remainingPool
          .filter(q => !filler.some(f => f.question === q.question))
          .slice(0, stillNeeded);
        filler = [...filler, ...extra];
      }

      // If pool was completely exhausted across many rounds, rotate from original pool with dynamic offset avoiding immediate duplicates
      if (filler.length < needed) {
        const stillNeeded = needed - filler.length;
        const offset = prevList.length % fallbackPool.length;
        const rotatedPool = [...fallbackPool.slice(offset), ...fallbackPool.slice(0, offset)];
        const emergency = rotatedPool
          .filter(q => !existing.some(e => areQuestionsSimilar(e.question, q.question)) && !filler.some(f => areQuestionsSimilar(f.question, q.question)))
          .slice(0, stillNeeded);
        filler = [...filler, ...emergency];
      }

      questions = [...existing, ...filler].slice(0, 5);
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      questions,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('Interview prep error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate interview prep questions.' });
  }
}

// 8. Smart Resume Parser (Extract unstructured text into structured resume)
// Helper to strip label prefixes such as "Name:", "Email:", "Summary:", etc.
function stripLabel(str, labelRegex) {
  if (typeof str !== 'string') return '';
  let cleaned = str.trim();
  if (labelRegex) {
    cleaned = cleaned.replace(labelRegex, '').trim();
  }
  // Strip leading/trailing bullets, colons, or dashes
  cleaned = cleaned.replace(/^[:\-\u2022*|#\s]+/, '').replace(/[:\s]+$/, '').trim();
  return cleaned;
}

const pureDateRegex = /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2})\s*(?:[-–—/]|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2}|present|current)\b/i;
const yearOnlyRegex = /^(?:19\d{2}|20\d{2})\s*(?:[-–—/]|to)\s*(?:19\d{2}|20\d{2}|present|current)$/i;
const singleYearRegex = /^(?:19\d{2}|20\d{2})$/;

export function isStandaloneDate(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  return pureDateRegex.test(s) || yearOnlyRegex.test(s) || singleYearRegex.test(s);
}

export function extractDateTokens(str) {
  if (!str || typeof str !== 'string') return { start: '', end: '', raw: '' };
  const m = str.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2})\s*(?:[-–—/]|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2}|present|current)\b/i)
    || str.match(/\b(19\d{2}|20\d{2})\s*(?:[-–—/]|to)\s*(19\d{2}|20\d{2}|present|current)\b/i)
    || str.match(/\b(19\d{2}|20\d{2})\b/);
  if (!m) return { start: '', end: '', raw: '' };
  const raw = m[0].trim();
  const parts = raw.split(/\s*(?:[-–—/]|to)\s*/i);
  return {
    start: parts[0] || '',
    end: parts[1] || '',
    raw
  };
}

export const degreeKeywordRegex = /\b(?:bca|mca|b\.?tech|btech|m\.?tech|mtech|b\.?e\.?|be|m\.?e\.?|me|b\.?sc|bsc|m\.?sc|msc|b\.?com|bcom|m\.?com|mcom|bba|mba|b\.?s\.?|bs|b\.?a\.?|ba|m\.?s\.?|ms|m\.?a\.?|ma|bachelor(?:'s)?|master(?:'s)?|phd|doctorate|diploma|associate|degree|matriculation|secondary|high\s*school)\b/i;
export const instKeywordRegex = /\b(?:college|university|institute|school|academy|vidyalaya|campus|polytechnic|faculty|department|iit|nit|iiit|bits|mit)\b/i;
export const roleKeywordRegex = /\b(?:developer|engineer|manager|lead|analyst|designer|consultant|specialist|architect|intern|director|officer|executive|administrator|scientist|programmer|coordinator|assistant|associate|representative|technician|supervisor|founder|co-founder|cto|ceo|vp|head\s+of)\b/i;

function sanitizeTargetRole(val) {
  let cleaned = stripLabel(val, /^(?:target\s*role|target\s*job\s*role|job\s*title|role|position|title)\s*:\s*/i);
  // Never allow emails or phone numbers to bleed into target_role
  if (/[\w.-]+@[\w.-]+\.\w+/.test(cleaned)) {
    return '';
  }
  if (/^[\s\d+().-]{7,}$/.test(cleaned) || /^(?:phone|tel|email|mobile):/i.test(val)) {
    return '';
  }
  return cleaned;
}

function sanitizeSummary(val) {
  let cleaned = stripLabel(val, /^(?:professional\s*summary|executive\s*summary|summary|profile|about\s*me|objective|career\s*objective)\s*:\s*/i);
  // Strip accidental contact info prepended to summary
  cleaned = cleaned.replace(/^(?:phone|email|tel|mobile|name|full\s*name)\s*:\s*[^\n]+\n?/gi, '').trim();
  return cleaned;
}

export function sanitizeParsedResume(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;

  const pInfo = parsed.personal_info || {};
  const isInvalidLink = (val) => !val || typeof val !== 'string' || /^(?:n\/?a|none|not\s*provided|null|undefined|yourname|username)$/i.test(val.trim());

  let cleanLinkedin = stripLabel(pInfo.linkedin, /^(?:linkedin|linkedin\s*url|linkedin\s*profile)\s*:\s*/i);
  if (isInvalidLink(cleanLinkedin) || !/linkedin\.com/i.test(cleanLinkedin)) {
    cleanLinkedin = '';
  }

  let cleanGithub = stripLabel(pInfo.github, /^(?:github|github\s*url|github\s*profile)\s*:\s*/i);
  if (isInvalidLink(cleanGithub) || !/github\.com/i.test(cleanGithub)) {
    cleanGithub = '';
  }

  let cleanWebsite = stripLabel(pInfo.website, /^(?:website|portfolio|web)\s*:\s*/i);
  if (isInvalidLink(cleanWebsite) || /^(?:example\.com|website\.com|portfolio\.com)$/i.test(cleanWebsite.trim()) || /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(cleanWebsite)) {
    cleanWebsite = '';
  }

  const cleanedPersonalInfo = {
    fullName: stripLabel(pInfo.fullName, /^(?:name|full\s*name|candidate\s*name)\s*:\s*/i),
    email: stripLabel(pInfo.email, /^(?:email|email\s*address|e-mail)\s*:\s*/i),
    phone: stripLabel(pInfo.phone, /^(?:phone|phone\s*number|tel|telephone|mobile|cell)\s*:\s*/i),
    location: stripLabel(pInfo.location, /^(?:location|address|city|country)\s*:\s*/i),
    linkedin: cleanLinkedin,
    github: cleanGithub,
    website: cleanWebsite
  };

  const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/;
  if (cleanedPersonalInfo.email) {
    const emMatch = cleanedPersonalInfo.email.match(emailRegex);
    if (emMatch) cleanedPersonalInfo.email = emMatch[0];
  }

  const targetRole = sanitizeTargetRole(parsed.target_role || '');
  const summary = sanitizeSummary(parsed.summary || '');

  let skills = [];
  if (Array.isArray(parsed.skills)) {
    skills = parsed.skills
      .map(s => {
        if (typeof s !== 'string') return '';
        let cleaned = stripLabel(s, /^(?:skill|technology|tool)\s*:\s*/i);
        return cleaned.replace(/^[-•*]\s*/, '').trim();
      })
      .filter(Boolean);
  }

  let experience = [];
  if (Array.isArray(parsed.experience)) {
    experience = parsed.experience.map((e, idx) => {
      let company = stripLabel(e.company, /^(?:company|employer|organization)\s*:\s*/i);
      let role = stripLabel(e.role, /^(?:role|position|job\s*title|title)\s*:\s*/i);
      let startDate = stripLabel(e.startDate, /^(?:start\s*date|from)\s*:\s*/i);
      let endDate = stripLabel(e.endDate, /^(?:end\s*date|to)\s*:\s*/i);
      let year = stripLabel(e.year, /^(?:year|duration|dates?|period)\s*:\s*/i);

      // 1. Separate "Role at Company" if packed into role or company
      if (!company && role && /^(.+?)\s+(?:at|@)\s+(.+)$/i.test(role)) {
        const atMatch = role.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
        role = atMatch[1].trim();
        company = atMatch[2].trim();
      } else if (!role && company && /^(.+?)\s+(?:at|@)\s+(.+)$/i.test(company)) {
        const atMatch = company.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
        role = atMatch[1].trim();
        company = atMatch[2].trim();
      }

      // 2. Prevent dates from being mistaken for company or role
      if (isStandaloneDate(company)) {
        if (!startDate && !year) {
          const dt = extractDateTokens(company);
          startDate = dt.start || dt.raw;
          endDate = dt.end;
          year = dt.raw;
        }
        company = '';
      }
      if (isStandaloneDate(role)) {
        if (!startDate && !year) {
          const dt = extractDateTokens(role);
          startDate = dt.start || dt.raw;
          endDate = dt.end;
          year = dt.raw;
        }
        role = '';
      }

      // 3. Normalize duration fields
      if (!startDate && year) {
        const dt = extractDateTokens(year);
        startDate = dt.start || dt.raw;
        endDate = dt.end;
      } else if (startDate && endDate && !year) {
        year = `${startDate} - ${endDate}`;
      } else if (startDate && !year) {
        year = startDate;
      }

      return {
        id: e.id || `exp-${Date.now()}-${idx + 1}`,
        company,
        role,
        location: stripLabel(e.location, /^(?:location|city|country)\s*:\s*/i),
        startDate,
        endDate,
        year,
        description: typeof e.description === 'string' ? e.description.trim() : ''
      };
    }).filter(e => e.company || e.role);
  }

  let education = [];
  if (Array.isArray(parsed.education)) {
    education = parsed.education.map((ed, idx) => {
      let institution = stripLabel(ed.institution, /^(?:institution|school|university|college)\s*:\s*/i);
      let degree = stripLabel(ed.degree, /^(?:degree|major|program)\s*:\s*/i);
      let year = stripLabel(ed.year, /^(?:year|years|graduation|duration)\s*:\s*/i);

      // Prevent dates from becoming institution or degree
      if (isStandaloneDate(institution)) {
        if (!year) year = institution;
        institution = '';
      }
      if (isStandaloneDate(degree)) {
        if (!year) year = degree;
        degree = '';
      }

      // If "Degree, Institution" was packed into institution
      if (!degree && institution && (institution.includes(',') || institution.includes('|') || institution.includes(' - '))) {
        const sep = institution.includes('|') ? '|' : (institution.includes(',') ? ',' : ' - ');
        const parts = institution.split(sep).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const degIdx = parts.findIndex(p => degreeKeywordRegex.test(p));
          if (degIdx !== -1) {
            degree = parts[degIdx];
            institution = parts.filter((_, i) => i !== degIdx).join(', ');
          }
        }
      }

      return {
        id: ed.id || `edu-${Date.now()}-${idx + 1}`,
        institution,
        degree,
        year,
        score: stripLabel(ed.score, /^(?:score|gpa|grade|marks?)\s*:\s*/i)
      };
    }).filter(ed => ed.institution || ed.degree);
  }

  let projects = [];
  if (Array.isArray(parsed.projects)) {
    projects = parsed.projects.map((pr, idx) => ({
      id: pr.id || `proj-${Date.now()}-${idx + 1}`,
      name: stripLabel(pr.name, /^(?:project\s*name|project|title)\s*:\s*/i),
      description: typeof pr.description === 'string' ? pr.description.trim() : '',
      link: stripLabel(pr.link, /^(?:link|url|github)\s*:\s*/i)
    })).filter(pr => pr.name);
  }

  return {
    ...parsed,
    title: (parsed.title && parsed.title !== 'Imported Resume' && parsed.title !== 'Extracted Resume') ? parsed.title : (targetRole ? `${targetRole} Resume` : 'Imported Resume'),
    target_role: targetRole,
    personal_info: cleanedPersonalInfo,
    summary,
    skills,
    experience,
    education,
    projects
  };
}

export function parseResumeRuleBased(resumeText) {
  const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      title: 'Imported Resume',
      target_role: '',
      personal_info: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: []
    };
  }

  // 1. Regular expression matches for contact details
  const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w.-]+/i;
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+/i;
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.(?:com|org|net|io|dev|me|app)(?:\/[^\s]*)?/i;

  const emailMatch = resumeText.match(emailRegex);
  const phoneMatch = resumeText.match(phoneRegex);
  const linkedinMatch = resumeText.match(linkedinRegex);
  const githubMatch = resumeText.match(githubRegex);

  let website = '';
  const explicitWebLine = lines.find(l => /^(?:website|portfolio|web|blog)\s*:\s*/i.test(l));
  if (explicitWebLine) {
    website = stripLabel(explicitWebLine, /^(?:website|portfolio|web|blog)\s*:\s*/i);
  } else {
    // Only search the top header lines (first 10 non-empty lines) so body tech terms (e.g. vercel.app, node.js) are never misidentified
    const headerLines = lines.slice(0, 10).join(' ');
    const webMatches = headerLines.match(new RegExp(websiteRegex, 'gi')) || [];
    const nonPersonalHosts = /\b(?:linkedin\.com|github\.com|gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|google\.com|vercel\.app|netlify\.app|heroku\.com|aws\.amazon\.com|react\.dev|reactjs\.org|nodejs\.org|wikipedia\.org|stackoverflow\.com|medium\.com|npm\.im|npmjs\.com)\b/i;
    for (const m of webMatches) {
      if (!nonPersonalHosts.test(m)) {
        const isEmailDomain = new RegExp(`[\\w.-]+@${m.replace(/^https?:\\\/\\\//, '').replace(/^www\\./, '')}`, 'i').test(resumeText);
        if (!isEmailDomain) {
          website = m;
          break;
        }
      }
    }
  }

  // 2. Section categorization
  const sectionHeaders = [
    { type: 'summary', regex: /^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective)(?::\s*(.*))?$/i },
    { type: 'skills', regex: /^(?:technical\s+skills|core\s+competencies|key\s+skills|skills|technologies|tools\s+&?\s+technologies|skills\s+&?\s+tools)(?::\s*(.*))?$/i },
    { type: 'experience', regex: /^(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history|employment)(?::\s*(.*))?$/i },
    { type: 'education', regex: /^(?:education|academic\s+background|academic\s+qualifications|qualifications)(?::\s*(.*))?$/i },
    { type: 'projects', regex: /^(?:projects|personal\s+projects|key\s+projects|portfolio\s+projects)(?::\s*(.*))?$/i },
    { type: 'certifications', regex: /^(?:certifications|licenses\s+&?\s+certifications|certificates)(?::\s*(.*))?$/i }
  ];

  function getSectionMatch(line) {
    const clean = line.replace(/[-#*]+$/, '').trim();
    for (const sh of sectionHeaders) {
      const match = clean.match(sh.regex);
      if (match) {
        return { type: sh.type, inlineContent: (match[1] || '').trim() };
      }
    }
    return null;
  }

  const sections = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };

  let currentSection = 'header';
  for (const line of lines) {
    const detected = getSectionMatch(line);
    if (detected) {
      currentSection = detected.type;
      if (detected.inlineContent) {
        sections[currentSection].push(detected.inlineContent);
      }
      continue;
    }
    sections[currentSection].push(line);
  }

  // 3. Header processing for Name, Target Role, Location, Contact
  let extractedName = '';
  let extractedRole = '';
  let extractedLocation = '';
  let extractedEmail = '';
  let extractedPhone = '';
  let extractedLinkedin = '';
  let extractedGithub = '';
  let extractedWebsite = '';

  for (const line of sections.header) {
    if (/^(?:name|full\s*name|candidate\s*name)\s*:\s*/i.test(line)) {
      extractedName = stripLabel(line, /^(?:name|full\s*name|candidate\s*name)\s*:\s*/i);
    } else if (/^(?:target\s*role|target\s*job\s*role|job\s*title|role|position|title)\s*:\s*/i.test(line)) {
      extractedRole = sanitizeTargetRole(line);
    } else if (/^(?:email|email\s*address|e-mail)\s*:\s*/i.test(line)) {
      extractedEmail = stripLabel(line, /^(?:email|email\s*address|e-mail)\s*:\s*/i);
    } else if (/^(?:phone|phone\s*number|tel|telephone|mobile|cell)\s*:\s*/i.test(line)) {
      extractedPhone = stripLabel(line, /^(?:phone|phone\s*number|tel|telephone|mobile|cell)\s*:\s*/i);
    } else if (/^(?:location|address|city|country)\s*:\s*/i.test(line)) {
      extractedLocation = stripLabel(line, /^(?:location|address|city|country)\s*:\s*/i);
    } else if (/^(?:linkedin|linkedin\s*url|linkedin\s*profile)\s*:\s*/i.test(line)) {
      extractedLinkedin = stripLabel(line, /^(?:linkedin|linkedin\s*url|linkedin\s*profile)\s*:\s*/i);
    } else if (/^(?:github|github\s*url|github\s*profile)\s*:\s*/i.test(line)) {
      extractedGithub = stripLabel(line, /^(?:github|github\s*url|github\s*profile)\s*:\s*/i);
    } else if (/^(?:website|portfolio|web)\s*:\s*/i.test(line)) {
      extractedWebsite = stripLabel(line, /^(?:website|portfolio|web)\s*:\s*/i);
    }
  }

  if (!extractedName && sections.header.length > 0) {
    for (let i = 0; i < Math.min(3, sections.header.length); i++) {
      const line = sections.header[i];
      if (
        emailRegex.test(line) ||
        phoneRegex.test(line) ||
        linkedinRegex.test(line) ||
        githubRegex.test(line) ||
        /^(?:target\s*role|role|title|location|address):/i.test(line)
      ) {
        continue;
      }
      extractedName = stripLabel(line, /^(?:name|full\s*name):\s*/i);
      break;
    }
  }

  if (!extractedRole && sections.header.length > 1) {
    for (let i = 0; i < sections.header.length; i++) {
      const line = sections.header[i];
      if (
        line === extractedName ||
        /^(?:name|full\s*name|candidate\s*name)\s*:/i.test(line) ||
        (extractedName && line.toLowerCase().includes(extractedName.toLowerCase()))
      ) {
        continue;
      }
      if (
        emailRegex.test(line) ||
        phoneRegex.test(line) ||
        linkedinRegex.test(line) ||
        githubRegex.test(line) ||
        /^(?:phone|email|location|address):/i.test(line) ||
        /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(line)
      ) {
        if (!extractedLocation && /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(line)) {
          extractedLocation = line;
        }
        continue;
      }
      if (line.length < 60 && !line.includes('|')) {
        extractedRole = sanitizeTargetRole(line);
        break;
      }
    }
  }

  if (!extractedLocation) {
    for (const line of sections.header) {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        for (const p of parts) {
          if (!emailRegex.test(p) && !phoneRegex.test(p) && !linkedinRegex.test(p) && !githubRegex.test(p) && !p.startsWith('http') && p.length > 2 && p.length < 50) {
            extractedLocation = stripLabel(p, /^(?:location|address):/i);
            break;
          }
        }
      }
      if (extractedLocation) break;
    }
  }

  // 4. Summary Parsing
  let summary = '';
  if (sections.summary.length > 0) {
    summary = sanitizeSummary(sections.summary.join(' '));
  }

  // 5. Skills Parsing
  const skills = [];
  if (sections.skills.length > 0) {
    for (const line of sections.skills) {
      const cleanLine = line.replace(/^(?:languages|frontend|backend|frameworks|database|databases|tools|technologies|cloud|devops)\s*:\s*/i, '');
      const tokens = cleanLine.split(/[,;•|\*]+/).map(s => s.trim()).filter(Boolean);
      for (const tok of tokens) {
        const cleanedTok = tok.replace(/^[-•*]\s*/, '').trim();
        if (cleanedTok.length > 1 && cleanedTok.length < 50 && !skills.includes(cleanedTok)) {
          skills.push(cleanedTok);
        }
      }
    }
  }

  // 6. Experience Parsing
  const experience = [];
  if (sections.experience.length > 0) {
    let currentExp = null;

    const commitExp = () => {
      if (currentExp && (currentExp.company || currentExp.role)) {
        if (isStandaloneDate(currentExp.company)) {
          if (!currentExp.startDate && !currentExp.year) {
            const dt = extractDateTokens(currentExp.company);
            currentExp.startDate = dt.start || dt.raw;
            currentExp.endDate = dt.end;
            currentExp.year = dt.raw;
          }
          currentExp.company = '';
        }
        if (isStandaloneDate(currentExp.role)) {
          if (!currentExp.startDate && !currentExp.year) {
            const dt = extractDateTokens(currentExp.role);
            currentExp.startDate = dt.start || dt.raw;
            currentExp.endDate = dt.end;
            currentExp.year = dt.raw;
          }
          currentExp.role = '';
        }
        if (currentExp.company || currentExp.role) {
          experience.push({
            ...currentExp,
            id: currentExp.id || `exp-${Date.now()}-${experience.length + 1}`
          });
        }
      }
      currentExp = null;
    };

    for (let i = 0; i < sections.experience.length; i++) {
      const line = sections.experience[i];
      const isBullet = /^[-•*]\s*/.test(line);

      // 1. Standalone date line
      if (isStandaloneDate(line)) {
        const dt = extractDateTokens(line);
        // If currentExp already has dates and description, this date line must belong to the next job entry
        if (currentExp && (currentExp.startDate || currentExp.year) && currentExp.description) {
          commitExp();
        }
        if (currentExp) {
          currentExp.startDate = dt.start || dt.raw;
          currentExp.endDate = dt.end;
          currentExp.year = dt.raw;
        } else {
          currentExp = {
            role: '',
            company: '',
            location: '',
            startDate: dt.start || dt.raw,
            endDate: dt.end,
            year: dt.raw,
            description: ''
          };
        }
        continue;
      }

      // 2. Bullet point line
      if (isBullet) {
        if (currentExp) {
          const bulletText = line.replace(/^[-•*]\s*/, '').trim();
          if (bulletText) {
            currentExp.description = currentExp.description
              ? `${currentExp.description}\n• ${bulletText}`
              : `• ${bulletText}`;
          }
        }
        continue;
      }

      // 3. Explicit labels
      if (/^(?:company|employer|organization)\s*:\s*/i.test(line)) {
        if (!currentExp || currentExp.company) commitExp();
        if (!currentExp) currentExp = { company: '', role: '', location: '', startDate: '', endDate: '', year: '', description: '' };
        currentExp.company = stripLabel(line, /^(?:company|employer|organization)\s*:\s*/i);
        continue;
      }
      if (/^(?:role|position|job\s*title|title)\s*:\s*/i.test(line)) {
        if (!currentExp || currentExp.role) commitExp();
        if (!currentExp) currentExp = { company: '', role: '', location: '', startDate: '', endDate: '', year: '', description: '' };
        currentExp.role = stripLabel(line, /^(?:role|position|job\s*title|title)\s*:\s*/i);
        continue;
      }
      if (/^(?:duration|dates?|period)\s*:\s*/i.test(line)) {
        const dtStr = stripLabel(line, /^(?:duration|dates?|period)\s*:\s*/i);
        const dt = extractDateTokens(dtStr);
        if (currentExp) {
          currentExp.startDate = dt.start || dt.raw;
          currentExp.endDate = dt.end;
          currentExp.year = dt.raw;
        }
        continue;
      }

      // 4. Pipe-separated: "Frontend Developer | Test Company | 2025-2026"
      if (line.includes('|')) {
        commitExp();
        const parts = line.split('|').map(p => p.trim());
        let r = '';
        let c = '';
        let d = '';
        let loc = '';

        for (const p of parts) {
          if (isStandaloneDate(p)) {
            d = p;
          } else if (!r && /(?:developer|engineer|manager|lead|analyst|designer|consultant|specialist|architect|intern|director|officer|executive|administrator)/i.test(p)) {
            r = p;
          } else if (!c) {
            c = p;
          } else if (!r) {
            r = p;
          } else if (!loc) {
            loc = p;
          }
        }

        const dt = extractDateTokens(d);
        currentExp = {
          role: stripLabel(r, /^(?:role|position|title)\s*:\s*/i),
          company: stripLabel(c, /^(?:company|employer)\s*:\s*/i),
          location: loc,
          startDate: dt.start || dt.raw,
          endDate: dt.end,
          year: dt.raw,
          description: ''
        };
        continue;
      }

      // 5. "Role at / @ Company" pattern
      const atMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
      if (atMatch && !isStandaloneDate(atMatch[1]) && !isStandaloneDate(atMatch[2])) {
        commitExp();
        let r = atMatch[1].trim();
        let c = atMatch[2].trim();
        let d = '';

        const parenDate = c.match(/\(([^)]+)\)$/);
        if (parenDate && isStandaloneDate(parenDate[1])) {
          d = parenDate[1];
          c = c.replace(/\([^)]+\)$/, '').trim();
        }

        const dt = extractDateTokens(d);
        currentExp = {
          role: stripLabel(r, /^(?:role|position|title)\s*:\s*/i),
          company: stripLabel(c, /^(?:company|employer)\s*:\s*/i),
          location: '',
          startDate: dt.start || dt.raw,
          endDate: dt.end,
          year: dt.raw,
          description: ''
        };
        continue;
      }

      // 6. Dash-separated: "Frontend Developer - Test Company"
      const dashParts = line.split(/\s*[-–—]\s*/);
      if (dashParts.length === 2 && !isStandaloneDate(line) && dashParts[0].length < 60 && dashParts[1].length < 60) {
        commitExp();
        let r = dashParts[0].trim();
        let c = dashParts[1].trim();
        if (/(?:developer|engineer|manager|lead|analyst|designer|consultant|specialist|architect|intern)/i.test(c)) {
          const tmp = r; r = c; c = tmp;
        }
        currentExp = {
          role: stripLabel(r, /^(?:role|position|title)\s*:\s*/i),
          company: stripLabel(c, /^(?:company|employer)\s*:\s*/i),
          location: '',
          startDate: '',
          endDate: '',
          year: '',
          description: ''
        };
        continue;
      }

      // 7. Boundary detection for new job entry
      if (currentExp && currentExp.description && !isBullet) {
        const isRoleLine = roleKeywordRegex.test(line) && line.length < 75;
        const nextLine = sections.experience[i + 1] || '';
        const lineAfterNext = sections.experience[i + 2] || '';
        const isNextLineRoleOrDate = (roleKeywordRegex.test(nextLine) && nextLine.length < 75) || isStandaloneDate(nextLine) || isStandaloneDate(lineAfterNext);

        if (isRoleLine || (isNextLineRoleOrDate && line.length < 75 && !line.endsWith('.'))) {
          commitExp();
          if (isRoleLine) {
            currentExp = {
              role: stripLabel(line, /^(?:role|position|title)\s*:\s*/i),
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              year: '',
              description: ''
            };
          } else {
            currentExp = {
              role: '',
              company: stripLabel(line, /^(?:company|employer)\s*:\s*/i),
              location: '',
              startDate: '',
              endDate: '',
              year: '',
              description: ''
            };
          }
          continue;
        }
      }

      // 8. Multi-line entry association
      if (!currentExp) {
        currentExp = {
          role: line,
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          year: '',
          description: ''
        };
      } else if (!currentExp.company && !currentExp.description) {
        currentExp.company = line;
      } else if (!currentExp.role && currentExp.company && !currentExp.description) {
        currentExp.role = line;
      } else {
        currentExp.description = currentExp.description
          ? `${currentExp.description}\n• ${line}`
          : `• ${line}`;
      }
    }
    commitExp();
  }

  // 7. Education Parsing
  const education = [];
  if (sections.education.length > 0) {
    let currentEdu = null;

    const commitEdu = () => {
      if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
        if (isStandaloneDate(currentEdu.institution)) {
          if (!currentEdu.year) currentEdu.year = currentEdu.institution;
          currentEdu.institution = '';
        }
        if (isStandaloneDate(currentEdu.degree)) {
          if (!currentEdu.year) currentEdu.year = currentEdu.degree;
          currentEdu.degree = '';
        }
        if (currentEdu.institution || currentEdu.degree) {
          education.push({
            ...currentEdu,
            id: currentEdu.id || `edu-${Date.now()}-${education.length + 1}`
          });
        }
      }
      currentEdu = null;
    };

    for (let i = 0; i < sections.education.length; i++) {
      const line = sections.education[i];

      // 1. Standalone date line
      if (isStandaloneDate(line)) {
        if (currentEdu) {
          const dt = extractDateTokens(line);
          currentEdu.year = dt.raw || line.trim();
        }
        continue;
      }

      // 2. Score or Grade
      if (/^(?:score|cgpa|gpa|grade|percentage|marks?)\s*:\s*/i.test(line) || /\b\d(?:\.\d{1,2})?\s*(?:cgpa|gpa)\b/i.test(line) || /\b\d{2}(?:\.\d{1,2})?%/i.test(line)) {
        if (currentEdu) {
          currentEdu.score = stripLabel(line, /^(?:score|cgpa|gpa|grade|percentage|marks?)\s*:\s*/i);
        }
        continue;
      }

      // 3. Explicit labels
      if (/^(?:institution|school|university|college)\s*:\s*/i.test(line)) {
        if (!currentEdu || currentEdu.institution) commitEdu();
        if (!currentEdu) currentEdu = { institution: '', degree: '', year: '', score: '' };
        currentEdu.institution = stripLabel(line, /^(?:institution|school|university|college)\s*:\s*/i);
        continue;
      }
      if (/^(?:degree|major|program|course)\s*:\s*/i.test(line)) {
        if (!currentEdu || currentEdu.degree) commitEdu();
        if (!currentEdu) currentEdu = { institution: '', degree: '', year: '', score: '' };
        currentEdu.degree = stripLabel(line, /^(?:degree|major|program|course)\s*:\s*/i);
        continue;
      }
      if (/^(?:passing\s*year|year|graduation|duration)\s*:\s*/i.test(line)) {
        if (currentEdu) {
          currentEdu.year = stripLabel(line, /^(?:passing\s*year|year|graduation|duration)\s*:\s*/i);
        }
        continue;
      }

      // 4. Delimited line: "BCA, Test College" or "B.Tech | GTU | 2017-2021"
      if (line.includes('|') || line.includes(',') || line.includes(' - ')) {
        const separator = line.includes('|') ? '|' : (line.includes(',') ? ',' : ' - ');
        const parts = line.split(separator).map(p => p.trim()).filter(Boolean);

        let deg = '';
        let inst = '';
        let yr = '';

        for (const p of parts) {
          if (isStandaloneDate(p)) {
            yr = p;
          } else if (degreeKeywordRegex.test(p) && !deg) {
            deg = p;
          } else if (instKeywordRegex.test(p) && !inst) {
            inst = p;
          } else if (!inst && !degreeKeywordRegex.test(p)) {
            inst = p;
          } else if (!deg) {
            deg = p;
          }
        }

        if (deg || inst) {
          commitEdu();
          currentEdu = {
            degree: stripLabel(deg, /^(?:degree|major)\s*:\s*/i),
            institution: stripLabel(inst, /^(?:institution|school|university|college)\s*:\s*/i),
            year: yr,
            score: ''
          };
          continue;
        }
      }

      // Check if currentEdu is already complete and a new entry is starting
      if (currentEdu && ((currentEdu.institution && currentEdu.degree) || currentEdu.year)) {
        commitEdu();
      }

      // 5. Degree keyword line
      if (degreeKeywordRegex.test(line)) {
        if (!currentEdu || currentEdu.degree) commitEdu();
        if (!currentEdu) currentEdu = { institution: '', degree: '', year: '', score: '' };
        currentEdu.degree = line;
        continue;
      }

      // 6. Institution keyword line
      if (instKeywordRegex.test(line)) {
        if (!currentEdu || currentEdu.institution) commitEdu();
        if (!currentEdu) currentEdu = { institution: '', degree: '', year: '', score: '' };
        currentEdu.institution = line;
        continue;
      }

      // 7. General fallback
      if (!currentEdu) {
        if (degreeKeywordRegex.test(line)) {
          currentEdu = { institution: '', degree: line, year: '', score: '' };
        } else {
          currentEdu = { institution: line, degree: '', year: '', score: '' };
        }
      } else if (!currentEdu.institution && !degreeKeywordRegex.test(line)) {
        currentEdu.institution = line;
      } else if (!currentEdu.degree) {
        currentEdu.degree = line;
      } else if (!currentEdu.institution) {
        currentEdu.institution = line;
      }
    }
    commitEdu();
  }

  // 8. Projects Parsing
  const projects = [];
  if (sections.projects.length > 0) {
    let currentProj = null;

    const commitProj = () => {
      if (currentProj && currentProj.name) {
        projects.push({
          ...currentProj,
          id: currentProj.id || `proj-${Date.now()}-${projects.length + 1}`
        });
      }
      currentProj = null;
    };

    for (let pi = 0; pi < sections.projects.length; pi++) {
      const line = sections.projects[pi];
      const isBullet = /^[-•*]\s*/.test(line);

      // 1. Explicit project label
      if (/^(?:project\s*name|project\s*title|project)\s*:\s*/i.test(line)) {
        commitProj();
        const raw = stripLabel(line, /^(?:project\s*name|project\s*title|project)\s*:\s*/i);
        const urlMatch = raw.match(/(?:https?:\/\/[^\s]+|github\.com\/[^\s]+)/i);
        currentProj = {
          name: urlMatch ? raw.replace(urlMatch[0], '').replace(/[|\-–—()]+/g, '').trim() : raw,
          description: '',
          link: urlMatch ? urlMatch[0] : ''
        };
        continue;
      }

      // 2. Pipe-delimited: "Project Name | Link/Tech"
      if (line.includes('|')) {
        commitProj();
        const parts = line.split('|').map(p => p.trim());
        const linkPart = parts.find(p => /(?:https?:\/\/|github\.com)/i.test(p)) || '';
        const namePart = parts[0] !== linkPart ? parts[0] : (parts[1] || parts[0]);
        currentProj = {
          name: namePart || '',
          description: '',
          link: linkPart
        };
        continue;
      }

      // 3. Standalone URL line
      const isPureUrl = /^(?:https?:\/\/|www\.|github\.com\/)/i.test(line.trim());
      if (isPureUrl) {
        if (currentProj) {
          const match = line.match(/(?:https?:\/\/[^\s]+|github\.com\/[^\s]+)/i);
          if (match) currentProj.link = match[0];
        }
        continue;
      }

      if (isBullet) {
        if (currentProj) {
          const descLine = line.replace(/^[-•*]\s*/, '').trim();
          if (descLine) {
            currentProj.description = currentProj.description
              ? `${currentProj.description}\n• ${descLine}`
              : `• ${descLine}`;
          }
        }
        continue;
      }

      // 4. Boundary detection for new project entry
      if (currentProj && currentProj.name && currentProj.description && !isBullet) {
        const isActionSentence = /^(?:built|developed|implemented|designed|created|engineered|managed|led|maintained|architected|collaborated|configured|optimized|automated)\b/i.test(line);
        const endsWithPunctuation = /[.;]$/.test(line.trim());
        const isShortHeadline = line.length < 75 && !endsWithPunctuation && !isActionSentence;

        const nextLine = (sections.projects[pi + 1] || '').trim();
        const nextIsBullet = /^[-•*]\s*/.test(nextLine);
        const nextIsTechOrUrl = /(?:https?:\/\/|github\.com)/i.test(nextLine) || (nextLine.includes(',') && nextLine.length < 80);

        if (isShortHeadline && (nextIsBullet || nextIsTechOrUrl || currentProj.description.includes('•') || currentProj.description.length > 50)) {
          commitProj();
          currentProj = {
            name: stripLabel(line, /^(?:project\s*name|project)\s*:\s*/i),
            description: '',
            link: ''
          };
          continue;
        }
      }

      // Title line (< 60 chars) or new project
      if (!currentProj || !currentProj.name) {
        currentProj = {
          name: stripLabel(line, /^(?:project\s*name|project)\s*:\s*/i),
          description: '',
          link: ''
        };
      } else if (!currentProj.description) {
        currentProj.description = line;
      } else {
        currentProj.description = `${currentProj.description} ${line}`;
      }
    }
    commitProj();
  }

  const result = {
    title: extractedRole ? `${extractedRole} Resume` : 'Imported Resume',
    target_role: extractedRole,
    personal_info: {
      fullName: extractedName,
      email: extractedEmail || (emailMatch ? emailMatch[0] : ''),
      phone: extractedPhone || (phoneMatch ? phoneMatch[0] : ''),
      location: extractedLocation,
      linkedin: extractedLinkedin || (linkedinMatch ? linkedinMatch[0] : ''),
      github: extractedGithub || (githubMatch ? githubMatch[0] : ''),
      website: extractedWebsite || website || ''
    },
    summary,
    skills,
    experience,
    education,
    projects
  };

  return sanitizeParsedResume(result);
}

// 8. Smart Resume Parser (Extract unstructured text into structured resume)
export async function parseResumeText(req, res) {
  try {
    const userId = req.user?.id;
    const { resumeText } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: 'Resume text is required.' });
    }

    const prompt = `
You are an advanced Resume Parsing Engine.
Parse the following raw resume text and extract all details into a clean, complete structured JSON object.

CRITICAL EXTRACTION RULES:
- Extract ONLY clean values. DO NOT include field labels such as "Name:", "Email:", "Phone:", "Target Role:", "Summary:", or "Company:" in any field value.
- "target_role" MUST be the candidate's professional job title or target role. NEVER put email, phone number, address, or other contact info in "target_role".
- "summary" MUST be strictly the professional summary, profile, or objective. NEVER prepend or concatenate email, phone, skills, or other sections into "summary".
- If a field is not present in the text, leave it as an empty string or empty array. DO NOT invent details.

RAW RESUME TEXT:
"""${resumeText.substring(0, 4000)}"""

Return ONLY valid JSON matching this schema:
{
  "title": "Clean Role Title or Imported Resume",
  "target_role": "Target or Most Recent Job Title",
  "personal_info": {
    "fullName": "Name found in text or empty",
    "email": "Email address or empty",
    "phone": "Phone number or empty",
    "location": "City, State or Country or empty",
    "linkedin": "LinkedIn URL or empty",
    "github": "GitHub URL or empty",
    "website": ""
  },
  "summary": "Extracted professional summary",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "location": "Location",
      "startDate": "Start date",
      "endDate": "End date",
      "description": "• Responsibilities in bullet points"
    }
  ],
  "education": [
    {
      "institution": "School/College",
      "degree": "Degree/Branch",
      "year": "Years",
      "score": "Score or empty"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project details",
      "link": "Link if present"
    }
  ]
}
`;

    let parsed = null;
    let isAi = false;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 8192 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          parsed = sanitizeParsedResume(parsed);
          isAi = true;
        }
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini parser fallback:', err.message);
    }

    if (truncationError) {
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: 'Resume parsing was truncated due to document length. Please try again or paste sections.'
      });
    }

    if (!parsed) {
      // Robust rule-based extraction
      parsed = parseResumeRuleBased(resumeText);
    }

    if (isAi && userId) {
      await recordAiOperation(userId);
    }

    res.json({
      success: true,
      resume: parsed,
      aiPowered: isAi,
      analysisMode: isAi ? 'ai' : 'rule-based'
    });
  } catch (error) {
    console.error('Resume parse error:', error);
    res.status(500).json({ success: false, message: 'Failed to parse resume.' });
  }
}


// 9. Real AI Interactive Interview Practice Evaluator (STAR Method)
export async function evaluateInterview(req, res) {
  try {
    const userId = req.user?.id;
    const { question, answer, resume, targetRole } = req.body;
    const clientKey = req.headers['x-gemini-api-key'];

    if (!question || !answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Both interview question and candidate answer are required for evaluation.'
      });
    }

    const role = targetRole || resume?.target_role || 'Software Professional';
    const candidateSkills = Array.isArray(resume?.skills) ? resume.skills.join(', ') : '';

    const prompt = `
You are a Lead Hiring Manager and Senior Recruiter evaluating a candidate's practice interview response.
Evaluate the answer with objective technical depth and STAR framework standards.

CONTEXT:
Target Role: "${role}"
Candidate Skills (Context): ${candidateSkills || 'Not specified'}
Interview Question: "${question}"
Candidate Answer:
"""${answer.trim().substring(0, 3000)}"""

EVALUATION CRITERIA:
1. Relevance to the question
2. Technical correctness and domain knowledge (when applicable)
3. Problem-solving approach
4. Ownership and personal contribution
5. Clarity of communication
6. STAR method structure (Situation, Task, Action, Result)
7. Specificity (avoiding vague buzzwords)
8. Results and measurable impact
9. Role alignment for "${role}"

STRICT INTEGRITY RULES:
- NEVER invent or assume companies, project names, achievements, or metrics that the candidate did not mention.
- If the candidate did not provide a quantifiable metric or result, DO NOT invent numbers (such as "35% faster" or "99.9% uptime"). Instead, in the improved answer use the placeholder: "[Add a real measurable result if available]".
- Score realistically from 0 to 100 based strictly on provided evidence. Do not artificially inflate scores.

Output ONLY a valid JSON object matching this exact schema:
{
  "score": <overall score 0-100>,
  "starScore": <STAR structure score 0-100>,
  "relevanceScore": <relevance score 0-100>,
  "technicalDepthScore": <technical depth score 0-100>,
  "communicationScore": <communication score 0-100>,
  "strengths": ["<strength 1 based on actual answer>", "<strength 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
  "starBreakdown": {
    "situation": {
      "present": <boolean>,
      "feedback": "<concise feedback on Situation>"
    },
    "task": {
      "present": <boolean>,
      "feedback": "<concise feedback on Task>"
    },
    "action": {
      "present": <boolean>,
      "feedback": "<concise feedback on Action>"
    },
    "result": {
      "present": <boolean>,
      "feedback": "<concise feedback on Result>"
    }
  },
  "missingElements": ["<missing element 1>"],
  "followUpQuestions": ["<realistic follow-up question 1>", "<realistic follow-up question 2>"],
  "improvedAnswer": "<A polished version of the candidate's actual answer using STAR structure. Keeps strictly to candidate's own facts; uses [Add a real measurable result if available] where metrics are needed.>"
}
`;

    let evaluation = null;
    let truncationError = false;
    try {
      const responseText = await callGemini(prompt, clientKey, { maxOutputTokens: 4000 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        evaluation = JSON.parse(cleaned);
      }
    } catch (err) {
      if (err.isTruncated) truncationError = true;
      console.warn('Gemini interview evaluation call failed:', err.message);
    }

    if (truncationError || !evaluation || typeof evaluation.score !== 'number') {
      // Per PART 4: If Gemini is unavailable or truncated, DO NOT generate a fake AI score.
      return res.status(503).json({
        success: false,
        aiPowered: false,
        code: 'AI_UNAVAILABLE',
        message: truncationError
          ? 'AI evaluation was truncated due to answer length. Please provide a more concise answer and try again.'
          : 'AI evaluation is currently unavailable. Please configure Gemini AI and try again.'
      });
    }

    if (userId) {
      await recordAiOperation(userId);
    }

    return res.json({
      success: true,
      aiPowered: true,
      analysisMode: 'ai',
      ...evaluation
    });
  } catch (error) {
    console.error('Evaluate interview error:', error);
    return res.status(500).json({
      success: false,
      aiPowered: false,
      code: 'SERVER_ERROR',
      message: 'Failed to evaluate interview answer.'
    });
  }
}
