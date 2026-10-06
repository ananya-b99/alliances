/* Frontend-only MVP. Everything is saved in localStorage (alliances_data).
   Later each save()/state change becomes a call to your Spring Boot API. */

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const USERS_KEY = 'alliances_users', SESSION_KEY = 'alliances_session', DATA_KEY = 'alliances_data';
const users = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; } };
const account = users()[localStorage.getItem(SESSION_KEY)];
if (!account) location.replace('login.html');
const me = { id: localStorage.getItem(SESSION_KEY), links: {}, skills: [], name: 'You', ...(account ? account.profile : {}) };
const first = me.name.split(' ')[0];

const PRESET_SKILLS = ['Java', 'Python', 'JavaScript', 'React', 'Spring Boot', 'SQL', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Research Writing', 'Clinical Knowledge', 'Pharmacology', 'Lab Work', 'Agriculture', 'Business Strategy', 'Marketing', 'Public Speaking'];
const REASONS = ['The team is already full', 'We need different skills for now', 'Our plans have changed', 'We decided to go in a different direction'];
const TABS = [
  ['hackathon', 'Hackathons', 'ti-users-group', ''],
  ['research', 'Research & Patents', 'ti-flask', 'Faculty and students post research or patent work and invite people from any department to join.'],
  ['project', 'Project Teamups', 'ti-puzzle', 'Got skills but no idea, or an idea but no skills? Find someone who fills the gap.'],
  ['mentor', 'Mentorship', 'ti-heart-handshake', "Share where you're stuck and let mentors answer in the comments. A private chat opens only if you accept."],
  ['ideas', 'Idea Validation', 'ti-bulb', 'Put your idea out there and let people tell you honestly whether it solves a real problem.'],
  ['surveys', 'Survey Portal', 'ti-chart-bar', 'Build a quick survey and see the responses as graphs, without leaving the app.'],
  ['showcase', 'Showcase Feed', 'ti-trophy', 'Share what you finished, tag your teammates, and show how you got there.']
];
const STATUS = { pending: ['Pending', 'soft', 'ti-clock'], accepted: ['Accepted', 'fill', 'ti-check'], rejected: ['Declined', '', 'ti-x'], expired: ['Expired', 'soft', 'ti-hourglass-off'] };
const POST_STATUS = { open: ['Open', 'fill'], closed: ['Closed', ''], expired: ['Expired', 'soft'] };

/* ---------- data ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const dayStr = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
function seed() {
  const c = me.college || 'Your college';
  const P = (id, name, username, department, year, bio, skills) => ({ id, name, username, department, year, college: c, bio, skills, links: {} });
  const people = [
    P('d1', 'Riya Sharma', 'riya_s', 'Medical', '3rd year', 'Med student with a health-tech idea and no coding skills yet.', ['Clinical Knowledge', 'Research Writing', 'Public Speaking']),
    P('d2', 'Kabir Mehta', 'kabir_m', 'Pharmacy', '2nd year', 'Pharma student who enjoys working with data.', ['Pharmacology', 'Lab Work', 'Data Analysis']),
    P('d3', 'Neha Verma', 'neha_v', 'Computer Science / CSE', '2nd year', 'Frontend person who likes making things look right.', ['React', 'JavaScript', 'UI/UX Design']),
    P('d4', 'Arjun Nair', 'arjun_n', 'MBA', 'Postgraduate', 'Interested in turning student ideas into real products.', ['Business Strategy', 'Marketing', 'Public Speaking']),
    P('d5', 'Simran Kaur', 'simran_k', 'Agriculture', '4th year', 'Agri student looking at how data can help farmers.', ['Agriculture', 'Data Analysis']),
    P('d6', 'Dev Patel', 'dev_p', 'Computer Science / CSE', '3rd year', 'Backend developer, new to hackathons.', ['Java', 'Spring Boot', 'SQL'])
  ];
  const T = (authorId, title, hasIdea, ideaText, teamSize, skills, desc, days) => ({ id: uid(), tab: 'hackathon', authorId, title, link: '', hasIdea, ideaText, teamSize, skills, desc, deadline: dayStr(days), status: 'open', createdAt: Date.now() - days * 3e5 });
  const posts = [
    T('d1', 'Smart India Hackathon', true, 'A symptom-tracking app for rural clinics', 3, ['Java', 'Spring Boot', 'React'], 'I have the medical side covered. Looking for developers who like building things real clinics can use.', 6),
    T('d2', 'Campus Innovation Sprint', false, '', 2, ['Python', 'Machine Learning', 'Data Analysis'], 'Pharma student who likes data. No idea yet, happy to find one together.', 9),
    T('d4', 'Campus Innovation Sprint', true, 'A marketplace that connects students with local startups for internships', 2, ['UI/UX Design', 'React'], 'I can handle the business side. Need people who can design and build the first version.', 3),
    T('d5', 'AgriTech Hack Weekend', false, '', 3, ['Python', 'SQL', 'Data Analysis'], 'Looking for people from any department who want to try something with farm data.', 12),
    T('d6', 'Smart India Hackathon', true, 'A patient records tool with a clean backend', 1, ['Clinical Knowledge', 'Research Writing'], 'Backend is covered. I need someone from the medical side to guide the problem.', 5)
  ];
  return { people, posts, requests: [], notes: [], chats: [] };
}
let data = (() => { try { const d = JSON.parse(localStorage.getItem(DATA_KEY)); if (d && d.posts) return d; } catch { } const d = seed(); localStorage.setItem(DATA_KEY, JSON.stringify(d)); return d; })();
const save = () => localStorage.setItem(DATA_KEY, JSON.stringify(data));
const isDemo = id => !String(id).includes('@');
const person = id => id === me.id ? me : users()[id] ? { id, ...users()[id].profile } : data.people.find(p => p.id === id) || { id, name: 'Someone', username: '', skills: [], links: {} };
const getPost = id => data.posts.find(p => p.id === id);
const getReq = id => data.requests.find(r => r.id === id);
const reqsFor = pid => data.requests.filter(r => r.postId === pid).sort((a, b) => a.createdAt - b.createdAt);
const myReq = pid => data.requests.find(r => r.postId === pid && r.fromId === me.id);
const key = t => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const initials = n => (n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || '?').toUpperCase();
const avatar = (p, cls = '') => `<span class="avatar ${cls}">${p.pfp ? `<img src="${esc(p.pfp)}" alt="">` : esc(initials(p.name))}</span>`;
const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
const toastEl = $('#toast'); let toastT;
const toast = m => { toastEl.textContent = m; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => toastEl.hidden = true, 2600); };
const note = (userId, text, view) => data.notes.push({ id: uid(), userId, text, view, ts: Date.now(), read: false });

/* ---------- post rules ---------- */
const endOf = p => new Date(p.deadline + 'T23:59:59');
const dayDiff = p => Math.round((new Date(p.deadline + 'T00:00:00') - new Date(new Date().setHours(0, 0, 0, 0))) / 864e5);
const dl = p => p.status === 'expired' ? 'Deadline passed' : p.status === 'closed' ? 'Closed by owner' : dayDiff(p) <= 0 ? 'Closes today' : dayDiff(p) === 1 ? 'Closes tomorrow' : `Closes in ${dayDiff(p)} days`;
function endPost(p, why) {          // used for both expiry and closing early, so nobody is ghosted
  p.status = why;
  reqsFor(p.id).filter(r => r.status === 'pending').forEach(r => {
    r.status = 'expired'; r.sys = why === 'expired' ? 'The post passed its deadline.' : 'The owner closed the post.';
    note(r.fromId, `Your request for "${p.title}" expired. ${r.sys}`, 'requests');
  });
  if (why === 'expired') note(p.authorId, `Your post "${p.title}" passed its deadline.`, 'requests');
}
function sweep() { let ch = false; data.posts.forEach(p => { if (p.status === 'open' && endOf(p) < new Date()) { endPost(p, 'expired'); ch = true; } }); if (ch) save(); return ch; }
function inTeam(userId, hack, exceptPost) {   // one team per hackathon
  const k = key(hack);
  return data.requests.some(r => { const p = getPost(r.postId); return p && p.id !== exceptPost && key(p.title) === k && r.status === 'accepted' && r.fromId === userId; })
    || data.posts.some(p => p.id !== exceptPost && p.authorId === userId && key(p.title) === k && reqsFor(p.id).some(r => r.status === 'accepted'));
}
function acceptReq(r) {
  const p = getPost(r.postId);
  if (inTeam(r.fromId, p.title, p.id)) return false;
  r.status = 'accepted';
  let ch = data.chats.find(c => c.postId === p.id);
  if (!ch) { ch = { id: uid(), postId: p.id, name: p.title + ' team', ownerId: p.authorId, members: [p.authorId], closed: false, messages: [] }; data.chats.push(ch); }
  ch.closed = false;
  if (!ch.members.includes(r.fromId)) ch.members.push(r.fromId);
  ch.messages.push({ sys: true, text: `${person(r.fromId).name} joined the team chat.`, ts: Date.now() });
  note(r.fromId, `${person(p.authorId).name} accepted your request for "${p.title}". A team chat is open.`, 'messages');
  return true;
}

/* ---------- state + shell ---------- */
const state = { view: 'home', idea: 'any', skills: new Set(), showClosed: false, reqTab: 'received', open: new Set(), chatId: null };
const myNotes = () => data.notes.filter(n => n.userId === me.id).sort((a, b) => b.ts - a.ts);
const pendingIn = () => data.requests.filter(r => r.status === 'pending' && getPost(r.postId)?.authorId === me.id);
const myChats = () => data.chats.filter(c => c.members.includes(me.id));

function nav(v) { state.view = v; $('#sidebar').classList.remove('open'); $('#notifPanel').hidden = true; render(); scrollTo(0, 0); }
function render() {
  const pend = pendingIn().length, unread = myNotes().filter(n => !n.read).length;
  const item = (v, icon, label, extra = '') => `<button class="nav-item ${state.view === v ? 'on' : ''}" data-act="go" data-id="${v}"><i class="ti ${icon}"></i>${label}${extra}</button>`;
  $('#sideNav').innerHTML = item('home', 'ti-home', 'Home') + '<p class="nav-label">Explore</p>' +
    TABS.map(t => item(t[0], t[2], t[1], t[3] ? '<span class="tag">soon</span>' : '')).join('') + '<p class="nav-label">Yours</p>' +
    item('requests', 'ti-inbox', 'My Requests', pend ? `<span class="count">${pend}</span>` : '') +
    item('messages', 'ti-messages', 'Messages') + item('profile', 'ti-user-circle', 'My Profile');
  const titles = { home: 'Home', requests: 'My Requests', messages: 'Messages', profile: 'My Profile' };
  $('#pageTitle').textContent = titles[state.view] || TABS.find(t => t[0] === state.view)[1];
  $('#bellCount').hidden = !unread; $('#bellCount').textContent = unread;
  $('#meAvatar').innerHTML = avatar(me, 'sm'); $('#meName').textContent = first;
  const v = $('#view'); v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
  v.innerHTML = ({ home: homeHTML, hackathon: hackHTML, requests: requestsHTML, messages: messagesHTML, profile: profileHTML }[state.view] || soonHTML)();
  const m = $('.msgs'); if (m) m.scrollTop = m.scrollHeight;
}
const empty = (h, p, btn, act, id = '') => `<div class="empty"><h3>${h}</h3><p>${p}</p>${btn ? `<button class="btn btn-fill" data-act="${act}" data-id="${id}">${btn}</button>` : ''}</div>`;
const statusPill = p => `<span class="pill ${POST_STATUS[p.status][1]}">${POST_STATUS[p.status][0]}</span>`;
const reqPill = r => { const s = STATUS[r.status]; return `<span class="pill ${s[1]}"><i class="ti ${s[2]}"></i>${s[0]}</span>`; };
const skillChips = (list, against = []) => `<div class="skills">${list.map(s => `<span class="sk ${against.map(x => x.toLowerCase()).includes(s.toLowerCase()) ? 'match' : ''}">${esc(s)}</span>`).join('')}</div>`;

/* ---------- views ---------- */
function homeHTML() {
  const h = new Date().getHours(), greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const mine = data.posts.filter(p => p.authorId === me.id && p.status === 'open').length, pend = pendingIn(), sent = data.requests.filter(r => r.fromId === me.id && r.status === 'pending').length;
  const mySk = me.skills.map(s => s.toLowerCase()), score = p => p.skills.filter(s => mySk.includes(s.toLowerCase())).length;
  const picks = data.posts.filter(p => p.status === 'open' && p.authorId !== me.id && !myReq(p.id)).sort((a, b) => score(b) - score(a)).slice(0, 2);
  const stat = (n, label, v) => `<button class="stat" data-act="go" data-id="${v}"><b>${n}</b>${label}</button>`;
  return `<div class="page-head"><div><h2>${greet}, ${esc(first)}.</h2><p class="sub">Here's what's happening around you today.</p></div><button class="btn btn-fill" data-act="newPost"><i class="ti ti-plus"></i> Post a team</button></div>
  <div class="stats">${stat(mine, 'open posts of yours', 'requests')}${stat(pend.length, 'requests to review', 'requests')}${stat(sent, 'requests you sent, waiting', 'requests')}${stat(myChats().filter(c => !c.closed).length, 'active team chats', 'messages')}</div>
  <h3 class="sec">Waiting on you</h3>
  ${pend.length ? pend.slice(0, 4).map(r => `<div class="attn">${avatar(person(r.fromId), 'sm')}<p><b>${esc(person(r.fromId).name)}</b> wants to join your <b>${esc(getPost(r.postId).title)}</b> team.</p><button class="btn btn-line small" data-act="review" data-id="${r.id}">Review</button></div>`).join('') : '<p class="muted">Nothing is waiting on you right now.</p>'}
  <h3 class="sec">Open hackathon posts for you</h3>
  ${picks.length ? `<div class="feed">${picks.map(postCard).join('')}</div>` : '<p class="muted">No open posts right now. Be the first to post one.</p>'}
  <h3 class="sec">Explore</h3>
  <div class="tiles">${TABS.map(t => `<button class="tile" data-act="go" data-id="${t[0]}"><i class="ti ${t[2]}"></i><b>${t[1]}</b>${t[3] ? '<span class="pill">soon</span>' : '<span class="pill fill">live</span>'}</button>`).join('')}</div>`;
}
function soonHTML() {
  const t = TABS.find(x => x[0] === state.view);
  return `<div class="empty"><h3><i class="ti ${t[2]}"></i> ${t[1]}</h3><p>${t[3]}</p><span class="pill soft">Coming soon</span><p style="margin-top:18px">Hackathon team-finding ships first. This one comes next.</p><button class="btn btn-fill" data-act="go" data-id="hackathon">Go to Hackathons</button></div>`;
}
function postCard(p) {
  const a = person(p.authorId), mine = p.authorId === me.id, r = myReq(p.id), open = p.status === 'open';
  let act;
  if (mine) act = `<button class="btn btn-line small" data-act="go" data-id="requests">Manage requests</button>`;
  else if (r && r.status === 'accepted') act = `<button class="btn btn-fill small" data-act="openChat" data-id="${p.id}">Open team chat</button>`;
  else if (r && r.status === 'pending') act = `<span class="pill soft">Requested</span><button class="link" data-act="withdraw" data-id="${r.id}">Withdraw</button>`;
  else if (r) act = `${reqPill(r)}`;
  else if (!open) act = `<button class="btn small" disabled>${POST_STATUS[p.status][0]}</button>`;
  else act = `<button class="btn btn-fill small" data-act="reqModal" data-id="${p.id}">Send request</button>`;
  return `<article class="post" id="post-${p.id}"><div class="post-top"><button class="link" data-act="profile" data-id="${a.id}" aria-label="View profile">${avatar(a)}</button>
    <div class="who"><b>${esc(a.name)}</b>${isDemo(a.id) ? ' <i>(demo)</i>' : ''}<small>${esc(a.department)} · ${esc(a.year)}</small></div>${statusPill(p)}</div>
    <h3>${esc(p.title)}${p.link ? ` <a href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Hackathon link"><i class="ti ti-external-link"></i></a>` : ''}</h3>
    <div class="meta"><span class="pill">${p.hasIdea ? 'Has an idea' : 'Looking for an idea'}</span><span>Needs ${p.teamSize} more</span><span><i class="ti ti-clock"></i> ${dl(p)}</span></div>
    ${p.hasIdea && p.ideaText ? `<p class="idea"><b>Idea:</b> ${esc(p.ideaText)}</p>` : ''}
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}${skillChips(p.skills, me.skills)}
    <div class="row-btns">${act}<button class="link" data-act="share" data-id="${p.id}"><i class="ti ti-share-3"></i> Share</button></div></article>`;
}
function hackHTML() {
  let list = data.posts.filter(p => p.tab === 'hackathon' && (state.showClosed || p.status === 'open'));
  const all = [...new Set(list.flatMap(p => p.skills))].sort();
  if (state.idea !== 'any') list = list.filter(p => p.hasIdea === (state.idea === 'has'));
  if (state.skills.size) list = list.filter(p => p.skills.some(s => state.skills.has(s)));
  list.sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || b.createdAt - a.createdAt);
  return `<div class="page-head"><div><h2>Hackathon teams</h2><p class="sub">Find people to build with, or post the team you're putting together.</p></div><button class="btn btn-fill" data-act="newPost"><i class="ti ti-plus"></i> Post a team</button></div>
  <div class="filters"><select data-filter="idea" aria-label="Idea filter"><option value="any">Any idea status</option><option value="has" ${state.idea === 'has' ? 'selected' : ''}>Has an idea</option><option value="none" ${state.idea === 'none' ? 'selected' : ''}>Looking for an idea</option></select>
  <label><input type="checkbox" data-filter="closed" style="width:auto" ${state.showClosed ? 'checked' : ''}> Show closed and expired</label>
  <div class="filter-chips">${all.map(s => `<button class="fchip ${state.skills.has(s) ? 'on' : ''}" data-act="fskill" data-id="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
  ${list.length ? `<div class="feed">${list.map(postCard).join('')}</div>` : empty('No posts match', 'Try clearing a filter, or post a team yourself.', 'Post a team', 'newPost')}`;
}
function reqRow(r) {
  const a = person(r.fromId), p = getPost(r.postId), open = state.open.has(r.id);
  let acts = '';
  if (r.status === 'pending') acts = `<button class="btn btn-fill small" data-act="accept" data-id="${r.id}">Accept</button><button class="btn btn-line small" data-act="declineModal" data-id="${r.id}">Decline</button>`;
  else if (r.status === 'rejected' || r.status === 'expired') acts = `<button class="btn btn-line small" data-act="revive" data-id="${r.id}">Revive request</button>`;
  else acts = `<button class="btn btn-fill small" data-act="openChat" data-id="${p.id}">Open team chat</button>`;
  return `<div class="req"><button class="req-top" data-act="toggleReq" data-id="${r.id}">${avatar(a, 'sm')}<span class="who"><b>${esc(a.name)}</b><small>${esc(a.department)} · ${esc(a.year)}</small></span>${reqPill(r)}<i class="ti ti-chevron-${open ? 'up' : 'down'}"></i></button>
  ${open ? `<div class="req-body"><p><b>Their note:</b> ${r.note ? esc(r.note) : '<i>No note added.</i>'}</p>${skillChips(a.skills, p.skills)}
  ${r.status === 'rejected' ? `<p><b>You declined:</b> ${esc(r.reason)}${r.rejectNote ? ` · ${esc(r.rejectNote)}` : ''}</p>` : ''}${r.sys ? `<p class="muted">${esc(r.sys)}</p>` : ''}
  <div class="row-btns"><button class="btn btn-line small" data-act="profile" data-id="${a.id}">View profile</button>${acts}</div></div>` : ''}</div>`;
}
function requestsHTML() {
  const tabs = `<div class="tabs"><button class="${state.reqTab === 'received' ? 'on' : ''}" data-act="tabReq" data-id="received">Received</button><button class="${state.reqTab === 'sent' ? 'on' : ''}" data-act="tabReq" data-id="sent">Sent</button></div>`;
  let body;
  if (state.reqTab === 'received') {
    const mine = data.posts.filter(p => p.authorId === me.id).sort((a, b) => b.createdAt - a.createdAt);
    body = mine.length ? mine.map(p => { const rs = reqsFor(p.id), acc = rs.filter(r => r.status === 'accepted').length;
      return `<section class="block"><div class="block-head"><div><h3>${esc(p.title)}</h3><p class="meta">${statusPill(p)}<span>${dl(p)}</span><span>Needs ${p.teamSize}</span><span>${acc} accepted</span><span>${rs.length} request${rs.length === 1 ? '' : 's'}</span></p></div>
      <div class="row-btns">${p.status === 'open' ? `<button class="btn btn-line small" data-act="closePost" data-id="${p.id}">Close post</button>` : ''}<button class="link" data-act="share" data-id="${p.id}"><i class="ti ti-share-3"></i> Share</button></div></div>
      ${rs.length ? rs.map(reqRow).join('') : '<p class="muted">No requests yet.</p>'}</section>`; }).join('')
      : empty("You haven't posted a team yet", 'Post one and requests will show up here.', 'Post a team', 'newPost');
  } else {
    const sent = data.requests.filter(r => r.fromId === me.id).sort((a, b) => b.createdAt - a.createdAt);
    body = sent.length ? sent.map(r => { const p = getPost(r.postId), o = person(p.authorId);
      return `<div class="card"><div class="meta"><h3>${esc(p.title)}</h3>${reqPill(r)}</div><p>Team of <b>${esc(o.name)}</b> · ${esc(o.department)} · ${dl(p)}</p><p><b>Your note:</b> ${r.note ? esc(r.note) : '<i>none</i>'}</p>
      ${r.status === 'rejected' ? `<p><b>They said:</b> ${esc(r.reason)}${r.rejectNote ? ` · ${esc(r.rejectNote)}` : ''}</p>` : ''}${r.sys ? `<p class="muted">${esc(r.sys)}</p>` : ''}
      <div class="row-btns">${r.status === 'pending' ? `<button class="btn btn-line small" data-act="withdraw" data-id="${r.id}">Withdraw</button>` : ''}${r.status === 'accepted' ? `<button class="btn btn-fill small" data-act="openChat" data-id="${p.id}">Open team chat</button>` : ''}</div></div>`; }).join('')
      : empty("You haven't sent any requests", 'Browse hackathon posts and send one with a short note.', 'Browse hackathons', 'go', 'hackathon');
  }
  return `<div class="page-head"><div><h2>My Requests</h2><p class="sub">Review who wants to join your teams, and track the requests you've sent.</p></div></div>${tabs}${body}`;
}
function messagesHTML() {
  const chats = myChats();
  if (!chats.length) return `<div class="page-head"><h2>Messages</h2></div>${empty('No chats yet', 'A team chat opens here once a request is accepted. Never before.', 'Browse hackathons', 'go', 'hackathon')}`;
  const ch = chats.find(c => c.id === state.chatId) || chats[0]; state.chatId = ch.id;
  const names = ch.members.map(id => person(id).name).join(', '), isOwner = ch.ownerId === me.id;
  return `<div class="page-head"><h2>Messages</h2></div><div class="chat"><div class="chat-list">${chats.map(c => `<button class="chat-item ${c.id === ch.id ? 'on' : ''}" data-act="pickChat" data-id="${c.id}"><b>${esc(c.name)}</b><small>${c.closed ? 'Closed' : c.members.length + ' members'}</small></button>`).join('')}</div>
  <div class="thread"><div class="thread-head"><div><b>${esc(ch.name)}</b><br><small>${esc(names)}</small></div><div class="row-btns">${!ch.closed ? `<button class="btn btn-line small" data-act="leaveChat" data-id="${ch.id}">Leave</button>${isOwner ? `<button class="btn btn-line small" data-act="closeChat" data-id="${ch.id}">Close for everyone</button>` : ''}` : ''}</div></div>
  <div class="msgs">${ch.messages.map(m => m.sys ? `<div class="m sys">${esc(m.text)}</div>` : `<div class="m ${m.from === me.id ? 'mine' : ''}">${m.from === me.id ? '' : `<b>${esc(person(m.from).name)}</b>`}${esc(m.text)}</div>`).join('')}</div>
  ${ch.closed ? '<div class="closed-bar">This chat is closed.</div>' : `<form class="compose" data-form="message"><input name="text" placeholder="write a message" autocomplete="off" required><button class="btn btn-fill" type="submit"><i class="ti ti-send"></i></button></form>`}</div></div>`;
}
function profileBlock(p) {
  const L = p.links || {}, links = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['leetcode', 'LeetCode'], ['other', 'Link']].filter(([k]) => L[k]).map(([k, n]) => `<a href="${esc(L[k])}" target="_blank" rel="noopener">${n}</a>`).join('');
  return `<div class="pcard">${avatar(p, 'lg')}<div><h2>${esc(p.name)}</h2><p>@${esc(p.username)}${p.pronouns ? ' · ' + esc(p.pronouns) : ''}</p><p>${esc(p.department)}, ${esc(p.year)}${p.section ? ' · Section ' + esc(p.section) : ''} · ${esc(p.college)}</p>${p.bio ? `<p style="margin-top:8px">${esc(p.bio)}</p>` : ''}${skillChips(p.skills)}${links ? `<div class="links">${links}</div>` : ''}</div></div>`;
}
function profileHTML() {
  const mine = data.posts.filter(p => p.authorId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  return `<div class="page-head"><h2>My Profile</h2></div>${profileBlock(me)}<h3 class="sec">My posts</h3><h4 style="margin:-6px 0 14px"><i class="ti ti-users-group"></i> Hackathons</h4>
  ${mine.length ? `<div class="feed">${mine.map(postCard).join('')}</div>` : '<p class="muted">You have not posted anything yet.</p>'}`;
}

/* ---------- modals ---------- */
const modal = $('#modal'), sheet = $('#sheet');
const openModal = html => { sheet.innerHTML = html; modal.hidden = false; const f = sheet.querySelector('input:not([type=checkbox]):not([type=radio]),textarea'); if (f) f.focus(); };
const closeModal = () => { modal.hidden = true; sheet.innerHTML = ''; };
modal.addEventListener('mousedown', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
const cancel = '<button type="button" class="btn btn-line" data-act="closeModal">Cancel</button>';

function postModal() {
  openModal(`<h3>Post a team</h3><p class="muted">Tell people what you're building and who you need.</p><form data-form="post">
  <label class="l" for="f-title">Hackathon name</label><input id="f-title" name="title" placeholder="e.g. Smart India Hackathon" maxlength="80" required>
  <label class="l" for="f-link">Hackathon link <em>(optional)</em></label><input id="f-link" name="link" placeholder="https://...">
  <label class="l">Do you have an idea?</label><label class="radio"><input type="radio" name="hasIdea" value="yes" checked> Yes, I have an idea</label><label class="radio"><input type="radio" name="hasIdea" value="no"> Not yet, I'm looking for one</label>
  <div id="ideaBox"><label class="l" for="f-idea">Your idea in one line</label><input id="f-idea" name="ideaText" maxlength="140" placeholder="what are you planning to build?"></div>
  <div class="row2"><div><label class="l" for="f-size">People you still need</label><input id="f-size" name="teamSize" type="number" min="1" max="10" value="2" required></div><div><label class="l" for="f-date">Requests close on</label><input id="f-date" name="deadline" type="date" min="${dayStr(0)}" value="${dayStr(7)}" required></div></div>
  <label class="l">Skills you need</label><div class="chips">${PRESET_SKILLS.map(s => `<label class="chip"><input type="checkbox" name="skill" value="${esc(s)}"><span>${esc(s)}</span></label>`).join('')}</div>
  <label class="l" for="f-more">Other skills <em>(comma separated)</em></label><input id="f-more" name="more" placeholder="e.g. Figma, Arduino">
  <label class="l" for="f-desc">Anything else people should know?</label><textarea id="f-desc" name="desc" rows="3" maxlength="300"></textarea>
  <p class="err" id="formErr"></p><div class="row-btns">${cancel}<button class="btn btn-fill" type="submit">Post it</button></div></form>`);
  sheet.querySelectorAll('[name=hasIdea]').forEach(r => r.addEventListener('change', () => $('#ideaBox').hidden = $('[name=hasIdea]:checked').value === 'no'));
}

/* ---------- actions ---------- */
const ACT = {
  go: id => nav(id), menu: () => $('#sidebar').classList.toggle('open'), closeModal,
  bell() { const p = $('#notifPanel'); p.hidden = !p.hidden; if (!p.hidden) renderNotes(); },
  readAll() { myNotes().forEach(n => n.read = true); save(); renderNotes(); render(); },
  note(id) { const n = data.notes.find(x => x.id === id); n.read = true; save(); nav(n.view); },
  logout() { localStorage.removeItem(SESSION_KEY); location.href = 'login.html'; },
  newPost: postModal,
  profile: id => openModal(profileBlock(person(id)) + `<div class="row-btns"><button class="btn btn-fill" data-act="closeModal">Close</button></div>`),
  reqModal(id) {
    const p = getPost(id);
    if (inTeam(me.id, p.title)) return toast(`You're already in a team for ${p.title}.`);
    openModal(`<h3>Request to join</h3><p class="muted">${esc(p.title)} · ${esc(person(p.authorId).name)}'s team</p><form data-form="request" data-id="${id}"><label class="l" for="f-note">Add a short note <em>(optional)</em></label>
    <textarea id="f-note" name="note" rows="4" maxlength="300" placeholder="why you'd like to join, or what you can bring"></textarea><div class="row-btns">${cancel}<button class="btn btn-fill" type="submit">Send request</button></div></form>`);
  },
  withdraw(id) { data.requests = data.requests.filter(r => r.id !== id); save(); toast('Request withdrawn.'); render(); },
  share(id) { const u = location.href.split('#')[0] + '#post-' + id; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Link copied.'), () => prompt('Copy this link', u)); },
  fskill(s) { state.skills.has(s) ? state.skills.delete(s) : state.skills.add(s); render(); },
  closePost(id) { endPost(getPost(id), 'closed'); save(); toast('Post closed. Pending requesters were told.'); render(); },
  toggleReq(id) { state.open.has(id) ? state.open.delete(id) : state.open.add(id); render(); },
  review(id) { state.reqTab = 'received'; state.open.add(id); nav('requests'); },
  tabReq(id) { state.reqTab = id; render(); },
  accept(id) { const r = getReq(id); if (!acceptReq(r)) return toast(`${person(r.fromId).name} is already in a team for this hackathon.`); save(); toast('Accepted. A team chat is open.'); render(); },
  declineModal(id) {
    const r = getReq(id);
    openModal(`<h3>Decline politely</h3><p class="muted">${esc(person(r.fromId).name)} will see your reason.</p><form data-form="decline" data-id="${id}">
    <div style="margin-top:14px">${REASONS.map((x, i) => `<label class="radio"><input type="radio" name="reason" value="${esc(x)}" ${i ? '' : 'checked'}> ${esc(x)}</label>`).join('')}</div>
    <label class="l" for="f-rn">Add a note <em>(optional)</em></label><textarea id="f-rn" name="rejectNote" rows="3" maxlength="200"></textarea><div class="row-btns">${cancel}<button class="btn btn-fill" type="submit">Send decline</button></div></form>`);
  },
  revive(id) {
    const r = getReq(id), p = getPost(r.postId);
    r.status = 'pending'; delete r.sys; delete r.reason; delete r.rejectNote;
    if (p.status !== 'open') { p.status = 'open'; p.deadline = dayStr(3); toast('Request revived. The post is open again for 3 more days.'); } else toast('Request revived.');
    note(r.fromId, `${person(p.authorId).name} revived your request for "${p.title}".`, 'requests'); save(); render();
  },
  openChat(postId) { const c = data.chats.find(x => x.postId === postId); if (c) state.chatId = c.id; nav('messages'); },
  pickChat(id) { state.chatId = id; render(); },
  leaveChat(id) {
    const c = data.chats.find(x => x.id === id); c.members = c.members.filter(m => m !== me.id);
    c.messages.push({ sys: true, text: `${me.name} left the chat.`, ts: Date.now() }); if (c.members.length < 2) c.closed = true;
    save(); state.chatId = null; toast('You left the chat.'); render();
  },
  closeChat(id) { const c = data.chats.find(x => x.id === id); c.closed = true; c.messages.push({ sys: true, text: `${me.name} closed the chat.`, ts: Date.now() }); save(); render(); },
  /* demo tools */
  demoIncoming() {
    const p = data.posts.filter(x => x.authorId === me.id && x.status === 'open').sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!p) return toast('Post a team first.');
    const who = data.people.find(x => !myReqBy(p.id, x.id) && !inTeam(x.id, p.title, p.id));
    if (!who) return toast('Everyone demo has already requested this post.');
    const notes = ['I built something similar last semester and would love to help.', 'I have the skills you listed and a free weekend.', "New to hackathons but keen to learn, hope that's okay."];
    data.requests.push({ id: uid(), postId: p.id, fromId: who.id, note: notes[Math.floor(Math.random() * 3)], status: 'pending', createdAt: Date.now() });
    note(me.id, `${who.name} requested to join your ${p.title} team.`, 'requests'); save(); toast('A demo student sent you a request.'); render();
  },
  demoReplies() {
    const mine = data.requests.filter(r => r.fromId === me.id && r.status === 'pending');
    if (!mine.length) return toast('You have no pending requests.');
    mine.forEach((r, i) => { const p = getPost(r.postId);
      if (i === 0 && acceptReq(r)) return;
      r.status = 'rejected'; r.reason = REASONS[0]; r.rejectNote = 'Thanks for applying!'; note(me.id, `${person(p.authorId).name} declined your request for "${p.title}".`, 'requests'); });
    save(); toast('Owners replied to your requests.'); render();
  },
  demoSkip() { data.posts.filter(p => p.status === 'open').forEach(p => p.deadline = dayStr(-1)); sweep(); save(); toast('Deadlines passed. Open requests expired.'); render(); },
  demoReset() { if (confirm('Reset all demo posts, requests and chats?')) { localStorage.removeItem(DATA_KEY); location.reload(); } }
};
const myReqBy = (pid, uidv) => data.requests.some(r => r.postId === pid && r.fromId === uidv);

function renderNotes() {
  const ns = myNotes().slice(0, 25);
  $('#notifPanel').innerHTML = `<div class="head">Notifications<button class="link" data-act="readAll">Mark all read</button></div>` +
    (ns.length ? ns.map(n => `<button class="n ${n.read ? '' : 'new'}" data-act="note" data-id="${n.id}">${esc(n.text)}<small>${ago(n.ts)}</small></button>`).join('') : '<p class="muted" style="padding:14px">Nothing yet. We\'ll tell you when something happens.</p>');
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) { if (!e.target.closest('#notifPanel')) $('#notifPanel').hidden = true; return; }
  if (t.dataset.act !== 'bell' && !t.closest('#notifPanel')) $('#notifPanel').hidden = true;
  ACT[t.dataset.act](t.dataset.id, t);
});
document.addEventListener('change', e => {
  const f = e.target.dataset.filter; if (!f) return;
  if (f === 'idea') state.idea = e.target.value; else state.showClosed = e.target.checked; render();
});

/* ---------- forms ---------- */
const FORM = {
  post(f, d) {
    const err = m => { $('#formErr').textContent = m; };
    const title = d.get('title').trim(), hasIdea = d.get('hasIdea') === 'yes';
    const skills = [...new Set([...d.getAll('skill'), ...d.get('more').split(',').map(s => s.trim()).filter(Boolean)])];
    let link = d.get('link').trim(); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    if (link) { try { if (!new URL(link).hostname.includes('.')) throw 0; } catch { return err("That hackathon link doesn't look right."); } }
    if (!title) return err('Add the hackathon name.');
    if (!skills.length) return err('Pick at least one skill you need.');
    if (inTeam(me.id, title)) return err(`You're already in a team for ${title}.`);
    data.posts.push({ id: uid(), tab: 'hackathon', authorId: me.id, title, link, hasIdea, ideaText: hasIdea ? d.get('ideaText').trim() : '', teamSize: +d.get('teamSize'), skills, desc: d.get('desc').trim(), deadline: d.get('deadline'), status: 'open', createdAt: Date.now() });
    save(); closeModal(); toast('Your team post is live.'); state.view = 'hackathon'; render();
  },
  request(f, d) {
    const p = getPost(f.dataset.id);
    if (p.status !== 'open') { closeModal(); return toast('This post is no longer open.'); }
    if (myReq(p.id)) { closeModal(); return; }
    data.requests.push({ id: uid(), postId: p.id, fromId: me.id, note: d.get('note').trim(), status: 'pending', createdAt: Date.now() });
    note(p.authorId, `${me.name} requested to join your ${p.title} team.`, 'requests');
    save(); closeModal(); toast('Request sent. You will hear back, one way or another.'); render();
  },
  decline(f, d) {
    const r = getReq(f.dataset.id), p = getPost(r.postId);
    r.status = 'rejected'; r.reason = d.get('reason'); r.rejectNote = d.get('rejectNote').trim();
    note(r.fromId, `${me.name} declined your request for "${p.title}": ${r.reason}.`, 'requests');
    save(); closeModal(); toast('Decline sent, politely.'); render();
  },
  message(f, d) {
    const c = data.chats.find(x => x.id === state.chatId), text = d.get('text').trim(); if (!text || c.closed) return;
    c.messages.push({ from: me.id, text, ts: Date.now() }); save(); render(); $('.compose input').focus();
    const bots = c.members.filter(isDemo);
    if (!c.replied && bots.length) { c.replied = true; setTimeout(() => { c.messages.push({ from: bots[0], text: "Sounds good! Let's set up a quick call to plan this.", ts: Date.now() }); save(); if (state.view === 'messages' && state.chatId === c.id) render(); }, 1200); }
  }
};
document.addEventListener('submit', e => { const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); FORM[f.dataset.form](f, new FormData(f)); });

/* ---------- start ---------- */
sweep(); setInterval(() => { if (sweep()) render(); }, 30000);
const hash = location.hash.match(/^#post-(.+)$/);
if (hash) state.view = 'hackathon';
render();
if (hash) { const el = document.getElementById('post-' + hash[1]); if (el) { el.classList.add('flash'); el.scrollIntoView({ block: 'center' }); } }