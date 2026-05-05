/**
 * Admin Dashboard
 * Requires a valid JWT with role=admin. Redirects to /login otherwise.
 */

const API       = '/api';
const PAGE_SIZE = 20;
let currentPage  = 1;
let totalRecords = 0;

// ─── Auth helpers ────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('accessToken');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function logout() {
  ['accessToken', 'refreshToken', 'user'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/login';
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  return response;
}

// ─── Toast notifications ──────────────────────────────────────────────────────

const TOAST_ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML =
    `<span class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</span>` +
    `<span class="toast-body">${message}</span>`;

  container.appendChild(toast);

  const dismiss = () => {
    if (toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 280);
  };

  toast.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

// ─── Charts ───────────────────────────────────────────────────────────────────

let dailyChart  = null;
let statusChart = null;

function initCharts() {
  const dailyCtx  = document.getElementById('dailyChart')?.getContext('2d');
  const statusCtx = document.getElementById('statusChart')?.getContext('2d');
  if (!dailyCtx || !statusCtx) return;

  dailyChart = new Chart(dailyCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Check-ins',
        data: [],
        backgroundColor: 'rgba(74, 144, 226, 0.75)',
        borderColor: '#4a90e2',
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, font: { size: 11 } },
          grid: { color: '#f0f4f8' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });

  statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['On Time', 'Late'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 16, usePointStyle: true }
        }
      }
    }
  });
}

function updateCharts(records) {
  if (!dailyChart || !statusChart) return;

  // Group by date — use ISO date string as sort key, display label separately
  const dateMap = new Map();
  records.forEach(r => {
    const sortKey = new Date(r.check_in).toISOString().split('T')[0];
    const label   = new Date(r.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dateMap.has(sortKey)) dateMap.set(sortKey, { label, count: 0 });
    dateMap.get(sortKey).count++;
  });

  const sorted  = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
  dailyChart.data.labels                = sorted.map(([, v]) => v.label);
  dailyChart.data.datasets[0].data      = sorted.map(([, v]) => v.count);
  dailyChart.update();

  const lateCount   = records.filter(r => r.is_late).length;
  const onTimeCount = records.length - lateCount;
  statusChart.data.datasets[0].data = [onTimeCount, lateCount];
  statusChart.update();
}

