/**
 * Report Controller
 * Admin-only Excel and PDF export of attendance records.
 */

const db = require('../config/database');
const { generateExcelBuffer, generatePdfBuffer } = require('../utils/exportUtils');
const { calculateDistance } = require('../utils/validators');
const AppError = require('../utils/AppError');
const logger   = require('../utils/logger');

// ─── Shared data fetcher ──────────────────────────────────────────────────────

async function fetchReportData(query) {
  const { employee_id, from_date, to_date, scope, limit, offset } = query;

  let sql = `
    SELECT a.id, e.name AS employee_name, e.department,
           a.check_in, a.check_out,
           a.working_hours, a.overtime_hours, a.is_late,
           a.check_in_latitude, a.check_in_longitude
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (employee_id) {
    sql += ' AND a.employee_id = ?';
    params.push(parseInt(employee_id));
  }
  if (from_date) { sql += ' AND DATE(a.check_in) >= ?'; params.push(from_date); }
  if (to_date)   { sql += ' AND DATE(a.check_in) <= ?'; params.push(to_date);   }

  sql += ' ORDER BY a.check_in DESC';

  if (scope === 'page') {
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 200);
    const off = Math.max(parseInt(offset) || 0, 0);
    sql += ' LIMIT ? OFFSET ?';
    params.push(lim, off);
  }

  const [rows] = await db.query(sql, params);

  // Enrich with distance-from-office if office coords are configured
  const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
  const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
  const hasOffice = !isNaN(officeLat) && !isNaN(officeLon) && officeLat && officeLon;

  return rows.map(r => ({
    ...r,
    distance_from_office: hasOffice && r.check_in_latitude && r.check_in_longitude
      ? Math.round(calculateDistance(
          parseFloat(r.check_in_latitude), parseFloat(r.check_in_longitude),
          officeLat, officeLon
        ))
      : null
  }));
}

// ─── Excel export ─────────────────────────────────────────────────────────────

const exportExcel = async (req, res, next) => {
  try {
    const records = await fetchReportData(req.query);

    if (records.length === 0) {
      return next(new AppError('No attendance records found for the specified criteria.', 404));
    }

    const scope   = req.query.scope === 'page' ? 'page' : 'all';
    const pageNum = scope === 'page'
      ? Math.floor((parseInt(req.query.offset) || 0) / (parseInt(req.query.limit) || 20)) + 1
      : null;

    const filters = {
      from_date:     req.query.from_date || null,
      to_date:       req.query.to_date   || null,
      employee_name: records[0].employee_name,
      scope,
      page: pageNum
    };

    logger.info(`Admin ${req.user.username} exported Excel (${scope}) — ${records.length} rows`);

    const buffer = generateExcelBuffer(records, filters);

    const fromStr    = filters.from_date || 'all';
    const toStr      = filters.to_date   || new Date().toISOString().split('T')[0];
    const scopeSuffix = scope === 'page' ? `_page_${pageNum}` : '';
    const filename   = `attendance_${fromStr}_to_${toStr}${scopeSuffix}.xlsx`;
    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      buffer.length);
    res.send(buffer);

  } catch (error) {
    return next(error);
  }
};

// ─── PDF export ───────────────────────────────────────────────────────────────

const exportPdf = async (req, res, next) => {
  try {
    const records = await fetchReportData(req.query);

    if (records.length === 0) {
      return next(new AppError('No attendance records found for the specified criteria.', 404));
    }

    const scope   = req.query.scope === 'page' ? 'page' : 'all';
    const pageNum = scope === 'page'
      ? Math.floor((parseInt(req.query.offset) || 0) / (parseInt(req.query.limit) || 20)) + 1
      : null;

    const filters = {
      from_date:     req.query.from_date || null,
      to_date:       req.query.to_date   || null,
      employee_name: records[0].employee_name,
      scope,
      page: pageNum
    };

    logger.info(`Admin ${req.user.username} exported PDF (${scope}) — ${records.length} rows`);

    const buffer = await generatePdfBuffer(records, filters);

    const fromStr     = filters.from_date || 'all';
    const toStr       = filters.to_date   || new Date().toISOString().split('T')[0];
    const scopeSuffix = scope === 'page' ? `_page_${pageNum}` : '';
    const filename    = `attendance_${fromStr}_to_${toStr}${scopeSuffix}.pdf`;
    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      buffer.length);
    res.send(buffer);

  } catch (error) {
    return next(error);
  }
};

module.exports = { exportExcel, exportPdf };
