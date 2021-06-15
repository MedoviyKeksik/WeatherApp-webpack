import {addGetParams} from './common.js';
export class OpenweathermapClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    getWeather(latitude, longitude, lang) {
        const params = {
            lat: latitude,
            lon: longitude,
            appid: this.key,
            units: "metric",
            lang: lang,
        }
        const uri = addGetParams(this.url + "weather?", params);
        return new Promise(function(resolve, reject) {
            OpenweathermapClient.get(uri).then(data => {
                resolve(data)
            }, e => {
                reject(e)
            });
        });
    }

    getForecast(latitude, longitude, lang) {
        const params = {
            lat: latitude,
            lon: longitude,
            appid: this.key,
            units: "metric",
            lang: lang,
        }
        const uri = addGetParams(this.url + "forecast?", params);
        return new Promise(function(resolve, reject) {
            OpenweathermapClient.get(uri).then(data => {
                resolve(data);
            }, e => {
                reject(e);
            });
        });
    }

    static get(uri) {
        return new Promise(function(resolve, reject) {
            fetch(uri).then(response => {
                if (!response.ok) reject(new Error("Geocoder service error"));
                response.json().then(data => {
                    resolve(data);
                }, e => {
                    reject(e);
                });
            });
        });
    }
}