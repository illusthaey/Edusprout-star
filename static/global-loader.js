// /static/global-loader.js
// 고주무관 브랜드 공통 로더: light-only, 공통 CSS/브랜드 UI 보정, 선택적 복사 보호
(function () {
  if (window.__GO_OFFICER_GLOBAL_LOADER__) return;
  window.__GO_OFFICER_GLOBAL_LOADER__ = true;

  const VERSION = "20260425-mm-brand";

  function ensureStyle() {
    const hasStyle = !!document.querySelector('link[href*="/static/style.css"]');
    if (hasStyle) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/static/style.css?v=" + VERSION;
    document.head.appendChild(link);
  }

  function ensureScript(src, attrs) {
    if (document.querySelector('script[src*="' + src + '"]')) return;
    const script = document.createElement("script");
    script.src = src + "?v=" + VERSION;
    if (attrs) Object.keys(attrs).forEach(function (key) { script.setAttribute(key, attrs[key]); });
    document.head.appendChild(script);
  }

  function ensureBrandStack() {
    ensureStyle();
    ensureScript("/static/brand-config.js");
    ensureScript("/static/brand-ui.js", { defer: "" });
  }

  function applyProtection() {
    const cfg = window.SITE_BRAND || {};
    if (cfg.copyProtection === false) return;

    const host = location.hostname || "";
    const allowed = [
      "edusprouthaey.co.kr",
      "eduworkhaey.co.kr",
      "savinghaey.co.kr",
      "archivinghaey.co.kr",
      "tftesthaey.co.kr",
      "localhost",
      "127.0.0.1"
    ];

    if (!allowed.includes(host)) return;

    const stop = function (event) {
      const target = event.target;
      if (target && target.closest && target.closest("input, textarea, [contenteditable='true'], .copy-block, .copy-card, .copy-box, pre, code")) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("contextmenu", stop, { capture: true, passive: false });
    document.addEventListener("selectstart", stop, { capture: true, passive: false });
    document.addEventListener("copy", stop, { capture: true, passive: false });

    document.addEventListener("keydown", function (event) {
      const key = String(event.key || "").toLowerCase();
      const target = event.target;
      const editable = target && target.closest && target.closest("input, textarea, [contenteditable='true'], pre, code");
      if (editable) return;
      if (event.keyCode === 123) event.preventDefault();
      if (event.ctrlKey && ["u", "s", "p", "i", "j", "k"].includes(key)) event.preventDefault();
      if (event.ctrlKey && event.shiftKey && ["i", "j", "c", "k"].includes(key)) event.preventDefault();
    }, true);
  }

  function init() {
    ensureBrandStack();
    applyProtection();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
