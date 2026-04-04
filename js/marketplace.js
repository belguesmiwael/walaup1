/* ════════════════════════════════════════════════════════
   HIVEAPP — marketplace.js
   Logique complète de la page Marketplace
   Dépend de : firebase-config.js (db), auth.js
════════════════════════════════════════════════════════ */

/* ── STATE ─────────────────────────────────────────────── */
var _allApps = [], _curFilter = 'all', _curAppData = null, _trialValidated = false;

/* ── STATIC FALLBACK APPS ──────────────────────────────── */
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

/* ── FIRESTORE LOAD ─────────────────────────────────────── */
var _firestoreLoaded = false;

db.collection('marketplace_apps').onSnapshot(
  function (snap) {
    _firestoreLoaded = true;
    var all = snap.docs.map(function (d) {
      var data = d.data();
      return Object.assign({ id: d.id }, data, { src: data.demoUrl || data.src || '' });
    });
    // Include apps where active is true OR undefined — exclude only explicitly false
    _allApps = all.filter(function (a) { return a.active !== false; });
    _allApps.sort(function (a, b) {
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
    if (!_allApps.length) { _allApps = STATIC_APPS; }
    renderGrid();
  },
  function (e) {
    console.warn('Firestore error:', e.code, e.message);
    var grid = document.getElementById('marketGrid');
    if (e.code === 'permission-denied' && grid) {
      grid.innerHTML =
        '<div class="market-empty" style="color:var(--red)">' +
        '<div style="font-size:2rem;margin-bottom:8px">🔒</div>' +
        '<div style="font-weight:700;margin-bottom:6px">Permissions Firestore insuffisantes</div>' +
        '<div style="font-size:.75rem;color:var(--mu)">Allez dans Firebase Console → Firestore → Rules<br>et autorisez la collection marketplace_apps</div>' +
        '</div>';
    }
    _allApps = STATIC_APPS;
    renderGrid();
  }
);

// Fallback: show static apps after 3.5s if Firestore hasn't responded
setTimeout(function () {
  if (!_firestoreLoaded) {
    console.log('Marketplace: Firestore timeout — using static apps');
    _allApps = STATIC_APPS;
    renderGrid();
  }
}, 3500);

/* ── FILTER ─────────────────────────────────────────────── */
function filterApps(cat, btn) {
  if(window.WalaupSound) WalaupSound.tab();
  _curFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderGrid();
}

/* ── RENDER GRID ────────────────────────────────────────── */
function renderGrid() {
  var grid = document.getElementById('marketGrid');
  if (!grid) return;
  var filtered = _allApps.filter(function (a) {
    return _curFilter === 'all' || a.category === _curFilter || a.cat === _curFilter;
  });
  if (!filtered.length) {
    grid.innerHTML = _curFilter !== 'all'
      ? '<div class="market-empty"><div style="font-size:2.5rem;margin-bottom:10px">🔍</div>Aucune application dans cette catégorie.</div>'
      : '<div class="market-empty"><div style="font-size:2.5rem;margin-bottom:10px">📭</div>Aucune application disponible pour le moment.</div>';
    return;
  }
  grid.innerHTML = filtered.map(function (a) {
    return '<div class="app-card" onclick="tryApp(\'' + a.id + '\')">' +
      (a.partner && a.partner !== 'à venir' ? '<div class="partner-badge">✓ Partenaire</div>' : '') +
      '<div style="display:flex;align-items:flex-start;gap:11px">' +
        '<div class="ac-icon">' + (a.icon || '📱') + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="ac-name">' + (a.name || 'Application') + '</div>' +
          (a.partner && a.partner !== 'à venir' ? '<div class="ac-partner">Par ' + a.partner + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="ac-desc">' + (a.description || '') + '</div>' +
      '<div class="ac-tags">' + (a.tags || []).map(function (t) { return '<span class="ac-tag">' + t + '</span>'; }).join('') + '</div>' +
      '<div class="ac-footer">' +
        '<div class="ac-price">' + (a.origPrice ? '<span class="ac-orig">' + a.origPrice + '</span>' : '') + (a.price || 'Sur devis') + '</div>' +
        '<div class="ac-btns">' +
          '<button class="btn-try" onclick="event.stopPropagation();tryApp(\'' + a.id + '\')">' +
            '<i class="ph-bold ph-eye"></i> Essayer</button>' +
          '<button class="btn-buy" onclick="event.stopPropagation();openConfirmModal(_allApps.find(function(x){return x.id===\'' + a.id + '\';}))">' +
            '<i class="ph-bold ph-shopping-cart-simple" style="color:#ffd600"></i> Acheter</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── TRY APP OVERLAY ────────────────────────────────────── */
function tryApp(id) {
  if(window.WalaupSound) WalaupSound.click();
  var a = _allApps.find(function (x) { return x.id === id; });
  if (!a) return;
  _curAppData = a; _trialValidated = false;
  document.getElementById('ovIcon').textContent = a.icon || '📱';
  document.getElementById('ovTitle').textContent = a.name || 'Application';
  document.getElementById('ovPrice').textContent = a.price || '';
  document.getElementById('ovPartner').textContent = (a.partner && a.partner !== 'à venir') ? 'Par ' + a.partner : '';
  document.getElementById('ovFrame').src = a.demoUrl || a.src || '';
  var badge = document.getElementById('trialBadge'); if (badge) badge.style.display = 'none';
  var btn = document.getElementById('btnTrialDone');
  if (btn) { btn.innerHTML = '<i class="ph-bold ph-check-circle" style="color:var(--green)"></i> Valider l\'essai'; btn.style.opacity = '1'; btn.style.pointerEvents = ''; }
  document.getElementById('demoOv').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDemoOv() {
  if(window.WalaupSound) WalaupSound.click();
  document.getElementById('demoOv').classList.remove('open');
  document.getElementById('ovFrame').src = '';
  document.body.style.overflow = '';
}

function validateTrial() {
  if(window.WalaupSound) WalaupSound.success();
  _trialValidated = true;
  var badge = document.getElementById('trialBadge');
  if (badge) { badge.style.display = 'flex'; setTimeout(function () { badge.style.display = 'none'; }, 3500); }
  var btn = document.getElementById('btnTrialDone');
  if (btn) { btn.textContent = '✅ Essai validé !'; btn.style.opacity = '.5'; btn.style.pointerEvents = 'none'; }
  setTimeout(function () { openConfirmModal(_curAppData); }, 800);
}

/* ── CONFIRM BUY MODAL ──────────────────────────────────── */
function openConfirmModal(a) {
  if (!a) return;
  _curAppData = a;
  closeDemoOv();
  document.getElementById('cfmIcon').textContent = a.icon || '📱';
  document.getElementById('cfmName').textContent = a.name || 'Application';
  document.getElementById('cfmPrice').textContent = a.price || 'Sur devis';
  var modal = document.getElementById('confirmModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeConfirmModal() {
  var modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── PROCEED TO BUY → client.html ───────────────────────── */
function proceedToBuy() {
  if(window.WalaupSound) WalaupSound.success();
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
  setTimeout(function () { window.location.href = 'client.html'; }, 1200);
}

/* ── TOAST HELPER ───────────────────────────────────────── */
function toast(msg, type) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast ' + (type || 'suc') + ' on';
  setTimeout(function () { t.className = 'toast'; }, 2800);
}

/* ── KEYBOARD & TOUCH ───────────────────────────────────── */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeDemoOv(); closeConfirmModal(); }
});

var _touchY0 = 0;
document.addEventListener('touchstart', function (e) { _touchY0 = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', function (e) {
  var dy = e.changedTouches[0].clientY - _touchY0;
  if (dy > 80) {
    if (document.getElementById('demoOv').classList.contains('open')) closeDemoOv();
    if (document.getElementById('confirmModal').classList.contains('open')) closeConfirmModal();
  }
}, { passive: true });
