/* ════════════════════════════════════════
   GGBot Boy — JavaScript
   ════════════════════════════════════════ */

/* ── CONFIG (base64 encoded) ── */
var AK = atob('c2stb3ItdjEtYTNhMWUyNTE4ZjBlNjQxMzI2ZmEwYmJkYjdiMmM3OWYzZDcyNDQzN2ZjZGUwYTYwNTM5N2Y0MmEyODJmMzYyOA==');
var AM = atob('YXJjZWUtYWkvdHJpbml0eS1sYXJnZS1wcmV2aWV3OmZyZWU=');

/* ── STATE ── */
var chatId = null, chats = {}, sett = {sys:'', gh:'', lang:'bn-BD'}, busy = false;
var recog = null, listening = false, curUtt = null;

/* ════════════════════════════════════════
   MARKDOWN (marked.js + highlight.js)
   ════════════════════════════════════════ */
marked.setOptions({breaks: true, gfm: true});
var rnd = new marked.Renderer();

rnd.code = function(code, lang) {
  var l = lang || 'text';
  var v = hljs.getLanguage(l) ? l : 'plaintext';
  var h;
  try { h = hljs.highlight(code, {language: v, ignoreIllegals: true}).value; }
  catch(e) { h = xss(code); }
  var id = 'c' + Math.random().toString(36).slice(2, 9);
  return '<div class="cb">' +
    '<div class="ch">' +
      '<span class="cl">' + xss(l) + '</span>' +
      '<button class="cp" onclick="doCopy(this,\'' + id + '\')">' + iconCopy() + ' Copy</button>' +
    '</div>' +
    '<pre><code id="' + id + '" class="hljs">' + h + '</code></pre>' +
  '</div>';
};
rnd.codespan = function(c) { return '<code>' + c + '</code>'; };
marked.use({renderer: rnd});

function iconCopy() {
  return '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
    '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
}
function iconCheck() {
  return '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">' +
    '<path d="M20 6L9 17l-5-5"/></svg>';
}

/* ── Copy code ── */
function doCopy(btn, id) {
  var el = document.getElementById(id);
  if (!el) return;
  var text = el.innerText || el.textContent || '';
  var done = function() {
    btn.classList.add('ok');
    btn.innerHTML = iconCheck() + ' Copied!';
    setTimeout(function() {
      btn.classList.remove('ok');
      btn.innerHTML = iconCopy() + ' Copy';
    }, 2000);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(function() { fbCopy(text, done); });
  } else { fbCopy(text, done); }
}
function fbCopy(text, cb) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0';
  document.body.appendChild(ta);
  ta.select(); ta.setSelectionRange(0, 99999);
  try { document.execCommand('copy'); cb(); } catch(e) {}
  document.body.removeChild(ta);
}

/* ════════════════════════════════════════
   IMAGE GENERATION  (Pollinations.ai — Free)
   Usage:  image: <prompt>, <WxH>, <format>
   Example: image: cat on sofa, 512x512, png
   ════════════════════════════════════════ */
function isImgReq(txt) {
  var t = txt.toLowerCase().trim();
  return t.startsWith('image:')    ||
         t.startsWith('img:')      ||
         t.startsWith('draw:')     ||
         t.startsWith('ছবি:')       ||
         t.startsWith('picture:')  ||
         t.startsWith('generate image:');
}

