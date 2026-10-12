import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { parseResumeText } from './aiController.js';

const require = createRequire(import.meta.url);
let pdfParseModule = null;
let tesseractModule = null;
try {
  pdfParseModule = require('pdf-parse');
} catch (err) {
  console.warn('pdf-parse import warning:', err.message);
}
try {
  tesseractModule = require('tesseract.js');
} catch (err) {
  console.warn('tesseract.js import warning:', err.message);
}

// Helper to extract text via OCR from scanned or image-based PDFs
async function extractOcrFromPdfBuffer(buffer, parser) {
  if (!tesseractModule) return '';

  // 1. Direct extraction of embedded JPEG image streams
  const start = buffer.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]));
  const end = buffer.indexOf(Buffer.from([0xFF, 0xD9]), start);
  if (start !== -1 && end !== -1 && end > start) {
    const jpegBuf = buffer.subarray(start, end + 2);
    try {
      const res = await tesseractModule.recognize(jpegBuf, 'eng');
      if (res?.data?.text?.trim()) {
        return res.data.text.trim();
      }
    } catch (_) {}
  }

  // 2. Fall back to rendering PDF pages to screenshots via PDFParse
  if (parser && typeof parser.getScreenshot === 'function') {
    try {
      const screenshot = await parser.getScreenshot({ scale: 2 });
      if (screenshot?.pages?.length > 0) {
        let full = '';
        for (const page of screenshot.pages) {
          if (page.dataUrl) {
            const b64 = page.dataUrl.replace(/^data:image\/[^;]+;base64,/, '');
            const res = await tesseractModule.recognize(Buffer.from(b64, 'base64'), 'eng');
            if (res?.data?.text) full += '\n' + res.data.text;
          }
        }
        if (full.trim()) return full.trim();
      }
    } catch (_) {}
  }

  return '';
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
      const cleaned = rawText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '').trim();

      // If document contains pages but zero extractable text stream, it is an image-only / scanned PDF
      if (result && typeof result.total === 'number' && result.total > 0 && !cleaned) {
        try {
          const ocrText = await extractOcrFromPdfBuffer(buffer, parser);
          if (ocrText && ocrText.trim()) {
            return ocrText.trim();
          }
        } catch (ocrErr) {
          console.warn('OCR extraction attempt failed:', ocrErr.message);
        }

        const scanErr = new Error('This PDF appears to be a scanned image or photo without selectable text. Direct image OCR is not supported. Please copy and paste your resume text into the text box below, or upload a text-based document.');
        scanErr.name = 'ScannedPDFException';
        scanErr.isScanned = true;
        throw scanErr;
      }

      return cleaned;
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

// Robust helper to extract readable text from DOCX
export async function extractTextFromDocx(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Word document file is empty (0 bytes).');
  }
  const docxResult = await mammoth.extractRawText({ buffer });
  return (docxResult && typeof docxResult.value === 'string') ? docxResult.value.trim() : '';
}

// Helper to validate uploaded file extension and MIME compatibility
export function validateFileMeta(originalname, mimetype) {
  const ext = (originalname || '').toLowerCase();
  const mime = (mimetype || '').toLowerCase();

  // Explicit rejection for legacy Word .doc format with clear guidance
  if (ext.endsWith('.doc')) {
    const err = new Error('Legacy Word (.doc) format is not supported. Please save or export your document as Word (.docx) or PDF (.pdf) and try again.');
    err.name = 'LegacyDocNotSupportedException';
    return { ok: false, error: err };
  }

  const isPdfExt = ext.endsWith('.pdf');
  const isDocxExt = ext.endsWith('.docx');
  const isTxtExt = ext.endsWith('.txt');

  if (!isPdfExt && !isDocxExt && !isTxtExt) {
    const err = new Error('Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.');
    err.name = 'UnsupportedFileException';
    err.isUnsupportedFormat = true;
    return { ok: false, error: err };
  }

  // Tight validation: Verify MIME type is compatible with the declared file extension
  let mimeCompatible = false;
  if (isPdfExt) {
    mimeCompatible = mime.includes('pdf') || mime === 'application/octet-stream';
  } else if (isDocxExt) {
    mimeCompatible = mime.includes('word') || mime.includes('officedocument') || mime === 'application/zip' || mime === 'application/octet-stream';
  } else if (isTxtExt) {
    mimeCompatible = mime.startsWith('text/') || mime === 'application/octet-stream';
  }

  if (!mimeCompatible) {
    const err = new Error(`File content type mismatch: The uploaded file has extension ".${ext.split('.').pop()}" but unexpected content type "${mime}".`);
    err.name = 'MimeMismatchException';
    return { ok: false, error: err };
  }

  return { ok: true };
}

// Multer memory storage (up to 10MB file) with strict extension filter & MIME compatibility
const storage = multer.memoryStorage();
const multerUploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const validation = validateFileMeta(file.originalname, file.mimetype);
    if (validation.ok) {
      cb(null, true);
    } else {
      cb(validation.error, false);
    }
  }
}).single('resumeFile');

export const uploadMiddleware = (req, res, next) => {
  multerUploader(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file is too large. Maximum allowed file size is 10MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to upload file.'
      });
    }
    next();
  });
};

export async function uploadAndParseResume(req, res) {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty (0 bytes).' });
    }

    const { mimetype, originalname, buffer } = req.file;
    const lowerName = (originalname || '').toLowerCase();
    let extractedText = '';

    console.log(`Processing uploaded file: ${originalname} (${mimetype})`);

    if (lowerName.endsWith('.pdf')) {
      // Buffer signature check for PDF: must contain %PDF
      const headerPrefix = buffer.subarray(0, 1024).toString('binary');
      if (!headerPrefix.includes('%PDF')) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file does not contain a valid PDF document header.'
        });
      }

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
        if (pdfErr.name === 'ScannedPDFException' || pdfErr.isScanned) {
          return res.status(400).json({
            success: false,
            message: 'This PDF appears to be a scanned image or photo without selectable text. Direct image OCR is not supported. Please copy and paste your resume text into the text box below, or upload a text-based document.'
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
    } else if (lowerName.endsWith('.docx')) {
      // Buffer signature check for DOCX (ZIP archive header PK\x03\x04)
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file does not match a valid Word (.docx) document structure.'
        });
      }

      try {
        extractedText = await extractTextFromDocx(buffer);
      } catch (docxErr) {
        console.error('DOCX extraction error:', docxErr);
        return res.status(400).json({
          success: false,
          message: 'The uploaded file is not a valid or readable Word (.docx) document.'
        });
      }
    } else if (lowerName.endsWith('.txt')) {
      // Buffer check for TXT: ensure not binary (e.g. executable or binary null-bytes)
      const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
      let nullByteCount = 0;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0x00) nullByteCount++;
      }
      if (nullByteCount > 5) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file appears to be a binary file, not a valid plain text resume.'
        });
      }

      try {
        extractedText = buffer.toString('utf-8');
      } catch (txtErr) {
        return res.status(400).json({
          success: false,
          message: 'Failed to read plain text file.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt) file.'
      });
    }

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: lowerName.endsWith('.pdf')
          ? 'This PDF appears to be a scanned image or empty. Please copy and paste your resume text instead.'
          : 'Could not extract readable text from the file. The document appears to be empty or unreadable.'
      });
    }

    // Now forward the real extracted text to the AI parser
    req.body.resumeText = extractedText;
    req.body.fileName = originalname;
    return parseResumeText(req, res);
  } catch (error) {
    console.error('File parse error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to parse uploaded document: ' + error.message 
    });
  }
}
