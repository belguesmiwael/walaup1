/* ════════════════════════════════════════════════════════
   Walaup — index.js  (Session 12 — Year 3000 Redesign)
   Space Grotesk + counters animés + marketplace preview
════════════════════════════════════════════════════════ */

/* ── i18n — Traductions FR / AR ── */
var T = {
fr: {
  nw:'Pourquoi nous', ns:'Solutions', nh:'Comment ça marche', nt:'Avis clients',
  nc:'Créer mon app',
  nlog:'Se connecter',
  hb:'Walaup — Custom Apps Studio',
  h1:'On transforme', h2:'votre business', h3:'en <span class="grad">application</span>',
  hs:'Automatisez votre business, gagnez du temps et éliminez les erreurs — app 100% sur mesure, livrée en quelques jours.',
  hc1:'Créer ma démo gratuite', hc2:'Voir les exemples',
  hp:'<strong>+20 clients</strong> font confiance à Walaup',
  sb1:'Clients satisfaits', sb2:'Délai livraison démo', sb4:'avant validation',
  pl:'Vous vous reconnaissez ?',
  pt:'Ces problèmes vous coûtent<br>du temps et de l\'argent',
  ps:'Si vous avez répondu oui à l\'un de ces problèmes, on a la solution.',
  p1t:'Trop de papier',       p1d:'Factures à la main, registres d\'erreurs qui vous font perdre des heures.',
  p2t:'Stock incontrôlable',  p2d:'Vous ne savez jamais exactement ce qu\'il reste en stock.',
  p3t:'Pertes invisibles',    p3d:'Erreurs de caisse, vols discrets — l\'argent disparaît chaque mois.',
  p4t:'Clients impayés',      p4d:'Dettes non suivies. Votre trésorerie en souffre.',
  p5t:'Employés non suivis',  p5d:'Présences, paiements — tout est dans votre tête.',
  p6t:'Aucune visibilité',    p6d:'Vous ne savez pas si votre business est vraiment rentable.',
  sl:'Notre solution',
  sti:'Une application', sti2:'100% adaptée',
  ssu:'Pas un template générique. Construite uniquement pour vous — disponible sur téléphone.',
  scta:'Je veux mon app',
  a1t:'App Café',       a1d:'Caisse anti-vol, commandes, employés',
  a2t:'App Stock',      a2d:'Entrées/sorties, alertes auto',
  a3t:'App Dettes',     a3d:'Clients débiteurs, relances',
  a4t:'App Crèche',     a4d:'Inscriptions, présences, parents',
  a5t:'App Livraison',  a5d:'Commandes, livreurs, suivi réel',
  a6t:'E-commerce TN',  a6d:'Boutique en ligne clé en main',
  hwl:'Processus',
  hwt:'Comment ça marche ?<br>Simple. Rapide. Sans risque.',
  hws:'5 étapes claires, sans surprise, sans paiement avant validation.',
  s1t:'Vous décrivez',  s1d:'Remplissez le formulaire.',
  s2t:'On crée la démo', s2d:'En 48h, prototype complet.',
  s3t:'Vous validez',   s3d:'Modifications illimitées.',
  s4t:'Paiement',       s4d:'Après validation seulement.',
  s5t:'Livraison',      s5d:'App déployée + support.',
  avl:'Pourquoi nous', avt:'Ce qui nous rend<br>différents',
  av1t:'Disponible sur téléphone',  av1d:'Mobile, tablette et PC. Accessible partout, 24h/24.',
  av2t:'100% sur mesure',           av2d:'Aucun template. Chaque écran conçu pour votre activité.',
  av3t:'Support local en arabe',    av3d:'On est en Tunisie, on parle votre langue.',
  av4t:'Simple à utiliser',         av4d:'Si vous savez WhatsApp, vous savez utiliser notre app.',
  armt:'Démo 100% Gratuite',
  armd:'Avant de payer un seul dinar, vous voyez votre application fonctionner en vrai. Notre engagement unique.',
  armn:'Personne d\'autre ne propose ça en Tunisie.',
  armb:'Je veux ma démo gratuite',
  tel:'Témoignages', tet:'Ils ont transformé leur business',
  tes:'De vraies entreprises tunisiennes, de vrais résultats.',
  t1q:'"Avant 3 cahiers pour mon café. Maintenant tout dans mon téléphone. Les vols à la caisse, éliminés."',
  t1r:'Propriétaire café — Tunis',
  t2q:'"J\'ai récupéré 4000 DT en un mois grâce au suivi automatique des dettes."',
  t2r:'Grossiste — Sfax',
  t3q:'"La démo gratuite m\'a convaincu en 5 min. Je suis tout depuis mon salon."',
  t3r:'Service livraison — Sousse',
  apl:'Exemples d\'apps', apt:'Voyez nos apps en action',
  aps:'Des interfaces pensées pour vos équipes — claires, rapides, sur téléphone.',
  sc1d:'Caisse, commandes, gestion employés',
  sc2d:'Stock, crédits clients, grossiste',
  sc3d:'Suivi dettes, clients débiteurs, relances',
  mpl:'Applications partenaires', mpt:'Apps créées pour nos clients<br>disponibles à la vente',
  mps:'Ces applications ont été développées pour nos partenaires. Achetez-en une et nous l\'adaptons à votre business en 48h.',
  mpall:'Voir toutes nos applications',
  fol:'Commencer maintenant',
  fot:'Accédez à votre<br><span style="background:linear-gradient(135deg,var(--ac),var(--ac2),var(--ac3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">espace client</span>',
  fos:'Connectez-vous en 1 clic — puis créez ou suivez votre application sur mesure.',
  gc1:'Continuer avec Google', gc2:'Téléphone', gc3:'Email',
  tr1:'Démo gratuite — 0 DT avant validation', tr2:'Réponse en 24 heures', tr3:'Sans engagement',
  ctl:'Prêt à changer ?', ctt:'Votre business mérite<br>mieux qu\'Excel et WhatsApp',
  cts:'Rejoignez les entrepreneurs tunisiens qui ont automatisé.',
  ctb:'Recevoir ma démo gratuite',
  ns:'Solutions', nh:'Comment ça marche', fce:'Mon espace client'
},
ar: {
  nw:'لماذا نحن', ns:'الحلول', nh:'كيف يعمل', nt:'آراء العملاء',
  nc:'عرض مجاني',
  nlog:'تسجيل الدخول',
  hb:'Walaup — تطبيقات مصممة لمشروعك',
  h1:'نحوّل', h2:'مشروعك', h3:'إلى تطبيق ذكي',
  hs:'وفّر وقتك، تخلّص من الأخطاء، واربح أكثر — تطبيق مصمم خصيصًا لك.',
  hc1:'احصل على عرضي المجاني', hc2:'اكتشف الأمثلة',
  hp:'<strong>+20 عميل</strong> يثقون في Walaup',
  sb1:'عملاء راضون', sb2:'وقت تسليم العرض', sb4:'قبل الموافقة',
  pl:'هل تعرف نفسك؟',
  pt:'هذه المشاكل تكلّفك<br>الوقت والمال',
  ps:'إذا أجبت بنعم، لدينا الحل.',
  p1t:'ورق وكراسات',          p1d:'فواتير يدوية تضيّع ساعات.',
  p2t:'مخزون غير مضبوط',      p2d:'لا تعرف ما تبقى في المخزن.',
  p3t:'خسائر خفية',           p3d:'أخطاء وسرقات صغيرة تتراكم.',
  p4t:'عملاء متأخرون',        p4d:'ديون غير متتبعة.',
  p5t:'موظفون غير متابَعون',  p5d:'الحضور والرواتب في رأسك.',
  p6t:'لا رؤية على الأرقام',  p6d:'لا تعرف إن كان مشروعك مربحًا.',
  sl:'حلنا', sti:'تطبيق', sti2:'مصمم 100%',
  ssu:'لا قوالب. مصنوع خصيصًا لك.',
  scta:'أريد تطبيقي',
  a1t:'تطبيق مقهى',   a1d:'صندوق مضاد للسرقة، طلبات',
  a2t:'تطبيق مخزن',   a2d:'دخول وخروج، تنبيهات',
  a3t:'تطبيق ديون',   a3d:'عملاء مدينون، تذكيرات',
  a4t:'تطبيق حضانة',  a4d:'تسجيلات، حضور',
  a5t:'تطبيق توصيل',  a5d:'طلبات، سائقون، متابعة',
  a6t:'متجر إلكتروني', a6d:'متجر جاهز للاستخدام',
  hwl:'الخطوات', hwt:'كيف يعمل؟<br>بسيط. سريع. بلا مخاطر.',
  hws:'5 خطوات واضحة.',
  s1t:'تصف احتياجك', s1d:'املأ النموذج.',
  s2t:'نصنع العرض',  s2d:'في 48 ساعة، نموذج كامل.',
  s3t:'تراجع وتوافق', s3d:'تعديلات غير محدودة.',
  s4t:'الدفع',       s4d:'فقط بعد موافقتك.',
  s5t:'التسليم',     s5d:'تطبيق مُطلق وتدريب.',
  avl:'لماذا نحن', avt:'ما يميزنا<br>عن الآخرين',
  av1t:'متاح على الهاتف',       av1d:'موبايل، لوحي وحاسوب.',
  av2t:'مصمم 100% لك',          av2d:'لا قوالب. كل شاشة لنشاطك.',
  av3t:'دعم محلي بالعربية',     av3d:'نحن في تونس، نتحدث لغتك.',
  av4t:'سهل الاستخدام',         av4d:'إذا تعرف واتساب، تعرف تطبيقك.',
  armt:'عرض مجاني 100%', armd:'شاهد تطبيقك قبل أن تدفع.',
  armn:'لا أحد غيرنا يقدم هذا في تونس.',
  armb:'أريد عرضي المجاني',
  tel:'شهادات العملاء', tet:'حوّلوا مشاريعهم', tes:'مؤسسات تونسية حقيقية.',
  t1q:'"كان عندي 3 كراريس. الآن كل شيء في هاتفي."', t1r:'صاحب مقهى — تونس',
  t2q:'"استرجعت 4000 دينار في شهر."', t2r:'تاجر جملة — صفاقس',
  t3q:'"العرض المجاني أقنعني. أتابع مشروعي من المنزل."', t3r:'خدمة توصيل — سوسة',
  apl:'إنجازاتنا', apt:'تطبيقاتنا في العمل', aps:'اضغط لتجربتها مباشرةً.',
  sc1d:'كاشير، طلبات، موظفون',
  sc2d:'مخزون، عملاء، ائتمان',
  sc3d:'ديون، عملاء، تقارير',
  mpl:'تطبيقات الشركاء', mpt:'تطبيقات جاهزة<br>للبيع والتعديل',
  mps:'اشترِ تطبيقاً واحداً ونعدّله لك في 48 ساعة.',
  mpall:'عرض جميع التطبيقات',
  fol:'ابدأ الآن',
  fot:'عرضك المجاني',
  fos:'سجّل دخولك لتقديم طلبك في دقيقتين.',
  gc1:'المتابعة بـ Google', gc2:'هاتف', gc3:'إيميل',
  tr1:'عرض مجاني — 0 دينار', tr2:'رد في 24 ساعة', tr3:'لا التزام',
  ctl:'جاهز للتغيير؟', ctt:'مشروعك يستحق<br>أفضل من إكسيل وواتساب',
  cts:'انضم إلى رواد الأعمال التونسيين.', ctb:'احصل على عرضي المجاني',
  ns:'الحلول', nh:'كيف يعمل', fce:'مساحتي الشخصية'
}
};

