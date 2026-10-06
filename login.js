/* Frontend-only demo.
   "Accounts" live in this browser's localStorage so the whole flow can be tested.
   Later: swap the three marked spots for Google OAuth + your Spring Boot API. */

const $ = (s, r = document) => r.querySelector(s);
const DB_KEY = 'alliances_users', SESSION_KEY = 'alliances_session';
const PRESET_SKILLS = ['Java', 'Python', 'JavaScript', 'React', 'Spring Boot', 'SQL', 'Machine Learning', 'Data Analysis',
  'UI/UX Design', 'Research Writing', 'Clinical Knowledge', 'Pharmacology', 'Lab Work', 'Agriculture', 'Business Strategy', 'Marketing', 'Public Speaking'];

const loadDB = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)) || {}; } catch { return {}; } };
const saveDB = db => localStorage.setItem(DB_KEY, JSON.stringify(db));

// mock only: real passwords are hashed server-side (BCrypt in Spring Security)
async function hash(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381; for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return String(h);
}

const state = { mode: 'login', step: 1, pending: null, skills: new Set(), pfp: '' };

/* ---------- screens ---------- */
function show(name) {
  ['Auth', 'Onboard', 'Done'].forEach(n => {
    const el = $('#screen' + n);
    el.hidden = n !== name;
    if (n === name) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setErr(name, msg = '') {
  const e = $('#e-' + name); if (e) e.textContent = msg;
  const i = $('#' + name); if (i) i.classList.toggle('bad', !!msg);
}
const clearErrs = root => root.querySelectorAll('.err').forEach(e => setErr(e.id.slice(2)));
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
const initials = n => (n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || 'A').toUpperCase();

/* ---------- log in / sign up ---------- */
function setMode(mode) {
  state.mode = mode;
  const login = mode === 'login';
  $('#tabLogin').setAttribute('aria-selected', login);
  $('#tabSignup').setAttribute('aria-selected', !login);
  $('#authTitle').textContent = login ? 'Welcome back.' : "Let's get you started.";
  $('#authLead').textContent = login ? 'Log in to pick up where you left off.' : 'Create your account. It only takes a minute.';
  $('#authSubmit').textContent = login ? 'Log in' : 'Create account';
  $('#password').placeholder = login ? 'your password' : 'at least 8 characters';
  $('#password').autocomplete = login ? 'current-password' : 'new-password';
  $('#authMsg').textContent = '';
  clearErrs($('#authForm'));
}
$('#tabLogin').onclick = () => setMode('login');
$('#tabSignup').onclick = () => setMode('signup');
$('#pwToggle').onclick = () => {
  const p = $('#password'), show = p.type === 'password';
  p.type = show ? 'text' : 'password';
  $('#pwToggle').innerHTML = `<i class="ti ti-eye${show ? '-off' : ''}"></i>`;
  $('#pwToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
};

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  clearErrs($('#authForm')); $('#authMsg').textContent = '';
  const email = $('#email').value.trim().toLowerCase(), pass = $('#password').value;
  let ok = true;
  if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('email', 'Enter a valid email address.'); ok = false; }
  if (!pass) { setErr('password', 'Enter your password.'); ok = false; }
  else if (state.mode === 'signup' && pass.length < 8) { setErr('password', 'Use at least 8 characters.'); ok = false; }
  if (!ok) return;

  const db = loadDB(), user = db[email], passHash = await hash(pass);

  if (state.mode === 'login') {
    if (!user) {   // no account yet: go straight to setting one up
      return startOnboarding({ email, passHash, provider: 'email', notice: `We couldn't find an account for ${email}, so let's set one up.` });
    }
    if (!user.passHash) { $('#authMsg').textContent = 'This account uses Google. Try "Continue with Google" instead.'; return; }
    if (user.passHash !== passHash) { setErr('password', "That password doesn't match."); return; }
    return finishLogin(user);
  }
  // sign up
  if (user) { setMode('login'); $('#email').value = email; $('#authMsg').textContent = 'You already have an account with this email. Log in instead.'; return; }
  startOnboarding({ email, passHash, provider: 'email' });
});

/* Google: DEMO ONLY. Replace with Google Identity Services (OAuth) and use the
   returned email, name and picture. The rest of the flow stays the same. */
$('#googleBtn').onclick = () => {
  const g = { email: 'demo.student@gmail.com', name: 'Demo Student' };
  const user = loadDB()[g.email];
  if (user) return finishLogin(user);
  startOnboarding({ email: g.email, passHash: '', provider: 'google', name: g.name, notice: `Signed in with Google as ${g.email}. Just a few details and you're in.` });
};

/* ---------- onboarding ---------- */
function startOnboarding(p) {
  state.pending = p; state.step = 1; state.skills = new Set(); state.pfp = '';
  $('#onbForm').reset(); clearErrs($('#onbForm'));
  $('#name').value = p.name || ''; $('#bioCount').textContent = '0'; $('#deptOtherBox').hidden = true;
  setAvatar(); renderChips();
  const n = $('#notice'); n.hidden = !p.notice; n.textContent = p.notice || '';
  renderStep(); show('Onboard');
}
function renderStep() {
  document.querySelectorAll('.step').forEach(s => s.hidden = +s.dataset.step !== state.step);
  document.querySelectorAll('#progress span').forEach((s, i) => s.classList.toggle('on', i < state.step));
  $('#stepLabel').textContent = `Step ${state.step} of 3`;
  $('#backBtn').textContent = state.step === 1 ? 'Cancel' : 'Back';
  $('#nextBtn').textContent = state.step === 3 ? 'Create my account' : 'Continue';
  const first = document.querySelector(`.step[data-step="${state.step}"] input:not([type=file]),.step[data-step="${state.step}"] select`);
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
}

function setAvatar() {
  const name = $('#name').value;
  $('#avatarInit').textContent = initials(name);
  $('#avatarImg').hidden = !state.pfp; $('#avatarInit').hidden = !!state.pfp;
  if (state.pfp) $('#avatarImg').src = state.pfp;
  $('#pfpRemove').hidden = !state.pfp;
}
$('#name').addEventListener('input', () => {
  setAvatar();
  const u = $('#username');
  if (!u.dataset.touched) u.value = $('#name').value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20);
});
$('#username').addEventListener('input', e => { e.target.dataset.touched = '1'; });
$('#bio').addEventListener('input', e => { $('#bioCount').textContent = e.target.value.length; });
$('#department').addEventListener('change', e => { $('#deptOtherBox').hidden = e.target.value !== 'Other'; });

