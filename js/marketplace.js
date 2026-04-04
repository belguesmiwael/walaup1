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

  // Build HTML with data-id (no onclick strings — avoids all escaping issues)
  grid.innerHTML = filtered.map(function(a) {
    var tagsHtml = (a.tags||[]).map(function(t) {
      return '<span class="ac-tag">' + _esc(t) + '</span>';
    }).join('');
    var origHtml = a.origPrice ? '<span class="ac-orig">' + _esc(a.origPrice) + '</span>' : '';
    var badge = (a.partner && a.partner !== 'à venir') ? '<div class="partner-badge">✓ Partenaire</div>' : '';
    var partnerLine = (a.partner && a.partner !== 'à venir') ? '<div class="ac-partner">Par ' + _esc(a.partner) + '</div>' : '';

    return '<div class="app-card" data-app-id="' + _esc(a.id) + '">' +
      '<div class="ac-thumb-wrap">' +
        '<div class="ac-thumb-fallback" id="ac-fb-' + _esc(a.id) + '">' + (a.icon||'📱') + '</div>' +
        '<div class="ac-thumb-gradient"></div>' +
        badge +
      '</div>' +
      '<div class="ac-body">' +
        '<div class="ac-header">' +
          '<div class="ac-icon-sm">' + (a.icon||'📱') + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="ac-name">' + _esc(a.name||'Application') + '</div>' +
            partnerLine +
          '</div>' +
        '</div>' +
        '<div class="ac-desc">' + _esc(a.description||'') + '</div>' +
        (tagsHtml ? '<div class="ac-tags">' + tagsHtml + '</div>' : '') +
        '<div class="ac-footer">' +
          '<div class="ac-price">' + origHtml + _esc(a.price||'Sur devis') + '</div>' +
          '<div class="ac-btns">' +
            '<button class="btn-try" data-try-id="' + _esc(a.id) + '"><i class="ph-bold ph-eye"></i> Essayer</button>' +
            '<button class="btn-buy" data-buy-id="' + _esc(a.id) + '"><i class="ph-bold ph-shopping-cart-simple"></i> Acheter</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Set images via JS — no src in HTML, no onerror attribute, no escaping issues
  filtered.forEach(function(a) {
    if (!a.thumbnailUrl || !a.thumbnailUrl.trim()) return;
    var wrap = grid.querySelector('[data-app-id="' + a.id + '"] .ac-thumb-wrap');
    var fb   = document.getElementById('ac-fb-' + a.id);
    if (!wrap) return;
    var img = document.createElement('img');
    img.className = 'ac-thumb';
    img.alt       = a.name || '';
    img.loading   = 'lazy';
    img.src       = a.thumbnailUrl; // direct assignment — no HTML encoding
    img.onerror   = function() { img.style.display = 'none'; };
    img.onload    = function() { if (fb) fb.style.display = 'none'; };
    wrap.insertBefore(img, wrap.firstChild);
  });

  // Bind events via addEventListener — no onclick strings in HTML
  grid.querySelectorAll('[data-app-id]').forEach(function(card) {
    var id = card.getAttribute('data-app-id');
    card.addEventListener('click', function() { openInfoPanel(id); });
  });
  grid.querySelectorAll('[data-try-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-try-id');
    btn.addEventListener('click', function(e) { e.stopPropagation(); tryApp(id); });
  });
  grid.querySelectorAll('[data-buy-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-buy-id');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      openConfirmModal(_allApps.find(function(x) { return x.id === id; }));
    });
  });
}

function _esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ══════════════════════════════════════════
   INFO PANEL
   ════════════════════════════════════════ */
