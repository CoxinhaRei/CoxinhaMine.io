// A convenience shortcut block, never an authentication or anti-cheat boundary.
(function(){
  document.addEventListener('keydown',event=>{
    if(typeof event.key!=='string')return;
    const key=event.key.toLowerCase(),inspect=key==='f12'||((event.ctrlKey||event.metaKey)&&event.shiftKey&&['i','j','c'].includes(key))||(event.metaKey&&event.altKey&&['i','j','c'].includes(key));
    if(inspect){event.preventDefault();event.stopImmediatePropagation();}
  },true);
})();
