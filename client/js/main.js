/**
 * Employee Dashboard
 * Requires a valid JWT in localStorage. Redirects to /login if missing.
 */

const API = '/api';
const GPS_MAX_ACCURACY = 50; // metres — reject fixes less precise than this

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

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';

    const yes = document.getElementById('confirmYes');
    const no  = document.getElementById('confirmNo');

    function close(result) {
      modal.style.display = 'none';
      yes.removeEventListener('click', onYes);
      no.removeEventListener('click', onNo);
      modal.removeEventListener('click', onOverlay);
      resolve(result);
    }

    const onYes     = () => close(true);
    const onNo      = () => close(false);
    const onOverlay = e => { if (e.target === modal) close(false); };

    yes.addEventListener('click', onYes);
    no.addEventListener('click', onNo);
    modal.addEventListener('click', onOverlay);
  });
}

// ─── GPS Module ───────────────────────────────────────────────────────────────

const GPS = {
  coords: null,

  setStatus(state, message) {
    const bar  = document.getElementById('gpsStatus');
    const text = document.getElementById('gpsStatusText');
    if (!bar || !text) return;
    bar.className    = `gps-status gps-${state}`;
    text.textContent = message;
  },

  capture() {
    this.setStatus('loading', 'Getting your location…');

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by this browser.';
        this.setStatus('error', msg);
        this.coords = null;
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          this.coords = {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy:  Math.round(pos.coords.accuracy)
          };
          this.setStatus('ok', `Location captured (±${this.coords.accuracy} m)`);
          resolve(this.coords);
        },
        err => {
          this.coords = null;
          const MESSAGES = {
            1: 'Location access denied. Please allow location in your browser settings.',
            2: 'Location unavailable. Check your device GPS settings.',
            3: 'Location request timed out. Please try again.'
          };
          const msg = MESSAGES[err.code] || 'Failed to get location.';
          this.setStatus('error', msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
};

// ─── Live clock & greeting ────────────────────────────────────────────────────

function startClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl  = document.getElementById('liveDate');

  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
    if (dateEl)  dateEl.textContent  = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  tick();
  setInterval(tick, 1000);
}

function applyGreeting(user) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  const greetEl  = document.getElementById('greeting');
  const nameEl   = document.getElementById('welcomeName');
  const dateEl   = document.getElementById('welcomeDate');

  if (greetEl) greetEl.textContent = greeting;
  if (nameEl)  nameEl.textContent  = user.username;
  if (dateEl)  dateEl.textContent  = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Elapsed time helper ──────────────────────────────────────────────────────

let elapsedInterval = null;
let currentCheckIn  = null;

function elapsedSince(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function startElapsedTimer() {
  stopElapsedTimer();
  elapsedInterval = setInterval(() => {
    const el = document.getElementById('elapsedTime');
    if (el && currentCheckIn) el.textContent = elapsedSince(currentCheckIn);
  }, 60000);
}

function stopElapsedTimer() {
  if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }
}

// ─── Initialisation ──────────────────────────────────────────────────────────

async function init() {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
    window.location.href = '/login';
    return;
  }

  if (user.role === 'admin') {
    window.location.href = '/admin';
    return;
  }

  document.getElementById('userName').textContent = user.username;
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('refreshLocationBtn').addEventListener('click', () => GPS.capture().catch(() => {}));
  document.getElementById('checkinBtn').addEventListener('click', onCheckIn);
  document.getElementById('checkoutBtn').addEventListener('click', onCheckOut);

  applyGreeting(user);
  startClock();

  await updateStatus();
  await refreshTodayAttendance();

  GPS.capture().catch(() => {});
}

// ─── Check In ────────────────────────────────────────────────────────────────