function resetCharts() {
  if (dailyChart) {
    dailyChart.data.labels = [];
    dailyChart.data.datasets[0].data = [];
    dailyChart.update();
  }
  if (statusChart) {
    statusChart.data.datasets[0].data = [0, 0];
    statusChart.update();
  }
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

async function loadSummaryCards() {
  try {
    const [empRes, todayRes] = await Promise.all([
      authFetch(`${API}/attendance/employees`),
      authFetch(`${API}/attendance/today`)
    ]);

    const empData   = await empRes.json();
    const todayData = await todayRes.json();

    const totalEmployees = empData.status === 'success' ? empData.count : 0;
    const todayRecords   = todayData.status === 'success' ? todayData.data : [];

    const presentNow = todayRecords.filter(r => !r.check_out).length;
    const totalHours = todayRecords
      .filter(r => r.check_out && r.working_hours != null)
      .reduce((s, r) => s + parseFloat(r.working_hours), 0);
    const lateCount  = todayRecords.filter(r => r.is_late).length;

    setText('cardTotalEmployees', totalEmployees);
    setText('cardPresentNow',     presentNow);
    setText('cardTotalHours',     totalHours.toFixed(1));
    setText('cardLateCount',      lateCount);
  } catch (error) {
    if (error.message !== 'Session expired') {
      console.error('Summary cards error:', error);
    }
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ─── Initialisation ──────────────────────────────────────────────────────────

async function init() {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
    window.location.href = '/login';
    return;
  }

  if (user.role !== 'admin') {
    window.location.href = '/';
    return;
  }

  document.getElementById('userName').textContent = user.username;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  initCharts();
  setupEventListeners();
  setDefaultDates();

  await Promise.all([
    loadEmployees(),
    loadSummaryCards()
  ]);

  await loadAttendance();
}

// ─── Employees dropdown ───────────────────────────────────────────────────────

let employees = [];

async function loadEmployees() {
  try {
    const response = await authFetch(`${API}/attendance/employees`);
    const data = await response.json();

    if (data.status === 'success') {
      employees = data.data;
      populateEmployeeSelects();
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      showToast('Failed to load employees list.', 'error');
    }
  }
}

function populateEmployeeSelects() {
  const filterEmployee = document.getElementById('filterEmployee');
  const statsEmployee  = document.getElementById('statsEmployee');

  [filterEmployee, statsEmployee].forEach(select => {
    while (select.options.length > 1) select.remove(1);

    employees.forEach(emp => {
      const option = document.createElement('option');
      option.value       = emp.id;
      option.textContent = emp.name;
      select.appendChild(option);
    });
  });
}

// ─── Event listeners & date defaults ─────────────────────────────────────────

function setupEventListeners() {
  document.getElementById('filterBtn').addEventListener('click', () => {
    currentPage = 1;
    loadAttendance();
  });
  document.getElementById('resetBtn').addEventListener('click', onReset);
  document.getElementById('statsBtn').addEventListener('click', onShowStatistics);
  
  // Export scope buttons
  document.getElementById('exportPageExcelBtn').addEventListener('click', () => exportReport('excel', 'page'));
  document.getElementById('exportPagePdfBtn').addEventListener('click',   () => exportReport('pdf', 'page'));
  document.getElementById('exportAllExcelBtn').addEventListener('click',  () => exportReport('excel', 'all'));
  document.getElementById('exportAllPdfBtn').addEventListener('click',    () => exportReport('pdf', 'all'));
}

function setDefaultDates() {
  const today        = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById('filterFromDate').value = firstOfMonth.toISOString().split('T')[0];
  document.getElementById('filterToDate').value   = today.toISOString().split('T')[0];
}

async function onReset() {
  document.getElementById('filterEmployee').value = '';
  currentPage = 1;
  setDefaultDates();
  await loadAttendance();
}

// ─── Attendance records ───────────────────────────────────────────────────────

async function loadAttendance() {
  const filterBtn = document.getElementById('filterBtn');
  filterBtn.disabled    = true;
  filterBtn.textContent = 'Loading…';

  try {
    const params   = buildFilterParams();
    const url      = `${API}/attendance${params ? '?' + params : ''}`;
    const response = await authFetch(url);
    const data     = await response.json();

    if (data.status === 'success') {
      populateAttendanceTable(data.data);
      updateCharts(data.data);
      totalRecords = data.total ?? data.count;
      renderPagination();
      showMessage(`Found ${totalRecords} record(s).`, 'success');
    } else {
      showMessage(data.message || 'Failed to load records.', 'error');
      resetCharts();
      totalRecords = 0;
      renderPagination();
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      showMessage('Failed to load attendance records.', 'error');
    }
  } finally {
    filterBtn.disabled    = false;
    filterBtn.textContent = 'Apply Filter';
  }
}

function buildFilterParams() {
  const params     = new URLSearchParams();
  const employeeId = document.getElementById('filterEmployee').value;
  const fromDate   = document.getElementById('filterFromDate').value;
  const toDate     = document.getElementById('filterToDate').value;

  if (employeeId) params.append('employee_id', employeeId);
  if (fromDate)   params.append('from_date', fromDate);
  if (toDate)     params.append('to_date', toDate);

  params.append('limit',  PAGE_SIZE);
  params.append('offset', (currentPage - 1) * PAGE_SIZE);

  return params.toString();
}

function populateAttendanceTable(records) {
  const tbody = document.querySelector('#attendanceTable tbody');

  if (!records.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>No records found for the selected filters.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  records.forEach(record => {
    const date = new Date(record.check_in).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const checkIn  = formatTime(record.check_in);
    const checkOut = record.check_out ? formatTime(record.check_out) : '—';
    const duration = record.check_out
      ? `${record.working_hours} hrs`
      : '<em style="color:#94a3b8">In progress</em>';

    const statusBadge = record.is_late
      ? '<span class="badge warning">Late</span>'
      : '<span class="badge success">On Time</span>';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${record.employee_name}</strong></td>
      <td>${date}</td>
      <td>${checkIn}</td>
      <td>${checkOut}</td>
      <td>${duration}</td>
      <td>${statusBadge}</td>`;
    tbody.appendChild(row);
  });
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('paginationContainer');
  if (!container) return;

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(currentPage * PAGE_SIZE, totalRecords);

  if (totalPages <= 1) {
    container.innerHTML = totalRecords > 0
      ? `<span class="pagination-info">Showing all ${totalRecords} record(s)</span>`
      : '';
    return;
  }

  const startPage = Math.max(1, currentPage - 2);
  const endPage   = Math.min(totalPages, startPage + 4);

  let pageBtns = '';
  for (let p = startPage; p <= endPage; p++) {
    pageBtns += `<button class="page-btn${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`;
  }

  container.innerHTML = `
    <span class="pagination-info">Showing ${from}–${to} of ${totalRecords}</span>
    <div class="pagination-controls">
      <button class="page-btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''}>«</button>
      <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${pageBtns}
      <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
      <button class="page-btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
    </div>`;

  container.querySelectorAll('.page-btn[data-page]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        loadAttendance();
      }
    });
  });
}