// photo: crop to a square and shrink so it stays small
$('#pfpBtn').onclick = () => $('#pfpFile').click();
$('#pfpRemove').onclick = () => { state.pfp = ''; $('#pfpFile').value = ''; setAvatar(); };
$('#pfpFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const s = Math.min(img.width, img.height), c = document.createElement('canvas');
    c.width = c.height = 240;
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 240, 240);
    state.pfp = c.toDataURL('image/jpeg', .85); URL.revokeObjectURL(url); setAvatar();
  };
  img.src = url;
});

function renderChips() {
  const box = $('#chips'); box.textContent = '';
  const all = [...new Set([...PRESET_SKILLS, ...state.skills])];
  all.forEach(s => {
    const b = el('button', 'chip', s); b.type = 'button';
    b.setAttribute('aria-pressed', state.skills.has(s));
    b.onclick = () => { state.skills.has(s) ? state.skills.delete(s) : state.skills.add(s); setErr('skills'); renderChips(); };
    box.appendChild(b);
  });
}
function addSkill() {
  const v = $('#skillInput').value.trim(); if (!v) return;
  const match = [...PRESET_SKILLS, ...state.skills].find(s => s.toLowerCase() === v.toLowerCase());
  state.skills.add(match || v); $('#skillInput').value = ''; setErr('skills'); renderChips();
}
$('#skillAdd').onclick = addSkill;
$('#skillInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });

function normLink(v) { v = v.trim(); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; try { return new URL(v).hostname.includes('.') ? v : null; } catch { return null; } }

function validate(step) {
  clearErrs(document.querySelector(`.step[data-step="${step}"]`));
  let ok = true; const bad = (n, m) => { setErr(n, m); ok = false; };
  if (step === 1) {
    if ($('#name').value.trim().length < 2) bad('name', 'Tell us your name.');
    const u = $('#username').value.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) bad('username', 'Use 3 to 20 letters, numbers or underscores.');
    else if (Object.values(loadDB()).some(x => x.profile.username === u)) bad('username', 'That username is taken. Try another.');
  }
  if (step === 2) {
    if (!$('#college').value.trim()) bad('college', 'Add your college.');
    if (!$('#department').value) bad('department', 'Choose your department.');
    else if ($('#department').value === 'Other' && !$('#deptOther').value.trim()) bad('deptOther', 'Type your department.');
    if (!$('#year').value) bad('year', 'Choose your year.');
  }
  if (step === 3) {
    if (!state.skills.size) bad('skills', 'Pick at least one skill so people can find you.');
    if (['github', 'linkedin', 'leetcode', 'otherlink'].some(id => normLink($('#' + id).value) === null)) bad('links', "One of those links doesn't look right.");
  }
  return ok;
}

