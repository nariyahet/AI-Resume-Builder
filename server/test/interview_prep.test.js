import test from 'node:test';
import assert from 'node:assert/strict';
import { generateInterviewPrep } from '../controllers/aiController.js';

test('Issues 7 & 8: Interview Prep generates unique questions across multiple consecutive regenerations without repetition or exhaustion', async () => {
  const seenQuestions = new Set();
  const seenList = [];

  for (let round = 1; round <= 6; round++) {
    let responseData = null;
    const req = {
      user: { id: 1 },
      headers: {},
      body: {
        targetRole: 'Full Stack Engineer',
        resume: {
          target_role: 'Full Stack Engineer',
          skills: ['React', 'Node.js', 'Express', 'MySQL']
        },
        regenerate: round > 1,
        previousQuestions: [...seenList]
      }
    };

    const res = {
      json(data) {
        responseData = data;
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      }
    };

    await generateInterviewPrep(req, res);

    assert.ok(responseData, `Round ${round} should return a response`);
    assert.equal(responseData.success, true, `Round ${round} should be successful`);
    assert.ok(Array.isArray(responseData.questions), `Round ${round} questions should be an array`);
    assert.equal(responseData.questions.length, 5, `Round ${round} should return exactly 5 questions`);

    // Verify each question has its paired answer and pro-tip
    for (const q of responseData.questions) {
      assert.ok(q.question && typeof q.question === 'string', 'Question text should be non-empty string');
      assert.ok(q.idealAnswer && typeof q.idealAnswer === 'string', 'Ideal answer should be paired and non-empty');
      assert.ok(q.proTip && typeof q.proTip === 'string', 'Pro tip should be paired and non-empty');
      assert.ok(q.type === 'Technical' || q.type === 'Behavioral', 'Type should be Technical or Behavioral');

      // Verify no duplicates against any previously seen questions
      assert.ok(!seenQuestions.has(q.question.trim()), `Question "${q.question}" repeated in round ${round}!`);
      seenQuestions.add(q.question.trim());
      seenList.push(q.question.trim());
    }
  }

  // Across 6 rounds of 5 questions each = 30 completely unique questions
  assert.equal(seenQuestions.size, 30, 'All 30 questions across 6 consecutive generations must be unique');
});

test('Issues 7 & 8: Extended regeneration beyond pool capacity wraps gracefully without hanging or returning empty set', async () => {
  // Simulate 9 rounds (45 requests)
  const history = [];
  for (let round = 1; round <= 9; round++) {
    let responseData = null;
    const req = {
      user: { id: 1 },
      headers: {},
      body: {
        targetRole: 'Full Stack Engineer',
        resume: {
          target_role: 'Full Stack Engineer',
          skills: ['React', 'Node.js']
        },
        regenerate: true,
        previousQuestions: [...history]
      }
    };

    const res = {
      json(data) {
        responseData = data;
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      }
    };

    await generateInterviewPrep(req, res);

    assert.ok(responseData?.success, `Round ${round} should succeed`);
    assert.equal(responseData?.questions?.length, 5, `Round ${round} must return 5 questions`);

    // Ensure no duplicates WITHIN the same 5-question batch
    const batchSet = new Set(responseData.questions.map(q => q.question));
    assert.equal(batchSet.size, 5, `Round ${round} batch must have 5 distinct questions internally`);

    // Ensure all questions have paired answers and pro-tips
    for (const q of responseData.questions) {
      assert.ok(q.idealAnswer && q.idealAnswer.trim().length > 10, 'Must have paired ideal answer');
      assert.ok(q.proTip && q.proTip.trim().length > 5, 'Must have paired pro tip');
    }

    history.push(...responseData.questions.map(q => q.question));
  }
});
