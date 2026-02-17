(function(){if(window.innerWidth<768)return;
var C=window.__SPLINE_MEMORY_CACHE__=window.__SPLINE_MEMORY_CACHE__||{};
var N='spline-scenes-v1';
function remember(key, buf){
	try{
		// Keep at most 1 in-memory scene buffer (Cache API already persists it).
		for(var k in C){ if(Object.prototype.hasOwnProperty.call(C,k) && k!==key){ delete C[k]; } }
		C[key]=buf; C._ts=Date.now();
	}catch(e){}
}
function load(s){if(C[s])return;var cc=typeof caches!=='undefined';
if(!cc){fetch(s,{cache:'force-cache',priority:'low'}).then(function(r){if(r.ok)return r.arrayBuffer()}).then(function(b){if(b)remember(s,b)});return;}
caches.open(N).then(function(c){c.match(s).then(function(r){if(r)return r.arrayBuffer().then(function(b){remember(s,b)});
return fetch(s,{cache:'force-cache',priority:'low'}).then(function(r2){if(r2.ok){c.put(s,r2.clone());return r2.arrayBuffer().then(function(b){remember(s,b)})}})})}).catch(function(){});}
setTimeout(function(){load('/scene1.splinecode');},100);

// Free memory when navigating away / bfcache
window.addEventListener('pagehide', function(){
	try{ window.__SPLINE_MEMORY_CACHE__ = {}; }catch(e){}
}, { once:true });
})();