$('#backBtn').onclick = () => { if (state.step === 1) { show('Auth'); } else { state.step--; renderStep(); } };
$('#onbForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!validate(state.step)) return;
  if (state.step < 3) { state.step++; return renderStep(); }

  const p = state.pending, dept = $('#department').value;
  const profile = {
    name: $('#name').value.trim(), username: $('#username').value.trim().toLowerCase(),
    pronouns: $('#pronouns').value.trim(), bio: $('#bio').value.trim(), pfp: state.pfp,
    college: $('#college').value.trim(), department: dept === 'Other' ? $('#deptOther').value.trim() : dept,
    year: $('#year').value, section: $('#section').value.trim(), skills: [...state.skills],
    links: { github: normLink($('#github').value), linkedin: normLink($('#linkedin').value), leetcode: normLink($('#leetcode').value), other: normLink($('#otherlink').value) }
  };
  const db = loadDB();
  db[p.email] = { email: p.email, passHash: p.passHash, provider: p.provider, profile };   // later: POST to your backend
  saveDB(db);
  finishLogin(db[p.email], true);
});

/* ---------- done ---------- */
function finishLogin(user, isNew = false) {
  localStorage.setItem(SESSION_KEY, user.email);
  if (!isNew) { location.href = 'dashboard.html'; return; }   // returning users go straight in
  const p = user.profile, first = p.name.split(' ')[0];
  $('#doneTitle').textContent = isNew ? `You're in, ${first}.` : `Welcome back, ${first}.`;
  $('#doneLead').textContent = isNew ? 'Your account is ready. Time to find your people.' : "Good to see you again.";
  $('#doneInit').textContent = initials(p.name); $('#doneInit').hidden = !!p.pfp;
  $('#doneImg').hidden = !p.pfp; if (p.pfp) $('#doneImg').src = p.pfp;
  const box = $('#summary'); box.textContent = '';
  box.append(el('b', '', p.name), el('p', '', `@${p.username}${p.pronouns ? ' · ' + p.pronouns : ''}`),
    el('p', '', `${p.department}, ${p.year} · ${p.college}`));
  if (p.bio) box.append(el('p', '', p.bio));
  const chips = el('div', 'chips'); p.skills.forEach(s => chips.append(el('span', 'chip', s))); box.append(chips);
  show('Done');
  setTimeout(() => { location.href = 'dashboard.html'; }, 2200);   // new accounts see the welcome for a moment
}
$('#resetBtn').onclick = () => {
  if (confirm('Clear all saved demo accounts in this browser?')) { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY); location.reload(); }
};

/* ---------- start ---------- */
const sessionUser = loadDB()[localStorage.getItem(SESSION_KEY)];
if (sessionUser) location.replace('dashboard.html'); else show('Auth');