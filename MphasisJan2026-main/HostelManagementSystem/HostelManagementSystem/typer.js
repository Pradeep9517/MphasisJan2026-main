(function () {
  if (window.__autoTyperInjected) {
    window.__autoTyperStop = false;
    return;
  }
  window.__autoTyperInjected = true;
  window.__autoTyperStop = false;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "startTyping") {
      autoType(msg.code, msg.speed, msg.delay, msg.mode || "auto");
    }
    if (msg.action === "stopTyping") {
      window.__autoTyperStop = true;
    }
  });

  function sendMsg(data) {
    try { chrome.runtime.sendMessage(data); } catch (e) {}
  }

  async function autoType(code, speed, delay, mode) {
    window.__autoTyperStop = false;
    await sleep(delay * 1000);

    if (window.__autoTyperStop) { sendMsg({ action: "typerStopped" }); return; }

    if (mode === "auto" || mode === "bulk") {
      const success = document.execCommand("insertText", false, code);
      if (success) {
        await sleep(100);
        sendMsg({ action: "typerProgress", percent: 100 });
        sendMsg({ action: "typerDone", chars: code.length });
        return;
      }
      if (mode === "bulk") {
        sendMsg({ action: "typerError", message: "Bulk insert failed" });
        return;
      }
    }

    if (mode === "auto" || mode === "line") {
      const lines = code.split("\n");
      const totalLines = lines.length;
      let success = true;

      for (let i = 0; i < totalLines; i++) {
        if (window.__autoTyperStop) { sendMsg({ action: "typerStopped" }); return; }

        if (lines[i].length > 0) {
          const ok = document.execCommand("insertText", false, lines[i]);
          if (!ok) { success = false; break; }
        }

        if (i < totalLines - 1) {
          document.execCommand("insertText", false, "\n");
        }

        const percent = Math.round(((i + 1) / totalLines) * 100);
        sendMsg({ action: "typerProgress", percent });
        await sleep(speed * 3);
      }

      if (success) {
        sendMsg({ action: "typerDone", chars: code.length });
        return;
      }
      if (mode === "line") {
        sendMsg({ action: "typerError", message: "Line-by-line failed" });
        return;
      }
    }

    const total = code.length;
    for (let i = 0; i < total; i++) {
      if (window.__autoTyperStop) { sendMsg({ action: "typerStopped" }); return; }

      const char = code[i];
      const el = document.activeElement;
      const keyOpts = {
        key: char, keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
        bubbles: true, cancelable: true, composed: true
      };

      el.dispatchEvent(new KeyboardEvent("keydown", keyOpts));
      el.dispatchEvent(new KeyboardEvent("keypress", keyOpts));

      const inserted = document.execCommand("insertText", false, char);
      if (!inserted && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
        const s = el.selectionStart, e = el.selectionEnd;
        el.value = el.value.substring(0, s) + char + el.value.substring(e);
        el.selectionStart = el.selectionEnd = s + 1;
      }

      el.dispatchEvent(new InputEvent("input", {
        data: char, inputType: "insertText", bubbles: true, composed: true
      }));
      el.dispatchEvent(new KeyboardEvent("keyup", keyOpts));

      if (i % 50 === 0 || i === total - 1) {
        sendMsg({ action: "typerProgress", percent: Math.round(((i + 1) / total) * 100) });
      }
      await sleep(speed);
    }

    sendMsg({ action: "typerDone", chars: code.length });
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
})();
