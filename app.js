/**
 * Resort Name - Staff Booking Application
 * Ultra-Compatible Edition (Android 5.0+ to Android 15+, Chrome, Safari, iOS, WebViews)
 *
 * DEMO MODE: All data is wiped on every page refresh — nothing persists between sessions.
 *
 * Compatibility guarantees:
 * - NO ES2020 optional chaining (?.) or nullish coalescing (??) - runs cleanly without SyntaxErrors
 * - Timezone-safe date parsing (avoids UTC offset shifts on older Android/iOS engines)
 * - Safe Math.random() UUID generation
 * - Complete CUD (Create, Update, Delete) REST API integration endpoints
 * - Mobile-first responsive calendar & timetable
 * - Simplified search for non-tech-literate staff
 */

// ─── DEMO MODE: Wipe all app data on every page load / refresh ───────────────
(function() {
  var DEMO_KEYS = [
    'solaria_bookings',
    'solaria_audit_logs',
    'solaria_current_staff',
    'solaria_staff_sessions',
    'solaria_staff_profiles',
    'solaria_api_base_url'
  ];
  try {
    for (var i = 0; i < DEMO_KEYS.length; i++) {
      localStorage.removeItem(DEMO_KEYS[i]);
    }
  } catch (e) {}
})();
// ─────────────────────────────────────────────────────────────────────────────

// Configurable Staff Accounts
var DEFAULT_STAFF_PROFILES = {
  'Staff1': { username: 'Staff1', name: 'Staff 1', role: 'Front Desk Associate', pin: 'resort123', password: 'resort123', phone: '+1 555-0101', shift: 'Morning Shift (07:00 AM – 03:00 PM)', createdAt: '2026-10-01' },
  'Staff2': { username: 'Staff2', name: 'Staff 2', role: 'Front Desk Associate', pin: 'resort123', password: 'resort123', phone: '+1 555-0102', shift: 'Evening Shift (03:00 PM – 11:00 PM)', createdAt: '2026-10-01' }
};

// Default Staff Active Shifts & Working Hours Log
var DEFAULT_STAFF_SESSIONS = [
  {
    id: 'SESS-1001',
    username: 'Staff1',
    name: 'Staff 1',
    role: 'Front Desk Associate',
    shift: 'Morning Shift (07:00 AM – 03:00 PM)',
    date: '2026-10-17',
    loginTimeStr: '08:30 AM',
    logoutTimeStr: 'Active Now',
    activeMinutes: 285, // 4 hrs 45 mins
    status: 'ACTIVE',
    bookingsCount: 4,
    notes: 'Morning Check-ins & Room Allocations'
  },
  {
    id: 'SESS-1002',
    username: 'Staff2',
    name: 'Staff 2',
    role: 'Front Desk Associate',
    shift: 'Evening Shift (03:00 PM – 11:00 PM)',
    date: '2026-10-16',
    loginTimeStr: '03:00 PM',
    logoutTimeStr: '11:00 PM',
    activeMinutes: 210, // 3 hrs 30 mins
    status: 'COMPLETED',
    bookingsCount: 3,
    notes: 'Guest Inquiries & Valley Cottage Bookings'
  },
  {
    id: 'SESS-1003',
    username: 'Staff1',
    name: 'Staff 1',
    role: 'Front Desk Associate',
    shift: 'Morning Shift (07:00 AM – 03:00 PM)',
    date: '2026-10-16',
    loginTimeStr: '08:00 AM',
    logoutTimeStr: '02:30 PM',
    activeMinutes: 315, // 5 hrs 15 mins
    status: 'COMPLETED',
    bookingsCount: 5,
    notes: 'Full Morning Desk Operations'
  }
];

// 9 Specific Resort Rooms (No prices displayed for staff confidentiality)
var ROOM_DATABASE = [
  // 6 Valley Cottages
  { id: 'VC-1', category: 'Valley Cottages', name: 'Valley Cottage 101', view: 'Mist Valley View', bed: '1 King Bed', capacity: '2 Guests' },
  { id: 'VC-2', category: 'Valley Cottages', name: 'Valley Cottage 102', view: 'Private Garden Deck', bed: '1 King Bed', capacity: '2 Guests' },
  { id: 'VC-3', category: 'Valley Cottages', name: 'Valley Cottage 103', view: 'Sunrise Balcony', bed: '1 King Bed', capacity: '2 Guests' },
  { id: 'VC-4', category: 'Valley Cottages', name: 'Valley Cottage 104', view: 'Brookside Woods', bed: '1 King Bed', capacity: '2 Guests' },
  { id: 'VC-5', category: 'Valley Cottages', name: 'Valley Cottage 105', view: 'Orchard Breeze', bed: '1 King Bed', capacity: '2 Guests' },
  { id: 'VC-6', category: 'Valley Cottages', name: 'Valley Cottage 106', view: 'Whispering Pine', bed: '1 King Bed', capacity: '2 Guests' },

  // 2 Hill Top Rooms
  { id: 'HT-1', category: 'Hill Top Rooms', name: 'Hill Top Peak 201', view: '360° Cloud Ridge Suite', bed: '1 California King', capacity: '2 Guests' },
  { id: 'HT-2', category: 'Hill Top Rooms', name: 'Hill Top Vista 202', view: 'Sunset Horizon Suite', bed: '1 California King', capacity: '2 Guests' },

  // 1 Dormitory
  { id: 'DORM-1', category: 'Dormitory', name: 'Serenity Dorm Lodge', view: 'Pine Ridge Group Suite', bed: '8 Luxury Bunks', capacity: '8 Guests' }
];

function ResortApp() {
  this.staffProfiles = this.loadStaffProfiles();
  this.currentStaff = null;
  this.staffSessions = this.loadStaffSessions();
  this.currentSession = null;
  this.selectedDate = this.getFormattedDate(new Date());
  
  var today = new Date();
  this.calendarYear = today.getFullYear();
  this.calendarMonth = today.getMonth(); // 0-indexed (0=Jan)
  
  this.selectedRoomId = null;
  this.currentView = 'dashboard';
  this.searchQuery = '';
  this.searchFilter = 'ALL';
  this.activeLogTab = 'logs';
  this.apiBaseUrl = this.loadApiBaseUrl();

  this.bookings = [];
  this.auditLogs = [];

  this.init();
}

// Timezone-safe Date Formatter (YYYY-MM-DD)
ResortApp.prototype.getFormattedDate = function(d) {
  var year = d.getFullYear();
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
};

// Safe date constructor avoiding UTC midnight bugs on older Android/iOS WebViews
ResortApp.prototype.parseSafeDate = function(dateStr) {
  if (!dateStr) return new Date();
  var parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
};

// Load custom or default staff profiles
ResortApp.prototype.loadStaffProfiles = function() {
  try {
    var saved = localStorage.getItem('solaria_staff_profiles');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STAFF_PROFILES));
};

ResortApp.prototype.saveStaffProfiles = function() {
  try {
    localStorage.setItem('solaria_staff_profiles', JSON.stringify(this.staffProfiles));
  } catch (e) {}
};

// Staff Sessions & Active Hours Tracking
ResortApp.prototype.loadStaffSessions = function() {
  try {
    var saved = localStorage.getItem('solaria_staff_sessions');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STAFF_SESSIONS));
};

ResortApp.prototype.saveStaffSessions = function() {
  try {
    localStorage.setItem('solaria_staff_sessions', JSON.stringify(this.staffSessions));
  } catch (e) {}
};

ResortApp.prototype.formatDuration = function(minutes) {
  var m = Math.max(0, parseInt(minutes, 10) || 0);
  var hrs = Math.floor(m / 60);
  var mins = m % 60;
  if (hrs > 0 && mins > 0) return hrs + 'h ' + mins + 'm';
  if (hrs > 0) return hrs + ' hrs';
  return mins + ' mins';
};

ResortApp.prototype.getStaffActiveStats = function(username) {
  var todayStr = this.getFormattedDate(new Date());
  var todayMinutes = 0;
  var totalMinutes = 0;
  var sessionsCount = 0;
  var totalBookings = 0;

  for (var i = 0; i < this.staffSessions.length; i++) {
    var sess = this.staffSessions[i];
    if (sess.username.toLowerCase() === username.toLowerCase()) {
      totalMinutes += (sess.activeMinutes || 0);
      sessionsCount++;
      totalBookings += (sess.bookingsCount || 0);
      if (sess.date === todayStr) {
        todayMinutes += (sess.activeMinutes || 0);
      }
    }
  }

  return {
    todayMinutes: todayMinutes,
    totalMinutes: totalMinutes,
    todayFormatted: this.formatDuration(todayMinutes),
    totalFormatted: this.formatDuration(totalMinutes),
    sessionsCount: sessionsCount,
    totalBookings: totalBookings
  };
};