function parseImgReq(txt) {
  var t = txt.trim();
  /* strip prefix */
  var pfx = ['generate image:', 'image:', 'img:', 'draw:', 'ছবি:', 'picture:'];
  for (var i = 0; i < pfx.length; i++) {
    if (t.toLowerCase().startsWith(pfx[i])) {
      t = t.slice(pfx[i].length).trim();
      break;
    }
  }
  /* defaults */
  var w = 1024, h = 1024, fmt = 'jpeg';
  /* size */
  var sm = t.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (sm) {
    w = Math.min(Math.max(parseInt(sm[1]), 64), 2048);
    h = Math.min(Math.max(parseInt(sm[2]), 64), 2048);
  }
  /* format */
  if (/\bpng\b/i.test(t))        fmt = 'png';
  else if (/\bwebp\b/i.test(t))  fmt = 'webp';
  else if (/\bjpe?g\b/i.test(t)) fmt = 'jpeg';

  /* clean prompt */
  var prompt = t
    .replace(/\d+\s*[xX×]\s*\d+/g, '')
    .replace(/\b(png|jpeg|jpg|webp)\b/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .trim();
  if (!prompt) prompt = 'beautiful scenery';

  return {prompt: prompt, w: w, h: h, fmt: fmt};
}

function genImage(bbl, opts) {
  var seed = Math.floor(Math.random() * 999999);
  var url  = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(opts.prompt) +
    '?width=' + opts.w + '&height=' + opts.h + '&seed=' + seed + '&nologo=true&enhance=true';

  /* loading state */
  bbl.innerHTML =
    '<p style="font-size:13px;color:var(--muted);margin-bottom:8px">🎨 <strong>' +
      xe(opts.prompt.slice(0, 60)) + (opts.prompt.length > 60 ? '…' : '') +
    '</strong></p>' +
    '<div class="img-loading" id="iph">' +
      '<div style="text-align:center;color:var(--muted)">' +
        '<div style="font-size:28px;margin-bottom:8px">🎨</div>' +
        '<div style="font-size:13px">Generating ' + opts.w + '×' + opts.h + ' ' + opts.fmt.toUpperCase() + '…</div>' +
      '</div>' +
    '</div>';
  scrollBot();

  var img = new Image();
  img.onload = function() {
    var ph = bbl.querySelector('#iph');
    if (!ph) return;
    ph.outerHTML =
      '<div class="img-wrap">' +
        '<img src="' + url + '" alt="' + xe(opts.prompt) + '"/>' +
        '<div class="img-acts">' +
          '<a href="' + url + '" download="ggbot-' + Date.now() + '.' + opts.fmt + '" ' +
             'target="_blank" class="img-dl">⬇ Download ' + opts.fmt.toUpperCase() + '</a>' +
        '</div>' +
        '<div class="img-info">' + opts.w + '×' + opts.h + ' · ' + opts.fmt.toUpperCase() + ' · Pollinations.ai</div>' +
      '</div>';
    if (!bbl.querySelector('.spkb')) addSpkBtn(bbl);
    scrollBot();
  };
  img.onerror = function() {
    var ph = bbl.querySelector('#iph');
    if (ph) ph.innerHTML = '<div style="color:#f87171;font-size:13px;padding:20px;text-align:center">❌ Generation failed. Try again.</div>';
  };
  img.src = url;
}

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
function init() {
  load();
  renderList();
  loadVoices();

  var tx = document.getElementById('txtin');
  tx.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    document.getElementById('send-btn').disabled = !this.value.trim() || busy;
  });
  tx.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });

  /* button bindings */
  gel('send-btn').addEventListener('click', doSend);
  gel('mic-btn').addEventListener('click', toggleMic);
  gel('menubtn').addEventListener('click', openDrawer);
  gel('closedrawer').addEventListener('click', closeDrawer);
  gel('bd').addEventListener('click', closeDrawer);
  gel('new-btn').addEventListener('click', function() { newChat(); closeDrawer(); });
  gel('s-btn').addEventListener('click', function() { openSett(); closeDrawer(); });
  gel('settbtn').addEventListener('click', openSett);
  gel('mcls').addEventListener('click', closeSett);
  gel('mbg').addEventListener('click', function(e) { if (e.target === this) closeSett(); });
  gel('savebtn').addEventListener('click', saveSett);
  gel('clearbtn').addEventListener('click', clearAll);
  gel('ghsavebtn').addEventListener('click', ghSave);
  gel('ghtestbtn').addEventListener('click', ghTest);
  gel('gh-repos-btn').addEventListener('click', function() { ghAction('repos'); });
  gel('gh-create-btn').addEventListener('click', function() { ghAction('create'); });
  gel('gh-gists-btn').addEventListener('click', function() { ghAction('gists'); });
  gel('gh-profile-btn').addEventListener('click', function() { ghAction('profile'); });
  gel('ghcls').addEventListener('click', closeGH);
  gel('ghbg').addEventListener('click', function(e) { if (e.target === this) closeGH(); });
  gel('vlang').addEventListener('change', function() { sett.lang = this.value; saveS(); });
}

