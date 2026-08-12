const APP_CATALOG = [
  ['social', '◎', 'Social', 'Posts & community'],
  ['video', '▶', 'Video', 'Upload & watch'],
  ['music', '♫', 'Music', 'Local playback'],
  ['chat', '✦', 'Messages', 'Private chat demo'],
  ['calls', '◉', 'Calls', 'Camera-call lobby'],
  ['maps', '⌖', 'Maps', 'Places & routes'],
  ['wallet', '₹', 'Wallet', 'Personal money'],
  ['vault', '⌘', 'Vault', 'Security checklist'],
  ['mail', '✉', 'Mail', 'Inbox prototype'],
  ['calendar', '□', 'Calendar', 'Plan your time'],
  ['health', '✚', 'Health', 'Fitness & medicine'],
  ['cloud', '☁', 'Cloud', 'File preview'],
  ['weather', '☀', 'Weather', 'Live conditions'],
  ['safety', '⚑', 'Safety', 'Emergency contacts'],
  ['tasks', '✓', 'Tasks', 'Daily plan'],
  ['rides', '⌁', 'Rides', 'Trip requests'],
  ['delivery', '◒', 'Delivery', 'Food orders'],
  ['reels', '▣', 'Reels', 'Short video ideas'],
  ['live', '◌', 'Live', 'Broadcast plan'],
  ['premium', '★', 'Premium', 'Unlock features']
];

const CORE_APPS = [
  ['home', '⌂', 'Home', 'Your creative network'],
  ['store', '🛒', 'App Store', 'Browse apps'],
  ['profile', '👤', 'Profile', 'Unified ID'],
  ['creator', '★', 'Creator', 'Publishing guide']
];

const $ = q => document.querySelector(q);

let backendData = {};
let page = location.hash.slice(1) || 'home';
let leafletMap, mapMarker;
let useLocalBackend = true;

const db = {
  get: (k, d) => {
    if (useLocalBackend) return backendData[k] !== undefined ? backendData[k] : d;
    const local = localStorage.getItem('srijan_' + k);
    return local ? JSON.parse(local) : d;
  },
  set: (k, v) => {
    if (useLocalBackend) {
      backendData[k] = v;
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      }).catch(e => console.error('Error saving to backend:', e));
    } else {
      localStorage.setItem('srijan_' + k, JSON.stringify(v));
    }
  }
};

async function initApp() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      backendData = await res.json();
      useLocalBackend = true;
    } else {
      useLocalBackend = false;
    }
  } catch (e) {
    console.warn('Backend not running, falling back to localStorage.', e);
    useLocalBackend = false;
  }
  mount();
}

function escapeHTML(t) {
  const e = document.createElement('div');
  e.textContent = t;
  return e.innerHTML;
}

function getInstalledApps() {
  const installedIds = db.get('installed_apps', ['social', 'video', 'music', 'chat', 'calls', 'maps', 'wallet', 'tasks']);
  return APP_CATALOG.filter(a => installedIds.includes(a[0]));
}

function getAvailableApps() {
  const installedIds = db.get('installed_apps', ['social', 'video', 'music', 'chat', 'calls', 'maps', 'wallet', 'tasks']);
  return APP_CATALOG.filter(a => !installedIds.includes(a[0]));
}

function byId(id) {
  return [...CORE_APPS, ...APP_CATALOG].find(a => a[0] === id);
}

function renderNav() {
  const installed = getInstalledApps();
  const allNavApps = [CORE_APPS[0], ...installed, CORE_APPS[1], CORE_APPS[2], CORE_APPS[3]];
  
  const b = a => `<button class="nav-btn ${page === a[0] ? 'active' : ''}" data-go="${a[0]}"><span>${a[1]}</span><span>${a[2]}</span></button>`;
  $('#side-nav').innerHTML = allNavApps.map(b).join('');
  
  const mobileApps = [CORE_APPS[0], ...installed.slice(0, 3), CORE_APPS[1]];
  $('#mobile-nav').innerHTML = mobileApps.map(a => `<button class="${page === a[0] ? 'active' : ''}" data-go="${a[0]}"><span>${a[1]}</span>${a[2]}</button>`).join('');

  const profileInfo = db.get('profile', { name: 'Srijan Bajpai', handle: '@srijan' });
  $('#profile-widget').innerHTML = `
    <button class="profile-widget-btn ${page === 'profile' ? 'active' : ''}" data-go="profile">
      <div class="avatar">S</div>
      <div class="info">
        <b>${escapeHTML(profileInfo.name)}</b>
        <small>${escapeHTML(profileInfo.handle)}</small>
      </div>
    </button>
  `;
}

function heading(id) {
  const [, icon, title, sub] = byId(id);
  return `<div class="module-head"><span class="icon">${icon}</span><div class="grow"><h2>${title}</h2><p>${sub}</p></div><button class="back" data-go="home">Home</button></div>`;
}

function card(a) {
  return `<button class="app-card" data-go="${a[0]}"><span class="icon">${a[1]}</span><span><b>${a[2]}</b><small>${a[3]}</small></span><i>→</i></button>`;
}

