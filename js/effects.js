/* ============================================================
   Walaup — effects.js  v1.0
   Chargé après sound.js, avant [page].js (dans tous les HTML)
   Modules : WalaupLoader · ScrollReveal · Ripple · Tilt ·
   Counters · CursorGlow · Particles · Magnetic · PageTrans ·
   ScrollBar · Toast unifié · Skeleton helpers
   ============================================================ */
(function() {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     1. HIVE LOADER — Cinematic boot screen
     ══════════════════════════════════════════════════════════ */
  var HiveLoader = (function() {
    var el = null;

    function inject() {
      if (document.getElementById('hive-loader')) return;
      var div = document.createElement('div');
      div.id = 'hive-loader';
      div.setAttribute('role', 'status');
      div.setAttribute('aria-label', 'Chargement Walaup');
      div.innerHTML =
        '<div class="hive-loader__hex">' +
          '<img src="icons/logo-icon.svg" alt="" class="hive-loader__logo-img" ' +
               'style="width:54px;height:54px;position:relative;z-index:2;animation:hive-pulse 3.5s ease-in-out infinite"/>' +
          '<div class="hive-loader__rings"></div>' +
        '</div>' +
        '<div class="hive-loader__wordmark">' +
          '<img src="icons/logo-text.svg" alt="Walaup" style="height:22px;opacity:.9;filter:brightness(1.1)"/>' +
        '</div>' +
        '<div class="hive-loader__bar"><div class="hive-loader__bar-fill"></div></div>';
      document.body.insertBefore(div, document.body.firstChild);
      el = div;
    }

    function hide(delay) {
      if (!el) el = document.getElementById('hive-loader');
      if (!el) return;
      setTimeout(function() {
        el.classList.add('hive-loader--hidden');
        setTimeout(function() { el.classList.add('hive-loader--gone'); }, 420);
      }, delay || 0);
    }

    function show() {
      if (!el) el = document.getElementById('hive-loader');
      if (!el) return;
      el.classList.remove('hive-loader--hidden', 'hive-loader--gone');
    }

    return { inject: inject, hide: hide, show: show };
  })();

  /* ══════════════════════════════════════════════════════════
     2. SCROLL REVEAL — IntersectionObserver [data-animate]
     ══════════════════════════════════════════════════════════ */
  var ScrollReveal = (function() {
    var obs = null;

    function init() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: show all
        document.querySelectorAll('[data-animate]').forEach(function(el) {
          el.classList.add('is-visible');
        });
        return;
      }
      obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

      document.querySelectorAll('[data-animate]').forEach(function(el) {
        obs.observe(el);
      });
    }

    // Re-observe dynamically added elements
    function observe(container) {
      if (!obs) return;
      var els = (container || document).querySelectorAll('[data-animate]:not(.is-visible)');
      els.forEach(function(el) { obs.observe(el); });
    }

    return { init: init, observe: observe };
  })();

  /* ══════════════════════════════════════════════════════════
     3. RIPPLE EFFECT — sur tous les boutons
     ══════════════════════════════════════════════════════════ */
  var RippleEffect = (function() {
    function createRipple(e, target) {
      var rect = target.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.5;
      var x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
      var y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
      var span = document.createElement('span');
      span.className = 'hive-ripple';
      span.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;';
      target.appendChild(span);
      setTimeout(function() { span.remove(); }, 700);
    }

    function init() {
      document.addEventListener('click', function(e) {
        var target = e.target.closest('button, .btn, .ripple-host, [data-ripple]');
        if (!target) return;
        if (!target.classList.contains('ripple-host')) {
          target.classList.add('ripple-host');
        }
        createRipple(e, target);
      }, true);
    }

    return { init: init };
  })();

  /* ══════════════════════════════════════════════════════════
     4. 3D TILT EFFECT — .card--tilt
     ══════════════════════════════════════════════════════════ */
  var TiltEffect = (function() {
    var intensity = 12;

    function applyTilt(el, x, y) {
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var rx = ((y - cy) / (rect.height / 2)) * -intensity;
      var ry = ((x - cx) / (rect.width / 2)) * intensity;
      el.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.02)';
      var shine = el.querySelector('.tilt-shine');
      if (shine) {
        var px = ((x - rect.left) / rect.width) * 100;
        var py = ((y - rect.top) / rect.height) * 100;
        shine.style.background = 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,255,255,.12) 0%, transparent 55%)';
      }
    }

    function resetTilt(el) {
      el.style.transform = '';
    }

    function attachToElement(el) {
      // inject shine layer if absent
      if (!el.querySelector('.tilt-shine')) {
        var s = document.createElement('div');
        s.className = 'tilt-shine';
        el.appendChild(s);
      }
      el.addEventListener('mousemove', function(e) {
        applyTilt(el, e.clientX, e.clientY);
      });
      el.addEventListener('mouseleave', function() {
        resetTilt(el);
      });
    }

    function init() {
      document.querySelectorAll('.card--tilt').forEach(attachToElement);
    }

    function observe(root) {
      (root || document).querySelectorAll('.card--tilt').forEach(attachToElement);
    }

    return { init: init, observe: observe };
  })();

  /* ══════════════════════════════════════════════════════════
     5. ANIMATED COUNTERS — .hive-counter[data-target]
     ══════════════════════════════════════════════════════════ */
  var CounterEffect = (function() {
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var duration = parseInt(el.getAttribute('data-duration') || '1400');
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var elapsed = ts - start;
        var progress = Math.min(elapsed / duration, 1);
        var val = easeOut(progress) * target;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    }

    function init() {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('.hive-counter[data-target]').forEach(function(el) {
        obs.observe(el);
      });
    }

    // Trigger stat pop animation
    function pop(el) {
      if (!el) return;
      el.classList.remove('popping');
      void el.offsetWidth;
      el.classList.add('popping');
      setTimeout(function() { el.classList.remove('popping'); }, 520);
    }

    return { init: init, pop: pop };
  })();

  /* ══════════════════════════════════════════════════════════
     6. CURSOR GLOW
     ══════════════════════════════════════════════════════════ */
  var CursorGlow = (function() {
    var el = null;
    var mx = 0, my = 0, cx = 0, cy = 0;
    var raf = null;

    function inject() {
      if (document.querySelector('.hive-cursor')) return;
      el = document.createElement('div');
      el.className = 'hive-cursor';
      document.body.appendChild(el);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      cx = lerp(cx, mx, 0.09);
      cy = lerp(cy, my, 0.09);
      if (el) el.style.transform = 'translate(' + (cx - 160) + 'px, ' + (cy - 160) + 'px)';
      raf = requestAnimationFrame(tick);
    }

    function init() {
      // Only on non-touch devices
      if ('ontouchstart' in window) return;
      inject();
      document.addEventListener('mousemove', function(e) {
        mx = e.clientX; my = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      document.addEventListener('mouseleave', function() {
        if (el) el.style.opacity = '0';
      });
      document.addEventListener('mouseenter', function() {
        if (el) el.style.opacity = '1';
      });
    }

    return { init: init };
  })();

  /* ══════════════════════════════════════════════════════════
     7. LIGHTWEIGHT PARTICLE SYSTEM (canvas)
     ══════════════════════════════════════════════════════════ */
  var ParticleSystem = (function() {
    var canvas, ctx, W, H, particles = [], raf;
    var count = 55;
    var colors = ['rgba(255,214,0,', 'rgba(108,143,255,', 'rgba(168,85,247,', 'rgba(255,170,0,'];

    function Particle() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.4 + 0.3;
      this.c = colors[Math.floor(Math.random() * colors.length)];
      this.a = Math.random() * 0.28 + 0.04;
      this.vx = (Math.random() - 0.5) * 0.18;
      this.vy = (Math.random() - 0.5) * 0.18;
      this.life = Math.random() * 200 + 100;
      this.age = 0;
    }

    Particle.prototype.update = function() {
      this.x += this.vx; this.y += this.vy; this.age++;
      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;
    };

    Particle.prototype.draw = function() {
      var fade = Math.min(this.age / 40, 1) * Math.min((this.life - this.age) / 40, 1);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c + (this.a * fade) + ')';
      ctx.fill();
    };

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(function(p, i) {
        p.update(); p.draw();
        if (p.age > p.life) particles[i] = new Particle();
      });
      raf = requestAnimationFrame(loop);
    }

    function init() {
      canvas = document.getElementById('hive-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hive-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);
      }
      ctx = canvas.getContext('2d');
      resize();
      for (var i = 0; i < count; i++) particles.push(new Particle());
      loop();
      window.addEventListener('resize', function() {
        resize();
        particles = [];
        for (var j = 0; j < count; j++) particles.push(new Particle());
      });
    }

    function destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (canvas) canvas.remove();
    }

    return { init: init, destroy: destroy };
  })();

  /* ══════════════════════════════════════════════════════════
     8. MAGNETIC BUTTONS — .btn-magnetic
     ══════════════════════════════════════════════════════════ */
  var MagneticEffect = (function() {
    function attach(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var dx = (e.clientX - rect.left - rect.width / 2) * 0.32;
        var dy = (e.clientY - rect.top - rect.height / 2) * 0.32;
        btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
      });
    }

    function init() {
      document.querySelectorAll('.btn-magnetic').forEach(attach);
    }

    function observe(root) {
      (root || document).querySelectorAll('.btn-magnetic').forEach(attach);
    }

    return { init: init, observe: observe };
  })();

  /* ══════════════════════════════════════════════════════════
     9. SCROLL PROGRESS BAR
     ══════════════════════════════════════════════════════════ */
  var ScrollBar = (function() {
    var bar = null;

    function inject() {
      bar = document.createElement('div');
      bar.id = 'hive-scroll-bar';
      bar.style.width = '0%';
      document.body.appendChild(bar);
    }

    function update() {
      var scrollEl = document.scrollingElement || document.documentElement;
      var pct = (scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight)) * 100;
      if (bar) bar.style.width = pct + '%';
    }

    function init() {
      inject();
      window.addEventListener('scroll', update, { passive: true });
    }

    return { init: init };
  })();

  /* ══════════════════════════════════════════════════════════
     10. UNIFIED TOAST SYSTEM
         Expose window.HiveToast.show(msg, type, duration)
         types: 'success' | 'error' | 'warn' | 'info'
     ══════════════════════════════════════════════════════════ */
  var HiveToast = (function() {
    var container = null;

    function ensureContainer() {
      if (!container) {
        container = document.getElementById('hive-toasts');
        if (!container) {
          container = document.createElement('div');
          container.id = 'hive-toasts';
          document.body.appendChild(container);
        }
      }
    }

    function show(msg, type, duration) {
      ensureContainer();
      type = type || 'info';
      duration = duration || 3200;

      var toast = document.createElement('div');
      toast.className = 'hive-toast hive-toast--' + type;
      toast.innerHTML =
        '<span class="hive-toast__dot"></span>' +
        '<span class="hive-toast__msg">' + msg + '</span>';

      container.appendChild(toast);

      setTimeout(function() {
        toast.classList.add('removing');
        setTimeout(function() { toast.remove(); }, 250);
      }, duration);
    }

    function success(msg, dur) { show(msg, 'success', dur); }
    function error(msg, dur)   { show(msg, 'error',   dur); }
    function warn(msg, dur)    { show(msg, 'warn',     dur); }
    function info(msg, dur)    { show(msg, 'info',     dur); }

    return { show: show, success: success, error: error, warn: warn, info: info };
  })();

  /* ══════════════════════════════════════════════════════════
     11. SKELETON HELPERS
         window.HiveSkeleton.show(container, template)
         window.HiveSkeleton.hide(container)
     ══════════════════════════════════════════════════════════ */
  var HiveSkeleton = (function() {
    var TEMPLATES = {
      card: '<div class="skeleton-wrap">' +
              '<div class="skeleton-row"><div class="skeleton skeleton--avatar"></div>' +
              '<div class="skeleton-col"><div class="skeleton skeleton--title" style="width:60%"></div>' +
              '<div class="skeleton skeleton--text" style="width:40%"></div></div></div>' +
              '<div class="skeleton skeleton--card"></div></div>',
      list: '<div class="skeleton-wrap">' +
              '<div class="skeleton-row"><div class="skeleton skeleton--avatar"></div>' +
              '<div class="skeleton-col"><div class="skeleton skeleton--text" style="width:70%"></div>' +
              '<div class="skeleton skeleton--text" style="width:45%"></div></div></div>'.repeat(4) +
            '</div>',
      stat: '<div class="skeleton-wrap" style="flex-direction:row;gap:16px">' +
              '<div class="skeleton" style="height:80px;border-radius:16px;flex:1"></div>'.repeat(3) +
            '</div>'
    };

    function show(container, template) {
      if (!container) return;
      container.setAttribute('data-skeleton-original', container.innerHTML);
      container.innerHTML = TEMPLATES[template] || TEMPLATES.card;
    }

    function hide(container) {
      if (!container) return;
      var orig = container.getAttribute('data-skeleton-original');
      if (orig !== null) {
        container.innerHTML = orig;
        container.removeAttribute('data-skeleton-original');
      }
    }

    return { show: show, hide: hide };
  })();

  /* ══════════════════════════════════════════════════════════
     12. PAGE TRANSITIONS helper
     ══════════════════════════════════════════════════════════ */
  var PageTransition = (function() {
    function enter(el) {
      if (!el) return;
      el.classList.remove('hive-view--exit');
      el.classList.add('hive-view');
    }

    function exit(el, cb) {
      if (!el) { if (cb) cb(); return; }
      el.classList.add('hive-view--exit');
      setTimeout(function() {
        el.classList.remove('hive-view', 'hive-view--exit');
        if (cb) cb();
      }, 250);
    }

    return { enter: enter, exit: exit };
  })();

  /* ══════════════════════════════════════════════════════════
     13. INIT — Boot sequence
     ══════════════════════════════════════════════════════════ */
  function boot() {
    // 1. Inject + show loader immediately
    HiveLoader.inject();

    // 2. Particles canvas (background ambiance)
    ParticleSystem.init();

    // 3. Scroll progress bar
    ScrollBar.init();

    // 4. Cursor glow (desktop only)
    CursorGlow.init();

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', function() {
      // 5. Scroll reveal
      ScrollReveal.init();

      // 6. Ripple on all buttons
      RippleEffect.init();

      // 7. Tilt on tilt cards
      TiltEffect.init();

      // 8. Magnetic buttons
      MagneticEffect.init();

      // 9. Counters
      CounterEffect.init();

      // 10. Hide loader after short delay (Firebase/content loads async)
      //     Pages that need longer loading call HiveLoader.hide(ms) themselves
      HiveLoader.hide(900);
    });
  }

  boot();

  /* ══════════════════════════════════════════════════════════
     EXPOSE PUBLIC API — window.HiveEffects
     ══════════════════════════════════════════════════════════ */
  window.HiveEffects = {
    loader:      HiveLoader,
    scroll:      ScrollReveal,
    ripple:      RippleEffect,
    tilt:        TiltEffect,
    counters:    CounterEffect,
    cursor:      CursorGlow,
    particles:   ParticleSystem,
    magnetic:    MagneticEffect,
    transition:  PageTransition,
    scrollBar:   ScrollBar,
    skeleton:    HiveSkeleton,
  };

  // Also expose shortcuts
  window.HiveToast    = HiveToast;
  window.HiveSkeleton = HiveSkeleton;

})();