/* ════════════════════════════════════════
   STORAGE
   ════════════════════════════════════════ */
function load() {
  try {
    chats = JSON.parse(localStorage.getItem('gg_c') || '{}');
    var s = JSON.parse(localStorage.getItem('gg_s') || '{}');
    if (s.sys)  sett.sys  = s.sys;
    if (s.gh)   sett.gh   = s.gh;
    if (s.lang) sett.lang = s.lang;
  } catch(e) {}
}
function saveC() { localStorage.setItem('gg_c', JSON.stringify(chats)); }
function saveS() { localStorage.setItem('gg_s', JSON.stringify(sett)); }

/* ════════════════════════════════════════
   DRAWER  (mobile only)
   ════════════════════════════════════════ */
function openDrawer() {
  gel('drawer').classList.add('open');
  gel('bd').classList.add('on');
}
function closeDrawer() {
  gel('drawer').classList.remove('open');
  gel('bd').classList.remove('on');
}

/* ════════════════════════════════════════
   SETTINGS
   ════════════════════════════════════════ */
function openSett() {
  gel('sysin').value   = sett.sys  || '';
  gel('ghtoken').value = sett.gh   || '';
  gel('vlang').value   = sett.lang || 'bn-BD';
  updateGHUI();
  gel('mbg').classList.add('on');
}
function closeSett() { gel('mbg').classList.remove('on'); }
function saveSett() {
  sett.sys  = gel('sysin').value.trim();
  sett.lang = gel('vlang').value;
  saveS(); closeSett();
}
function clearAll() {
  if (!confirm('সব কথোপকথন ও সেটিংস মুছে ফেলবে?')) return;
  localStorage.removeItem('gg_c');
  localStorage.removeItem('gg_s');
  chats = {}; sett = {sys:'', gh:'', lang:'bn-BD'};
  renderList(); newChat(); closeSett();
}

/* ════════════════════════════════════════
   GITHUB
   ════════════════════════════════════════ */
