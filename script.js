// ========== WEATHER API KEY ==========
// Go to https://www.weatherapi.com/ and sign up for FREE
// Then paste your API key below:

const API_KEY = "1bfc40947e0e478f8ef184825261102";  // <---- PASTE YOUR API KEY HERE

// ========== DOM Elements ==========
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContent = document.getElementById("weatherContent");
const historyList = document.getElementById("historyList");

// ========== Search History (Local Storage) ==========
let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];

// Save history to localStorage
function saveHistory() {
  localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
}

// Add city to history
function addToHistory(cityName) {
  if (!searchHistory.includes(cityName) && cityName) {
    searchHistory.unshift(cityName);
    if (searchHistory.length > 5) searchHistory.pop();
    saveHistory();
    displayHistory();
  }
}

// Display search history
function displayHistory() {
  historyList.innerHTML = searchHistory.map(city => 
    `<span class="history-item" onclick="getWeather('${city}')">${city}</span>`
  ).join('');
}

// ========== Dynamic Background ==========
function setBackground(condition) {
  const body = document.body;
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    body.className = 'sunny';
  } else if (lowerCondition.includes('cloud')) {
    body.className = 'cloudy';
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    body.className = 'rainy';
  } else if (lowerCondition.includes('snow')) {
    body.className = 'snowy';
  } else {
    body.className = 'default-bg';
  }
}

// ========== AQI Color & Text ==========
function getAQIInfo(aqi) {
  if (aqi <= 50) return { text: "Good", class: "aqi-good" };
  if (aqi <= 100) return { text: "Moderate", class: "aqi-moderate" };
  if (aqi <= 150) return { text: "Unhealthy for Sensitive", class: "aqi-unhealthy" };
  return { text: "Unhealthy", class: "aqi-bad" };
}

// ========== Get 5-Day Forecast ==========
async function getForecast(city) {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=yes`
    );
    const data = await response.json();
    if (data.error) return null;
    return data.forecast.forecastday;
  } catch (error) {
    return null;
  }
}

// ========== Display 5-Day Forecast ==========
function displayForecast(forecastDays) {
  if (!forecastDays) return '';
  
  const forecastHTML = forecastDays.map(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en', { weekday: 'short' });
    
    return `
      <div class="forecast-day">
        <div>${dayName}</div>
        <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
        <div class="forecast-temp">${Math.round(day.day.avgtemp_c)}°C</div>
        <div style="font-size: 11px; opacity: 0.7;">${day.day.condition.text}</div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="forecast-section">
      <h3><i class="fas fa-calendar-week"></i> 5-Day Forecast</h3>
      <div class="forecast-container">
        ${forecastHTML}
      </div>
    </div>
  `;
}

// ========== Main Weather Display ==========
async function getWeather(city) {
  if (!city.trim()) return;
  
  // Show loading
  weatherContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Fetching accurate weather data...</p>
    </div>
  `;
  
  try {
    // Fetch current weather + forecast
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=yes`
    );
    const data = await response.json();
    
    if (data.error) {
      showError(data.error.message);
      return;
    }
    
    // Add to history
    addToHistory(data.location.name);
    
    // Set dynamic background
    setBackground(data.current.condition.text);
    
    // Get AQI info
    const aqiValue = data.current.air_quality.pm2_5 || 0;
    const aqiInfo = getAQIInfo(aqiValue);
    
    // Display weather + forecast
    weatherContent.innerHTML = `
      <div class="weather-info">
        <img src="https:${data.current.condition.icon}" alt="weather icon">
        
        <div class="temp">${Math.round(data.current.temp_c)}°C</div>
        <div class="city">
          <i class="fas fa-map-marker-alt"></i> ${data.location.name}, ${data.location.country}
        </div>
        <div class="condition">${data.current.condition.text}</div>
        
        <div class="details">
          <div class="detail-card">
            <i class="fas fa-tint"></i>
            <h4>Humidity</h4>
            <p>${data.current.humidity}%</p>
          </div>
          
          <div class="detail-card">
            <i class="fas fa-wind"></i>
            <h4>Wind Speed</h4>
            <p>${data.current.wind_kph} km/h</p>
          </div>
          
          <div class="detail-card">
            <i class="fas fa-thermometer-half"></i>
            <h4>Feels Like</h4>
            <p>${Math.round(data.current.feelslike_c)}°C</p>
          </div>
          
          <div class="detail-card">
            <i class="fas fa-smog"></i>
            <h4>Air Quality (PM2.5)</h4>
            <p class="${aqiInfo.class}">${aqiValue.toFixed(0)} - ${aqiInfo.text}</p>
          </div>
          
          <div class="detail-card">
            <i class="fas fa-eye"></i>
            <h4>Visibility</h4>
            <p>${data.current.vis_km} km</p>
          </div>
          
          <div class="detail-card">
            <i class="fas fa-tachometer-alt"></i>
            <h4>Pressure</h4>
            <p>${data.current.pressure_mb} mb</p>
          </div>
        </div>
        
        <div class="sun-info">
          <div class="sun-card">
            <i class="fas fa-sunrise"></i>
            <h4>Sunrise</h4>
            <p>${data.forecast.forecastday[0].astro.sunrise}</p>
          </div>
          <div class="sun-card">
            <i class="fas fa-sunset"></i>
            <h4>Sunset</h4>
            <p>${data.forecast.forecastday[0].astro.sunset}</p>
          </div>
        </div>
        
        ${displayForecast(data.forecast.forecastday)}
      </div>
    `;
    
  } catch (error) {
    showError("Network error. Please check your connection.");
  }
}

// ========== Error Display ==========
function showError(message) {
  weatherContent.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
      <p>${message}</p>
      <p style="font-size: 12px; margin-top: 10px;">Try checking the city name or your internet connection.</p>
    </div>
  `;
}

// ========== Get Current Location Weather ==========
function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser");
    return;
  }
  
  weatherContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Getting your location...</p>
    </div>
  `;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=5&aqi=yes`
        );
        const data = await response.json();
        if (data.error) {
          showError("Could not get weather for your location");
        } else {
          addToHistory(data.location.name);
          getWeather(data.location.name);
        }
      } catch (error) {
        showError("Failed to fetch weather for your location");
      }
    },
    (error) => {
      showError("Please allow location access to use this feature");
    }
  );
}

// ========== Event Listeners ==========
searchBtn.addEventListener("click", () => getWeather(cityInput.value));
locationBtn.addEventListener("click", getCurrentLocationWeather);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") getWeather(cityInput.value);
});

// ========== Load History on Page Load ==========
displayHistory();

// ========== Default City on Load ==========
getWeather("Karachi");