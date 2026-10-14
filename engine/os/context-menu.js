// Native clipboard menus remain available in text fields.
let zeroContextMenu=null;
function closeContextMenu(){if(!zeroContextMenu)return false;zeroContextMenu.remove();zeroContextMenu=null;return true;}
function showContextMenu(x,y,itens){
 closeContextMenu();const container=document.getElementById('game-container'),panel=container.querySelector('#case-panel.pc-mode');if(!panel||panel.classList.contains('hidden'))return;
 const menu=document.createElement('nav');menu.className='os-context-menu';menu.setAttribute('role','menu');panel.append(menu);zeroContextMenu=menu;
 for(const item of itens){if(!item||item.separator){menu.append(document.createElement('hr'));continue;}const b=document.createElement('button');b.textContent=item.label;b.disabled=!!item.disabled;b.setAttribute('role','menuitem');b.onclick=()=>{closeContextMenu();item.action?.();};menu.append(b);}
 const r=panel.getBoundingClientRect(),sx=panel.clientWidth/r.width,sy=panel.clientHeight/r.height;
 menu.style.left=Math.max(0,Math.min((x-r.left)*sx,panel.clientWidth-menu.offsetWidth))+'px';menu.style.top=Math.max(0,Math.min((y-r.top)*sy,panel.clientHeight-menu.offsetHeight))+'px';menu.querySelector('button:not(:disabled)')?.focus();
}
if(typeof document!=='undefined'){
 const container=document.getElementById('game-container');
 container.addEventListener('contextmenu',e=>{if(e.target.closest('input,textarea,[contenteditable="true"]'))return;e.preventDefault();const desktop=e.target.closest('.pc-desktop');if(!desktop||e.target.closest('.wm-window,.zero-info,.pc-taskbar,.pc-start'))return;const owner=desktop.closest('#case-panel')._osOwner;if(!owner)return;showContextMenu(e.clientX,e.clientY,[{label:'Atualizar',action:()=>owner.refreshDesktop()},{label:'Organizar ícones',action:()=>owner.organizeIcons()},{separator:true},{label:'Trocar sistema',action:()=>owner.computer.chooseOS(owner.computer.c)}]);});
 document.addEventListener('pointerdown',e=>{if(zeroContextMenu&&!zeroContextMenu.contains(e.target))closeContextMenu();});
 window.addEventListener('keydown',e=>{if(e.code!=='Escape')return;const panel=container.querySelector('#case-panel.pc-mode:not(.hidden)'),owner=panel?._osOwner;const closed=closeContextMenu()||owner?.closeStartMenu();if(closed){e.preventDefault();e.stopImmediatePropagation();if(owner){owner.g.input._justPressed.Escape=false;owner.g.input.keys.Escape=false;}}},true);
}
if(typeof module!=='undefined')module.exports={showContextMenu,closeContextMenu};
