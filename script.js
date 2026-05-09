// ========== WEATHER API KEY ==========
const API_KEY = "1bfc40947e0e478f8ef184825261102";  // YOUR API KEY HERE

// ========== CORS PROXY (This fixes the error) ==========
// Using a free CORS proxy to bypass the restriction
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

// ========== DOM Elements ==========
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContent = document.getElementById("weatherContent");
const historyList = document.getElementById("historyList");
const offlineIndicator = document.getElementById("offlineIndicator");

// ========== Search History ==========
let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];

function saveHistory() {
    localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
}

function addToHistory(cityName) {
    if (!searchHistory.includes(cityName) && cityName) {
        searchHistory.unshift(cityName);
        if (searchHistory.length > 5) searchHistory.pop();
        saveHistory();
        displayHistory();
    }
}

function displayHistory() {
    if (historyList && searchHistory.length > 0) {
        historyList.innerHTML = searchHistory.map(city => 
            `<span class="history-item" onclick="getWeather('${city.replace(/'/g, "\\'")}')">${city}</span>`
        ).join('');
    }
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

// ========== Get Day Name ==========
function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { weekday: 'short' });
}

// ========== Display 5-Day Forecast ==========
function displayForecast(forecastDays) {
    if (!forecastDays || forecastDays.length === 0) return '';
    
    const nextDays = forecastDays.slice(1, 6);
    
    if (nextDays.length === 0) return '';
    
    return `
        <div class="forecast-section">
            <h3><i class="fas fa-calendar-week"></i> 5-Day Forecast</h3>
            <div class="forecast-container">
                ${nextDays.map(day => `
                    <div class="forecast-day">
                        <div class="forecast-day-name">${getDayName(day.date)}</div>
                        <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                        <div class="forecast-temp">${Math.round(day.day.avgtemp_c)}°C</div>
                        <div class="forecast-condition">${day.day.condition.text.split(' ')[0]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ========== Main Weather Function with CORS FIX ==========
async function getWeather(city) {
    if (!city || city.trim() === "") {
        showError("Please enter a city name");
        return;
    }
    
    city = city.trim();
    
    weatherContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Fetching weather for ${city}...</p>
        </div>
    `;
    
    try {
        // FIXED: Using CORS proxy to bypass the error
        const url = `${CORS_PROXY}https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=6&aqi=yes`;
        
        console.log("Fetching weather data...");
        
        const response = await fetch(url, {
            headers: {
                'Origin': 'https://breeze-hub-pro.netlify.app'
            }
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error.message);
            return;
        }
        
        addToHistory(data.location.name);
        setBackground(data.current.condition.text);
        
        const aqiValue = data.current.air_quality?.pm2_5 || 0;
        
        let aqiStatus = "Good";
        let aqiColor = "#4ade80";
        if (aqiValue > 50) { aqiStatus = "Moderate"; aqiColor = "#fbbf24"; }
        if (aqiValue > 100) { aqiStatus = "Unhealthy"; aqiColor = "#fb923c"; }
        if (aqiValue > 150) { aqiStatus = "Hazardous"; aqiColor = "#f87171"; }
        
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
                        <h4>Air Quality</h4>
                        <p style="color: ${aqiColor};">${aqiValue.toFixed(0)} - ${aqiStatus}</p>
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
                
                ${data.forecast ? displayForecast(data.forecast.forecastday) : ''}
            </div>
        `;
        
    } catch (error) {
        console.error("Error:", error);
        showError("Unable to fetch weather. Please try again.");
    }
}

function showError(message) {
    weatherContent.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
            <p><strong>⚠️ ${message}</strong></p>
            <p style="font-size: 13px; margin-top: 12px;">💡 Try: Karachi, London, Dubai, New York, Tokyo</p>
            <p style="font-size: 11px; margin-top: 8px;">🔄 If error persists, refresh the page</p>
        </div>
    `;
}

// ========== Current Location ==========
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported");
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
                const url = `${CORS_PROXY}https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=6&aqi=yes`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.error) {
                    showError("Could not get weather for your location");
                } else {
                    addToHistory(data.location.name);
                    getWeather(data.location.name);
                }
            } catch (error) {
                showError("Failed to fetch weather");
            }
        },
        () => {
            showError("Please allow location access");
        }
    );
}

// ========== Event Listeners ==========
if (searchBtn) searchBtn.addEventListener("click", () => getWeather(cityInput.value));
if (locationBtn) locationBtn.addEventListener("click", getCurrentLocationWeather);
if (cityInput) {
    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") getWeather(cityInput.value);
    });
}

// ========== Load Default ==========
displayHistory();
getWeather("Karachi");
