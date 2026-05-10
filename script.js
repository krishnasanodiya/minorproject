/* ============================================================
   LIFEOS — PERSONAL INTELLIGENCE DASHBOARD
   Main Script
   ============================================================ */

'use strict';

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const $q = sel => document.querySelector(sel);
function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  } else {
    localStorage.setItem(key, JSON.stringify(val));
  }
}
function showToast(msg, icon = '✓') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ══════════════════════════════════════
   LOADER
══════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    $('loader').classList.add('done');
    $('sidebar').classList.add('visible');
    $q('.main-content').classList.add('visible');
  }, 1900);
});

/* ══════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════ */
(function() {
  const dot = $q('.cursor-dot');
  const ring = $q('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function moveCursor() {
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(moveCursor);
  }
  moveCursor();
})();

/* ══════════════════════════════════════
   NAVIGATION / PAGE ROUTING
══════════════════════════════════════ */
const navItems = $$('.nav-item');
const pages = $$('.page');

function goToPage(name) {
  pages.forEach(p => p.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  const pg = $(`page-${name}`);
  if (pg) pg.classList.add('active');
  const ni = $q(`.nav-item[data-page="${name}"]`);
  if (ni) ni.classList.add('active');
  if (name === 'analytics') buildAnalytics();
}

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    goToPage(item.dataset.page);
  });
});

window.goToPage = goToPage;

/* ══════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════ */
(function() {
  const btn = $('themeToggle');
  const saved = ls('theme');
  if (saved === 'light') document.body.classList.add('light');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    ls('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
})();

/* ══════════════════════════════════════
   CLOCK & DATE — HOME
══════════════════════════════════════ */
(function() {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const greetings = [
    [0,5,'Good Night 🌙'],
    [5,12,'Good Morning ☀️'],
    [12,17,'Good Afternoon 🌤'],
    [17,21,'Good Evening 🌆'],
    [21,24,'Good Night 🌙']
  ];

  function tick() {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    const pad = n => String(n).padStart(2,'0');

    $('clockDisplay').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    $('heroDay').textContent = DAYS[d.getDay()];
    $('heroDate').textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    for (const [from, to, msg] of greetings) {
      if (h >= from && h < to) { $('greeting').textContent = msg; break; }
    }
  }
  tick();
  setInterval(tick, 1000);
})();

/* ══════════════════════════════════════
   MOTIVATIONAL QUOTES
══════════════════════════════════════ */
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
];

let lastQuoteIdx = ls('lastQuote') || 0;
function showQuote() {
  const q = QUOTES[lastQuoteIdx % QUOTES.length];
  $('dashQuote').textContent = `"${q.text}"`;
  $('dashAuthor').textContent = `— ${q.author}`;
  lastQuoteIdx = (lastQuoteIdx + 1) % QUOTES.length;
  ls('lastQuote', lastQuoteIdx);
}
showQuote();
$('refreshQuote').addEventListener('click', () => {
  $('dashQuote').style.opacity = 0;
  setTimeout(() => {
    showQuote();
    $('dashQuote').style.opacity = 1;
  }, 200);
  $('dashQuote').style.transition = 'opacity 0.2s';
});

/* ══════════════════════════════════════
   WEATHER (Geolocation + Open-Meteo API — free, no key)
══════════════════════════════════════ */
(function() {
  const icons = {
    0:'☀️', 1:'🌤', 2:'⛅', 3:'☁️',
    45:'🌫', 48:'🌫',
    51:'🌦', 53:'🌦', 55:'🌧',
    61:'🌧', 63:'🌧', 65:'🌧',
    71:'🌨', 73:'🌨', 75:'❄️',
    80:'🌦', 81:'🌧', 82:'⛈',
    95:'⛈', 96:'⛈', 99:'⛈'
  };
  const desc = {
    0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Foggy', 48:'Icy fog',
    51:'Light drizzle', 53:'Moderate drizzle', 55:'Heavy drizzle',
    61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain',
    71:'Slight snow', 73:'Moderate snow', 75:'Heavy snowfall',
    80:'Rain showers', 81:'Moderate showers', 82:'Violent showers',
    95:'Thunderstorm', 96:'Thunderstorm w/ hail', 99:'Heavy thunderstorm'
  };

  async function fetchWeather(lat, lon, cityName) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
      const res = await fetch(url);
      const d = await res.json();
      const cur = d.current;
      const code = cur.weather_code;
      $('weatherTemp').textContent = `${Math.round(cur.temperature_2m)}°C`;
      $('weatherCity').textContent = cityName;
      $('weatherCond').textContent = desc[code] || 'Clear';
      $('weatherIcon').textContent = icons[code] || '🌡';
      $('wHumidity').textContent = `Humidity: ${cur.relative_humidity_2m}%`;
      $('wWind').textContent = `Wind: ${Math.round(cur.wind_speed_10m)} km/h`;
    } catch(e) {
      $('weatherCity').textContent = 'Weather unavailable';
    }
  }

  async function getCityName(lat, lon) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const d = await res.json();
      return d.address?.city || d.address?.town || d.address?.village || d.address?.state || 'Your location';
    } catch(e) { return 'Your location'; }
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const city = await getCityName(lat, lon);
      fetchWeather(lat, lon, city);
    }, () => {
      // Fallback: Delhi
      fetchWeather(28.6, 77.2, 'New Delhi');
    });
  } else {
    fetchWeather(28.6, 77.2, 'New Delhi');
  }
})();

