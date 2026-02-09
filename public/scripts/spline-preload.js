(function(){if(window.innerWidth<768)return;
var C=window.__SPLINE_MEMORY_CACHE__=window.__SPLINE_MEMORY_CACHE__||{};
var N='spline-scenes-v1';
function load(s){if(C[s])return;var cc=typeof caches!=='undefined';
if(!cc){fetch(s,{cache:'force-cache',priority:'low'}).then(function(r){if(r.ok)return r.arrayBuffer()}).then(function(b){if(b)C[s]=b});return;}
caches.open(N).then(function(c){c.match(s).then(function(r){if(r)return r.arrayBuffer().then(function(b){C[s]=b});
return fetch(s,{cache:'force-cache',priority:'low'}).then(function(r2){if(r2.ok){c.put(s,r2.clone());return r2.arrayBuffer().then(function(b){C[s]=b})}})})}).catch(function(){});}
setTimeout(function(){load('/scene1.splinecode');},100);
})();
