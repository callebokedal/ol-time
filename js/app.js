'use strict'

//let DateTime = luxon.DateTime;
luxon.Settings.defaultLocale = "sv-se";

let safe = DOMPurify.sanitize;

let quickValue = (id, value) => {
    document.getElementById(id).value = value;
    calculateResult();
}

/**
let getValueOld = (id, type_fn, default_value="") => {
    // Ex: getValue("myid", _.isNumber, 0);
    let el = document.getElementById(id);
    if(_.isElement(el) && type_fn(el)) {
        console.debug(id, el.value);
        return el.value;   
    }
    console.warn("Return default value: ", default_value, el.value, typeof(el.value));
    return default_value;
}*/

let getValue = (id, default_value="") => {
    // Ex: getValue("myid", 0);
    let el = document.getElementById(id);
    if(_.isElement(el)) {
        //console.debug(id, el.value, typeof(el.value));
        return el.value;   
    }
    console.warn("Return default value: ", default_value, el.value, typeof(el.value));
    return default_value;
}

/** Parses mm:ss into luxon DateTime */
let ttmm_regexp = /^(?:[0-2][0-4]|0[0-9]|[0-9]):[0-5][0-9]$/;
let ttmmToDate = (ttmm) => {
    if(!ttmm_regexp.test(ttmm)) {
        console.error("Time not in 'tt:mm' format", ttmm);
        return "";
    }
    return luxon.DateTime.fromISO(ttmm+":00");
}
let ttmmToDuration = (ttmm) => {
    if(!ttmm_regexp.test(ttmm)) {
        console.error("Time not in 'tt:mm' format", ttmm);
        return "";
    }
    return luxon.Duration.fromISOTime(ttmm+":00");
}

let mmss_regexp = /^(?:[0-5][0-9]|[0-9]):[0-5][0-9]$/;
let mmssToDuration = (mmss) => {
    if(!mmss_regexp.test(mmss)) {
        console.error("Time not in 'mm:ss' format", mmss);
        return "";
    }
    //return luxon.DateTime.fromISO("00:"+mmss);
    return luxon.Duration.fromISOTime("00:"+mmss);
}

let mmssToDecimal = (mmss) => {
    if(!mmss_regexp.test(mmss)) {
        console.error("Time not in 'mm:ss' format", mmss);
        return "";
    }
    let arr = mmss.split(':');
    let dec = parseInt((arr[1]/6)*10, 10);
    return parseFloat(parseInt(arr[0], 10) + '.' + (dec<10?'0':'') + dec);
} 

let minutesToDuration = (minutes) => {
    if(!_.isNumber(parseInt(minutes))) {
        console.error("Time not in 'min' format", minutes);
        return "";
    }
    return luxon.DateTime.fromSeconds(parseInt(minutes) * 60);
}

let getInt = (i) => {
    if(!_.isNumber(parseInt(i))) {
        console.error("Value not parsable to int", i, typeof(i));
        return "";
    }
    return parseInt(i);
}

