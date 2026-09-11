import './style.css'; 

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

// ==========================================
// 1. CLOCK LOGIC
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
// 2. WALLPAPER SYSTEM
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
        alert("Image is too large for storage. Please try a smaller file.");
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

  deleteBtn.addEventListener("click", () => {
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    noteEl.remove();
  });

  textarea.addEventListener("input", (e) => {
    note.text = e.target.value;
    saveNotes();
  });

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

function createNewStickyNote() {
  const offset = (notes.length % 6) * 28;
  const newNote = {
    id: Date.now().toString(),
    text: "",
    x: Math.max(20, window.innerWidth - 320 - offset),
    y: Math.max(80, 80 + offset)
  };

  notes.push(newNote);
  saveNotes();
  renderNoteElement(newNote);

  const newlyCreated = notesContainer.querySelector(`[data-id="${newNote.id}"] textarea`);
  if (newlyCreated) newlyCreated.focus();
}

addNoteBtn.addEventListener("click", createNewStickyNote);
renderAllNotes();

// ==========================================
// 4. FRIENDLY CALENDAR & GOOGLE IMPORT
// ==========================================
const calendarModal = document.querySelector("#calendar-modal");
const btnCloseCalendar = document.querySelector("#btn-close-calendar");
const calendarMonthTitle = document.querySelector("#calendar-month-title");
const calendarDaysGrid = document.querySelector("#calendar-days-grid");
const btnPrevMonth = document.querySelector("#btn-prev-month");
const btnNextMonth = document.querySelector("#btn-next-month");

const selectedDayLabel = document.querySelector("#selected-day-label");
const btnAddEventToggle = document.querySelector("#btn-add-event-toggle");
const eventForm = document.querySelector("#event-form");
const eventTitleInput = document.querySelector("#event-title-input");
const eventTimeInput = document.querySelector("#event-time-input");
const btnCancelEvent = document.querySelector("#btn-cancel-event");
const eventsContainer = document.querySelector("#events-container");

const gcalToggle = document.querySelector("#gcal-toggle");
const gcalPanel = document.querySelector("#gcal-panel");
const gcalFileInput = document.querySelector("#gcal-file-input");
const gcalStatus = document.querySelector("#gcal-status");

let calendarDate = new Date();
let selectedDateStr = new Date().toISOString().split("T")[0];
let calendarEvents = JSON.parse(localStorage.getItem("tab_calendar_events")) || {};

function saveCalendarEvents() {
  localStorage.setItem("tab_calendar_events", JSON.stringify(calendarEvents));
}

function openCalendar() {
  calendarModal.classList.remove("hidden");
  renderCalendar();
  renderSelectedDayEvents();
}

digitalDate.addEventListener("click", openCalendar);
analogDate.addEventListener("click", openCalendar);
btnCloseCalendar.addEventListener("click", () => calendarModal.classList.add("hidden"));

gcalToggle.addEventListener("click", () => {
  gcalPanel.classList.toggle("hidden");
});

btnPrevMonth.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

btnNextMonth.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  calendarMonthTitle.textContent = calendarDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  calendarDaysGrid.innerHTML = "";

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "cal-day empty";
    calendarDaysGrid.appendChild(emptyCell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayCell = document.createElement("div");
    dayCell.className = "cal-day";
    dayCell.textContent = d;

    const currentDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (currentDayStr === todayStr) dayCell.classList.add("today");
    if (currentDayStr === selectedDateStr) dayCell.classList.add("selected");

    if (calendarEvents[currentDayStr] && calendarEvents[currentDayStr].length > 0) {
      const dot = document.createElement("div");
      dot.className = "has-events-dot";
      dayCell.appendChild(dot);
    }

    dayCell.addEventListener("click", () => {
      selectedDateStr = currentDayStr;
      document.querySelectorAll(".cal-day").forEach(c => c.classList.remove("selected"));
      dayCell.classList.add("selected");
      renderSelectedDayEvents();
    });

    calendarDaysGrid.appendChild(dayCell);
  }
}

