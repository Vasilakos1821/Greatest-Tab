import './style.css'; 

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

// --- Clock Logic ---
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

// --- 5 Shortcut Slots with Custom Edit/Delete on Right-Click ---
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

function renderShortcuts() {
  shortcutsGrid.innerHTML = "";

  shortcuts.forEach((item, index) => {
    const slotEl = document.createElement(item ? "a" : "button");
    slotEl.className = "shortcut-slot";

    if (item) {
      slotEl.href = item.url;
      slotEl.target = "_self";
      slotEl.title = `${item.name} (Right-click to edit)`;

      // Google favicon service pulls the official high-res icon automatically
      const domain = new URL(item.url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      slotEl.innerHTML = `
        <div class="shortcut-icon-circle">
          <img src="${faviconUrl}" alt="${item.name}" onerror="this.src='https://www.google.com/favicon.ico'" />
        </div>
        <span class="shortcut-title">${item.name}</span>
      `;

      // Right-click to edit or delete existing shortcut
      slotEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openModal(index);
      });
    } else {
      slotEl.type = "button";
      slotEl.title = "Add shortcut";
      slotEl.innerHTML = `
        <div class="shortcut-icon-circle">
          <span class="shortcut-plus-icon">+</span>
        </div>
        <span class="shortcut-title">Add</span>
      `;

      // Left click to assign an empty slot
      slotEl.addEventListener("click", () => openModal(index));
    }

    shortcutsGrid.appendChild(slotEl);
  });
}

function openModal(index) {
  activeSlotIndex = index;
  const current = shortcuts[index];

  if (current) {
    modalTitle.textContent = `Edit Shortcut #${index + 1}`;
    nameInput.value = current.name;
    urlInput.value = current.url;
    deleteBtn.style.display = "block";
  } else {
    modalTitle.textContent = `Add Shortcut #${index + 1}`;
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

// --- Bottom NASA APOD Drawer ---
const drawer = document.querySelector("#nasa-drawer");
const toggleBtn = document.querySelector("#drawer-toggle");
const drawerBody = document.querySelector("#drawer-body");

toggleBtn.addEventListener("click", () => {
  const isOpen = drawer.classList.toggle("open");
  toggleBtn.setAttribute("aria-expanded", isOpen);
});

function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function fetchAPOD(date = null) {
  const endpoint = date
    ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
  return await fetch(endpoint);
}

async function loadAPOD() {
  try {
    let res = await fetchAPOD();

    if (res.status === 500) {
      res = await fetchAPOD(getDateString(1));
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || errData.msg || `NASA Error (${res.status})`);
    }

    const data = await res.json();

    const media = data.media_type === "video"
      ? `<iframe src="${data.url}" title="${data.title}" allowfullscreen></iframe>`
      : `<img src="${data.hdurl || data.url}" alt="${data.title}" />`;

    drawerBody.innerHTML = `
      <header>
        <h2>${data.title}</h2>
        <span class="photo-date">${data.date}</span>
      </header>
      <div class="media-container">
        ${media}
      </div>
      <p class="explanation">${data.explanation}</p>
    `;
  } catch (err) {
    drawerBody.innerHTML = `
      <p class="status-msg">Could not load space info: ${err.message}</p>
    `;
  }
}

loadAPOD();