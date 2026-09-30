/* ==========================================================================
   Blackberry Martin — behaviour
   Reads window.BBM from config.js. Every block no-ops safely if the elements
   or config values it needs aren't there.
   ========================================================================== */
(function () {
  'use strict';

  var CFG   = window.BBM || {};
  var GHL   = CFG.ghl || {};
  var LINKS = CFG.links || {};

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero video -------------------------------------------------------
     Sources are injected rather than hardcoded so config.js stays the single
     place to edit. With none set the poster image shows and nothing breaks.
     Skipped entirely for reduced-motion visitors — they keep the poster.
  ------------------------------------------------------------------------ */
  var video = $('[data-hero-video]');
  if (video) {
    // which entry in config.video this page wants
    var v = (CFG.video || {})[video.getAttribute('data-hero-video') || 'hero'] || {};
    if (v.poster) video.setAttribute('poster', v.poster);

    if (!reduceMotion && (v.webm || v.mp4)) {
      // webm first: browsers take the first type they can play, and it's the
      // smaller file wherever it's supported.
      if (v.webm) addSource(video, v.webm, 'video/webm');
      if (v.mp4)  addSource(video, v.mp4,  'video/mp4');
      video.load();
      var attempt = video.play();
      // Autoplay can still be refused (low power mode, data saver). That's
      // fine — the poster stays put, so don't let it throw.
      if (attempt && attempt.catch) attempt.catch(function () {});
    }
  }

  function addSource(el, src, type) {
    var s = document.createElement('source');
    s.src = src;
    s.type = type;
    el.appendChild(s);
  }

  /* ---- nav ------------------------------------------------------------- */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- mailing list popup ----------------------------------------------
     Fires once on a first visit, and from the Sign Up link any time. The
     footer bar catches everyone who dismisses it. Focus moves into the panel
     and back out on close, Escape closes it, and Tab is trapped while it's
     open — a modal you can't tab out of is a trap for keyboard users.
  ------------------------------------------------------------------------ */
  var POPUP_DELAY = (CFG.signup && typeof CFG.signup.popupDelay === 'number')
    ? CFG.signup.popupDelay : 6000;
  var STORAGE_KEY = 'bbm.signup.seen';

  var modal = $('#signup-modal');
  if (modal) {
    var panel = $('.modal__panel', modal);
    var lastFocus = null;

    // localStorage throws in some contexts (private windows, blocked site
    // data), so every access is guarded and falls back to "not seen".
    function seen() {
      try { return localStorage.getItem(STORAGE_KEY) === '1'; }
      catch (e) { return false; }
    }
    function markSeen() {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    }

    function openModal() {
      if (modal.classList.contains('is-open')) return;
      lastFocus = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      var first = $('input:not([tabindex="-1"])', modal);
      if (first) first.focus({ preventScroll: true });
      markSeen();
    }

    function closeModal() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      markSeen();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      window.setTimeout(function () {
        if (!modal.classList.contains('is-open')) modal.hidden = true;
      }, 450);
    }

    $$('[data-open-signup]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });

    $$('.modal__close', modal).forEach(function (b) { b.addEventListener('click', closeModal); });

    modal.addEventListener('click', function (e) {
      if (!panel.contains(e.target)) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
      if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
      var f = $$('a[href], button, input, select, textarea', panel)
        .filter(function (el) { return el.offsetParent !== null && el.tabIndex !== -1; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (POPUP_DELAY > 0 && !seen()) window.setTimeout(openModal, POPUP_DELAY);
  }

  /* ---- scroll reveal ---------------------------------------------------
     Deliberately NOT IntersectionObserver. IO only fires when an element
     crosses a threshold — an anchor jump or a flick scroll can carry a
     section from below the fold to above it while its intersection ratio
     stays 0 the whole way, so the callback never runs and the section is
     stuck invisible. A rAF-throttled sweep can't miss, and the list empties
     as items reveal so it costs nothing afterwards.
  ------------------------------------------------------------------------ */
  var pending = $$('.reveal');

  function sweep() {
    var limit = window.innerHeight * 0.9;
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().top < limit) {
        pending[i].classList.add('is-in');
        pending.splice(i, 1);
      }
    }
    if (!pending.length) {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    }
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; sweep(); });
  }

  if (pending.length) {
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('hashchange', queue);
    // 'load' waits on webfonts, so sweep sooner too — otherwise landing on an
    // #anchor shows a blank section for as long as the fonts take.
    window.addEventListener('load', queue);
    setTimeout(queue, 0);
    queue();
  }

  /* ---- marquee: duplicate the track so the loop is seamless ------------- */
  $$('.marquee__track').forEach(function (track) { track.innerHTML += track.innerHTML; });

  /* ---- links that aren't configured yet just disappear ------------------ */
  $$('[data-link]').forEach(function (el) {
    var key = el.getAttribute('data-link');
    var url = LINKS[key];
    if (url) {
      el.setAttribute('href', key === 'email' ? 'mailto:' + url : url);
    } else {
      (el.closest('li') || el).remove();
    }
  });

  /* ---- circular icon rows ----------------------------------------------- */
  var ICONS = {
    spotify:    'Spotify|M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.43a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.29.18.38.56.21.85zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07zm.11-2.84c-3.23-1.92-8.55-2.09-11.63-1.16a.93.93 0 1 1-.54-1.79c3.54-1.07 9.42-.86 13.13 1.34a.93.93 0 1 1-.96 1.61z',
    appleMusic: 'Apple Music|M21 3v13.55a3.45 3.45 0 1 1-2-3.13V7.62l-9 1.8v9.13a3.45 3.45 0 1 1-2-3.13V6.2z',
    bandcamp:   'Bandcamp|M2.5 18.5 8.9 5.5h12.6l-6.4 13z',
    youtube:    'YouTube|M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.6 15.6V8.4l6.2 3.6z',
    soundcloud: 'SoundCloud|M1 14.6v2.8h1.1v-2.8zm2.3-1.4v4.2h1.1v-4.2zm2.3-1.7v5.9h1.1v-5.9zm2.3-1.2v7.1h1.1v-7.1zm2.3-1.4v8.5h1.1V8.9zM13 7.4v10h6.1a3.85 3.85 0 0 0 .1-7.7 4 4 0 0 0-1-.1A5.15 5.15 0 0 0 13 7.4z',
    instagram:  'Instagram|M12 2.2c3.2 0 3.58 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.42-.37-1.06-.42-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.2 8.8 2.2 12 2.2zm0 5.75a4.05 4.05 0 1 0 0 8.1 4.05 4.05 0 0 0 0-8.1zm0 6.68a2.63 2.63 0 1 1 0-5.26 2.63 2.63 0 0 1 0 5.26zm5.16-6.84a.95.95 0 1 1-1.9 0 .95.95 0 0 1 1.9 0z',
    tiktok:     'TikTok|M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.82-2.47V9.7a5.68 5.68 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z'
  };
  var ICON_ORDER = ['spotify', 'appleMusic', 'bandcamp', 'youtube', 'soundcloud', 'instagram', 'tiktok'];

  $$('[data-icons]').forEach(function (row) {
    var html = '';
    ICON_ORDER.forEach(function (key) {
      var url = LINKS[key];
      if (!url) return;
      var parts = ICONS[key].split('|');
      html += '<li><a href="' + url + '" target="_blank" rel="noopener" aria-label="' + parts[0] + '">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + parts[1] + '"/></svg>' +
              '</a></li>';
    });
    if (html) { row.innerHTML = html; } else { row.remove(); }
  });

  /* ======================================================================
     Go High Level forms
     Containers carry data-ghl="newsletter" | "contact".
     A configured formId swaps in GHL's hosted embed; otherwise the styled
     form posts to the configured webhook.
     ====================================================================== */

  // The newsletter form appears in several places, so the same form ID can be
  // mounted more than once per page. GHL's own embed snippet hardcodes
  // id="inline-<formId>", which would give us duplicate element IDs — invalid,
  // and their resizer would only ever find the first one. Each mount gets a
  // unique id instead, and an explicit height so nothing depends on the
  // resizer running.
  var embedCount = 0;

  function mountEmbed(host, conf, title) {
    var f = document.createElement('iframe');
    f.src = 'https://api.leadconnectorhq.com/widget/form/' + conf.formId;
    f.style.width = '100%';
    f.style.height = (conf.height || 520) + 'px';
    f.style.border = 'none';
    f.style.borderRadius = '4px';
    f.title = title;
    f.id = 'inline-' + conf.formId + (embedCount ? '-' + embedCount : '');
    embedCount++;
    host.innerHTML = '';
    host.appendChild(f);

    if (!document.getElementById('ghl-embed-js')) {
      var s = document.createElement('script');
      s.id = 'ghl-embed-js';
      s.src = 'https://link.msgsndr.com/js/form_embed.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }

  function wireWebhookForm(form, conf) {
    var host   = form.closest('[data-ghl]');
    var status = $('.form__status', host) || $('.form__status', form.parentNode);
    var button = $('button[type="submit"]', form);
    var original = button ? button.textContent : '';

    function say(msg, state) {
      if (!status) return;
      status.textContent = msg;
      status.setAttribute('data-state', state || '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot — bots fill hidden fields, people don't
      var hp = form.querySelector('input[name="company_website"]');
      if (hp && hp.value) return;

      if (!conf.webhookUrl) {
        say('This form isn’t connected yet — add your GHL webhook URL in assets/js/config.js.', 'err');
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company_website') data[k] = v; });
      data.source = 'blackberrymartin.com';
      data.page = location.pathname;

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      say('');

      var body = JSON.stringify(data);

      function done(ok) {
        if (!ok) {
          say('Something went wrong. Try again, or email us directly.', 'err');
          if (button) { button.disabled = false; button.textContent = original; }
          return;
        }
        // Replace the form with a confirmation. A line of status text under a
        // still-filled-in form reads as "did that work?" — especially with no
        // welcome email going out yet.
        form.reset();
        var panel = document.createElement('div');
        panel.className = 'thanks';
        panel.setAttribute('role', 'status');
        panel.innerHTML =
          '<span class="thanks__mark" aria-hidden="true">&#10022;</span>' +
          '<p class="thanks__title">' + (form.getAttribute('data-thanks-title') || 'You’re on the list.') + '</p>' +
          '<p class="thanks__note">' + (form.getAttribute('data-thanks-note') ||
            'We’ll be in touch when there’s something worth telling you about — new music, shows, merch. Nothing else.') + '</p>';
        var slot = form.parentNode;
        form.remove();
        if (status && status.parentNode) status.remove();
        slot.appendChild(panel);
      }

      fetch(conf.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          done(true);
        })
        .catch(function () {
          // A cross-origin POST from the browser can be rejected at the
          // *response* while the request itself still arrives. Retry opaquely
          // rather than telling someone it failed when the contact was made.
          // Trade-off: no-cors responses can't be read, so this can only
          // report optimistically — watch GHL for the first few submissions.
          fetch(conf.webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: body
          })
            .then(function () { done(true); })
            .catch(function () { done(false); });
        });
    });
  }

  $$('[data-ghl]').forEach(function (host) {
    var key  = host.getAttribute('data-ghl');
    var conf = GHL[key] || {};
    var form = $('form', host);

    if (conf.formId) {
      mountEmbed(host, conf, key === 'contact' ? 'Contact form' : 'Mailing list signup');
    } else if (form) {
      wireWebhookForm(form, conf);
    }
  });

  /* ---- footer year ------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
