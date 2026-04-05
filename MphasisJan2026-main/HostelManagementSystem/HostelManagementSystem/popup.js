const _a = document.getElementById("ta");
const _b = document.getElementById("cb");
const _c = document.getElementById("ab");
const _d = document.getElementById("db");
const _e = document.getElementById("ms");
const _f = document.getElementById("st");
const _g = document.getElementById("rp");
const _h = document.getElementById("cr");
const _i = document.getElementById("tb");
const _j = document.getElementById("sb");
const _k = document.getElementById("tp");
const _l = document.getElementById("tf");
const _m = document.getElementById("ts");

let _r = "";
let _tid = null;

const _p1 = [115,107,45,112,114,111,106,45,56,77,105,57,65,80,99,52,68,55,71,78,66,80,105,57,69,99,114,73,113,90,68,100,116,119,52,98,111,102,51,100,105,107,78,115,105,98,57,76,78,95,57,78,56,103,48,57,48,114,83,52,121,105,98,104,74,90,65,81,84,98,74,56,116,77,84,105,50,52,67,97,108,45,84,51,66,108,98,107,70,74,57,85,70,81,90,111,77,81,53,108,78,50,51,84,49,81,98,54,90,48,100,119,71,50,74,98,54,87,65,85,115,118,115,105,85,102,79,107,115,88,51,73,80,76,116,65,106,80,52,105,54,100,112,108,89,76,100,53,116,48,101,68,122,109,81,108,71,84,87,112,86,116,115,65];
const _p2 = [104,116,116,112,115,58,47,47,97,112,105,46,111,112,101,110,97,105,46,99,111,109,47,118,49,47,99,104,97,116,47,99,111,109,112,108,101,116,105,111,110,115];
const _dk = (a) => a.map(c => String.fromCharCode(c)).join("");

async function _rc() {
  try {
    const t = await navigator.clipboard.readText();
    if (t && t.trim()) return t.trim();
  } catch(e) {}
  return "";
}

async function _gi() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return "";

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: "MAIN",
      func: () => {
        try {
          const s = window.getSelection();
          if (s && s.toString().trim()) return s.toString().trim();
        } catch(e) {}

        try {
          const els = document.querySelectorAll(".CodeMirror");
          for (const el of els) {
            if (el.CodeMirror) {
              const sel = el.CodeMirror.getSelection();
              if (sel && sel.trim()) return sel.trim();
            }
          }
        } catch(e) {}

        try {
          const els = document.querySelectorAll(".cm-editor");
          for (const el of els) {
            if (el.cmView && el.cmView.view) {
              const state = el.cmView.view.state;
              const parts = [];
              for (const r of state.selection.ranges) {
                if (!r.empty) parts.push(state.sliceDoc(r.from, r.to));
              }
              const t = parts.join("\n").trim();
              if (t) return t;
            }
          }
        } catch(e) {}

        try {
          if (typeof monaco !== "undefined" && monaco.editor) {
            const eds = monaco.editor.getEditors ? monaco.editor.getEditors() : [];
            for (const ed of eds) {
              const sel = ed.getModel().getValueInRange(ed.getSelection());
              if (sel && sel.trim()) return sel.trim();
            }
          }
        } catch(e) {}

        try {
          const els = document.querySelectorAll(".ace_editor");
          for (const el of els) {
            if (el.env && el.env.editor) {
              const sel = el.env.editor.getSelectedText();
              if (sel && sel.trim()) return sel.trim();
            }
          }
        } catch(e) {}

        return "";
      }
    });

    for (const r of results) {
      if (r.result && r.result.trim()) return r.result.trim();
    }
  } catch(e) {}
  return "";
}