function ghSave() {
  var t = gel('ghtoken').value.trim();
  if (!t) { alert('Token দাও!'); return; }
  sett.gh = t; saveS(); updateGHUI();
  alert('✅ Token saved! এখন Test করো।');
}
async function ghTest() {
  if (!sett.gh) { alert('আগে token দাও।'); return; }
  try {
    var r = await fetch('https://api.github.com/user', {headers: ghH()});
    if (!r.ok) throw new Error('Invalid token');
    var u = await r.json();
    gel('ghstatus').textContent = '@' + u.login + ' · ' + u.public_repos + ' repos';
    gel('ghbdg').textContent = '● On';
    gel('ghbdg').className = 'sbdg bg';
    gel('ghactions').style.display = '';
    alert('✅ Connected as @' + u.login);
  } catch(e) { alert('❌ Failed: ' + e.message); }
}
function updateGHUI() {
  if (!sett.gh) {
    gel('ghstatus').textContent = 'Not connected';
    gel('ghbdg').textContent    = '● Off';
    gel('ghbdg').className      = 'sbdg br';
    gel('ghactions').style.display = 'none';
  } else {
    gel('ghactions').style.display = '';
  }
}
function ghH() {
  return {
    'Authorization': 'token ' + sett.gh,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}
async function ghAction(type) {
  if (!sett.gh) { alert('GitHub connect করো আগে!'); return; }
  gel('ghm-body').innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Loading…</div>';
  gel('ghbg').classList.add('on');
  var title = gel('ghm-title');
  var body  = gel('ghm-body');
  try {
    if (type === 'profile') {
      title.textContent = '👤 Profile';
      var u = await (await fetch('https://api.github.com/user', {headers:ghH()})).json();
      body.innerHTML =
        '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">' +
          '<img src="' + u.avatar_url + '" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--border)"/>' +
          '<div><div style="font-size:17px;font-weight:700">' + xe(u.name||u.login) + '</div>' +
          '<div style="color:var(--muted);font-size:14px">@' + xe(u.login) + '</div></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          ghStat('📁 Repos', u.public_repos) + ghStat('👥 Followers', u.followers) +
          ghStat('👣 Following', u.following) + ghStat('⭐ Gists', u.public_gists) +
        '</div>' +
        '<a href="' + u.html_url + '" target="_blank" style="display:block;margin-top:14px;padding:13px;text-align:center;background:var(--s2);border:1px solid var(--border);border-radius:12px;color:var(--text);text-decoration:none;font-weight:600">Open GitHub ↗</a>';
    }
    else if (type === 'repos') {
      title.textContent = '📁 Repositories';
      var repos = await (await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {headers:ghH()})).json();
      body.innerHTML = repos.map(function(r) {
        return '<div style="border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;background:var(--s2)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
            '<span style="font-weight:600;font-size:14px">' + xe(r.name) + '</span>' +
            '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:var(--border);color:var(--muted)">' + (r.private?'🔒':'🌐') + '</span>' +
          '</div>' +
          (r.description ? '<div style="font-size:13px;color:var(--muted);margin-bottom:6px">' + xe(r.description) + '</div>' : '') +
          '<div style="font-size:12px;color:var(--muted);display:flex;gap:10px">' +
            (r.language ? '<span>● ' + r.language + '</span>' : '') +
            '<span>⭐' + r.stargazers_count + '</span><span>🍴' + r.forks_count + '</span>' +
          '</div>' +
          '<a href="' + r.html_url + '" target="_blank" style="font-size:12px;color:#8ab4f8;display:inline-block;margin-top:6px">Open ↗</a>' +
        '</div>';
      }).join('');
    }
    else if (type === 'create') {
      title.textContent = '➕ Create Repository';
      body.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div><div style="font-size:12px;color:var(--muted);margin-bottom:5px;font-weight:600;text-transform:uppercase">Repository Name</div>' +
          '<input id="rname" type="text" placeholder="my-project" style="width:100%;background:var(--s2);border:1.5px solid var(--border);border-radius:12px;color:var(--text);padding:12px 14px;font-size:15px;outline:none;font-family:inherit"/></div>' +
          '<div><div style="font-size:12px;color:var(--muted);margin-bottom:5px;font-weight:600;text-transform:uppercase">Description</div>' +
          '<input id="rdesc" type="text" placeholder="Optional description…" style="width:100%;background:var(--s2);border:1.5px solid var(--border);border-radius:12px;color:var(--text);padding:12px 14px;font-size:15px;outline:none;font-family:inherit"/></div>' +
          '<div style="display:flex;gap:10px">' +
            '<button onclick="createRepo(false)" style="flex:1;padding:13px;background:var(--green);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">🌐 Public</button>' +
            '<button onclick="createRepo(true)"  style="flex:1;padding:13px;background:var(--s2);color:var(--text);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">🔒 Private</button>' +
          '</div></div>';
    }
    else if (type === 'gists') {
      title.textContent = '📄 Gists';
      var gs = await (await fetch('https://api.github.com/gists?per_page=15', {headers:ghH()})).json();
      if (!gs.length) { body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">No gists</div>'; return; }
      body.innerHTML = gs.map(function(g) {
        var fn = Object.keys(g.files)[0] || 'gist';
        return '<div style="border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;background:var(--s2)">' +
          '<div style="font-weight:600;font-size:14px;margin-bottom:4px">' + xe(fn) + '</div>' +
          (g.description ? '<div style="font-size:13px;color:var(--muted);margin-bottom:4px">' + xe(g.description) + '</div>' : '') +
          '<a href="' + g.html_url + '" target="_blank" style="font-size:12px;color:#8ab4f8">Open ↗</a>' +
        '</div>';
      }).join('');
    }
  } catch(e) {
    body.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171">Error: ' + xe(e.message) + '</div>';
  }
}
async function createRepo(priv) {
  var name = gel('rname').value.trim();
  if (!name) { alert('নাম দাও!'); return; }
  var desc = gel('rdesc').value.trim();
  try {
    var r = await fetch('https://api.github.com/user/repos', {
      method: 'POST', headers: ghH(),
      body: JSON.stringify({name:name, description:desc, private:priv, auto_init:true})
    });
    var d = await r.json();
    if (r.ok) { alert('✅ Repository "' + d.full_name + '" তৈরি!\n' + d.html_url); closeGH(); }
    else alert('❌ ' + (d.message || 'Error'));
  } catch(e) { alert('❌ ' + e.message); }
}
function ghStat(l, v) {
  return '<div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">' +
    '<div style="font-size:20px;font-weight:700">' + (v||0) + '</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:3px">' + l + '</div></div>';
}
function closeGH() { gel('ghbg').classList.remove('on'); }

/* ════════════════════════════════════════
   CHAT MANAGEMENT
   ════════════════════════════════════════ */
function newChat() {
  chatId = null;
  gel('msgs').innerHTML = '';
  gel('cbox').style.display = 'none';
  gel('welcome').style.display = '';
  document.querySelectorAll('.hi').forEach(function(e) { e.classList.remove('on'); });
}
function loadChat(id) {
  chatId = id;
  var c = chats[id]; if (!c) return;
  gel('welcome').style.display = 'none';
  gel('cbox').style.display = 'flex';
  var m = gel('msgs'); m.innerHTML = '';
  c.messages.forEach(function(x) { addMsg(x.role, x.content, false); });
  m.scrollTop = m.scrollHeight;
  document.querySelectorAll('.hi').forEach(function(e) { e.classList.toggle('on', e.dataset.id === id); });
}
function delChat(id) {
  delete chats[id]; saveC(); renderList();
  if (chatId === id) newChat();
}
function renderList() {
  var l   = gel('hlist');
  var em  = gel('empt');
  var ids = Object.keys(chats).sort(function(a, b) { return b - a; });
  l.innerHTML = '';
  if (!ids.length) { em.style.display = ''; return; }
  em.style.display = 'none';
  ids.forEach(function(id) {
    var c = chats[id], d = document.createElement('div');
    d.className = 'hi' + (id === chatId ? ' on' : '');
    d.dataset.id = id;
    d.innerHTML = '<span class="ht">' + xe(c.title) + '</span><button class="hx">✕</button>';
    d.addEventListener('click', function(e) {
      if (e.target.classList.contains('hx')) { delChat(id); return; }
      loadChat(id); closeDrawer();
    });
    l.appendChild(d);
  });
}

/* ════════════════════════════════════════
   SEND MESSAGE
   ════════════════════════════════════════ */
async function doSend() {
  var tx  = gel('txtin');
  var txt = tx.value.trim();
  if (!txt || busy) return;

  /* ensure chat */
  if (!chatId) {
    chatId = Date.now().toString();
    chats[chatId] = {title: txt.slice(0, 50) + (txt.length > 50 ? '…' : ''), messages: []};
    gel('welcome').style.display = 'none';
    gel('cbox').style.display = 'flex';
    renderList();
  }
  chats[chatId].messages.push({role: 'user', content: txt});
  saveC();
  tx.value = ''; tx.style.height = 'auto';
  gel('send-btn').disabled = true;
  addMsg('user', txt);
  scrollBot();

  /* ── IMAGE REQUEST ── */
  if (isImgReq(txt)) {
    var opts      = parseImgReq(txt);
    var imgBubble = mkBubble();
    genImage(imgBubble, opts);
    chats[chatId].messages.push({role:'assistant', content:'[Image: ' + opts.prompt + ']'});
    saveC();
    gel('send-btn').disabled = false;
    return;
  }

  /* ── CHAT REQUEST ── */
  var ti = document.createElement('div');
  ti.className = 'ma'; ti.id = 'typing';
  ti.innerHTML = '<div class="av">G</div><div class="bbl" style="display:flex;align-items:center;gap:5px;padding:12px 14px">' +
    '<div class="td"></div><div class="td"></div><div class="td"></div></div>';
  gel('msgs').appendChild(ti);
  scrollBot();

  busy = true;
  var aiTxt = '', bubble = null;
  try {
    var msgs = [];
    if (sett.sys) msgs.push({role: 'system', content: sett.sys});
    chats[chatId].messages.forEach(function(m) {
      msgs.push({role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content});
    });

    var res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + AK,
        'Content-Type': 'application/json',
        'HTTP-Referer': location.href,
        'X-Title': 'GGBot Boy'
      },
      body: JSON.stringify({model: AM, messages: msgs, stream: true})
    });
    if (!res.ok) {
      var ed = await res.json().catch(function() { return {}; });
      throw new Error((ed.error && ed.error.message) || 'HTTP ' + res.status);
    }

    var t = gel('typing'); if (t) t.remove();
    bubble = mkBubble();

    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
    while (true) {
      var ch = await reader.read(); if (ch.done) break;
      buf += dec.decode(ch.value, {stream: true});
      var lines = buf.split('\n'); buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i].trim();
        if (!ln.startsWith('data:')) continue;
        var dt = ln.slice(5).trim();
        if (dt === '[DONE]') break;
        try {
          var j = JSON.parse(dt);
          aiTxt += (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || '';
          bubble.innerHTML = marked.parse(aiTxt);
          scrollBot();
        } catch(pe) {}
      }
    }
  } catch(err) {
    var t2 = gel('typing'); if (t2) t2.remove();
    if (!bubble) bubble = mkBubble();
    aiTxt = '⚠️ **Error:** ' + err.message;
    bubble.innerHTML = marked.parse(aiTxt);
  }

  chats[chatId].messages.push({role:'assistant', content: aiTxt});
  saveC();
  busy = false;
  gel('send-btn').disabled = !gel('txtin').value.trim();
  if (bubble) addSpkBtn(bubble);
  scrollBot();
}

