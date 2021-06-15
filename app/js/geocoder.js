import {addGetParams} from './common.js';
export class GeocoderClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    forwardRequest(city, lang = 'en') {
        const params = {
            q: city,
            key: this.key,
            language: lang
        };
        const uri = addGetParams(this.url, params);
        return new Promise(function(resolve, reject) {
            GeocoderClient.get(uri).then(data => {
                resolve(data);
            }, e => {
                reject(e);
            });
        });
        
    }

    reverseRequest(latitude, longitude, lang = 'en') {
        const params = {
            q: latitude + '+' + longitude,
            key: this.key,
            language: lang
        };
        const uri = addGetParams(this.url, params);
        return new Promise(function(resolve, reject) {
            GeocoderClient.get(uri).then(data => {
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
