// BULLMONEY PUSH NOTIFICATION MANAGER v1.0
// Handles push notification registration, permission, and delivery across ALL devices:
// - Android Chrome/Firefox/Edge/Samsung Internet/Opera/Brave
// - iOS 16.4+ Safari PWA (must be installed + user gesture)
// - macOS Safari 16+, Chrome, Firefox, Edge
// - Windows Chrome, Edge, Firefox
// - Linux Chrome, Firefox
// - WebViews: Limited (Instagram/FB/TikTok — show fallback)
// Runs AFTER device-detect.js and device-capabilities.js
(function(){
'use strict';
var w=window,d=document,n=navigator;
var R=w.__BM_DEVICE__||{};
var SUBSCRIBE_URL='/api/notifications/subscribe';
var UNSUBSCRIBE_URL='/api/notifications/unsubscribe';

var PM={
  supported:false,
  permission:'default',
  subscription:null,
  swRegistration:null,
  iosPWARequired:false,
  error:null,
  channels:['trades','news','community','vip'],
};

// ═══════════════════════════════════════════════════════════
// 1. DETECT PUSH NOTIFICATION SUPPORT
// ═══════════════════════════════════════════════════════════
PM.supported=('serviceWorker' in n)&&('PushManager' in w)&&('Notification' in w);

// iOS special case: Needs to be installed as PWA (Home Screen) for push
if(R.os==='ios'){
  var isStandalone=w.matchMedia&&w.matchMedia('(display-mode: standalone)').matches;
  var isNavigatorStandalone=!!n.standalone;
  PM.iosPWARequired=!isStandalone&&!isNavigatorStandalone;
  if(PM.iosPWARequired){
    PM.supported=false; // Not installed — can't do push on iOS
  }
}

// WebView: No push support
if(R.isInApp||R.isWebView){
  PM.supported=false;
  PM.error='in-app-browser';
}

PM.permission=('Notification' in w)?Notification.permission:'denied';

// ═══════════════════════════════════════════════════════════
// 2. GET SW REGISTRATION
// ═══════════════════════════════════════════════════════════
function getSWRegistration(){
  return new Promise(function(resolve){
    if(!('serviceWorker' in n))return resolve(null);
    n.serviceWorker.ready.then(function(reg){
      PM.swRegistration=reg;
      resolve(reg);
    }).catch(function(){resolve(null);});
  });
}

// ═══════════════════════════════════════════════════════════
// 3. SUBSCRIBE TO PUSH
// ═══════════════════════════════════════════════════════════
function urlBase64ToUint8Array(base64String){
  var padding='='.repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/\-/g,'+').replace(/_/g,'/');
  var rawData=atob(base64);
  var outputArray=new Uint8Array(rawData.length);
  for(var i=0;i<rawData.length;i++){outputArray[i]=rawData.charCodeAt(i);}
  return outputArray;
}

function subscribe(channels){
  if(!PM.supported)return Promise.resolve({ok:false,reason:PM.error||'unsupported'});

  return getSWRegistration().then(function(reg){
    if(!reg)return{ok:false,reason:'no-sw'};

    // Request notification permission (MUST be in user gesture on iOS)
    return Notification.requestPermission().then(function(perm){
      PM.permission=perm;
      d.documentElement.setAttribute('data-notification-perm',perm);

      if(perm!=='granted')return{ok:false,reason:'denied'};

      // Get VAPID public key
      var vapidKey=w.__BM_VAPID_PUBLIC_KEY__;
      if(!vapidKey){
        // Try to get from meta tag or env
        var meta=d.querySelector('meta[name="vapid-public-key"]');
        vapidKey=meta?meta.getAttribute('content'):'';
      }
      if(!vapidKey)return{ok:false,reason:'no-vapid-key'};

      var subOptions={
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(vapidKey)
      };

      return reg.pushManager.subscribe(subOptions).then(function(sub){
        PM.subscription=sub;
        // Send to server
        return sendSubscriptionToServer(sub,channels||PM.channels);
      });
    });
  }).catch(function(err){
    PM.error=err.message;
    return{ok:false,reason:err.message};
  });
}

// ═══════════════════════════════════════════════════════════
// 4. SEND SUBSCRIPTION TO SERVER
// ═══════════════════════════════════════════════════════════
function sendSubscriptionToServer(sub,channels){
  var subJSON=sub.toJSON();
  return fetch(SUBSCRIBE_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      subscription:{
        endpoint:subJSON.endpoint,
        keys:{p256dh:subJSON.keys.p256dh,auth:subJSON.keys.auth}
      },
      channels:channels||PM.channels,
      device:{
        model:R.deviceModel||'unknown',
        os:R.os||'unknown',
        browser:R.browser||'unknown',
        platform:R.devicePlatform||'unknown'
      }
    })
  }).then(function(r){
    if(r.ok)return{ok:true,subscription:sub};
    return{ok:false,reason:'server-error-'+r.status};
  }).catch(function(err){
    return{ok:false,reason:err.message};
  });
}

// ═══════════════════════════════════════════════════════════
// 5. UNSUBSCRIBE
// ═══════════════════════════════════════════════════════════
function unsubscribe(){
  return getSWRegistration().then(function(reg){
    if(!reg)return{ok:false};
    return reg.pushManager.getSubscription().then(function(sub){
      if(!sub)return{ok:true};
      var endpoint=sub.endpoint;
      return sub.unsubscribe().then(function(){
        PM.subscription=null;
        return fetch(UNSUBSCRIBE_URL,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({endpoint:endpoint})
        }).then(function(){return{ok:true};}).catch(function(){return{ok:true};});
      });
    });
  }).catch(function(){return{ok:false};});
}

