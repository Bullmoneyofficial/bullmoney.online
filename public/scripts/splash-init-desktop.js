// Desktop-optimized splash init - minimal overhead for fast LCP
(function(){
try{
	if (typeof window === 'undefined' || typeof document === 'undefined') return;
	var d = document.documentElement;
	if (!d) return;
	var s = d.style || {};
	var w = window;
	var hasClassList = !!(d.classList && typeof d.classList.add === 'function');
	var addClass = function(cls){ try{ if (hasClassList) d.classList.add(cls); } catch(e){} };

	// Desktop-only: skip passive detection, always use simple listeners
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

	addClass('mouse-device');
	addClass('non-touch-device');

	if((w.innerWidth||0)>=1440){
		addClass('big-display');
		s.scrollPaddingTop='80px';
		try{ if(b&&b.classList) b.classList.add('big-display-body'); }catch(e){}
	}

	var ua = String((navigator && navigator.userAgent) || '');
	if(/macintosh|mac os x/i.test(ua)) addClass('macos');

	var isSaf=/^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua);
	if(isSaf) addClass('is-safari');

	// Minimal viewport setup (no visualViewport listeners for desktop)
	var setVH=function(){
		try{
			var vh=(w.innerHeight*0.01)+'px';
			if (s && typeof s.setProperty === 'function') {
				s.setProperty('--app-vh',vh);
				s.setProperty('--vh',vh);
			}
		}catch(e){}
	};
	setVH();
	w.addEventListener('resize',setVH,{passive:true});

	// Quick theme load
	try{
		var t=localStorage.getItem('bullmoney-theme-data');
		if(t){
			var p=JSON.parse(t);
			if(p&&p.accentColor && s && typeof s.setProperty === 'function'){
				var h2=String(p.accentColor||'').replace('#','');
				var r=parseInt(h2.substring(0,2),16)||59,g=parseInt(h2.substring(2,4),16)||130,b2=parseInt(h2.substring(4,6),16)||246,rgb=r+', '+g+', '+b2;
				s.setProperty('--accent-color',p.accentColor);
				s.setProperty('--accent-rgb',rgb);
				d.setAttribute('data-active-theme',p.id||'bullmoney-blue');
				d.setAttribute('data-theme-category',p.category||'SPECIAL');
			}
		}else{
			d.setAttribute('data-active-theme','bullmoney-blue');
			if (s && typeof s.setProperty === 'function') {
				s.setProperty('--accent-color','#ffffff');
				s.setProperty('--accent-rgb','255, 255, 255');
			}
		}
	}catch(e){
		d.setAttribute('data-active-theme','bullmoney-blue');
		if (s && typeof s.setProperty === 'function') {
			s.setProperty('--accent-color','#ffffff');
			s.setProperty('--accent-rgb','255, 255, 255');
		}
	}
}catch(e){}
})();
