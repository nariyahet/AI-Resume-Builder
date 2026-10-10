import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { parseResumeText } from './aiController.js';

const require = createRequire(import.meta.url);
let pdfParseModule = null;
try {
  pdfParseModule = require('pdf-parse');
} catch (err) {
  console.warn('pdf-parse import warning:', err.message);
}

// Robust helper supporting pdf-parse v2+ (PDFParse class) and v1 (function)
export async function extractTextFromPdf(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF file is empty (0 bytes).');
  }

  if (!pdfParseModule) {
    throw new Error('PDF parsing library is not available.');
  }

  // 1. pdf-parse v2+ Class-based API: new PDFParse({ data: buffer })
  if (typeof pdfParseModule.PDFParse === 'function') {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const rawText = (result && typeof result.text === 'string')
        ? result.text
        : (typeof result === 'string' ? result : '');
      // Strip page footer artifacts like "-- 1 of 1 --"
      return rawText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '').trim();
    } finally {
      if (typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch (_) {}
      }
    }
  }

  // 2. pdf-parse v1 Function-based API: pdfParse(buffer)
  const fn = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule?.default;
  if (typeof fn === 'function') {
    const result = await fn(buffer);
    return (result?.text || '').trim();
  }

  throw new Error('Unsupported PDF parser export interface.');
}

// Multer memory storage (up to 10MB file)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('resumeFile');

export async function uploadAndParseResume(req, res) {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty (0 bytes).' });
    }

    const { mimetype, originalname, buffer } = req.file;
    let extractedText = '';

    console.log(`Processing uploaded file: ${originalname} (${mimetype})`);

    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      try {
        extractedText = await extractTextFromPdf(buffer);
      } catch (pdfErr) {
        console.error('PDF extraction error:', pdfErr);
        const errMsg = pdfErr.message || '';
        if (pdfErr.name === 'PasswordException' || errMsg.toLowerCase().includes('password')) {
          return res.status(400).json({
            success: false,
            message: 'The uploaded PDF is password protected. Please remove the password and try again.'
          });
        }
        if (pdfErr.name === 'InvalidPDFException' || errMsg.toLowerCase().includes('invalid pdf') || errMsg.toLowerCase().includes('structure') || errMsg.toLowerCase().includes('corrupt') || errMsg.toLowerCase().includes('empty')) {
          return res.status(400).json({
            success: false,
            message: errMsg.toLowerCase().includes('empty')
              ? 'The uploaded PDF file is empty.'
              : 'The uploaded file is not a valid or readable PDF document.'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Failed to extract text from PDF: ' + errMsg
        });
      }
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      originalname.toLowerCase().endsWith('.docx')
    ) {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = docxResult.value || '';
    } else {
      // Plain text or markdown
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract readable text from the file. The document may be empty, image-only/scanned, or password protected.'
      });
    }

    // Now forward the real extracted text to the AI parser
    req.body.resumeText = extractedText;
    return parseResumeText(req, res);
  } catch (error) {
    console.error('File parse error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to parse uploaded document: ' + error.message 
    });
  }
}
