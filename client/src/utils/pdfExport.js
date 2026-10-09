import html2pdf from 'html2pdf.js';

/**
 * 1-Click High-Quality PDF Export Utility
 * Ensures content fits cleanly without generating an unnecessary blank trailing/second page.
 * Allows multi-page resumes to flow naturally when content exceeds a single page.
 */
export async function exportResumeToPdf(resume, elementId = 'resume-print-area') {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    alert('Resume preview is not ready. Please make sure the resume preview is visible.');
    return;
  }

  // Create an unscaled offscreen sandbox mounted to the DOM
  const sandbox = document.createElement('div');
  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-9999px';
  sandbox.style.top = '0';
  sandbox.style.width = '794px';
  sandbox.style.minHeight = 'auto';
  sandbox.style.zIndex = '-9999';
  sandbox.style.background = '#ffffff';
  sandbox.style.overflow = 'visible';

  // Clone the resume node deeply
  const clone = sourceEl.cloneNode(true);
  clone.id = `${elementId}-clone`;
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.position = 'relative';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '794px';
  clone.style.minHeight = 'auto';
  clone.style.height = 'auto';
  clone.style.margin = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.background = '#ffffff';
  // Remove outer shadows and borders that cause html2canvas canvas overflow onto extra page
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    const candidateName = resume?.personal_info?.fullName || resume?.title || 'Resume';
    const filename = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;

    const opt = {
      margin: [0, 0, 0, 0],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.resume-item', '.resume-section-title', '.job-item', '.edu-item']
      }
    };

    await html2pdf().set(opt).from(clone).save();
  } catch (err) {
    console.error('html2pdf export error, falling back to window.print:', err);
    window.print();
  } finally {
    if (document.body.contains(sandbox)) {
      document.body.removeChild(sandbox);
    }
  }
}