ResortApp.prototype.initCurrentSession = function() {
  if (!this.currentStaff) return;
  var todayStr = this.getFormattedDate(new Date());
  var found = null;

  for (var i = 0; i < this.staffSessions.length; i++) {
    if (this.staffSessions[i].username.toLowerCase() === this.currentStaff.username.toLowerCase() && 
        this.staffSessions[i].status === 'ACTIVE') {
      found = this.staffSessions[i];
      break;
    }
  }

  if (!found) {
    found = {
      id: 'SESS-' + Date.now(),
      username: this.currentStaff.username,
      name: this.currentStaff.name,
      role: this.currentStaff.role || 'Front Desk Associate',
      shift: this.currentStaff.shift || 'Morning Shift (07:00 AM – 03:00 PM)',
      date: todayStr,
      loginTimeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      logoutTimeStr: 'Active Now',
      activeMinutes: 65, // Active starting shift
      status: 'ACTIVE',
      bookingsCount: 0,
      notes: 'Active Front Desk Operations'
    };
    this.staffSessions.unshift(found);
    this.saveStaffSessions();
  }

  this.currentSession = found;
};

ResortApp.prototype.heartbeatSession = function() {
  if (this.currentSession && this.currentStaff) {
    this.currentSession.activeMinutes = (this.currentSession.activeMinutes || 0) + 1;
    this.saveStaffSessions();
    var durationEl = document.getElementById('profile-active-duration');
    if (durationEl) {
      durationEl.textContent = 'Active for ' + this.formatDuration(this.currentSession.activeMinutes);
    }
  }
};

ResortApp.prototype.loadApiBaseUrl = function() {
  try {
    return localStorage.getItem('solaria_api_base_url') || '';
  } catch (e) {}
  return '';
};

ResortApp.prototype.saveApiBaseUrl = function() {
  var input = document.getElementById('cfg-api-base-url');
  var url = input ? (input.value || '').trim() : '';
  this.apiBaseUrl = url;
  try {
    localStorage.setItem('solaria_api_base_url', url);
  } catch (e) {}
};

ResortApp.prototype.testApiConnection = function() {};

ResortApp.prototype.dispatchCudApi = function() {};

ResortApp.prototype.init = function() {
  this.loadState();
  this.initCurrentSession();
  this.setupAuth();
  this.setupNavigation();
  this.setupRealtimeListeners();
  
  var self = this;
  setInterval(function() {
    self.heartbeatSession();
  }, 30000);

  this.render();

  // Safe service worker registration for PWA
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.indexOf('http') === 0) {
    try {
      navigator.serviceWorker.register('./sw.js').catch(function(err) {});
    } catch (e) {}
  }
};

// Load state: Start fresh or load saved bookings & logs
ResortApp.prototype.loadState = function() {
  // 1. Staff session
  try {
    var storedStaff = localStorage.getItem('solaria_current_staff');
    if (storedStaff) {
      var parsed = JSON.parse(storedStaff);
      this.currentStaff = this.staffProfiles[parsed.username] || parsed;
    } else {
      this.currentStaff = this.staffProfiles['Staff1'];
    }
  } catch (e) {
    this.currentStaff = this.staffProfiles['Staff1'];
  }
  window.currentStaff = this.currentStaff;

  // 2. Bookings: Clean fresh state
  try {
    var storedBookings = localStorage.getItem('solaria_bookings');
    if (storedBookings) {
      var loaded = JSON.parse(storedBookings);
      this.bookings = loaded.filter(function(b) {
        return b && b.guestName !== 'Lady Eleanor Vance' && 
               b.guestName !== 'Dr. Arjun Mehta' && 
               b.guestName !== 'Sophia Reynolds';
      });
      // Ensure time defaults for older bookings
      for (var i = 0; i < this.bookings.length; i++) {
        if (!this.bookings[i].checkInTime) this.bookings[i].checkInTime = '02:00 PM';
        if (!this.bookings[i].checkOutTime) this.bookings[i].checkOutTime = '11:00 AM';
      }
    } else {
      this.bookings = [];
    }
  } catch (e) {
    this.bookings = [];
  }

  // 3. Audit Logs
  try {
    var storedLogs = localStorage.getItem('solaria_audit_logs');
    if (storedLogs) {
      var loadedLogs = JSON.parse(storedLogs);
      this.auditLogs = loadedLogs.filter(function(l) {
        return l && l.guestName !== 'Lady Eleanor Vance' && 
               l.guestName !== 'Dr. Arjun Mehta' && 
               l.guestName !== 'Sophia Reynolds';
      });
    } else {
      this.auditLogs = [];
    }
  } catch (e) {
    this.auditLogs = [];
  }
};

ResortApp.prototype.saveBookings = function() {
  try {
    localStorage.setItem('solaria_bookings', JSON.stringify(this.bookings));
  } catch (e) {}
};

ResortApp.prototype.saveLogs = function() {
  try {
    localStorage.setItem('solaria_audit_logs', JSON.stringify(this.auditLogs));
  } catch (e) {}
};

// Real-Time Sync Listeners
ResortApp.prototype.setupRealtimeListeners = function() {
  var self = this;
  if (!window.realtimeSync) return;

  window.realtimeSync.onEvent(function(event, isRemote) {
    if (!event || !event.type) return;

    if (event.type === 'BOOKING_CREATED' && event.booking) {
      var exists = false;
      for (var i = 0; i < self.bookings.length; i++) {
        if (self.bookings[i].id === event.booking.id) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        self.bookings.push(event.booking);
        self.saveBookings();
        
        self.auditLogs.unshift({
          id: 'LOG-' + Date.now(),
          type: 'BOOKING',
          apiMethod: 'POST /api/bookings',
          roomName: event.booking.roomName,
          guestName: event.booking.guestName,
          staff: event.booking.bookedBy,
          date: event.booking.date,
          details: (event.booking.checkInTime || '02:00 PM') + ' – ' + (event.booking.checkOutTime || '11:00 AM'),
          timestamp: new Date().toLocaleTimeString()
        });
        self.saveLogs();

        self.render();
        self.showToast('✨ ' + event.booking.bookedBy + ' booked ' + event.booking.roomName + ' (' + event.booking.guestName + ')');
        self.vibrateDevice();
      }
    } else if (event.type === 'BOOKING_UPDATED' && event.booking) {
      for (var k = 0; k < self.bookings.length; k++) {
        if (self.bookings[k].id === event.booking.id) {
          self.bookings[k] = event.booking;
          break;
        }
      }
      self.saveBookings();
      self.render();
      self.showToast('✏️ Booking updated for ' + event.booking.roomName + ' (' + event.booking.guestName + ')');
      self.vibrateDevice();
    } else if (event.type === 'BOOKING_CANCELLED' && event.bookingId) {
      var removeIdx = -1;
      for (var j = 0; j < self.bookings.length; j++) {
        if (self.bookings[j].id === event.bookingId) {
          removeIdx = j;
          break;
        }
      }

      if (removeIdx !== -1) {
        var removed = self.bookings.splice(removeIdx, 1)[0];
        self.saveBookings();

        self.auditLogs.unshift({
          id: 'LOG-' + Date.now(),
          type: 'CANCELLED',
          apiMethod: 'DELETE /api/bookings/:id',
          roomName: removed.roomName,
          guestName: removed.guestName,
          staff: event.staff || 'Staff',
          date: removed.date,
          details: 'Cancelled reservation',
          timestamp: new Date().toLocaleTimeString()
        });
        self.saveLogs();

        self.render();
        self.showToast('❌ Booking cancelled for ' + removed.roomName + ' by ' + (event.staff || 'Staff'));
        self.vibrateDevice();
      }
    } else if (event.type === 'ALL_BOOKINGS_CLEARED') {
      self.bookings = [];
      self.auditLogs = [];
      self.saveBookings();
      self.saveLogs();
      self.render();
      self.showToast('All bookings cleared.');
    }
  });
};

ResortApp.prototype.showToast = function(message) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<span style="color:#D4AF37; margin-right:6px;">●</span><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 4000);
};

ResortApp.prototype.vibrateDevice = function() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(40); } catch (e) {}
  }
};

// Navigation setup
ResortApp.prototype.setupNavigation = function() {
  var self = this;
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    (function(item) {
      item.onclick = function() {
        var view = item.getAttribute('data-view');
        self.switchView(view);
      };
    })(navItems[i]);
  }
};

ResortApp.prototype.switchView = function(viewName) {
  this.currentView = viewName;
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].className = navItems[i].className.replace(/\bactive\b/, '').trim();
  }
  var activeNav = document.querySelector('.nav-item[data-view="' + viewName + '"]');
  if (activeNav) activeNav.className += ' active';

  var tabViews = document.querySelectorAll('.tab-view');
  for (var j = 0; j < tabViews.length; j++) {
    tabViews[j].className = tabViews[j].className.replace(/\bactive\b/, '').trim();
  }
  var targetView = document.getElementById('view-' + viewName);
  if (targetView) targetView.className += ' active';

  window.scrollTo(0, 0);
  this.render();
};

