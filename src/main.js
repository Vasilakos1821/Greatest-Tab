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
// 4. CALENDAR SYSTEM WITH .ICS IMPORT
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

const icsFileInput = document.querySelector("#ics-file-input");
const btnImportIcs = document.querySelector("#btn-import-ics");
const icsStatus = document.querySelector("#ics-status");

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

// .ics File Parser
btnImportIcs.addEventListener("click", () => icsFileInput.click());

icsFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    parseAndImportICS(evt.target.result);
    icsFileInput.value = "";
  };
  reader.readAsText(file);
});

function parseAndImportICS(icsRaw) {
  const unfolded = icsRaw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\n|\r/);

  let inEvent = false;
  let summary = "";
  let dtstart = "";
  let count = 0;

  for (let line of lines) {
    line = line.trim();
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      summary = "";
      dtstart = "";
    } else if (line === "END:VEVENT") {
      if (inEvent && summary && dtstart) {
        const dateMatch = dtstart.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateMatch) {
          const dateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          let timeStr = "All Day";
          const timeMatch = dtstart.match(/T(\d{2})(\d{2})/);
          if (timeMatch) {
            timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
          }

          if (!calendarEvents[dateStr]) calendarEvents[dateStr] = [];

          if (!calendarEvents[dateStr].find(ev => ev.title === summary && ev.time === timeStr)) {
            calendarEvents[dateStr].push({ title: summary, time: timeStr });
            count++;
          }
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith("SUMMARY")) {
        const idx = line.indexOf(":");
        if (idx !== -1) {
          summary = line.substring(idx + 1).replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' ').trim();
        }
      } else if (line.startsWith("DTSTART")) {
        const idx = line.indexOf(":");
        if (idx !== -1) {
          dtstart = line.substring(idx + 1).trim();
        }
      }
    }
  }

  saveCalendarEvents();
  renderCalendar();
  renderSelectedDayEvents();
  icsStatus.textContent = `✓ Successfully imported ${count} events!`;
  setTimeout(() => icsStatus.textContent = "", 4000);
}

// ==========================================
// 5. SHORTCUTS
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
// 6. BOTTOM DOCK (SPOTIFY, NASA, NEWS, WEATHER)
// ==========================================
const bottomDock = document.querySelector("#bottom-dock");
const tabBtnSpotify = document.querySelector("#tab-btn-spotify");
const tabBtnSpace = document.querySelector("#tab-btn-space");
const tabBtnNews = document.querySelector("#tab-btn-news");
const tabBtnWeather = document.querySelector("#tab-btn-weather");

const panelSpotify = document.querySelector("#panel-spotify");
const panelSpace = document.querySelector("#panel-space");
const panelNews = document.querySelector("#panel-news");
const panelWeather = document.querySelector("#panel-weather");
const drawerBody = document.querySelector("#drawer-body");

let activeTab = null;

function toggleDockTab(tabName) {
  if (activeTab === tabName) {
    bottomDock.classList.remove("open");
    tabBtnSpotify.classList.remove("active");
    tabBtnSpace.classList.remove("active");
    tabBtnNews.classList.remove("active");
    tabBtnWeather.classList.remove("active");

    panelSpotify.classList.add("hidden");
    panelSpace.classList.add("hidden");
    panelNews.classList.add("hidden");
    panelWeather.classList.add("hidden");
    activeTab = null;
  } else {
    bottomDock.classList.add("open");
    activeTab = tabName;

    tabBtnSpotify.classList.toggle("active", tabName === "spotify");
    tabBtnSpace.classList.toggle("active", tabName === "space");
    tabBtnNews.classList.toggle("active", tabName === "news");
    tabBtnWeather.classList.toggle("active", tabName === "weather");

    panelSpotify.classList.toggle("hidden", tabName !== "spotify");
    panelSpace.classList.toggle("hidden", tabName !== "space");
    panelNews.classList.toggle("hidden", tabName !== "news");
    panelWeather.classList.toggle("hidden", tabName !== "weather");

    if (tabName === "news") loadNews(currentNewsCat);
    if (tabName === "weather") requestWeather();
  }
}

