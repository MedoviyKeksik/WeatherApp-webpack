export function addGetParams(url, params) {
    let tmp = [];
    for (var param in params) {
        tmp.push(param + '=' + params[param]);
    }
    for (let i = 0; i < tmp.length; i++) {
        if (i) url += '&';
        url += tmp[i];
    }
    return url;
}

export function prettifyDegrees(degrees) {
    let isNegative = degrees < 0;
    degrees = Math.abs(degrees);        
    let int = Math.trunc(degrees);
    let frac = '' + Math.round((degrees - int) * 60);
    if (frac.length < 2) frac = '0' + frac;
    return (isNegative ? '-' : '') + int + '°' + (frac != '00' ? frac + '\'' : '');
}