/**
 * Export Utilities
 * generateExcelBuffer — returns a Buffer (SheetJS / xlsx)
 * generatePdfBuffer   — returns a Promise<Buffer> (PDFKit, no disk I/O)
 */

const XLSX       = require('xlsx');
const PDFDocument = require('pdfkit');

// ─── Shared formatters ────────────────────────────────────────────────────────

function fmtDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit'
  });
}

function fmtTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Excel ────────────────────────────────────────────────────────────────────

/**
 * @param {object[]} records — enriched attendance rows (include distance_from_office)
 * @param {object}   filters — { from_date, to_date, employee_name }
 * @returns {Buffer}
 */
function generateExcelBuffer(records, filters = {}) {
  const COLS = [
    'Employee Name', 'Department', 'Date',
    'Check In', 'Check Out',
    'Working Hours', 'Overtime Hours',
    'Status', 'Distance from Office (m)'
  ];

  const period = [
    filters.from_date || 'All', '→', filters.to_date || 'All'
  ].join(' ');

  // Build rows as array-of-arrays
  const rows = [
    [`Attendance Report — ${period}`],   // row 0: title
    [`Generated: ${new Date().toLocaleString()}`], // row 1
    [],                                  // row 2: blank
    COLS,                                // row 3: headers
  ];

  records.forEach(r => {
    rows.push([
      r.employee_name       || '—',
      r.department          || '—',
      fmtDate(r.check_in),
      fmtTime(r.check_in),
      r.check_out ? fmtTime(r.check_out) : 'In progress',
      r.working_hours  != null ? parseFloat(r.working_hours).toFixed(2)  : '—',
      r.overtime_hours != null ? parseFloat(r.overtime_hours).toFixed(2) : '0.00',
      r.is_late ? 'Late' : 'On Time',
      r.distance_from_office != null ? r.distance_from_office : '—'
    ]);
  });

  // Summary
  const totalHours    = records.reduce((s, r) => s + (parseFloat(r.working_hours)  || 0), 0);
  const totalOvertime = records.reduce((s, r) => s + (parseFloat(r.overtime_hours) || 0), 0);
  const lateCount     = records.filter(r => r.is_late).length;

  rows.push([]);  // blank before summary
  rows.push([
    `Total records: ${records.length}`, '', '',
    '', '',
    `Total: ${totalHours.toFixed(2)} hrs`,
    `Total: ${totalOvertime.toFixed(2)} hrs`,
    `Late: ${lateCount}`, ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Merge title across all 9 columns (row 0, cols 0–8)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 14 },
    { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 15 },
    { wch: 10 }, { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * @param {object[]} records — enriched attendance rows
 * @param {object}   filters — { from_date, to_date, employee_name }
 * @returns {Promise<Buffer>}
 */
function generatePdfBuffer(records, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
      const chunks = [];

      doc.on('data',  chunk => chunks.push(chunk));
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
      doc.on('error', err   => reject(err));

      const PAGE_W = doc.page.width;
      const PAGE_H = doc.page.height;
      const MARGIN = 40;

      // ── Header ──────────────────────────────────────────────────────────────
      const period = `${filters.from_date || 'All'} → ${filters.to_date || 'All'}`;

      doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 50).fill('#2c3e50');
      doc.fillColor('white')
         .fontSize(16).font('Helvetica-Bold')
         .text('Attendance Report', MARGIN, MARGIN + 8, { width: PAGE_W - MARGIN * 2, align: 'center' });
      doc.fontSize(9).font('Helvetica')
         .text(`Period: ${period}  |  Generated: ${new Date().toLocaleString()}`,
               MARGIN, MARGIN + 30, { width: PAGE_W - MARGIN * 2, align: 'center' });

      // ── Column layout ───────────────────────────────────────────────────────
      const COLS = [
        { label: 'Employee Name',      width: 115 },
        { label: 'Department',         width: 80  },
        { label: 'Date',               width: 70  },
        { label: 'Check In',           width: 58  },
        { label: 'Check Out',          width: 65  },
        { label: 'Hours',              width: 48  },
        { label: 'Overtime',           width: 52  },
        { label: 'Status',             width: 55  },
        { label: 'Distance (m)',        width: 65  }
      ];

      const TABLE_TOP  = MARGIN + 65;
      const ROW_H      = 18;
      const HEADER_H   = 22;
      const TEXT_PAD   = 4;

      function drawRow(y, cells, isHeader, isAlt) {
        let x = MARGIN;
        COLS.forEach((col, i) => {
          if (isHeader) {
            doc.rect(x, y, col.width, HEADER_H).fill('#4a90e2');
          } else if (isAlt) {
            doc.rect(x, y, col.width, ROW_H).fill('#f0f4f8');
          }
          x += col.width;
        });

        doc.fillColor(isHeader ? 'white' : '#2c3e50')
           .fontSize(isHeader ? 8.5 : 8)
           .font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

        x = MARGIN;
        cells.forEach((cell, i) => {
          const colW = COLS[i].width;
          const textY = y + (isHeader ? HEADER_H : ROW_H) / 2 - 4;
          doc.text(String(cell ?? '—'), x + TEXT_PAD, textY, {
            width: colW - TEXT_PAD * 2, ellipsis: true, lineBreak: false
          });
          x += colW;
        });

        // Row border
        doc.moveTo(MARGIN, y + (isHeader ? HEADER_H : ROW_H))
           .lineTo(MARGIN + COLS.reduce((s, c) => s + c.width, 0), y + (isHeader ? HEADER_H : ROW_H))
           .strokeColor('#dee2e6').lineWidth(0.5).stroke();
      }

      // ── Table header ────────────────────────────────────────────────────────
      drawRow(TABLE_TOP, COLS.map(c => c.label), true, false);

      // ── Data rows ───────────────────────────────────────────────────────────
      let yPos      = TABLE_TOP + HEADER_H;
      const TABLE_W = COLS.reduce((s, c) => s + c.width, 0);

      records.forEach((r, idx) => {
        if (yPos + ROW_H > PAGE_H - MARGIN - 40) {
          doc.addPage({ layout: 'landscape', size: 'A4', margin: 40 });
          yPos = MARGIN;
          drawRow(yPos, COLS.map(c => c.label), true, false);
          yPos += HEADER_H;
        }

        drawRow(yPos, [
          r.employee_name  || '—',
          r.department     || '—',
          fmtDate(r.check_in),
          fmtTime(r.check_in),
          r.check_out ? fmtTime(r.check_out) : 'In progress',
          r.working_hours  != null ? parseFloat(r.working_hours).toFixed(2)  : '—',
          r.overtime_hours != null ? parseFloat(r.overtime_hours).toFixed(2) : '0.00',
          r.is_late ? 'Late' : 'On Time',
          r.distance_from_office != null ? r.distance_from_office : '—'
        ], false, idx % 2 === 1);

        yPos += ROW_H;
      });

      // ── Summary bar ─────────────────────────────────────────────────────────
      const totalHours    = records.reduce((s, r) => s + (parseFloat(r.working_hours)  || 0), 0);
      const totalOvertime = records.reduce((s, r) => s + (parseFloat(r.overtime_hours) || 0), 0);
      const lateCount     = records.filter(r => r.is_late).length;

      const sumY = Math.min(yPos + 10, PAGE_H - MARGIN - 25);
      doc.rect(MARGIN, sumY, TABLE_W, 22).fill('#2c3e50');
      doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold')
         .text(
           `Records: ${records.length}    |    ` +
           `Total Hours: ${totalHours.toFixed(2)}    |    ` +
           `Overtime: ${totalOvertime.toFixed(2)}    |    ` +
           `Late: ${lateCount}`,
           MARGIN, sumY + 6,
           { width: TABLE_W, align: 'center' }
         );

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateExcelBuffer, generatePdfBuffer };
