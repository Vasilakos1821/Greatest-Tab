import './style.css'; 

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

// ==========================================
// 1. CLOCK LOGIC (24H DIGITAL & ANALOG IPHONE)
// ==========================================
const digitalClockEl = document.querySelector("#digital-clock");
const analogClockEl = document.querySelector("#analog-clock");
const clockDigits = document.querySelector("#clock");
const digitalDate = document.querySelector("#current-date");
const analogDate = document.querySelector("#analog-date");

const hourHand = document.querySelector("#hour-hand");
const minuteHand = document.querySelector("#minute-hand");
const secondHand = document.querySelector("#second-hand");

const btnDigital = document.querySelector("#btn-digital");
const btnAnalog = document.querySelector("#btn-analog");

function setClockMode(mode) {
  if (mode === "analog") {
    digitalClockEl.classList.add("hidden");
    analogClockEl.classList.remove("hidden");
    btnAnalog.classList.add("active");
    btnDigital.classList.remove("active");
  } else {
    analogClockEl.classList.add("hidden");
    digitalClockEl.classList.remove("hidden");
    btnDigital.classList.add("active");
    btnAnalog.classList.remove("active");
  }
  localStorage.setItem("tab_clock_mode", mode);
}

btnDigital.addEventListener("click", () => setClockMode("digital"));
btnAnalog.addEventListener("click", () => setClockMode("analog"));

const savedMode = localStorage.getItem("tab_clock_mode") || "digital";
setClockMode(savedMode);

function updateClocks() {
  const now = new Date();

  const rawHours = now.getHours();
  const rawMinutes = now.getMinutes();
  const rawSeconds = now.getSeconds();

  const hh = String(rawHours).padStart(2, "0");
  const mm = String(rawMinutes).padStart(2, "0");
  const ss = String(rawSeconds).padStart(2, "0");
  clockDigits.textContent = `${hh}:${mm}:${ss}`;

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  digitalDate.textContent = dateStr;
  analogDate.textContent = dateStr;

  const secondDeg = (rawSeconds / 60) * 360;
  const minuteDeg = ((rawMinutes + rawSeconds / 60) / 60) * 360;
  const hourDeg = (((rawHours % 12) + rawMinutes / 60) / 12) * 360;

  secondHand.style.transform = `rotate(${secondDeg}deg)`;
  minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
  hourHand.style.transform = `rotate(${hourDeg}deg)`;
}

setInterval(updateClocks, 1000);
updateClocks();

// ==========================================
// 2. WALLPAPER SYSTEM (REVERTS TO USER WALLPAPER)
// ==========================================
const wallpaperInput = document.querySelector("#wallpaper-input");
const uploadBtn = document.querySelector("#btn-upload-wallpaper");
const resetBtn = document.querySelector("#btn-reset-wallpaper");
const autoSpaceToggle = document.querySelector("#toggle-auto-space");

let isAutoSpace = localStorage.getItem("tab_auto_space") === "true";
autoSpaceToggle.checked = isAutoSpace;
let currentSpaceImageUrl = null;

