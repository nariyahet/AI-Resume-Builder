import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromPdf } from '../controllers/uploadController.js';

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
<< /Length 53 >>
stream
BT
/F1 12 Tf
100 700 Td
(John Doe - Software Engineer) Tj
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
0000000348 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
426
%%EOF`
);

// Minimal valid PDF with NO text stream (simulating scanned / flat image PDF)
const emptyTextPdf = Buffer.from(
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

test('Issue 6: Valid text-based PDF extracts text cleanly', async () => {
  const text = await extractTextFromPdf(validTextPdf);
  assert.ok(typeof text === 'string', 'Extracted result should be a string');
  assert.ok(text.includes('John Doe'), 'Text should contain candidate name');
  assert.ok(text.includes('Software Engineer'), 'Text should contain role');
});

test('Issue 6: Empty 0-byte buffer is safely rejected', async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.alloc(0));
    },
    /empty/i,
    'Empty buffer should throw an error'
  );
});

test('Issue 6: Corrupted non-PDF buffer is handled safely', async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.from('THIS_IS_NOT_A_PDF_FILE'));
    },
    (err) => {
      assert.ok(err, 'Should reject corrupt PDF buffer');
      return true;
    }
  );
});

test('Issue 6: Scanned or blank PDF without text stream returns empty string for graceful 400 handling', async () => {
  const text = await extractTextFromPdf(emptyTextPdf);
  assert.equal(text.trim(), '', 'Scanned PDF should yield empty string, triggering user-friendly guidance message');
});