tabBtnSpotify.addEventListener("click", () => toggleDockTab("spotify"));
tabBtnSpace.addEventListener("click", () => toggleDockTab("space"));
tabBtnNews.addEventListener("click", () => toggleDockTab("news"));
tabBtnWeather.addEventListener("click", () => toggleDockTab("weather"));

// --- Spotify Controls ---
const musicSearchInput = document.querySelector("#music-search-input");
const btnSearchMusic = document.querySelector("#btn-search-music");

const DEFAULT_SPOTIFY_SRC = "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0";
const spotifyIframe = document.querySelector("#spotify-iframe");
const btnDefaultSpotify = document.querySelector("#btn-default-spotify");
const spotifyFeedback = document.querySelector("#spotify-feedback");

const savedSpotifySrc = localStorage.getItem("tab_spotify_embed") || DEFAULT_SPOTIFY_SRC;
spotifyIframe.src = savedSpotifySrc;

function formatSpotifyEmbed(url) {
  try {
    const trimmed = url.trim();
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

async function executeMusicSearch() {
  const query = musicSearchInput.value.trim();
  if (!query) return;

  const spotifyEmbed = formatSpotifyEmbed(query);
  if (spotifyEmbed) {
    spotifyIframe.src = spotifyEmbed;
    localStorage.setItem("tab_spotify_embed", spotifyEmbed);
    musicSearchInput.value = "";
    
    spotifyFeedback.textContent = "✓ Spotify player updated and saved!";
    spotifyFeedback.classList.remove("hidden");
    setTimeout(() => spotifyFeedback.classList.add("hidden"), 3000);
    return;
  }

  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  window.open(searchUrl, "_blank", "noopener,noreferrer");

  spotifyFeedback.innerHTML = `🔍 Opened search for <strong>"${query}"</strong> on Spotify. (Tip: Copy its link to pin it here)`;
  spotifyFeedback.classList.remove("hidden");
  setTimeout(() => spotifyFeedback.classList.add("hidden"), 6000);
}

btnSearchMusic.addEventListener("click", executeMusicSearch);
musicSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") executeMusicSearch();
});

btnDefaultSpotify.addEventListener("click", () => {
  spotifyIframe.src = DEFAULT_SPOTIFY_SRC;
  localStorage.setItem("tab_spotify_embed", DEFAULT_SPOTIFY_SRC);
  musicSearchInput.value = "";
});

document.querySelectorAll(".btn-preset").forEach(btn => {
  btn.addEventListener("click", () => {
    const uri = btn.dataset.uri;
    const embedUrl = formatSpotifyEmbed(`https://open.spotify.com/playlist/${uri}`);
    spotifyIframe.src = embedUrl;
    localStorage.setItem("tab_spotify_embed", embedUrl);
  });
});

// ==========================================
// 7. NASA SPACE ARTICLE
// ==========================================
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

function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

loadSpaceArticle();

// ==========================================
// 8. LIVE NEWS FEED (UP-TO-THE-MINUTE RSS BRIDGE)
// ==========================================
const newsArticlesGrid = document.querySelector("#news-articles-grid");
let currentNewsCat = "top";

const NEWS_FEEDS = {
  top: "https://feeds.bbci.co.uk/news/rss.xml",
  business: "https://feeds.bbci.co.uk/news/business/rss.xml",
  technology: "https://feeds.bbci.co.uk/news/technology/rss.xml",
  entertainment: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  science: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  sports: "https://feeds.bbci.co.uk/sport/rss.xml"
};

const NEWS_FALLBACKS = {
  top: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
  business: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  entertainment: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=600&q=80",
  science: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80"
};

function extractImage(item, category) {
  if (item.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) {
    return item.thumbnail;
  }
  if (item.enclosure && item.enclosure.link && item.enclosure.link.startsWith("http")) {
    return item.enclosure.link;
  }
  const match = (item.description || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) return match[1];

  return NEWS_FALLBACKS[category] || NEWS_FALLBACKS.top;
}