function applyWallpaper(dataUrl) {
  if (dataUrl) {
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url("${dataUrl}")`;
    document.body.classList.remove("default-bg");
    resetBtn.classList.remove("hidden");
  } else {
    document.body.style.backgroundImage = "";
    document.body.classList.add("default-bg");
    resetBtn.classList.add("hidden");
  }
}

function compressAndSaveImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);

      try {
        localStorage.setItem("tab_uploaded_wallpaper", compressedDataUrl);
        applyWallpaper(compressedDataUrl);

        isAutoSpace = false;
        autoSpaceToggle.checked = false;
        localStorage.setItem("tab_auto_space", "false");
      } catch (err) {
        alert("Image is still too large for localStorage quota. Try a smaller file.");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

uploadBtn.addEventListener("click", () => wallpaperInput.click());

wallpaperInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) compressAndSaveImage(file);
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("tab_uploaded_wallpaper");
  wallpaperInput.value = "";
  isAutoSpace = false;
  autoSpaceToggle.checked = false;
  localStorage.setItem("tab_auto_space", "false");
  applyWallpaper(null);
});

autoSpaceToggle.addEventListener("change", (e) => {
  isAutoSpace = e.target.checked;
  localStorage.setItem("tab_auto_space", isAutoSpace);

  if (isAutoSpace) {
    if (currentSpaceImageUrl) {
      applyWallpaper(currentSpaceImageUrl);
    }
  } else {
    // Return back to user's uploaded wallpaper
    const userWallpaper = localStorage.getItem("tab_uploaded_wallpaper");
    applyWallpaper(userWallpaper);
  }
});

if (!isAutoSpace) {
  const initialWallpaper = localStorage.getItem("tab_uploaded_wallpaper");
  applyWallpaper(initialWallpaper);
}

// ==========================================
// 3. MULTIPLE DRAGGABLE STICKY NOTES
// ==========================================
const notesContainer = document.querySelector("#notes-container");
const addNoteBtn = document.querySelector("#btn-add-note");

let notes = JSON.parse(localStorage.getItem("tab_notes_list")) || [];

function saveNotes() {
  localStorage.setItem("tab_notes_list", JSON.stringify(notes));
}

function renderNoteElement(note) {
  const noteEl = document.createElement("div");
  noteEl.className = "sticky-note-card";
  noteEl.dataset.id = note.id;
  noteEl.style.left = `${note.x}px`;
  noteEl.style.top = `${note.y}px`;

  noteEl.innerHTML = `
    <div class="sticky-note-header" title="Drag to reposition">
      <div class="drag-indicator">
        <span class="drag-dots">⋮⋮</span>
        <span>📝 Quick Note</span>
      </div>
      <div class="sticky-note-actions">
        <button class="btn-delete-note" type="button" title="Delete note">✕</button>
      </div>
    </div>
    <textarea placeholder="Type your thoughts, tasks, or links...">${note.text || ""}</textarea>
  `;

  const header = noteEl.querySelector(".sticky-note-header");
  const textarea = noteEl.querySelector("textarea");
  const deleteBtn = noteEl.querySelector(".btn-delete-note");

  // Delete note
  deleteBtn.addEventListener("click", () => {
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    noteEl.remove();
  });

  // Save text changes
  textarea.addEventListener("input", (e) => {
    note.text = e.target.value;
    saveNotes();
  });

  // Pointer dragging logic
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initLeft = 0;
  let initTop = 0;

  header.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;
    noteEl.classList.add("is-dragging");

    const rect = noteEl.getBoundingClientRect();
    initLeft = rect.left;
    initTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    header.setPointerCapture(e.pointerId);

    const onPointerMove = (evt) => {
      if (!isDragging) return;
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;

      let newLeft = initLeft + dx;
      let newTop = initTop + dy;

      const maxLeft = window.innerWidth - noteEl.offsetWidth - 10;
      const maxTop = window.innerHeight - noteEl.offsetHeight - 10;
      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));

      noteEl.style.left = `${newLeft}px`;
      noteEl.style.top = `${newTop}px`;

      note.x = newLeft;
      note.y = newTop;
    };

    const onPointerUp = (evt) => {
      if (!isDragging) return;
      isDragging = false;
      noteEl.classList.remove("is-dragging");

      header.removeEventListener("pointermove", onPointerMove);
      header.removeEventListener("pointerup", onPointerUp);
      header.removeEventListener("pointercancel", onPointerUp);

      try {
        header.releasePointerCapture(evt.pointerId);
      } catch {}

      saveNotes();
    };

    header.addEventListener("pointermove", onPointerMove);
    header.addEventListener("pointerup", onPointerUp);
    header.addEventListener("pointercancel", onPointerUp);
  });

  notesContainer.appendChild(noteEl);
}

function renderAllNotes() {
  notesContainer.innerHTML = "";
  notes.forEach(note => renderNoteElement(note));
}

addNoteBtn.addEventListener("click", () => {
  // Cascading offset for newly spawned notes
  const offset = (notes.length % 6) * 28;
  const newNote = {
    id: Date.now().toString(),
    text: "",
    x: Math.max(20, window.innerWidth - 330 - offset),
    y: Math.max(80, 80 + offset)
  };

  notes.push(newNote);
  saveNotes();
  renderNoteElement(newNote);

  // Focus textarea in newly added note
  const newlyCreated = notesContainer.querySelector(`[data-id="${newNote.id}"] textarea`);
  if (newlyCreated) newlyCreated.focus();
});

renderAllNotes();

// ==========================================
// 4. 5 SHORTCUTS (GITHUB, REDDIT, YOUTUBE DEFAULT)
// ==========================================
const DEFAULT_SHORTCUTS = [
  { name: "GitHub", url: "https://github.com" },
  { name: "Reddit", url: "https://reddit.com" },
  { name: "YouTube", url: "https://youtube.com" },
  null,
  null
];

let shortcuts = JSON.parse(localStorage.getItem("tab_shortcuts"));
if (!shortcuts || shortcuts.length !== 5) {
  shortcuts = DEFAULT_SHORTCUTS;
}

const shortcutsGrid = document.querySelector("#shortcuts-grid");
const modalOverlay = document.querySelector("#shortcut-modal");
const modalTitle = document.querySelector("#modal-title");
const shortcutForm = document.querySelector("#shortcut-form");
const nameInput = document.querySelector("#shortcut-name-input");
const urlInput = document.querySelector("#shortcut-url-input");
const cancelBtn = document.querySelector("#modal-cancel-btn");
const deleteBtn = document.querySelector("#modal-delete-btn");

let activeSlotIndex = null;
let dragSourceIndex = null;

window.addEventListener("click", () => {
  document.querySelectorAll(".shortcut-dropdown").forEach(el => el.remove());
});

function renderShortcuts() {
  shortcutsGrid.innerHTML = "";

  shortcuts.forEach((item, index) => {
    const slotEl = document.createElement("div");
    slotEl.className = `shortcut-slot ${item ? "filled" : "empty-slot"}`;
    slotEl.dataset.index = index;
    slotEl.setAttribute("draggable", "true");
    slotEl.title = item ? `${item.name} (Drag to reorder)` : "Empty slot (Click to add)";

    if (item) {
      const domain = new URL(item.url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      slotEl.innerHTML = `
        <button class="shortcut-menu-btn" title="Options" type="button">⋮</button>
        <div class="shortcut-icon-circle">
          <img src="${faviconUrl}" alt="${item.name}" onerror="this.src='https://www.google.com/favicon.ico'" />
        </div>
        <span class="shortcut-title">${item.name}</span>
      `;

      slotEl.addEventListener("click", (e) => {
        if (!e.target.closest(".shortcut-menu-btn") && !e.target.closest(".shortcut-dropdown")) {
          window.location.href = item.url;
        }
      });

      const menuBtn = slotEl.querySelector(".shortcut-menu-btn");
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openMenu(e, index, slotEl);
      });
    } else {
      slotEl.innerHTML = `
        <div class="shortcut-icon-circle">
          <span class="shortcut-plus-icon">+</span>
        </div>
        <span class="shortcut-title">Add</span>
      `;

      slotEl.addEventListener("click", () => openModal(index));
    }

    slotEl.addEventListener("dragstart", (e) => {
      dragSourceIndex = index;
      slotEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index);
    });

    slotEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      slotEl.classList.add("drag-over");
    });

    slotEl.addEventListener("dragleave", () => {
      slotEl.classList.remove("drag-over");
    });

    slotEl.addEventListener("drop", (e) => {
      e.preventDefault();
      slotEl.classList.remove("drag-over");

      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const toIndex = index;

      if (fromIndex !== toIndex) {
        const temp = shortcuts[fromIndex];
        shortcuts[fromIndex] = shortcuts[toIndex];
        shortcuts[toIndex] = temp;

        localStorage.setItem("tab_shortcuts", JSON.stringify(shortcuts));
        renderShortcuts();
      }
    });

    slotEl.addEventListener("dragend", () => {
      slotEl.classList.remove("dragging");
      document.querySelectorAll(".shortcut-slot").forEach(el => el.classList.remove("drag-over"));
    });

    shortcutsGrid.appendChild(slotEl);
  });
}

function openMenu(e, index, slotEl) {
  document.querySelectorAll(".shortcut-dropdown").forEach(el => el.remove());

  const dropdown = document.createElement("div");
  dropdown.className = "shortcut-dropdown";
  dropdown.innerHTML = `
    <button type="button" class="edit-btn">Edit shortcut</button>
    <button type="button" class="delete-btn">Remove</button>
  `;

  dropdown.querySelector(".edit-btn").addEventListener("click", (evt) => {
    evt.stopPropagation();
    dropdown.remove();
    openModal(index);
  });

  dropdown.querySelector(".delete-btn").addEventListener("click", (evt) => {
    evt.stopPropagation();
    dropdown.remove();
    shortcuts[index] = null;
    localStorage.setItem("tab_shortcuts", JSON.stringify(shortcuts));
    renderShortcuts();
  });

  slotEl.appendChild(dropdown);
}

function openModal(index) {
  activeSlotIndex = index;
  const current = shortcuts[index];

  if (current) {
    modalTitle.textContent = `Edit Shortcut`;
    nameInput.value = current.name;
    urlInput.value = current.url;
    deleteBtn.style.display = "block";
  } else {
    modalTitle.textContent = `Add Shortcut`;
    nameInput.value = "";
    urlInput.value = "";
    deleteBtn.style.display = "none";
  }

  modalOverlay.classList.remove("hidden");
  nameInput.focus();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  activeSlotIndex = null;
}

shortcutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (activeSlotIndex === null) return;

  let url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  shortcuts[activeSlotIndex] = {
    name: nameInput.value.trim() || "Shortcut",
    url: url
  };

  localStorage.setItem("tab_shortcuts", JSON.stringify(shortcuts));
  renderShortcuts();
  closeModal();
});

deleteBtn.addEventListener("click", () => {
  if (activeSlotIndex === null) return;
  shortcuts[activeSlotIndex] = null;
  localStorage.setItem("tab_shortcuts", JSON.stringify(shortcuts));
  renderShortcuts();
  closeModal();
});

cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

renderShortcuts();

// ==========================================
// 5. UNIFIED BOTTOM DOCK (SPOTIFY & SPACE PHOTO)
// ==========================================
const bottomDock = document.querySelector("#bottom-dock");
const tabBtnSpotify = document.querySelector("#tab-btn-spotify");
const tabBtnSpace = document.querySelector("#tab-btn-space");
const panelSpotify = document.querySelector("#panel-spotify");
const panelSpace = document.querySelector("#panel-space");
const drawerBody = document.querySelector("#drawer-body");

let activeTab = null;

function toggleDockTab(tabName) {
  if (activeTab === tabName) {
    bottomDock.classList.remove("open");
    tabBtnSpotify.classList.remove("active");
    tabBtnSpace.classList.remove("active");
    panelSpotify.classList.add("hidden");
    panelSpace.classList.add("hidden");
    activeTab = null;
  } else {
    bottomDock.classList.add("open");
    activeTab = tabName;

    if (tabName === "spotify") {
      tabBtnSpotify.classList.add("active");
      tabBtnSpace.classList.remove("active");
      panelSpotify.classList.remove("hidden");
      panelSpace.classList.add("hidden");
    } else {
      tabBtnSpace.classList.add("active");
      tabBtnSpotify.classList.remove("active");
      panelSpace.classList.remove("hidden");
      panelSpotify.classList.add("hidden");
    }
  }
}

tabBtnSpotify.addEventListener("click", () => toggleDockTab("spotify"));
tabBtnSpace.addEventListener("click", () => toggleDockTab("space"));

// --- Spotify Player & Volume Slider Logic ---
const DEFAULT_SPOTIFY_SRC = "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0";
const spotifyIframe = document.querySelector("#spotify-iframe");
const spotifyUrlInput = document.querySelector("#spotify-url-input");
const btnLoadSpotify = document.querySelector("#btn-load-spotify");
const btnDefaultSpotify = document.querySelector("#btn-default-spotify");
const volumeSlider = document.querySelector("#spotify-volume-slider");
const volumeVal = document.querySelector("#volume-val");

const savedSpotifySrc = localStorage.getItem("tab_spotify_embed") || DEFAULT_SPOTIFY_SRC;
spotifyIframe.src = savedSpotifySrc;

// Restore saved volume slider position
const savedVolume = localStorage.getItem("tab_spotify_volume") || "80";
volumeSlider.value = savedVolume;
volumeVal.textContent = `${savedVolume}%`;

volumeSlider.addEventListener("input", (e) => {
  const val = e.target.value;
  volumeVal.textContent = `${val}%`;
  localStorage.setItem("tab_spotify_volume", val);
});

function formatSpotifyEmbed(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("spotify.com")) return null;
    if (parsed.pathname.includes("/embed/")) return url;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `https://open.spotify.com/embed/${segments[0]}/${segments[1]}?utm_source=generator&theme=0`;
    }
    return null;
  } catch {
    return null;
  }
}

