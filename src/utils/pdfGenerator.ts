import { jsPDF } from 'jspdf';
import { ScreenplayBlock, ScreenplayProject, UserSettings, ShowcaseCharacter } from '../types';
import { getCharacterStats } from './characterStats';

/**
 * Truncates or formats lines for the PDF generator.
 * For true professional look, handles margins in millimeters on an A4 sheet (210 x 297 mm).
 */
export function generatePDF(project: ScreenplayProject, settings: UserSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isAr = settings.language === 'ar';
  
  // A4 dimensions: 210 x 297 mm
  const pageWidth = 210;
  const pageHeight = 297;
  
  // Margins in mm:
  // Standard screenplay:
  // Left: 1.5 in = 38.1 mm (for binding)
  // Right: 1.0 in = 25.4 mm (or 20mm to be safe)
  // Top: 1.0 in = 25.4 mm
  // Bottom: 1.0 in = 25.4 mm
  //
  // For Arabic RTL, the binding margin is on the RIGHT side!
  const bindMargin = 38;
  const freeMargin = 20;
  
  const leftMargin = isAr ? freeMargin : bindMargin;
  const rightMargin = isAr ? bindMargin : freeMargin;
  const printWidth = pageWidth - leftMargin - rightMargin;
  
  const topMargin = 25;
  const bottomMargin = 25;
  const fontName = 'helvetica';
  const fontSizeFactor = settings.fontSize / 12; // Scale based on settings
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12 * fontSizeFactor);

  let currentY = topMargin;
  let pageNum = 1;

  // Render Page Header / Number
  const drawHeader = (pNum: number) => {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10 * fontSizeFactor);
    const pageStr = `${pNum}.`;
    if (isAr) {
      // Top left for RTL page numbering
      doc.text(pageStr, leftMargin, 15);
    } else {
      // Top right for LTR page numbering
      doc.text(pageStr, pageWidth - rightMargin - 4, 15);
    }
    // Restore basic font
    doc.setFont(fontName, 'normal');
    doc.setFontSize(12 * fontSizeFactor);
  };

  drawHeader(pageNum);

  // Group blocks by scenes if numbering enabled
  let currentSceneNum = 0;

  project.blocks.forEach((block) => {
    // Check page overflow
    if (currentY > pageHeight - bottomMargin) {
      doc.addPage();
      pageNum++;
      drawHeader(pageNum);
      currentY = topMargin;
    }

    let text = block.text;
    
    // Auto-number scene headers
    if (block.type === 'SCENE_HEADING') {
      currentSceneNum++;
      if (settings.sceneNumbering) {
        if (isAr) {
          text = `${currentSceneNum} - ${text} - ${currentSceneNum}`;
        } else {
          text = `${currentSceneNum}. ${text} (${currentSceneNum})`;
        }
      }
    }

    const isSceneHeading = block.type === 'SCENE_HEADING';
    if (isSceneHeading) {
      // Set font and style first to calculate correctly
      doc.setFont(fontName, 'bold');
      doc.setFontSize(13.5 * fontSizeFactor);
      
      const upperText = text.toUpperCase();
      // Leave 6mm horizontal padding inside the card so printWidth - 12
      const headingLines = doc.splitTextToSize(upperText, printWidth - 12);
      // Height includes padding and the line sizes
      const headingBoxHeight = headingLines.length * 6.5 * fontSizeFactor + 6;
      
      // Spacing above the scene card (as card margins)
      currentY += 5;
      
      // Overflow check for the whole box
      if (currentY + headingBoxHeight > pageHeight - bottomMargin) {
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        currentY = topMargin + 4;
      }
      
      // Draw background of the scene card: Dark Gray #1E1E1E (RGB 30, 30, 30)
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(leftMargin, currentY, printWidth, headingBoxHeight, 3.5, 3.5, 'F');
      
      // Draw left accent border: Brand Primary #6750A4 (RGB 103, 80, 164)
      doc.setFillColor(103, 80, 164);
      doc.roundedRect(leftMargin, currentY, 1.8, headingBoxHeight, 0.8, 0.8, 'F');
      
      // Draw white text
      doc.setTextColor(255, 255, 255);
      
      let textLineY = currentY + 5.5 * fontSizeFactor;
      headingLines.forEach((lineText: string) => {
        let x = leftMargin + 6; // Left padding inside card
        let textAlign: 'left' | 'right' | 'center' = isAr ? 'right' : 'left';
        
        if (textAlign === 'right') {
          x = pageWidth - rightMargin - 6;
        }
        
        doc.text(lineText, x, textLineY, { align: textAlign });
        textLineY += 6.5 * fontSizeFactor;
      });
      
      // Restore default configurations
      doc.setTextColor(0, 0, 0);
      doc.setFont(fontName, 'normal');
      doc.setFontSize(12 * fontSizeFactor);
      
      // Move currentY past the box plus extra spacing below the heading card
      currentY += headingBoxHeight + 5;
      return; // Skip standard block rendering
    }

    // Set styling and horizontal positions based on element type
    let indentLeft = 0;
    let width = printWidth;
    let align: 'left' | 'center' | 'right' = isAr ? 'right' : 'left';
    let isBold = false;
    let isUnderline = false;

    switch (block.type) {
      case 'ACTION':
        align = isAr ? 'right' : 'left';
        break;
        
      case 'CHARACTER':
        // Characters are indented significantly in screenplay format
        // Standard Character indent: LTR: 3.7 inches (94mm) -> starts at Left Margin + ~55mm
        // Width: narrow
        isBold = true;
        text = text.toUpperCase();
        align = 'center';
        indentLeft = isAr ? 15 : 40;
        width = printWidth - (isAr ? 40 : 80);
        break;
        
      case 'DIALOGUE':
        // Dialogue: narrower column, slightly off-center
        // Standard: LTR starts at Left Margin + ~25mm. Width: ~76mm
        align = isAr ? 'right' : 'left';
        indentLeft = isAr ? 15 : 25;
        width = printWidth - 40;
        break;
        
      case 'PARENTHETICAL':
        // Parentheticals: narrow column
        // Standard: LTR starts at Left Margin + ~35mm. Width: ~50mm
        align = isAr ? 'right' : 'left';
        indentLeft = isAr ? 20 : 35;
        width = printWidth - 55;
        break;
        
      case 'TRANSITION':
        // Transitions: aligned to the right (LTR) or left (RTL)
        text = text.toUpperCase();
        align = isAr ? 'left' : 'right';
        break;
        
      case 'SHOT':
        isBold = true;
        text = text.toUpperCase();
        align = isAr ? 'right' : 'left';
        break;
        
      case 'CENTER_TEXT':
        align = 'center';
        break;
    }

    doc.setFont(fontName, isBold ? 'bold' : 'normal');
    
    // Calculate word-wrap lines
    const lines = doc.splitTextToSize(text, width);
    
    lines.forEach((lineText: string) => {
      if (currentY > pageHeight - bottomMargin) {
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        currentY = topMargin;
      }

      // X coordinate calculation based on alignment
      let x = leftMargin;
      if (align === 'center') {
        x = leftMargin + indentLeft + (width / 2);
      } else if (align === 'right') {
        x = pageWidth - rightMargin - indentLeft;
      } else {
        x = leftMargin + indentLeft;
      }

      // Draw the line with specified alignment
      doc.text(lineText, x, currentY, { align });
      
      // Keep track of underline if CHARACTER block
      if (block.type === 'CHARACTER' && isUnderline) {
        const textWidth = doc.getTextWidth(lineText);
        doc.line(x - (textWidth / 2), currentY + 0.5, x + (textWidth / 2), currentY + 0.5);
      }

      // Move down a double line space or single spacing (depending on screenplay conventions)
      // Usually actions and scenes have slightly larger trailing margin
      currentY += 6 * fontSizeFactor;
    });

    // Spacing between distinct elements
    let spacingAfter = 4 * fontSizeFactor;
    if (block.type === 'CHARACTER') spacingAfter = 1 * fontSizeFactor; // dialogue follows tightly
    if (block.type === 'PARENTHETICAL') spacingAfter = 1 * fontSizeFactor; // dialogue follows tightly
    
    currentY += spacingAfter;
  });

  // Export PDF with filename based on project title
  const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '_') || 'screenplay';
  doc.save(`${safeTitle}.pdf`);
}

