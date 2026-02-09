// BOOST: SEO Performance Hints (auto-generated)
// Loaded after interactive to enhance crawlability
(function(){
  // 46. Lazy-load below-fold images with IntersectionObserver
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var img=e.target;
          if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}
          if(img.dataset.srcset){img.srcset=img.dataset.srcset;delete img.dataset.srcset;}
          io.unobserve(img);
        }
      });
    },{rootMargin:'200px'});
    document.querySelectorAll('img[data-src]').forEach(function(img){io.observe(img)});
  }

  // 47. Track Core Web Vitals for SEO ranking signal
  if('PerformanceObserver' in window){
    try{
      // LCP
      new PerformanceObserver(function(l){
        var entries=l.getEntries();
        var last=entries[entries.length-1];
        window.__BM_LCP__=last.startTime;
      }).observe({type:'largest-contentful-paint',buffered:true});
      // FID
      new PerformanceObserver(function(l){
        var e=l.getEntries()[0];
        window.__BM_FID__=e.processingStart-e.startTime;
      }).observe({type:'first-input',buffered:true});
      // CLS
      var clsValue=0;
      new PerformanceObserver(function(l){
        l.getEntries().forEach(function(e){if(!e.hadRecentInput)clsValue+=e.value});
        window.__BM_CLS__=clsValue;
      }).observe({type:'layout-shift',buffered:true});
      // INP
      var inpValue=0;
      new PerformanceObserver(function(l){
        l.getEntries().forEach(function(e){
          var d=e.duration;if(d>inpValue)inpValue=d;
        });
        window.__BM_INP__=inpValue;
      }).observe({type:'event',buffered:true,durationThreshold:16});
      // TTFB
      new PerformanceObserver(function(l){
        var e=l.getEntries()[0];
        window.__BM_TTFB__=e.responseStart;
      }).observe({type:'navigation',buffered:true});
    }catch(e){}
  }
  
  // 48. Priority Hints: boost above-fold content
  requestIdleCallback(function(){
    document.querySelectorAll('img').forEach(function(img,i){
      if(i<3)img.setAttribute('fetchpriority','high');
      else if(i>10)img.setAttribute('loading','lazy');
    });
  });

  // 49. Preload next page on hover (instant navigation feel)
  document.addEventListener('mouseover',function(e){
    var a=e.target.closest('a[href]');
    if(!a||a.dataset.prefetched)return;
    var href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto'))return;
    a.dataset.prefetched='1';
    var link=document.createElement('link');
    link.rel='prefetch';link.href=href;
    document.head.appendChild(link);
  });

  // 50. Add structured breadcrumb data for current page
  var path=window.location.pathname.split('/').filter(Boolean);
  if(path.length>0){
    var bc={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]};
    bc.itemListElement.push({"@type":"ListItem","position":1,"name":"Home","item":"https://www.bullmoney.shop"});
    var url='https://www.bullmoney.shop';
    path.forEach(function(p,i){
      url+='/'+p;
      bc.itemListElement.push({"@type":"ListItem","position":i+2,"name":p.charAt(0).toUpperCase()+p.slice(1).replace(/-/g,' '),"item":url});
    });
    var s=document.createElement('script');
    s.type='application/ld+json';
    s.textContent=JSON.stringify(bc);
    document.head.appendChild(s);
  }
})();