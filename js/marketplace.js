/* ════════════════════════════════════════════════════════
   WALAUP — marketplace.js v2
   Image cards + Full-screen demo overlay
   Mobile/Web toggle + 3 action CTAs
════════════════════════════════════════════════════════ */

/* ── STATE ── */
var _allApps = [], _curFilter = 'all', _curAppData = null;
var _trialValidated = false, _curDeviceMode = 'mobile';

/* ── STATIC FALLBACK APPS ── */
var STATIC_APPS = [
  { id:'s1', icon:'☕', name:'App Café & Restaurant',
    description:'Gestion complète : commandes par table, caisse, employés, stock produits, rapports journaliers.',
    tags:['Commandes','Caisse','Employés','Stock'], price:'299 DT', origPrice:'450 DT',
    demoUrl:'cafe.html', category:'cafe', partner:'Café Beb Lmdina', active:true },
  { id:'s2', icon:'🔄', name:'App Grossiste / Recharge',
    description:'Gestion stock recharges téléphoniques, crédits clients, historique commandes, rapports.',
    tags:['Stock','Crédits','Clients','Rapports'], price:'349 DT', origPrice:'520 DT',
    demoUrl:'grossiste.html', category:'commerce', partner:'RechargeHub TN', active:true },
  { id:'s3', icon:'💰', name:'App Suivi Dettes',
    description:'Suivi dettes clients et fournisseurs, relances automatiques, tableau de bord financier.',
    tags:['Dettes','Clients','Paiements','Rapports'], price:'249 DT', origPrice:'380 DT',
    demoUrl:'dettes.html', category:'gestion', partner:'Debt Manager TN', active:true },
  { id:'s4', icon:'🍕', name:'App Pizzeria & Livraison',
    description:'Commandes en ligne, suivi livraisons, gestion livreurs, caisse intégrée.',
    tags:['Livraison','Commandes','Suivi','Caisse'], price:'399 DT', origPrice:'580 DT',
    demoUrl:'cafe.html', category:'cafe', partner:'à venir', active:true },
  { id:'s5', icon:'💊', name:'App Pharmacie',
    description:'Gestion stock médicaments, ordonnances, clients, alertes péremption.',
    tags:['Stock','Ordonnances','Alertes','Clients'], price:'449 DT', origPrice:'650 DT',
    demoUrl:'grossiste.html', category:'services', partner:'à venir', active:true },
  { id:'s6', icon:'🏫', name:'App École / Crèche',
    description:'Inscriptions élèves, présences, paiements mensualités, communication parents.',
    tags:['Élèves','Présences','Paiements','Parents'], price:'379 DT', origPrice:'560 DT',
    demoUrl:'dettes.html', category:'services', partner:'à venir', active:true },
];

/* ── FIRESTORE LOAD ── */
var _firestoreLoaded = false;

