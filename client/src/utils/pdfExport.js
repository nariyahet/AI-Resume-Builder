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
  clone.style.padding = isCompact ? '8mm 13mm 6mm 13mm' : (isRelaxed ? '14mm 16mm 15mm 16mm' : '14mm 15.5mm 12mm 15.5mm');
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

    // Guarantee custom fonts are fully loaded before capturing
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }

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

    // 5. Intelligent Content-Aware Dynamic Pagination (1-page, 2-page, 3+ pages)
    const pageHeight = 1122; // A4 standard pixel height at 794px width
    const footerClearance = 55; // reserve space for bottom margin + running footer
    const usableHeight = pageHeight - footerClearance; // ~1067px
    const totalHeight = clone.offsetHeight;

    if (totalHeight > usableHeight) {
      // Gather all candidate break elements in DOM order:
      // A candidate break can be:
      // 1. A section's header block (never separates heading from first item)
      // 2. An individual subsequent item within a section (.job-item, .project-item, .edu-item, .cert-item)
      const candidateBreaks = [];
      const sections = Array.from(clone.querySelectorAll('.resume-section'));

      sections.forEach(sec => {
        const headerBlock = sec.querySelector('.resume-section-header-block');
        const titleText = (sec.querySelector('.resume-section-title')?.textContent || '').toLowerCase();
        const isSkills = titleText.includes('skill') || titleText.includes('proficienc') || titleText.includes('competenc');
        const isProjects = titleText.includes('project');
        const isEdu = titleText.includes('education');

        const targetEl = headerBlock || sec;
        candidateBreaks.push({
          element: targetEl,
          top: targetEl.offsetTop,
          type: 'section',
          isSkills,
          isProjects,
          isEdu,
          title: titleText
        });

        // Collect subsequent items within this section (items not inside headerBlock)
        const items = Array.from(sec.querySelectorAll('.job-item, .project-item, .edu-item, .cert-item, .resume-item'));
        items.forEach((item, idx) => {
          if (headerBlock && headerBlock.contains(item)) return;
          candidateBreaks.push({
            element: item,
            top: item.offsetTop,
            type: 'item',
            isSkills: false,
            isProjects,
            isEdu,
            title: `${titleText} item ${idx + 1}`
          });
        });
      });

      // Sort candidate breaks by DOM offsetTop
      candidateBreaks.sort((a, b) => a.top - b.top);

      let paginationResolved = false;

      // Case A: 2-Page Resume Optimization
      // If total content fits within 2 pages, check if breaking before Skills allows
      // Page 1 (Header + Summary + Experience) <= usableHeight
      // AND Page 2 (Skills + Projects + Education) <= usableHeight
      if (totalHeight <= usableHeight * 2.05) {
        const skillsBreak = candidateBreaks.find(c => c.isSkills);
        if (skillsBreak) {
          const p1H = skillsBreak.top;
          const p2H = totalHeight - p1H;
          if (p1H <= usableHeight && p2H <= usableHeight) {
            skillsBreak.element.style.pageBreakBefore = 'always';
            skillsBreak.element.style.breakBefore = 'page';
            paginationResolved = true;
          }
        }

        // If skillsBreak doesn't fit or doesn't exist, find the break candidate that best balances the 2 pages
        if (!paginationResolved) {
          const midpoint = totalHeight / 2;
          let bestBreak = null;
          let bestScore = Infinity;

          for (const cb of candidateBreaks) {
            const p1H = cb.top;
            const p2H = totalHeight - p1H;
            if (p1H <= usableHeight && p2H <= usableHeight) {
              const sectionBonus = cb.type === 'section' ? 0 : 50;
              const score = Math.abs(p1H - midpoint) + sectionBonus;
              if (score < bestScore) {
                bestScore = score;
                bestBreak = cb;
              }
            }
          }

          if (bestBreak) {
            bestBreak.element.style.pageBreakBefore = 'always';
            bestBreak.element.style.breakBefore = 'page';
            paginationResolved = true;
          }
        }
      }

      // Case B: 3+ Page Resumes (or when 2 pages cannot fit the content)
      if (!paginationResolved) {
        let currentPageStart = 0;
        let remainingHeight = totalHeight;

        while (remainingHeight > usableHeight) {
          const maxAllowedTop = currentPageStart + usableHeight;
          const validBreaks = candidateBreaks.filter(c => c.top > currentPageStart + 250 && c.top <= maxAllowedTop);

          if (validBreaks.length === 0) {
            // Next best candidate if items are tightly packed
            const nextCandidate = candidateBreaks.find(c => c.top > currentPageStart);
            if (nextCandidate) {
              nextCandidate.element.style.pageBreakBefore = 'always';
              nextCandidate.element.style.breakBefore = 'page';
              currentPageStart = nextCandidate.top;
              remainingHeight = totalHeight - currentPageStart;
            } else {
              break;
            }
          } else {
            // Prefer section break if >= 65% down the usable height, else pick the latest valid break
            const preferredSectionBreak = validBreaks.filter(c => c.type === 'section' && (c.top - currentPageStart) >= usableHeight * 0.65).pop();
            const chosen = preferredSectionBreak || validBreaks[validBreaks.length - 1];

            chosen.element.style.pageBreakBefore = 'always';
            chosen.element.style.breakBefore = 'page';
            currentPageStart = chosen.top;
            remainingHeight = totalHeight - currentPageStart;
          }
        }
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
      pdf.setTextColor(100, 116, 139);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pHeight = pdf.internal.pageSize.getHeight();
      const marginX = 15.5;
      const bottomY = pHeight - 8.5; // ~0.335 inches from bottom edge
      // Footer text matching reference placement without line
      pdf.text(leftText, marginX, bottomY);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, bottomY, { align: 'right' });
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
