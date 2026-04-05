chrome.commands.onCommand.addListener(async (command) => {
  if (command === "grab-selection") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => { try { document.execCommand("copy"); } catch(e) {} }
      });

      await new Promise(r => setTimeout(r, 300));

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
              chrome.storage.local.set({ _ls: text.trim(), _lt: Date.now() });
              chrome.storage.local.get({ clips: [] }, (data) => {
                const clips = data.clips || [];
                if (clips.length > 0 && clips[0].text === text.trim()) return;
                clips.unshift({ text: text.trim(), time: Date.now(), url: location.href, title: document.title });
                if (clips.length > 50) clips.length = 50;
                chrome.storage.local.set({ clips });
              });
            }
          } catch(e) {}
        }
      });
    } catch(e) {}
  }
});