btnLoadSpotify.addEventListener("click", () => {
  const rawUrl = spotifyUrlInput.value.trim();
  const embedUrl = formatSpotifyEmbed(rawUrl);

  if (embedUrl) {
    spotifyIframe.src = embedUrl;
    localStorage.setItem("tab_spotify_embed", embedUrl);
    spotifyUrlInput.value = "";
  } else {
    alert("Please enter a valid Spotify track, album, or playlist link.");
  }
});

btnDefaultSpotify.addEventListener("click", () => {
  spotifyIframe.src = DEFAULT_SPOTIFY_SRC;
  localStorage.setItem("tab_spotify_embed", DEFAULT_SPOTIFY_SRC);
  spotifyUrlInput.value = "";
});

// ==========================================
// 6. NASA SPACE PHOTO (USER-FRIENDLY APOD)
// ==========================================
function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function getRandomDateString() {
  const start = new Date(1995, 5, 16).getTime();
  const end = new Date().getTime();
  const randomTime = start + Math.random() * (end - start);
  const randomDate = new Date(randomTime);
  return randomDate.toISOString().split("T")[0];
}

async function fetchSpacePhoto(date = null) {
  const endpoint = date
    ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
  return await fetch(endpoint);
}

async function loadSpacePhoto(customDate = null) {
  drawerBody.innerHTML = `<p class="status-msg">Fetching space snapshot...</p>`;

  try {
    let res = await fetchSpacePhoto(customDate);

    if (res.status === 500 && !customDate) {
      res = await fetchSpacePhoto(getDateString(1));
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || errData.msg || `NASA Error (${res.status})`);
    }

    const data = await res.json();
    const isImage = data.media_type === "image";
    const wallpaperUrl = data.hdurl || data.url;

    if (isImage) {
      currentSpaceImageUrl = wallpaperUrl;
      if (isAutoSpace && !customDate) {
        applyWallpaper(wallpaperUrl);
      }
    }

    const media = data.media_type === "video"
      ? `<iframe src="${data.url}" title="${data.title}" allowfullscreen></iframe>`
      : `<img src="${data.url}" alt="${data.title}" loading="eager" />`;

    const wallpaperBtnHtml = isImage
      ? `<button id="btn-set-space-wallpaper" class="btn-space-action" type="button">🖼️ Set as Wallpaper</button>`
      : "";

    drawerBody.innerHTML = `
      <header class="drawer-header">
        <div class="drawer-header-text">
          <h2>${data.title}</h2>
          <span class="photo-date">${data.date}</span>
        </div>
        <div class="drawer-actions">
          <button id="btn-random-space" class="btn-space-action" type="button">🎲 Surprise Space Photo</button>
          ${wallpaperBtnHtml}
        </div>
      </header>
      <div class="media-container">
        ${media}
      </div>
      <p class="explanation">${data.explanation}</p>
    `;

    const randomBtn = document.querySelector("#btn-random-space");
    randomBtn.addEventListener("click", () => {
      loadSpacePhoto(getRandomDateString());
    });

    if (isImage) {
      const spaceWallpaperBtn = document.querySelector("#btn-set-space-wallpaper");
      spaceWallpaperBtn.addEventListener("click", () => {
        localStorage.setItem("tab_uploaded_wallpaper", wallpaperUrl);
        isAutoSpace = false;
        autoSpaceToggle.checked = false;
        localStorage.setItem("tab_auto_space", "false");
        applyWallpaper(wallpaperUrl);

        spaceWallpaperBtn.classList.add("active");
        spaceWallpaperBtn.textContent = "✓ Wallpaper Applied!";
        setTimeout(() => {
          spaceWallpaperBtn.classList.remove("active");
          spaceWallpaperBtn.textContent = "🖼️ Set as Wallpaper";
        }, 2000);
      });
    }
  } catch (err) {
    drawerBody.innerHTML = `
      <div class="drawer-header">
        <p class="status-msg">Could not load space info: ${err.message}</p>
        <div class="drawer-actions">
          <button id="btn-retry-random" class="btn-space-action" type="button">Try Another Date</button>
        </div>
      </div>
    `;

    const retryBtn = document.querySelector("#btn-retry-random");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => loadSpacePhoto(getRandomDateString()));
    }
  }
}

loadSpacePhoto();