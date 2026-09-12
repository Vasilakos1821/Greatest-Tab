# 🌌 Greatest Tab

> A fast, zero-bloat browser New Tab dashboard packed with productivity tools, music, live space photos and more!

[![Live Demo](https://img.shields.io/badge/demo-live%20site-38bdf8?style=for-the-badge&logo=githubpages&logoColor=white)](https://vasilakos1821.github.io/Greatest-Tab/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🚀 Setup

Make **Greatest Tab** your default browser page in less than a minute:

1. Install a lightweight new tab redirect extension for your browser:
   * **Chrome / Brave / Edge:** [Custom New Tab URL](https://chromewebstore.google.com/detail/custom-new-tab-url/mmjbdbjnoablegbkcklggeknkfcjkjia) or [New Tab Redirect](https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna)
   * **Firefox:** [New Tab Override](https://addons.mozilla.org/en-US/firefox/addon/new-tab-override/)
2. Set the redirect URL to:
   #
       https://vasilakos1821.github.io/Greatest-Tab/
4. Open a new tab and you're ready to go!



## ⚡ Overview

**Greatest Tab** transforms your browser's default blank page into a customizable dashborad. Built entirely with Vanilla JavaScript and Vite, it requires **no account creation, no databases, and no OAuth permissions**. All your data stays right inside your browser's `localStorage`.


## ✨ Features

### 🕰️ Dual Clock System
* Choose between a digital 24hr clock or an old school analog one!
* **Quick Toggle**: Press <kbd>C</kbd> or click the switcher in the top-left to swap modes instantly.

### 📝 Draggable Sticky Notes
* Create as many floating notes as you need with <kbd>N</kbd> or the top-right button.
* Drag-and-drop to position notes anywhere on your screen.
* Auto-saves everything locally as you type.

### 🔗 Customizable Shortcuts Bar
* 5 slots that are easily customizable and draggable!
* Edit URLs and display labels on the fly via the slot options menu.
* Quick-launch sites with number keys <kbd>1</kbd> through <kbd>5</kbd>.

### 📅 Calendar & Local `.ics` Import
* Full monthly calendar view accessible right from the clock date.
* Add daily tasks, schedule reminders, and color-coded event dots.
* **Calendar Import**: One-click import for standard `.ics` files exported from any Calendar App!

### 🖼️ Wallpaper & Daily Space Switcher
* **Custom Backgrounds**: Customize your background with whatever picture you wish!
* **NASA Wallpaper**: Toggle on NASA's Astronomy Picture of the Day to automatically update your wallpaper daily.


## 🗂️ 4-in-1 Bottom Slide-Up Dock

Press the hotkeys or click the drawer tabs at the bottom to slide out dedicated media and utility panels:

| Tab | Hotkey | Description |
| :--- | :---: | :--- |
| **🎵 Spotify** | <kbd>M</kbd> | Embed player with 5 presets (*Lo-Fi, Top Hits, Deep Focus, Synthwave, Rock*) and link/URL parsing |
| **🔭 NASA Space** | <kbd>A</kbd> | Official NASA APOD integration. Read the daily cosmic breakdown, roll for a random surprise article, or set the current photo as your wallpaper. |
| **📰 Live News** | <kbd>W</kbd> | Real-time live News powered by direct news feeds across 6 categories: *General, Finance, Tech, Entertainment, Science, and Sports*. |
| **🌦️ Weather** | <kbd>E</kbd> | Weather tab that displays current temp, feels-like, wind speed, humidity, precipitation chance, and a full 5-day daily forecast. |


## ⌨️ Keyboard Shortcuts

| Key | Action |
| :---: | :--- |
| <kbd>/</kbd> | Focus Google Search bar |
| <kbd>N</kbd> | Create a new sticky note |
| <kbd>C</kbd> | Toggle between 24H Digital and Analog clocks |
| <kbd>M</kbd> | Toggle Spotify dock drawer |
| <kbd>A</kbd> | Toggle NASA Space Article drawer |
| <kbd>W</kbd> | Toggle Live News drawer |
| <kbd>E</kbd> | Toggle Live Weather & 5-Day forecast |
| <kbd>1</kbd> – <kbd>5</kbd> | Launch shortcut links 1 through 5 |
| <kbd>?</kbd> | Open keyboard shortcuts help sheet |
| <kbd>Esc</kbd> | Close all active modals, drawers, and open menus |


## 🛠️ Tech Stack

* **Build Tool:** [Vite](https://vitejs.dev/)
* **Languages:** Vanilla JS, HTML, CSS
* **APIs Used (No Auth / Free Tier):**
  * [Open-Meteo](https://open-meteo.com/) – Hourly and 5-day weather data
  * [NASA APOD API](https://api.nasa.gov/) – Daily cosmic photography & details
  * [BBC News Feeds via rss2json](https://rss2json.com/) – Categorized live headlines
  * [BigDataCloud](https://www.bigdatacloud.com/) – Client-side reverse geocoding


## 🔒 Privacy & Data Policy

* **100% Client-Side:** There is no backend server collecting your usage statistics, IP, or link clicks.
* **Local Storage:** Sticky notes, shortcuts, calendar events, active presets, and custom wallpapers live exclusively in your local browser storage.
* **On-Demand Location:** Weather information only checks coordinates when the tab is accessed.


## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
