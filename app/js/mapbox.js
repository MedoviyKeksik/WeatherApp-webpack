export const mapboxClient = mapboxgl; // eslint-disable-line 
export function changeMap(latitude, longitude) {
    var map = new mapboxgl.Map({ // eslint-disable-line 
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude], 
        interactive: 0,
        zoom: 10
    });
    new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map); // eslint-disable-line 
}