function openInfoPanel(id) {
  var a = _allApps.find(function(x) { return x.id === id; });
  if (!a) return;
  _curAppData = a;
  if (window.WalaupSound) WalaupSound.click();

  // ── Icon ──
  var ipIcon = document.getElementById('ipIcon');
  if (ipIcon) {
    ipIcon.innerHTML = '';
    if (a.thumbnailUrl && a.thumbnailUrl.trim()) {
      var img = document.createElement('img');
      img.src = a.thumbnailUrl;
      img.onerror = function() { ipIcon.textContent = a.icon || '📱'; };
      ipIcon.appendChild(img);
    } else {
      ipIcon.textContent = a.icon || '📱';
    }
  }

  // ── Thumbnail banner ──
  var ipThumbWrap = document.getElementById('ipThumbWrap');
  var ipThumb = document.getElementById('ipThumb');
  if (ipThumbWrap && ipThumb) {
    if (a.thumbnailUrl && a.thumbnailUrl.trim()) {
      ipThumb.src = a.thumbnailUrl;
      ipThumb.onerror = function() { ipThumbWrap.style.display = 'none'; };
      ipThumbWrap.style.display = 'block';
    } else {
      ipThumbWrap.style.display = 'none';
    }
  }

  // ── Basic info ──
  _ipSet('ipName',    a.name || 'Application');
  _ipSet('ipPartner', (a.partner && a.partner !== 'à venir') ? 'Par ' + a.partner : '');
  _ipSet('ipPrice',   (a.origPrice ? a.origPrice + ' → ' : '') + (a.price || 'Sur devis'));

  // ── Tagline ──
  var ipTagline = document.getElementById('ipTagline');
  if (ipTagline) {
    ipTagline.textContent = a.tagline || a.description || '';
    ipTagline.style.display = (a.tagline || a.description) ? 'block' : 'none';
  }

  // ── For who ──
  var ipForWho = document.getElementById('ipForWho');
  var ipForWhoTxt = document.getElementById('ipForWhoTxt');
  if (ipForWho && ipForWhoTxt) {
    ipForWhoTxt.textContent = a.forWho || '';
    ipForWho.style.display = a.forWho ? 'flex' : 'none';
  }

  // ── Problems ──
  var problems = a.problems || [];
  var ipProb = document.getElementById('ipProblemsSection');
  var ipProbList = document.getElementById('ipProblemsList');
  if (ipProb && ipProbList) {
    if (problems.length) {
      ipProbList.innerHTML = problems.map(function(p) {
        return '<li>' + _esc(p) + '</li>';
      }).join('');
      ipProb.style.display = 'block';
    } else {
      ipProb.style.display = 'none';
    }
  }

  // ── Features ──
  var features = a.features || [];
  var ipFeat = document.getElementById('ipFeaturesSection');
  var ipFeatList = document.getElementById('ipFeaturesList');
  if (ipFeat && ipFeatList) {
    if (features.length) {
      ipFeatList.innerHTML = features.map(function(f) {
        var title = typeof f === 'object' ? (f.title || '') : f;
        var desc  = typeof f === 'object' ? (f.desc  || '') : '';
        return '<div class="ip-feature-card">' +
          '<div class="ip-feat-title">' + _esc(title) + '</div>' +
          (desc ? '<div class="ip-feat-desc">' + _esc(desc) + '</div>' : '') +
        '</div>';
      }).join('');
      ipFeat.style.display = 'block';
    } else {
      ipFeat.style.display = 'none';
    }
  }

  // ── Tags ──
  var tags = a.tags || [];
  var ipTagsRow = document.getElementById('ipTagsRow');
  var ipTagsList = document.getElementById('ipTagsList');
  if (ipTagsRow && ipTagsList) {
    if (tags.length) {
      ipTagsList.innerHTML = tags.map(function(t) {
        return '<span class="ac-tag">' + _esc(t) + '</span>';
      }).join('');
      ipTagsRow.style.display = 'flex';
    } else {
      ipTagsRow.style.display = 'none';
    }
  }

  // ── Open ──
  var panel = document.getElementById('infoPanel');
  if (panel) { panel.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeInfoPanel() {
  var panel = document.getElementById('infoPanel');
  if (panel) panel.classList.remove('open');
  document.body.style.overflow = '';
}

function onInfoTry() {
  closeInfoPanel();
  setTimeout(function() { tryApp(_curAppData && _curAppData.id); }, 180);
}

function onInfoBuy() {
  closeInfoPanel();
  setTimeout(function() { openConfirmModal(_curAppData); }, 180);
}

function _ipSet(id, val) {
  var e = document.getElementById(id);
  if (e) e.textContent = val;
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

  // Populate top bar — safe helper, no innerHTML injection
  function _sid(id) { return document.getElementById(id); }
  function _setText(id, val) { var e = _sid(id); if (e) e.textContent = val; }

  // Icon: img set via JS, no onerror attribute
  var dovIcon = _sid('dovIcon');
  if (dovIcon) {
    dovIcon.innerHTML = '';
    if (a.thumbnailUrl && a.thumbnailUrl.trim()) {
      var iconImg = document.createElement('img');
      iconImg.src = a.thumbnailUrl;
      iconImg.alt = '';
      iconImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px';
      iconImg.onerror = function() { dovIcon.textContent = a.icon || '📱'; };
      dovIcon.appendChild(iconImg);
    } else {
      dovIcon.textContent = a.icon || '📱';
    }
  }

  _setText('dovTitle',   a.name || 'Application');
  _setText('dovPartner', (a.partner && a.partner !== 'à venir') ? 'Par ' + a.partner : '');
  _setText('dovPrice',   a.price || '');
  _setText('dovUrlBar',  (a.demoUrl || a.src || 'walaup.app/demo').replace(/^https?:\/\//, ''));

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
  if (e.key === 'Escape') { closeDemoOv(); closeConfirmModal(); closeInfoPanel(); }
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
