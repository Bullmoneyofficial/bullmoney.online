(function(){
  try{
    var r=document.documentElement;
    if(!r||!window||!navigator||!screen)return;
    var hz=60;
    if('refreshRate' in screen&&typeof screen.refreshRate==='number'){
      hz=Math.min(screen.refreshRate,120);
    }else{
      var ua=(navigator.userAgent||'').toLowerCase();
      var dpr=window.devicePixelRatio||1;
      var w=screen.width||0,h=screen.height||0;
      if(/iphone/.test(ua)&&dpr>=3&&(w>=390||h>=844))hz=120;
      else if(/ipad/.test(ua)&&dpr>=2&&w>=1024)hz=120;
      else if(/macintosh/i.test(ua)&&(navigator.hardwareConcurrency||0)>=8)hz=120;
      else if(/samsung|oneplus|xiaomi|oppo|realme|vivo/i.test(ua)&&dpr>=2.5)hz=120;
      else if(/pixel.*pro/i.test(ua))hz=90;
      else if(!(/mobi|android|iphone|ipad/i.test(ua))&&((navigator.deviceMemory||8)>=16||w>=2560))hz=120;
    }
    var t=Math.min(hz,120);
    r.style.setProperty('--native-refresh-rate',String(hz));
    r.style.setProperty('--target-fps',String(t));
    r.style.setProperty('--frame-duration',(1000/t)+'ms');
    r.style.setProperty('--frame-budget',(1000/t*0.9)+'ms');
    if(hz>=120)r.classList.add('display-120hz');
    else if(hz>=90)r.classList.add('display-90hz');
  }catch(e){}
})();
