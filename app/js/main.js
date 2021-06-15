import {credentials} from './credentials.js';
import {localization} from './localization.js';
import {OpenweathermapClient} from './openweathermap.js';
import {FlickrClient} from './flickr.js';
import {GeocoderClient} from './geocoder.js';
import {mapboxClient, changeMap} from './mapbox.js';
import {prettifyDegrees} from './common.js';

var positionLatitude        = document.querySelector(".map__latitude");
var positionLongitude       = document.querySelector(".map__longitude");
var currentLocation         = document.querySelector(".weather__current-location");
var degrees                 = document.querySelectorAll(".weather__degrees");
var currentDescription      = document.querySelector(".weather__type");
var currentFeelsLike        = document.querySelector(".weather__feels-like"); 
var currentHumidity         = document.querySelector(".weather__humidity");
var currentWind             = document.querySelector(".weather__wind");
var icons                   = document.querySelectorAll(".weather__icon");
var weatherWeekdays         = document.querySelectorAll(".weather__day-title");
var searchButton            = document.querySelector(".control__search-button");
var searchInput             = document.querySelector(".control__input-city");
var voiceInputButton        = document.querySelector(".control__voice-input");
var changeBackgroundButton  = document.querySelector(".control__refresh");
var currentLanguageElement  = document.querySelector(".control__current-language");
var langButtons             = document.querySelectorAll(".control__dropdown-item");
var celsiusButton           = document.querySelector(".control__celsius-units");
var fahrenheitButton        = document.querySelector(".control__fahrenheit-units");
var currentTime             = document.querySelector(".weather__current-time");
var modal                   = document.querySelector(".modal");
var modalHeader             = document.querySelector(".modal__header");
var modalText               = document.querySelector(".modal__text");
var modalButton             = document.querySelector(".modal__button");

const TRIESTHREESHOLD = 100;
const FORECASTDAYS = 3;
const KEY = {
    ENTER: 13   
}

var info;

function showModal(header, text) {
    modalHeader.innerHTML = header;
    modalText.innerHTML = text;
    modal.setAttribute('show', '');
}

function changeTime(lang, timezone) {
    var time = new Date();
    time = new Date(Number(time) + (time.getTimezoneOffset() * 60 + timezone) * 1000);
    const format = {
        hour12: false,
        weekday: "short",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }
    currentTime.innerHTML = time.toLocaleString(lang, format).split(',').join('');
}

function transformUnits(degrees, units) {
    if (units =='fahrenheit') {
        degrees = 9/5 * degrees + 32;
    }
    return degrees;
}

function loadImage(url) {
    return new Promise(function(resolve, reject) {
        try {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                resolve(img);
            }
        } catch(e) {
            reject(e);
        }
    });
}

function getImage(imageList) {
    return new Promise(function(resolve, reject) {
        let tries = 0;
        let imageUrl;
        try {
            while (tries < TRIESTHREESHOLD) {
                let i = Math.trunc(Math.random() * imageList.length - 1);
                if (imageList[i].url_h != 'undefined') {
                    imageUrl = imageList[i].url_h;
                    break;
                }
                if (imageList[i].url_k != 'undefined') {
                    imageUrl = imageList[i].url_k;
                    break
                }
                if (imageList[i].url_o != 'undefined') {
                    imageUrl = imageList[i].url_o;
                    break;
                }
                tries++;
            }
        } catch(e) {
            reject(new Error("Error while getting images"));
        }
        if (typeof(imageUrl) != 'undefined') {
            loadImage(imageUrl).then(data => {
                resolve(data);
            }).catch(e => {
                reject(e);
            });
        }
    });
}

function changeBackground(img) {
    document.body.style.backgroundImage = `url(${img.src})`;
}

function changeBackgroundOnClick(e) {
    e.target.disabled = true;
    getImage(info.images)
    .then(img => {
        changeBackground(img);
        setTimeout(() => {
            e.target.disabled = false;
        }, 500);
    }).catch((err) => showModal("Error!", err.message));
}

