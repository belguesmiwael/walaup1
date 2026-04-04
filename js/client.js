/* ════════════════════════════════════════════════════════
   HIVEAPP — client.js
   Logique espace client : auth, dashboard, messages, paiement, PWA
   Dépendances : firebase-config.js (db, FS), auth.js (theme), sound.js
════════════════════════════════════════════════════════ */

/* ── Firebase Auth (db + FS viennent de firebase-config.js) ── */
const auth = firebase.auth();

/* ── Pack constants ── */
const PACK_LABELS = { essentiel:'🟢 Essentiel', pro:'🔵 Pro', partenaire:'🔴 Partenaire' };
const PACK_PRICES  = { essentiel:'500–800 DT', pro:'900–1500 DT', partenaire:'1600–2500 DT' };

/* ── Protocol check ── */
if (!['http:','https:','chrome-extension:'].includes(location.protocol)) {
  document.getElementById('protoWarn').style.display = 'flex';
}

/* ── Helpers ── */
const $ = id => document.getElementById(id);

function showView(v) {
  ['authView','dashView'].forEach(id => {
    const el = $(id); if (!el) return;
    el.style.display = 'none'; el.style.pointerEvents = 'none';
  });
  const el = $(v); if (!el) return;
  el.style.display = 'flex'; el.style.pointerEvents = 'auto';
  if (v === 'dashView') el.style.flexDirection = 'column';
}
function showMsg(m, t='err') { const el=$('msgBox'); el.textContent=m; el.className='msg '+t; }
function clearMsg() { $('msgBox').className = 'msg'; }
function setBtn(id, l, txt) {
  const b = $(id); if (!b) return;
  b.disabled = l;
  if (l) b.innerHTML = '<span class="sp"></span>' + (txt||'...');
  else if (b.dataset.orig) b.innerHTML = b.dataset.orig;
}
function saveOrig(id) { const b=$(id); if (b&&!b.dataset.orig) b.dataset.orig = b.innerHTML; }
let _toT;
function toast(m, t='suc') {
  const el = $('toast'); el.textContent = m; el.className = 'toast ' + t;
  clearTimeout(_toT); el.classList.add('on');
  _toT = setTimeout(() => el.classList.remove('on'), 3500);
}
function fmtD(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date(), diff = now - d;
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return Math.floor(diff/60000) + 'min';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h';
  return d.toLocaleDateString('fr-FR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function fmtDShort(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('fr-FR', {day:'2-digit',month:'short'});
}

/* ════════════════════════════════════════════════════════
   AUTH TABS
════════════════════════════════════════════════════════ */
function switchTab(name, btn) {
  clearMsg();
  ['pGoogle','pPhone','pEmail'].forEach(id => $(id).classList.remove('on'));
  document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('on'));
  $('p' + name[0].toUpperCase() + name.slice(1)).classList.add('on');
  btn.classList.add('on');
}

/* ── Google ── */
async function doGoogle() {
  clearMsg(); saveOrig('gBtn'); setBtn('gBtn', true, 'Connexion Google...');
  const p = new firebase.auth.GoogleAuthProvider();
  p.addScope('profile'); p.addScope('email');
  try {
    await auth.signInWithPopup(p);
  } catch(e) {
    if (e.code==='auth/popup-blocked'||e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request') {
      try { showMsg('Redirection vers Google...','ok'); await auth.signInWithRedirect(p); }
      catch(e2) { setBtn('gBtn',false); showMsg('Erreur: '+e2.message); }
    } else if (e.code==='auth/unauthorized-domain') {
      setBtn('gBtn',false); showMsg('⚠️ Domaine non autorisé — Firebase Console → Authentication → Authorized domains');
    } else if (e.code==='auth/operation-not-supported-in-this-environment') {
      setBtn('gBtn',false); showMsg('⚠️ Ouvrez le fichier sur http:// (serveur local ou déploiement)');
    } else {
      setBtn('gBtn',false); showMsg('Erreur Google: '+e.message);
    }
  }
}

/* ── Phone ── */
let confirmResult = null, rcv = null;
function initRC() {
  if (rcv) return;
  try {
    rcv = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible', callback: () => {},
      'expired-callback': () => { if(rcv){try{rcv.clear()}catch(e){}rcv=null;} }
    });
  } catch(e) {}
}
async function sendOTP() {
  clearMsg();
  const num = $('phNum').value.trim();
  if (num.length < 8) { showMsg('Numéro invalide — 8 chiffres requis'); return; }
  saveOrig('sendBtn'); setBtn('sendBtn', true, 'Envoi SMS...');
  if (rcv) { try{rcv.clear()}catch(e){} rcv = null; }
  try {
    initRC(); await rcv.render();
    confirmResult = await auth.signInWithPhoneNumber('+216' + num, rcv);
    $('phSent').textContent = '+216 ' + num;
    $('ph1').style.display = 'none'; $('ph2').style.display = 'block';
    $('o1').focus();
    showMsg('✓ SMS envoyé au +216 ' + num, 'ok');
    startTimer();
  } catch(e) {
    let m = e.message;
    if (e.code==='auth/invalid-phone-number') m='Numéro invalide. Format: 8 chiffres tunisiens.';
    if (e.code==='auth/too-many-requests') m='Trop de tentatives. Réessayez dans quelques minutes.';
    if (e.code==='auth/captcha-check-failed') m='Vérification échouée. Rechargez la page.';
    if (e.code==='auth/billing-not-enabled') m='⚠️ Le SMS nécessite le plan Blaze Firebase.';
    if (e.code==='auth/operation-not-supported-in-this-environment') m='⚠️ Hébergez le fichier sur http://.';
    showMsg('❌ ' + m);
    setBtn('sendBtn', false);
    if (rcv) { try{rcv.clear()}catch(e2){} rcv = null; }
  }
}
async function verifyOTP() {
  clearMsg();
  const code = ['o1','o2','o3','o4','o5','o6'].map(i => $(i).value).join('');
  if (code.length < 6) { showMsg('Entrez les 6 chiffres'); return; }
  if (!confirmResult) { showMsg('Session expirée.'); return; }
  saveOrig('verBtn'); setBtn('verBtn', true, 'Vérification...');
  try { await confirmResult.confirm(code); }
  catch(e) {
    let m = e.message;
    if (e.code==='auth/invalid-verification-code') m='Code incorrect.';
    if (e.code==='auth/code-expired') m='Code expiré.';
    showMsg('❌ ' + m); setBtn('verBtn', false);
  }
}
function resetPhone() { if(rcv){try{rcv.clear()}catch(e){}rcv=null;} confirmResult=null; showPh1(); clearMsg(); }
function showPh1() {
  $('ph2').style.display='none'; $('ph1').style.display='block';
  ['o1','o2','o3','o4','o5','o6'].forEach(i => { const el=$(i); el.value=''; el.classList.remove('ok'); });
}
let _rtmr;
function startTimer() {
  let s = 60; const b = $('rsBtn'); b.disabled = true;
  _rtmr = setInterval(() => {
    s--; b.textContent = s > 0 ? 'Renvoyer ('+s+'s)' : 'Renvoyer';
    if (s <= 0) { clearInterval(_rtmr); b.disabled = false; }
  }, 1000);
}
function onxt(el, nid) {
  el.value = el.value.replace(/\D/,'');
  if (el.value) { el.classList.add('ok'); if(nid) $(nid)?.focus(); autoVer(); }
  else el.classList.remove('ok');
}
function obck(e, pid) { if (e.key==='Backspace' && !e.target.value && pid) $(pid)?.focus(); }
function autoVer() {
  const c = ['o1','o2','o3','o4','o5','o6'].map(i => $(i).value).join('');
  if (c.length === 6) verifyOTP();
}

