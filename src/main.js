// Make sure this matches your actual path to style.css
import './style.css'; 

const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const app = document.querySelector("#app");

app.innerHTML = `<p class="loading">Loading space snapshot...</p>`;

// Helper to format a date string (YYYY-MM-DD) for days in the past
function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function fetchAPOD(date = null) {
  const url = date 
    ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
  
  return await fetch(url);
}

async function loadAPOD() {
  try {
    let res = await fetchAPOD();

    // NASA 500 fix: if today's APOD isn't published or crashed, grab yesterday's
    if (res.status === 500) {
      console.warn("NASA 500 error on today's APOD. Retrying with yesterday's post...");
      res = await fetchAPOD(getDateString(1));
    }

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      const msg = errorPayload.error?.message || errorPayload.msg || `NASA Error (${res.status})`;
      throw new Error(msg);
    }

    const data = await res.json();

    const media = data.media_type === "video"
      ? `<iframe src="${data.url}" title="${data.title}" frameborder="0" allowfullscreen></iframe>`
      : `<img src="${data.hdurl || data.url}" alt="${data.title}" />`;

    app.innerHTML = `
      <header>
        <h1>${data.title}</h1>
        <span class="date">${data.date}</span>
      </header>
      <div class="media-frame">
        ${media}
      </div>
      <p class="explanation">${data.explanation}</p>
    `;
  } catch (err) {
    app.innerHTML = `
      <div class="error-box">
        <h2>Failed to load APOD</h2>
        <p>${err.message}</p>
      </div>
    `;
  }
}

loadAPOD();