function mkBubble() {
  var d = document.createElement('div'); d.className = 'ma';
  d.innerHTML = '<div class="av">G</div><div class="bbl"></div>';
  gel('msgs').appendChild(d);
  return d.querySelector('.bbl');
}
function addMsg(role, content, anim) {
  if (anim === undefined) anim = true;
  var msgs = gel('msgs');
  var d = document.createElement('div');
  if (!anim) d.style.animation = 'none';
  if (role === 'user') {
    d.className = 'mu';
    d.innerHTML = '<div class="bbl">' + xe(content) + '</div>';
  } else {
    d.className = 'ma';
    d.innerHTML = '<div class="av">G</div><div class="bbl">' + marked.parse(content) + '</div>';
    setTimeout(function() { var b = d.querySelector('.bbl'); if (b) addSpkBtn(b); }, 50);
  }
  msgs.appendChild(d);
}
function scrollBot() { var m = gel('msgs'); m.scrollTop = m.scrollHeight; }

/* ════════════════════════════════════════
   VOICE INPUT
   ════════════════════════════════════════ */
function initRecog() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  var r = new SR();
  r.continuous = false; r.interimResults = true; r.lang = sett.lang || 'bn-BD';
  r.onstart = function() {
    listening = true;
    gel('mic-btn').classList.add('on');
    gel('vstatus').textContent = '🎤 Listening…';
  };
  r.onresult = function(e) {
    var fin = '', intr = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) fin  += e.results[i][0].transcript;
      else                      intr += e.results[i][0].transcript;
    }
    var tx = gel('txtin');
    tx.value = fin || intr;
    tx.style.height = 'auto';
    tx.style.height = Math.min(tx.scrollHeight, 140) + 'px';
    gel('send-btn').disabled = !tx.value.trim() || busy;
    if (fin) gel('vstatus').textContent = '✅ Got it!';
  };
  r.onend = function() {
    listening = false;
    gel('mic-btn').classList.remove('on');
    setTimeout(function() { gel('vstatus').textContent = ''; }, 1500);
    var v = gel('txtin').value.trim();
    if (v) setTimeout(doSend, 400);
  };
  r.onerror = function(e) {
    listening = false;
    gel('mic-btn').classList.remove('on');
    var msg = e.error === 'not-allowed' ? '❌ Mic blocked'  :
              e.error === 'no-speech'   ? '🔇 No speech'    : '❌ ' + e.error;
    gel('vstatus').textContent = msg;
    setTimeout(function() { gel('vstatus').textContent = ''; }, 2500);
  };
  return r;
}
function toggleMic() {
  if (!recog) {
    recog = initRecog();
    if (!recog) { alert('Voice not supported.\nUse Chrome or Samsung Browser.'); return; }
  }
  if (listening) { recog.stop(); }
  else {
    recog.lang = sett.lang || 'bn-BD';
    gel('txtin').value = '';
    try { recog.start(); } catch(e) { recog = null; }
  }
}