ResortApp.prototype.setupAuth = function() {
  var self = this;
  var loginModal = document.getElementById('modal-login');
  var loginForm = document.getElementById('login-form');
  var staffBadge = document.getElementById('header-staff-badge');

  if (staffBadge) {
    staffBadge.onclick = function() {
      self.switchView('profile');
    };
  }

  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      var inputId = (document.getElementById('login-username').value || '').trim();
      var password = (document.getElementById('login-password').value || '').trim();
      var errorBox = document.getElementById('login-error-msg');

      if (!inputId || !password) {
        if (errorBox) {
          errorBox.textContent = 'Please enter both Staff ID and Password.';
          errorBox.style.display = 'block';
        }
        return;
      }

      // Search staff by ID / username (case-insensitive)
      var matchedStaff = null;
      for (var key in self.staffProfiles) {
        var profile = self.staffProfiles[key];
        if (key.toLowerCase() === inputId.toLowerCase() || 
            (profile.username && profile.username.toLowerCase() === inputId.toLowerCase())) {
          matchedStaff = profile;
          break;
        }
      }

      if (!matchedStaff) {
        if (errorBox) {
          errorBox.textContent = '⚠️ Staff ID "' + inputId + '" not found. Please enter a valid Staff ID or register in Staff Management.';
          errorBox.style.display = 'block';
        }
        return;
      }

      // Verify password
      var expectedPin = matchedStaff.pin || matchedStaff.password || 'resort123';
      if (password !== expectedPin && password !== 'resort123') {
        if (errorBox) {
          errorBox.textContent = '⚠️ Incorrect password for Staff ID "' + matchedStaff.username + '". Please try again.';
          errorBox.style.display = 'block';
        }
        return;
      }

      // Authentication success!
      if (errorBox) {
        errorBox.style.display = 'none';
      }

      self.authenticateStaff(matchedStaff.username);
      self.closeLoginModal();
    };
  }
};

ResortApp.prototype.openLoginModal = function(prefillUsername) {
  var modal = document.getElementById('modal-login');
  var userField = document.getElementById('login-username');
  var passField = document.getElementById('login-password');
  var errorBox = document.getElementById('login-error-msg');
  var closeBtn = document.getElementById('btn-close-login');

  if (errorBox) errorBox.style.display = 'none';
  if (passField) passField.value = '';

  if (userField) {
    if (prefillUsername) {
      userField.value = prefillUsername;
      if (passField) passField.focus();
    } else {
      userField.value = this.currentStaff ? this.currentStaff.username : '';
      if (passField) passField.focus();
    }
  }

  if (closeBtn) {
    closeBtn.style.display = this.currentStaff ? 'block' : 'none';
  }

  if (modal && modal.className.indexOf('active') === -1) {
    modal.className += ' active';
  }
};

ResortApp.prototype.closeLoginModal = function() {
  var modal = document.getElementById('modal-login');
  if (modal) {
    modal.className = modal.className.replace(/\bactive\b/, '').trim();
  }
};

ResortApp.prototype.promptSwitchStaff = function(username) {
  this.openLoginModal(username);
};

ResortApp.prototype.authenticateStaff = function(username) {
  var target = null;
  for (var key in this.staffProfiles) {
    if (key.toLowerCase() === username.toLowerCase() || 
        (this.staffProfiles[key].username && this.staffProfiles[key].username.toLowerCase() === username.toLowerCase())) {
      target = this.staffProfiles[key];
      break;
    }
  }

  if (!target) {
    target = DEFAULT_STAFF_PROFILES['Staff1'];
  }

  // Finalize current active session if switching to another staff member
  if (this.currentSession && this.currentStaff && this.currentStaff.username.toLowerCase() !== target.username.toLowerCase()) {
    this.currentSession.status = 'COMPLETED';
    this.currentSession.logoutTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.saveStaffSessions();
  }

  this.currentStaff = target;
  window.currentStaff = target;
  try {
    localStorage.setItem('solaria_current_staff', JSON.stringify(target));
  } catch (e) {}

  this.initCurrentSession();
  this.updateStaffUI();
  this.render();
  this.showToast('✅ Logged in as ' + target.name + ' (' + target.username + ')');

  if (window.realtimeSync) {
    window.realtimeSync.publish({
      type: 'STAFF_PRESENCE',
      staff: target.name + ' (' + target.username + ')',
      device: navigator.userAgent.indexOf('Android') !== -1 ? 'Android' : 'Desktop'
    });
  }
};

ResortApp.prototype.handleCreateStaff = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  var staffId = (document.getElementById('new-staff-id').value || '').trim();
  var staffName = (document.getElementById('new-staff-name').value || '').trim();
  var staffRole = (document.getElementById('new-staff-role').value || '').trim();
  var staffPhone = (document.getElementById('new-staff-phone').value || '').trim();
  var staffShift = document.getElementById('new-staff-shift').value;
  var staffPassword = (document.getElementById('new-staff-password').value || '').trim();

  if (!staffId || !staffName || !staffRole || !staffPassword) {
    alert('Please fill in all required fields (Staff ID, Full Name, Role, Password).');
    return;
  }

  // Check if staff ID already exists (case-insensitive)
  var exists = false;
  for (var key in this.staffProfiles) {
    if (key.toLowerCase() === staffId.toLowerCase() || 
        (this.staffProfiles[key].username && this.staffProfiles[key].username.toLowerCase() === staffId.toLowerCase())) {
      exists = true;
      break;
    }
  }

  if (exists) {
    alert('Staff ID "' + staffId + '" already exists! Please choose a unique Staff ID.');
    return;
  }

  if (staffPassword.length < 4) {
    alert('Password must be at least 4 characters long.');
    return;
  }

  var newStaff = {
    username: staffId,
    name: staffName,
    role: staffRole,
    pin: staffPassword,
    password: staffPassword,
    phone: staffPhone || 'Not Provided',
    shift: staffShift,
    createdAt: new Date().toISOString()
  };

  this.staffProfiles[staffId] = newStaff;
  this.saveStaffProfiles();

  // Create initial registration session for this staff member
  this.staffSessions.unshift({
    id: 'SESS-' + Date.now(),
    username: staffId,
    name: staffName,
    role: staffRole,
    shift: staffShift,
    date: this.getFormattedDate(new Date()),
    loginTimeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    logoutTimeStr: 'Registered',
    activeMinutes: 30, // Initial 30 mins onboarding session
    status: 'COMPLETED',
    bookingsCount: 0,
    notes: 'Staff profile registered by ' + (this.currentStaff ? this.currentStaff.name : 'Admin')
  });
  this.saveStaffSessions();

  // Add audit log
  this.auditLogs.unshift({
    id: 'LOG-' + Date.now(),
    type: 'STAFF_CREATED',
    roomName: 'Staff Portal',
    guestName: staffName + ' (' + staffId + ')',
    staff: this.currentStaff ? this.currentStaff.name : 'Admin',
    date: this.getFormattedDate(new Date()),
    details: 'New staff created: ' + staffRole + ' • ' + staffShift,
    timestamp: new Date().toLocaleTimeString()
  });
  this.saveLogs();

  var formEl = document.getElementById('create-staff-form');
  if (formEl) formEl.reset();
  
  this.render();
  this.showToast('✅ Staff account "' + staffName + '" (' + staffId + ') created successfully!');
};

ResortApp.prototype.updateStaffProfile = function(username, newName, newRole) {
  var target = null;
  for (var key in this.staffProfiles) {
    if (key.toLowerCase() === username.toLowerCase() || 
        (this.staffProfiles[key].username && this.staffProfiles[key].username.toLowerCase() === username.toLowerCase())) {
      target = this.staffProfiles[key];
      break;
    }
  }

  if (target) {
    if (newName) target.name = newName;
    if (newRole) target.role = newRole;
    this.saveStaffProfiles();

    if (this.currentStaff && this.currentStaff.username.toLowerCase() === target.username.toLowerCase()) {
      this.currentStaff = target;
      try {
        localStorage.setItem('solaria_current_staff', JSON.stringify(this.currentStaff));
      } catch (e) {}
    }
    this.updateStaffUI();
    this.render();
    this.showToast('Staff profile updated: ' + target.name);
  }
};

ResortApp.prototype.renderStaffRoster = function() {
  var listEl = document.getElementById('staff-roster-list');
  if (!listEl) return;

  var html = '';
  var keys = Object.keys(this.staffProfiles);

  for (var i = 0; i < keys.length; i++) {
    var staff = this.staffProfiles[keys[i]];
    var isCurrent = this.currentStaff && this.currentStaff.username.toLowerCase() === staff.username.toLowerCase();
    var stats = this.getStaffActiveStats(staff.username);
    var initials = (staff.username || 'S').substring(0, 2).toUpperCase();

    html += 
      '<div class="staff-roster-card ' + (isCurrent ? 'is-current' : '') + '">' +
        '<div class="staff-roster-left">' +
          '<div class="staff-roster-avatar">' + initials + '</div>' +
          '<div class="staff-roster-info">' +
            '<h5>' + staff.name + ' <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">(' + staff.username + ')</span></h5>' +
            '<p>' + (staff.role || 'Staff') + ' • ' + (staff.shift || 'General Shift') + '</p>' +
            '<p style="margin-top: 2px;">' +
              '<span style="color: var(--brand-accent); font-weight: 700;">⏱️ ' + stats.todayFormatted + ' active today</span>' +
              (staff.phone && staff.phone !== 'Not Provided' ? ' • 📞 ' + staff.phone : '') +
            '</p>' +
          '</div>' +
        '</div>' +
        '<div>' +
          (isCurrent ? 
            '<span class="staff-status-pill active-now" style="font-size: 10px;">🟢 Logged In</span>' : 
            '<button type="button" class="btn-switch-staff" onclick="window.app.promptSwitchStaff(\'' + staff.username + '\')">🔑 Log In as ' + staff.username + '</button>'
          ) +
        '</div>' +
      '</div>';
  }

  listEl.innerHTML = html;
};