function storeCard(a) {
  return `<div class="app-card store-card">
    <span class="icon">${a[1]}</span>
    <div class="grow">
      <b>${a[2]}</b>
      <small>${a[3]}</small>
    </div>
    <button class="install-btn" data-install="${a[0]}">Install</button>
  </div>`;
}

function home() {
  const installed = getInstalledApps();
  const profileInfo = db.get('profile', { name: 'Srijan Bajpai' });
  return `<section class="header">
    <div>
      <p class="eyebrow">Welcome back, ${escapeHTML(profileInfo.name)}</p>
      <h1>Your connected life.</h1>
      <p>A unified experience backed by your Python server.</p>
    </div>
    <span class="tag">Backend Active</span>
  </section>
  <div class="section-title"><h2>Installed Apps</h2><span>${installed.length} apps installed</span></div>
  <section class="grid">${installed.map(card).join('')}</section>
  <div style="margin-top: 30px; text-align: center;">
    <button class="action" data-go="store" style="padding: 14px 24px; font-size: 15px;">Browse App Store</button>
  </div>`;
}

function store() {
  const available = getAvailableApps();
  const installed = getInstalledApps();
  
  return `<article class="module">${heading('store')}
    <div class="body">
      <section class="feature store-hero">
        <p class="eyebrow" style="color:#ded4ff">Featured</p>
        <h2>Expand your universe.</h2>
        <p>Discover new tools and experiences tailored for your Srijan Connect ecosystem.</p>
      </section>
      
      <div class="section-title"><h2>Available to Install</h2></div>
      <div class="grid">
        ${available.length ? available.map(storeCard).join('') : `<div class="empty" style="grid-column: 1 / -1;">You have installed all available apps!</div>`}
      </div>

      <div class="section-title" style="margin-top: 40px;"><h2>Installed Apps</h2></div>
      <div class="list">
        ${installed.map(a => `
          <div class="item">
            <span class="icon">${a[1]}</span>
            <div class="grow"><b>${a[2]}</b><small>${a[3]}</small></div>
            <button class="delete" data-uninstall="${a[0]}">Uninstall</button>
          </div>
        `).join('')}
      </div>
    </div>
  </article>`;
}

function premium() {
  const isPremium = db.get('is_premium', false);
  return `<article class="module">${heading('premium')}
    <div class="body" style="text-align:center; padding: 40px 20px;">
      <div style="color:#f97316; margin-bottom: 20px; font-size: 64px;">★</div>
      <h2>Creator Premium</h2>
      <p style="color:var(--text-muted); margin-bottom: 20px;">Unlock the ultimate autonomous content generation features.</p>
      ${isPremium 
        ? `<div style="padding: 20px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 8px; color: var(--success); margin: 0 auto; max-width: 400px;">
            <strong>★ Active Subscription</strong><br>Thank you for subscribing to Creator Premium!
           </div>`
        : `<div style="background: var(--surface-light); padding: 20px; border-radius: 8px; max-width: 400px; margin: 0 auto;">
            <h3 style="font-size: 24px; margin-bottom: 5px;">₹100<span style="font-size: 14px; color: var(--text-muted);">/month</span></h3>
            <ul style="text-align:left; color:var(--text-muted); line-height:1.6; margin: 20px 0;">
              <li>✓ Unlimited AI Video Generation</li>
              <li>✓ 1080p Master Downloads</li>
              <li>✓ Monetization Tools</li>
              <li>✓ Priority Support</li>
            </ul>
            <button class="action" id="btn-subscribe" style="width:100%">Subscribe Now</button>
           </div>
           <p style="font-size:12px; color:var(--text-muted); margin-top: 15px;">Powered by Razorpay (Test Mode)</p>
           <div id="payment-status" style="margin-top: 20px; font-weight: bold;"></div>`
      }
    </div>
  </article>`;
}

function profile() {
  const p = db.get('profile', { name: 'Srijan Bajpai', handle: '@srijan', email: 'srijan@example.com' });
  return `<article class="module">${heading('profile')}
    <div class="body">
      <div class="profile-hero">
        <div class="avatar large">S</div>
        <h2>${escapeHTML(p.name)}</h2>
        <p>${escapeHTML(p.handle)}</p>
        <span class="tag" style="margin-top:10px; display:inline-block;">Backend Active</span>
      </div>
      <form class="post-box" data-form="profile" style="margin-top: 20px;">
        <div class="form-row"><input class="input" name="name" value="${escapeHTML(p.name)}" placeholder="Full Name" required></div>
        <div class="form-row"><input class="input" name="handle" value="${escapeHTML(p.handle)}" placeholder="Username" required></div>
        <div class="form-row"><input class="input" name="email" value="${escapeHTML(p.email)}" type="email" placeholder="Email Address" required></div>
        <div class="post-actions">
          <small>Changes sync securely to the backend.</small>
          <button class="action">Save Profile</button>
        </div>
      </form>
    </div>
  </article>`;
}