/* ── Email ── */
let emMode = 'login';
function emode(m, btn) {
  emMode = m;
  document.querySelectorAll('.etabs .etab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  $('nameF').style.display = m==='register' ? 'flex' : 'none';
  $('fgotWrap').style.display = m==='login' ? 'block' : 'none';
  $('eBtn').dataset.orig = '';
  $('eBtn').textContent = m==='login' ? 'Connexion →' : 'Créer mon compte →';
  clearMsg();
}
async function doEmail() {
  clearMsg();
  const email = $('eEmail').value.trim(), pass = $('ePass').value;
  if (!email||!pass) { showMsg('Email et mot de passe requis'); return; }
  saveOrig('eBtn'); setBtn('eBtn', true, emMode==='login' ? 'Connexion...' : 'Création...');
  try {
    if (emMode === 'register') {
      const name = $('eName').value.trim();
      const cr = await auth.createUserWithEmailAndPassword(email, pass);
      if (name) await cr.user.updateProfile({displayName: name});
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
    }
  } catch(e) {
    let m = e.message;
    if (e.code==='auth/email-already-in-use') m='Email déjà utilisé.';
    if (e.code==='auth/wrong-password'||e.code==='auth/invalid-credential') m='Email ou mot de passe incorrect.';
    if (e.code==='auth/user-not-found') m='Aucun compte. Créez-en un.';
    if (e.code==='auth/weak-password') m='Mot de passe trop court (min. 6).';
    if (e.code==='auth/invalid-email') m='Email invalide.';
    showMsg('❌ ' + m); setBtn('eBtn', false);
  }
}
async function resetEmail() {
  const email = $('eEmail').value.trim();
  if (!email) { showMsg('Entrez votre email'); return; }
  try { await auth.sendPasswordResetEmail(email); showMsg('✓ Email envoyé','ok'); }
  catch(e) { showMsg('❌ ' + e.message); }
}

/* ── Sign out ── */
function doSignOut() {
  if (_unsubLeads) _unsubLeads();
  if (_unsubMsgs) _unsubMsgs();
  auth.signOut().then(() => { showView('authView'); history.replaceState({},'',location.pathname); });
}

/* ── Redirect result (popup fallback) ── */
auth.getRedirectResult().then(r => {
  // Popup auth — no redirect handling needed for most flows
}).catch(e => {
  if (e.code && !['auth/null-user','auth/no-auth-event'].includes(e.code)) {
    if (e.code==='auth/unauthorized-domain') {
      showView('authView');
      showMsg('⚠️ Domaine non autorisé : ' + location.hostname);
    }
  }
});

/* ════════════════════════════════════════════════════════
   DASHBOARD STATE
════════════════════════════════════════════════════════ */
const SC = {
  new:               {l:'🔵 Nouvelle demande',   c:'pn',  s:1, p:10},
  contacted:         {l:'🟣 En discussion',       c:'pc',  s:2, p:35},
  demo:              {l:'🟡 Démo envoyée',        c:'pd',  s:3, p:60},
  validated:         {l:'🟢 Démo validée',        c:'pv',  s:4, p:78},
  payment_requested: {l:'⏳ Paiement en attente', c:'ppay',s:4, p:82},
  payment_confirmed: {l:'✅ Paiement confirmé',   c:'pv',  s:4, p:88},
  converted:         {l:'🎉 App livrée !',        c:'pv',  s:5, p:100},
  closed:            {l:'✅ Terminée',            c:'pv',  s:5, p:100}
};

let _curLeadId = null, _curLead = null, _curUserId = null;
let _unsubLeads = null, _unsubMsgs = null;
let _allLeads = [];

function updProg(status) {
  const cfg = SC[status] || SC.new;
  const sp = $('spill');
  if (sp) { sp.textContent = cfg.l; sp.className = 'pill ' + cfg.c; }
  const pf = $('pf'); if (pf) pf.style.width = cfg.p + '%';
  for (let i=1; i<=5; i++) {
    const el = $('ps'+i); if (!el) continue;
    el.classList.remove('done','act');
    if (i < cfg.s) el.classList.add('done');
    else if (i === cfg.s) el.classList.add('act');
  }
}
function spLabel(s) { return (SC[s]||SC.new).l; }
function spClass(s) { return 's-'+(s||'new'); }

function setDashUser(u, name) {
  $('dNm').textContent = name;
  if (u.photoURL) { $('dAv').src=u.photoURL; $('dAv').style.display='block'; }
  else { $('dAvFb').textContent=(name[0]||'?').toUpperCase(); $('dAvFb').style.display='flex'; }
  ['profAv','nlProfAv'].forEach(id => { const el=$(id); if(el&&u.photoURL){el.src=u.photoURL;el.style.display='block';} });
  ['profAvFb','nlProfAvFb'].forEach(id => { const el=$(id); if(el&&!u.photoURL){el.textContent=(name[0]||'?').toUpperCase();el.style.display='flex';} });
  ['profName','nlProfName'].forEach(id => { const el=$(id); if(el)el.textContent=u.displayName||name; });
  ['profEmail','nlProfEmail'].forEach(id => { const el=$(id); if(el)el.textContent=u.email||u.phoneNumber||''; });
}

/* ── Auth state ── */
auth.onAuthStateChanged(async u => {
  if (!u) { showView('authView'); return; }
  _curUserId = u.uid;

  // Upsert user doc
  db.collection('users').doc(u.uid).set({
    name: u.displayName||u.email||'Client', email: u.email||null,
    phone: u.phoneNumber||null, photoURL: u.photoURL||null,
    updatedAt: FS.serverTimestamp()
  }, {merge:true}).catch(() => {});

  const name = (u.displayName||u.email||u.phoneNumber||'Client').split(' ')[0];

  try {
    // Link email leads if any
    if (u.email) {
      const byEmail = await db.collection('leads').where('userEmail','==',u.email)
        .where('userId','==','').limit(5).get().catch(() => ({empty:true,docs:[]}));
      if (!byEmail.empty) {
        const batch = db.batch();
        byEmail.docs.forEach(d => { if (!d.data().userId) batch.update(d.ref, {userId:u.uid}); });
        await batch.commit().catch(() => {});
      }
    }

    // Create lead from estimateur sessionStorage
    const _pack = sessionStorage.getItem('bz_pack') || '';
    if (_pack) {
      const _prompt   = sessionStorage.getItem('bz_prompt') || '';
      const _feats    = sessionStorage.getItem('bz_features') || '';
      const _complex  = sessionStorage.getItem('bz_complexity') || '';
      const _monetize = sessionStorage.getItem('bz_monetize') || '0';
      const _domain   = sessionStorage.getItem('bz_domain') || '';
      const _price    = sessionStorage.getItem('bz_estimatedPrice') || '0';
      const _mpApp    = sessionStorage.getItem('bz_marketplace_app');
      let mpData = null;
      try { if (_mpApp) mpData = JSON.parse(_mpApp); } catch(e) {}
      const isMarketplace = !!mpData;

      const ref = await db.collection('leads').add({
        name: u.displayName||name, phone: u.phoneNumber||'',
        type: isMarketplace ? ('Marketplace — '+(mpData.name||'App')) : 'A definir',
        categories: _feats ? JSON.parse(_feats).join(', ') : '',
        description: '', userId: u.uid, userEmail: u.email||null,
        userPhone: u.phoneNumber||null, pack: _pack,
        packLabel: PACK_LABELS[_pack]||'',
        claudePrompt: _prompt,
        features: _feats ? JSON.parse(_feats) : [],
        complexity: _complex, monetize: _monetize==='1',
        domain: _domain, estimatedPrice: parseInt(_price)||0,
        source: isMarketplace ? 'marketplace' : 'estimateur',
        marketplaceApp: mpData||null, trialDone: mpData?.trialDone||false,
        status: 'new', lang: 'fr', createdAt: FS.serverTimestamp()
      });

      await db.collection('messages').add({
        leadId: ref.id, userId: u.uid, from: 'system', type: 'system',
        text: isMarketplace
          ? '🏪 Achat marketplace : '+(mpData.name||'App')+'. Notre équipe vous contactera dans les 24h.'
          : 'Demande reçue !'+(PACK_LABELS[_pack]?' Pack '+PACK_LABELS[_pack]+'.':'')+' Notre équipe vous contactera dans les 24h.',
        createdAt: FS.serverTimestamp(), readByClient: true, readByAdmin: false
      });

      if (isMarketplace) {
        await db.collection('notifications').add({
          userId: 'admin', leadId: ref.id,
          title: '🏪 Nouvel achat marketplace !',
          message: (u.displayName||u.email||'Client')+' souhaite acheter "'+(mpData.name||'App')+'". Procédez à l\'adaptation.',
          type: 'marketplace_purchase', read: false, createdAt: FS.serverTimestamp()
        });
        if (mpData.id && !mpData.id.startsWith('s')) {
          db.collection('marketplace_apps').doc(mpData.id)
            .update({purchases: firebase.firestore.FieldValue.increment(1)}).catch(() => {});
        }
      }
      ['bz_pack','bz_prompt','bz_features','bz_complexity','bz_monetize','bz_domain','bz_estimatedPrice','bz_marketplace_app']
        .forEach(k => sessionStorage.removeItem(k));
    }

    setDashUser(u, name);
    showView('dashView');
    loadDash(u.uid);
    listenClientNotifs(u.uid);
  } catch(e) {
    console.warn(e);
    setDashUser(u, name);
    showView('dashView');
    loadDash(u.uid);
  }
});

/* ════════════════════════════════════════════════════════
   DASHBOARD — LOAD ALL PROJECTS
════════════════════════════════════════════════════════ */
function loadDash(uid) {
  $('dashLoader').style.display = 'flex';
  if (_unsubLeads) _unsubLeads();
  _unsubLeads = db.collection('leads').where('userId','==',uid)
    .onSnapshot(snap => {
      $('dashLoader').style.display = 'none';
      _allLeads = [...snap.docs]
        .map(d => ({id:d.id,...d.data()}))
        .sort((a,b) => (b.createdAt?.toMillis()||0) - (a.createdAt?.toMillis()||0));

      if (!_allLeads.length) {
        $('noLeadState').style.display = 'block';
        $('hasLeadState').style.display = 'none';
        return;
      }
      $('noLeadState').style.display = 'none';
      $('hasLeadState').style.display = 'flex';
      $('projCount').textContent = _allLeads.length;

      renderProjectsList();

      if (_curLeadId && _allLeads.find(l => l.id === _curLeadId)) {
        _curLead = _allLeads.find(l => l.id === _curLeadId);
        refreshProjectStatus(_curLead);
      } else {
        selectProject(_allLeads[0].id);
      }
    }, e => console.error(e));
}

/* ── Render left sidebar ── */
function renderProjectsList() {
  const list = $('projectsList'); if (!list) return;
  list.innerHTML = '';
  _allLeads.forEach(lead => {
    const isActive = lead.id === _curLeadId;
    const div = document.createElement('div');
    div.className = 'proj-item' + (isActive ? ' active' : '');
    div.setAttribute('data-id', lead.id);
    const title = (lead.type && lead.type !== 'A definir' ? lead.type : 'App sur mesure')
                + (lead.packLabel ? ' · ' + lead.packLabel : '');
    div.innerHTML = `
      <div class="pi-top">
        <div class="pi-name">${title}</div>
        <div class="pi-date">${fmtDShort(lead.createdAt)}</div>
      </div>
      <span class="pi-status ${spClass(lead.status)}">${spLabel(lead.status)}</span>`;
    div.addEventListener('click', () => selectProject(div.getAttribute('data-id')));
    list.appendChild(div);
  });
}

/* ── Select project ── */
function selectProject(leadId) {
  _curLeadId = leadId;
  _curLead = _allLeads.find(l => l.id === leadId);
  if (!_curLead) return;

  renderProjectsList();

  $('centerEmpty').style.display = 'none';
  $('centerContent').style.display = 'flex';

  const lead = _curLead;
  $('scTitle').textContent = (lead.type && lead.type !== 'A definir' ? lead.type : 'Application')
    + (lead.packLabel ? ' — ' + lead.packLabel : '');
  $('scSub').textContent = lead.createdAt ? 'Soumise le ' + fmtD(lead.createdAt) : '';
  updProg(lead.status || 'new');

  // Payment banners
  _updatePayBanners(lead);

  // App details
  renderAppDetails(lead);

  // Chat
  const ciw = $('chatInputWrap'); if (ciw) ciw.style.display = 'block';
  const hdSub = $('chatHdSub');
  if (hdSub) hdSub.textContent = (lead.type && lead.type !== 'A definir' ? lead.type : 'App sur mesure')
    + (lead.packLabel ? ' · ' + lead.packLabel : '');

  loadMessages(leadId);
}

function _updatePayBanners(lead) {
  const payB = $('payBanner'), paidB = $('payPaidBanner');
  const hideStatuses = ['payment_confirmed','converted','closed'];
  if (payB) {
    if (!hideStatuses.includes(lead.status) && ['validated','payment_requested'].includes(lead.status)) {
      payB.classList.add('on');
      const desc = $('pbDesc');
      if (desc) desc.textContent = lead.status === 'payment_requested'
        ? '⏳ Paiement en attente de confirmation par notre équipe.'
        : '✅ Démo validée ! Procédez au paiement pour recevoir votre application finale.';
    } else payB.classList.remove('on');
  }
  if (paidB) {
    if (lead.status === 'payment_confirmed') paidB.classList.add('on');
    else paidB.classList.remove('on');
  }
}

/* ── Detail collapsible ── */
let _detailOpen = false;
function toggleDetail() {
  _detailOpen = !_detailOpen;
  const bd = $('appDetails'), arrow = $('dcArrow');
  if (bd) bd.style.display = _detailOpen ? 'block' : 'none';
  if (arrow) arrow.className = 'dc-arrow' + (_detailOpen ? ' open' : '');
}

/* ── Refresh status only (no message listener reset) ── */
function refreshProjectStatus(lead) {
  if (!lead) return;
  const sc = $('scTitle');
  if (sc) sc.textContent = (lead.type && lead.type !== 'A definir' ? lead.type : 'Application')
    + (lead.packLabel ? ' — ' + lead.packLabel : '');
  updProg(lead.status || 'new');
  _updatePayBanners(lead);
  renderProjectsList();
}

function renderAppDetails(lead) {
  const feats = Array.isArray(lead.features) && lead.features.length ? lead.features
    : (lead.categories ? lead.categories.split(',').map(s=>s.trim()).filter(Boolean) : []);
  let h = '';
  if (lead.source==='marketplace' && lead.marketplaceApp) {
    const mp = lead.marketplaceApp;
    h += `<div style="background:rgba(255,214,0,.08);border:1px solid rgba(255,214,0,.2);border-radius:10px;padding:10px 12px;margin-bottom:7px;display:flex;align-items:center;gap:9px">
      <span style="font-size:1.4rem">${mp.icon||'📱'}</span>
      <div style="flex:1">
        <div style="font-weight:800;font-size:.82rem;color:#ffd600">${mp.name||'App Marketplace'}</div>
        <div style="font-size:.68rem;color:var(--mu)">${mp.partner&&mp.partner!=='à venir'?'Par '+mp.partner:''} ${mp.trialDone?'· Essai validé ✅':''}</div>
      </div>
      ${mp.demoUrl?`<a href="${mp.demoUrl}" target="_blank" style="font-size:.7rem;color:var(--ac);font-weight:600">Revoir →</a>`:''}
    </div>`;
  }
  if (lead.pack) h += `<div class="detail-row"><span class="dk">Pack</span><span class="dv" style="font-weight:700;color:var(--ac)">${lead.packLabel||lead.pack}</span></div>`;
  if (lead.type && lead.type!=='A definir') h += `<div class="detail-row"><span class="dk">Type</span><span class="dv">${lead.type}</span></div>`;
  if (lead.complexity) h += `<div class="detail-row"><span class="dk">Complexité</span><span class="dv">${lead.complexity}</span></div>`;
  if (lead.domain) h += `<div class="detail-row"><span class="dk">Secteur</span><span class="dv">${lead.domain}</span></div>`;
  if (lead.phone) h += `<div class="detail-row"><span class="dk">Tél</span><span class="dv">${lead.phone}</span></div>`;
  if (lead.monetize) h += `<div class="detail-row"><span class="dk">Monétisation</span><span class="dv" style="color:var(--green)">✓ Activée</span></div>`;
  if (feats.length) h += `<div class="detail-row" style="flex-direction:column;gap:5px"><span class="dk">Fonctionnalités</span><div class="feat-tags">${feats.map(f=>`<span class="feat-tag">${f}</span>`).join('')}</div></div>`;
  if (lead.description) h += `<div class="detail-row"><span class="dk">Description</span><span class="dv" style="font-style:italic;color:var(--mu)">${lead.description}</span></div>`;
  const el = $('appDetails');
  if (el) el.innerHTML = h || '<div style="color:var(--mu);font-size:.75rem">Informations en cours de traitement.</div>';
}

/* ════════════════════════════════════════════════════════
   MESSAGES
════════════════════════════════════════════════════════ */
function loadMessages(leadId) {
  if (_unsubMsgs) _unsubMsgs();
  $('chatMsgs').innerHTML = '<div class="chat-empty"><div class="splg" style="margin:0 auto 8px"></div>Chargement...</div>';
  var _clientChatFirst = true;
  _unsubMsgs = db.collection('messages').where('leadId','==',leadId)
    .onSnapshot(snap => {
      const msgs = [...snap.docs]
        .map(d => ({id:d.id,...d.data()}))
        .sort((a,b) => (a.createdAt?.toMillis()||0) - (b.createdAt?.toMillis()||0));
      if(!_clientChatFirst){
        const hasNewFromAdmin = snap.docChanges().some(c => c.type==='added' && c.doc.data().from!=='client');
        if(hasNewFromAdmin && window.WalaupSound) WalaupSound.receive();
      }
      _clientChatFirst = false;
      renderChat(msgs, leadId);
      renderDemos(msgs, leadId);

      // Mark read
      const unread = snap.docs.filter(d => !d.data().readByClient && d.data().from !== 'client');
      if (unread.length) {
        const b = db.batch();
        unread.forEach(d => b.update(d.ref, {readByClient:true}));
        b.commit().catch(() => {});
      }

      // Unread badge
      const ur = msgs.filter(m => !m.readByClient && m.from!=='client' && m.from!=='system').length;
      const badge = $('chatUnread');
      if (badge) {
        if (ur > 0) { badge.textContent = ur>9?'9+':ur; badge.className='chat-unread on'; }
        else badge.className = 'chat-unread';
      }
    }, e => console.error(e));
}

function renderChat(msgs, leadId) {
  const el = $('chatMsgs');
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  if (!msgs.length) { el.innerHTML='<div class="chat-empty">Aucun message. Posez vos questions à l\'équipe Walaup !</div>'; return; }
  el.innerHTML = '';

  const allDemos   = msgs.filter(m => m.type==='demo' || m.type==='final');
  const anyApproved = allDemos.some(m => m.approvedByClient);
  const latestDemoId = allDemos.length ? allDemos[allDemos.length-1].id : null;
  const hasFinal   = allDemos.some(m => m.type==='final');

  msgs.forEach(m => {
    let html = '';
    const isClient = m.from === 'client';
    if (m.type === 'system') {
      html = `<div class="sys-msg">${m.text}</div>`;
    } else if (m.type === 'payment') {
      html = `<div class="pay-bubble">💳 ${m.text}<div style="font-size:.59rem;opacity:.6;margin-top:2px">${fmtD(m.createdAt)}</div></div>`;
    } else if (m.type === 'approval') {
      html = `<div class="approval-bubble">✅ ${m.text}<div style="font-size:.59rem;opacity:.6;margin-top:2px">${fmtD(m.createdAt)}</div></div>`;
    } else if (m.type === 'final') {
      const conf = m.approvedByClient;
      html = `<div class="demo-bubble final">
        <div class="db-ver">🏁 Version finale ${conf?'<span class="final-badge">✅ Reçue</span>':''}</div>
        <div class="db-msg">${m.text||'Votre application finale est prête !'}</div>
        <div class="db-date">${fmtD(m.createdAt)}</div>
        <div class="db-actions">
          <a href="${m.demoUrl||'#'}" target="_blank" class="btn-test" style="background:var(--green);color:#000">🚀 Ouvrir mon app</a>
          ${!conf?`<button class="btn-approve" onclick="approveFinal('${m.id}','${leadId}')">✅ Confirmer réception</button>`:''}
        </div>
      </div>`;
    } else if (m.type === 'demo') {
      const approved = m.approvedByClient;
      const isLatest = m.id === latestDemoId;
      const realCanTest = approved || (isLatest && !anyApproved && !hasFinal);
      const testBtn = realCanTest
        ? `<button class="btn-test" onclick="openOv('${m.demoUrl}','${m.demoVersion||''}','${m.id}','${leadId}',${approved})">🚀 Tester</button>`
        : '<span class="locked-badge">🔒 Verrouillée</span>';
      let actionBtn = '';
      if (approved) actionBtn = '<span class="final-badge">✅ Validée</span>';
      else if (hasFinal) actionBtn = '<span style="font-size:.63rem;color:var(--mu2)">Remplacée</span>';
      else if (anyApproved) actionBtn = '<span class="locked-badge">Non retenue</span>';
      else if (isLatest) actionBtn = `<button class="btn-approve" onclick="approveDemoMsg('${m.id}','${leadId}')">✅ Valider</button><button class="btn-improve" onclick="openOvImprove('${m.demoUrl}','${m.demoVersion||''}','${m.id}','${leadId}')">✏️ Modif.</button>`;
      else actionBtn = '<span class="locked-badge">⬆️ Ancienne</span>';
      html = `<div class="demo-bubble${approved?' approved':''}${isLatest&&!anyApproved?' latest':''}">
        <div class="db-ver">${approved?'✅':'🎯'} Démo ${m.demoVersion||''}</div>
        <div class="db-msg">${m.text||''}</div>
        <div class="db-date">${fmtD(m.createdAt)}</div>
        <div class="db-actions">${testBtn}${actionBtn}</div>
      </div>`;
    } else if (m.type === 'image') {
      html = `<div class="bubble ${isClient?'mine':'theirs'}">
        <div class="bubble-body"><img src="${m.imageData||''}" class="msg-img" onclick="window.open(this.src,'_blank')" alt="${m.imageName||'image'}"><div style="font-size:.67rem;margin-top:2px;opacity:.65">${m.imageName||'image'}</div></div>
        <div class="bubble-meta">${isClient?'Vous':'Walaup'} · ${fmtD(m.createdAt)}</div>
      </div>`;
    } else if (m.type === 'voice') {
      html = `<div class="bubble ${isClient?'mine':'theirs'}">
        <div class="bubble-body"><div class="voice-row"><button class="vplay" onclick="playVoice('${m.id}','${m.audioData||''}')">▶</button><span style="flex:1;height:3px;background:var(--bd2);border-radius:2px;display:block"></span><span class="vdur">🎤 ${m.duration||0}s</span></div></div>
        <div class="bubble-meta">${isClient?'Vous':'Walaup'} · ${fmtD(m.createdAt)}</div>
      </div>`;
    } else {
      html = `<div class="bubble ${isClient?'mine':'theirs'}">
        <div class="bubble-body">${m.text}</div>
        <div class="bubble-meta">${isClient?'Vous':'Walaup'} · ${fmtD(m.createdAt)}</div>
      </div>`;
    }
    el.innerHTML += html;
  });
  if (atBottom) el.scrollTop = el.scrollHeight;
}

function renderDemos(msgs, leadId) {
  const demoMsgs = msgs.filter(m => m.type === 'demo');
  const finalMsg  = msgs.find(m => m.type === 'final');
  const hasContent = demoMsgs.length || finalMsg;
  $('demosWrap').style.display = hasContent ? 'block' : 'none';
  $('awaitDemo').style.display = (!hasContent && _curLead && ['new','contacted'].includes(_curLead.status||'new')) ? 'block' : 'none';
  if (!hasContent) return;

  $('demoCnt').textContent = demoMsgs.length + (finalMsg ? '+F' : '');
  const modifUsed = msgs.filter(m => m.type==='text' && m.from==='client' && m.text && m.text.startsWith('🔧')).length;
  const modifLeft = 3 - modifUsed;
  const mc = $('modifLeft');
  if (mc) { mc.textContent = modifLeft + ' modif. restante' + (modifLeft>1?'s':''); mc.className = 'modif-counter'+(modifLeft===0?' blocked':modifLeft===1?' warn':''); }

  const sorted = [...demoMsgs].sort((a,b) => (a.versionNumber||0)-(b.versionNumber||0));
  const latestDemo = sorted[sorted.length-1];
  const anyApproved = demoMsgs.some(m => m.approvedByClient);

  $('demosList').innerHTML = '';

  // Final version (top)
  if (finalMsg) {
    const conf = finalMsg.approvedByClient;
    $('demosList').innerHTML += `<div class="demo-item approved" style="border-top:2px solid var(--green)">
      <div class="di-ver">🏁 <span class="final-badge">VERSION FINALE</span></div>
      <div class="di-msg">${finalMsg.text||'Votre application finale est prête !'}</div>
      <div class="di-date">${fmtD(finalMsg.createdAt)}</div>
      <div class="di-actions">
        <a href="${finalMsg.demoUrl||'#'}" target="_blank" class="btn-test" style="background:var(--green);color:#000">🚀 Ouvrir mon app</a>
        ${!conf?`<button class="btn-approve" onclick="approveFinal('${finalMsg.id}','${leadId}')">✅ Confirmer réception</button>`:'<span class="final-badge">✅ Confirmée</span>'}
      </div>
    </div>`;
  }

  // Demo versions (newest first)
  [...sorted].reverse().forEach(m => {
    const approved = m.approvedByClient;
    const isLatest = m.id === latestDemo.id;
    const vNum = m.demoVersion || m.versionNumber || '—';
    const canTest = approved || (isLatest && !anyApproved && !finalMsg);
    const testBtn = canTest
      ? `<button class="btn-test" onclick="openOv('${m.demoUrl}','${vNum}','${m.id}','${leadId}',${approved})">🚀 Tester</button>`
      : `<span class="locked-badge">🔒 Verrouillée</span>`;
    let actionHtml = '';
    if (approved) actionHtml = '<span class="final-badge">✅ Validée</span>';
    else if (finalMsg) actionHtml = '<span style="font-size:.63rem;color:var(--mu2);opacity:.6">Remplacée</span>';
    else if (anyApproved) actionHtml = '<span class="locked-badge">Non retenue</span>';
    else if (isLatest) actionHtml = `<button class="btn-approve" onclick="approveDemoMsg('${m.id}','${leadId}')">✅ Valider</button>`;
    else actionHtml = '<span class="locked-badge">Version antérieure</span>';
    $('demosList').innerHTML += `<div class="demo-item${approved?' approved':''}${isLatest&&!anyApproved&&!finalMsg?' latest':''}">
      <div class="di-ver">${approved?'✅':''}${isLatest&&!anyApproved&&!finalMsg?'🆕':''} Version ${vNum}</div>
      <div class="di-msg" style="${!canTest&&!approved?'opacity:.3':''}">${m.text||'Démo disponible'}</div>
      <div class="di-date">${fmtD(m.createdAt)}</div>
      <div class="di-actions">${testBtn}${actionHtml}</div>
    </div>`;
  });
}

/* ── Approve demo ── */
async function approveDemoMsg(msgId, leadId) {
  const u = auth.currentUser; if (!u) return;
  try {
    await db.collection('messages').doc(msgId).update({approvedByClient:true, approvedAt:FS.serverTimestamp()});
    await db.collection('leads').doc(leadId).update({
      status: 'payment_requested', clientApprovedAt: FS.serverTimestamp(), approvedDemoId: msgId
    });
    await db.collection('messages').add({
      leadId, userId:u.uid, from:'client', type:'approval',
      text: '✅ Version validée ! Procédez au paiement pour recevoir votre application finale.',
      createdAt: FS.serverTimestamp(), readByClient:true, readByAdmin:false
    });
    await db.collection('notifications').add({
      userId:'admin', leadId,
      title: '✅ Démo validée — Paiement requis',
      message: (u.displayName||u.email||'Client')+' a validé sa démo. Attendez le paiement client.',
      type: 'payment_needed', read:false, createdAt:FS.serverTimestamp()
    });
    if (_curLead) { _curLead.status = 'payment_requested'; refreshProjectStatus(_curLead); }
    toast('✅ Démo validée ! Procédez au paiement pour recevoir votre application finale.');
  } catch(e) { toast('Erreur: '+e.message,'err'); }
}

async function approveFinal(msgId, leadId) {
  const u = auth.currentUser; if (!u) return;
  try {
    await db.collection('messages').doc(msgId).update({approvedByClient:true, approvedAt:FS.serverTimestamp()});
    await db.collection('leads').doc(leadId).update({status:'closed', clientReceivedAt:FS.serverTimestamp()});
    toast('✅ Application confirmée ! Merci de votre confiance.');
  } catch(e) { toast('Erreur','err'); }
}

/* ── Send message ── */
async function sendMsg() {
  const u = auth.currentUser; if (!u || !_curLeadId) return;
  const text = $('chatInput').value.trim(); if (!text) return;
  if(window.WalaupSound) WalaupSound.send();
  $('chatInput').value = ''; $('chatInput').style.height = 'auto';
  try {
    await db.collection('messages').add({
      leadId:_curLeadId, userId:u.uid, from:'client', type:'text',
      text, createdAt:FS.serverTimestamp(), readByClient:true, readByAdmin:false
    });
  } catch(e) { toast('Erreur envoi','err'); $('chatInput').value = text; }
}

/* ── Image ── */
async function sendImage(input) {
  const u = auth.currentUser; if (!u || !_curLeadId || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5*1024*1024) { toast('Image max 5MB','err'); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      await db.collection('messages').add({
        leadId:_curLeadId, userId:u.uid, from:'client', type:'image',
        imageData:e.target.result, imageName:file.name, text:'📷 '+file.name,
        createdAt:FS.serverTimestamp(), readByClient:true, readByAdmin:false
      });
      toast('✅ Image envoyée');
    } catch(err) { toast('Erreur','err'); }
  };
  reader.readAsDataURL(file); input.value = '';
}