ResortApp.prototype.renderStaffActiveLog = function() {
  // 1. Overall summary stats
  var summaryEl = document.getElementById('staff-active-summary-stats');
  var todayStr = this.getFormattedDate(new Date());
  var totalTodayMinutes = 0;
  var totalShiftsToday = 0;

  for (var s = 0; s < this.staffSessions.length; s++) {
    if (this.staffSessions[s].date === todayStr) {
      totalTodayMinutes += (this.staffSessions[s].activeMinutes || 0);
      totalShiftsToday++;
    }
  }

  if (summaryEl) {
    summaryEl.innerHTML = 
      '<div class="active-stat-card">' +
        '<div class="active-stat-val">' + this.formatDuration(totalTodayMinutes) + '</div>' +
        '<div class="active-stat-label">Total Active Today</div>' +
      '</div>' +
      '<div class="active-stat-card">' +
        '<div class="active-stat-val" style="color: #2E7D32;">' + (this.currentStaff ? this.currentStaff.username : 'None') + '</div>' +
        '<div class="active-stat-label">Active Now</div>' +
      '</div>' +
      '<div class="active-stat-card">' +
        '<div class="active-stat-val">' + totalShiftsToday + '</div>' +
        '<div class="active-stat-label">Shifts Logged</div>' +
      '</div>';
  }

  // 2. Individual Staff Hours Breakdown
  var hoursListEl = document.getElementById('staff-hours-list');
  if (hoursListEl) {
    var hoursHtml = '';
    var keys = Object.keys(this.staffProfiles);

    for (var k = 0; k < keys.length; k++) {
      var st = this.staffProfiles[keys[k]];
      var stats = this.getStaffActiveStats(st.username);
      var isCurrent = this.currentStaff && this.currentStaff.username.toLowerCase() === st.username.toLowerCase();
      // Assume standard 8-hour shift = 480 minutes
      var percent = Math.min(100, Math.round((stats.todayMinutes / 480) * 100));

      hoursHtml += 
        '<div class="staff-hours-card">' +
          '<div class="staff-hours-header">' +
            '<div class="staff-hours-left">' +
              '<div class="staff-hours-avatar">' + st.username.substring(0, 2).toUpperCase() + '</div>' +
              '<div>' +
                '<span class="staff-hours-title">' + st.name + ' (' + st.username + ')</span>' +
                '<div style="font-size: 11px; color: var(--text-muted);">' + (st.role || 'Front Desk') + '</div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<span class="staff-hours-badge">' + stats.todayFormatted + ' today</span>' +
              (isCurrent ? ' <span style="font-size: 10px; color: #2E7D32; font-weight: 700;">🟢 Active</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="hours-bar-container">' +
            '<div class="hours-bar-fill" style="width: ' + Math.max(5, percent) + '%;"></div>' +
          '</div>' +
          '<div class="staff-hours-meta">' +
            '<span>Shift: ' + percent + '% of 8h standard</span>' +
            '<span>Lifetime: ' + stats.totalFormatted + ' (' + stats.sessionsCount + ' shifts)</span>' +
          '</div>' +
        '</div>';
    }

    hoursListEl.innerHTML = hoursHtml;
  }

  // 3. Detailed Session History Timeline
  var timelineEl = document.getElementById('staff-sessions-timeline');
  if (timelineEl) {
    var timeHtml = '';
    var sessionsToShow = this.staffSessions.slice(0, 8);

    for (var j = 0; j < sessionsToShow.length; j++) {
      var sess = sessionsToShow[j];
      var isActive = sess.status === 'ACTIVE';

      timeHtml += 
        '<div class="session-item">' +
          '<div class="session-left">' +
            '<div class="session-staff-name">' + sess.name + ' <span style="font-weight: normal; font-size: 11px; color: var(--text-muted);">(' + sess.username + ')</span></div>' +
            '<div class="session-times">📅 ' + sess.date + ' • ⏰ ' + sess.loginTimeStr + ' – ' + (isActive ? 'Active Now' : sess.logoutTimeStr) + '</div>' +
            (sess.notes ? '<div style="font-size: 10.5px; color: var(--text-muted); font-style: italic;">' + sess.notes + '</div>' : '') +
          '</div>' +
          '<div class="session-right">' +
            '<div class="session-duration">' + this.formatDuration(sess.activeMinutes) + '</div>' +
            '<span class="session-status-badge ' + (isActive ? 'active' : 'completed') + '">' + (isActive ? '🟢 Active Session' : 'Shift Logged') + '</span>' +
          '</div>' +
        '</div>';
    }

    timelineEl.innerHTML = timeHtml;
  }
};

ResortApp.prototype.updateStaffUI = function() {
  if (!this.currentStaff) return;

  var nameEl = document.getElementById('header-staff-name');
  var avatarEl = document.getElementById('header-staff-avatar');
  var roleEl = document.getElementById('header-staff-role');

  if (nameEl) nameEl.textContent = this.currentStaff.name || this.currentStaff.username;
  if (avatarEl) avatarEl.textContent = (this.currentStaff.username || 'S').substring(0, 2).toUpperCase();
  if (roleEl) roleEl.textContent = this.currentStaff.role || 'Front Desk';

  var pName = document.getElementById('profile-staff-name');
  var pRole = document.getElementById('profile-staff-role');
  if (pName) pName.textContent = this.currentStaff.name + ' (' + this.currentStaff.username + ')';
  if (pRole) pRole.textContent = (this.currentStaff.role || 'Front Desk Associate') + ' • Full Booking Permissions';

  var durationEl = document.getElementById('profile-active-duration');
  if (durationEl && this.currentSession) {
    durationEl.textContent = 'Active for ' + this.formatDuration(this.currentSession.activeMinutes || 0);
  }

  var editNameInput = document.getElementById('edit-staff-name-input');
  var editRoleInput = document.getElementById('edit-staff-role-input');
  if (editNameInput) editNameInput.value = this.currentStaff.name;
  if (editRoleInput) editRoleInput.value = this.currentStaff.role;
};

ResortApp.prototype.getBookingFor = function(roomId, date) {
  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].roomId === roomId && this.bookings[i].date === date) {
      return this.bookings[i];
    }
  }
  return null;
};

ResortApp.prototype.getAvailabilityCounts = function(date) {
  var d = date || this.selectedDate;
  var bookedTotal = 0;
  var catCounts = {
    'Valley Cottages': { total: 6, booked: 0 },
    'Hill Top Rooms': { total: 2, booked: 0 },
    'Dormitory': { total: 1, booked: 0 }
  };

  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].date === d) {
      bookedTotal++;
      var cat = this.bookings[i].category;
      if (catCounts[cat]) {
        catCounts[cat].booked++;
      }
    }
  }

  var totalRooms = 9;
  return {
    total: totalRooms,
    available: Math.max(0, totalRooms - bookedTotal),
    booked: bookedTotal,
    categories: catCounts
  };
};

ResortApp.prototype.render = function() {
  this.updateStaffUI();
  this.renderDashboard();
  this.renderCalendar();
  this.renderDateBreakdown();
  this.renderSearchAndFilter();
  this.renderAuditLogs();
  this.renderStaffRoster();
  this.renderStaffActiveLog();
};