function social() {
  const p = db.get('posts', []);
  return `<article class="module">${heading('social')}
    <div class="body">
      <form class="post-box" data-form="post">
        <textarea name="body" rows="3" maxlength="500" placeholder="Share something with your community…" required></textarea>
        <div class="post-actions"><small>Saved persistently to your backend.</small><button class="action">Publish</button></div>
      </form>
      <div style="margin-top:17px">
        ${p.length ? p.slice().reverse().map((x) => {
          let mediaHtml = '';
          if (x.type === 'video' && x.media) {
            if (x.media.endsWith('.gif')) {
              mediaHtml = `<img src="${x.media}" style="width: 100%; border-radius: 8px; margin-top: 10px;">`;
            } else {
              mediaHtml = `<video src="${x.media}" controls style="width: 100%; border-radius: 8px; margin-top: 10px;"></video>`;
            }
          }
          
          let publishHtml = '';
          if (x.type === 'video' && x.id) {
            const pubs = x.published_platforms || [];
            if (pubs.length > 0) {
              const badges = pubs.map(plat => `<span style="background:var(--surface); padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px; border: 1px solid var(--border);">✅ ${plat.toUpperCase()}</span>`).join('');
              publishHtml = `<div style="margin-top: 10px;">${badges}</div>`;
            } else {
              publishHtml = `<div style="margin-top: 10px;"><button class="action publish-btn" data-videoid="${x.id}" style="width:100%; background: var(--accent); color: white;">🚀 Publish Everywhere</button></div>`;
            }
          }
          
          return `<article class="post">
            <header><span class="avatar">S</span><span><b>Srijan</b><small>${x.type === 'video' ? 'Autonomous Story Brain' : 'Backend post'}</small></span></header>
            <p>${escapeHTML(x.body || x.text || '')}</p>
            ${mediaHtml}
            ${publishHtml}
          </article>`;
        }).join('') : `<div class="empty">Your community feed is waiting for its first post.</div>`}
      </div>
    </div>
  </article>`;
}

function video() {
  const posts = db.get('posts', []).filter(p => p.type === 'video');
  const savedUrl = db.get('video_upload', '');
  return `<article class="module">${heading('video')}<div class="body">
    <p class="notice"><b>Videos Hub.</b> View your uploaded and generated videos here.</p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
      ${posts.length ? posts.map(p => `
        <div class="video-card">
          ${p.media.endsWith('.gif') ? `<img src="${p.media}" style="width: 100%; height: 120px; object-fit: cover;">` : `<video src="${p.media}" style="width: 100%; height: 120px; object-fit: cover;" controls preload="metadata"></video>`}
          <div style="padding: 10px;">
            <p style="font-size: 12px; margin-bottom: 5px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(p.text)}</p>
            <p style="font-size: 10px; color: var(--muted);">${p.published_platforms ? '✅ Published' : '⏳ Draft'}</p>
          </div>
        </div>
      `).join('') : '<p class="empty" style="grid-column: 1 / -1;">No videos generated yet.</p>'}
    </div>

    <hr style="border:0; border-top: 1px solid var(--border); margin: 30px 0;">
    
    <div class="upload-zone"><span style="font-size:30px">▶</span><b>Upload a video</b><small>MP4, WebM, or MOV</small><input id="video-file" type="file" accept="video/*"></div><div id="video-preview">${savedUrl ? `<video class="media-preview" controls src="${savedUrl}"></video>` : ''}</div>
  </div></article>`;
}

function music() {
  const savedUrl = db.get('music_upload', '');
  const savedName = db.get('music_name', '');
  return `<article class="module">${heading('music')}<div class="body"><div class="split"><div class="music-card"><div class="album">♫</div><h3>Your listening room</h3><p>Upload an audio file to save it permanently.</p><input id="audio-file" type="file" accept="audio/*" style="margin-top:17px;max-width:100%"><div id="audio-player">${savedUrl ? `<div style="margin-top:14px;font-size:12px">${escapeHTML(savedName)}</div><audio controls src="${savedUrl}" style="margin-top:7px"></audio>` : ''}</div></div><div><p class="eyebrow">Production path</p><h3>Music app essentials</h3><p style="color:var(--muted);line-height:1.6">Licensing, artist rights, upload storage, encoding, search, playlists, analytics, subscriptions, and royalty reporting are needed before public launch.</p></div></div></div></article>`;
}

function chat() {
  const messages = db.get('messages', []);
  return `<article class="module">${heading('chat')}<div class="body"><p class="notice">Backend chat prototype. Messages are now stored permanently.</p><div class="chat">${messages.length ? messages.map(m => `<div class="bubble ${m.mine ? 'mine' : ''}">${escapeHTML(m.text)}</div>`).join('') : `<div class="empty">Start a conversation below.</div>`}</div><form class="form-row" data-form="message" style="margin:14px 0 0"><input class="input" name="text" maxlength="500" placeholder="Write a message" required><button class="action">Send</button></form></div></article>`;
}

function calls() {
  return `<article class="module">${heading('calls')}<div class="body"><p class="notice">Call lobby demo only. Camera access stays on this device.</p><div class="call-stage" id="call-stage"><div><div class="caller">S</div><h3>Srijan Connect Call</h3><p>Ready to preview your camera</p></div></div><div style="margin-top:14px;text-align:center"><button id="camera-button" class="action">Preview camera</button></div></div></article>`;
}

