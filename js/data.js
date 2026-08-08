/* =====================================================
   FALLBACK / DEMO DATA
   Used only when Firebase isn't configured yet, or a
   collection is empty — so the page never looks broken.
   Once Firestore has documents in a collection, those
   documents fully replace this list for that section.
===================================================== */
window.YF_DEFAULT_STATS = {
  communities: { value: "25", suffix: "+", visible: true },
  groups:      { value: "120", suffix: "+", visible: true },
  channels:    { value: "40", suffix: "+", visible: true },
  members:     { value: "10", suffix: "K+", visible: true },
};

window.YF_DEMO = {
  whatsapp_communities: [
    { name:"YouForge Community", description:"Official community for YouForge members.", memberCount:"2.5K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=800&auto=format&fit=crop", order:1, status:"active" },
    { name:"YouForge Traders Community", description:"Discuss, share and grow together.", memberCount:"1.8K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=800&auto=format&fit=crop", order:2, status:"active" },
    { name:"Premium Traders Community", description:"Premium traders' exclusive community.", memberCount:"1.2K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop", order:3, status:"active" }
  ],
  whatsapp_groups: [
    { name:"YouForge Trading Group", description:"Daily updates, signals & discussion.", memberCount:"3.2K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=200&auto=format&fit=crop", order:1, status:"active" },
    { name:"Binary Options Group", description:"Binary traders community.", memberCount:"2.1K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=200&auto=format&fit=crop", order:2, status:"active" },
    { name:"Quotex Traders Group", description:"Quotex signals & support.", memberCount:"1.7K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=200&auto=format&fit=crop", order:3, status:"active" }
  ],
  whatsapp_channels: [
    { name:"YouForge Market Wire", description:"Fast broadcast alerts for entries and exits.", memberCount:"4.6K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1590479773265-7464e5d48118?q=80&w=800&auto=format&fit=crop", order:1, status:"active" },
    { name:"Gold & Forex Desk", description:"Daily bias and levels on majors and metals.", memberCount:"3.9K", link:"https://wa.me/", image:"https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=800&auto=format&fit=crop", order:2, status:"active" }
  ],
  telegram_channels: [
    { name:"YouForge Announcements", description:"Product news and platform updates.", memberCount:"5.4K", link:"https://t.me/", image:"https://images.unsplash.com/photo-1611606063065-ee7946f0787a?q=80&w=800&auto=format&fit=crop", order:1, status:"active" },
    { name:"YouForge Signals", description:"Curated intraday trade ideas.", memberCount:"6.1K", link:"https://t.me/", image:"https://images.unsplash.com/photo-1642052519154-15a3151ec42a?q=80&w=800&auto=format&fit=crop", order:2, status:"active" },
    { name:"Crypto Forge", description:"On-chain trends and altcoin watchlists.", memberCount:"2.8K", link:"https://t.me/", image:"https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=800&auto=format&fit=crop", order:3, status:"active" }
  ],
  telegram_groups: [
    { name:"YouForge Live Chat", description:"General discussion for all members.", memberCount:"7.3K", link:"https://t.me/", image:"https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=200&auto=format&fit=crop", order:1, status:"active" },
    { name:"Options Talk", description:"Options strategy and Q&A.", memberCount:"1.4K", link:"https://t.me/", image:"https://images.unsplash.com/photo-1642790551116-18dbf8eb828d?q=80&w=200&auto=format&fit=crop", order:2, status:"active" }
  ],
  website: [
    { name:"YouForge Official Website", description:"Our main hub for trading resources, guides and updates.", link:"https://youforge.com", image:"https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=800&auto=format&fit=crop", order:1, status:"active" }
  ],
  contacts: [
    { type:"whatsapp", name:"WhatsApp Support", value:"+1 (000) 000-0000", link:"https://wa.me/", order:1, status:"active" },
    { type:"telegram", name:"Telegram Support", value:"@YouForgeSupport", link:"https://t.me/", order:2, status:"active" },
    { type:"email", name:"Email Us", value:"support@youforge.com", link:"mailto:support@youforge.com", order:3, status:"active" },
    { type:"website", name:"Website", value:"www.youforge.com", link:"https://youforge.com", order:4, status:"active" }
  ]
};