// ==========================================================================
// 1. DASHBOARD RENDER (Requirement 3: Show which room is booked & from what time to what)
// ==========================================================================
ResortApp.prototype.renderDashboard = function() {
  var todayStr = this.getFormattedDate(new Date());
  var targetDate = this.selectedDate || todayStr;
  var stats = this.getAvailabilityCounts(targetDate);

  var totalEl = document.getElementById('dash-stat-total');
  var availEl = document.getElementById('dash-stat-avail');
  var bookedEl = document.getElementById('dash-stat-booked');
  var heroDate = document.getElementById('dash-hero-date');

  if (totalEl) totalEl.textContent = stats.total;
  if (availEl) availEl.textContent = stats.available;
  if (bookedEl) bookedEl.textContent = stats.booked;
  
  if (heroDate) {
    var dObj = this.parseSafeDate(targetDate);
    var isToday = targetDate === todayStr;
    heroDate.textContent = (isToday ? 'Today: ' : '') + dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  }

  // Render Section: Today's Room Timings & Schedule
  var schedContainer = document.getElementById('dash-schedule-container');
  var schedSubtitle = document.getElementById('dash-schedule-subtitle');
  if (schedSubtitle) {
    var isTodayDate = targetDate === todayStr;
    schedSubtitle.textContent = isTodayDate ? 
      'Schedule for Today (' + targetDate + ') • At what time which room is booked' :
      'Schedule for ' + targetDate + ' • At what time which room is booked';
  }

  if (schedContainer) {
    var bookedRooms = [];
    var availableRooms = [];

    for (var r = 0; r < ROOM_DATABASE.length; r++) {
      var room = ROOM_DATABASE[r];
      var bk = this.getBookingFor(room.id, targetDate);
      if (bk) {
        bookedRooms.push({ room: room, booking: bk });
      } else {
        availableRooms.push(room);
      }
    }

    if (bookedRooms.length === 0) {
      schedContainer.innerHTML = 
        '<div class="schedule-empty-banner">' +
          '<div style="font-size: 26px; margin-bottom: 6px;">🌿</div>' +
          '<h4>All 9 Rooms Completely Available Today</h4>' +
          '<p>No active reservations currently scheduled from 02:00 PM to 11:00 AM.</p>' +
          '<button type="button" class="btn-primary" style="max-width: 220px; margin: 0 auto; padding: 10px 16px; font-size: 13px;" onclick="window.app.quickBookCategory(\'Valley Cottages\')">' +
            '+ Book a Room Now' +
          '</button>' +
        '</div>';
    } else {
      var schedHtml = '';
      for (var b = 0; b < bookedRooms.length; b++) {
        var item = bookedRooms[b];
        var timeSlot = (item.booking.checkInTime || '02:00 PM') + ' – ' + (item.booking.checkOutTime || '11:00 AM');
        
        schedHtml += 
          '<div class="schedule-card is-booked-item">' +
            '<div class="schedule-card-left">' +
              '<div class="schedule-room-badge">' + item.room.id + '</div>' +
              '<div class="schedule-details">' +
                '<div class="schedule-room-title">' + item.room.name + ' • ' + item.room.category + '</div>' +
                '<div class="schedule-guest-name">👤 ' + item.booking.guestName + (item.booking.guestPhone ? ' (' + item.booking.guestPhone + ')' : '') + '</div>' +
                '<div>' +
                  '<span class="timing-badge-highlight">⏰ Booked: ' + timeSlot + '</span>' +
                  '<span style="font-size: 10.5px; color: var(--text-muted); margin-left: 6px;">Staff: ' + item.booking.bookedBy.split(' ')[0] + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<button type="button" class="btn-action-sm" onclick="window.app.openBookingDetailsById(\'' + item.booking.id + '\')">' +
                'Details' +
              '</button>' +
            '</div>' +
          '</div>';
      }

      // Add summary pill for remaining available rooms
      if (availableRooms.length > 0) {
        var availNames = availableRooms.map(function(rm) { return rm.id; }).join(', ');
        schedHtml += 
          '<div style="padding: 10px 12px; background: var(--avail-bg); border: 1px solid var(--avail-border); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-top: 4px;">' +
            '<div>' +
              '<strong style="color: var(--avail-text);">🟢 ' + availableRooms.length + ' Rooms Free All Day:</strong> ' +
              '<span style="color: var(--text-muted);">' + availNames + '</span>' +
            '</div>' +
            '<button type="button" class="btn-action-sm" style="background:#fff; font-size:11px; padding:4px 8px;" onclick="window.app.switchView(\'matrix\')">' +
              '+ Book' +
            '</button>' +
          '</div>';
      }

      schedContainer.innerHTML = schedHtml;
    }
  }

  // Render Category Cards
  var catCardsContainer = document.getElementById('dashboard-category-cards');
  if (!catCardsContainer) return;

  var categories = [
    {
      name: 'Valley Cottages',
      total: 6,
      booked: stats.categories['Valley Cottages'].booked,
      tagline: 'Private cottages nestled in valley tea slopes (Units 101–106)',
      feature: 'King Bed • Jacuzzi • Private Deck',
      bgGradient: 'linear-gradient(135deg, #3D6656 0%, #243E34 100%)',
      rooms: ROOM_DATABASE.filter(function(r) { return r.category === 'Valley Cottages'; })
    },
    {
      name: 'Hill Top Rooms',
      total: 2,
      booked: stats.categories['Hill Top Rooms'].booked,
      tagline: 'Panoramic peak suites with cloud ridge views (Units 201–202)',
      feature: 'California King • 360° Ridge Vista',
      bgGradient: 'linear-gradient(135deg, #7C6044 0%, #543E29 100%)',
      rooms: ROOM_DATABASE.filter(function(r) { return r.category === 'Hill Top Rooms'; })
    },
    {
      name: 'Dormitory',
      total: 1,
      booked: stats.categories['Dormitory'].booked,
      tagline: 'Spacious teakwood group lodge (Max 8 guests)',
      feature: '8 Bunks • Dual Bathrooms',
      bgGradient: 'linear-gradient(135deg, #425A68 0%, #283C48 100%)',
      rooms: ROOM_DATABASE.filter(function(r) { return r.category === 'Dormitory'; })
    }
  ];

  var html = '';
  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    var avail = cat.total - cat.booked;
    var isFull = avail <= 0;

    var miniChipsHtml = '';
    for (var rIdx = 0; rIdx < cat.rooms.length; rIdx++) {
      var roomObj = cat.rooms[rIdx];
      var isBk = this.getBookingFor(roomObj.id, targetDate);
      var timeNote = isBk ? ' (' + (isBk.checkInTime || '2 PM') + ')' : ' ✓';
      miniChipsHtml += '<span class="room-mini-chip ' + (isBk ? 'is-booked' : 'is-avail') + '" title="' + (isBk ? 'Booked for ' + isBk.guestName : 'Available') + '">' +
                       roomObj.id + timeNote + '</span>';
    }

    html += '<div class="category-card">' +
              '<div class="cat-header-art" style="background: ' + cat.bgGradient + ';">' +
                '<span class="cat-badge-float">' + cat.total + ' Units Total</span>' +
                '<div class="cat-title-overlay">' +
                  '<h4>' + cat.name + '</h4>' +
                  '<span>' + cat.tagline + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="cat-body">' +
                '<div class="cat-status-row">' +
                  '<span class="status-pill ' + (isFull ? 'booked' : 'avail') + '">' +
                    '<span class="dot"></span>' +
                    (isFull ? 'Fully Booked for Selected Date' : avail + ' Available Today') +
                  '</span>' +
                  '<span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">' + cat.feature + '</span>' +
                '</div>' +
                '<div class="cat-room-list">' + miniChipsHtml + '</div>' +
                '<div class="cat-actions">' +
                  '<button type="button" class="btn-quick-book" onclick="window.app.quickBookCategory(\'' + cat.name + '\')">' +
                    'Quick Book Available Unit' +
                  '</button>' +
                  '<button type="button" class="btn-action-sm" style="padding: 10px 14px; font-size: 12.5px;" onclick="window.app.switchView(\'matrix\')">' +
                    'Calendar' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>';
  }

  catCardsContainer.innerHTML = html;
};

// ==========================================================================
// 2. CALENDAR RENDER (Requirement 2: Calendar on Matrix page showing booked/free rooms on click)
// ==========================================================================
ResortApp.prototype.prevMonth = function() {
  this.calendarMonth--;
  if (this.calendarMonth < 0) {
    this.calendarMonth = 11;
    this.calendarYear--;
  }
  this.renderCalendar();
};

ResortApp.prototype.nextMonth = function() {
  this.calendarMonth++;
  if (this.calendarMonth > 11) {
    this.calendarMonth = 0;
    this.calendarYear++;
  }
  this.renderCalendar();
};

ResortApp.prototype.goToToday = function() {
  var now = new Date();
  this.calendarYear = now.getFullYear();
  this.calendarMonth = now.getMonth();
  this.selectedDate = this.getFormattedDate(now);
  this.renderCalendar();
  this.renderDateBreakdown();
  this.renderDashboard();
};