/* ── LANGUE ── */
var lang = localStorage.getItem('bzl') || 'fr';
function toggleLang() { lang = lang === 'fr' ? 'ar' : 'fr'; applyLang(); localStorage.setItem('bzl', lang); }
function applyLang() {
  var h = document.documentElement;
  h.lang = lang;
  h.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('langBtn').textContent = lang === 'fr' ? 'عربي' : 'FR';
  document.querySelectorAll('[data-k]').forEach(function(el) {
    var v = T[lang][el.dataset.k];
    if (v !== undefined) el.innerHTML = v;
  });
}
applyLang();

/* ── NAV SCROLL ── */
window.addEventListener('scroll', function() {
  document.getElementById('nav').classList.toggle('on', scrollY > 60);
}, { passive: true });

/* ── REVEAL OBSERVER ── */
var io = new IntersectionObserver(function(entries) {
  entries.forEach(function(x) {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.r,.r2,.r3,.r4,.r5,.r6,.g,.g2').forEach(function(el) { io.observe(el); });

/* ── COUNTER ANIMATION ── */
function animateCounter(el) {
  var target = parseInt(el.dataset.count || '0', 10);
  var suffix = el.dataset.suffix || '';
  var start  = 0;
  var duration = 1800;
  var startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    // ease out cubic
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

var countersDone = false;
var statsObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(x) {
    if (x.isIntersecting && !countersDone) {
      countersDone = true;
      document.querySelectorAll('.stat-num[data-count]').forEach(function(el) {
        animateCounter(el);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });
var statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

/* ── TIMELINE PROGRESS ── */
var tlDone = false;
var tlObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(x) {
    if (x.isIntersecting && !tlDone) {
      tlDone = true;
      var prog = document.getElementById('tlp');
      if (prog) setTimeout(function() { prog.style.width = '100%'; }, 300);
      var steps = document.querySelectorAll('.tls');
      steps.forEach(function(s, i) {
        setTimeout(function() { s.classList.add('act'); }, 350 + i * 280);
      });
    }
  });
}, { threshold: 0.3 });
var tl = document.getElementById('tl');
if (tl) tlObserver.observe(tl);

/* ── SCROLL TO AUTH ── */
window.scrollToAuth = function(e) {
  if (e) e.preventDefault();
  var el = document.getElementById('contact');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

/* ── ESTIMATEUR MODAL ── */
window.goEstimateur = function() {
  var m = document.getElementById('estModal');
  var f = document.getElementById('estFrame');
  if (!f.src) f.src = 'estimateur.html';
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.WalaupSound) WalaupSound.tab();
};
window.closeEst = function() {
  document.getElementById('estModal').classList.remove('open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeEst();
    closeAppModal();
    closeMarketModal();
  }
});

/* ── APPS DATA ── */
var APPS = [
  {
    name: 'Café Beb Lmdina',
    url: 'https://belguesmiwael.github.io/walaup1/demos/cafe/',
    price: 299
  },
  {
    name: 'RechargeHub TN',
    url: 'https://belguesmiwael.github.io/walaup1/demos/grossiste/',
    price: 349
  },
  {
    name: 'Debt Manager Pro',
    url: 'https://belguesmiwael.github.io/walaup1/demos/dettes/',
    price: 249
  }
];

/* ── APP MODAL ── */
window.openApp = function(idx) {
  var app  = APPS[idx];
  if (!app) return;
  var modal = document.getElementById('appModal');
  var frame = document.getElementById('mFrame');
  var name  = document.getElementById('mName');
  if (name) name.textContent = app.name;
  if (frame) frame.src = app.url || '';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.WalaupSound) WalaupSound.click();
  // Store current app for buy button
  window._curAppIdx = idx;
};
window.closeAppModal = function() {
  var modal = document.getElementById('appModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  var frame = document.getElementById('mFrame');
  if (frame) frame.src = '';
};
window.buyThisApp = function() {
  closeAppModal();
  var contact = document.getElementById('contact');
  if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  if (window.WalaupSound) WalaupSound.success();
};

/* ── MARKETPLACE PREVIEW — Load from Firestore ── */
var _mpApps = [];

function _esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function loadMarketplacePreview() {
  if (typeof db === 'undefined') return; // Firebase not ready
  db.collection('marketplace_apps').onSnapshot(function(snap) {
    var apps = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); })
      .filter(function(a) { return a.active !== false; })
      .sort(function(a, b) { return ((b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0)) - ((a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0)); })
      .slice(0, 3);
    if (apps.length > 0) {
      _mpApps = apps;
      renderMpPreview(apps);
    }
    // If no apps, keep the static fallback HTML
  }, function() {
    // Firestore error — keep static fallback
  });
}

