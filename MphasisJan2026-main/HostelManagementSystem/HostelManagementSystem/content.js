(function () {
  const style = document.createElement("style");
  style.textContent = "*, *::before, *::after { -webkit-user-select:text!important; user-select:text!important; }";
  (document.head || document.documentElement).appendChild(style);

  const origSet = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function (p, v, pri) {
    if (p === "user-select" || p === "-webkit-user-select") return;
    return origSet.call(this, p, v, pri);
  };

  const origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (["selectstart", "contextmenu"].includes(type)) return;
    return origAdd.call(this, type, fn, opts);
  };

  function stripHandlers(root) {
    (root || document).querySelectorAll("*").forEach(el => {
      el.removeAttribute("onselectstart");
      el.removeAttribute("oncontextmenu");
      el.removeAttribute("ondragstart");
    });
  }

  const initStrip = () => {
    stripHandlers();
    new MutationObserver(() => stripHandlers()).observe(
      document.documentElement, { childList: true, subtree: true }
    );
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initStrip);
  else initStrip();

  document.addEventListener("copy", (e) => {
    setTimeout(() => {
      let text = "";
      try {
        if (e.clipboardData) {
          text = e.clipboardData.getData("text/plain") || e.clipboardData.getData("text");
        }
      } catch(err) {}
      if (!text) text = getBasicSelection();
      if (text) saveText(text);
    }, 10);
  }, true);

  let lastSaved = "";

  function getBasicSelection() {
    try {
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) return sel.toString().trim();
    } catch(e) {}
    try {
      const el = document.activeElement;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
        if (el.selectionStart !== el.selectionEnd) {
          return el.value.substring(el.selectionStart, el.selectionEnd).trim();
        }
      }
    } catch(e) {}
    return "";
  }

  function saveText(text) {
    if (!text || text === lastSaved) return;
    lastSaved = text;
    try {
      chrome.storage.local.set({ _ls: text, _lt: Date.now() });
      chrome.storage.local.get({ clips: [] }, (data) => {
        if (chrome.runtime.lastError) return;
        const clips = data.clips || [];
        if (clips.length > 0 && clips[0].text === text) return;
        clips.unshift({ text, time: Date.now(), url: location.href, title: document.title });
        if (clips.length > 50) clips.length = 50;
        chrome.storage.local.set({ clips });
      });
    } catch(e) {}
  }

  function checkAndSave() {
    const text = getBasicSelection();
    if (text) saveText(text);
  }

  document.addEventListener("mouseup", () => setTimeout(checkAndSave, 80), true);
  document.addEventListener("keyup", (e) => {
    if (e.shiftKey || e.key === "Shift" || (e.ctrlKey && e.key === "a")) {
      setTimeout(checkAndSave, 80);
    }
  }, true);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "getSelection") {
      sendResponse({ text: getBasicSelection() || lastSaved || "" });
      return false;
    }
    if (msg.action === "triggerCopy") {
      try { document.execCommand("copy"); } catch(e) {}
      try {
        const el = document.activeElement || document.body;
        el.dispatchEvent(new KeyboardEvent("keydown", {
          key: "c", code: "KeyC", keyCode: 67,
          ctrlKey: true, bubbles: true, cancelable: true
        }));
      } catch(e) {}
      setTimeout(() => {
        try { sendResponse({ text: lastSaved || "" }); } catch(e) {}
      }, 200);
      return true;
    }
  });

})();