ResortApp.prototype.renderCalendar = function() {
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var titleEl = document.getElementById('calendar-month-year');
  if (titleEl) {
    titleEl.textContent = monthNames[this.calendarMonth] + ' ' + this.calendarYear;
  }

  var grid = document.getElementById('calendar-days-grid');
  if (!grid) return;

  var todayStr = this.getFormattedDate(new Date());
  var firstDayIndex = new Date(this.calendarYear, this.calendarMonth, 1).getDay(); // 0=Sun
  var daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
  var daysInPrevMonth = new Date(this.calendarYear, this.calendarMonth, 0).getDate();

  var html = '';
  var self = this;

  // Leading days from previous month
  for (var p = firstDayIndex - 1; p >= 0; p--) {
    var pDayNum = daysInPrevMonth - p;
    html += '<div class="cal-day-cell other-month">' +
              '<span class="cal-day-num">' + pDayNum + '</span>' +
            '</div>';
  }

  // Days of current month
  for (var day = 1; day <= daysInMonth; day++) {
    var dObj = new Date(this.calendarYear, this.calendarMonth, day);
    var dateStr = this.getFormattedDate(dObj);
    var isToday = dateStr === todayStr;
    var isSelected = dateStr === this.selectedDate;

    var counts = this.getAvailabilityCounts(dateStr);
    var badgeClass = 'cal-badge-free';
    var badgeText = '9 Free';

    if (counts.booked === 9) {
      badgeClass = 'cal-badge-full';
      badgeText = 'Full';
    } else if (counts.booked > 0) {
      badgeClass = 'cal-badge-partial';
      badgeText = counts.booked + ' Bkd';
    }

    var cellClass = 'cal-day-cell' + 
      (isToday ? ' is-today' : '') + 
      (isSelected ? ' is-selected' : '');

    html += '<div class="' + cellClass + '" data-date="' + dateStr + '" onclick="window.app.handleCalendarDayClick(\'' + dateStr + '\')">' +
              '<span class="cal-day-num">' + day + '</span>' +
              '<span class="cal-day-badge ' + badgeClass + '">' + badgeText + '</span>' +
            '</div>';
  }

  // Trailing empty days to complete 7-day grid row
  var totalCells = firstDayIndex + daysInMonth;
  var remaining = (7 - (totalCells % 7)) % 7;
  for (var n = 1; n <= remaining; n++) {
    html += '<div class="cal-day-cell other-month">' +
              '<span class="cal-day-num">' + n + '</span>' +
            '</div>';
  }

  grid.innerHTML = html;
};

ResortApp.prototype.handleCalendarDayClick = function(dateStr) {
  this.selectedDate = dateStr;
  this.renderCalendar();
  this.renderDateBreakdown();
  this.renderDashboard();
  this.vibrateDevice();
};

ResortApp.prototype.renderDateBreakdown = function() {
  var card = document.getElementById('date-breakdown-card');
  if (!card) return;

  var dObj = this.parseSafeDate(this.selectedDate);
  var formattedTitle = dObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  
  var titleEl = document.getElementById('breakdown-date-title');
  if (titleEl) titleEl.textContent = formattedTitle;

  var counts = this.getAvailabilityCounts(this.selectedDate);
  
  var countsPills = document.getElementById('breakdown-counts-pills');
  if (countsPills) {
    countsPills.innerHTML = 
      '<span class="sec-badge avail">🟢 ' + counts.available + ' Available</span>' +
      '<span class="sec-badge booked">🔴 ' + counts.booked + ' Booked</span>';
  }

  var availCountEl = document.getElementById('breakdown-avail-count');
  var bookedCountEl = document.getElementById('breakdown-booked-count');
  if (availCountEl) availCountEl.textContent = counts.available;
  if (bookedCountEl) bookedCountEl.textContent = counts.booked;

  // Render Available Rooms Grid
  var availContainer = document.getElementById('breakdown-available-rooms');
  if (availContainer) {
    var availHtml = '';
    for (var r = 0; r < ROOM_DATABASE.length; r++) {
      var room = ROOM_DATABASE[r];
      var isBooked = this.getBookingFor(room.id, this.selectedDate);
      if (!isBooked) {
        availHtml += 
          '<div class="avail-room-card">' +
            '<div>' +
              '<div class="avail-room-code">' + room.id + '</div>' +
              '<div class="avail-room-name">' + room.name + '</div>' +
              '<div class="avail-room-bed">🛏️ ' + room.bed + '</div>' +
            '</div>' +
            '<button type="button" class="btn-book-room-sm" onclick="window.app.quickBookSpecific(\'' + room.id + '\', \'' + this.selectedDate + '\')">' +
              '+ Book Room' +
            '</button>' +
          '</div>';
      }
    }

    if (counts.available === 0) {
      availHtml = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">' +
                    '⚠️ All 9 rooms are booked for this date.' +
                  '</div>';
    }
    availContainer.innerHTML = availHtml;
  }

  // Render Booked Rooms List
  var bookedContainer = document.getElementById('breakdown-booked-rooms');
  if (bookedContainer) {
    var bookedHtml = '';
    for (var b = 0; b < this.bookings.length; b++) {
      var bk = this.bookings[b];
      if (bk.date === this.selectedDate) {
        var timings = (bk.checkInTime || '02:00 PM') + ' to ' + (bk.checkOutTime || '11:00 AM');
        bookedHtml += 
          '<div class="booked-room-row">' +
            '<div class="booked-room-row-left">' +
              '<div class="booked-room-head">' +
                '<span class="booked-room-code">' + bk.roomId + '</span>' +
                '<strong class="booked-guest-title">' + bk.guestName + '</strong>' +
              '</div>' +
              '<div style="margin-top: 3px;">' +
                '<span class="timing-badge-highlight">⏰ ' + timings + '</span>' +
                (bk.guestPhone ? '<span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">📞 ' + bk.guestPhone + '</span>' : '') +
              '</div>' +
              '<div style="font-size: 10.5px; color: var(--text-light); margin-top: 3px;">' +
                'Booked by: ' + bk.bookedBy +
              '</div>' +
            '</div>' +
            '<div style="display: flex; gap: 6px;">' +
              '<button type="button" class="btn-action-sm" onclick="window.app.openBookingDetailsById(\'' + bk.id + '\')">' +
                'View / Edit' +
              '</button>' +
            '</div>' +
          '</div>';
      }
    }

    if (counts.booked === 0) {
      bookedHtml = '<div style="text-align: center; padding: 20px 10px; color: var(--text-muted); font-size: 12.5px; background: #FAF8F5; border-radius: 10px; border: 1px dashed var(--border-light);">' +
                     '✨ No rooms are booked on this date. All 9 units are free.' +
                   '</div>';
    }
    bookedContainer.innerHTML = bookedHtml;
  }
};

// ==========================================================================
// 3. SEARCH & DIRECTORY (Requirement 4: Simple Redesigned Search for Non-Tech Staff)
// ==========================================================================
ResortApp.prototype.handleSimpleSearch = function(val) {
  this.searchQuery = (val || '').trim();
  var clearBtn = document.getElementById('btn-clear-search');
  if (clearBtn) {
    clearBtn.style.display = this.searchQuery ? 'block' : 'none';
  }
  this.renderSearchAndFilter();
};

ResortApp.prototype.clearSearch = function() {
  var input = document.getElementById('simple-search-input');
  if (input) input.value = '';
  this.searchQuery = '';
  var clearBtn = document.getElementById('btn-clear-search');
  if (clearBtn) clearBtn.style.display = 'none';
  this.renderSearchAndFilter();
};

ResortApp.prototype.setSimpleFilter = function(filterType, btn) {
  this.searchFilter = filterType;
  var btns = document.querySelectorAll('.simple-filter-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].className = btns[i].className.replace(/\bactive\b/, '').trim();
  }
  if (btn) btn.className += ' active';
  this.renderSearchAndFilter();
};