function changeCity(city) {
    geocoderClient.forwardRequest(city, info.lang)
    .then(json => {
        if (typeof(json.results[0]) == 'undefined') showModal("Error!", "City not found");
        else getAllInfo(json.results[0].geometry.lat, json.results[0].geometry.lng, info.lang, info.units)
        .then(info => changePageContent(info, localization))
        .catch(e => showModal("Error!", e.message));
    }).catch(() => showModal("Error!", "Connection interrupted"));
}

function onCityInput(e) {
    if (e.type === 'keypress') {
        if (e.which == KEY.ENTER || e.keyCode == KEY.ENTER) {
            if (searchInput.value == '') return showModal("Error!", "Empty query");
            changeCity(searchInput.value);
        }
    }
    if (e.type === 'click') {
        if (searchInput.value == '') return showModal("Error!", "Empty query");
        changeCity(searchInput.value);
    }
}

function changeLang(e) {
    info.lang = e.target.getAttribute('lang');
    localStorage.setItem('lang', info.lang);
    getAllInfo(info.latitude, info.longitude, info.lang, info.units)
    .then((info) => changePageContent(info, localization))
    .catch(e => showModal("Error!", e.message));
}

function changeUnits(e) {
    info.units = e.target.getAttribute('units');
    localStorage.setItem('units', info.units);
    changePageContent(info, localization);
}

function voiceInput() {
    window.SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
    voiceInputButton.style.color = "#f00";
    var recognition = new window.SpeechRecognition();
    recognition.lang = info.lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.addEventListener('result', e => {
        recognition.stop();
        voiceInputButton.style.color = "#fff";
        try {
            const transcript = Array.from(e.results).map(result => result[0]).map(result => result.transcript);
            changeCity(transcript);
        } catch(e) {
            showModal("Error!", "City not found");
        }
        recognition.stop();
    });
    recognition.start();
}

function getConfig() {
    return {credentials, localization};

}

var weatherClient;
var geocoderClient;
var imageClient;

function initClients(credentials) {
    weatherClient = new OpenweathermapClient(credentials.openweathermap.url, credentials.openweathermap.key);
    geocoderClient = new GeocoderClient(credentials.geocoder.url, credentials.geocoder.key);
    imageClient = new FlickrClient(credentials.flickr.url, credentials.flickr.key);
    mapboxClient.accessToken = credentials.mapbox.key;
}

function start() {
    try {
        const config = getConfig();
        if (typeof config == "undefined") throw new Error("Config Loading error");
        let latitude;
        let longitude
        navigator.geolocation.getCurrentPosition((position) => {        
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            initClients(config.credentials);
            let units = localStorage.getItem('units') || 'celsius'; 
            let lang = localStorage.getItem('lang') || 'en';
            getAllInfo(latitude, longitude, lang, units)
            .then(info => {
                getImage(info.images)
                .then((img) => changeBackground(img))
                .then(changePageContent(info, config.localization))
                .catch((err) => showModal("Error!", err.message));
            })
            .catch(e => showModal("Error!", e.message));
        });
    } catch(e) {
        showModal("Critical error!", "Failed to start");
    }
}