function renderSelectedDayEvents() {
  const dObj = new Date(selectedDateStr + "T00:00:00");
  selectedDayLabel.textContent = `Events for ${dObj.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}`;

  const dayEvents = calendarEvents[selectedDateStr] || [];
  eventsContainer.innerHTML = "";

  if (dayEvents.length === 0) {
    eventsContainer.innerHTML = `<p class="no-events-msg">No events scheduled for this day.</p>`;
    return;
  }

  dayEvents.forEach((ev, idx) => {
    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
      <div class="event-info">
        <span class="event-time">${ev.time || "All Day"}</span>
        <span class="event-title">${ev.title}</span>
      </div>
      <button class="btn-del-event" type="button" title="Delete event">✕</button>
    `;

    row.querySelector(".btn-del-event").addEventListener("click", () => {
      calendarEvents[selectedDateStr].splice(idx, 1);
      if (calendarEvents[selectedDateStr].length === 0) {
        delete calendarEvents[selectedDateStr];
      }
      saveCalendarEvents();
      renderCalendar();
      renderSelectedDayEvents();
    });

    eventsContainer.appendChild(row);
  });
}

btnAddEventToggle.addEventListener("click", () => {
  eventForm.classList.toggle("hidden");
  eventTitleInput.focus();
});

btnCancelEvent.addEventListener("click", () => {
  eventForm.classList.add("hidden");
  eventTitleInput.value = "";
  eventTimeInput.value = "";
});

eventForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = eventTitleInput.value.trim();
  const time = eventTimeInput.value;

  if (!title) return;

  if (!calendarEvents[selectedDateStr]) {
    calendarEvents[selectedDateStr] = [];
  }

  calendarEvents[selectedDateStr].push({ title, time });
  saveCalendarEvents();

  eventTitleInput.value = "";
  eventTimeInput.value = "";
  eventForm.classList.add("hidden");

  renderCalendar();
  renderSelectedDayEvents();
});

function parseICSData(icsText) {
  const lines = icsText.split(/\r\n|\n|\r/);
  let inEvent = false;
  let currentEvent = {};
  let count = 0;

  for (let line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      currentEvent = {};
    } else if (line.startsWith("END:VEVENT")) {
      inEvent = false;
      if (currentEvent.title && currentEvent.date) {
        if (!calendarEvents[currentEvent.date]) {
          calendarEvents[currentEvent.date] = [];
        }
        calendarEvents[currentEvent.date].push({
          title: currentEvent.title,
          time: currentEvent.time || "All Day"
        });
        count++;
      }
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.title = line.replace("SUMMARY:", "").trim();
      } else if (line.startsWith("DTSTART")) {
        const val = line.split(":")[1];
        if (val && val.length >= 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentEvent.date = `${y}-${m}-${d}`;
          if (val.includes("T") && val.length >= 13) {
            currentEvent.time = `${val.substring(9, 11)}:${val.substring(11, 13)}`;
          }
        }
      }
    }
  }

  saveCalendarEvents();
  renderCalendar();
  renderSelectedDayEvents();
  gcalStatus.textContent = `✓ Successfully imported ${count} events!`;
}

// Upload step for the friendly 2-step process
gcalFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => parseICSData(evt.target.result);
  reader.readAsText(file);
});

// ==========================================
// 5. SHORTCUTS (1: GITHUB, 2: REDDIT, 3: YOUTUBE)
// ==========================================
const DEFAULT_SHORTCUTS = [
  { name: "GitHub", url: "https://github.com" },
  { name: "Reddit", url: "https://reddit.com" },
  { name: "YouTube", url: "https://youtube.com" },
  null,
  null
];

let shortcuts = JSON.parse(localStorage.getItem("tab_shortcuts"));
if (!shortcuts || !Array.isArray(shortcuts) || shortcuts.length !== 5) {
  shortcuts = DEFAULT_SHORTCUTS;
  localStorage.setItem("tab_shortcuts", JSON.stringify(shortcuts));
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
// 6. BOTTOM DOCK (SPOTIFY, NASA, NEWS)
// ==========================================
const bottomDock = document.querySelector("#bottom-dock");
const tabBtnSpotify = document.querySelector("#tab-btn-spotify");
const tabBtnSpace = document.querySelector("#tab-btn-space");
const tabBtnNews = document.querySelector("#tab-btn-news");

const panelSpotify = document.querySelector("#panel-spotify");
const panelSpace = document.querySelector("#panel-space");
const panelNews = document.querySelector("#panel-news");
const drawerBody = document.querySelector("#drawer-body");

let activeTab = null;

function toggleDockTab(tabName) {
  if (activeTab === tabName) {
    bottomDock.classList.remove("open");
    tabBtnSpotify.classList.remove("active");
    tabBtnSpace.classList.remove("active");
    tabBtnNews.classList.remove("active");
    panelSpotify.classList.add("hidden");
    panelSpace.classList.add("hidden");
    panelNews.classList.add("hidden");
    activeTab = null;
  } else {
    bottomDock.classList.add("open");
    activeTab = tabName;

    tabBtnSpotify.classList.toggle("active", tabName === "spotify");
    tabBtnSpace.classList.toggle("active", tabName === "space");
    tabBtnNews.classList.toggle("active", tabName === "news");

    panelSpotify.classList.toggle("hidden", tabName !== "spotify");
    panelSpace.classList.toggle("hidden", tabName !== "space");
    panelNews.classList.toggle("hidden", tabName !== "news");

    if (tabName === "news") loadNews(currentNewsCat);
  }
}

tabBtnSpotify.addEventListener("click", () => toggleDockTab("spotify"));
tabBtnSpace.addEventListener("click", () => toggleDockTab("space"));
tabBtnNews.addEventListener("click", () => toggleDockTab("news"));

// --- Spotify Player & Presets Engine ---
const DEFAULT_SPOTIFY_SRC = "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0";
const spotifyIframe = document.querySelector("#spotify-iframe");
const spotifyUrlInput = document.querySelector("#spotify-url-input");
const btnLoadSpotify = document.querySelector("#btn-load-spotify");
const spotifyFeedback = document.querySelector("#spotify-feedback");

// Restore exact Spotify embed URL across tab refreshes
const savedSpotifySrc = localStorage.getItem("tab_spotify_embed") || DEFAULT_SPOTIFY_SRC;
spotifyIframe.src = savedSpotifySrc;

function formatSpotifyEmbed(input) {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("spotify:")) {
      const parts = trimmed.split(":");
      if (parts.length >= 3) {
        return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
      }
    }

    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("spotify.com")) return null;
    if (parsed.pathname.includes("/embed/")) return trimmed;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `https://open.spotify.com/embed/${segments[0]}/${segments[1]}?utm_source=generator&theme=0`;
    }
    return null;
  } catch {
    return null;
  }
}