function renderMpPreview(apps) {
  var track = document.getElementById('mpPreviewTrack');
  if (!track || !apps.length) return;

  // Icon mapping by keywords
  function getIcon(name) {
    if (!name) return 'ph-bold ph-app-window';
    var n = name.toLowerCase();
    if (n.includes('café') || n.includes('cafe') || n.includes('restaurant')) return 'ph-bold ph-coffee';
    if (n.includes('stock') || n.includes('grossiste') || n.includes('recharge')) return 'ph-bold ph-arrows-counter-clockwise';
    if (n.includes('dette') || n.includes('debt') || n.includes('finance')) return 'ph-bold ph-money';
    if (n.includes('livraison') || n.includes('delivery')) return 'ph-bold ph-motorcycle';
    if (n.includes('crèche') || n.includes('creche') || n.includes('école')) return 'ph-bold ph-baby';
    if (n.includes('commerce') || n.includes('boutique') || n.includes('shop')) return 'ph-bold ph-shopping-cart-simple';
    return 'ph-bold ph-device-mobile-camera';
  }

  function getThumbBg(name) {
    var n = (name || '').toLowerCase();
    if (n.includes('café') || n.includes('cafe')) return 'linear-gradient(135deg,#1A0B03,#E8A020)';
    if (n.includes('grossiste') || n.includes('stock') || n.includes('recharge')) return 'linear-gradient(135deg,#061a06,#34d399)';
    if (n.includes('dette') || n.includes('debt')) return 'linear-gradient(135deg,#0a0618,#b07cff)';
    if (n.includes('livraison')) return 'linear-gradient(135deg,#061826,#6c8fff)';
    return 'linear-gradient(135deg,#0a0a1a,#5c8eff)';
  }

  track.innerHTML = apps.map(function(app) {
    var icon = getIcon(app.name);
    var bg   = getThumbBg(app.name);
    var price = app.price ? app.price + ' DT' : '';
    var tags  = (app.tags || []).slice(0, 3);

    var tagsHtml = tags.map(function(t) {
      return '<span class="mp-tag">' + _esc(t) + '</span>';
    }).join('');
    if (!tagsHtml) {
      // Fallback tags from name
      tagsHtml = '<span class="mp-tag">App</span>';
    }

    return '<div class="mp-card g" data-app-id="' + _esc(app.id) + '">' +
      '<div class="mp-card-thumb" style="background:' + bg + '">' +
        (app.thumbnailUrl ? '' : '<i class="' + icon + '"></i>') +
      '</div>' +
      '<div class="mp-card-body">' +
        '<div class="mp-card-tags">' + tagsHtml + '</div>' +
        '<h4 class="mp-card-name">' + _esc(app.name) + '</h4>' +
        '<p class="mp-card-desc">' + _esc(app.description || '') + '</p>' +
        '<div class="mp-card-footer">' +
          '<div class="mp-card-price">' + _esc(price) + '</div>' +
          '<button class="btn-try-market" data-try-app-id="' + _esc(app.id) + '">' +
            '<i class="ph-bold ph-eye"></i> Essayer' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Images via JS (no _esc on src)
  apps.forEach(function(app) {
    if (!app.thumbnailUrl) return;
    var thumb = track.querySelector('[data-app-id="' + app.id + '"] .mp-card-thumb');
    if (!thumb) return;
    var img = document.createElement('img');
    img.src = app.thumbnailUrl;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    img.onerror = function() { img.remove(); };
    thumb.style.position = 'relative';
    thumb.appendChild(img);
  });

  // Events
  track.querySelectorAll('[data-try-app-id]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var appId = btn.getAttribute('data-try-app-id');
      var app = _mpApps.find(function(a) { return a.id === appId; });
      if (app) openMarketAppObj(app);
    });
  });
}