async function loadNews(category = "top") {
  newsArticlesGrid.innerHTML = `<p class="status-msg">Fetching live headlines...</p>`;

  const feedUrl = NEWS_FEEDS[category] || NEWS_FEEDS.top;
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      newsArticlesGrid.innerHTML = `<p class="status-msg">No recent articles found in this category.</p>`;
      return;
    }

    newsArticlesGrid.innerHTML = "";

    data.items.slice(0, 9).forEach((item) => {
      const card = document.createElement("a");
      card.className = "news-card";
      card.href = item.link;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      }) : "Recent";

      const imageUrl = extractImage(item, category);
      const title = (item.title || "Headline").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

      card.innerHTML = `
        <img src="${imageUrl}" class="news-card-img" alt="News Image" onerror="this.src='${NEWS_FALLBACKS[category]}'" />
        <div class="news-card-title">${title}</div>
        <div class="news-card-footer">
          <span>${data.feed?.title || "News"}</span>
          <span>${pubDate}</span>
        </div>
      `;

      newsArticlesGrid.appendChild(card);
    });
  } catch (err) {
    newsArticlesGrid.innerHTML = `<p class="status-msg">Could not load live news feed: ${err.message}</p>`;
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
// 9. BROWSER-STYLE WEATHER & 5-DAY FORECAST
// ==========================================
const weatherContent = document.querySelector("#weather-content");
let cachedWeatherData = null;

function getWeatherMeta(code) {
  const map = {
    0: { text: "Clear Sky", icon: "☀️" },
    1: { text: "Mainly Clear", icon: "🌤️" },
    2: { text: "Partly Cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Foggy", icon: "🌫️" },
    48: { text: "Depositing Rime Fog", icon: "🌫️" },
    51: { text: "Light Drizzle", icon: "🌦️" },
    53: { text: "Moderate Drizzle", icon: "🌦️" },
    55: { text: "Dense Drizzle", icon: "🌧️" },
    56: { text: "Freezing Drizzle", icon: "🌨️" },
    61: { text: "Slight Rain", icon: "🌧️" },
    63: { text: "Moderate Rain", icon: "🌧️" },
    65: { text: "Heavy Rain", icon: "🌧️" },
    71: { text: "Slight Snow", icon: "🌨️" },
    73: { text: "Moderate Snow", icon: "❄️" },
    75: { text: "Heavy Snow", icon: "❄️" },
    80: { text: "Rain Showers", icon: "🌦️" },
    81: { text: "Heavy Showers", icon: "🌧️" },
    82: { text: "Violent Showers", icon: "⛈️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
    96: { text: "Thunderstorm + Hail", icon: "⛈️" }
  };
  return map[code] || { text: "Cloudy", icon: "🌤️" };
}

function requestWeather() {
  if (cachedWeatherData) {
    renderWeather(cachedWeatherData);
    return;
  }

  weatherContent.innerHTML = `<p class="status-msg">Detecting location & fetching forecast...</p>`;

  if (!navigator.geolocation) {
    weatherContent.innerHTML = `<p class="status-msg">Geolocation is not supported by your browser.</p>`;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

        const [res, geoRes] = await Promise.all([
          fetch(url),
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}`).catch(() => null)
        ]);

        const data = await res.json();
        let city = "Local Area";
        if (geoRes && geoRes.ok) {
          const geoData = await geoRes.json();
          city = geoData.city || geoData.locality || geoData.countryName || "Local Area";
        }

        data._locationName = city;
        cachedWeatherData = data;
        renderWeather(data);
      } catch (err) {
        weatherContent.innerHTML = `
          <div class="weather-prompt-state">
            <p class="status-msg">Could not load weather data (${err.message}).</p>
            <button id="btn-retry-weather" class="btn-dock-action">Retry</button>
          </div>
        `;
        document.querySelector("#btn-retry-weather")?.addEventListener("click", () => {
          cachedWeatherData = null;
          requestWeather();
        });
      }
    },
    (err) => {
      weatherContent.innerHTML = `
        <div class="weather-prompt-state">
          <p class="status-msg">📍 Location permission was denied. Please allow location access to view weather.</p>
          <button id="btn-grant-weather" class="btn-dock-action">Try Again</button>
        </div>
      `;
      document.querySelector("#btn-grant-weather")?.addEventListener("click", () => {
        cachedWeatherData = null;
        requestWeather();
      });
    }
  );
}

function renderWeather(data) {
  const cur = data.current;
  const curMeta = getWeatherMeta(cur.weather_code);
  const temp = Math.round(cur.temperature_2m);
  const feelsLike = Math.round(cur.apparent_temperature);
  const humidity = cur.relative_humidity_2m;
  const wind = Math.round(cur.wind_speed_10m);
  const todayPrecip = data.daily.precipitation_probability_max[0] || 0;
  const todayMax = Math.round(data.daily.temperature_2m_max[0]);
  const todayMin = Math.round(data.daily.temperature_2m_min[0]);

  // Build 5-Day Daily Cards
  let forecastCardsHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (!data.daily.time[i]) break;
    const dateObj = new Date(data.daily.time[i] + "T00:00:00");
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short" });
    const dateFormatted = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const dayCode = data.daily.weather_code[i];
    const dayMeta = getWeatherMeta(dayCode);
    const maxT = Math.round(data.daily.temperature_2m_max[i]);
    const minT = Math.round(data.daily.temperature_2m_min[i]);
    const rainP = data.daily.precipitation_probability_max[i] || 0;
    const dayWind = Math.round(data.daily.wind_speed_10m_max[i] || 0);

    forecastCardsHtml += `
      <div class="forecast-card">
        <span class="forecast-day-name">${dayName}</span>
        <span class="forecast-date">${dateFormatted}</span>
        <span class="forecast-icon">${dayMeta.icon}</span>
        <span class="forecast-condition">${dayMeta.text}</span>
        <span class="forecast-hi-lo">${maxT}° / ${minT}°</span>
        <span class="forecast-rain">💧 ${rainP}%</span>
        <span class="forecast-wind">💨 ${dayWind} km/h</span>
      </div>
    `;
  }

  weatherContent.innerHTML = `
    <div class="weather-today-card">
      <div class="weather-today-left">
        <div class="weather-huge-icon">${curMeta.icon}</div>
        <div class="weather-today-temp-box">
          <div class="weather-today-temp">${temp}°C</div>
          <div class="weather-today-condition">${curMeta.text}</div>
          <span class="weather-location-label">📍 ${data._locationName || "Local Area"}</span>
        </div>
      </div>

      <div class="weather-metrics-grid">
        <div class="weather-metric-tile">
          <span class="metric-label">Feels Like</span>
          <span class="metric-val">${feelsLike}°C</span>
        </div>
        <div class="weather-metric-tile">
          <span class="metric-label">Precipitation</span>
          <span class="metric-val">💧 ${todayPrecip}%</span>
        </div>
        <div class="weather-metric-tile">
          <span class="metric-label">Wind Speed</span>
          <span class="metric-val">💨 ${wind} km/h</span>
        </div>
        <div class="weather-metric-tile">
          <span class="metric-label">Humidity</span>
          <span class="metric-val">💦 ${humidity}%</span>
        </div>
        <div class="weather-metric-tile">
          <span class="metric-label">Day Range</span>
          <span class="metric-val">${todayMax}° / ${todayMin}°</span>
        </div>
      </div>
    </div>

    <div class="weather-forecast-heading">5-Day Weather Forecast</div>
    <div class="weather-forecast-grid">
      ${forecastCardsHtml}
    </div>
  `;
}

// ==========================================
// 10. GLOBAL KEYBOARD SHORTCUTS
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

  if (e.key === "Escape") {
    modalOverlay.classList.add("hidden");
    keysHelpModal.classList.add("hidden");
    calendarModal.classList.add("hidden");
    bottomDock.classList.remove("open");
    tabBtnSpotify.classList.remove("active");
    tabBtnSpace.classList.remove("active");
    tabBtnNews.classList.remove("active");
    tabBtnWeather.classList.remove("active");
    panelSpotify.classList.add("hidden");
    panelSpace.classList.add("hidden");
    panelNews.classList.add("hidden");
    panelWeather.classList.add("hidden");
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

  if (e.key === "e" || e.key === "E") {
    e.preventDefault();
    toggleDockTab("weather");
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