function getAllInfo(latitude, longitude, lang, units) {
    info = {};
    info.latitude = latitude;
    info.longitude = longitude;
    info.lang = lang;
    info.units = units;

    let geoRequest = geocoderClient.reverseRequest(latitude, longitude, lang);
    let currentWeatherRequest = weatherClient.getWeather(latitude, longitude, lang);
    let weatherForecastRequest = weatherClient.getForecast(latitude, longitude, lang);
    let imageRequest = imageClient.SearchPhotos("night,city");

    return new Promise(function(resolve, reject) {
        Promise.all([geoRequest, currentWeatherRequest, weatherForecastRequest, imageRequest]).then(values => {
            const geoInfo = values[0];
            const weatherInfo = values[1];
            const forecastInfo = values[2];
            const imageInfo = values[3];

            info.city = geoInfo.results[0].components.town || geoInfo.results[0].components.city || geoInfo.results[0].country;
            info.country = geoInfo.results[0].components.country;

            info.currentWeather = {};
            info.currentWeather.temp = weatherInfo.main.temp;
            info.currentWeather.icon = weatherInfo.weather[0].id;
            info.currentWeather.description = weatherInfo.weather[0].description;
            info.currentWeather.feelsLike = weatherInfo.main.feels_like;
            info.currentWeather.humidity = weatherInfo.main.humidity;
            info.currentWeather.wind = weatherInfo.wind.speed;
            info.timezone = weatherInfo.timezone;

            let filteredData = forecastInfo.list.filter((reading) => reading.dt_txt.includes("18:00:00") && reading.dt * 1000 - new Date() >= 64800000);
            info.forecast = [];
            for (let i = 0; i < FORECASTDAYS; i++) {
                let tmp = {};
                tmp.temp = filteredData[i].main.temp;
                tmp.icon = filteredData[i].weather[0].id;
                tmp.weekday = new Date(filteredData[i].dt * 1000).getDay();
                info.forecast.push(tmp);
            }

            info.images = imageInfo.photos.photo;

            resolve(info);
        }, e => {
            reject(e.message);
        })
    });
}

var timerId;

function changePageContent(info, localization) {
    try {
        if (typeof(timerId) != 'undefined') clearInterval(timerId);
        timerId = setInterval(changeTime, 1000, info.lang, info.timezone);
        changeMap(info.latitude, info.longitude);
        positionLatitude.innerHTML = localization[info.lang].latitude + ': ' + prettifyDegrees(info.latitude);
        positionLongitude.innerHTML = localization[info.lang].longitude + ': ' + prettifyDegrees(info.longitude);
        currentDescription.innerHTML = info.currentWeather.description;
        currentFeelsLike.innerHTML = localization[info.lang].feelsLike + ': ' + transformUnits(Math.round(info.currentWeather.feelsLike)) + '°';
        currentHumidity.innerHTML = localization[info.lang].humidity + ': ' + info.currentWeather.humidity + '%';
        currentWind.innerHTML = localization[info.lang].wind + ': ' + Math.round(info.currentWeather.wind) + ' ' + localization[info.lang].windSpeed;
        currentLocation.innerHTML = info.city + ', ' + info.country;
        degrees[0].innerHTML = Math.round(transformUnits(info.currentWeather.temp, info.units)) + '°';
        icons[0].classList.add(`owf-${info.currentWeather.icon}`);
        for (let i = 0; i < FORECASTDAYS; i++) {
            weatherWeekdays[i].innerHTML = localization[info.lang].weekdays[info.forecast[i].weekday];
            icons[i + 1].classList.add(`owf-${info.forecast[i].icon}`); 
            degrees[i + 1].innerHTML = Math.round(transformUnits(info.forecast[i].temp, info.units)) + '°';
        }
        searchButton.innerHTML = localization[info.lang].search;
        searchInput.placeholder = localization[info.lang].searchPlaceholder;
        currentLanguageElement.innerHTML = info.lang;
        if (info.units == 'celsius') {
            celsiusButton.setAttribute('current', '');
            fahrenheitButton.removeAttribute('current');
        } else {
            fahrenheitButton.setAttribute('current', '');
            celsiusButton.removeAttribute('current');
        }
    } catch(e) {
        getAllInfo(info.latitude, info.longitude, info.lang, info.units)
        .then(info => changePageContent(info, info.localization))
        .catch(e => showModal("Error!", e.message));
    }   
}

function closeModal() {
    modal.removeAttribute('show');
}

document.addEventListener('DOMContentLoaded', start);
voiceInputButton.addEventListener('click', voiceInput);

changeBackgroundButton.addEventListener('click', changeBackgroundOnClick);
for (let i = 0; i < langButtons.length; i++)
    langButtons[i].addEventListener('click', changeLang);
searchButton.addEventListener('click', onCityInput);
searchInput.addEventListener('keypress', onCityInput);
celsiusButton.addEventListener('click', changeUnits);
fahrenheitButton.addEventListener('click', changeUnits);
modalButton.addEventListener('click', closeModal);