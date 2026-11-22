// Local presentation preference; routing and reward state remain server-owned.
const CHAT_VISIBILITY_KEY='coxinha_chat_hidden_v155';
let chatCollapsed=false;
try{chatCollapsed=localStorage.getItem(CHAT_VISIBILITY_KEY)==='1';}catch{}
const chatHeader=document.createElement('header');chatHeader.className='chat-header';
const chatHeading=document.createElement('span');chatHeading.textContent='Chat';
const chatClose=document.createElement('button');chatClose.id='chat-close';chatClose.type='button';chatClose.textContent='×';chatClose.setAttribute('aria-label','Esconder chat');chatClose.title='Esconder chat';
chatHeader.append(chatHeading,chatClose);gameChat.prepend(chatHeader);
const chatOpen=document.createElement('button');chatOpen.id='chat-open';chatOpen.type='button';chatOpen.textContent='▤ Chat';chatOpen.title='Abrir chat · Enter';chatOpen.setAttribute('aria-label','Abrir chat');chatOpen.setAttribute('aria-controls','game-chat');document.body.append(chatOpen);
function syncChatVisibility(){const menu=menuVisible();gameChat.hidden=menu||chatCollapsed;chatOpen.hidden=menu||!chatCollapsed;chatOpen.setAttribute('aria-expanded',String(!gameChat.hidden));}
function setChatCollapsed(value){chatCollapsed=!!value;if(chatCollapsed)chatField.blur();try{localStorage.setItem(CHAT_VISIBILITY_KEY,chatCollapsed?'1':'0');}catch{}syncChatVisibility();}
chatClose.onclick=()=>setChatCollapsed(true);
chatOpen.onclick=()=>focusGameChat();
const renderChatBeforeVisibility=renderGameChat;
renderGameChat=function(){if(!menuVisible()&&!chatCollapsed)renderChatBeforeVisibility();syncChatVisibility();};
const focusChatBeforeVisibility=focusGameChat;
focusGameChat=function(){if(menuVisible())return;setChatCollapsed(false);renderGameChat();focusChatBeforeVisibility();};
const chatKeyBeforeVisibility=chatField.onkeydown;
chatField.onkeydown=function(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setChatCollapsed(true);return;}chatKeyBeforeVisibility?.call(this,event);};
syncChatVisibility();