function reels() {
  const posts = db.get('posts', []).filter(p => p.type === 'video');
  return `<article class="module" style="height: 100%; padding: 0; overflow: hidden;">${heading('reels')}
    <div class="body" style="padding: 0; display: flex; flex-direction: column; align-items: center; background: #000; overflow-y: scroll; height: calc(100vh - 120px); scroll-snap-type: y mandatory;">
      ${posts.length ? posts.map(p => `
        <div class="reel-card">
          ${p.media.endsWith('.gif') ? `<img src="${p.media}" style="width: 100%; max-height: 100%; object-fit: contain;">` : `<video src="${p.media}" style="width: 100%; max-height: 100%; object-fit: contain;" controls preload="metadata"></video>`}
          <div class="reel-info">
            <h4 style="margin: 0; font-size: 14px;">@srijan_creator</h4>
            <p style="margin: 5px 0 0 0; font-size: 13px;">${escapeHTML(p.text)}</p>
          </div>
          <div style="position: absolute; bottom: 20px; right: 10px; display: flex; flex-direction: column; gap: 15px; color: white; text-align: center;">
            <div style="cursor: pointer;"><span style="font-size: 24px;">❤️</span><br><small>12k</small></div>
            <div style="cursor: pointer;"><span style="font-size: 24px;">💬</span><br><small>48</small></div>
            <div style="cursor: pointer;"><span style="font-size: 24px;">↪️</span><br><small>Share</small></div>
          </div>
        </div>
      `).join('') : '<div style="color: white; margin-top: 50px;">No Reels available. Generate one in Creator Studio!</div>'}
    </div>
  </article>`;
}

function live() {
  return `<article class="module">${heading('live')}<div class="body"><p class="notice">No stream is started by this prototype.</p><div class="call-stage"><div><div class="caller">◌</div><h3>Live studio</h3><p>Connect a verified streaming service before broadcasting.</p></div></div></div></article>`;
}

function creator() {
  return `<article class="module">${heading('creator')}
    <div class="body" style="padding: 20px;">
      <h3 style="margin-bottom:10px;">🤖 Autonomous Video Engine</h3>
      <p style="color:var(--muted); margin-bottom:20px; line-height: 1.5;">
        Generate videos completely autonomously using the Story Brain. Enter a script or a topic, and the engine will synthesize the content and automatically push it to your feed.
      </p>
      <h3 style="margin-bottom:10px;">🔗 Connect Platforms</h3>
      <div style="display:flex; gap: 10px; margin-bottom: 20px;">
        <button id="btn-connect-youtube" style="flex:1; padding: 10px; background: #FF0000; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Connect YouTube</button>
        <button id="btn-connect-instagram" style="flex:1; padding: 10px; background: #C13584; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Connect Instagram</button>
      </div>
      
      <div style="background: var(--bg); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
        <label for="ai-script" style="display:block; margin-bottom:8px; font-weight:bold; font-size:14px;">Script / Topic</label>
        <textarea id="ai-script" placeholder="E.g. The history of ancient Rome..." style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); margin-bottom:15px; font-family:inherit; resize:vertical;"></textarea>
        
        <button id="btn-generate-video" style="width:100%; padding: 12px; background: var(--accent); color: white !important; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center;">
          ✨ Generate Video
        </button>
        <p id="gen-status" style="margin-top: 10px; font-size: 13px; color: var(--muted); text-align: center; display:none;"></p>
        
        <div id="generated-video-container" style="margin-top: 20px; display:none; min-height: 200px; width: 100%;"></div>
      </div>
    </div>
  </article>`;
}

function maps() {
  return `<article class="module">${heading('maps')}<div class="body"><form class="form-row" data-form="map"><input class="input" name="place" placeholder="Search a place or address" required><button class="action">Search Map</button></form><div id="map-container" style="height:400px; margin-top:20px; border-radius:12px; z-index:1; background:#2c2c3e;"></div><div id="map-result" style="margin-top:14px"></div></div></article>`;
}

function wallet() {
  const items = db.get('wallet', []);
  const total = items.reduce((s, x) => s + Number(x.amount), 0);
  return `<article class="module">${heading('wallet')}<div class="body"><div class="item"><span class="icon">₹</span><div><b>Personal spending logged</b><small>Stored permanently in backend</small></div><span class="amount">₹${total.toLocaleString('en-IN')}</span></div><form class="form-row" data-form="wallet" style="margin-top:14px"><input class="input" name="title" placeholder="Expense name" required><input class="input" name="amount" type="number" min="1" inputmode="decimal" placeholder="₹ Amount" required><button class="action">Add</button></form><div class="list">${items.length ? items.slice().reverse().map(x => `<div class="item"><span class="icon">₹</span><div class="grow"><b>${escapeHTML(x.title)}</b><small>Personal expense</small></div><b>₹${Number(x.amount).toLocaleString('en-IN')}</b></div>`).join('') : `<div class="empty">Log personal spending.</div>`}</div></div></article>`;
}