// ─── Statistics ───────────────────────────────────────────────────────────────

async function onShowStatistics() {
  const statsBtn   = document.getElementById('statsBtn');
  const employeeId = document.getElementById('statsEmployee').value;

  if (!employeeId) {
    showToast('Please select an employee first.', 'warning');
    return;
  }

  statsBtn.disabled    = true;
  statsBtn.textContent = 'Loading…';

  try {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate   = document.getElementById('filterToDate').value;

    const params = new URLSearchParams({ employee_id: employeeId });
    if (fromDate) params.append('from_date', fromDate);
    if (toDate)   params.append('to_date', toDate);

    const response = await authFetch(`${API}/attendance/statistics?${params.toString()}`);
    const data     = await response.json();

    if (data.status === 'success') {
      displayStatistics(data.data);
      document.getElementById('statsContainer').style.display = 'block';
    } else {
      showToast(data.message || 'Failed to load statistics.', 'error');
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      showToast('Failed to load statistics.', 'error');
    }
  } finally {
    statsBtn.disabled    = false;
    statsBtn.textContent = 'Show Statistics';
  }
}

function displayStatistics(stats) {
  setText('totalDays',  stats.total_days);
  setText('lateDays',   stats.late_days);
  setText('totalHours', `${stats.total_working_hours}`);
  setText('avgHours',   `${stats.avg_working_hours}`);
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportReport(format, scope = 'all') {
  const buttonId  = `export${scope === 'page' ? 'Page' : 'All'}${format === 'excel' ? 'Excel' : 'Pdf'}Btn`;
  const btn       = document.getElementById(buttonId);
  const origText  = btn.textContent;

  btn.disabled    = true;
  btn.textContent = '⟳ Generating…';

  try {
    // Build export params including scope
    const params = new URLSearchParams();
    
    // Add filters
    const employeeId = document.getElementById('filterEmployee').value;
    const fromDate   = document.getElementById('filterFromDate').value;
    const toDate     = document.getElementById('filterToDate').value;
    
    if (employeeId) params.append('employee_id', employeeId);
    if (fromDate)   params.append('from_date', fromDate);
    if (toDate)     params.append('to_date', toDate);
    
    // Add scope
    params.append('scope', scope);
    
    // Only add pagination if scope is 'page'
    if (scope === 'page') {
      params.append('limit',  PAGE_SIZE);
      params.append('offset', (currentPage - 1) * PAGE_SIZE);
    }

    const url      = `${API}/reports/${format}${params ? '?' + params.toString() : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Export failed (HTTP ${response.status})`);
    }

    const blob     = await response.blob();
    const ext      = format === 'excel' ? 'xlsx' : 'pdf';
    const scopeStr = scope === 'page' ? `_page${currentPage}` : '_all';
    const filename = `attendance_${new Date().toISOString().slice(0, 10)}${scopeStr}.${ext}`;

    const objectUrl = URL.createObjectURL(blob);
    const anchor    = document.createElement('a');
    anchor.href     = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);

    showToast(`${format.toUpperCase()} report (${scope}) downloaded successfully.`, 'success');
  } catch (error) {
    if (error.message !== 'Session expired') {
      showToast(error.message || 'Export failed. Please try again.', 'error');
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = origText;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function showMessage(message, type = 'info') {
  const el = document.getElementById('messageAlert');
  if (!el) return;
  el.textContent   = message;
  el.className     = `alert ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