/* ════════════════════════════════════════
   VOICE OUTPUT
   ════════════════════════════════════════ */
function loadVoices() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined)
    window.speechSynthesis.onvoiceschanged = function() { window.speechSynthesis.getVoices(); };
}
function addSpkBtn(bbl) {
  var old = bbl.querySelector('.spkb'); if (old) old.remove();
  var btn = document.createElement('button');
  btn.className = 'spkb';
  btn.innerHTML = iconSpk() + ' Listen';
  btn.addEventListener('click', function() { doSpeak(bbl, btn); });
  bbl.appendChild(btn);
}
function iconSpk() { return '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'; }
function iconStp() { return '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; }

function doSpeak(bbl, btn) {
  if (curUtt) {
    window.speechSynthesis.cancel(); curUtt = null;
    document.querySelectorAll('.spkb').forEach(function(b) {
      b.classList.remove('go'); b.innerHTML = iconSpk() + ' Listen';
    });
    if (btn._playing) { btn._playing = false; return; }
  }
  var tmp = document.createElement('div'); tmp.innerHTML = bbl.innerHTML;
  var sb = tmp.querySelector('.spkb'); if (sb) sb.remove();
  var text = (tmp.innerText || tmp.textContent || '').trim();
  if (!text) return;

  var u = new SpeechSynthesisUtterance(text);
  var lang = sett.lang || 'bn-BD';
  u.lang = lang; u.rate = 0.95; u.pitch = 1;
  var voices = window.speechSynthesis.getVoices();
  var v = voices.find(function(x) { return x.lang === lang; }) ||
          voices.find(function(x) { return x.lang.startsWith(lang.split('-')[0]); }) ||
          voices.find(function(x) { return x.lang.startsWith('en'); });
  if (v) u.voice = v;

  btn._playing = true;
  btn.classList.add('go'); btn.innerHTML = iconStp() + ' Stop';
  u.onend = u.onerror = function() {
    curUtt = null; btn._playing = false;
    btn.classList.remove('go'); btn.innerHTML = iconSpk() + ' Listen';
  };
  curUtt = u; window.speechSynthesis.speak(u);
}

/* ════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════ */
function gel(id) { return document.getElementById(id); }
function xe(s)   { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function xss(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function chip(t) {
  var tx = gel('txtin');
  tx.value = t; tx.focus(); tx.dispatchEvent(new Event('input'));
}

/* ── START ── */
init();