function vault() {
  return `<article class="module">${heading('vault')}<div class="body"><p class="notice"><b>Never enter passwords here.</b> Use a dedicated audited password manager.</p></div></article>`;
}

function mail() {
  const drafts = db.get('drafts', []);
  return `<article class="module">${heading('mail')}<div class="body"><form class="post-box" data-form="draft"><input class="input" name="subject" placeholder="Subject" required><textarea name="body" rows="3" placeholder="Write a draft…" required style="margin-top:9px"></textarea><div class="post-actions"><small>Saved to backend.</small><button class="action">Save draft</button></div></form><div class="list" style="margin-top:14px">${drafts.length ? drafts.slice().reverse().map(d => `<div class="item"><span class="icon">✉</span><div><b>${escapeHTML(d.subject)}</b><small>${escapeHTML(d.body).slice(0, 60)}</small></div></div>`).join('') : `<div class="empty">No drafts.</div>`}</div></div></article>`;
}

function calendar() {
  const events = db.get('events', []);
  return `<article class="module">${heading('calendar')}<div class="body"><form class="form-row" data-form="event"><input class="input" name="title" placeholder="Event name" required><input class="input" name="time" type="datetime-local" required><button class="action">Save</button></form><div class="list">${events.length ? events.slice().sort((a, b) => a.time.localeCompare(b.time)).map(e => `<div class="item"><span class="icon">□</span><div><b>${escapeHTML(e.title)}</b><small>${new Date(e.time).toLocaleString()}</small></div></div>`).join('') : `<div class="empty">Add an event to begin planning.</div>`}</div></article>`;
}

function health() {
  const activity = db.get('activity', []);
  const meds = db.get('meds', []);
  return `<article class="module">${heading('health')}<div class="body"><div class="split"><div><form class="form-row" data-form="activity"><input class="input" name="title" placeholder="Activity, e.g. 20 min walk" required><button class="action">Log</button></form><div class="list">${activity.length ? activity.slice().reverse().map(a => `<div class="item"><span class="icon">✚</span><div><b>${escapeHTML(a.title)}</b><small>Wellness entry</small></div></div>`).join('') : `<div class="empty">Log a movement or habit.</div>`}</div><div><form class="form-row" data-form="med"><input class="input" name="title" placeholder="Medicine name" required><input class="input" name="time" type="time" required><button class="action">Add</button></form><div class="list">${meds.length ? meds.map(m => `<div class="item"><span class="icon">◷</span><div><b>${escapeHTML(m.title)}</b><small>Daily at ${m.time}</small></div></div>`).join('') : `<div class="empty">No medicine plans saved.</div>`}</div></div></div></article>`;
}

function cloud() {
  const savedFiles = db.get('cloud_files', []);
  return `<article class="module">${heading('cloud')}<div class="body"><p class="notice"><b>Backend Cloud Storage Active.</b> Files uploaded here are saved persistently to your backend.</p><div class="upload-zone"><span style="font-size:30px">☁</span><b>Upload a file</b><input id="cloud-file" type="file"></div><div id="cloud-result" class="list" style="margin-top:14px">${savedFiles.map(f => `<div class="item"><span class="icon">☁</span><div><a href="${f.url}" target="_blank"><b>${escapeHTML(f.name)}</b></a><small>Saved in Backend</small></div></div>`).join('')}</div></div></article>`;
}

function weather() {
  return `<article class="module">${heading('weather')}<div class="body"><div class="feature" id="weather-result" style="margin:0"><p class="eyebrow" style="color:#ded4ff">Live conditions</p><h2>Loading weather…</h2><p>New Delhi</p></div><div style="margin-top:14px"><button id="weather-location" class="action">Use my location</button></div></div></article>`;
}

function safety() {
  const contacts = db.get('contacts', []);
  return `<article class="module">${heading('safety')}<div class="body"><form class="form-row" data-form="contact"><input class="input" name="name" placeholder="Trusted contact" required><input class="input" name="phone" inputmode="tel" placeholder="Phone" required><button class="action">Save</button></form><div class="list">${contacts.length ? contacts.map(c => `<div class="item"><span class="icon">⚑</span><div><b>${escapeHTML(c.name)}</b><small>${escapeHTML(c.phone)}</small></div></div>`).join('') : `<div class="empty">Add trusted people for quick reference.</div>`}</div></article>`;
}

function tasks() {
  const items = db.get('tasks', []);
  return `<article class="module">${heading('tasks')}<div class="body"><form class="form-row" data-form="task"><input class="input" name="title" placeholder="Add a task" required><button class="action">Add</button></form><div class="list">${items.length ? items.map((t, i) => `<div class="item"><button class="delete" data-task="${i}">${t.done ? '✓' : '○'}</button><div class="grow"><b style="${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">${escapeHTML(t.title)}</b><small>${t.done ? 'Completed' : 'For today'}</small></div></div>`).join('') : `<div class="empty">A clear day begins with one task.</div>`}</div></article>`;
}