async function onCheckIn() {
  const btn = document.getElementById('checkinBtn');
  btn.disabled    = true;
  btn.textContent = '⟳ Getting location…';

  let payload = {};
  try {
    const coords = await GPS.capture();

    if (coords.accuracy > GPS_MAX_ACCURACY) {
      showToast(
        `GPS accuracy too low (±${coords.accuracy} m — need ≤${GPS_MAX_ACCURACY} m). ` +
        `Move outdoors or wait for a stronger signal, then try again.`,
        'error', 9000
      );
      btn.disabled    = false;
      btn.textContent = '✓ Check In';
      return;
    }

    payload = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
  } catch (gpsErr) {
    showToast(`Location: ${gpsErr.message}`, 'warning');
  }

  btn.textContent = '⟳ Checking in…';

  try {
    const response = await authFetch(`${API}/attendance/checkin`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data.status === 'success') {
      const loc = data.data.location;
      let msg = 'Checked in successfully!';
      if (loc?.distance_from_office != null) {
        msg += ` You are ${loc.distance_from_office} m from the office.`;
      }
      showToast(msg, 'success', 7000);
      await updateStatus();
      await refreshTodayAttendance();
    } else {
      showToast(data.message || 'Check-in failed.', 'error');
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      showToast('Check-in failed. Please try again.', 'error');
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = '✓ Check In';
  }
}

// ─── Check Out ───────────────────────────────────────────────────────────────

async function onCheckOut() {
  const confirmed = await showConfirm('Are you sure you want to check out?');
  if (!confirmed) return;

  const btn = document.getElementById('checkoutBtn');
  btn.disabled    = true;
  btn.textContent = '⟳ Getting location…';

  let payload = {};
  try {
    const coords = await GPS.capture();

    if (coords.accuracy > GPS_MAX_ACCURACY) {
      showToast(
        `GPS accuracy too low (±${coords.accuracy} m — need ≤${GPS_MAX_ACCURACY} m). ` +
        `Move outdoors or wait for a stronger signal, then try again.`,
        'error', 9000
      );
      btn.disabled    = false;
      btn.textContent = '⊗ Check Out';
      return;
    }

    payload = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
  } catch (gpsErr) {
    showToast(`Location: ${gpsErr.message}`, 'warning');
  }

  btn.textContent = '⟳ Checking out…';

  try {
    const response = await authFetch(`${API}/attendance/checkout`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data.status === 'success') {
      const { working_hours, overtime_hours } = data.data;
      let msg = `Checked out! Worked ${working_hours} hrs`;
      if (overtime_hours > 0) msg += ` (+${overtime_hours} overtime)`;
      msg += '.';
      showToast(msg, 'success', 8000);
      await updateStatus();
      await refreshTodayAttendance();
    } else {
      showToast(data.message || 'Check-out failed.', 'error');
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      showToast('Check-out failed. Please try again.', 'error');
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = '⊗ Check Out';
  }
}

// ─── Current status card ──────────────────────────────────────────────────────

async function updateStatus() {
  try {
    const response = await authFetch(`${API}/attendance/today`);
    const data = await response.json();

    if (data.status === 'success' && data.data.length > 0) {
      const latest = data.data[data.data.length - 1];
      if (!latest.check_out) {
        currentCheckIn = latest.check_in;
        displayStatus('checked-in', latest);
        startElapsedTimer();
      } else {
        currentCheckIn = null;
        stopElapsedTimer();
        displayStatus('checked-out', latest);
      }
    } else {
      currentCheckIn = null;
      stopElapsedTimer();
      displayStatus('no-record', null);
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      console.error('Status update error:', error);
    }
  }
}

function displayStatus(type, record) {
  const container = document.getElementById('statusContainer');

  if (type === 'no-record') {
    container.className = 'status-container';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🕐</div>
        <p>You haven't checked in today.</p>
      </div>`;
    return;
  }

  container.className = `status-container status-${type}`;

  if (type === 'checked-in') {
    container.innerHTML = `
      <div class="status-item">
        <strong>Status</strong>
        <div class="value">● Checked In</div>
      </div>
      <div class="status-item">
        <strong>Check-In Time</strong>
        <div class="value">${formatTime(record.check_in)}</div>
        <div class="sub-value" id="elapsedTime">${elapsedSince(record.check_in)}</div>
      </div>
      <div class="status-item">
        <strong>Punctuality</strong>
        <div class="value">${record.is_late ? '⚠ Late' : '✓ On Time'}</div>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="status-item">
        <strong>Status</strong>
        <div class="value">Checked Out</div>
      </div>
      <div class="status-item">
        <strong>Check-Out Time</strong>
        <div class="value">${formatTime(record.check_out)}</div>
      </div>
      <div class="status-item">
        <strong>Total Hours</strong>
        <div class="value">${record.working_hours ?? '—'} hrs</div>
      </div>
      ${record.overtime_hours > 0 ? `
      <div class="status-item">
        <strong>Overtime</strong>
        <div class="value">+${record.overtime_hours} hrs</div>
      </div>` : ''}`;
  }
}

// ─── Today's attendance table ─────────────────────────────────────────────────

async function refreshTodayAttendance() {
  try {
    const response = await authFetch(`${API}/attendance/today`);
    const data     = await response.json();
    const tbody    = document.querySelector('#todayAttendanceTable tbody');

    if (data.status === 'success' && data.data.length > 0) {
      tbody.innerHTML = '';
      data.data.forEach(record => {
        const duration    = record.check_out
          ? `${record.working_hours} hrs`
          : '<em style="color:#94a3b8">In progress</em>';
        const statusBadge = record.is_late
          ? '<span class="badge warning">Late</span>'
          : '<span class="badge success">On Time</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatTime(record.check_in)}</td>
          <td>${record.check_out ? formatTime(record.check_out) : '—'}</td>
          <td>${duration}</td>
          <td>${statusBadge}</td>`;
        tbody.appendChild(row);
      });
    } else {
      tbody.innerHTML = `
        <tr><td colspan="4">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>No attendance records for today.</p>
          </div>
        </td></tr>`;
    }
  } catch (error) {
    if (error.message !== 'Session expired') {
      console.error('Table refresh error:', error);
    }
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  const d  = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
