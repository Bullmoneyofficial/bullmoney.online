(function(){
try{
	if (typeof window === 'undefined' || typeof document === 'undefined') return;
	var d = document.documentElement;
	if (!d) return;
	var s = d.style || {};
	var nav = (typeof navigator !== 'undefined' && navigator) ? navigator : { userAgent: '' };
	var ua = String(nav.userAgent || '');
	var w = window;
	var hasClassList = !!(d.classList && typeof d.classList.add === 'function');
	var addClass = function(cls){ try{ if (hasClassList) d.classList.add(cls); } catch(e){} };

	// Some older browsers/webviews throw on options objects.
	var supportsPassive = false;
	try {
		var opts = Object.defineProperty({}, 'passive', { get: function(){ supportsPassive = true; } });
		w.addEventListener('test-passive', function(){}, opts);
		w.removeEventListener('test-passive', function(){}, opts);
	} catch (e) {}
	var evOpts = supportsPassive ? { passive: true } : false;

	var isD=!(/mobi|android|iphone|ipad/i.test(ua)),isB=(w.innerWidth||0)>=769;

  if(isD&&isB){
	addClass('desktop-optimized');
	s.height='auto';
	s.overflowY='scroll';
	s.overflowX='hidden';
	s.scrollBehavior='auto';
	s.scrollSnapType='none';
	s.overscrollBehavior='auto';
	var b=document.body;
	if(b&&b.style){
		b.style.height='auto';
		b.style.overflowY='visible';
		b.style.overflowX='hidden';
		b.style.overscrollBehavior='auto';
	}
	try{
		if(!('ontouchstart' in w) && !(nav && nav.maxTouchPoints)) addClass('mouse-device');
		if(!('ontouchstart' in w) && !(nav && nav.maxTouchPoints)) addClass('non-touch-device');
	}catch(e){}
	if((w.innerWidth||0)>=1440){
		addClass('big-display');
		s.scrollPaddingTop='80px';
		try{ if(b&&b.classList) b.classList.add('big-display-body'); }catch(e){}
	}
  }

	if(/macintosh|mac os x/i.test(ua)&&isD)addClass('macos');

  var isSaf=/^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua),iOS=/iphone|ipad|ipod/i.test(ua);
  if(isSaf||iOS){
	addClass('is-safari');
	if(iOS)addClass('is-ios-safari');
  }

	var isInApp=/(FBAN|FBAV|Instagram|Line\/(?!\s)|MicroMessenger|Twitter|TikTok|Snapchat|wv\)|; wv\b|WebView|GSA|DuckDuckGo|Pinterest|LinkedInApp)/i.test(ua);
	if(isInApp)addClass('is-in-app-browser');

  var setViewportVars=function(){
	try{
		var vv=w.visualViewport;
		var h=(vv&&vv.height?vv.height:w.innerHeight)||w.innerHeight;
		var vh=(h*0.01)+'px';
		if (s && typeof s.setProperty === 'function') {
			s.setProperty('--app-vh',vh);
			s.setProperty('--vh',vh);
			s.setProperty('--svh',vh);
		}
	}catch(e){}
  };

  setViewportVars();
  try{ w.addEventListener('resize',setViewportVars,evOpts); }catch(e){}
  try{ w.addEventListener('orientationchange',setViewportVars,evOpts); }catch(e){}
  try{
	if(w.visualViewport && typeof w.visualViewport.addEventListener === 'function'){
		w.visualViewport.addEventListener('resize',setViewportVars,evOpts);
		if(!iOS){
			w.visualViewport.addEventListener('scroll',setViewportVars,evOpts);
		}
	}
  }catch(e){}

  try{
	var t=null;
	try{ t=localStorage.getItem('bullmoney-theme-data'); }catch(e){ t=null; }
	if(t){
		var p=null;
		try{ p=JSON.parse(t); }catch(e){ p=null; }
		if(p&&p.accentColor && s && typeof s.setProperty === 'function'){
			var h2=String(p.accentColor||'').replace('#','');
			var r=parseInt(h2.substring(0,2),16)||59,g=parseInt(h2.substring(2,4),16)||130,b2=parseInt(h2.substring(4,6),16)||246,rgb=r+', '+g+', '+b2;
			s.setProperty('--accent-color',p.accentColor);
			s.setProperty('--accent-rgb',rgb);
			s.setProperty('--theme-accent-light','rgba('+rgb+', 0.25)');
			s.setProperty('--theme-accent-dark','rgba('+rgb+', 0.5)');
			s.setProperty('--theme-accent-glow','rgba('+rgb+', 0.4)');
			s.setProperty('--theme-accent-subtle','rgba('+rgb+', 0.1)');
			s.setProperty('--theme-accent-border','rgba('+rgb+', 0.3)');
			try{ d.setAttribute('data-active-theme',p.id||'bullmoney-blue'); }catch(e){}
			try{ d.setAttribute('data-theme-category',p.category||'SPECIAL'); }catch(e){}
		}
	}else{
		try{ d.setAttribute('data-active-theme','bullmoney-blue'); }catch(e){}
		if (s && typeof s.setProperty === 'function') {
			s.setProperty('--accent-color','#ffffff');
			s.setProperty('--accent-rgb','255, 255, 255');
		}
	}
  }catch(e){
	try{ d.setAttribute('data-active-theme','bullmoney-blue'); }catch(e2){}
	if (s && typeof s.setProperty === 'function') {
		s.setProperty('--accent-color','#ffffff');
		s.setProperty('--accent-rgb','255, 255, 255');
	}
  }
}catch(e){
  // Never block app boot due to splash init
}
})();
