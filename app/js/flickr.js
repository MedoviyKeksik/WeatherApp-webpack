import {addGetParams} from './common.js';
export class FlickrClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    SearchPhotos(tags) {
        const params = {
            method: "flickr.photos.search",
            format: "json",
            api_key: this.key,
            sort:  'interestingness-desc',
            tags: tags,
            tag_mode: 'all',
            extras: 'url_h,url_k,url_o',
            nojsoncallback: 1
        }
        const uri = addGetParams(this.url, params);
        return new Promise(function(resolve, reject) {
            FlickrClient.get(uri).then(data => {
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