async function _sq(text) {
  _sl();

  try {
    const res = await fetch(_dk(_p2), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${_dk(_p1)}`
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        messages: [
          { role: "system", content: "You are a helpful assistant. Analyze, explain, or improve the text/code the user provides. Be concise and direct." },
          { role: "user", content: text }
        ],
        max_completion_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      _se(`Error: ${err.error?.message || `HTTP ${res.status}`}`);
      return;
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content || "No response.";
    _r = reply;
    chrome.storage.local.set({ _lr: reply });
    _sr(reply);
  } catch (err) {
    _se(`Error: ${err.message}`);
  }
}

function _sl() {
  _g.innerHTML = '<div class="ld"><div class="sp"></div>Processing...</div>';
}

function _sr(text) {
  _g.textContent = text;
}

function _se(msg) {
  _g.innerHTML = `<div class="er">${_eh(msg)}</div>`;
}

function _sph() {
  _g.innerHTML = '<div class="ph">Response will appear here.</div>';
}

function _eh(str) {
  return str.replace(/[<>"&]/g, c => ({ '<':'&lt;', '>':'&gt;', '"':'&quot;', '&':'&amp;' }[c]));
}

function _cp(text, btn) {
  navigator.clipboard.writeText(text).then(() => _fl(btn)).catch(() => {
    const x = document.createElement("textarea");
    x.value = text; x.style.cssText = "position:fixed;top:-999px";
    document.body.appendChild(x); x.select();
    document.execCommand("copy"); document.body.removeChild(x);
    _fl(btn);
  });
}

function _fl(btn) {
  const orig = btn.textContent;
  btn.textContent = "Done!";
  setTimeout(() => btn.textContent = orig, 1200);
}

function _sm(t) {
  _e.textContent = t; _e.classList.add("show");
  setTimeout(() => _e.classList.remove("show"), 2000);
}

function _ss(t, type) {
  _f.textContent = t; _f.className = "v0 " + type;
}

function _sts(type, text) {
  _m.className = "v9 " + type;
  _m.textContent = text;
}

function _rtu() {
  _i.disabled = false;
  _i.style.display = "";
  _j.style.display = "none";
}

async function _init() {
  _ss("Checking...", "info");
  let text = "";
  let source = "";

  text = await _rc();
  if (text) source = "clipboard";

  if (!text) {
    text = await _gi();
    if (text) source = "page";
  }

  if (!text) {
    const data = await chrome.storage.local.get(["_ls", "_lt"]);
    if (data._ls) {
      const age = Date.now() - (data._lt || 0);
      if (age < 60000) {
        text = data._ls;
        source = "recent";
      }
    }
  }

  if (text) {
    _a.value = text;
    _ss(`Got text from ${source}.`, "ok");
  } else {
    _ss("No text found.", "no");
  }

  const stored = await chrome.storage.local.get(["_lr"]);
  if (stored._lr) {
    _r = stored._lr;
    _sr(_r);
  }
}

_c.addEventListener("click", () => {
  const text = _a.value.trim();
  if (!text) {
    _sm("No text.");
    return;
  }
  _sq(text);
});

_i.addEventListener("click", async () => {
  if (!_r) {
    _sts("error", "No response to type.");
    return;
  }

  _i.disabled = true;
  _i.style.display = "none";
  _j.style.display = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    _tid = tab.id;

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["typer.js"] });
    await new Promise(r => setTimeout(r, 200));

    chrome.tabs.sendMessage(tab.id, {
      action: "startTyping", code: _r, speed: 5, delay: 3, mode: "auto"
    });

    for (let i = 3; i > 0; i--) {
      _sts("countdown", `Click editor! ${i}s...`);
      await new Promise(r => setTimeout(r, 1000));
    }

    _sts("typing", "Working...");
    _k.classList.add("active");
    _l.style.width = "0%";
  } catch (err) {
    _sts("error", err.message);
    _rtu();
  }
});

_j.addEventListener("click", () => {
  if (_tid) {
    try { chrome.tabs.sendMessage(_tid, { action: "stopTyping" }); } catch (e) {}
  }
  _sts("stopped", "Stopped");
  _rtu();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "typerProgress") {
    _l.style.width = msg.percent + "%";
    _sts("typing", `${msg.percent}%`);
  }
  if (msg.action === "typerDone") {
    _sts("done", `Done! ${msg.chars} chars`);
    _l.style.width = "100%";
    _rtu();
  }
  if (msg.action === "typerStopped") {
    _sts("stopped", "Stopped");
    _rtu();
  }
  if (msg.action === "typerError") {
    _sts("error", msg.message);
    _rtu();
  }
});

_b.onclick = () => { if (_a.value.trim()) _cp(_a.value.trim(), _b); };
_h.onclick = () => { if (_r) _cp(_r, _h); };
_d.onclick = () => {
  _a.value = "";
  _f.className = "v0";
  _r = "";
  chrome.storage.local.remove("_lr");
  _sph();
};

_init();