db.collection('marketplace_apps').onSnapshot(
  function(snap) {
    _firestoreLoaded = true;
    var all = snap.docs.map(function(d) {
      var data = d.data();
      return Object.assign({ id: d.id }, data, { src: data.demoUrl || data.src || '' });
    });
    _allApps = all.filter(function(a) { return a.active !== false; });
    _allApps.sort(function(a, b) {
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
    if (!_allApps.length) _allApps = STATIC_APPS;
    renderGrid();
  },
  function(e) {
    console.warn('Firestore error:', e.code);
    if (e.code === 'permission-denied') {
      var grid = document.getElementById('marketGrid');
      if (grid) grid.innerHTML =
        '<div class="market-empty" style="color:#f87171">' +
        '<div style="font-size:2rem;margin-bottom:8px">🔒</div>' +
        'Permissions Firestore insuffisantes</div>';
    }
    _allApps = STATIC_APPS;
    renderGrid();
  }
);

// Fallback
setTimeout(function() {
  if (!_firestoreLoaded) { _allApps = STATIC_APPS; renderGrid(); }
}, 3500);

/* ── FILTER ── */
function filterApps(cat, btn) {
  if (window.WalaupSound) WalaupSound.tab();
  _curFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderGrid();
}

/* ══════════════════════════════════════════
   RENDER GRID — Cards with images
   ════════════════════════════════════════ */
function renderGrid() {
  var grid = document.getElementById('marketGrid');
  if (!grid) return;
  var filtered = _allApps.filter(function(a) {
    return _curFilter === 'all' || a.category === _curFilter || a.cat === _curFilter;
  });
  if (!filtered.length) {
    grid.innerHTML = '<div class="market-empty"><div style="font-size:2.5rem;margin-bottom:10px">' +
      (_curFilter !== 'all' ? '🔍</div>Aucune application dans cette catégorie.' : '📭</div>Aucune application disponible.') + '</div>';
    return;
  }

  grid.innerHTML = filtered.map(function(a) {
    var hasImg = a.thumbnailUrl && a.thumbnailUrl.trim();
    var thumbHtml = hasImg
      // Real image
      ? '<div class="ac-thumb-wrap">' +
          '<img class="ac-thumb" src="' + _esc(a.thumbnailUrl) + '" ' +
            'onerror="this.parentNode.innerHTML=\'<div class=\\"ac-thumb-fallback\\">' + (a.icon||'📱') + '</div>\'"' +
            ' alt="' + _esc(a.name||'') + '" loading="lazy">' +
          '<div class="ac-thumb-gradient"></div>' +
          (a.partner && a.partner !== 'à venir' ? '<div class="partner-badge">✓ Partenaire</div>' : '') +
        '</div>'
      // Emoji fallback
      : '<div class="ac-thumb-wrap">' +
          '<div class="ac-thumb-fallback">' + (a.icon||'📱') + '</div>' +
          (a.partner && a.partner !== 'à venir' ? '<div class="partner-badge">✓ Partenaire</div>' : '') +
        '</div>';

    var tagsHtml = (a.tags||[]).map(function(t) {
      return '<span class="ac-tag">' + _esc(t) + '</span>';
    }).join('');

    var origHtml = a.origPrice ? '<span class="ac-orig">' + _esc(a.origPrice) + '</span>' : '';

    return '<div class="app-card" onclick="tryApp(\'' + a.id + '\')">' +
      thumbHtml +
      '<div class="ac-body">' +
        '<div class="ac-header">' +
          '<div class="ac-icon-sm">' + (a.icon||'📱') + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="ac-name">' + _esc(a.name||'Application') + '</div>' +
            (a.partner && a.partner !== 'à venir' ? '<div class="ac-partner">Par ' + _esc(a.partner) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="ac-desc">' + _esc(a.description||'') + '</div>' +
        (tagsHtml ? '<div class="ac-tags">' + tagsHtml + '</div>' : '') +
        '<div class="ac-footer">' +
          '<div class="ac-price">' + origHtml + _esc(a.price||'Sur devis') + '</div>' +
          '<div class="ac-btns">' +
            '<button class="btn-try" onclick="event.stopPropagation();tryApp(\'' + a.id + '\')">' +
              '<i class="ph-bold ph-eye"></i> Essayer</button>' +
            '<button class="btn-buy" onclick="event.stopPropagation();openConfirmModal(_allApps.find(function(x){return x.id===\'' + a.id + '\';}))">' +
              '<i class="ph-bold ph-shopping-cart-simple"></i> Acheter</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function _esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════
   DEMO OVERLAY — Open / Device toggle
   ════════════════════════════════════════ */
function tryApp(id) {
  if (window.WalaupSound) WalaupSound.click();
  var a = _allApps.find(function(x) { return x.id === id; });
  if (!a) return;
  _curAppData = a;
  _trialValidated = false;

  // Populate top bar
  var dovIcon = document.getElementById('dovIcon');
  if (dovIcon) {
    // Show thumbnail in icon if available, else emoji
    if (a.thumbnailUrl && a.thumbnailUrl.trim()) {
      dovIcon.innerHTML = '<img src="' + a.thumbnailUrl + '" alt="" onerror="this.parentNode.textContent=\'' + (a.icon||'📱') + '\'">';
    } else {
      dovIcon.textContent = a.icon || '📱';
    }
  }
  var el;
  el = document.getElementById('dovTitle');   if (el) el.textContent = a.name || 'Application';
  el = document.getElementById('dovPartner'); if (el) el.textContent = (a.partner && a.partner !== 'à venir') ? 'Par ' + a.partner : '';
  el = document.getElementById('dovPrice');   if (el) el.textContent = a.price || '';
  el = document.getElementById('dovUrlBar');  if (el) el.textContent = (a.demoUrl || 'walaup.app/demo').replace(/^https?:\/\//, '');

  // Reset trial badge + button
  var badge = document.getElementById('trialBadge');
  if (badge) badge.style.display = 'none';
  var btn = document.getElementById('btnTrialDone');
  if (btn) {
    btn.innerHTML = '<i class="ph-bold ph-check-circle"></i><span>Valider l\'essai</span>';
    btn.classList.remove('done');
  }

  // Start in mobile mode
  setDeviceMode('mobile', true);

  // Open
  var ov = document.getElementById('demoOv');
  if (ov) ov.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── Device mode toggle ── */
function setDeviceMode(mode, skipSound) {
  _curDeviceMode = mode;
  var phoneWrap = document.getElementById('dovPhoneWrap');
  var webWrap   = document.getElementById('dovWebWrap');
  var btnM = document.getElementById('dtgMobile');
  var btnW = document.getElementById('dtgWeb');
  var url = _curAppData ? (_curAppData.demoUrl || _curAppData.src || '') : '';

  if (mode === 'mobile') {
    if (phoneWrap) phoneWrap.style.display = 'flex';
    if (webWrap)   webWrap.style.display   = 'none';
    if (btnM) btnM.classList.add('active');
    if (btnW) btnW.classList.remove('active');
    // Load iframe
    var fr = document.getElementById('ovFrame');
    if (fr && fr.src !== url) fr.src = url;
    // Clear web iframe
    var frW = document.getElementById('ovFrameWeb');
    if (frW) frW.src = '';
  } else {
    if (phoneWrap) phoneWrap.style.display = 'none';
    if (webWrap)   webWrap.style.display   = 'flex';
    if (btnM) btnM.classList.remove('active');
    if (btnW) btnW.classList.add('active');
    // Load web iframe
    var frW = document.getElementById('ovFrameWeb');
    if (frW && frW.src !== url) frW.src = url;
    // Clear mobile iframe
    var fr = document.getElementById('ovFrame');
    if (fr) fr.src = '';
  }
  if (!skipSound && window.WalaupSound) WalaupSound.tab();
}

/* ── Close overlay ── */
function closeDemoOv() {
  if (window.WalaupSound) WalaupSound.click();
  var ov = document.getElementById('demoOv');
  if (ov) ov.classList.remove('open');
  // Clear both iframes
  var fr  = document.getElementById('ovFrame');
  var frW = document.getElementById('ovFrameWeb');
  if (fr)  fr.src  = '';
  if (frW) frW.src = '';
  document.body.style.overflow = '';
}

/* ── Validate trial ── */
function validateTrial() {
  if (window.WalaupSound) WalaupSound.success();
  _trialValidated = true;
  var badge = document.getElementById('trialBadge');
  if (badge) {
    badge.style.display = 'flex';
    setTimeout(function() { badge.style.display = 'none'; }, 3500);
  }
  var btn = document.getElementById('btnTrialDone');
  if (btn) {
    btn.innerHTML = '<i class="ph-bold ph-check-circle"></i><span>Essai validé ✓</span>';
    btn.classList.add('done');
  }
  // After 1s suggest buying
  setTimeout(function() { openConfirmModal(_curAppData); }, 900);
}

/* ── Go to estimateur (custom app) ── */
function goToEstimateur() {
  if (window.WalaupSound) WalaupSound.tab();
  closeDemoOv();
  toast('Redirigé vers l\'estimateur…', 'suc');
  setTimeout(function() { window.location.href = 'estimateur.html'; }, 700);
}

/* ══════════════════════════════════════════
   CONFIRM MODAL
   ════════════════════════════════════════ */
function openConfirmModal(a) {
  if (!a) return;
  _curAppData = a;
  closeDemoOv();
  var el;
  el = document.getElementById('cfmIcon');  if (el) el.textContent = a.icon || '📱';
  el = document.getElementById('cfmName');  if (el) el.textContent = a.name || 'Application';
  el = document.getElementById('cfmPrice'); if (el) el.textContent = a.price || 'Sur devis';
  var modal = document.getElementById('confirmModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeConfirmModal() {
  var modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Proceed to buy → client.html ── */
function proceedToBuy() {
  if (window.WalaupSound) WalaupSound.success();
  var a = _curAppData; if (!a) return;
  sessionStorage.setItem('bz_pack', 'essentiel');
  sessionStorage.setItem('bz_marketplace_app', JSON.stringify({
    id: a.id, name: a.name, icon: a.icon, price: a.price,
    demoUrl: a.demoUrl || a.src, category: a.category || a.cat,
    partner: a.partner, trialDone: _trialValidated
  }));
  sessionStorage.setItem('bz_estimatedPrice', (a.price || '').replace(/[^0-9]/g, '') || '0');
  sessionStorage.setItem('bz_prompt', 'Application marketplace : ' + (a.name || '') + '. Client souhaite adapter cette app à son business.');
  sessionStorage.setItem('bz_features', JSON.stringify(a.tags || []));
  sessionStorage.setItem('bz_complexity', 'simple');
  closeConfirmModal();
  toast('✅ Redirection vers votre espace…', 'suc');
  setTimeout(function() { window.location.href = 'client.html'; }, 1200);
}

/* ── Toast ── */
function toast(msg, type) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast ' + (type||'suc') + ' on';
  setTimeout(function() { t.className = 'toast'; }, 2800);
}

/* ── Keyboard + swipe ── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeDemoOv(); closeConfirmModal(); }
});

var _touchY0 = 0;
document.addEventListener('touchstart', function(e) { _touchY0 = e.touches[0].clientY; }, { passive:true });
document.addEventListener('touchend', function(e) {
  var dy = e.changedTouches[0].clientY - _touchY0;
  if (dy > 90) {
    if (document.getElementById('demoOv').classList.contains('open')) closeDemoOv();
    if (document.getElementById('confirmModal').classList.contains('open')) closeConfirmModal();
  }
}, { passive:true });