/* ══════════════════════════════════════
   TASK MANAGER
══════════════════════════════════════ */
const Tasks = (() => {
  let tasks = ls('lifeos_tasks') || [];
  let selectedPriority = 'low';
  let currentFilter = 'all';

  function save() { ls('lifeos_tasks', tasks); updateDashboard(); }

  function render() {
    const list = $('taskList');
    let filtered = tasks;
    if (currentFilter === 'done') filtered = tasks.filter(t => t.done);
    else if (currentFilter !== 'all') filtered = tasks.filter(t => t.priority === currentFilter && !t.done);

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state big">${currentFilter === 'done' ? 'No completed tasks yet.' : 'No tasks found.'}</div>`;
      return;
    }

    list.innerHTML = filtered.map((t, i) => {
      const realIdx = tasks.indexOf(t);
      return `<div class="task-item ${t.priority} ${t.done ? 'done' : ''}">
        <div class="task-check ${t.done ? 'checked' : ''}" data-idx="${realIdx}"></div>
        <div class="task-item-body">
          <div class="task-item-title">${t.title}</div>
          ${t.desc ? `<div class="task-item-desc">${t.desc}</div>` : ''}
          <div class="task-meta">
            <span class="task-badge ${t.priority}">${t.priority}</span>
            <span class="task-cat">${t.category}</span>
          </div>
        </div>
        <button class="task-del" data-idx="${realIdx}">✕</button>
      </div>`;
    }).join('');

    $$('.task-check').forEach(el => {
      el.addEventListener('click', () => {
        tasks[+el.dataset.idx].done = !tasks[+el.dataset.idx].done;
        save(); render();
      });
    });
    $$('.task-del').forEach(el => {
      el.addEventListener('click', () => {
        tasks.splice(+el.dataset.idx, 1);
        save(); render();
        showToast('Task removed', '🗑');
      });
    });
  }

  // Priority buttons
  $$('.pri-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pri-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPriority = btn.dataset.p;
    });
  });

  // Filter buttons
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // Add task
  $('addTaskBtn').addEventListener('click', () => {
    const title = $('taskTitle').value.trim();
    if (!title) { showToast('Please enter a task title', '⚠️'); return; }
    tasks.unshift({
      id: Date.now(),
      title,
      desc: $('taskDesc').value.trim(),
      priority: selectedPriority,
      category: $('taskCat').value,
      done: false,
      created: new Date().toISOString()
    });
    save(); render();
    $('taskTitle').value = ''; $('taskDesc').value = '';
    showToast('Task added!', '✓');
  });

  function getTasks() { return tasks; }
  render();
  return { getTasks, render };
})();

