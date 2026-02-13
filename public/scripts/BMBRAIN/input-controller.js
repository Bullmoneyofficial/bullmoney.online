// BULLMONEY INPUT CONTROLLER v1.0
// Full keyboard navigation, Gamepad API (Xbox/PS5/Switch Bluetooth),
// Extended mouse buttons (5+ button mice), and accessibility
// Loads after compat-layer.js
(function(){
'use strict';
var w=window,d=document,n=navigator,docEl=d.documentElement;

// ═══════════════════════════════════════════════════════════════
// 1. KEYBOARD NAVIGATION — Full app keyboard support
// Tab, Arrow keys, Enter, Escape, Space, shortcuts
// ═══════════════════════════════════════════════════════════════
var keyboardActive=false;

// Detect keyboard vs mouse/touch usage
d.addEventListener('keydown',function(e){
  if(!keyboardActive){
    keyboardActive=true;
    docEl.classList.add('keyboard-nav');
    docEl.classList.remove('mouse-nav','touch-nav');
  }

  var key=e.key||e.keyCode;
  var target=e.target||e.srcElement;
  var tag=(target.tagName||'').toLowerCase();
  var isInput=tag==='input'||tag==='textarea'||tag==='select'||target.isContentEditable;

  // ── Global shortcuts (work everywhere) ──
  // Escape: close modals/drawers/menus
  if(key==='Escape'||key===27){
    var modal=d.querySelector('[role="dialog"]:not([data-state="closed"])');
    if(modal){
      var closeBtn=modal.querySelector('[data-close],[aria-label="Close"],button.close,.close-btn');
      if(closeBtn)closeBtn.click();
      else{try{w.dispatchEvent(new CustomEvent('bm:close-modal'));}catch(ex){}}
      e.preventDefault();
      return;
    }
    // Close any open dropdown/menu
    var menu=d.querySelector('[role="menu"][data-state="open"],[data-radix-menu-content]');
    if(menu){try{w.dispatchEvent(new CustomEvent('bm:close-menu'));}catch(ex){}}
  }

  // Don't intercept normal typing in inputs
  if(isInput)return;

  // ── Navigation shortcuts ──
  // Home: scroll to top
  if(key==='Home'||key===36){w.scrollTo({top:0,behavior:'smooth'});e.preventDefault();}
  // End: scroll to bottom
  if(key==='End'||key===35){w.scrollTo({top:d.body.scrollHeight,behavior:'smooth'});e.preventDefault();}
  // Space: scroll down one page (like browsers do, but smoother)
  if(key===' '||key===32){
    if(!isInput){
      var dir=e.shiftKey?-1:1;
      w.scrollBy({top:dir*(w.innerHeight*0.85),behavior:'smooth'});
      e.preventDefault();
    }
  }

  // ── Arrow key navigation for focusable elements ──
  if(key==='ArrowDown'||key===40||key==='ArrowUp'||key===38||
     key==='ArrowLeft'||key===37||key==='ArrowRight'||key===39){
    var focusable=Array.prototype.slice.call(
      d.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"],[role="menuitem"],[role="tab"]')
    );
    if(focusable.length===0)return;
    var cur=d.activeElement;
    var idx=focusable.indexOf(cur);
    var next=-1;

    if(key==='ArrowDown'||key===40||key==='ArrowRight'||key===39){
      next=(idx+1)%focusable.length;
    }else if(key==='ArrowUp'||key===38||key==='ArrowLeft'||key===37){
      next=idx<=0?focusable.length-1:idx-1;
    }
    if(next>=0&&focusable[next]){
      focusable[next].focus();
      e.preventDefault();
    }
  }

  // ── Enter/Space on focused elements ──
  if((key==='Enter'||key===13)&&target){
    if(tag==='a'||target.getAttribute('role')==='button'||target.getAttribute('role')==='link'){
      target.click();
    }
  }

  // ── App shortcuts (Ctrl/Cmd + key) ──
  var ctrl=e.ctrlKey||e.metaKey;
  if(ctrl){
    // Ctrl+K or Cmd+K: open search (if exists)
    if(key==='k'||key===75){
      try{w.dispatchEvent(new CustomEvent('bm:open-search'));}catch(ex){}
      e.preventDefault();
    }
    // Ctrl+/ or Cmd+/: toggle help/shortcuts overlay
    if(key==='/'||key===191){
      try{w.dispatchEvent(new CustomEvent('bm:toggle-shortcuts'));}catch(ex){}
      e.preventDefault();
    }
  }

  // Dispatch generic key event for components
  try{
    w.dispatchEvent(new CustomEvent('bm:keydown',{
      detail:{key:key,ctrl:ctrl,shift:e.shiftKey,alt:e.altKey,target:tag}
    }));
  }catch(ex){}
});

// Switch back to mouse/touch mode
d.addEventListener('mousedown',function(){
  if(keyboardActive){keyboardActive=false;docEl.classList.remove('keyboard-nav');docEl.classList.add('mouse-nav');}
});
d.addEventListener('touchstart',function(){
  if(keyboardActive){keyboardActive=false;docEl.classList.remove('keyboard-nav');docEl.classList.add('touch-nav');}
},{passive:true});

// ── Focus visible polyfill ──
// Show focus ring only on keyboard navigation
var focusStyle=d.createElement('style');
focusStyle.id='bm-focus-visible';
focusStyle.textContent=[
  '/* Hide focus ring for mouse/touch users */',
  'html.mouse-nav *:focus,html.touch-nav *:focus{outline:none!important;}',
  '/* Show focus ring for keyboard users */',
  'html.keyboard-nav *:focus{outline:2px solid rgba(255,255,255,0.6)!important;outline-offset:2px!important;}',
  'html.keyboard-nav *:focus:not(:focus-visible){outline:none!important;}',
  '/* Native focus-visible support */',
  '*:focus-visible{outline:2px solid rgba(255,255,255,0.6)!important;outline-offset:2px!important;}',
  '*:focus:not(:focus-visible){outline:none!important;}'
].join('\n');
if(d.head)d.head.appendChild(focusStyle);

// ═══════════════════════════════════════════════════════════════
// 2. GAMEPAD API — Xbox, PS5, Switch, generic Bluetooth controllers
// ═══════════════════════════════════════════════════════════════
var gamepads={};
var gamepadPollId=null;
var gamepadConnected=false;

// Standard mapping (Xbox/PS5/Switch Pro all use this):
// Buttons: 0=A/X, 1=B/Circle, 2=X/Square, 3=Y/Triangle
//          4=LB/L1, 5=RB/R1, 6=LT/L2, 7=RT/R2
//          8=Back/Select/Share, 9=Start/Options, 10=L3, 11=R3
//          12=DPad Up, 13=DPad Down, 14=DPad Left, 15=DPad Right
//          16=Guide/PS/Home
// Axes: 0=Left X, 1=Left Y, 2=Right X, 3=Right Y

var GAMEPAD_BUTTONS={
  0:'a',1:'b',2:'x',3:'y',
  4:'lb',5:'rb',6:'lt',7:'rt',
  8:'select',9:'start',10:'l3',11:'r3',
  12:'dpad-up',13:'dpad-down',14:'dpad-left',15:'dpad-right',
  16:'guide'
};

var prevButtonStates={};
var STICK_DEADZONE=0.15;
var SCROLL_SPEED=8;
var STICK_SCROLL_SPEED=12;

function onGamepadConnected(e){
  var gp=e.gamepad;
  gamepads[gp.index]=gp;
  gamepadConnected=true;
  docEl.classList.add('gamepad-connected');
  docEl.setAttribute('data-gamepad',gp.id);

  // Detect controller type
  var id=(gp.id||'').toLowerCase();
  var type='generic';
  if(id.indexOf('xbox')!==-1||id.indexOf('xinput')!==-1||id.indexOf('045e')!==-1)type='xbox';
  else if(id.indexOf('dualsense')!==-1||id.indexOf('054c')!==-1||id.indexOf('dualshock')!==-1||id.indexOf('playstation')!==-1)type='playstation';
  else if(id.indexOf('pro controller')!==-1||id.indexOf('057e')!==-1||id.indexOf('joy-con')!==-1||id.indexOf('nintendo')!==-1)type='switch';
  else if(id.indexOf('stadia')!==-1)type='stadia';
  else if(id.indexOf('luna')!==-1)type='luna';
  docEl.setAttribute('data-gamepad-type',type);

  try{w.dispatchEvent(new CustomEvent('bm:gamepad-connect',{detail:{index:gp.index,id:gp.id,type:type,buttons:gp.buttons.length,axes:gp.axes.length}}));}catch(ex){}

  if(!gamepadPollId)gamepadPollId=requestAnimationFrame(pollGamepads);
  console.log('[BM Input] Gamepad connected:',gp.id,'type:',type);
}

function onGamepadDisconnected(e){
  delete gamepads[e.gamepad.index];
  delete prevButtonStates[e.gamepad.index];
  var remaining=Object.keys(gamepads);
  if(remaining.length===0){
    gamepadConnected=false;
    docEl.classList.remove('gamepad-connected');
    docEl.removeAttribute('data-gamepad');
    docEl.removeAttribute('data-gamepad-type');
    if(gamepadPollId){cancelAnimationFrame(gamepadPollId);gamepadPollId=null;}
  }
  try{w.dispatchEvent(new CustomEvent('bm:gamepad-disconnect',{detail:{index:e.gamepad.index}}));}catch(ex){}
  console.log('[BM Input] Gamepad disconnected:',e.gamepad.id);
}

function pollGamepads(){
  if(!gamepadConnected){gamepadPollId=null;return;}

  // Get fresh gamepad state (required by spec)
  var rawPads=n.getGamepads?n.getGamepads():(n.webkitGetGamepads?n.webkitGetGamepads():[]);
  if(!rawPads){gamepadPollId=requestAnimationFrame(pollGamepads);return;}

  for(var i=0;i<rawPads.length;i++){
    var gp=rawPads[i];
    if(!gp||!gp.connected)continue;

    if(!prevButtonStates[gp.index])prevButtonStates[gp.index]={};

    // ── Button press/release detection ──
    for(var b=0;b<gp.buttons.length;b++){
      var pressed=gp.buttons[b].pressed;
      var wasPressed=!!prevButtonStates[gp.index][b];
      var btnName=GAMEPAD_BUTTONS[b]||('btn-'+b);

      if(pressed&&!wasPressed){
        // Button just pressed
        handleGamepadButton(btnName,'press',gp.buttons[b].value);
      }else if(!pressed&&wasPressed){
        // Button just released
        handleGamepadButton(btnName,'release',0);
      }
      prevButtonStates[gp.index][b]=pressed;
    }

    // ── Analog stick scrolling ──
    if(gp.axes.length>=2){
      var lx=gp.axes[0],ly=gp.axes[1];
      // Left stick: scroll page
      if(Math.abs(ly)>STICK_DEADZONE){
        w.scrollBy(0,ly*STICK_SCROLL_SPEED);
      }
      if(Math.abs(lx)>STICK_DEADZONE){
        w.scrollBy(lx*STICK_SCROLL_SPEED,0);
      }
    }
    if(gp.axes.length>=4){
      var rx=gp.axes[2],ry=gp.axes[3];
      // Right stick: move cursor/focus (dispatch event for components)
      if(Math.abs(rx)>STICK_DEADZONE||Math.abs(ry)>STICK_DEADZONE){
        try{w.dispatchEvent(new CustomEvent('bm:gamepad-stick',{detail:{stick:'right',x:rx,y:ry}}));}catch(ex){}
      }
    }
  }

  gamepadPollId=requestAnimationFrame(pollGamepads);
}

function handleGamepadButton(btn,action,value){
  // Dispatch event for all buttons
  try{w.dispatchEvent(new CustomEvent('bm:gamepad-button',{detail:{button:btn,action:action,value:value}}));}catch(ex){}

  if(action!=='press')return;

  // ── Default navigation mappings ──
  var focusable=Array.prototype.slice.call(
    d.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"],[role="menuitem"],[role="tab"]')
  );
  var cur=d.activeElement;
  var idx=focusable.indexOf(cur);

  switch(btn){
    case 'a': // A/X = confirm/click
      if(cur&&typeof cur.click==='function')cur.click();
      break;
    case 'b': // B/Circle = back/cancel
      try{w.dispatchEvent(new CustomEvent('bm:close-modal'));}catch(ex){}
      if(w.history&&w.history.length>1)w.history.back();
      break;
    case 'dpad-down':case 'dpad-right':
      if(focusable.length>0){
        var next=(idx+1)%focusable.length;
        focusable[next].focus();
      }
      break;
    case 'dpad-up':case 'dpad-left':
      if(focusable.length>0){
        var prev=idx<=0?focusable.length-1:idx-1;
        focusable[prev].focus();
      }
      break;
    case 'rb': // RB/R1 = scroll down
      w.scrollBy({top:w.innerHeight*0.5,behavior:'smooth'});
      break;
    case 'lb': // LB/L1 = scroll up
      w.scrollBy({top:-w.innerHeight*0.5,behavior:'smooth'});
      break;
    case 'start': // Start = open menu
      try{w.dispatchEvent(new CustomEvent('bm:toggle-menu'));}catch(ex){}
      break;
    case 'guide': // Guide/PS/Home = go home
      w.location.href='/';
      break;
    case 'y': // Y/Triangle = search
      try{w.dispatchEvent(new CustomEvent('bm:open-search'));}catch(ex){}
      break;
  }
}

// Register gamepad events
if('getGamepads' in n||'webkitGetGamepads' in n){
  w.addEventListener('gamepadconnected',onGamepadConnected);
  w.addEventListener('gamepaddisconnected',onGamepadDisconnected);
  docEl.classList.add('gamepad-api');
  // Check if gamepad is already connected (happens if page loads with controller on)
  try{
    var existing=n.getGamepads?n.getGamepads():(n.webkitGetGamepads?n.webkitGetGamepads():[]);
    if(existing){for(var gi=0;gi<existing.length;gi++){
      if(existing[gi]&&existing[gi].connected){
        onGamepadConnected({gamepad:existing[gi]});
      }
    }}
  }catch(ex){}
}

// ═══════════════════════════════════════════════════════════════
// 3. EXTENDED MOUSE BUTTONS — 5+ button mice (Logitech, Razer, etc.)
// Button 3 = Back, Button 4 = Forward, Button 5+ = custom
// ═══════════════════════════════════════════════════════════════
d.addEventListener('mousedown',function(e){
  var btn=e.button;
  // Standard: 0=left, 1=middle, 2=right, 3=back, 4=forward
  if(btn<=2)return; // Let browser handle standard buttons

  e.preventDefault();
  e.stopPropagation();

  switch(btn){
    case 3: // Back button
      if(w.history&&w.history.length>1)w.history.back();
      break;
    case 4: // Forward button
      w.history.forward();
      break;
    default: // Button 5+ — dispatch for custom mapping
      try{w.dispatchEvent(new CustomEvent('bm:mouse-button',{detail:{button:btn,x:e.clientX,y:e.clientY}}));}catch(ex){}
      break;
  }
});

// Middle-click: open link in new tab (most browsers do this natively, but some miss it)
d.addEventListener('auxclick',function(e){
  if(e.button!==1)return; // Only middle click
  var link=e.target;
  while(link&&link.tagName!=='A')link=link.parentElement;
  if(link&&link.href&&!link.href.startsWith('javascript:')){
    e.preventDefault();
    w.open(link.href,'_blank','noopener');
  }
});

// ── Context menu enhancement (right-click) ──
// Don't block default context menu, but dispatch event for custom menus
d.addEventListener('contextmenu',function(e){
  try{
    w.dispatchEvent(new CustomEvent('bm:contextmenu',{
      detail:{x:e.clientX,y:e.clientY,target:e.target}
    }));
  }catch(ex){}
  // Don't prevent default — let browser context menu work
});

// ═══════════════════════════════════════════════════════════════
// 4. GLOBAL STATE
// ═══════════════════════════════════════════════════════════════
w.__BM_INPUT__={
  keyboardActive:function(){return keyboardActive;},
  gamepadConnected:function(){return gamepadConnected;},
  gamepads:gamepads,
  version:'1.0'
};

// Register with global Brain orchestrator
if(w.__BM_BRAIN__&&w.__BM_BRAIN__.register){
  w.__BM_BRAIN__.register('input-controller',w.__BM_INPUT__);
  w.__BM_BRAIN__.setState('input',w.__BM_INPUT__);
}

try{w.dispatchEvent(new CustomEvent('bm:input-ready',{detail:w.__BM_INPUT__}));}catch(ex){}
if(w.location.hostname==='localhost'){
  console.log('[BM Input] v1.0 ready — Keyboard: on | Gamepad API:','getGamepads' in n?'yes':'no','| Mouse buttons: extended');
}
})();