/* ── MARKET APP MODAL (index page) ── */
var STATIC_MARKET = [
  { name:'App Café & Restaurant', price:'299 DT', url:'https://belguesmiwael.github.io/walaup1/demos/cafe/' },
  { name:'App Grossiste / Recharge', price:'349 DT', url:'https://belguesmiwael.github.io/walaup1/demos/grossiste/' },
  { name:'App Suivi Dettes', price:'249 DT', url:'https://belguesmiwael.github.io/walaup1/demos/dettes/' }
];

window.openMarketApp = function(idx) {
  var app = _mpApps.length > idx ? _mpApps[idx] : STATIC_MARKET[idx];
  if (!app) return;
  openMarketAppObj(app);
};

function openMarketAppObj(app) {
  var modal = document.getElementById('marketModal');
  var frame = document.getElementById('mktFrame');
  var title = document.getElementById('mktTitle');
  var price = document.getElementById('mktPrice');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (title) title.textContent = app.name || 'Application';
  if (price) price.textContent = app.price ? app.price + ' DT' : (app.demoPrice || '');
  if (frame) frame.src = app.demoUrl || app.url || '';
  window._curMpApp = app;
  if (window.WalaupSound) WalaupSound.click();
}

window.closeMarketModal = function() {
  var modal = document.getElementById('marketModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  var frame = document.getElementById('mktFrame');
  if (frame) frame.src = '';
};

window.buyMarketApp = function() {
  closeMarketModal();
  var contact = document.getElementById('contact');
  if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  if (window.WalaupSound) WalaupSound.success();
};

/* ── PACKS ── */
window.choosePack = function(pack) {
  sessionStorage.setItem('bz_pack', pack);
  goEstimateur();
  if (window.WalaupSound) WalaupSound.tab();
};

/* ── AUTH ── */
(function() {
  var auth = window.firebase && firebase.auth ? firebase.auth() : null;
  if (!auth) return;

  function d(id) { return document.getElementById(id); }
  function ctaMsg(msg, type) {
    var el = d('ctaMsg');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-msg' + (type ? ' ' + type : ' err');
  }
  function ctaClear() {
    var el = d('ctaMsg');
    if (el) { el.className = 'auth-msg'; el.textContent = ''; }
  }

  window.ctaTab = function(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(function(b) { b.classList.remove('on'); });
    document.querySelectorAll('.auth-panel').forEach(function(p) { p.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    var panel = d('cta' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.classList.add('on');
    ctaClear();
    if (window.WalaupSound) WalaupSound.click();
  };

  window.ctaGoogle = async function() {
    ctaClear();
    var btn = d('ctaGBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Connexion...'; }
    try {
      var provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      if (window.WalaupSound) WalaupSound.success();
      ctaMsg('✅ Connecté ! Redirection...', 'ok');
      setTimeout(function() { window.location.href = 'client.html'; }, 900);
    } catch(e) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continuer avec Google'; }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      if (e.code === 'auth/unauthorized-domain') ctaMsg('⚠️ Domaine non autorisé dans Firebase Console');
      else if (e.code === 'auth/popup-blocked') ctaMsg('⚠️ Popup bloqué — autorisez les popups');
      else ctaMsg('❌ ' + (e.message || e.code));
    }
  };

  /* Phone OTP */
  var _cr = null, _rcv = null, _rt = null;
  d('ctaPhNum').oninput = function() { this.value = this.value.replace(/\D/g,''); };
  d('ctaEPass').onkeydown = function(e) { if (e.key === 'Enter') ctaDoEmail(); };

  function initRcap() {
    if (_rcv) return;
    try {
      _rcv = new firebase.auth.RecaptchaVerifier('rcap-cta', {
        size:'invisible', callback:function(){},
        'expired-callback':function(){ if(_rcv){try{_rcv.clear();}catch(e){}} _rcv=null; }
      });
    } catch(e) {}
  }

  window.ctaSendOTP = async function() {
    ctaClear();
    var num = d('ctaPhNum').value.trim();
    if (num.length < 8) { ctaMsg('Numéro invalide — 8 chiffres requis'); return; }
    var btn = d('ctaSendBtn'); btn.disabled=true; btn.textContent='⏳ Envoi SMS...';
    try {
      if (_rcv) { try{_rcv.clear();}catch(e){} } _rcv=null;
      initRcap();
      _cr = await auth.signInWithPhoneNumber('+216'+num, _rcv);
      d('ctaPhSent').textContent = '+216 '+num;
      d('ctaPh1').style.display='none'; d('ctaPh2').style.display='block';
      d('co1').focus();
      ctaMsg('✓ SMS envoyé !','ok');
      ['co1','co2','co3','co4','co5','co6'].forEach(function(id,i,arr) {
        var el=d(id);
        el.oninput=function(){
          this.value=this.value.replace(/\D/,'');
          if(this.value){this.classList.add('ok');if(arr[i+1])d(arr[i+1]).focus();ctaAutoVer();}
          else this.classList.remove('ok');
        };
        el.onkeydown=function(e){if(e.key==='Backspace'&&!this.value&&i>0)d(arr[i-1]).focus();};
      });
      var s=60; var rb=d('ctaRsBtn'); rb.disabled=true;
      clearInterval(_rt);
      _rt=setInterval(function(){s--;rb.textContent=s>0?'Renvoyer ('+s+'s)':'Renvoyer';if(s<=0){clearInterval(_rt);rb.disabled=false;}},1000);
    } catch(e) {
      btn.disabled=false; btn.textContent='Envoyer le code SMS';
      var m=e.message;
      if(e.code==='auth/invalid-phone-number') m='Numéro invalide.';
      if(e.code==='auth/too-many-requests') m='Trop de tentatives. Réessayez plus tard.';
      ctaMsg('❌ '+m);
      if(_rcv){try{_rcv.clear();}catch(e2){}} _rcv=null;
    }
  };

  function ctaAutoVer() {
    var code=['co1','co2','co3','co4','co5','co6'].map(function(id){return d(id).value;}).join('');
    if(code.length===6) ctaVerOTP();
  }

  window.ctaVerOTP = async function() {
    ctaClear();
    var code=['co1','co2','co3','co4','co5','co6'].map(function(id){return d(id).value;}).join('');
    if(code.length<6){ctaMsg('Entrez les 6 chiffres');return;}
    if(!_cr){ctaMsg('Session expirée. Renvoyez le SMS.');return;}
    var btn=d('ctaVerBtn'); btn.disabled=true; btn.textContent='⏳ Vérification...';
    try {
      await _cr.confirm(code);
      if(window.WalaupSound) WalaupSound.success();
      ctaMsg('✅ Connecté ! Redirection...','ok');
      setTimeout(function(){window.location.href='client.html';},900);
    } catch(e) {
      btn.disabled=false; btn.textContent='Vérifier';
      var m=e.message;
      if(e.code==='auth/invalid-verification-code') m='Code incorrect.';
      if(e.code==='auth/code-expired') m='Code expiré. Renvoyez le SMS.';
      ctaMsg('❌ '+m);
    }
  };

  window.ctaResetPh = function() {
    if(_rcv){try{_rcv.clear();}catch(e){}} _rcv=null; _cr=null;
    clearInterval(_rt);
    d('ctaPh2').style.display='none'; d('ctaPh1').style.display='block';
    ['co1','co2','co3','co4','co5','co6'].forEach(function(id){d(id).value='';d(id).classList.remove('ok');});
    ctaClear();
  };

  var _em='login';
  window.ctaEMode = function(m, btn) {
    _em=m;
    document.querySelectorAll('.etabs-s .etab-s').forEach(function(b){b.classList.remove('on');});
    btn.classList.add('on');
    d('ctaNameF').style.display=m==='register'?'flex':'none';
    d('ctaEBtn').innerHTML=(m==='login'?'Connexion':'Créer mon compte')+' <i class="ph-bold ph-arrow-right"></i>';
    ctaClear();
  };

  window.ctaDoEmail = async function() {
    ctaClear();
    var email=d('ctaEEmail').value.trim();
    var pass=d('ctaEPass').value;
    if(!email||!pass){ctaMsg('Email et mot de passe requis');return;}
    var btn=d('ctaEBtn');
    btn.disabled=true; btn.textContent='⏳ '+(_em==='login'?'Connexion...':'Création...');
    try {
      if(_em==='register'){
        var name=d('ctaEName').value.trim();
        var cr=await auth.createUserWithEmailAndPassword(email,pass);
        if(name) await cr.user.updateProfile({displayName:name});
      } else {
        await auth.signInWithEmailAndPassword(email,pass);
      }
      if(window.WalaupSound) WalaupSound.success();
      ctaMsg('✅ Connecté ! Redirection...','ok');
      setTimeout(function(){window.location.href='client.html';},900);
    } catch(e) {
      btn.disabled=false;
      btn.innerHTML=(_em==='login'?'Connexion':'Créer mon compte')+' <i class="ph-bold ph-arrow-right"></i>';
      var m=e.message;
      if(e.code==='auth/email-already-in-use') m='Email déjà utilisé — connectez-vous.';
      if(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'||e.code==='auth/invalid-login-credentials') m='Email ou mot de passe incorrect.';
      if(e.code==='auth/user-not-found') m='Aucun compte. Créez-en un.';
      if(e.code==='auth/weak-password') m='Mot de passe trop court (min. 6 caractères).';
      if(e.code==='auth/invalid-email') m='Email invalide.';
      if(e.code==='auth/too-many-requests') m='Trop de tentatives.';
      ctaMsg('❌ '+m);
    }
  };

  /* Si déjà connecté */
  auth.onAuthStateChanged(function(u) {
    if (u && window.location.hash !== '#stay') {
      var box = d('ctaAuthBox');
      if (box) box.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
        '<div style="font-size:1.8rem;margin-bottom:10px"><i class="ph-bold ph-hand-waving" style="color:var(--ac)"></i></div>' +
        '<div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:5px">Bonjour ' + (u.displayName||u.email||'').split(' ')[0] + '</div>' +
        '<div style="font-size:.76rem;color:var(--muted);margin-bottom:16px">Vous êtes connecté</div>' +
        '<a href="client.html" style="display:inline-flex;align-items:center;gap:8px;padding:11px 24px;border-radius:11px;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.86rem;text-decoration:none">' +
        'Mon espace <i class="ph-bold ph-arrow-right"></i></a>' +
        '</div>';
    }
  });
})();

// Sons : délégués à js/sound.js (WalaupSound)
window.HiveSound = window.WalaupSound || {};

// Load marketplace preview from Firestore
document.addEventListener('DOMContentLoaded', function() {
  loadMarketplacePreview();
});