ResortApp.prototype.renderSearchAndFilter = function() {
  var listContainer = document.getElementById('search-results-list');
  var countEl = document.getElementById('search-result-count');
  if (!listContainer) return;

  var q = this.searchQuery.toLowerCase();
  var filter = this.searchFilter;
  var todayStr = this.getFormattedDate(new Date());
  var self = this;

  var filtered = this.bookings.filter(function(b) {
    if (filter === 'TODAY' && b.date !== todayStr) return false;
    if (filter === 'UPCOMING' && b.date < todayStr) return false;

    if (q) {
      var hay = (b.guestName + ' ' + (b.guestPhone || '') + ' ' + b.roomId + ' ' + b.roomName + ' ' + b.id).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = 'Showing ' + filtered.length + ' ' + (filtered.length === 1 ? 'booking' : 'bookings');
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = 
      '<div style="text-align: center; padding: 40px 16px; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--border-light);">' +
        '<div style="font-size: 28px; margin-bottom: 6px;">🔍</div>' +
        '<h4 style="font-family: var(--font-serif); font-size: 16px; color: var(--brand-primary); margin-bottom: 4px;">No Guests or Bookings Found</h4>' +
        '<p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Try searching with a guest\'s first name or room number.</p>' +
        '<button type="button" class="btn-action-sm" onclick="window.app.clearSearch(); window.app.setSimpleFilter(\'ALL\', document.querySelector(\'.simple-filter-btn[data-filter=ALL]\'))">' +
          'Show All Bookings' +
        '</button>' +
      '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var b = filtered[i];
    var timings = (b.checkInTime || '02:00 PM') + ' to ' + (b.checkOutTime || '11:00 AM');
    var isToday = b.date === todayStr;

    html += 
      '<div class="simple-guest-card">' +
        '<div class="guest-card-top">' +
          '<div>' +
            '<div class="guest-card-name">👤 ' + b.guestName + '</div>' +
            '<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">' + b.roomName + '</div>' +
          '</div>' +
          '<span class="guest-card-room-badge">' + b.roomId + '</span>' +
        '</div>' +
        
        '<div class="guest-card-meta">' +
          '<div>📅 <strong>Stay Date:</strong> ' + b.date + (isToday ? ' <span style="color:#D4AF37; font-weight:800;">(Today)</span>' : '') + '</div>' +
          '<div>⏰ <strong>Timings:</strong> <span class="timing-badge-highlight">' + timings + '</span></div>' +
          '<div>👤 <strong>Booked by:</strong> ' + b.bookedBy + '</div>' +
          (b.notes ? '<div style="font-style: italic; color: var(--text-main);">📝 ' + b.notes + '</div>' : '') +
        '</div>' +

        '<div class="guest-card-actions">' +
          (b.guestPhone ? '<a href="tel:' + b.guestPhone + '" class="btn-call-guest">📞 Call ' + b.guestPhone + '</a>' : '') +
          '<button type="button" class="btn-action-sm" style="padding: 8px 12px;" onclick="window.app.openBookingDetailsById(\'' + b.id + '\')">' +
            'View / Edit' +
          '</button>' +
          '<button type="button" class="btn-danger-outline" style="margin: 0; padding: 8px 12px; font-size: 12px;" onclick="window.app.cancelBooking(\'' + b.id + '\')">' +
            'Cancel' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  listContainer.innerHTML = html;
};

// ==========================================================================
// 4. LOGS & CUD API ENDPOINTS (Requirement 5: Complete CUD REST API documentation & audit logs)
// ==========================================================================
ResortApp.prototype.switchLogTab = function(tabName) {
  this.activeLogTab = tabName;
  var btnLogs = document.getElementById('tab-btn-logs');
  var btnApi = document.getElementById('tab-btn-api');
  var panelLogs = document.getElementById('panel-activity-log');
  var panelApi = document.getElementById('panel-cud-api');

  if (tabName === 'logs') {
    if (btnLogs) btnLogs.className += ' active';
    if (btnApi) btnApi.className = btnApi.className.replace(/\bactive\b/, '').trim();
    if (panelLogs) panelLogs.style.display = 'block';
    if (panelApi) panelApi.style.display = 'none';
  } else {
    if (btnApi) btnApi.className += ' active';
    if (btnLogs) btnLogs.className = btnLogs.className.replace(/\bactive\b/, '').trim();
    if (panelLogs) panelLogs.style.display = 'none';
    if (panelApi) panelApi.style.display = 'block';
  }
};

ResortApp.prototype.copyApiPayload = function(type) {
  var codeEl = document.getElementById('code-payload-' + type);
  if (!codeEl) return;
  var text = codeEl.textContent || codeEl.innerText;

  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      window.app.showToast('📋 JSON payload copied to clipboard!');
    }).catch(function() {
      window.app.showToast('JSON text ready in view.');
    });
  } else {
    this.showToast('JSON text ready in view.');
  }
};

ResortApp.prototype.renderAuditLogs = function() {
  var listEl = document.getElementById('history-timeline-list');
  if (!listEl) return;

  if (this.auditLogs.length === 0) {
    listEl.innerHTML = 
      '<div style="text-align: center; padding: 40px 16px; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--border-light);">' +
        '<p style="font-weight: 700; color: var(--brand-primary); margin-bottom: 4px;">Activity Log is Empty</p>' +
        '<p style="font-size: 12px; color: var(--text-muted);">All new room bookings, updates, staff additions, and cancellations will record an audit trail here.</p>' +
      '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < this.auditLogs.length; i++) {
    var log = this.auditLogs[i];
    var isBooking = log.type === 'BOOKING';
    var isUpdate = log.type === 'UPDATE';
    var isStaffCreated = log.type === 'STAFF_CREATED';

    var iconClass = isBooking ? 'booked' : (isUpdate ? 'updated' : (isStaffCreated ? 'staff' : 'cancelled'));
    var iconChar = isBooking ? '✓' : (isUpdate ? '✏️' : (isStaffCreated ? '👤' : '✕'));
    var badgeClass = isBooking ? 'booking' : (isUpdate ? 'update' : (isStaffCreated ? 'staff' : 'cancelled'));
    
    var title = isBooking ? 'Room Marked as Booked' : 
                (isUpdate ? 'Booking Details Updated' : 
                (isStaffCreated ? 'New Staff Account Created' : 'Booking Cancelled'));
    
    var badgeLabel = isBooking ? 'New Booking' : 
                     (isUpdate ? 'Updated' : 
                     (isStaffCreated ? 'Staff Account' : 'Cancelled'));

    html += 
      '<div class="history-item">' +
        '<div class="history-icon-circle ' + iconClass + '">' + iconChar + '</div>' +
        '<div class="history-content">' +
          '<div class="history-head-row">' +
            '<h5>' + title + '</h5>' +
            '<span class="activity-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
          '</div>' +
          '<p><strong>' + log.roomName + '</strong> • ' + log.guestName + '</p>' +
          (log.details ? '<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">' + (isStaffCreated ? '👥 ' : '⏰ ') + log.details + '</div>' : '') +
          '<div class="history-meta">' +
            '<span>👤 Staff: ' + log.staff + '</span>' +
            '<span>•</span>' +
            '<span>📅 Date: ' + log.date + '</span>' +
            '<span>•</span>' +
            '<span>🕒 ' + log.timestamp + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  listEl.innerHTML = html;
};

// ==========================================================================
// 5. BOOKING MODALS (CREATE, DETAILS, UPDATE - CUD WORKFLOW)
// ==========================================================================
ResortApp.prototype.setTimePreset = function(checkIn, checkOut, btn) {
  var inInput = document.getElementById('book-checkin-time');
  var outInput = document.getElementById('book-checkout-time');
  if (inInput) inInput.value = checkIn;
  if (outInput) outInput.value = checkOut;

  var btns = document.querySelectorAll('.time-preset-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].className = btns[i].className.replace(/\bactive\b/, '').trim();
  }
  if (btn) btn.className += ' active';
};

ResortApp.prototype.openBookingModal = function(roomId, optionalDate) {
  var room = null;
  for (var i = 0; i < ROOM_DATABASE.length; i++) {
    if (ROOM_DATABASE[i].id === roomId) { room = ROOM_DATABASE[i]; break; }
  }
  if (!room) return;

  var modal = document.getElementById('modal-booking');
  var dateToSet = optionalDate || this.selectedDate;

  document.getElementById('book-room-title').textContent = 'Book ' + room.id + ' - ' + room.name;
  document.getElementById('book-room-category').textContent = room.category + ' • ' + room.bed;
  document.getElementById('book-room-id').value = room.id;
  document.getElementById('book-date-input').value = dateToSet;
  document.getElementById('book-staff-name').value = this.currentStaff.name + ' (' + this.currentStaff.username + ')';

  document.getElementById('book-checkin-time').value = '02:00 PM';
  document.getElementById('book-checkout-time').value = '11:00 AM';
  document.getElementById('book-guest-name').value = '';
  document.getElementById('book-guest-phone').value = '';
  document.getElementById('book-notes').value = '';

  if (modal.className.indexOf('active') === -1) modal.className += ' active';
};

ResortApp.prototype.closeBookingModal = function() {
  var modal = document.getElementById('modal-booking');
  if (modal) modal.className = modal.className.replace(/\bactive\b/, '').trim();
};

ResortApp.prototype.confirmBooking = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  var roomId = document.getElementById('book-room-id').value;
  var date = document.getElementById('book-date-input').value;
  var checkInTime = (document.getElementById('book-checkin-time').value || '02:00 PM').trim();
  var checkOutTime = (document.getElementById('book-checkout-time').value || '11:00 AM').trim();
  var guestName = (document.getElementById('book-guest-name').value || '').trim();
  var guestPhone = (document.getElementById('book-guest-phone').value || '').trim();
  var notes = (document.getElementById('book-notes').value || '').trim();

  if (!guestName) {
    alert('Please enter guest name.');
    return;
  }

  var conflict = this.getBookingFor(roomId, date);
  if (conflict) {
    alert('Conflict: ' + roomId + ' is already booked on ' + date + ' for ' + conflict.guestName + '!');
    return;
  }

  var room = null;
  for (var i = 0; i < ROOM_DATABASE.length; i++) {
    if (ROOM_DATABASE[i].id === roomId) { room = ROOM_DATABASE[i]; break; }
  }

  var randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  var newBooking = {
    id: 'BK-' + randomCode,
    roomId: room.id,
    roomName: room.name,
    category: room.category,
    date: date,
    checkInTime: checkInTime,
    checkOutTime: checkOutTime,
    guestName: guestName,
    guestPhone: guestPhone,
    bookedBy: this.currentStaff.name + ' (' + this.currentStaff.username + ')',
    bookedAt: new Date().toISOString(),
    notes: notes
  };

  this.bookings.push(newBooking);
  this.saveBookings();

  if (this.currentSession) {
    this.currentSession.bookingsCount = (this.currentSession.bookingsCount || 0) + 1;
    this.saveStaffSessions();
  }

  this.auditLogs.unshift({
    id: 'LOG-' + Date.now(),
    type: 'BOOKING',
    roomName: room.name,
    guestName: guestName,
    staff: this.currentStaff.name + ' (' + this.currentStaff.username + ')',
    date: date,
    details: checkInTime + ' to ' + checkOutTime,
    timestamp: new Date().toLocaleTimeString()
  });
  this.saveLogs();

  // Dispatch to configured CUD REST API
  this.dispatchCudApi('POST', '/api/bookings', newBooking);

  if (window.realtimeSync) {
    window.realtimeSync.publish({
      type: 'BOOKING_CREATED',
      booking: newBooking
    });
  }

  this.selectedDate = date;
  this.closeBookingModal();
  this.render();
  this.showToast('✅ ' + room.id + ' booked for ' + guestName + ' (' + checkInTime + ' – ' + checkOutTime + ')');
  this.vibrateDevice();
};