/* ── Voice ── */
let _mRec=null, _rChunks=[], _rTimer=null, _rSecs=0, _rStream=null;
async function toggleVoice() {
  if (_mRec && _mRec.state === 'recording') { _mRec.stop(); return; }
  try {
    _rStream = await navigator.mediaDevices.getUserMedia({audio:true});
    _mRec = new MediaRecorder(_rStream); _rChunks = [];
    _mRec.ondataavailable = e => { if (e.data.size > 0) _rChunks.push(e.data); };
    _mRec.onstop = async () => {
      clearInterval(_rTimer); $('voiceBtn').classList.remove('rec'); $('recTimer').style.display = 'none';
      _rStream.getTracks().forEach(t => t.stop());
      const blob = new Blob(_rChunks, {type:'audio/webm'}); if (blob.size < 500) return;
      const reader = new FileReader();
      reader.onload = async e => {
        const u = auth.currentUser; if (!u || !_curLeadId) return;
        try {
          await db.collection('messages').add({
            leadId:_curLeadId, userId:u.uid, from:'client', type:'voice',
            audioData:e.target.result, duration:_rSecs, text:'🎤 Vocal ('+_rSecs+'s)',
            createdAt:FS.serverTimestamp(), readByClient:true, readByAdmin:false
          });
          toast('✅ Message vocal envoyé');
        } catch(err) { toast('Erreur','err'); }
      };
      reader.readAsDataURL(blob);
    };
    _mRec.start(); _rSecs = 0;
    $('voiceBtn').classList.add('rec'); $('recTimer').style.display = 'inline-flex';
    _rTimer = setInterval(() => {
      _rSecs++; const m=Math.floor(_rSecs/60), s=_rSecs%60;
      $('recTime').textContent = m + ':' + (s<10?'0':'') + s;
      if (_rSecs >= 120) _mRec.stop();
    }, 1000);
  } catch(e) { toast('Micro non accessible','err'); }
}
let _audCache = {};
function playVoice(id, data) {
  if (_audCache[id]) { _audCache[id].pause(); delete _audCache[id]; return; }
  const a = new Audio(data); _audCache[id] = a;
  a.play().catch(() => {}); a.onended = () => delete _audCache[id];
}