/* ══════════════════════════════════════
   HABIT TRACKER
══════════════════════════════════════ */
const Habits = (() => {
  let habits = ls('lifeos_habits') || [];
  let selectedEmoji = '💧';

  // Emoji picker
  $$('.ep').forEach(el => {
    el.addEventListener('click', () => {
      $$('.ep').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      selectedEmoji = el.dataset.e;
    });
  });

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  function dayKey(offset) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function save() { ls('lifeos_habits', habits); }

  function render() {
    const list = $('habitsList');
    const snap = $('habitSnapshot');
    if (!habits.length) {
      list.innerHTML = `<div class="empty-state big">No habits yet. Start tracking!</div>`;
      snap.innerHTML = `<div class="empty-state">No habits yet.</div>`;
      return;
    }
    list.innerHTML = habits.map((h, hi) => {
      const cells = Array.from({length:7}, (_,i) => {
        const key = dayKey(i);
        const done = h.log && h.log[key];
        const isToday = key === todayKey();
        return `<div class="habit-cell ${done?'done':''} ${isToday?'today':''}" data-h="${hi}" data-d="${key}" title="${key}"></div>`;
      }).join('');
      return `<div class="habit-row">
        <div class="habit-name">
          <span>${h.emoji}</span>
          <span>${h.name}</span>
          <button class="habit-del-btn" data-h="${hi}">✕</button>
        </div>
        ${cells}
      </div>`;
    }).join('');

    $$('.habit-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const h = habits[+cell.dataset.h];
        if (!h.log) h.log = {};
        h.log[cell.dataset.d] = !h.log[cell.dataset.d];
        save(); render(); updateDashboard();
      });
    });
    $$('.habit-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        habits.splice(+btn.dataset.h, 1);
        save(); render(); updateDashboard();
        showToast('Habit removed', '🗑');
      });
    });

    // Snapshot for dashboard
    snap.innerHTML = habits.slice(0,4).map(h => {
      const dots = Array.from({length:7},(_,i)=>{
        const key = dayKey(i);
        return `<div class="snap-dot ${h.log&&h.log[key]?'done':''}"></div>`;
      }).join('');
      return `<div class="snap-habit">
        <div class="snap-name"><span>${h.emoji}</span>${h.name}</div>
        <div class="snap-dots">${dots}</div>
      </div>`;
    }).join('');
  }

  $('addHabitBtn').addEventListener('click', () => {
    const name = $('habitName').value.trim();
    if (!name) { showToast('Please enter a habit name', '⚠️'); return; }
    habits.push({ id: Date.now(), name, emoji: selectedEmoji, target: +$('habitTarget').value, log: {} });
    save(); render(); updateDashboard();
    $('habitName').value = '';
    showToast('Habit added!', '◈');
  });

  function getScore() {
    if (!habits.length) return 0;
    let total = 0, done = 0;
    habits.forEach(h => {
      for (let i=0;i<7;i++) {
        const key = dayKey(i);
        total++;
        if (h.log && h.log[key]) done++;
      }
    });
    return total ? Math.round((done/total)*100) : 0;
  }

  render();
  return { getScore, render };
})();

/* ══════════════════════════════════════
   FOCUS TIMER
══════════════════════════════════════ */
const FocusTimer = (() => {
  let workMins = 25, breakMins = 5;
  let totalSec = workMins * 60;
  let isWork = true, interval = null;
  let sessionCount = 1;
  let sessions = ls('lifeos_sessions') || [];
  const CIRC = 2 * Math.PI * 130; // ~816.81

  const display = $('focusDisplay');
  const phase = $('focusPhase');
  const ring = $('timerRing');
  const sc = $('sessionCount');
  const logEl = $('focusLog');

  function render() {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const ratio = totalSec / ((isWork ? workMins : breakMins) * 60);
    ring.style.strokeDashoffset = CIRC * (1 - ratio);
    ring.style.stroke = isWork ? 'var(--accent)' : 'var(--accent2)';
  }

  function renderLog() {
    if (!sessions.length) { logEl.innerHTML = `<div class="empty-state">No sessions yet.</div>`; return; }
    logEl.innerHTML = sessions.slice(-8).reverse().map(s =>
      `<div class="log-item"><span class="log-icon">${s.type==='work'?'◎':'☕'}</span>${s.label} — ${s.time}</div>`
    ).join('');
  }

  $('focusStart').addEventListener('click', () => {
    if (interval) return;
    ring.classList.add('ticking');
    interval = setInterval(() => {
      if (totalSec > 0) { totalSec--; render(); }
      else {
        clearInterval(interval); interval = null;
        ring.classList.remove('ticking');
        sessions.push({ type: isWork?'work':'break', label: isWork?`Work ${workMins}min`:`Break ${breakMins}min`, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
        ls('lifeos_sessions', sessions);
        renderLog();
        updateDashboard();
        if (isWork) {
          isWork = false; totalSec = breakMins * 60;
          phase.textContent = 'Break Time ☕'; sessionCount++;
        } else {
          isWork = true; totalSec = workMins * 60;
          phase.textContent = 'Work Session';
        }
        sc.textContent = sessionCount;
        render();
        showToast(isWork ? 'Break done! Back to work 💪' : 'Work done! Time for a break ☕');
      }
    }, 1000);
  });

  $('focusPause').addEventListener('click', () => {
    clearInterval(interval); interval = null;
    ring.classList.remove('ticking');
  });
  $('focusReset').addEventListener('click', () => {
    clearInterval(interval); interval = null;
    ring.classList.remove('ticking');
    isWork = true; totalSec = workMins * 60;
    phase.textContent = 'Work Session';
    render();
  });

  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(interval); interval = null;
      ring.classList.remove('ticking');
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      workMins = +btn.dataset.work; breakMins = +btn.dataset.break;
      isWork = true; totalSec = workMins * 60;
      phase.textContent = 'Work Session';
      render();
    });
  });

  $$('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sound-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  function getSessions() { return sessions.length; }
  render(); renderLog();
  return { getSessions, renderLog };
})();

