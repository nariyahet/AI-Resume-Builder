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

    let prompt = `
You are a Lead Technical Interviewer and Recruiter.
Based on the candidate's resume and target role "${role}", generate 5 realistic interview questions (3 technical + 2 behavioral/situational) along with expert model answers and key advice.
Candidate Skills: ${(resume?.skills || []).join(', ')}
`;

    if (isRegenerate && prevList.length > 0) {
      prompt += `
CRITICAL INSTRUCTION FOR REGENERATION:
The candidate requested a fresh set of questions. You MUST generate 5 completely NEW and DIFFERENT questions. Do NOT repeat or closely rephrase any of these previous questions:
${prevList.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}
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
        temperature: isRegenerate ? 0.85 : 0.7
      });
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        questions = JSON.parse(cleaned);
        if (Array.isArray(questions) && questions.length > 0) {
          isAi = true;
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

    if (!questions || !Array.isArray(questions)) {
      const fallbackPool = [
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
          type: 'Behavioral',
          question: 'Describe a time when you disagreed with a teammate or technical decision. How did you handle it?',
          idealAnswer: 'Use STAR: Situation was a differing viewpoint on architecture or priorities; Task was reaching alignment; Action was evaluating trade-offs with data objectively; Result was consensus and delivery.',
          proTip: 'Focus on collaborative resolution and shared project goals.'
        },
        {
          type: 'Behavioral',
          question: 'Tell me about a challenging bug or production incident you investigated and resolved.',
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
        }
      ];

      if (isRegenerate && prevList.length > 0) {
        // Filter out questions previously seen by comparing normalized question prefix
        const remaining = fallbackPool.filter(item =>
          !prevList.some(prev => prev.toLowerCase().includes(item.question.slice(0, 25).toLowerCase()))
        );
        const techPool = remaining.filter(q => q.type === 'Technical');
        const behavPool = remaining.filter(q => q.type === 'Behavioral');

        const selectedTech = techPool.slice(0, 3);
        const selectedBehav = behavPool.slice(0, 2);
        questions = [...selectedTech, ...selectedBehav];

        if (questions.length < 5) {
          const needed = 5 - questions.length;
          const filler = fallbackPool.filter(q => !questions.some(sel => sel.question === q.question)).slice(0, needed);
          questions = [...questions, ...filler];
        }
      } else {
        questions = fallbackPool.slice(0, 3).concat(fallbackPool.slice(6, 8));
      }
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
  const cleanedPersonalInfo = {
    fullName: stripLabel(pInfo.fullName, /^(?:name|full\s*name|candidate\s*name)\s*:\s*/i),
    email: stripLabel(pInfo.email, /^(?:email|email\s*address|e-mail)\s*:\s*/i),
    phone: stripLabel(pInfo.phone, /^(?:phone|phone\s*number|tel|telephone|mobile|cell)\s*:\s*/i),
    location: stripLabel(pInfo.location, /^(?:location|address|city|country)\s*:\s*/i),
    linkedin: stripLabel(pInfo.linkedin, /^(?:linkedin|linkedin\s*url|linkedin\s*profile)\s*:\s*/i),
    github: stripLabel(pInfo.github, /^(?:github|github\s*url|github\s*profile)\s*:\s*/i),
    website: stripLabel(pInfo.website, /^(?:website|portfolio|web)\s*:\s*/i)
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
    experience = parsed.experience.map(e => ({
      company: stripLabel(e.company, /^(?:company|employer|organization)\s*:\s*/i),
      role: stripLabel(e.role, /^(?:role|position|job\s*title|title)\s*:\s*/i),
      location: stripLabel(e.location, /^(?:location|city|country)\s*:\s*/i),
      startDate: stripLabel(e.startDate, /^(?:start\s*date|from)\s*:\s*/i),
      endDate: stripLabel(e.endDate, /^(?:end\s*date|to)\s*:\s*/i),
      description: typeof e.description === 'string' ? e.description.trim() : ''
    })).filter(e => e.company || e.role);
  }

  let education = [];
  if (Array.isArray(parsed.education)) {
    education = parsed.education.map(ed => ({
      institution: stripLabel(ed.institution, /^(?:institution|school|university|college)\s*:\s*/i),
      degree: stripLabel(ed.degree, /^(?:degree|major|program)\s*:\s*/i),
      year: stripLabel(ed.year, /^(?:year|years|graduation)\s*:\s*/i),
      score: stripLabel(ed.score, /^(?:score|gpa|grade)\s*:\s*/i)
    })).filter(ed => ed.institution || ed.degree);
  }

  let projects = [];
  if (Array.isArray(parsed.projects)) {
    projects = parsed.projects.map(pr => ({
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
  const webMatches = resumeText.match(new RegExp(websiteRegex, 'gi')) || [];
  for (const m of webMatches) {
    if (!m.includes('linkedin.com') && !m.includes('github.com')) {
      const isEmailDomain = new RegExp(`[\\w.-]+@${m.replace(/^https?:\\\/\\\//, '').replace(/^www\\./, '')}`, 'i').test(resumeText);
      if (!isEmailDomain) {
        website = m;
        break;
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
    for (const line of sections.experience) {
      const dateRangeMatch = line.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?\d{4}\s*(?:-|–|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|present|\d{4})/i);
      const isBullet = /^[-•*]\s*/.test(line);

      if (!isBullet && (line.includes('|') || dateRangeMatch || /^(?:company|role|title):/i.test(line))) {
        if (currentExp && (currentExp.company || currentExp.role)) {
          experience.push(currentExp);
        }
        let comp = '';
        let role = '';
        let start = '';
        let end = '';
        let loc = '';

        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          comp = parts[0] || '';
          role = parts[1] || '';
          if (parts[2]) {
            if (dateRangeMatch) {
              const dParts = parts[2].split(/[-–]|to/i).map(s => s.trim());
              start = dParts[0] || '';
              end = dParts[1] || '';
            } else {
              loc = parts[2];
            }
          }
        } else if (/^(?:company|organization)\s*:\s*/i.test(line)) {
          comp = stripLabel(line, /^(?:company|organization)\s*:\s*/i);
        } else if (/^(?:role|position|title)\s*:\s*/i.test(line)) {
          role = stripLabel(line, /^(?:role|position|title)\s*:\s*/i);
        } else {
          comp = line;
        }

        currentExp = {
          company: stripLabel(comp, /^(?:company|employer)\s*:\s*/i),
          role: stripLabel(role, /^(?:role|position|title)\s*:\s*/i),
          location: loc,
          startDate: start,
          endDate: end,
          description: ''
        };
      } else if (currentExp) {
        const bulletText = line.replace(/^[-•*]\s*/, '').trim();
        if (bulletText) {
          currentExp.description = currentExp.description
            ? `${currentExp.description}\n• ${bulletText}`
            : `• ${bulletText}`;
        }
      }
    }
    if (currentExp && (currentExp.company || currentExp.role)) {
      experience.push(currentExp);
    }
  }

  // 7. Education Parsing
  const education = [];
  if (sections.education.length > 0) {
    let currentEdu = null;
    for (const line of sections.education) {
      if (/^(?:institution|school|university|college)\s*:\s*/i.test(line) || line.includes('|') || /(?:bachelor|master|phd|associate|b\.s\.|b\.a\.|m\.s\.|m\.a\.|diploma|degree)/i.test(line)) {
        if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
          education.push(currentEdu);
        }
        let inst = '';
        let deg = '';
        let yr = '';
        const yearMatch = line.match(/\b(19\d{2}|20\d{2})\s*(?:-|–|to)?\s*(19\d{2}|20\d{2})?\b/);

        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          inst = parts[0] || '';
          deg = parts[1] || '';
          yr = parts[2] || (yearMatch ? yearMatch[0] : '');
        } else if (/^(?:institution|school|university)\s*:\s*/i.test(line)) {
          inst = stripLabel(line, /^(?:institution|school|university)\s*:\s*/i);
        } else if (/^(?:degree|major|program)\s*:\s*/i.test(line)) {
          deg = stripLabel(line, /^(?:degree|major|program)\s*:\s*/i);
        } else {
          inst = line;
        }

        currentEdu = {
          institution: stripLabel(inst, /^(?:institution|school|university)\s*:\s*/i),
          degree: stripLabel(deg, /^(?:degree|major)\s*:\s*/i),
          year: yr || (yearMatch ? yearMatch[0] : ''),
          score: ''
        };
      } else if (currentEdu && !currentEdu.degree && line.length < 80) {
        currentEdu.degree = stripLabel(line, /^(?:degree|major)\s*:\s*/i);
      }
    }
    if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
      education.push(currentEdu);
    }
  }

  // 8. Projects Parsing
  const projects = [];
  if (sections.projects.length > 0) {
    let currentProj = null;
    for (const line of sections.projects) {
      const isBullet = /^[-•*]\s*/.test(line);
      if (!isBullet && (/^(?:project\s*name|project)\s*:\s*/i.test(line) || (line.length < 60 && !line.includes('http')))) {
        if (currentProj && currentProj.name) {
          projects.push(currentProj);
        }
        currentProj = {
          name: stripLabel(line, /^(?:project\s*name|project)\s*:\s*/i),
          description: '',
          link: ''
        };
      } else if (currentProj) {
        if (/https?:\/\//i.test(line)) {
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          if (urlMatch) currentProj.link = urlMatch[0];
        } else {
          const descLine = line.replace(/^[-•*]\s*/, '').trim();
          if (descLine) {
            currentProj.description = currentProj.description
              ? `${currentProj.description} ${descLine}`
              : descLine;
          }
        }
      }
    }
    if (currentProj && currentProj.name) {
      projects.push(currentProj);
    }
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
