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
  clone.style.padding = '14mm 16mm';
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

    // Ensure all images (profile photo, logos) are loaded before capturing
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // Defensive guarantee: Group any section title and its first item together if not already grouped
    clone.querySelectorAll('.resume-section, .template-split > div > div').forEach(section => {
      const title = section.querySelector('.resume-section-title');
      if (title && !title.closest('.resume-section-header-block')) {
        const firstItem = title.nextElementSibling;
        if (firstItem && (firstItem.classList.contains('resume-item') || firstItem.classList.contains('edu-item') || firstItem.classList.contains('job-item') || firstItem.tagName === 'P')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'resume-section-header-block';
          section.insertBefore(wrapper, title);
          wrapper.appendChild(title);
          wrapper.appendChild(firstItem);
        }
      }
    });

    // 1. Allow sections to flow across pages naturally between items
    clone.querySelectorAll('.resume-section').forEach(el => {
      el.style.pageBreakInside = 'auto';
      el.style.breakInside = 'auto';
    });

    // 2. Lock section title together with its first entry (never orphan heading at bottom of page)
    clone.querySelectorAll('.resume-section-header-block').forEach(el => {
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
      el.style.pageBreakAfter = 'auto';
      el.style.breakAfter = 'auto';
    });

    // 3. Keep individual entries and header intact
    clone.querySelectorAll('.resume-item, .job-item, .edu-item, .resume-header').forEach(el => {
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
    });

    // Remove bottom margin and padding on the last child to prevent trailing blank page creation
    const lastEl = clone.querySelector('.resume-sheet > *:last-child, .resume-section:last-of-type');
    if (lastEl) {
      lastEl.style.marginBottom = '0';
      lastEl.style.paddingBottom = '0';
    }

    const opt = {
      margin: [0, 0, 0, 0],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.5,
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
        avoid: [
          '.resume-section-header-block',
          '.resume-item',
          '.resume-header',
          '.job-item',
          '.edu-item'
        ]
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