/**
 * Creates a clean iframe printable copy of the screenplay.
 * Leveraging native browser typesetting handles Arabic RTL fonts and spacing 100% flawlessly.
 */
export function printScreenplay(project: ScreenplayProject, settings: UserSettings): void {
  const isAr = settings.language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to preview and print the screenplay!');
    return;
  }

  let formattedBlocksHtml = '';
  let sceneCount = 0;

  project.blocks.forEach((block) => {
    let text = block.text;
    let className = 'block-action';
    
    if (block.type === 'SCENE_HEADING') {
      sceneCount++;
      if (settings.sceneNumbering) {
        text = isAr ? `${sceneCount} - ${text} - ${sceneCount}` : `${sceneCount}. ${text} (${sceneCount})`;
      }
      className = 'block-heading';
    } else if (block.type === 'CHARACTER') {
      className = 'block-character';
    } else if (block.type === 'DIALOGUE') {
      className = 'block-dialogue';
    } else if (block.type === 'PARENTHETICAL') {
      className = 'block-parenthetical';
    } else if (block.type === 'TRANSITION') {
      className = 'block-transition';
    } else if (block.type === 'SHOT') {
      className = 'block-shot';
    } else if (block.type === 'CENTER_TEXT') {
      className = 'block-center';
    }

    formattedBlocksHtml += `<div class="${className}">${text}</div>`;
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${dir}" lang="${settings.language}">
    <head>
      <meta charset="utf-8">
      <title>${project.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;700&display=swap');
        
        @page {
          size: A4;
          margin: 0;
        }

        body {
          font-family: 'Arial', 'Cairo', 'Amiri', sans-serif;
          font-size: ${settings.fontSize}pt;
          line-height: 1.6;
          color: #000;
          background-color: #fff;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Screenplay A4 spacing margins simulating page layout */
        .page-container {
          box-sizing: border-box;
          width: 210mm;
          min-height: 297mm;
          padding-top: 25mm;
          padding-bottom: 25mm;
          /* Binding margin: 38mm on bind side, 20mm on free side */
          padding-left: ${isAr ? '20mm' : '38mm'};
          padding-right: ${isAr ? '38mm' : '20mm'};
          margin: 0 auto;
          position: relative;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        @media print {
          body {
            background-color: transparent;
          }
          .page-container {
            box-shadow: none;
            width: auto;
            min-height: auto;
            padding-left: ${isAr ? '20mm' : '38mm'};
            padding-right: ${isAr ? '38mm' : '20mm'};
            page-break-after: always;
          }
          .no-print {
            display: none !important;
          }
        }

        .no-print-bar {
          background-color: #1e293b;
          color: white;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          border-bottom: 1px solid #334155;
        }

        .print-btn {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .print-btn:hover {
          background-color: #2563eb;
        }

        /* Standard Screenplay Elements layout styles */
        .block-heading {
          font-weight: bold;
          text-transform: uppercase;
          background-color: #1E1E1E;
          color: #FFFFFF;
          padding: 10px 16px;
          border-radius: 16px;
          border-left: 6px solid #6750A4;
          margin-top: 24px;
          margin-bottom: 24px;
          text-align: ${isAr ? 'right' : 'left'};
          page-break-after: avoid;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          font-size: 1.1em;
        }

        .block-action {
          margin-bottom: 12px;
          text-align: ${isAr ? 'right' : 'left'};
        }

        .block-character {
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          /* Indented in Hollywood screenplay: LTR ~94mm */
          margin-top: 18px;
          margin-bottom: 2px;
          page-break-after: avoid;
        }

        .block-dialogue {
          margin-bottom: 12px;
          /* Narrow centered dialogue margins */
          margin-left: ${isAr ? '10%' : '20%'};
          margin-right: ${isAr ? '20%' : '10%'};
          max-width: 70%;
          text-align: ${isAr ? 'right' : 'left'};
        }

        .block-parenthetical {
          text-align: center;
          margin-left: ${isAr ? '15%' : '25%'};
          margin-right: ${isAr ? '25%' : '15%'};
          max-width: 60%;
          font-size: 0.95em;
          margin-bottom: 2px;
          page-break-after: avoid;
        }

        .block-transition {
          text-transform: uppercase;
          text-align: ${isAr ? 'left' : 'right'};
          margin-top: 18px;
          margin-bottom: 18px;
        }

        .block-shot {
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 18px;
          margin-bottom: 12px;
          text-align: ${isAr ? 'right' : 'left'};
        }

        .block-center {
          text-align: center;
          margin-top: 24px;
          margin-bottom: 24px;
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar no-print">
        <span>${isAr ? 'تصدير النص للطباعة / الحفظ بملف PDF' : 'Print / Save Screenplay as PDF'}</span>
        <button class="print-btn" onclick="window.print()">${isAr ? 'طباعة / حفظ بملف PDF' : 'Print / Save PDF'}</button>
      </div>
      
      <div class="page-container">
        <h1 style="text-align: center; margin-top: 40px; margin-bottom: 10px; font-size: 24pt;">${project.title}</h1>
        <p style="text-align: center; font-size: 14pt; color: #555; margin-bottom: 60px;">${isAr ? 'سيناريو كتابة' : 'A Screenplay'}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 50px;" />
        
        ${formattedBlocksHtml}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generates a clean, beautifully-aligned and spaced PDF report of all characters for the project.
 */
export function generateCharacterReportPDF(project: ScreenplayProject, characters: ShowcaseCharacter[], settings: UserSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isAr = settings.language === 'ar';
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const fontName = 'helvetica';
  
  doc.setFont(fontName, 'normal');
  
  // Title Page / Header section
  let currentY = 25;
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(103, 80, 164); // brand-primary color
  doc.text(isAr ? 'تقرير قاعدة بيانات الشخصيات' : 'CHARACTER DATABASE REPORT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  doc.setFontSize(14);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`${isAr ? 'سيناريو العمل:' : 'Screenplay Project:'} ${project.title}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 12;
  
  if (!characters || characters.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(isAr ? 'لا توجد شخصيات مضافة للسيناريو الحالي.' : 'No characters added to this screenplay yet.', margin, currentY);
    doc.save(`${project.title}_characters_report.pdf`);
    return;
  }
  
  characters.forEach((char, index) => {
    // Check page overflow
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
    }
    
    // Stats calculation
    const stats = getCharacterStats(project.blocks, char.name, settings.language);
    
    // Header containing name
    doc.setFont(fontName, 'bold');
    doc.setFontSize(15);
    doc.setTextColor(103, 80, 164); // brand primary purple
    doc.text(`${index + 1}. ${char.name.toUpperCase()}`, margin, currentY);
    doc.setTextColor(15, 23, 42); // restore dark tone
    currentY += 8;
    
    // Quick Meta Information
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    
    const fields = [
      { label: isAr ? 'الجنس' : 'Gender', val: char.gender || '-' },
      { label: isAr ? 'العمر' : 'Age', val: char.age || '-' },
      { label: isAr ? 'الملامح الجسدية' : 'Physical Description', val: char.physicalDescription || '-' },
      { label: isAr ? 'السمات الشخصية' : 'Personality Traits', val: char.personalityTraits || '-' },
      { label: isAr ? 'السمات النفسية' : 'Psychological Traits', val: char.psychologicalTraits || '-' },
      { label: isAr ? 'الدوافع والأهداف' : 'Motivations & Goals', val: char.motivationsGoals || '-' },
      { label: isAr ? 'قصة الخلفية' : 'Background Story', val: char.backgroundStory || '-' },
      { label: isAr ? 'العلاقات' : 'Relationships', val: char.relationships || '-' },
      { label: isAr ? 'الملاحظات' : 'Notes', val: char.notes || '-' },
    ];
    
    const statsFields = [
      { label: isAr ? 'إجمالي الظهور بالمشاهد' : 'Total Scene Appearances', val: `${stats.sceneCount}` },
      { label: isAr ? 'أرقام المشاهد المحددة' : 'Specific Scenes', val: stats.sceneNumbers.length > 0 ? stats.sceneNumbers.join(', ') : '-' },
      { label: isAr ? 'إجمالي سطور الحوار' : 'Dialogue Snatches', val: `${stats.dialogueCount}` },
      { label: isAr ? 'وقت الظهور التقديري بالشاشة' : 'Est. Screen Time', val: stats.screenTimeStr },
    ];
    
    // Print stats
    doc.setFont(fontName, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235); // Blue primary
    doc.text(isAr ? 'تحليلات نص السيناريو التلقائية:' : 'Screenplay Statistics:', margin, currentY);
    doc.setTextColor(15, 23, 42);
    currentY += 6;
    
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    statsFields.forEach(f => {
      if (currentY > pageHeight - 20) { doc.addPage(); currentY = 25; }
      doc.setFont(fontName, 'bold');
      doc.text(`  • ${f.label}: `, margin, currentY);
      doc.setFont(fontName, 'normal');
      doc.text(`${f.val}`, margin + 50, currentY);
      currentY += 5.5;
    });
    currentY += 3;
    
    // Print Details
    doc.setFont(fontName, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(103, 80, 164);
    doc.text(isAr ? 'الملف الشخصي والسمات بالتفصيل:' : 'Character Attributes & Profile:', margin, currentY);
    doc.setTextColor(15, 23, 42);
    currentY += 6;
    
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    fields.forEach(f => {
      if (!f.val || f.val === '-') return;
      
      if (currentY > pageHeight - 25) { doc.addPage(); currentY = 25; }
      
      const labelText = `  • ${f.label}: `;
      doc.setFont(fontName, 'bold');
      doc.text(labelText, margin, currentY);
      doc.setFont(fontName, 'normal');
      
      const xOffset = margin + 45;
      const textWidthRemaining = contentWidth - 45;
      
      const lines: string[] = doc.splitTextToSize(f.val, textWidthRemaining);
      if (lines.length > 0) {
        doc.text(lines[0], xOffset, currentY);
        currentY += 5.5;
        for (let l = 1; l < lines.length; l++) {
          if (currentY > pageHeight - 20) { doc.addPage(); currentY = 25; }
          doc.text(lines[l], xOffset, currentY);
          currentY += 5.5;
        }
      } else {
        currentY += 5.5;
      }
    });
    
    currentY += 6;
    
    // Draw card bottom separator line
    if (index < characters.length - 1) {
      if (currentY > pageHeight - 20) { doc.addPage(); currentY = 25; }
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    }
  });

  doc.save(`${project.title}_characters_report.pdf`);
}
