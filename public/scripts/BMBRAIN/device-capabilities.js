// BULLMONEY DEVICE CAPABILITIES v1.0
// 55+ iOS devices, 55+ Samsung devices, full capability detection
// Haptics, Camera, Sound, Notifications, Sensors, Biometrics
// Loads after device-detect.js
(function(){
'use strict';
var w=window,d=document,n=navigator,docEl=d.documentElement;
var R=w.__BM_DEVICE__||{};

// ═══════════════════════════════════════════════════════════════
// 1. iOS DEVICE DATABASE — 55+ models with screen specs
// Uses screen dimensions + DPR to identify specific models
// ═══════════════════════════════════════════════════════════════
var IOS_DEVICES=[
  // iPhone 16 series (2024)
  {w:440,h:956,dpr:3,name:'iPhone 16 Pro Max',chip:'A18Pro',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-5x',yr:2024},
  {w:402,h:874,dpr:3,name:'iPhone 16 Pro',chip:'A18Pro',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-5x',yr:2024},
  {w:393,h:852,dpr:3,name:'iPhone 16',chip:'A18',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-2x',yr:2024},
  {w:393,h:852,dpr:3,name:'iPhone 16 Plus',chip:'A18',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-2x',yr:2024},
  // iPhone 15 series (2023)
  {w:430,h:932,dpr:3,name:'iPhone 15 Pro Max',chip:'A17Pro',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-5x',yr:2023},
  {w:393,h:852,dpr:3,name:'iPhone 15 Pro',chip:'A17Pro',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-3x',yr:2023},
  {w:393,h:852,dpr:3,name:'iPhone 15',chip:'A16',ram:6,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-2x',yr:2023},
  {w:430,h:932,dpr:3,name:'iPhone 15 Plus',chip:'A16',ram:6,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-2x',yr:2023},
  // iPhone 14 series (2022)
  {w:430,h:932,dpr:3,name:'iPhone 14 Pro Max',chip:'A16',ram:6,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-3x',yr:2022},
  {w:393,h:852,dpr:3,name:'iPhone 14 Pro',chip:'A16',ram:6,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP-3x',yr:2022},
  {w:390,h:844,dpr:3,name:'iPhone 14',chip:'A15',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2022},
  {w:428,h:926,dpr:3,name:'iPhone 14 Plus',chip:'A15',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2022},
  // iPhone 13 series (2021)
  {w:428,h:926,dpr:3,name:'iPhone 13 Pro Max',chip:'A15',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-3x',yr:2021},
  {w:390,h:844,dpr:3,name:'iPhone 13 Pro',chip:'A15',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-3x',yr:2021},
  {w:390,h:844,dpr:3,name:'iPhone 13',chip:'A15',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2021},
  {w:375,h:812,dpr:3,name:'iPhone 13 Mini',chip:'A15',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2021},
  // iPhone 12 series (2020)
  {w:428,h:926,dpr:3,name:'iPhone 12 Pro Max',chip:'A14',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-2.5x',yr:2020},
  {w:390,h:844,dpr:3,name:'iPhone 12 Pro',chip:'A14',ram:6,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2020},
  {w:390,h:844,dpr:3,name:'iPhone 12',chip:'A14',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2020},
  {w:375,h:812,dpr:3,name:'iPhone 12 Mini',chip:'A14',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2020},
  // iPhone 11 series (2019)
  {w:414,h:896,dpr:3,name:'iPhone 11 Pro Max',chip:'A13',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2019},
  {w:375,h:812,dpr:3,name:'iPhone 11 Pro',chip:'A13',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2019},
  {w:414,h:896,dpr:2,name:'iPhone 11',chip:'A13',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2019},
  {w:414,h:896,dpr:2,name:'iPhone XR',chip:'A12',ram:3,haptic:'taptic-2',notch:'notch',camera:'12MP',yr:2018},
  // iPhone X series (2017-2018)
  {w:414,h:896,dpr:3,name:'iPhone XS Max',chip:'A12',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2018},
  {w:375,h:812,dpr:3,name:'iPhone XS',chip:'A12',ram:4,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2018},
  {w:375,h:812,dpr:3,name:'iPhone X',chip:'A11',ram:3,haptic:'taptic-2',notch:'notch',camera:'12MP-2x',yr:2017},
  // iPhone 8/7/6S/SE series
  {w:414,h:736,dpr:3,name:'iPhone 8 Plus',chip:'A11',ram:3,haptic:'taptic-1',notch:'none',camera:'12MP-2x',yr:2017},
  {w:375,h:667,dpr:2,name:'iPhone 8',chip:'A11',ram:2,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2017},
  {w:414,h:736,dpr:3,name:'iPhone 7 Plus',chip:'A10',ram:3,haptic:'taptic-1',notch:'none',camera:'12MP-2x',yr:2016},
  {w:375,h:667,dpr:2,name:'iPhone 7',chip:'A10',ram:2,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2016},
  {w:414,h:736,dpr:3,name:'iPhone 6S Plus',chip:'A9',ram:2,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2015},
  {w:375,h:667,dpr:2,name:'iPhone 6S',chip:'A9',ram:2,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2015},
  {w:375,h:667,dpr:2,name:'iPhone 6',chip:'A8',ram:1,haptic:'none',notch:'none',camera:'8MP',yr:2014},
  // iPhone SE series
  {w:375,h:812,dpr:3,name:'iPhone SE 4',chip:'A18',ram:8,haptic:'taptic-3',notch:'dynamic-island',camera:'48MP',yr:2025},
  {w:375,h:667,dpr:2,name:'iPhone SE 3',chip:'A15',ram:4,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2022},
  {w:375,h:667,dpr:2,name:'iPhone SE 2',chip:'A13',ram:3,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2020},
  {w:320,h:568,dpr:2,name:'iPhone SE 1',chip:'A9',ram:2,haptic:'taptic-1',notch:'none',camera:'12MP',yr:2016},
  // iPad (via desktop UA with maxTouchPoints)
  {w:1024,h:1366,dpr:2,name:'iPad Pro 12.9"',chip:'M2',ram:8,haptic:'none',notch:'none',camera:'12MP',yr:2022},
  {w:834,h:1194,dpr:2,name:'iPad Pro 11"',chip:'M2',ram:8,haptic:'none',notch:'none',camera:'12MP',yr:2022},
  {w:820,h:1180,dpr:2,name:'iPad Air M2',chip:'M2',ram:8,haptic:'none',notch:'none',camera:'12MP',yr:2024},
  {w:820,h:1180,dpr:2,name:'iPad Air M1',chip:'M1',ram:8,haptic:'none',notch:'none',camera:'12MP',yr:2022},
  {w:810,h:1080,dpr:2,name:'iPad 10th Gen',chip:'A14',ram:4,haptic:'none',notch:'none',camera:'12MP',yr:2022},
  {w:834,h:1112,dpr:2,name:'iPad Air 4',chip:'A14',ram:4,haptic:'none',notch:'none',camera:'12MP',yr:2020},
  {w:768,h:1024,dpr:2,name:'iPad 9th Gen',chip:'A13',ram:3,haptic:'none',notch:'none',camera:'8MP',yr:2021},
  {w:744,h:1133,dpr:2,name:'iPad Mini 6',chip:'A15',ram:4,haptic:'none',notch:'none',camera:'12MP',yr:2021},
  {w:768,h:1024,dpr:2,name:'iPad 8th Gen',chip:'A12',ram:3,haptic:'none',notch:'none',camera:'8MP',yr:2020},
  {w:768,h:1024,dpr:2,name:'iPad 7th Gen',chip:'A10',ram:3,haptic:'none',notch:'none',camera:'8MP',yr:2019},
  {w:834,h:1112,dpr:2,name:'iPad Air 3',chip:'A12',ram:3,haptic:'none',notch:'none',camera:'8MP',yr:2019},
  {w:768,h:1024,dpr:2,name:'iPad Mini 5',chip:'A12',ram:3,haptic:'none',notch:'none',camera:'8MP',yr:2019},
  {w:834,h:1194,dpr:2,name:'iPad Pro 11" (2018)',chip:'A12X',ram:4,haptic:'none',notch:'none',camera:'12MP',yr:2018},
  {w:1024,h:1366,dpr:2,name:'iPad Pro 12.9" (2018)',chip:'A12X',ram:4,haptic:'none',notch:'none',camera:'12MP',yr:2018},
  // iPod Touch
  {w:320,h:568,dpr:2,name:'iPod Touch 7',chip:'A10',ram:2,haptic:'none',notch:'none',camera:'8MP',yr:2019},
  // iPhone 5S/5C (legacy)
  {w:320,h:568,dpr:2,name:'iPhone 5S',chip:'A7',ram:1,haptic:'none',notch:'none',camera:'8MP',yr:2013},
];

// ═══════════════════════════════════════════════════════════════
// 2. SAMSUNG DEVICE DATABASE — 55+ models
// Uses screen dimensions + DPR + UA parsing
// ═══════════════════════════════════════════════════════════════
var SAMSUNG_DEVICES=[
  // Galaxy S25 series (2025)
  {w:412,h:915,name:'Galaxy S25 Ultra',chip:'SD8E4',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'200MP',yr:2025},
  {w:412,h:906,name:'Galaxy S25+',chip:'SD8E4',ram:12,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2025},
  {w:360,h:780,name:'Galaxy S25',chip:'SD8E4',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2025},
  // Galaxy S24 series (2024)
  {w:412,h:915,name:'Galaxy S24 Ultra',chip:'SD8G3',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'200MP',yr:2024},
  {w:412,h:906,name:'Galaxy S24+',chip:'SD8G3',ram:12,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:360,h:780,name:'Galaxy S24',chip:'Exynos2400',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:360,h:780,name:'Galaxy S24 FE',chip:'Exynos2400e',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  // Galaxy S23 series (2023)
  {w:412,h:915,name:'Galaxy S23 Ultra',chip:'SD8G2',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'200MP',yr:2023},
  {w:412,h:906,name:'Galaxy S23+',chip:'SD8G2',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  {w:360,h:780,name:'Galaxy S23',chip:'SD8G2',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  {w:360,h:780,name:'Galaxy S23 FE',chip:'Exynos2200',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  // Galaxy S22 series (2022)
  {w:412,h:915,name:'Galaxy S22 Ultra',chip:'SD8G1',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'108MP',yr:2022},
  {w:412,h:906,name:'Galaxy S22+',chip:'SD8G1',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2022},
  {w:360,h:780,name:'Galaxy S22',chip:'SD8G1',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2022},
  // Galaxy S21 series (2021)
  {w:412,h:915,name:'Galaxy S21 Ultra',chip:'SD888',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'108MP',yr:2021},
  {w:412,h:906,name:'Galaxy S21+',chip:'SD888',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2021},
  {w:360,h:780,name:'Galaxy S21',chip:'SD888',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2021},
  {w:360,h:780,name:'Galaxy S21 FE',chip:'SD888',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',yr:2022},
  // Galaxy S20 series (2020)
  {w:412,h:915,name:'Galaxy S20 Ultra',chip:'SD865',ram:12,haptic:true,spen:false,notch:'punch-hole',camera:'108MP',yr:2020},
  {w:412,h:906,name:'Galaxy S20+',chip:'SD865',ram:12,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2020},
  {w:360,h:780,name:'Galaxy S20',chip:'SD865',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2020},
  {w:360,h:780,name:'Galaxy S20 FE',chip:'SD865',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',yr:2020},
  // Galaxy Z Fold series
  {w:373,h:846,name:'Galaxy Z Fold 6',chip:'SD8G3',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'50MP',fold:true,yr:2024},
  {w:373,h:846,name:'Galaxy Z Fold 5',chip:'SD8G2',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'50MP',fold:true,yr:2023},
  {w:373,h:846,name:'Galaxy Z Fold 4',chip:'SD8pG1',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'50MP',fold:true,yr:2022},
  {w:373,h:846,name:'Galaxy Z Fold 3',chip:'SD888',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'12MP',fold:true,yr:2021},
  {w:373,h:846,name:'Galaxy Z Fold 2',chip:'SD865p',ram:12,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',fold:true,yr:2020},
  // Galaxy Z Flip series
  {w:412,h:982,name:'Galaxy Z Flip 6',chip:'SD8G3',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',fold:true,yr:2024},
  {w:412,h:982,name:'Galaxy Z Flip 5',chip:'SD8G2',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',fold:true,yr:2023},
  {w:412,h:982,name:'Galaxy Z Flip 4',chip:'SD8pG1',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',fold:true,yr:2022},
  {w:412,h:982,name:'Galaxy Z Flip 3',chip:'SD888',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'12MP',fold:true,yr:2021},
  // Galaxy A series (mid-range — HUGE in developing markets)
  {w:412,h:915,name:'Galaxy A55',chip:'Exynos1480',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:412,h:915,name:'Galaxy A54',chip:'Exynos1380',ram:8,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  {w:412,h:915,name:'Galaxy A53',chip:'Exynos1280',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2022},
  {w:412,h:915,name:'Galaxy A52',chip:'SD750G',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'64MP',yr:2021},
  {w:412,h:915,name:'Galaxy A35',chip:'Exynos1380',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:412,h:915,name:'Galaxy A34',chip:'Dimensity1080',ram:6,haptic:true,spen:false,notch:'punch-hole',camera:'48MP',yr:2023},
  {w:412,h:915,name:'Galaxy A33',chip:'Exynos1280',ram:6,haptic:false,spen:false,notch:'punch-hole',camera:'48MP',yr:2022},
  {w:360,h:780,name:'Galaxy A25',chip:'Exynos1280',ram:6,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:360,h:780,name:'Galaxy A24',chip:'Helio G99',ram:4,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  {w:360,h:780,name:'Galaxy A23',chip:'SD680',ram:4,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2022},
  {w:360,h:780,name:'Galaxy A15',chip:'Helio G99',ram:4,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2024},
  {w:360,h:780,name:'Galaxy A14',chip:'Exynos850',ram:4,haptic:false,spen:false,notch:'notch',camera:'50MP',yr:2023},
  {w:360,h:780,name:'Galaxy A13',chip:'Exynos850',ram:4,haptic:false,spen:false,notch:'notch',camera:'50MP',yr:2022},
  {w:320,h:640,name:'Galaxy A05',chip:'Helio G85',ram:4,haptic:false,spen:false,notch:'notch',camera:'50MP',yr:2023},
  // Galaxy M series (budget — popular in India/SE Asia)
  {w:412,h:915,name:'Galaxy M54',chip:'SD888',ram:8,haptic:false,spen:false,notch:'punch-hole',camera:'108MP',yr:2023},
  {w:412,h:915,name:'Galaxy M34',chip:'Exynos1280',ram:6,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  {w:360,h:780,name:'Galaxy M14',chip:'Exynos1330',ram:4,haptic:false,spen:false,notch:'punch-hole',camera:'50MP',yr:2023},
  // Galaxy Tab series
  {w:800,h:1280,name:'Galaxy Tab S9 Ultra',chip:'SD8G2',ram:12,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2023},
  {w:800,h:1280,name:'Galaxy Tab S9+',chip:'SD8G2',ram:12,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2023},
  {w:800,h:1280,name:'Galaxy Tab S9',chip:'SD8G2',ram:8,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2023},
  {w:800,h:1280,name:'Galaxy Tab A9',chip:'SD695',ram:4,haptic:false,spen:false,notch:'none',camera:'8MP',yr:2023},
  {w:800,h:1280,name:'Galaxy Tab S8 Ultra',chip:'SD8G1',ram:12,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2022},
  {w:800,h:1280,name:'Galaxy Tab S8+',chip:'SD8G1',ram:8,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2022},
  {w:800,h:1280,name:'Galaxy Tab S8',chip:'SD8G1',ram:8,haptic:false,spen:true,notch:'none',camera:'13MP',yr:2022},
  // Galaxy Note (legacy but still in use)
  {w:412,h:915,name:'Galaxy Note 20 Ultra',chip:'SD865p',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'108MP',yr:2020},
  {w:412,h:915,name:'Galaxy Note 20',chip:'SD865p',ram:8,haptic:true,spen:true,notch:'punch-hole',camera:'64MP',yr:2020},
  {w:412,h:915,name:'Galaxy Note 10+',chip:'SD855',ram:12,haptic:true,spen:true,notch:'punch-hole',camera:'16MP',yr:2019},
];

// ═══════════════════════════════════════════════════════════════
// 3. DEVICE IDENTIFICATION
// ═══════════════════════════════════════════════════════════════
var ua=n.userAgent||'';
var sw=screen.width||0,sh=screen.height||0,dpr=w.devicePixelRatio||1;
var minDim=Math.min(sw,sh),maxDim=Math.max(sw,sh);

function identifyDevice(){
  var match=null;

  if(R.os==='ios'||(/iphone|ipad|ipod/i.test(ua))||(/macintosh/i.test(ua)&&n.maxTouchPoints>1)){
    // Try to match iOS device by screen dimensions
    for(var i=0;i<IOS_DEVICES.length;i++){
      var dev=IOS_DEVICES[i];
      if((minDim===dev.w&&maxDim===dev.h)||(minDim===dev.h&&maxDim===dev.w)){
        if(Math.abs(dpr-dev.dpr)<0.5){
          match=dev;
          match.platform='ios';
          break;
        }
      }
    }
    // Fallback: unknown iOS device
    if(!match){
      match={name:'iOS Device',platform:'ios',chip:'unknown',ram:n.deviceMemory||4,haptic:'taptic-1',notch:sh>800?'notch':'none',camera:'12MP',yr:2020};
    }
  }

  if(!match&&(/samsung|sm-/i.test(ua))){
    // Try to extract Samsung model from UA
    var smMatch=ua.match(/SM-[A-Z]\d{3,4}[A-Z]?\b/i);
    var samsungModel=smMatch?smMatch[0]:'';
    // Try screen-based matching
    for(var j=0;j<SAMSUNG_DEVICES.length;j++){
      var sdev=SAMSUNG_DEVICES[j];
      if((minDim===sdev.w&&maxDim===sdev.h)||(Math.abs(minDim-sdev.w)<15&&Math.abs(maxDim-sdev.h)<15)){
        match=sdev;
        match.platform='samsung';
        match.modelNumber=samsungModel;
        break;
      }
    }
    if(!match){
      match={name:'Samsung Device',platform:'samsung',chip:'unknown',ram:n.deviceMemory||4,haptic:true,spen:false,notch:'punch-hole',camera:'50MP',yr:2022,modelNumber:samsungModel};
    }
  }

  return match;
}

var deviceInfo=identifyDevice();
if(deviceInfo){
  R.deviceModel=deviceInfo.name;
  R.deviceChip=deviceInfo.chip;
  R.deviceRam=deviceInfo.ram;
  R.deviceYear=deviceInfo.yr;
  R.deviceCamera=deviceInfo.camera;
  R.hasHaptic=deviceInfo.haptic&&deviceInfo.haptic!=='none';
  R.hapticType=deviceInfo.haptic||'none';
  R.hasSPen=!!deviceInfo.spen;
  R.isFoldableDevice=!!deviceInfo.fold;
  R.notchType=deviceInfo.notch||'none';
  R.devicePlatform=deviceInfo.platform||'unknown';

  docEl.setAttribute('data-device-model',deviceInfo.name.replace(/\s+/g,'-').toLowerCase());
  docEl.setAttribute('data-device-year',deviceInfo.yr||'unknown');
  if(deviceInfo.notch==='dynamic-island')docEl.classList.add('has-dynamic-island');
  else if(deviceInfo.notch==='notch')docEl.classList.add('has-notch');
  else if(deviceInfo.notch==='punch-hole')docEl.classList.add('has-punch-hole');
  if(deviceInfo.fold)docEl.classList.add('is-foldable');
  if(deviceInfo.spen)docEl.classList.add('has-spen');
}

// ═══════════════════════════════════════════════════════════════
// 4. HAPTIC FEEDBACK API — iOS Taptic Engine + Android vibration
// ═══════════════════════════════════════════════════════════════
var hapticSupport='none';
if(n.vibrate)hapticSupport='vibrate';
// Check for iOS-specific haptics (UIImpactFeedbackGenerator via webkit)
// Safari 13+ exposes this for installed PWAs
if(w.webkit&&w.webkit.messageHandlers)hapticSupport='webkit';

w.__BM_HAPTIC__={
  supported:hapticSupport!=='none',
  type:hapticSupport,

  // Light tap (button press, toggle)
  light:function(){
    try{
      if(n.vibrate)n.vibrate(10);
    }catch(e){}
  },
  // Medium tap (selection change, slider snap)
  medium:function(){
    try{
      if(n.vibrate)n.vibrate(25);
    }catch(e){}
  },
  // Heavy tap (success, error confirmation)
  heavy:function(){
    try{
      if(n.vibrate)n.vibrate([30,50,30]);
    }catch(e){}
  },
  // Success pattern (achievement, trade confirmed)
  success:function(){
    try{
      if(n.vibrate)n.vibrate([10,30,10,30,50]);
    }catch(e){}
  },
  // Error pattern (failed action)
  error:function(){
    try{
      if(n.vibrate)n.vibrate([50,100,50,100,50]);
    }catch(e){}
  },
  // Notification pattern
  notification:function(){
    try{
      if(n.vibrate)n.vibrate([100,50,100]);
    }catch(e){}
  },
  // Custom pattern
  pattern:function(arr){
    try{
      if(n.vibrate&&arr&&arr.length)n.vibrate(arr);
    }catch(e){}
  }
};

if(w.__BM_HAPTIC__.supported)docEl.classList.add('haptic-support');

// ═══════════════════════════════════════════════════════════════
// 5. CAMERA API DETECTION
// ═══════════════════════════════════════════════════════════════
R.hasCamera=false;
R.cameraPermission='unknown';

if(n.mediaDevices&&n.mediaDevices.enumerateDevices){
  n.mediaDevices.enumerateDevices().then(function(devices){
    var cameras=devices.filter(function(d){return d.kind==='videoinput';});
    R.hasCamera=cameras.length>0;
    R.cameraCount=cameras.length;
    if(R.hasCamera)docEl.classList.add('has-camera');
  }).catch(function(){
    // Permission denied or not available
    R.hasCamera=false;
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. AUDIO/SOUND CAPABILITIES
// ═══════════════════════════════════════════════════════════════
R.hasAudio=false;
R.hasAudioOutput=false;
try{
  var AudioCtx=w.AudioContext||w.webkitAudioContext;
  if(AudioCtx){
    R.hasAudio=true;
    docEl.classList.add('has-audio');
  }
}catch(e){}

// Check audio output devices
if(n.mediaDevices&&n.mediaDevices.enumerateDevices){
  n.mediaDevices.enumerateDevices().then(function(devices){
    var outputs=devices.filter(function(d){return d.kind==='audiooutput';});
    R.hasAudioOutput=outputs.length>0;
    R.audioOutputCount=outputs.length;
    var inputs=devices.filter(function(d){return d.kind==='audioinput';});
    R.hasMicrophone=inputs.length>0;
    R.microphoneCount=inputs.length;
    if(R.hasMicrophone)docEl.classList.add('has-microphone');
  }).catch(function(){});
}

// ═══════════════════════════════════════════════════════════════
// 7. NOTIFICATION PERMISSION & CAPABILITIES
// Handles: Web Push (Chrome/Firefox/Edge/Samsung Internet),
//          iOS 16.4+ PWA notifications, macOS Safari 16+ Push
// ═══════════════════════════════════════════════════════════════
R.notificationSupport='none';
R.notificationPermission='default';
R.pushSupport=false;

if('Notification' in w){
  R.notificationSupport='basic';
  R.notificationPermission=Notification.permission;
  docEl.setAttribute('data-notification-perm',Notification.permission);
}
if('PushManager' in w){
  R.pushSupport=true;
  R.notificationSupport='push';
  docEl.classList.add('push-support');
}
if('serviceWorker' in n){
  docEl.classList.add('sw-support');
}
// iOS 16.4+ PWA push
if(R.os==='ios'&&R.isPWA&&'PushManager' in w){
  R.notificationSupport='ios-pwa-push';
  docEl.classList.add('ios-pwa-push');
}
// macOS Safari 16+ web push
if(R.os==='macos'&&R.browser==='safari'){
  if('PushManager' in w){
    R.notificationSupport='safari-push';
    docEl.classList.add('safari-push');
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. SENSOR APIs (Gyroscope, Accelerometer, Ambient Light)
// ═══════════════════════════════════════════════════════════════
R.hasGyroscope=false;
R.hasAccelerometer=false;
R.hasAmbientLight=false;

if(w.DeviceOrientationEvent){
  R.hasGyroscope=true;
  docEl.classList.add('has-gyroscope');
}
if(w.DeviceMotionEvent){
  R.hasAccelerometer=true;
  docEl.classList.add('has-accelerometer');
}
if('AmbientLightSensor' in w){
  R.hasAmbientLight=true;
}

// ═══════════════════════════════════════════════════════════════
// 9. BIOMETRIC API (Face ID, Touch ID, Fingerprint)
// ═══════════════════════════════════════════════════════════════
R.hasBiometric=false;
if(w.PublicKeyCredential){
  R.hasBiometric=true;
  docEl.classList.add('has-biometric');
  // Check platform authenticator (Face ID / Touch ID / fingerprint)
  if(w.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable){
    w.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function(avail){
      R.hasPlatformAuth=avail;
      if(avail)docEl.classList.add('has-platform-auth');
    }).catch(function(){});
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. SCREEN WAKE LOCK (prevent screen from sleeping)
// ═══════════════════════════════════════════════════════════════
R.hasWakeLock='wakeLock' in n;
if(R.hasWakeLock)docEl.classList.add('has-wake-lock');

// Expose wake lock helper
w.__BM_WAKE_LOCK__={
  supported:R.hasWakeLock,
  _lock:null,
  acquire:function(){
    if(!R.hasWakeLock)return Promise.resolve(false);
    return n.wakeLock.request('screen').then(function(lock){
      w.__BM_WAKE_LOCK__._lock=lock;
      lock.addEventListener('release',function(){w.__BM_WAKE_LOCK__._lock=null;});
      return true;
    }).catch(function(){return false;});
  },
  release:function(){
    if(w.__BM_WAKE_LOCK__._lock){
      w.__BM_WAKE_LOCK__._lock.release();
      w.__BM_WAKE_LOCK__._lock=null;
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 11. WEB SHARE API + CLIPBOARD
// ═══════════════════════════════════════════════════════════════
R.hasWebShare=!!n.share;
R.hasClipboard=!!(n.clipboard&&n.clipboard.writeText);
if(R.hasWebShare)docEl.classList.add('has-web-share');
if(R.hasClipboard)docEl.classList.add('has-clipboard');

// ═══════════════════════════════════════════════════════════════
// 12. STORE UPDATED STATE
// ═══════════════════════════════════════════════════════════════
w.__BM_DEVICE__=R;
w.__BM_DEVICE_INFO__=deviceInfo;

// Register with global Brain orchestrator
if(w.__BM_BRAIN__&&w.__BM_BRAIN__.register){
  w.__BM_BRAIN__.register('device-capabilities',{device:deviceInfo,capabilities:R});
  w.__BM_BRAIN__.register('haptic',w.__BM_HAPTIC__);
  w.__BM_BRAIN__.setState('device',R);
}

try{w.dispatchEvent(new CustomEvent('bm:device-caps-ready',{detail:{device:deviceInfo,capabilities:R}}));}catch(e){}

if(w.location.hostname==='localhost'){
  console.log('[BM DeviceCaps] v1.0 —',
    'Model:',deviceInfo?deviceInfo.name:'Unknown',
    '| Haptic:',w.__BM_HAPTIC__.supported,
    '| Push:',R.pushSupport,
    '| Camera:',R.hasCamera,
    '| Gamepad:','getGamepads' in n
  );
}
})();