function loadSpotifyLink(urlOrUri) {
  const embedUrl = formatSpotifyEmbed(urlOrUri);
  if (embedUrl) {
    spotifyIframe.src = embedUrl;
    localStorage.setItem("tab_spotify_embed", embedUrl);
    spotifyUrlInput.value = "";
    spotifyFeedback.textContent = "✓ Spotify player updated and saved!";
    spotifyFeedback.classList.remove("hidden");
    setTimeout(() => spotifyFeedback.classList.add("hidden"), 3000);
  } else {
    alert("Please enter a valid Spotify track, album, or playlist URL.");
  }
}

btnLoadSpotify.addEventListener("click", () => loadSpotifyLink(spotifyUrlInput.value));
spotifyUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadSpotifyLink(spotifyUrlInput.value);
});

document.querySelectorAll(".btn-preset").forEach(btn => {
  btn.addEventListener("click", () => {
    const uri = btn.dataset.uri;
    loadSpotifyLink(`https://open.spotify.com/playlist/${uri}`);
  });
});

// ==========================================
// 7. NASA SPACE ARTICLE
// ==========================================
function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function fetchSpaceArticle(isRandom = false) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const endpoint = isRandom
      ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&count=1`
      : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("NASA server timed out. Try again in a few seconds.");
    }
    throw err;
  }
}

async function loadSpaceArticle(isRandom = false) {
  drawerBody.innerHTML = `<p class="status-msg">Loading NASA space article...</p>`;

  try {
    let res = await fetchSpaceArticle(isRandom);

    if (res.status === 500 && !isRandom) {
      res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${getDateString(1)}`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || errData.msg || `NASA Error (${res.status})`);
    }

    const rawData = await res.json();
    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    const isImage = data.media_type === "image";
    const wallpaperUrl = data.hdurl || data.url;

    if (isImage) {
      currentSpaceImageUrl = wallpaperUrl;
      if (isAutoSpace && !isRandom) {
        applyWallpaper(wallpaperUrl);
      }
    }

    const media = !isImage
      ? `<iframe src="${data.url}" title="${data.title}" allowfullscreen></iframe>`
      : `<img src="${data.url}" alt="${data.title}" loading="eager" />`;

    const wallpaperActionHtml = isImage
      ? `<button id="btn-set-space-wallpaper" class="btn-space-action" type="button">🖼️ Set as Wallpaper</button>`
      : `<span class="video-wallpaper-notice" title="NASA video articles cannot be set as wallpaper backgrounds">🎥 Video Article (Cannot set as wallpaper)</span>`;

    drawerBody.innerHTML = `
      <header class="drawer-header">
        <div class="drawer-header-text">
          <h2>${data.title}</h2>
          <span class="photo-date">${data.date}</span>
        </div>
        <div class="drawer-actions">
          <button id="btn-random-space" class="btn-space-action" type="button">🎲 Surprise Space Article</button>
          ${wallpaperActionHtml}
        </div>
      </header>
      <div class="media-container">
        ${media}
      </div>
      <p class="explanation">${data.explanation}</p>
    `;

    const randomBtn = document.querySelector("#btn-random-space");
    randomBtn.addEventListener("click", () => {
      loadSpaceArticle(true);
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
        <p class="status-msg">Could not load space article: ${err.message}</p>
        <div class="drawer-actions">
          <button id="btn-retry-space" class="btn-space-action" type="button">Try Again</button>
        </div>
      </div>
    `;

    const retryBtn = document.querySelector("#btn-retry-space");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => loadSpaceArticle(true));
    }
  }
}

loadSpaceArticle();

// ==========================================
// 8. CATEGORIZED LIVE NEWS FEED (WITH IMAGES)
// ==========================================
const newsArticlesGrid = document.querySelector("#news-articles-grid");
let currentNewsCat = "top";

const NEWS_TOPIC_MAP = {
  top: "https://news.google.com/rss",
  business: "https://news.google.com/rss/headlines/section/topic/BUSINESS",
  technology: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY",
  entertainment: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT",
  science: "https://news.google.com/rss/headlines/section/topic/SCIENCE",
  sports: "https://news.google.com/rss/headlines/section/topic/SPORTS"
};

async function loadNews(category = "top") {
  newsArticlesGrid.innerHTML = `<p class="status-msg">Fetching live ${category} headlines...</p>`;

  const rssUrl = NEWS_TOPIC_MAP[category] || NEWS_TOPIC_MAP.top;
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      newsArticlesGrid.innerHTML = `<p class="status-msg">No articles found in this category.</p>`;
      return;
    }

    newsArticlesGrid.innerHTML = "";
    data.items.slice(0, 9).forEach((item) => {
      const card = document.createElement("a");
      card.className = "news-card";
      card.href = item.link;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const pubDate = new Date(item.pubDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });

      // Try to find image from rss2json output; fallback to placeholder if none exists
      const imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80';

      card.innerHTML = `
        <img src="${imageUrl}" class="news-card-img" alt="News Image" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80'" />
        <div class="news-card-title">${item.title}</div>
        <div class="news-card-footer">
          <span>${item.author || "News"}</span>
          <span>${pubDate}</span>
        </div>
      `;

      newsArticlesGrid.appendChild(card);
    });
  } catch (err) {
    newsArticlesGrid.innerHTML = `<p class="status-msg">Could not load news feed: ${err.message}</p>`;
  }
}

document.querySelectorAll(".btn-news-cat").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-news-cat").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentNewsCat = btn.dataset.cat;
    loadNews(currentNewsCat);
  });
});

// ==========================================
// 9. GLOBAL KEYBOARD SHORTCUTS
// ==========================================
const searchInput = document.querySelector("#search-input");
const keysHelpModal = document.querySelector("#keys-help-modal");
const btnShortcutsHelp = document.querySelector("#btn-shortcuts-help");
const btnCloseKeysHelp = document.querySelector("#btn-close-keys-help");

function toggleKeysModal() {
  keysHelpModal.classList.toggle("hidden");
}

btnShortcutsHelp.addEventListener("click", toggleKeysModal);
btnCloseKeysHelp.addEventListener("click", () => keysHelpModal.classList.add("hidden"));
keysHelpModal.addEventListener("click", (e) => {
  if (e.target === keysHelpModal) keysHelpModal.classList.add("hidden");
});

window.addEventListener("keydown", (e) => {
  const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);

  // Escape closes all open modals and bottom drawers
  if (e.key === "Escape") {
    modalOverlay.classList.add("hidden");
    keysHelpModal.classList.add("hidden");
    calendarModal.classList.add("hidden");
    bottomDock.classList.remove("open");
    tabBtnSpotify.classList.remove("active");
    tabBtnSpace.classList.remove("active");
    tabBtnNews.classList.remove("active");
    panelSpotify.classList.add("hidden");
    panelSpace.classList.add("hidden");
    panelNews.classList.add("hidden");
    activeTab = null;
    if (isTyping) document.activeElement.blur();
    return;
  }

  if (isTyping) return;

  if (e.key === "/") {
    e.preventDefault();
    searchInput.focus();
    return;
  }

  if (e.key === "?") {
    e.preventDefault();
    toggleKeysModal();
    return;
  }

  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    createNewStickyNote();
    return;
  }

  if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    const currentMode = localStorage.getItem("tab_clock_mode") || "digital";
    setClockMode(currentMode === "digital" ? "analog" : "digital");
    return;
  }

  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    toggleDockTab("spotify");
    return;
  }

  if (e.key === "a" || e.key === "A") {
    e.preventDefault();
    toggleDockTab("space");
    return;
  }

  if (e.key === "w" || e.key === "W") {
    e.preventDefault();
    toggleDockTab("news");
    return;
  }

  if (["1", "2", "3", "4", "5"].includes(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    const item = shortcuts[idx];
    if (item && item.url) {
      window.location.href = item.url;
    }
  }
});