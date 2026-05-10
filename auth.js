/* ============================================================
   LIFEOS — auth.js  (FIXED)
   Safe to load on BOTH auth.html AND index.html
   ============================================================ */

/* ══════════════════════════════════════
   PART 1 — Shared LifeOSAuth object
   Runs on every page that loads auth.js
══════════════════════════════════════ */
(function () {
  'use strict';

  function getSession() {
    try { return JSON.parse(localStorage.getItem('lifeos_session')); }
    catch (e) { return null; }
  }

  window.LifeOSAuth = {
    getSession: getSession,
    clearSession: function () { localStorage.removeItem('lifeos_session'); },
    logout: function () {
      localStorage.removeItem('lifeos_session');
      window.location.href = 'auth.html';
    },
    requireAuth: function () {
      var s = getSession();
      if (!s) { window.location.href = 'auth.html'; return null; }
      return s;
    }
  };

})();


/* ══════════════════════════════════════
   PART 2 — Auth page logic
   Only runs if loginForm exists (auth.html)
══════════════════════════════════════ */
(function () {
  'use strict';

  if (!document.getElementById('loginForm')) return;

  /* Already logged in → go to dashboard */
  if (window.LifeOSAuth.getSession()) {
    window.location.href = 'index.html';
    return;
  }

  /* ── Local helpers (no conflict with script.js) ── */
  function el(id)   { return document.getElementById(id); }
  function qs(s)    { return document.querySelector(s); }
  function qsa(s)   { return document.querySelectorAll(s); }
  function encodePass(p) { return btoa(unescape(encodeURIComponent(p))); }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem('lifeos_users')) || []; }
    catch (e) { return []; }
  }
  function saveUsers(u) { localStorage.setItem('lifeos_users', JSON.stringify(u)); }
  function setSession(u) {
    localStorage.setItem('lifeos_session', JSON.stringify({
      username: u.username, name: u.name, email: u.email, loginTime: Date.now()
    }));
  }

  /* ── Custom Cursor ── */
  (function () {
    var dot  = qs('.cursor-dot');
    var ring = qs('.cursor-ring');
    if (!dot || !ring) return;
    var mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function tick() {
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      rx += (mx - rx) * 0.13; ry += (my - ry) * 0.13;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(tick);
    })();
  })();

  /* ── Inject shake keyframe ── */
  var sty = document.createElement('style');
  sty.textContent = '@keyframes formIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
  document.head.appendChild(sty);

  /* ════════════════════════
     VALIDATION FUNCTIONS
  ════════════════════════ */
  function vName(v) {
    if (!v)           return 'Full name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    if (v.length > 50) return 'Name is too long (max 50 characters).';
    if (!/^[a-zA-Z\s'\-]+$/.test(v)) return 'Only letters, spaces, hyphens, apostrophes allowed.';
    return '';
  }
  function vUsername(v, chk) {
    if (!v)            return 'Username is required.';
    if (v.length < 3)  return 'Username must be at least 3 characters.';
    if (v.length > 20) return 'Username too long (max 20 characters).';
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Only letters, numbers, underscores allowed.';
    if (chk && getUsers().some(function (u) { return u.username.toLowerCase() === v.toLowerCase(); }))
      return 'This username is already taken.';
    return '';
  }
  function vEmail(v, chk) {
    if (!v) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address.';
    if (chk && getUsers().some(function (u) { return u.email.toLowerCase() === v.toLowerCase(); }))
      return 'An account with this email already exists.';
    return '';
  }
  function vPassword(v) {
    if (!v)             return 'Password is required.';
    if (v.length < 8)   return 'Password must be at least 8 characters.';
    if (v.length > 128) return 'Password is too long.';
    if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter (A–Z).';
    if (!/[a-z]/.test(v)) return 'Add at least one lowercase letter (a–z).';
    if (!/[0-9]/.test(v)) return 'Add at least one number (0–9).';
    if (!/[^a-zA-Z0-9]/.test(v)) return 'Add at least one special character (e.g. !@#$%).';
    return '';
  }
  function strength(v) {
    if (!v) return { pct: '0%', label: '—', color: '#5c6380' };
    var s = 0;
    if (v.length >= 8)  s++;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[a-z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    if (s <= 2) return { pct: '25%',  label: 'Weak',   color: '#ff6b6b' };
    if (s <= 3) return { pct: '50%',  label: 'Fair',   color: '#f5a524' };
    if (s <= 4) return { pct: '75%',  label: 'Good',   color: '#6c8cff' };
               return { pct: '100%', label: 'Strong', color: '#56d4a0' };
  }

  /* ── Mark field error/success ── */
  function mark(inp, errId, msg) {
    inp.classList.toggle('error',   !!msg);
    inp.classList.toggle('success', !msg && inp.value.length > 0);
    el(errId).textContent = msg || '';
  }
  function clearMark(inp, errId) {
    inp.classList.remove('error', 'success');
    el(errId).textContent = '';
  }

  /* ── Show banner error ── */
  function banner(divId, msg, ok) {
    var d = el(divId);
    d.textContent        = msg;
    d.style.color        = ok ? '#56d4a0' : '#ff6b6b';
    d.style.background   = ok ? 'rgba(86,212,160,0.08)'  : 'rgba(255,107,107,0.1)';
    d.style.borderColor  = ok ? 'rgba(86,212,160,0.3)'   : 'rgba(255,107,107,0.3)';
    d.style.display      = 'block';
    setTimeout(function () { d.style.display = 'none'; }, 4500);
  }

  /* ════════════════════════
     PASSWORD SHOW/HIDE
  ════════════════════════ */
  qsa('.eye-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = el(btn.dataset.target);
      if (!inp) return;
      inp.type        = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  });

  /* ════════════════════════
     SWITCH LOGIN ↔ REGISTER
  ════════════════════════ */
  function show(formId) {
    ['loginForm', 'registerForm', 'successState'].forEach(function (id) {
      el(id).style.display = id === formId ? 'block' : 'none';
    });
    var f = el(formId);
    f.style.animation = 'none';
    void f.offsetWidth;
    f.style.animation = 'formIn 0.4s ease';
  }

  el('goToRegister').addEventListener('click', function () { show('registerForm'); });
  el('goToLogin').addEventListener('click', function ()    { show('loginForm'); });

  /* ════════════════════════
     REGISTER
  ════════════════════════ */
  var rName  = el('regName');
  var rUser  = el('regUsername');
  var rEmail = el('regEmail');
  var rPass  = el('regPassword');
  var rConf  = el('regConfirm');

  /* Live validation helpers */
  function live(inp, errId, fn) {
    inp.addEventListener('blur',  function () { mark(inp, errId, fn()); });
    inp.addEventListener('input', function () {
      if (inp.classList.contains('error') || inp.classList.contains('success'))
        mark(inp, errId, fn());
    });
  }
  live(rName,  'regNameErr',     function () { return vName(rName.value.trim()); });
  live(rUser,  'regUsernameErr', function () { return vUsername(rUser.value.trim(), true); });
  live(rEmail, 'regEmailErr',    function () { return vEmail(rEmail.value.trim(), true); });

  rPass.addEventListener('input', function () {
    var s = strength(rPass.value);
    el('strengthFill').style.width      = s.pct;
    el('strengthFill').style.background = s.color;
    el('strengthLabel').textContent     = s.label;
    el('strengthLabel').style.color     = s.color;
    if (rPass.classList.contains('error') || rPass.classList.contains('success'))
      mark(rPass, 'regPasswordErr', vPassword(rPass.value));
    if (rConf.value)
      mark(rConf, 'regConfirmErr', rConf.value !== rPass.value ? 'Passwords do not match.' : '');
  });
  rPass.addEventListener('blur',  function () { mark(rPass, 'regPasswordErr', vPassword(rPass.value)); });
  rConf.addEventListener('input', function () { mark(rConf, 'regConfirmErr', rConf.value !== rPass.value ? 'Passwords do not match.' : ''); });
  rConf.addEventListener('blur',  function () { mark(rConf, 'regConfirmErr', rConf.value !== rPass.value ? 'Passwords do not match.' : ''); });

  el('registerBtn').addEventListener('click', function () {
    var name     = rName.value.trim();
    var username = rUser.value.trim();
    var email    = rEmail.value.trim();
    var password = rPass.value;
    var confirm  = rConf.value;
    var agreed   = el('agreeTerms').checked;

    var e1 = vName(name);
    var e2 = vUsername(username, true);
    var e3 = vEmail(email, true);
    var e4 = vPassword(password);
    var e5 = confirm !== password ? 'Passwords do not match.' : '';
    var e6 = !agreed ? 'You must agree to the terms to continue.' : '';

    mark(rName,  'regNameErr',     e1);
    mark(rUser,  'regUsernameErr', e2);
    mark(rEmail, 'regEmailErr',    e3);
    mark(rPass,  'regPasswordErr', e4);
    mark(rConf,  'regConfirmErr',  e5);
    el('regTermsErr').textContent = e6;

    if (e1 || e2 || e3 || e4 || e5 || e6) return;

    var btn = el('registerBtn');
    btn.disabled = true;
    el('registerLoader').style.display = 'inline-block';
    btn.querySelector('.btn-text').textContent = 'Creating...';

    setTimeout(function () {
      var users = getUsers();
      users.push({ name: name, username: username, email: email, password: encodePass(password), createdAt: Date.now() });
      saveUsers(users);
      setSession({ name: name, username: username, email: email });
      show('successState');
      setTimeout(function () { window.location.href = 'index.html'; }, 2000);
    }, 900);
  });

  /* ════════════════════════
     LOGIN
  ════════════════════════ */
  var lIdent = el('loginIdentifier');
  var lPass  = el('loginPassword');

  lIdent.addEventListener('blur', function () {
    if (!lIdent.value.trim()) mark(lIdent, 'loginIdentifierErr', 'Please enter your username or email.');
    else clearMark(lIdent, 'loginIdentifierErr');
  });
  lPass.addEventListener('blur', function () {
    if (!lPass.value) mark(lPass, 'loginPasswordErr', 'Please enter your password.');
    else clearMark(lPass, 'loginPasswordErr');
  });

  function doLogin() {
    var identifier = lIdent.value.trim();
    var password   = lPass.value;
    var bad = false;

    if (!identifier) { mark(lIdent, 'loginIdentifierErr', 'Please enter your username or email.'); bad = true; }
    else clearMark(lIdent, 'loginIdentifierErr');
    if (!password)   { mark(lPass,  'loginPasswordErr',   'Please enter your password.'); bad = true; }
    else clearMark(lPass, 'loginPasswordErr');
    if (bad) return;

    var btn = el('loginBtn');
    btn.disabled = true;
    el('loginLoader').style.display = 'inline-block';
    btn.querySelector('.btn-text').textContent = 'Signing in...';

    setTimeout(function () {
      var users  = getUsers();
      var enc    = encodePass(password);
      var found  = null;
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if ((u.username.toLowerCase() === identifier.toLowerCase() ||
             u.email.toLowerCase()    === identifier.toLowerCase()) &&
             u.password === enc) { found = u; break; }
      }

      if (!found) {
        btn.disabled = false;
        el('loginLoader').style.display = 'none';
        btn.querySelector('.btn-text').textContent = 'Sign In';
        mark(lIdent, 'loginIdentifierErr', ' ');
        mark(lPass,  'loginPasswordErr',   ' ');
        banner('loginFormErr', 'Incorrect username/email or password.', false);
        var form = el('loginForm');
        form.style.animation = 'none';
        void form.offsetWidth;
        form.style.animation = 'shake 0.4s ease';
        return;
      }

      if (el('rememberMe').checked) localStorage.setItem('lifeos_remember', found.username);
      else localStorage.removeItem('lifeos_remember');

      setSession(found);
      show('successState');
      setTimeout(function () { window.location.href = 'index.html'; }, 2000);
    }, 900);
  }

  el('loginBtn').addEventListener('click', doLogin);
  lPass.addEventListener('keydown',  function (e) { if (e.key === 'Enter') doLogin(); });
  lIdent.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });

  /* Prefill remembered user */
  var rem = localStorage.getItem('lifeos_remember');
  if (rem) { lIdent.value = rem; el('rememberMe').checked = true; }

  /* Forgot password */
  el('forgotBtn').addEventListener('click', function () {
    var id = lIdent.value.trim();
    if (!id) { banner('loginFormErr', 'Enter your username or email first, then click Forgot password.', false); return; }
    var exists = getUsers().some(function (u) {
      return u.username.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase();
    });
    banner('loginFormErr',
      exists ? 'A password reset link would be sent to your registered email. (Demo mode)' : 'No account found with that username or email.',
      exists);
  });

})(); /* end auth page IIFE */
