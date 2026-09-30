/* ==========================================================================
   Blackberry Martin — site config
   This is the ONLY file you need to edit for links, video and Go High Level.
   Anything left as '' is treated as "not set up yet" and hides itself.
   ========================================================================== */

window.BBM = {

  /* ---- Background videos -----------------------------------------------
     One entry per page: `hero` is the home page, `music` is the Music page.
     The key comes from data-hero-video="..." on the <video> tag.

     Each is muted, looped and inline, so it plays forever without controls.
     Until a file is named here the poster image shows instead — nothing
     breaks. Give BOTH formats if you can: webm is smaller, mp4 is universal.
     Skipped entirely for visitors who've asked for reduced motion; they keep
     the poster.
  ------------------------------------------------------------------------ */
  video: {
    hero: {
      webm:   '',
      mp4:    'assets/video/hero.mp4',
      poster: 'assets/img/hero-poster.jpg'
    },
    music: {
      webm:   '',
      mp4:    'assets/video/music.mp4',
      poster: 'assets/img/music-poster.jpg'
    }
  },

  /* ---- Mailing list popup ----------------------------------------------
     The popup that appears on someone's first visit, for people who never
     click through to signup.html.
     popupDelay is milliseconds. Set it to 0 to switch the popup off and rely
     on the Sign Up page alone.
  ------------------------------------------------------------------------ */
  signup: {
    popupDelay: 6000
  },

  /* ---- Go High Level ----------------------------------------------------
     Two ways to wire each form. Pick ONE per form.

     A) EMBED — GHL hosts the form:
        GHL → Sites → Forms → your form → Integrate. Copy the ID out of
        the embed URL:
          https://api.leadconnectorhq.com/widget/form/aB3xYz9QwErTyUi
                                                      ^^^^^^^^^^^^^^^
        Paste it into formId. GHL handles submission entirely.

     B) WEBHOOK — we keep the site's styling (recommended):
        GHL → Automation → Workflows → new → trigger "Inbound Webhook".
        Copy the URL into webhookUrl, then add actions after it
        (Create/Update Contact, add a tag, notify you by email, etc).

     Embed wins if both are set. With neither, the form still renders and
     validates, and says it isn't connected yet.

     The newsletter form appears on signup.html and in the popup. Both are
     normal stacked forms, so either mode works — webhook keeps the site's
     styling, embed hands the whole thing to GHL.
  ------------------------------------------------------------------------ */
  ghl: {
    // Collects: first_name, email, city (city is for routing tour plans).
    // This form appears in three places — the Music page panel, signup.html,
    // and the popup — so set `height` to whatever GHL's preview shows or the
    // embed will be clipped.
    newsletter: {
      formId:     '',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/B8vKoR0awDxtgN78ZYOM/webhook-trigger/8528797f-ab5b-4c8d-a0e6-af42ed0443e2',
      height:     440
    },
    contact: {
      formId:     '',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/B8vKoR0awDxtgN78ZYOM/webhook-trigger/4f032b63-8fdd-4ba9-8fb6-02e011a76a2f',
      height:     620
    }
  },

  /* ---- Socials & streaming ---------------------------------------------
     These drive the circular icon rows. Leave any '' and it disappears.
  ------------------------------------------------------------------------ */
  links: {
    spotify:   '',
    appleMusic:'',
    bandcamp:  '',
    youtube:   '',
    soundcloud:'',
    instagram: '',
    tiktok:    '',
    email:     'blackberrymartinofficial@gmail.com'
  }
};
