/* =====================================================
   DEFAULT VALUES (not demo/fake content)
   These are only used once Firebase IS connected but the
   "settings/stats" document hasn't been created in Firestore
   yet — sensible starting numbers, editable from the admin
   panel's "Homepage Stats" tab.

   IMPORTANT: there is no fallback/demo content for the actual
   collections (Communities, Groups, Channels, Contacts,
   Website) anymore. If Firebase can't connect, those sections
   simply stay hidden — the site never shows placeholder or
   fake data to visitors.
===================================================== */
window.YF_DEFAULT_STATS = {
  communities: { value: "25", suffix: "+", visible: true },
  groups:      { value: "120", suffix: "+", visible: true },
  channels:    { value: "40", suffix: "+", visible: true },
  members:     { value: "10", suffix: "K+", visible: true },
};
