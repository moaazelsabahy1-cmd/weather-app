

const weatherMap = {
  0: ["Clear sky","☀️"],
  1: ["Mainly clear","🌤️"],
  2: ["Partly cloudy","⛅"],
  3: ["Overcast","☁️"],
  45: ["Fog","🌫️"],
  48: ["Depositing rime fog","🌫️"],
  51: ["Light drizzle","🌦️"],
  53: ["Moderate drizzle","🌦️"],
  55: ["Dense drizzle","🌧️"],
  56: ["Light freezing drizzle","🌧️❄️"],
  57: ["Dense freezing drizzle","🌧️❄️"],
  61: ["Slight rain","🌧️"],
  63: ["Moderate rain","🌧️"],
  65: ["Heavy rain","🌧️"],
  66: ["Light freezing rain","🌧️❄️"],
  67: ["Heavy freezing rain","🌧️❄️"],
  71: ["Slight snow fall","🌨️"],
  73: ["Moderate snow fall","🌨️"],
  75: ["Heavy snow fall","🌨️"],
  77: ["Snow grains","🌨️"],
  80: ["Slight rain showers","🌧️"],
  81: ["Moderate rain showers","🌧️"],
  82: ["Violent rain showers","⛈️"],
  85: ["Slight snow showers","🌨️"],
  86: ["Heavy snow showers","🌨️"],
  95: ["Thunderstorm","⛈️"],
  96: ["Thunderstorm with slight hail","⛈️"],
  99: ["Thunderstorm with heavy hail","⛈️"]
};

const elems = {
  q: document.getElementById('q'),
  searchBtn: document.getElementById('searchBtn'),
  locBtn: document.getElementById('locBtn'),
  location: document.getElementById('location'),
  temp: document.getElementById('temp'),
  desc: document.getElementById('desc'),
  meta: document.getElementById('meta'),
  feels: document.getElementById('feels'),
  wind: document.getElementById('wind'),
  humidity: document.getElementById('humidity'),
  time: document.getElementById('time'),
  message: document.getElementById('message')
};


function setLoading(text = 'Loading...') {
  elems.message.innerHTML = `<span class="spinner"></span> ${text}`;
}
function clearMessage() {
  elems.message.textContent = '';
}


async function geocodePlace(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0]; 
}


async function fetchWeather(lat, lon, timezone = 'auto') {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=${encodeURIComponent(timezone)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API failed');
  return await res.json();
}


function display(current, placeName) {
  const code = current.weathercode;
  const mapping = weatherMap[code] || ["Unknown", "❓"];

  elems.location.innerHTML = placeName;
  elems.temp.innerHTML = `${Math.round(current.temperature)}<small>°C</small>`;
  elems.desc.innerHTML = `${mapping[1]} ${mapping[0]}`;
  elems.meta.innerHTML = `<div class="small">Code</div><div class="value">${code}</div>`;
  elems.feels.textContent = `${current.temperature} °C`;
  elems.wind.textContent = `${current.windspeed} km/h (${current.winddirection}°)`;
  elems.humidity.textContent = '—';
  elems.time.textContent = new Date(current.time).toLocaleString();
}


async function searchByCity(name) {
  if (!name) return;
  try {
    setLoading('Looking up city...');
    const place = await geocodePlace(name);
    if (!place) {
      elems.message.textContent = 'City not found. Try another name.';
      return;
    }
    setLoading(`Fetching weather for ${place.name}, ${place.country}...`);
    const w = await fetchWeather(place.latitude, place.longitude, place.timezone);
    if (!w.current_weather) throw new Error('No data available');
    clearMessage();
    display(w.current_weather, `${place.name}, ${place.country}`);
  } catch (err) {
    elems.message.textContent = 'Error: ' + err.message;
  }
}

async function searchByCoords(lat, lon) {
  try {
    setLoading('Fetching weather for your location...');
    const w = await fetchWeather(lat, lon, 'auto');
    if (!w.current_weather) throw new Error('No data available');
    clearMessage();
    display(w.current_weather, `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);
  } catch (err) {
    elems.message.textContent = 'Error: ' + err.message;
  }
}


elems.searchBtn.addEventListener('click', () => searchByCity(elems.q.value.trim()));
elems.q.addEventListener('keydown', e => { if (e.key === 'Enter') searchByCity(elems.q.value.trim()); });
elems.locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    elems.message.textContent = 'Geolocation not supported.';
    return;
  }
  setLoading('Getting your location...');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      searchByCoords(latitude, longitude);
    },
    err => {
      elems.message.textContent = 'Could not get location: ' + err.message;
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
});


(function init() {
  const defaultCity = 'Cairo';
  elems.q.value = defaultCity;
  searchByCity(defaultCity);
})();


