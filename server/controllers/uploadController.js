import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { parseResumeText } from './aiController.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Multer memory storage (up to 10MB file)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('resumeFile');

export async function uploadAndParseResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded.' });
    }

    const { mimetype, originalname, buffer } = req.file;
    let extractedText = '';

    console.log(`Processing uploaded file: ${originalname} (${mimetype})`);

    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
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
        message: 'Could not extract readable text from the file. Please ensure it is not password protected.' 
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