function rides() {
  const rides = db.get('rides', []);
  return `<article class="module">${heading('rides')}<div class="body"><form class="form-row" data-form="ride"><input class="input" name="from" placeholder="Pickup" required><input class="input" name="to" placeholder="Destination" required><button class="action">Estimate</button></form><div class="list">${rides.length ? rides.slice().reverse().map(r => `<div class="item"><span class="icon">⌁</span><div class="grow"><b>${escapeHTML(r.from)} → ${escapeHTML(r.to)}</b></div><b>₹${r.price}</b></div>`).join('') : `<div class="empty">Calculate a sample trip.</div>`}</div></article>`;
}

function delivery() {
  const orders = db.get('orders', []);
  return `<article class="module">${heading('delivery')}<div class="body"><form class="form-row" data-form="order"><input class="input" name="item" placeholder="Food item" required><input class="input" name="address" placeholder="Delivery area" required><button class="action">Add order</button></form><div class="list">${orders.length ? orders.slice().reverse().map(o => `<div class="item"><span class="icon">◒</span><div class="grow"><b>${escapeHTML(o.item)}</b><small>To ${escapeHTML(o.address)}</small></div><b>Demo</b></div>`).join('') : `<div class="empty">Create a local food-order preview.</div>`}</div></article>`;
}

function mount() {
  renderNav();
  location.hash = page;
  const screens = { home, store, profile, social, video, music, chat, calls, maps, wallet, vault, mail, calendar, health, cloud, weather, safety, tasks, rides, delivery, reels, live, creator, premium };
  if (!screens[page]) {
    page = 'home';
    location.hash = page;
  }
  $('#view').innerHTML = screens[page]();
  $('#view').focus();
  bind();
  if (page === 'weather') loadLiveWeather(28.6139, 77.209, 'New Delhi');
  if (page === 'maps') initMap();
}

function initMap() {
  const container = $('#map-container');
  if (!container || !window.L) return;
  leafletMap = L.map('map-container').setView([28.6139, 77.209], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(leafletMap);
}

function bind() {
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { page = b.dataset.go; mount(); });
  
  document.querySelectorAll('[data-install]').forEach(b => b.onclick = (e) => {
    const appId = e.target.dataset.install;
    const installed = db.get('installed_apps', ['social', 'video', 'music', 'chat', 'calls', 'maps', 'wallet', 'tasks']);
    if (!installed.includes(appId)) {
      installed.push(appId);
      db.set('installed_apps', installed);
      const btn = e.target;
      btn.textContent = 'Installed!';
      btn.style.background = '#10b981';
      setTimeout(() => mount(), 600);
    }
  });

  document.querySelectorAll('[data-uninstall]').forEach(b => b.onclick = (e) => {
    const appId = e.target.dataset.uninstall;
    let installed = db.get('installed_apps', ['social', 'video', 'music', 'chat', 'calls', 'maps', 'wallet', 'tasks']);
    installed = installed.filter(id => id !== appId);
    db.set('installed_apps', installed);
    mount();
  });

  const post = $('[data-form="post"]');
  if (post) post.onsubmit = e => {
    e.preventDefault();
    const x = db.get('posts', []);
    x.push({ body: new FormData(post).get('body') });
    db.set('posts', x);
    mount();
  };

  const profileForm = $('[data-form="profile"]');
  if (profileForm) profileForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(profileForm);
    db.set('profile', { name: fd.get('name'), handle: fd.get('handle'), email: fd.get('email') });
    const btn = profileForm.querySelector('.action');
    btn.textContent = 'Saved!';
    btn.style.background = '#10b981';
    setTimeout(() => { btn.textContent = 'Save Profile'; btn.style.background = 'var(--violet)'; mount(); }, 1000);
  };

  const msg = $('[data-form="message"]');
  if (msg) msg.onsubmit = e => {
    e.preventDefault();
    const x = db.get('messages', []);
    const text = new FormData(msg).get('text');
    x.push({ text, mine: true });
    setTimeout(() => {
      x.push({ text: 'Reply from backend sync', mine: false });
      db.set('messages', x);
      mount();
    }, 260);
    db.set('messages', x);
    mount();
  };

  const video = $('#video-file');
  if (video) video.onchange = async () => {
    const f = video.files[0];
    const target = $('#video-preview');
    if (f) {
      target.innerHTML = `<p>Uploading...</p>`;
      try {
        if (!useLocalBackend) throw new Error("Local backend not available");
        const formData = new FormData();
        formData.append('file', f);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        db.set('video_upload', data.url);
        target.innerHTML = `<video class="media-preview" controls src="${data.url}"></video>`;
      } catch (err) {
        const url = URL.createObjectURL(f);
        db.set('video_upload', url);
        target.innerHTML = `<video class="media-preview" controls src="${url}"></video><p style="font-size:12px;color:#f97316;margin-top:8px">Backend unavailable: Uploaded to temporary memory (will reset on refresh).</p>`;
      }
    }
  };

  const audio = $('#audio-file');
  if (audio) audio.onchange = async () => {
    const f = audio.files[0];
    const target = $('#audio-player');
    if (f) {
      target.innerHTML = `<p>Uploading...</p>`;
      try {
        if (!useLocalBackend) throw new Error("Local backend not available");
        const formData = new FormData();
        formData.append('file', f);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        db.set('music_upload', data.url);
        db.set('music_name', f.name);
        target.innerHTML = `<div style="margin-top:14px;font-size:12px">${escapeHTML(f.name)}</div><audio controls src="${data.url}" style="margin-top:7px"></audio>`;
      } catch (err) {
        const url = URL.createObjectURL(f);
        db.set('music_upload', url);
        db.set('music_name', f.name);
        target.innerHTML = `<div style="margin-top:14px;font-size:12px">${escapeHTML(f.name)}</div><audio controls src="${url}" style="margin-top:7px"></audio><p style="font-size:12px;color:#f97316;margin-top:8px">Backend unavailable: Uploaded to temporary memory.</p>`;
      }
    }
  };

  const camera = $('#camera-button');
  if (camera) camera.onclick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      $('#call-stage').innerHTML = '<video autoplay muted playsinline></video>';
      $('#call-stage video').srcObject = stream;
      camera.textContent = 'Camera preview active';
    } catch {
      alert('Camera preview needs permission from your browser or device.');
    }
  };

  // --- Premium Integration ---
  if (page === 'premium') {
    const subBtn = $('#btn-subscribe');
    const statusDiv = $('#payment-status');
    if (subBtn) {
      subBtn.onclick = async () => {
        try {
          subBtn.disabled = true;
          subBtn.textContent = 'Initializing...';
          statusDiv.innerHTML = '';
          const res = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 100 })
          });
          const order = await res.json();
          if (order.mock) {
            statusDiv.innerHTML = '<span style="color:var(--success)">Mock Payment verified! Local mode activated.</span>';
            db.set('is_premium', true);
            setTimeout(() => mount(), 1500);
            return;
          }
          const options = {
            key: 'rzp_test_123dummykey',
            amount: order.amount,
            currency: order.currency,
            name: "Srijan Connect",
            description: "Creator Premium (1 Month)",
            order_id: order.id,
            handler: async function (response) {
              statusDiv.innerHTML = 'Verifying payment...';
              try {
                const verifyRes = await fetch('/api/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                if (verifyRes.ok) {
                  db.set('is_premium', true);
                  mount();
                } else {
                  throw new Error("Verification failed on server");
                }
              } catch (err) {
                statusDiv.innerHTML = `<span style="color:var(--danger)">${err.message}</span>`;
              }
            },
            prefill: {
              name: db.get('profile', {name: 'Guest'}).name,
              email: "test@example.com",
            },
            theme: { color: "#f97316" }
          };
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response){
            statusDiv.innerHTML = `<span style="color:var(--danger)">Payment Failed: ${response.error.description}</span>`;
          });
          rzp.open();
        } catch (err) {
          console.error(err);
          statusDiv.innerHTML = `<span style="color:var(--danger)">Error: Could not connect to payment server.</span>`;
        } finally {
          subBtn.disabled = false;
          subBtn.textContent = 'Subscribe Now';
        }
      };
    }
  }
}