/* ══════════════════════════════════════
   NOTES
══════════════════════════════════════ */
const Notes = (() => {
  let notes = ls('lifeos_notes') || [];
  let selectedMood = 'focused';

  $$('.mood-btn').forEach(el => {
    el.addEventListener('click', () => {
      $$('.mood-btn').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      selectedMood = el.dataset.mood;
    });
  });

  const moodEmoji = { focused:'🎯', happy:'😊', creative:'💡', stressed:'😤', calm:'🌿' };

  function render(filter = '') {
    const grid = $('notesGrid');
    let list = notes;
    if (filter) list = notes.filter(n => n.title.toLowerCase().includes(filter) || n.body.toLowerCase().includes(filter) || (n.tag||'').toLowerCase().includes(filter));
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state big">No notes found.</div>`;
      return;
    }
    grid.innerHTML = list.map((n, i) => {
      const realIdx = notes.indexOf(n);
      const t = new Date(n.time);
      return `<div class="note-card">
        <button class="note-del" data-idx="${realIdx}">✕</button>
        <div class="note-mood">${moodEmoji[n.mood] || '📝'}</div>
        <div class="note-title">${n.title}</div>
        <div class="note-body">${n.body}</div>
        <div class="note-footer">
          <span class="note-tag">${n.tag || ''}</span>
          <span class="note-time">${t.toLocaleDateString()}</span>
        </div>
      </div>`;
    }).join('');

    $$('.note-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        notes.splice(+btn.dataset.idx, 1);
        save(); render($('noteSearch').value);
        showToast('Note deleted', '🗑');
      });
    });
  }

  $('noteSearch').addEventListener('input', e => render(e.target.value.toLowerCase().trim()));

  function save() { ls('lifeos_notes', notes); updateDashboard(); }

  $('addNoteBtn').addEventListener('click', () => {
    const title = $('noteTitle').value.trim();
    const body = $('noteBody').value.trim();
    if (!title && !body) { showToast('Please write something', '⚠️'); return; }
    notes.unshift({ id: Date.now(), title: title || 'Untitled', body, mood: selectedMood, tag: $('noteTag').value.trim(), time: new Date().toISOString() });
    save(); render();
    $('noteTitle').value = ''; $('noteBody').value = ''; $('noteTag').value = '';
    showToast('Note saved!', '◻');
  });

  function getCount() { return notes.length; }
  render();
  return { getCount, getNotes: () => notes };
})();

/* ══════════════════════════════════════
   DASHBOARD STATS UPDATE
══════════════════════════════════════ */
function updateDashboard() {
  // Tasks
  const tasks = Tasks.getTasks();
  const todayTasks = tasks.filter(t => !t.done).length;
  const doneTasks = tasks.filter(t => t.done).length;
  const totalT = tasks.length;
  $('statTaskNum').textContent = todayTasks;
  $('statTaskFill').style.width = totalT ? `${(doneTasks/totalT)*100}%` : '0%';

  // Quick task list on dashboard
  const ql = $('quickTaskList');
  const upcoming = tasks.filter(t => !t.done).slice(0,5);
  if (!upcoming.length) {
    ql.innerHTML = `<div class="empty-state">${doneTasks ? 'All tasks done! 🎉' : 'No tasks. Add some!'}</div>`;
  } else {
    ql.innerHTML = upcoming.map(t => `<div class="quick-task"><div class="qt-dot ${t.priority}"></div>${t.title}</div>`).join('');
  }

  // Habits
  const hs = Habits.getScore();
  $('statHabitNum').textContent = `${hs}%`;
  $('statHabitFill').style.width = `${hs}%`;

  // Focus
  const fs = FocusTimer.getSessions();
  $('statFocusNum').textContent = fs;
  $('statFocusFill').style.width = `${Math.min(fs*10, 100)}%`;

  // Notes
  const nc = Notes.getCount();
  $('statNoteNum').textContent = nc;
  $('statNoteFill').style.width = `${Math.min(nc*10, 100)}%`;
}