// ═══════════════════════════════════════════════════════════
// 6. CHECK EXISTING SUBSCRIPTION
// ═══════════════════════════════════════════════════════════
function checkSubscription(){
  return getSWRegistration().then(function(reg){
    if(!reg)return null;
    return reg.pushManager.getSubscription().then(function(sub){
      PM.subscription=sub;
      return sub;
    });
  }).catch(function(){return null;});
}

// ═══════════════════════════════════════════════════════════
// 7. PERIODIC SUBSCRIPTION REFRESH (prevents expiry)
// ═══════════════════════════════════════════════════════════
function refreshSubscription(){
  return checkSubscription().then(function(sub){
    if(!sub)return{ok:false,reason:'no-subscription'};
    // Re-send to server to keep it fresh
    return sendSubscriptionToServer(sub,PM.channels);
  });
}

// Refresh every 7 days
var REFRESH_INTERVAL_KEY='bm_push_last_refresh';
function scheduleRefresh(){
  try{
    var last=parseInt(localStorage.getItem(REFRESH_INTERVAL_KEY)||'0',10);
    var now=Date.now();
    var sevenDays=7*24*60*60*1000;
    if(now-last>sevenDays){
      refreshSubscription().then(function(r){
        if(r&&r.ok)localStorage.setItem(REFRESH_INTERVAL_KEY,String(now));
      });
    }
  }catch(e){}
}

// ═══════════════════════════════════════════════════════════
// 8. NOTIFICATION PERMISSION PROMPT HELPER
// For iOS PWA: Shows "Add to Home Screen" instructions
// For all others: Shows notification permission request
// ═══════════════════════════════════════════════════════════
function getPromptInfo(){
  if(R.isInApp||R.isWebView){
    return{type:'open-browser',message:'Open in your browser (Safari/Chrome) for notifications'};
  }
  if(R.os==='ios'&&PM.iosPWARequired){
    return{type:'add-to-home',message:'Add BullMoney to your Home Screen to enable notifications',steps:['Tap the Share button','Scroll down and tap "Add to Home Screen"','Open BullMoney from your Home Screen','Then enable notifications']};
  }
  if(PM.permission==='denied'){
    return{type:'settings',message:'Notifications are blocked. Enable them in your browser settings.'};
  }
  return{type:'request',message:'Enable notifications to get trade alerts even when the app is closed'};
}

// ═══════════════════════════════════════════════════════════
// 9. LOCAL NOTIFICATION FALLBACK (for browsers without push)
// ═══════════════════════════════════════════════════════════
function showLocalNotification(title,body,options){
  if(!('Notification' in w))return false;
  if(Notification.permission!=='granted')return false;
  try{
    new Notification(title,Object.assign({icon:'/bullmoney-logo.png',badge:'/B.png',body:body},options||{}));
    return true;
  }catch(e){
    // Mobile browsers require SW for notifications
    if(PM.swRegistration){
      PM.swRegistration.showNotification(title,Object.assign({icon:'/bullmoney-logo.png',badge:'/B.png',body:body},options||{}));
      return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// 10. LISTEN FOR NOTIFICATION CLICKS (from SW)
// ═══════════════════════════════════════════════════════════
if('serviceWorker' in n){
  n.serviceWorker.addEventListener('message',function(event){
    if(!event.data)return;
    if(event.data.type==='NOTIFICATION_CLICK'){
      var url=event.data.url;
      if(url&&w.location.pathname!==new URL(url,w.location.origin).pathname){
        w.location.href=url;
      }
      // Dispatch custom event for React components
      try{w.dispatchEvent(new CustomEvent('bm:notification-click',{detail:event.data}));}catch(e){}
    }
  });
}

// ═══════════════════════════════════════════════════════════
// 11. EXPOSE PUBLIC API
// ═══════════════════════════════════════════════════════════
w.__BM_PUSH__={
  // State
  supported:PM.supported,
  permission:PM.permission,
  iosPWARequired:PM.iosPWARequired,
  error:PM.error,

  // Actions
  subscribe:subscribe,
  unsubscribe:unsubscribe,
  checkSubscription:checkSubscription,
  refreshSubscription:refreshSubscription,
  showLocal:showLocalNotification,
  getPromptInfo:getPromptInfo,

  // Get current state
  getState:function(){
    return{
      supported:PM.supported,
      permission:('Notification' in w)?Notification.permission:PM.permission,
      hasSubscription:!!PM.subscription,
      iosPWARequired:PM.iosPWARequired,
      isInApp:!!(R.isInApp||R.isWebView),
      error:PM.error
    };
  }
};

// ═══════════════════════════════════════════════════════════
// 12. AUTO-INIT: Check existing subscription + schedule refresh
// ═══════════════════════════════════════════════════════════
if(PM.supported){
  // Wait for SW to be ready then check subscription
  getSWRegistration().then(function(){
    checkSubscription();
    scheduleRefresh();
  });
}

// Register with global Brain orchestrator
if(w.__BM_BRAIN__&&w.__BM_BRAIN__.register){
  w.__BM_BRAIN__.register('push-manager',w.__BM_PUSH__);
  w.__BM_BRAIN__.setState('push',w.__BM_PUSH__);
}

try{w.dispatchEvent(new CustomEvent('bm:push-ready',{detail:w.__BM_PUSH__}));}catch(e){}

if(w.location.hostname==='localhost'){
  console.log('[BM Push] v1.0 —',
    'Supported:',PM.supported,
    '| Permission:',PM.permission,
    '| iOS PWA Required:',PM.iosPWARequired,
    '| In-App:',!!(R.isInApp||R.isWebView)
  );
}
})();