window.addEventListener('hashchange', () => {
  const p = location.hash.slice(1);
  if (byId(p) && p !== page) {
    page = p;
    mount();
  }
});

$('#view').addEventListener('submit', e => {
  const form = e.target;
  const kind = form.dataset.form;
  if (!kind || ['post', 'message', 'profile'].includes(kind)) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  let key, record;
  if (kind === 'wallet') { key = 'wallet'; record = { title: d.title, amount: d.amount }; }
  if (kind === 'draft') { key = 'drafts'; record = { subject: d.subject, body: d.body }; }
  if (kind === 'event') { key = 'events'; record = { title: d.title, time: d.time }; }
  if (kind === 'activity') { key = 'activity'; record = { title: d.title }; }
  if (kind === 'med') { key = 'meds'; record = { title: d.title, time: d.time }; }
  if (kind === 'contact') { key = 'contacts'; record = { name: d.name, phone: d.phone }; }
  if (kind === 'task') { key = 'tasks'; record = { title: d.title, done: false }; }
  if (kind === 'ride') { key = 'rides'; record = { from: d.from, to: d.to, price: Math.floor(90 + Math.random() * 210) }; }
  if (kind === 'order') { key = 'orders'; record = { item: d.item, address: d.address }; }
  if (kind === 'map') {
    const place = d.place;
    const target = $('#map-result');
    target.innerHTML = `<p>Searching for "${escapeHTML(place)}"...</p>`;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          target.innerHTML = `<div class="item"><span class="icon">⌖</span><div class="grow"><b>${escapeHTML(data[0].display_name)}</b><small>Location found</small></div></div>`;
          if (leafletMap) {
            leafletMap.setView([lat, lon], 14);
            if (mapMarker) mapMarker.remove();
            mapMarker = L.marker([lat, lon]).addTo(leafletMap).bindPopup(escapeHTML(place)).openPopup();
          }
        } else {
          target.innerHTML = `<p style="color:red">Location not found.</p>`;
        }
      })
      .catch(err => {
        target.innerHTML = `<p style="color:red">Search failed: ${err.message}</p>`;
      });
    return;
  }
  if (key) {
    const list = db.get(key, []);
    list.push(record);
    db.set(key, list);
    mount();
  }
});