let dateTimeISOTimeFormat = (dt) => {
    return dt.toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

let calculateResult = (no=0) => {
    //console.log("no", no);
    if (_.isElement(document.getElementById("r_now"))) {
        console.debug("Calculating result");
        let now = luxon.DateTime.now();
        // Time now
        //document.getElementById("r_now").innerHTML = now.toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        document.getElementById("r_now").innerHTML = dateTimeISOTimeFormat(now);

        // Time to arena = traveltime + walk time
        let travelTime = getInt(getValue("travelTime")); // minutes
        let distanceArena = getInt(getValue("distanceArena")); // meters
        let speedArena = mmssToDecimal(getValue("speedArena")); // min/km in mm:ss => Decimal 8,5
        // Distance to km and multiply with speed in min/km => number of minutes
        let walkToArenaTime = Math.ceil(((distanceArena / 1000) * speedArena));
        //console.log(walkToArenaTime);
        let minutesToArena = (travelTime + walkToArenaTime);
        document.getElementById("r_toArena").innerHTML = minutesToArena + " min ("+travelTime+" min + "+walkToArenaTime+" min)";

        // Time to start = distance * velocity + "gå-fram-tid" + extra time
        let startTime = ttmmToDate(getValue("startTime")); // ttmm => DateTime
        let arenaTime = getInt(getValue("arenaTime")); // minutes
        let distanceStart = getInt(getValue("distanceStart")); // meters
        let speedStart = mmssToDecimal(getValue("speedStart")); // min/km in mm:ss => Decimal 8,5
        let olTime = getInt(getValue("olTime")); // minutes
        let extraTime = getInt(getValue("extraTime")); // minutes
        let walkToStartTime = Math.ceil(((distanceStart / 1000) * speedStart));
        //console.log("walkToStartTime", walkToStartTime);
        let minutesToStart = (olTime + extraTime + walkToStartTime);
        document.getElementById("r_arenaToStart").innerHTML = minutesToStart + " min (från Arena!)";

        // Time at arena
        document.getElementById("r_atArena").innerHTML = arenaTime + " min";

        // Travel at latest
        let travelLatest = startTime.minus({minutes: (minutesToArena + arenaTime + minutesToStart)});
        document.getElementById("r_travelLatest").innerHTML = "<strong>" + dateTimeISOTimeFormat(travelLatest) + "</strong> ("+dateTimeISOTimeFormat(startTime)+" - "+minutesToArena+" - "+arenaTime+" - " + minutesToStart+" min)";

        // Walk at latest
        let walkLatest = startTime.minus({minutes: (minutesToStart)});
        document.getElementById("r_goLatest").innerHTML = "<strong>" + dateTimeISOTimeFormat(walkLatest)+ "</strong> ("+dateTimeISOTimeFormat(startTime)+" - " + minutesToStart+" min)";;

        // Run time
        let distanceTrack = getInt(getValue("distanceTrack")); // meters
        let speedRun = mmssToDecimal(getValue("speedRun")); // min/km in mm:ss => Decimal 8,5
        let runTime = Math.ceil(((distanceTrack / 1000) * speedRun)); 
        document.getElementById("r_runTime").innerHTML = runTime + " min";
        //console.log(typeof(startTime));
        let goalTime = startTime.plus({minutes: runTime});
        document.getElementById("r_goalTime").innerHTML = dateTimeISOTimeFormat(goalTime);

        saveSettings();
        updateShareData();

    } else {
        console.log("Could not update result");
        //setTimeout(calculateResult, 50, 1);
    }
}

let _getData = () => {
    let data = {};
    _.each(forms, (sec, idx, list) => {
        _.each(sec.items, (item, idx, list) => {
            data[item.id] = document.getElementById(item.id).value;
        });
    });
    return data;
}

const storageKey = "ol-time-data";
let saveSettings = () => {
    let data = _getData();
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.debug("Saved data", data);
}
let loadSettings = () => {
    let data = JSON.parse(localStorage.getItem(storageKey));
    console.debug("Loaded data", data);
    return data;
}
let settingsExists = () => {
    return !(localStorage.getItem(storageKey) === null);
}
let populateValues = (data) => {
    console.log(data);
    _.each(_.keys(data), (key, idx, list) => {
        document.getElementById(key).value = data[key];
        //console.log(key, data[key]);
    });
}


let safeEncode = (decoded) => {return LZString.compressToEncodedURIComponent(safe(decoded))};
let safeDecode = (encoded) => {return safe(LZString.decompressFromEncodedURIComponent(encoded))};
let _getEncodedData = () => {
    let data = JSON.stringify(_getData());
    let encoded = safeEncode(data);
    return encoded;
}
let shareResult = () => {
    let encoded = _getEncodedData();
    let shareLink = _createShareLink(encoded);
    _copyToClipboard(shareLink);
    document.getElementById("linkToShare").innerHTML = "<br><br>"+shareLink;
    document.getElementById("shareDataCopied").classList.remove("d-none");
    setTimeout(() => {
        document.getElementById("shareDataCopied").classList.add("d-none");
    }, 8000);
}
let parseSharedData = (data) => {
    data = safeDecode(data);
    data = JSON.parse(data);
    //console.debug("Shared data parsed", data);
    return data;
}
let _createShareLink = (data) => {
    let href = document.location.href;
    if(href.indexOf("#") > 0) {
        href = href.substring(0, href.lastIndexOf('#'));
    }
    console.log("Link base", href, document.location);
    return href + "#s/" + data; //shareResult();
}
let updateShareData = () => {
    let data = _getData();
    //let href = document.location;
    //href = href.substring(0, href.lastIndexOf('#'));
    document.getElementById("shareLink").href = _createShareLink(data); //href + "#s/" + shareResult();
}
let _copyToClipboard = (data) => {
    var copyText = document.getElementById("shareDataHolder");
    copyText.classList.remove("d-none");
    copyText.value = data;
  
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
  
    /* Copy the text inside the text field */
    document.execCommand("copy");
    copyText.classList.add("d-none");
  
    /* Alert the copied text */
    console.log("Copied the text: " + copyText.value);
};

let forms = {
    "toArena": {
        "title": "Tid till arena",
        "color": "border-warning",
        "icon": "bicycle", // car-front-fill
        "items": [
            {
                "id": "travelTime",
                "label": "Restid till parkering",
                "format": "min",
                "default": "30",
                "quick": [
                    {"0 min": 0},
                    {"15 min": 15},
                    {"45 min": 45},
                    {"60 min": 60},
                    {"90 min": 90}
                ]
            },
            {
                "id": "distanceArena",
                "label": "Avstånd parkering till arena",
                //"description": "Parkering till arena",
                "format": "m",
                "default": 1000,
                "quick": [
                    {"0 m": 0},
                    {"500 m": 500},
                    {"1500 m": 1500},
                    {"2000 m": 2000}
                ]
            },
            {
                "id": "speedArena",
                "label": "Gångtempo till arena",
                "description": "20 min/km = 3 km/t<br>12 min/km = 5 km/t (Normal)<br>8 min/km = 7,5 km/t (Rask)<br>6 min/km = 10 km/t (Jogg)",
                "format": "min/km [mm:ss]",
                "default": "12:00",
                "quick": [
                    //{"Gång 20": "20:00"}, // 20 min/km =>   3 km/h
                    //{"Gång 12": "12:00"}, // 12 min/km =>   5 km/h Normal 4-5
                    //{"Gång 8": "8:00"},   //  8 min/km => 7,5 km/h Rask promenad 5-6 km/h
                    //{"Gång 20": "20:00"}, // 20 min/km =>   3 km/h
                    //{"Gång 12": "12:00"}, // 12 min/km =>   5 km/h Normal 4-5
                    //{"Gång 8": "8:00"},   //  8 min/km => 7,5 km/h Rask promenad 5-6 km/h
                    //{"Jogg 6": "6:00"}    //  6 min/km =>  10 km/h
                    {"20:00": "20:00"}, // 20 min/km =>   3 km/h
                    {"10:00": "10:00"}, // 12 min/km =>   5 km/h Normal 4-5
                    {"8:00": "8:00"},   //  8 min/km => 7,5 km/h Rask promenad 5-6 km/h
                ]
            },
        ]
    },
    "toStart": {
        "title": "Tid till start",
        "color": "border-danger",
        "icon": "escape", // hourglass-split, smartwatch
        "items": [
            {
                "id": "startTime",
                "label": "Starttid",
                //"description": "Tilldelad starttid, eller planerad",
                "format": "tt:mm",
                "default": "09:30"
            },
            {
                "id": "arenaTime",
                "label": "Tid på arena",
                "description": "Tid för att prata, knyta skorna etc.",
                "format": "m",
                "default": 20,
                "quick": [
                    {"0 min": 0},
                    {"15 min": 15},
                    {"30 min": 30},
                    {"45 min": 45}
                ]
            },
            {
                "id": "distanceStart",
                "label": "Avstånd till start",
                //"description": "Arena till start",
                "format": "m",
                "default": 1000,
                "quick": [
                    {"500 m": 500},
                    {"1500 m": 1500},
                    {"2000 m": 2000}
                ]
            },
            {
                "id": "speedStart",
                "label": "Gång-/löptempo till start",
                "description": "20:00 min/km = 3 km/t<br>12:00 min/km = 5 km/t (Normal)<br>08:00 min/km = 7,5 km/t (Rask)<br>06:00 min/km = 10 km/t (Jogg)",
                "format": "min/km [mm:ss]",
                "default": "10:00",
//                "quick": [
//                    {"Gång 3,0": "3,0"},
//                    {"Gång 5,0": "5,0"},
//                    {"Gång 6,5": "6,5"},
//                    {"Jogg 8,0": "8,0"}
//                ],
                "quick": [
                    //{"Gång 20": "20:00"}, // 20 min/km =>   3 km/h
                    //{"Gång 12": "12:00"}, // 12 min/km =>   5 km/h Normal 4-5
                    //{"Gång 8": "8:00"},   //  8 min/km => 7,5 km/h Rask promenad 5-6 km/h
                    //{"Jogg 6": "6:00"}    //  6 min/km =>  10 km/h
                    {"20:00": "20:00"}, // 20 min/km =>   3 km/h
                    {"12:00": "12:00"}, // 12 min/km =>   5 km/h Normal 4-5
                    {"8:00": "8:00"},   //  8 min/km => 7,5 km/h Rask promenad 5-6 km/h
                    {"6:00": "6:00"}    //  6 min/km =>  10 km/h
                ]
            },
            {
                "id": "olTime",
                "label": "Gå-fram-tid",
                "description": "Tid när du ska gå in i startfålla",
                "format": "min",
                "default": 3,
                "quick": [
                    {"0 min": 0},
                    {"1 min": 1},
                    {"2 min": 2},
                    {"3 min": 3},
                    {"4 min": 4}
                ]
            },
            {
                "id": "extraTime",
                "label": "Uppvärmings-/extratid",
                "description": "Extra tid vid start",
                "format": "min",
                "default": 0,
                "quick": [
                    {"5 min": 5},
                    {"10 min": 10},
                    {"15 min": 15},
                    {"20 min": 20}
                ]
            },
        ]
    },
    "runTime": {
        "title": "Löptid på bana",
        "color": "border-info",
        "icon": "cursor-fill", // map, speedometer2, stopwatch
        "items": [
            {
                "id": "distanceTrack",
                "label": "Beräknad banlängd",
                //"description": "Arena till start",
                "format": "m",
                "default": 3500,
                "quick": [
                    {"4000 m": 4000},
                    {"5000 m": 5000},
                    {"6000 m": 6000}
                ]
            },
            {
                "id": "speedRun",
                "label": "Tempo",
                "description": "Genomsnittstempo på bana",
                "format": "min/km [mm:ss]",
                "default": "10:00",
                "quick": [
                    {"15:00": "15:00"}, // 4 km/h
                    {"12:00": "12:00"}, // 5 km/h
                    {"8:00": "8:00"},   // 7,5 km/h
                    {"6:00": "6:00"},   // 10 km/h
                    {"4:00": "4:00"}    // 15 km/h
                ]
            }
        ]
    }
};
