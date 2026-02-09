(function(){var s=document.getElementById('bm-splash');if(!s)return;
var t1=setTimeout(function(){s.classList.add('hide')},6000);
function hide(){clearTimeout(t1);if(s)s.classList.add('hide')}
if(document.readyState==='complete')setTimeout(hide,200);
else window.addEventListener('load',function(){setTimeout(hide,200)});
})();
