// ========== WEATHER API KEY ==========
// Get your FREE key from: https://www.weatherapi.com/
const API_KEY = "1bfc40947e0e478f8ef184825261102";  // YOUR API KEY HERE

// ========== DOM Elements ==========
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContent = document.getElementById("weatherContent");
const historyList = document.getElementById("historyList");
const offlineIndicator = document.getElementById("offlineIndicator");

// ========== Check Internet Connection ==========
function checkOnlineStatus() {
    if (!navigator.onLine) {
        if (offlineIndicator) offlineIndicator.style.display = "flex";
        showError("You are offline. Please check your internet connection.");
        return false;
    } else {
        if (offlineIndicator) offlineIndicator.style.display = "none";
        return true;
    }
}

window.addEventListener('online', () => {
    if (offlineIndicator) offlineIndicator.style.display = "none";
    showError("Back online! Search again.");
});

window.addEventListener('offline', () => {
    if (offlineIndicator) offlineIndicator.style.display = "flex";
    showError("You are offline. Please check your connection.");
});

// ========== Search History (Local Storage) ==========
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

// ========== Main Weather Function ==========
async function getWeather(city) {
    if (!checkOnlineStatus()) return;
    
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
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=yes`
        );
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error.message);
            return;
        }
        
        addToHistory(data.location.name);
        setBackground(data.current.condition.text);
        
        const aqiValue = data.current.air_quality?.pm2_5 || 0;
        
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
                        <div style="flex: 1; text-align: left; padding-left: 12px;">
                            <h4>Humidity</h4>
                            <p>${data.current.humidity}%</p>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-wind"></i>
                        <div style="flex: 1; text-align: left; padding-left: 12px;">
                            <h4>Wind Speed</h4>
                            <p>${data.current.wind_kph} km/h</p>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-thermometer-half"></i>
                        <div style="flex: 1; text-align: left; padding-left: 12px;">
                            <h4>Feels Like</h4>
                            <p>${Math.round(data.current.feelslike_c)}°C</p>
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-smog"></i>
                        <div style="flex: 1; text-align: left; padding-left: 12px;">
                            <h4>Air Quality</h4>
                            <p>${aqiValue.toFixed(0)} PM2.5</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error("Weather fetch error:", error);
        if (!navigator.onLine) {
            showError("No internet connection. Please check your network.");
        } else {
            showError("Unable to fetch weather. Please try again.");
        }
    }
}

function showError(message) {
    weatherContent.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
            <p><strong>⚠️ ${message}</strong></p>
            <p style="font-size: 13px; margin-top: 12px;">💡 Try these cities: Karachi, London, Dubai, New York, Tokyo</p>
            <p style="font-size: 12px; margin-top: 8px;">🔍 Make sure the city name is spelled correctly</p>
        </div>
    `;
}

// ========== Get Current Location Weather ==========
function getCurrentLocationWeather() {
    if (!checkOnlineStatus()) return;
    
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
                    `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}&aqi=yes`
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
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    showError("Please allow location access to use this feature");
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError("Location information is unavailable");
                    break;
                case error.TIMEOUT:
                    showError("Location request timed out");
                    break;
                default:
                    showError("Could not get your location");
            }
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

// ========== Event Listeners ==========
if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        getWeather(cityInput.value);
    });
    searchBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        getWeather(cityInput.value);
    });
}

if (locationBtn) {
    locationBtn.addEventListener("click", (e) => {
        e.preventDefault();
        getCurrentLocationWeather();
    });
    locationBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        getCurrentLocationWeather();
    });
}

if (cityInput) {
    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            getWeather(cityInput.value);
        }
    });
}

// ========== Load History and Default City ==========
displayHistory();

if (searchHistory.length > 0) {
    getWeather(searchHistory[0]);
} else {
    getWeather("Karachi");
}

// Fix viewport height for mobile
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVH);
setVH();
