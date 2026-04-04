/* ════════════════════════════════════════════════════════
   WALAUP SOUND ENGINE v5 — Contextual
   Sons distincts par action :
   • click        — navigation générale (léger)
   • success      — confirmation / validation (montée joyeuse)
   • send         — message envoyé (pop doux)
   • receive      — message reçu (ding lumineux)
   • notif        — notification push (trio ascendant)
   • error        — erreur / refus (descente)
   • toggle       — switch on/off (bip court)
   • tab          — changement d'onglet (swoosh discret)
   Pure Web Audio API — aucun fichier externe
════════════════════════════════════════════════════════ */
(function () {
  var ctx = null, muted = false;

  /* Respect prefers-reduced-motion */
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) muted = true;
  mq.addEventListener('change', function (e) { if (e.matches) muted = true; });

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }

  /* ── CLICK — navigation générale ──────────────────────── */
  function playClick(strong) {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime, vol = strong ? 0.045 : 0.022;
    var buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.035), a.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 10) * vol * 8;
    }
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 1.2;
    var g = a.createGain();
    src.connect(f); f.connect(g); g.connect(a.destination);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
    src.start(t); src.stop(t + 0.035);
  }

  /* ── SUCCESS — validation / confirmation ──────────────── */
  function playSuccess() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    [523, 659, 784, 1047].forEach(function (freq, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + i * 0.055);
      g.gain.linearRampToValueAtTime(0.055, t + i * 0.055 + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.055 + 0.22);
      o.start(t + i * 0.055); o.stop(t + i * 0.055 + 0.23);
    });
  }

  /* ── SEND — message envoyé (pop léger ascendant) ─────── */
  function playSend() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    var o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(680, t + 0.09);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.048, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.start(t); o.stop(t + 0.13);
  }

  /* ── RECEIVE — message reçu (ding double doux) ────────── */
  function playReceive() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    [880, 1109].forEach(function (freq, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.042, t + i * 0.07 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.2);
      o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.21);
    });
  }

  /* ── NOTIF — notification push (trio ascendant) ───────── */
  function playNotif() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    [660, 880, 1047].forEach(function (freq, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + i * 0.1);
      g.gain.linearRampToValueAtTime(0.052, t + i * 0.1 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.19);
      o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2);
    });
  }

  /* ── ERROR — erreur / refus (descente grave) ──────────── */
  function playError() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    var o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.18);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.038, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.start(t); o.stop(t + 0.23);
  }

  /* ── TOGGLE — switch on/off (bip court) ──────────────── */
  function playToggle(isOn) {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    var o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = 'sine';
    o.frequency.value = isOn ? 880 : 440;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.start(t); o.stop(t + 0.09);
  }

  /* ── TAB — changement d'onglet (swoosh discret) ──────── */
  function playTab() {
    var a = ac(); if (!a || muted) return;
    var t = a.currentTime;
    var buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.06), a.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4) * 0.015;
    }
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000;
    var g = a.createGain();
    src.connect(f); f.connect(g); g.connect(a.destination);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.start(t); src.stop(t + 0.065);
  }

  /* ── AUTO-DETECT sur les clics ────────────────────────── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest(
      'button,a[href],.filter-btn,.fb,.nav-tab,.tab,.pack,' +
      '.proj-item,.client-item,.pay-method,.app-card,.sb-item,.demo-item'
    );
    if (!t) return;

    var id  = t.id || '';
    var cls = t.className || '';
    var txt = (t.textContent || '').toLowerCase().trim();

    /* Tab navigation */
    if (cls.includes('nav-tab') || cls.includes('sb-item') || cls.includes('filter-btn')) {
      playTab(); return;
    }
    /* Actions fortes */
    if (txt.match(/confirm|valid|envo|payer|créer|démarrer|commencer|obtenir|lancer|acheter|sauvegarder/)) {
      playSuccess(); return;
    }
    /* Erreur (boutons annuler/fermer) */
    if (txt.match(/annul|fermer|supprimer|refus/)) {
      playError(); return;
    }
    /* Bouton envoi message */
    if (id === 'sendBtn' || cls.includes('send') || txt === 'envoyer' || txt === '→' || txt.match(/^envo/)) {
      playSend(); return;
    }
    /* Default */
    playClick(false);
  }, { passive: true });

  /* Init AudioContext au premier geste */
  document.addEventListener('click', function () { ac(); }, { once: true, passive: true });

  /* ── API PUBLIQUE ─────────────────────────────────────── */
  window.WalaupSound = {
    click:   playClick,
    success: playSuccess,
    send:    playSend,
    receive: playReceive,
    notif:   playNotif,
    error:   playError,
    toggle:  playToggle,
    tab:     playTab,
    mute:    function () { muted = true; },
    unmute:  function () { muted = false; },
    toggle_mute: function () { muted = !muted; return !muted; }
  };

  /* Alias rétrocompatibilité */
  window.HiveSound = window.WalaupSound;
  window.BizSound  = window.WalaupSound;

})();
