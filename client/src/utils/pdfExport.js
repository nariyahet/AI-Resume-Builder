import html2pdf from 'html2pdf.js';

/**
 * 1-Click High-Quality PDF Export Utility
 * Ensures content fits cleanly without generating an unnecessary blank trailing/second page.
 * Allows multi-page resumes to flow naturally when content exceeds a single page.
 */
export async function exportResumeToPdf(resume, elementId = 'resume-print-area', returnPdf = false) {
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
  clone.style.minHeight = '0';
  clone.style.setProperty('min-height', '0', 'important');
  clone.style.height = 'auto';
  clone.style.margin = '0';
  const isCompact = clone.classList.contains('density-compact') || sourceEl.classList.contains('density-compact');
  const isRelaxed = clone.classList.contains('density-relaxed') || sourceEl.classList.contains('density-relaxed');
  clone.style.padding = isCompact ? '8mm 13mm 6mm 13mm' : (isRelaxed ? '14mm 16mm 15mm 16mm' : '12mm 15mm 14mm 15mm');
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

    // Strip preview guide lines before capturing PDF
    clone.querySelectorAll('.preview-page-break-indicator').forEach(el => el.remove());

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
        if (firstItem && (firstItem.classList.contains('resume-item') || firstItem.classList.contains('edu-item') || firstItem.classList.contains('job-item') || firstItem.classList.contains('project-item') || firstItem.classList.contains('cert-item') || firstItem.tagName === 'P')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'resume-section-header-block';
          section.insertBefore(wrapper, title);
          wrapper.appendChild(title);
          wrapper.appendChild(firstItem);
        }
      }
    });

    // 1. Allow sections to flow across pages naturally between items (NEVER avoid breaks on .resume-section)
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

    // 3. Keep individual entries and header intact (experience, education, projects, certifications)
    clone.querySelectorAll('.resume-item, .job-item, .edu-item, .project-item, .cert-item, .resume-header').forEach(el => {
      // If an individual monster entry exceeds 850px, allow controlled page splitting so content isn't stranded
      if (el.offsetHeight > 850) {
        el.style.pageBreakInside = 'auto';
        el.style.breakInside = 'auto';
      } else {
        el.style.pageBreakInside = 'avoid';
        el.style.breakInside = 'avoid';
      }
    });

    // 4. Never separate item title from its description inside any project or job entry
    clone.querySelectorAll('.resume-item-top, .resume-item-title').forEach(el => {
      el.style.pageBreakAfter = 'avoid';
      el.style.breakAfter = 'avoid';
    });

    clone.querySelectorAll('.resume-item-desc').forEach(el => {
      el.style.pageBreakBefore = 'avoid';
      el.style.breakBefore = 'avoid';
    });

    // 5. Intelligent balanced pagination for 2-page & 3-page resumes:
    // Page 1: Header + Summary + Work Experience (fits naturally without clipping)
    // Page 2: Technical Skills at top + Key Projects + Education
    const pageHeight = 1122; // A4 standard pixel height at 794px width
    const totalHeight = clone.offsetHeight;

    if (totalHeight > pageHeight && totalHeight <= pageHeight * 2.1) {
      const sections = Array.from(clone.querySelectorAll('.resume-section'));

      // Look for the Skills section (Technical Skills / Technical Proficiencies / Core Competencies)
      const skillsSec = sections.find(s => {
        const titleText = (s.querySelector('.resume-section-title')?.textContent || '').toLowerCase();
        return titleText.includes('skill') || titleText.includes('proficienc') || titleText.includes('competenc');
      });

      let breakSection = null;

      // If breaking before Skills allows Page 1 (Header + Summary + Experience)
      // and Page 2 (Skills + Projects + Education) to both fit within A4 height:
      if (skillsSec) {
        const page1H = skillsSec.offsetTop;
        const page2H = totalHeight - page1H;
        if (page1H < pageHeight - 40 && page2H < pageHeight - 40) {
          breakSection = skillsSec;
        }
      }

      // If skillsSec doesn't fit or doesn't exist, find the section that best balances the two pages
      if (!breakSection) {
        const targetMidpoint = totalHeight / 2;
        let minDiff = Infinity;
        for (const sec of sections) {
          const page1H = sec.offsetTop;
          const page2H = totalHeight - page1H;
          if (page1H < pageHeight - 40 && page2H < pageHeight - 40) {
            const diff = Math.abs(page1H - targetMidpoint);
            if (diff < minDiff) {
              minDiff = diff;
              breakSection = sec;
            }
          }
        }
      }

      if (breakSection) {
        breakSection.style.pageBreakBefore = 'always';
        breakSection.style.breakBefore = 'page';
      }
    } else if (totalHeight > pageHeight * 2.1 && totalHeight <= pageHeight * 3.2) {
      // 3-page resume: Page 1 (Header, Summary, Experience), Page 2 (Skills, Projects), Page 3 (Education, etc.)
      const sections = Array.from(clone.querySelectorAll('.resume-section'));
      const skillsSec = sections.find(s => {
        const titleText = (s.querySelector('.resume-section-title')?.textContent || '').toLowerCase();
        return titleText.includes('skill') || titleText.includes('proficienc') || titleText.includes('competenc');
      });

      let page1Break = null;
      let page2Break = null;

      // Page 1 break before Skills if it fits
      if (skillsSec && skillsSec.offsetTop < pageHeight - 40) {
        page1Break = skillsSec;
      } else {
        page1Break = sections.find(s => s.offsetTop >= 500 && s.offsetTop < pageHeight - 40);
      }

      // Page 2 break before Education or project closest to midpoint of remainder
      const eduSec = sections.find(s => {
        const titleText = (s.querySelector('.resume-section-title')?.textContent || '').toLowerCase();
        return titleText.includes('education');
      });

      if (eduSec && page1Break && (eduSec.offsetTop - page1Break.offsetTop) < pageHeight - 40) {
        page2Break = eduSec;
      } else if (page1Break) {
        page2Break = sections.find(s => (s.offsetTop - page1Break.offsetTop) >= 500 && (s.offsetTop - page1Break.offsetTop) < pageHeight - 40);
      }

      if (page1Break) {
        page1Break.style.pageBreakBefore = 'always';
        page1Break.style.breakBefore = 'page';
      }
      if (page2Break) {
        page2Break.style.pageBreakBefore = 'always';
        page2Break.style.breakBefore = 'page';
      }
    }

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
          '.job-item',
          '.edu-item',
          '.project-item',
          '.cert-item',
          '.resume-item-top',
          '.resume-header'
        ]
      }
    };

    const worker = html2pdf().set(opt).from(clone);
    const pdf = await worker.toPdf().get('pdf');

    // Add running footer on every page (matching reference design)
    const totalPages = pdf.internal.getNumberOfPages();
    const targetRole = resume?.target_role || resume?.role || '';
    const leftText = `${candidateName}${targetRole ? ` | ${targetRole}` : ''}`;

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pHeight = pdf.internal.pageSize.getHeight();
      const bottomY = pHeight - 8; // 8mm from bottom edge

      // Subtle divider line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(14, bottomY - 3, pageWidth - 14, bottomY - 3);

      pdf.text(leftText, 14, bottomY);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 14, bottomY, { align: 'right' });
    }

    await pdf.save(filename);
    if (returnPdf) {
      return pdf.output('datauristring');
    }
  } catch (err) {
    console.error('html2pdf export error, falling back to window.print:', err);
    window.print();
  } finally {
    if (document.body.contains(sandbox)) {
      document.body.removeChild(sandbox);
    }
  }
}