/* ══════════════════════════════════════
   ANALYTICS
══════════════════════════════════════ */
function buildAnalytics() {
  const tasks = Tasks.getTasks();
  const notes = Notes.getNotes();
  const sessions = +(ls('lifeos_sessions') || []).length;
  const hs = Habits.getScore();

  $('aTotalTasks').textContent = tasks.length;
  $('aTotalSessions').textContent = sessions;
  $('aTotalNotes').textContent = notes.length;
  $('aHabitScore').textContent = `${hs}%`;

  // Bar chart — tasks by category
  const cats = { personal: 0, study: 0, work: 0, health: 0 };
  tasks.forEach(t => { if (cats[t.category] !== undefined) cats[t.category]++; });
  const maxC = Math.max(...Object.values(cats), 1);
  const colors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', 'var(--accent4)'];
  $('barChart').innerHTML = Object.entries(cats).map(([cat, val], i) => {
    const h = Math.max((val / maxC) * 120, val ? 4 : 0);
    return `<div class="bar-col">
      <div class="bar-col-val">${val}</div>
      <div class="bar-col-bar" style="height:${h}px;background:${colors[i]}"></div>
      <div class="bar-col-label">${cat}</div>
    </div>`;
  }).join('');

  // Heatmap — 30 days
  const heatData = Array.from({length:30}, () => Math.random() > 0.4 ? Math.ceil(Math.random()*4) : 0);
  $('heatmap').innerHTML = heatData.map(v => {
    const cls = v === 0 ? '' : v === 1 ? 'l1' : v === 2 ? 'l2' : v === 3 ? 'l3' : 'l4';
    const d = new Date(); d.setDate(d.getDate() - (30 - heatData.indexOf(v)));
    return `<div class="heat-cell ${cls}" title="${d.toLocaleDateString()}"></div>`;
  }).join('');

  // Line chart — weekly
  drawLineChart();
}

function drawLineChart() {
  const canvas = $('lineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 700, H = 200;
  canvas.width = W; canvas.height = H;

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const scores = days.map(() => Math.floor(Math.random() * 60 + 30));
  const maxS = Math.max(...scores);

  ctx.clearRect(0, 0, W, H);

  const pad = { l: 40, r: 20, t: 20, b: 40 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }

  // Gradient fill
  const pts = days.map((_, i) => ({
    x: pad.l + (i / (days.length - 1)) * chartW,
    y: pad.t + chartH - (scores[i] / maxS) * chartH
  }));

  const grad = ctx.createLinearGradient(0, pad.t, 0, H);
  grad.addColorStop(0, 'rgba(108,140,255,0.3)');
  grad.addColorStop(1, 'rgba(108,140,255,0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, H - pad.b);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = 'var(--accent)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots + Labels
  const style = getComputedStyle(document.documentElement);
  const textCol = document.body.classList.contains('light') ? '#4a5070' : '#9a9fb5';

  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6c8cff';
    ctx.fill();
    ctx.strokeStyle = 'var(--bg)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = textCol;
    ctx.font = '11px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], p.x, H - 10);
    ctx.fillText(scores[i], p.x, p.y - 10);
  });
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.altKey) {
    const map = { '1':'home', '2':'todo', '3':'habits', '4':'focus', '5':'notes', '6':'analytics' };
    if (map[e.key]) { e.preventDefault(); goToPage(map[e.key]); }
  }
});

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
updateDashboard();

// Subtle floating particles on home hero
(function() {
  const hero = $q('.hero-header');
  if (!hero) return;
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'absolute',
      width: `${Math.random()*4+2}px`,
      height: `${Math.random()*4+2}px`,
      borderRadius: '50%',
      background: `rgba(108,140,255,${Math.random()*0.3+0.1})`,
      left: `${Math.random()*100}%`,
      top: `${Math.random()*100}%`,
      animation: `pulse ${Math.random()*3+2}s ease-in-out infinite ${Math.random()*2}s`,
      pointerEvents: 'none',
    });
    hero.style.position = 'relative';
    hero.appendChild(dot);
  }
})();

console.log(`
██╗     ██╗███████╗███████╗ ██████╗ ███████╗
██║     ██║██╔════╝██╔════╝██╔═══██╗██╔════╝
██║     ██║█████╗  █████╗  ██║   ██║███████╗
██║     ██║██╔══╝  ██╔══╝  ██║   ██║╚════██║
███████╗██║██║     ███████╗╚██████╔╝███████║
╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚══════╝
Personal Intelligence Dashboard — v2.0
`);
