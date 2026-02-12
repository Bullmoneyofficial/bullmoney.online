(function(){
var d=document.documentElement,ua=navigator.userAgent,s=d.style;
var isD=!(/mobi|android|iphone|ipad/i.test(ua)),isB=window.innerWidth>=769;

if(isD&&isB){
	d.classList.add('desktop-optimized');
	s.height='auto';
	s.overflowY='scroll';
	s.overflowX='hidden';
	s.scrollBehavior='auto';
	s.scrollSnapType='none';
	s.overscrollBehavior='auto';
	var b=document.body;
	if(b){
		b.style.height='auto';
		b.style.overflowY='visible';
		b.style.overflowX='hidden';
		b.style.overscrollBehavior='auto';
	}
	if(!('ontouchstart' in window)&&!navigator.maxTouchPoints)d.classList.add('mouse-device','non-touch-device');
	if(window.innerWidth>=1440){
		d.classList.add('big-display');
		s.scrollPaddingTop='80px';
		if(b)b.classList.add('big-display-body');
	}
}

if(/macintosh|mac os x/i.test(ua)&&isD)d.classList.add('macos');

var isSaf=/^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua),iOS=/iphone|ipad|ipod/i.test(ua);
if(isSaf||iOS){
	d.classList.add('is-safari');
	if(iOS)d.classList.add('is-ios-safari');
}

var isInApp=/(FBAN|FBAV|Instagram|Line\/(?!\s)|MicroMessenger|Twitter|TikTok|Snapchat|wv\)|; wv\b|WebView|GSA|DuckDuckGo|Pinterest|LinkedInApp)/i.test(ua);
if(isInApp)d.classList.add('is-in-app-browser');

var setViewportVars=function(){
	var vv=window.visualViewport;
	var h=(vv&&vv.height?vv.height:window.innerHeight)||window.innerHeight;
	var vh=(h*0.01)+'px';
	s.setProperty('--app-vh',vh);
	s.setProperty('--vh',vh);
	s.setProperty('--svh',vh);
};

setViewportVars();
window.addEventListener('resize',setViewportVars,{passive:true});
window.addEventListener('orientationchange',setViewportVars,{passive:true});
if(window.visualViewport){
	window.visualViewport.addEventListener('resize',setViewportVars,{passive:true});
	window.visualViewport.addEventListener('scroll',setViewportVars,{passive:true});
}

try{
	var t=localStorage.getItem('bullmoney-theme-data');
	if(t){
		var p=JSON.parse(t);
		if(p&&p.accentColor){
			var h2=p.accentColor.replace('#',''),r=parseInt(h2.substring(0,2),16)||59,g=parseInt(h2.substring(2,4),16)||130,b2=parseInt(h2.substring(4,6),16)||246,rgb=r+', '+g+', '+b2;
			s.setProperty('--accent-color',p.accentColor);
			s.setProperty('--accent-rgb',rgb);
			s.setProperty('--theme-accent-light','rgba('+rgb+', 0.25)');
			s.setProperty('--theme-accent-dark','rgba('+rgb+', 0.5)');
			s.setProperty('--theme-accent-glow','rgba('+rgb+', 0.4)');
			s.setProperty('--theme-accent-subtle','rgba('+rgb+', 0.1)');
			s.setProperty('--theme-accent-border','rgba('+rgb+', 0.3)');
			d.setAttribute('data-active-theme',p.id||'bullmoney-blue');
			d.setAttribute('data-theme-category',p.category||'SPECIAL');
		}
	}else{
		d.setAttribute('data-active-theme','bullmoney-blue');
		s.setProperty('--accent-color','#ffffff');
		s.setProperty('--accent-rgb','255, 255, 255');
	}
}catch(e){
	d.setAttribute('data-active-theme','bullmoney-blue');
	s.setProperty('--accent-color','#ffffff');
	s.setProperty('--accent-rgb','255, 255, 255');
}
})();