$('#view').addEventListener('click', e => {
  const button = e.target.closest('[data-task]');
  if (button) {
    const list = db.get('tasks', []);
    const i = +button.dataset.task;
    list[i].done = !list[i].done;
    db.set('tasks', list);
    mount();
    return;
  }
  if (e.target.id === 'weather-location') {
    navigator.geolocation?.getCurrentPosition(p => loadLiveWeather(p.coords.latitude, p.coords.longitude, 'Your location'), () => alert('Location permission was not granted.'));
  }
  
  if (e.target.id === 'btn-generate-video') {
    const script = $('#ai-script').value || "Srijan Autonomous Engine";
    const statusEl = $('#gen-status');
    statusEl.style.display = 'block';
    statusEl.innerText = "⏳ Story Brain is processing... please wait.";
    e.target.disabled = true;
    e.target.style.opacity = '0.5';

    fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    })
    .then(res => res.json())
    .then(data => {
      if (data.requires_subscription) {
        alert(data.message);
        page = 'premium';
        mount();
        return;
      }
      
      if (data.status === 'success') {
        statusEl.innerText = "✅ Video generated successfully!";
        statusEl.style.color = "green";
        e.target.innerText = "✨ Generate Another";
        
        // Show the video and publish button immediately
        const container = $('#generated-video-container');
        if (container) {
          container.style.display = 'block';
          // Use img tag since the backend now returns a .gif for maximum compatibility
          container.innerHTML = `
            <img src="${data.video_url}" style="width:100%; border-radius:8px; margin-bottom:10px; display:block !important;"></img>
            <button class="publish-btn" data-videoid="${data.video_id}" style="width:100%; padding:10px; background: #28a745; color: white !important; font-weight: bold; border-radius:8px; border:none; cursor:pointer;">🚀 Publish Everywhere</button>
          `;
        }
        
        // Refresh local state from server so feed updates
        fetch('/api/data')
          .then(r => r.json())
          .then(serverData => {
            if (serverData.posts) {
              db.set('posts', serverData.posts);
            }
          });
      } else {
        throw new Error(data.message || "Failed to generate video");
      }
    })
    .catch(err => {
      statusEl.innerText = "❌ " + err.message;
      statusEl.style.color = "red";
    })
    .finally(() => {
      e.target.disabled = false;
      e.target.style.opacity = '1';
    });
  } // <-- Added missing closing brace
  
  if (e.target.classList.contains('publish-btn')) {
    const videoId = e.target.dataset.videoid;
    e.target.disabled = true;
    e.target.innerText = "⏳ Publishing...";
    
    fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, platforms: ["youtube", "instagram"] })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        // Refresh local state from server
        fetch('/api/data')
          .then(r => r.json())
          .then(serverData => {
            if (serverData.posts) {
              db.set('posts', serverData.posts);
              mount(); // Re-render the UI to show the badges
            }
          });
      } else {
        alert("Failed to publish: " + data.message);
        e.target.disabled = false;
        e.target.innerText = "🚀 Publish Everywhere";
      }
    })
    .catch(err => {
      alert("Error contacting backend");
      e.target.disabled = false;
      e.target.innerText = "🚀 Publish Everywhere";
    });
  }
  
  if (e.target.id === 'btn-connect-youtube') {
    e.target.innerText = "YouTube Connected ✅";
    e.target.style.background = "#28a745";
    e.target.disabled = true;
  }
  if (e.target.id === 'btn-connect-instagram') {
    e.target.innerText = "Instagram Connected ✅";
    e.target.style.background = "#28a745";
    e.target.disabled = true;
  }
});

$('#view').addEventListener('change', async e => {
  if (e.target.id === 'cloud-file') {
    const f = e.target.files[0];
    const out = $('#cloud-result');
    if (f) {
      out.innerHTML = `<p>Uploading...</p>`;
      try {
        if (!useLocalBackend) throw new Error("Local backend not available");
        const formData = new FormData();
        formData.append('file', f);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        const files = db.get('cloud_files', []);
        files.push({ name: f.name, url: data.url });
        db.set('cloud_files', files);
        mount();
      } catch (err) {
        const url = URL.createObjectURL(f);
        const files = db.get('cloud_files', []);
        files.push({ name: f.name, url: url });
        db.set('cloud_files', files);
        mount();
        alert("Backend unavailable. File saved to temporary memory (will reset on refresh).");
      }
    }
  }
});

async function loadLiveWeather(lat, lon, name) {
  const target = $('#weather-result');
  if (!target) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
    const d = await r.json();
    const icon = d.current.weather_code < 2 ? '☀' : d.current.weather_code < 4 ? '⛅' : '☁';
    target.innerHTML = `<p class="eyebrow" style="color:#ded4ff">Live conditions</p><h2>${icon} ${Math.round(d.current.temperature_2m)}°</h2><p>${escapeHTML(name)} · current conditions</p>`;
  } catch {
    target.innerHTML = '<h2>Weather unavailable</h2><p>Check the connection and try again.</p>';
  }
}

// Start application
initApp();