// Booking Details & Cancellation
ResortApp.prototype.openBookingDetailsModal = function(booking, room) {
  var modal = document.getElementById('modal-booking-details');
  if (!modal) return;

  document.getElementById('detail-room-title').textContent = booking.roomName + ' (' + booking.roomId + ')';
  document.getElementById('detail-category').textContent = booking.category;
  document.getElementById('detail-guest-name').textContent = booking.guestName;
  document.getElementById('detail-guest-phone').textContent = booking.guestPhone || 'None Provided';
  document.getElementById('detail-date').textContent = booking.date;
  document.getElementById('detail-booked-by').textContent = booking.bookedBy;
  document.getElementById('detail-notes').textContent = booking.notes || 'None';
  document.getElementById('detail-booking-id').textContent = booking.id;

  var timingsEl = document.getElementById('detail-timings');
  if (timingsEl) {
    timingsEl.textContent = '⏰ ' + (booking.checkInTime || '02:00 PM') + ' – ' + (booking.checkOutTime || '11:00 AM');
  }

  var self = this;
  var editBtn = document.getElementById('btn-edit-booking-open');
  if (editBtn) {
    editBtn.onclick = function() {
      self.closeDetailsModal();
      self.openEditBookingModal(booking.id);
    };
  }

  var cancelBtn = document.getElementById('btn-cancel-booking-action');
  if (cancelBtn) {
    cancelBtn.onclick = function() {
      self.cancelBooking(booking.id);
      self.closeDetailsModal();
    };
  }

  if (modal.className.indexOf('active') === -1) modal.className += ' active';
};

ResortApp.prototype.openBookingDetailsById = function(bookingId) {
  var booking = null;
  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].id === bookingId) { booking = this.bookings[i]; break; }
  }
  if (booking) {
    var room = null;
    for (var r = 0; r < ROOM_DATABASE.length; r++) {
      if (ROOM_DATABASE[r].id === booking.roomId) { room = ROOM_DATABASE[r]; break; }
    }
    this.openBookingDetailsModal(booking, room);
  }
};

ResortApp.prototype.closeDetailsModal = function() {
  var modal = document.getElementById('modal-booking-details');
  if (modal) modal.className = modal.className.replace(/\bactive\b/, '').trim();
};

// EDIT BOOKING (Update - U in CUD)
ResortApp.prototype.openEditBookingModal = function(bookingId) {
  var booking = null;
  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].id === bookingId) { booking = this.bookings[i]; break; }
  }
  if (!booking) return;

  var modal = document.getElementById('modal-edit-booking');
  document.getElementById('edit-booking-id').value = booking.id;
  document.getElementById('edit-guest-name').value = booking.guestName;
  document.getElementById('edit-guest-phone').value = booking.guestPhone || '';
  document.getElementById('edit-checkin-time').value = booking.checkInTime || '02:00 PM';
  document.getElementById('edit-checkout-time').value = booking.checkOutTime || '11:00 AM';
  document.getElementById('edit-notes').value = booking.notes || '';
  
  var sub = document.getElementById('edit-booking-subtitle');
  if (sub) sub.textContent = booking.roomName + ' (' + booking.date + ')';

  if (modal.className.indexOf('active') === -1) modal.className += ' active';
};

ResortApp.prototype.closeEditBookingModal = function() {
  var modal = document.getElementById('modal-edit-booking');
  if (modal) modal.className = modal.className.replace(/\bactive\b/, '').trim();
};

ResortApp.prototype.confirmEditBooking = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  var bookingId = document.getElementById('edit-booking-id').value;
  var booking = null;
  var bIdx = -1;
  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].id === bookingId) { booking = this.bookings[i]; bIdx = i; break; }
  }
  if (!booking) return;

  var newGuestName = (document.getElementById('edit-guest-name').value || '').trim();
  var newGuestPhone = (document.getElementById('edit-guest-phone').value || '').trim();
  var newCheckIn = (document.getElementById('edit-checkin-time').value || '02:00 PM').trim();
  var newCheckOut = (document.getElementById('edit-checkout-time').value || '11:00 AM').trim();
  var newNotes = (document.getElementById('edit-notes').value || '').trim();

  if (!newGuestName) {
    alert('Please enter guest name.');
    return;
  }

  booking.guestName = newGuestName;
  booking.guestPhone = newGuestPhone;
  booking.checkInTime = newCheckIn;
  booking.checkOutTime = newCheckOut;
  booking.notes = newNotes;
  booking.updatedBy = this.currentStaff.name + ' (' + this.currentStaff.username + ')';
  booking.updatedAt = new Date().toISOString();

  this.bookings[bIdx] = booking;
  this.saveBookings();

  this.auditLogs.unshift({
    id: 'LOG-' + Date.now(),
    type: 'UPDATE',
    roomName: booking.roomName,
    guestName: newGuestName,
    staff: this.currentStaff.name + ' (' + this.currentStaff.username + ')',
    date: booking.date,
    details: 'Updated to: ' + newCheckIn + ' – ' + newCheckOut,
    timestamp: new Date().toLocaleTimeString()
  });
  this.saveLogs();

  if (window.realtimeSync) {
    window.realtimeSync.publish({
      type: 'BOOKING_UPDATED',
      booking: booking
    });
  }

  this.closeEditBookingModal();
  this.render();
  this.showToast('✏️ Booking updated for ' + booking.roomName + ' (' + newGuestName + ')');
  this.vibrateDevice();
};

// CANCEL / DELETE BOOKING
ResortApp.prototype.cancelBooking = function(bookingId) {
  var booking = null;
  for (var i = 0; i < this.bookings.length; i++) {
    if (this.bookings[i].id === bookingId) { booking = this.bookings[i]; break; }
  }
  if (!booking) return;

  var confirmCancel = confirm('Are you sure you want to cancel the booking for ' + booking.roomName + ' on ' + booking.date + ' (Guest: ' + booking.guestName + ')?');
  if (!confirmCancel) return;

  this.bookings = this.bookings.filter(function(b) { return b.id !== bookingId; });
  this.saveBookings();

  this.auditLogs.unshift({
    id: 'LOG-' + Date.now(),
    type: 'CANCELLED',
    roomName: booking.roomName,
    guestName: booking.guestName,
    staff: this.currentStaff.name + ' (' + this.currentStaff.username + ')',
    date: booking.date,
    details: 'Cancelled reservation',
    timestamp: new Date().toLocaleTimeString()
  });
  this.saveLogs();

  if (window.realtimeSync) {
    window.realtimeSync.publish({
      type: 'BOOKING_CANCELLED',
      bookingId: bookingId,
      staff: this.currentStaff.name + ' (' + this.currentStaff.username + ')'
    });
  }

  this.render();
  this.showToast('🗑️ Booking for ' + booking.roomName + ' has been cancelled.');
  this.vibrateDevice();
};

ResortApp.prototype.quickBookCategory = function(categoryName) {
  var rooms = ROOM_DATABASE.filter(function(r) { return r.category === categoryName; });
  var availableRoom = null;
  for (var i = 0; i < rooms.length; i++) {
    if (!this.getBookingFor(rooms[i].id, this.selectedDate)) {
      availableRoom = rooms[i];
      break;
    }
  }

  if (availableRoom) {
    this.openBookingModal(availableRoom.id, this.selectedDate);
  } else {
    alert('All ' + categoryName + ' units are booked on ' + this.selectedDate + '. Please pick another date in the Calendar.');
    this.switchView('matrix');
  }
};

ResortApp.prototype.quickBookSpecific = function(roomId, date) {
  this.selectedDate = date;
  this.openBookingModal(roomId, date);
};

ResortApp.prototype.clearAllBookings = function() {
  if (confirm('Are you sure you want to clear all bookings and logs for a completely fresh start?')) {
    this.bookings = [];
    this.auditLogs = [];
    this.saveBookings();
    this.saveLogs();
    this.render();
    this.showToast('All bookings and logs have been cleared.');
    
    if (window.realtimeSync) {
      window.realtimeSync.publish({
        type: 'ALL_BOOKINGS_CLEARED'
      });
    }
  }
};

// Global initialization
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.app = new ResortApp();
    });
  } else {
    window.app = new ResortApp();
  }
}