/* ════════════════════════════════════════════════════════
   DEMO OVERLAY
════════════════════════════════════════════════════════ */
let _ovMsgId='', _ovLeadId='', _ovApproved=false;
function openOv(url, ver, msgId, leadId, approved) {
  _ovMsgId=msgId; _ovLeadId=leadId; _ovApproved=approved;
  $('ovVer').textContent = ver ? 'v'+ver : 'démo';
  $('ovFrame').src = url;
  $('ovApprBtn').style.display = approved ? 'none' : 'inline-flex';
  $('ovImpBtn').style.display  = approved ? 'none' : 'inline-flex';
  $('ovImproveBar').classList.remove('open');
  $('demoOv').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function openOvImprove(url, ver, msgId, leadId) {
  openOv(url, ver, msgId, leadId, false);
  $('ovImproveBar').classList.add('open');
  setTimeout(() => $('ovImpText').focus(), 300);
}
function closeOv() {
  $('demoOv').classList.remove('open'); $('ovFrame').src = '';
  $('ovImproveBar').classList.remove('open'); $('ovImpText').value = '';
  document.body.style.overflow = '';
}
async function approveFromOv() { closeOv(); await approveDemoMsg(_ovMsgId, _ovLeadId); }
function toggleOvImprove() {
  $('ovImproveBar').classList.toggle('open');
  if ($('ovImproveBar').classList.contains('open')) $('ovImpText').focus();
}
async function sendImproveMsg() {
  const u = auth.currentUser; if (!u || !_ovLeadId) return;
  const text = $('ovImpText').value.trim(); if (!text) return;
  const snap = await db.collection('messages').where('leadId','==',_ovLeadId).where('from','==','client').get();
  const modifCount = snap.docs.filter(d => d.data().text && d.data().text.startsWith('🔧')).length;
  if (modifCount >= 3) { toast('⚠️ Limite de 3 modifications atteinte.','err'); return; }
  $('ovImpText').value = ''; closeOv();
  try {
    await db.collection('messages').add({
      leadId:_ovLeadId, userId:u.uid, from:'client', type:'text',
      text: '🔧 Modifications ('+(modifCount+1)+'/3) : '+text,
      createdAt:FS.serverTimestamp(), readByClient:true, readByAdmin:false
    });
    toast('✅ Modifications envoyées ('+(modifCount+1)+'/3)');
  } catch(e) { toast('Erreur','err'); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOv(); });

/* ════════════════════════════════════════════════════════
   PAYMENT
════════════════════════════════════════════════════════ */
let _selPayMethod = '';
function selPay(el, m) {
  document.querySelectorAll('.pay-method').forEach(x => x.classList.remove('sel'));
  el.classList.add('sel'); _selPayMethod = m;
}
async function openPayOv() {
  const lead = _curLead; if (!lead) return;
  const price = lead.estimatedPrice > 0 ? (lead.estimatedPrice+' DT') : (PACK_PRICES[lead.pack]||'À définir');
  $('payAmt').textContent = price;
  const demoList = $('payDemoList');
  if (demoList) {
    try {
      const snap = await db.collection('messages').where('leadId','==',lead.id)
        .where('type','==','demo').where('approvedByClient','==',true).get();
      if (snap.empty) {
        demoList.innerHTML = '<div style="font-size:.72rem;color:var(--mu)">Démo validée</div>';
      } else {
        demoList.innerHTML = snap.docs.map(d => {
          const m = d.data();
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--bd)">
            <span style="font-size:.75rem;font-weight:700">✅ Version ${m.demoVersion||'—'}</span>
            <a href="${m.demoUrl||'#'}" target="_blank" style="font-size:.7rem;color:var(--ac)">Revoir →</a>
          </div>`;
        }).join('');
      }
    } catch(e) { if(demoList) demoList.innerHTML=''; }
  }
  $('payOv').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closePayOv() { $('payOv').classList.remove('open'); document.body.style.overflow = ''; }
async function confirmPay() {
  if (!_selPayMethod) { toast('Choisissez un moyen de paiement','err'); return; }
  const u = auth.currentUser; if (!u || !_curLeadId) return;
  closePayOv();
  try {
    const price = _curLead?.estimatedPrice>0 ? (_curLead.estimatedPrice+' DT') : (PACK_PRICES[_curLead?.pack]||'—');
    await db.collection('messages').add({
      leadId:_curLeadId, userId:u.uid, from:'client', type:'payment',
      text: '💳 Paiement de '+price+' soumis via '+_selPayMethod+'. En attente de confirmation.',
      payMethod:_selPayMethod, paidAmount:price,
      createdAt:FS.serverTimestamp(), readByClient:true, readByAdmin:false
    });
    await db.collection('leads').doc(_curLeadId).update({
      status:'payment_requested', payMethod:_selPayMethod,
      clientPayedAt:FS.serverTimestamp(), paidAmount:price
    });
    await db.collection('notifications').add({
      userId:'admin', leadId:_curLeadId,
      title: '💳 Paiement de '+price+' soumis',
      message: (u.displayName||u.email||'Client')+' a soumis un paiement de '+price+' via '+_selPayMethod+' — à confirmer.',
      type: 'payment', read:false, createdAt:FS.serverTimestamp()
    });
    if (_curLead) _curLead.status = 'payment_requested';
    const payB = $('payBanner');
    if (payB) {
      payB.classList.add('on');
      const desc = $('pbDesc');
      if (desc) desc.textContent = '⏳ Paiement en attente de confirmation par notre équipe.';
    }
    toast('✅ Paiement soumis ! Notre équipe va confirmer et livrer votre application sous 24h.');
  } catch(e) { toast('Erreur','err'); }
}

/* ════════════════════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════════════════════ */
function listenClientNotifs(uid) {
  db.collection('notifications').where('userId','==',uid).where('read','==',false)
    .onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const d = change.doc.data();
          if(window.WalaupSound) WalaupSound.notif();
          window.showNotifBanner && window.showNotifBanner(d.title||'Walaup', d.message||'');
          setTimeout(() => { change.doc.ref.update({read:true}).catch(() => {}); }, 4000);
        }
      });
    });
}

/* ════════════════════════════════════════════════════════
   PWA — SERVICE WORKER + INSTALL + NOTIFICATIONS
════════════════════════════════════════════════════════ */
(function() {
  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').then(function(reg) {
        console.log('SW registered:', reg.scope);
      }).catch(function(e) { console.warn('SW failed:', e); });
    });
  }

  // Install prompt
  var _installEvt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault(); _installEvt = e;
    setTimeout(function() {
      if (!localStorage.getItem('pwa_dismissed')) {
        var banner = document.getElementById('pwaInstallBanner');
        if (banner) banner.classList.add('show');
      }
    }, 3000);
  });

  window.installPWA = function() {
    if (!_installEvt) return;
    _installEvt.prompt();
    _installEvt.userChoice.then(function(r) {
      if (r.outcome === 'accepted') localStorage.setItem('pwa_installed','1');
      dismissPWA();
    });
  };
  window.dismissPWA = function() {
    var banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('show');
    localStorage.setItem('pwa_dismissed','1');
  };

  // Visual notification banner
  window.showNotifBanner = function(title, body) {
    if(window.WalaupSound) WalaupSound.notif();
    var nb = document.getElementById('notifBadge');
    if (nb) {
      var nt = nb.querySelector('.notif-text');
      if (nt) nt.innerHTML = '<strong>'+(title||'Nouveau message')+'</strong><br>'+(body||'');
      nb.classList.add('show');
      setTimeout(function() { nb.classList.remove('show'); }, 5000);
    }
    if (Notification && Notification.permission === 'granted') {
      try { new Notification(title||'Walaup', {body:body||'', icon:'/favicon.ico'}); } catch(e) {}
    }
  };

  // Request notification permission on first interaction
  document.addEventListener('click', function() {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, {once:true, passive:true});
})();
