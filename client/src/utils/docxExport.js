import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle 
} from 'docx';

export async function exportResumeToDocx(resume) {
  const {
    personal_info = {},
    target_role = '',
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    custom_sections = [],
    theme_color = '#2563eb'
  } = resume;

  const accentColor = (theme_color || '#2563eb').replace('#', '').toUpperCase();
  const docParagraphs = [];

  // 1. CANDIDATE NAME (Title)
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (personal_info.fullName || 'Candidate Name').toUpperCase(),
          bold: true,
          size: 36, // 18pt
          font: 'Arial',
          color: '111827'
        })
      ]
    })
  );

  // 2. TARGET ROLE
  if (target_role) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: target_role.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            font: 'Arial',
            color: accentColor
          })
        ]
      })
    );
  }

  // 3. CONTACT INFO LINE
  const contactParts = [
    personal_info.email,
    personal_info.phone,
    personal_info.location,
    personal_info.website,
    personal_info.linkedin,
    personal_info.github
  ].filter(Boolean);

  if (contactParts.length > 0) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' }
        },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 19, // ~9.5pt
            font: 'Arial',
            color: '4B5563'
          })
        ]
      })
    );
  }

  // Helper for Section Heading
  const addSectionHeading = (title) => {
    docParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        keepWithNext: true,
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            font: 'Arial',
            color: '1F2937'
          })
        ]
      })
    );
  };

  // 4. PROFESSIONAL SUMMARY
  if (summary) {
    addSectionHeading('Professional Summary');
    docParagraphs.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: summary,
            size: 20, // 10pt
            font: 'Arial',
            color: '374151'
          })
        ]
      })
    );
  }

  // 5. WORK EXPERIENCE
  if (experience && experience.length > 0) {
    addSectionHeading('Work Experience');
    experience.forEach(exp => {
      // Role, Company & Location
      const locationText = exp.location ? ` (${exp.location})` : '';
      const expDates = exp.startDate && exp.endDate 
        ? `    ${exp.startDate} - ${exp.endDate}` 
        : (exp.startDate || exp.endDate ? `    ${exp.startDate || exp.endDate}` : '');

      docParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          keepWithNext: true,
          children: [
            new TextRun({
              text: exp.role || 'Position',
              bold: true,
              size: 21,
              font: 'Arial',
              color: '111827'
            }),
            new TextRun({
              text: ` — ${exp.company || 'Company'}${locationText}`,
              bold: true,
              size: 20,
              font: 'Arial',
              color: accentColor
            }),
            new TextRun({
              text: expDates,
              italics: true,
              size: 18,
              font: 'Arial',
              color: '6B7280'
            })
          ]
        })
      );

      // Bullets
      if (exp.description) {
        const bulletLines = exp.description.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
        bulletLines.forEach(line => {
          docParagraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 50 },
              children: [
                new TextRun({
                  text: line,
                  size: 20,
                  font: 'Arial',
                  color: '374151'
                })
              ]
            })
          );
        });
      }
    });
  }

  // 6. TECHNICAL SKILLS
  if (skills && skills.length > 0) {
    addSectionHeading('Technical Proficiencies');
    docParagraphs.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: skills.join('  •  '),
            size: 20,
            font: 'Arial',
            color: '374151'
          })
        ]
      })
    );
  }

  // 7. KEY PROJECTS
  if (projects && projects.length > 0) {
    addSectionHeading('Key Projects');
    projects.forEach(p => {
      docParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 30 },
          keepWithNext: true,
          children: [
            new TextRun({
              text: p.name || 'Project',
              bold: true,
              size: 21,
              font: 'Arial',
              color: '111827'
            }),
            new TextRun({
              text: p.link ? ` (${p.link})` : '',
              size: 18,
              font: 'Arial',
              color: '6B7280'
            })
          ]
        })
      );

      if (p.description) {
        docParagraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: p.description,
                size: 20,
                font: 'Arial',
                color: '374151'
              })
            ]
          })
        );
      }
    });
  }

  // 8. EDUCATION
  if (education && education.length > 0) {
    addSectionHeading('Education');
    education.forEach(edu => {
      docParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          keepWithNext: true,
          children: [
            new TextRun({
              text: edu.degree || 'Degree',
              bold: true,
              size: 20,
              font: 'Arial',
              color: '111827'
            }),
            new TextRun({
              text: ` — ${edu.institution || 'University'}`,
              size: 20,
              font: 'Arial',
              color: '4B5563'
            }),
            new TextRun({
              text: edu.year ? `  |  ${edu.year}` : '',
              size: 18,
              font: 'Arial',
              color: '6B7280'
            }),
            new TextRun({
              text: edu.score ? `  (Score: ${edu.score})` : '',
              bold: true,
              size: 18,
              font: 'Arial',
              color: accentColor
            })
          ]
        })
      );
    });
  }

  // 9. CERTIFICATIONS
  if (certifications && certifications.length > 0) {
    addSectionHeading('Certifications');
    certifications.forEach(cert => {
      docParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          keepWithNext: true,
          children: [
            new TextRun({
              text: cert.name || 'Certification',
              bold: true,
              size: 20,
              font: 'Arial',
              color: '111827'
            }),
            new TextRun({
              text: cert.issuer ? ` — ${cert.issuer}` : '',
              size: 20,
              font: 'Arial',
              color: '4B5563'
            }),
            new TextRun({
              text: cert.year ? `  (${cert.year})` : '',
              size: 18,
              font: 'Arial',
              color: '6B7280'
            })
          ]
        })
      );
    });
  }

  // 10. CUSTOM SECTIONS (Awards, Publications, Volunteer, etc.)
  if (custom_sections && custom_sections.length > 0) {
    custom_sections.forEach(sec => {
      const heading = sec.title || sec.heading;
      if (heading && sec.content) {
        addSectionHeading(heading);
        const lines = sec.content.split('\n').filter(Boolean);
        lines.forEach(l => {
          docParagraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 50 },
              children: [
                new TextRun({
                  text: l.replace(/^[•\-\*]\s*/, ''),
                  size: 20,
                  font: 'Arial',
                  color: '374151'
                })
              ]
            })
          );
        });
      }
    });
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        children: docParagraphs
      }
    ]
  });

  // Pack and trigger download
  const blob = await Packer.toBlob(doc);
  const fileName = `${(personal_info.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
