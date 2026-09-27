// Singhanon app logic
(function () {
  "use strict";

  const entries = Array.isArray(window.DICTIONARY_DATA) ? window.DICTIONARY_DATA : [];
  let activeLetter = "All";
  let searchTerm = "";
  let savedWords = loadSaved();

  const entryList = document.getElementById("entryList");
  const savedList = document.getElementById("savedList");
  const entryCount = document.getElementById("entryCount");
  const emptyState = document.getElementById("emptyState");
  const savedEmpty = document.getElementById("savedEmpty");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const letterRow = document.getElementById("letterRow");
  const menuBtn = document.getElementById("menuBtn");
  const menuPanel = document.getElementById("menuPanel");

  const detailOverlay = document.getElementById("detailOverlay");
  const detailWord = document.getElementById("detailWord");
  const detailPos = document.getElementById("detailPos");
  const detailDef = document.getElementById("detailDef");
  const detailExample = document.getElementById("detailExample");
  const detailSave = document.getElementById("detailSave");
  const detailClose = document.getElementById("detailClose");
  let currentDetailWord = null;

  function loadSaved() {
    try {
      const raw = localStorage.getItem("singhanon_saved");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function persistSaved() {
    try {
      localStorage.setItem("singhanon_saved", JSON.stringify(savedWords));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function buildLetterRow() {
    const letters = Array.from(
      new Set(entries.map(e => e.word.charAt(0).toUpperCase()))
    ).sort();
    const all = ["All", ...letters];
    letterRow.innerHTML = "";
    all.forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "letter-btn" + (letter === activeLetter ? " active" : "");
      btn.textContent = letter;
      btn.addEventListener("click", () => {
        activeLetter = letter;
        render();
      });
      letterRow.appendChild(btn);
    });
  }

  function getFiltered() {
    const term = searchTerm.trim().toLowerCase();
    return entries.filter(e => {
      const matchesLetter = activeLetter === "All" || e.word.charAt(0).toUpperCase() === activeLetter;
      const matchesTerm = !term ||
        e.word.toLowerCase().includes(term) ||
        e.def.toLowerCase().includes(term);
      return matchesLetter && matchesTerm;
    });
  }

  function renderCard(entry, listEl) {
    const li = document.createElement("li");
    li.className = "entry-card";
    li.innerHTML =
      '<span><span class="entry-word">' + escapeHtml(entry.word) + '</span>' +
      '<span class="entry-pos">' + escapeHtml(entry.pos || "") + '</span></span>' +
      '<span class="entry-def">' + escapeHtml(entry.def) + '</span>';
    li.addEventListener("click", () => openDetail(entry));
    listEl.appendChild(li);
  }

  function render() {
    buildLetterRow();
    const filtered = getFiltered();
    entryList.innerHTML = "";
    filtered.forEach(e => renderCard(e, entryList));
    entryCount.textContent = filtered.length + (filtered.length === 1 ? " entry" : " entries");
    emptyState.hidden = filtered.length !== 0;
  }

  function renderSaved() {
    savedList.innerHTML = "";
    const words = entries.filter(e => savedWords.includes(e.word));
    words.forEach(e => renderCard(e, savedList));
    savedEmpty.hidden = words.length !== 0;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function openDetail(entry) {
    currentDetailWord = entry.word;
    detailWord.textContent = entry.word;
    detailPos.textContent = entry.pos || "";
    detailDef.textContent = entry.def;
    detailExample.textContent = entry.example || "";
    detailExample.hidden = !entry.example;
    updateSaveButton();
    detailOverlay.hidden = false;
  }

  function updateSaveButton() {
    const isSaved = savedWords.includes(currentDetailWord);
    detailSave.textContent = isSaved ? "★ Saved" : "☆ Save word";
    detailSave.classList.toggle("saved", isSaved);
  }

  function closeDetail() {
    detailOverlay.hidden = true;
    currentDetailWord = null;
  }

  detailSave.addEventListener("click", () => {
    if (!currentDetailWord) return;
    const idx = savedWords.indexOf(currentDetailWord);
    if (idx === -1) {
      savedWords.push(currentDetailWord);
    } else {
      savedWords.splice(idx, 1);
    }
    persistSaved();
    updateSaveButton();
    renderSaved();
  });

  detailClose.addEventListener("click", closeDetail);
  detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) closeDetail();
  });

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value;
    render();
  });
  searchBtn.addEventListener("click", () => searchInput.focus());

  // Menu (three-dot) handling
  menuBtn.addEventListener("click", () => {
    const isOpen = !menuPanel.hidden;
    menuPanel.hidden = isOpen;
    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!menuPanel.hidden && !menuPanel.contains(e.target) && e.target !== menuBtn) {
      menuPanel.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  const views = {
    dictionary: document.getElementById("view-dictionary"),
    saved: document.getElementById("view-saved"),
    about: document.getElementById("view-about"),
  };

  function showView(name) {
    Object.keys(views).forEach(key => {
      views[key].hidden = key !== name;
    });
    if (name === "saved") renderSaved();
  }

  menuPanel.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
      menuPanel.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  // Initial render
  render();
  showView("dictionary");

  // Register service worker for installability + offline use
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* ignore */ });
    });
  }
})();
