// Window lifecycle shared by the workstation apps; no mission state lives here.
class ZeroWindowManager {
 constructor(desktopEl){
  this.desktop=desktopEl;this.windows=new Map();this.layer=10;this.active=null;
  this.taskbar=desktopEl.querySelector('.pc-taskbar');
  this.observer=new ResizeObserver(()=>{for(const w of this.windows.values())this.fit(w);});this.observer.observe(desktopEl);
 }
 bounds(){return {width:this.desktop.clientWidth,height:Math.max(0,this.desktop.clientHeight-(this.taskbar?.offsetHeight||48))};}
 geometry(el){const d=this.desktop.getBoundingClientRect(),r=el.getBoundingClientRect();return {x:(r.left-d.left)*this.desktop.clientWidth/d.width,y:(r.top-d.top)*this.desktop.clientHeight/d.height,width:r.width*this.desktop.clientWidth/d.width,height:r.height*this.desktop.clientHeight/d.height};}
 place(w,r){Object.assign(w.el.style,{inset:'auto',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',maxHeight:'none',transform:'none'});}
 fit(w){if(w.el.classList.contains('maximized'))return;const b=this.bounds(),r=w.rect;r.width=Math.min(Math.max(360,r.width),b.width);r.height=Math.min(Math.max(360,r.height),b.height);r.x=Math.max(0,Math.min(r.x,b.width-r.width));r.y=Math.max(0,Math.min(r.y,b.height-r.height));this.place(w,r);}
 open({id,title,icon,width=720,height=520,content,onClose}){
  if(this.windows.has(id)){this.restore(id);return this.windows.get(id).api;}
  const el=document.createElement('section');el.className='pc-window';
  const header=document.createElement('header');header.className='pc-titlebar';const caption=document.createElement('span');
  if(icon){const img=document.createElement('img');img.src=icon;img.alt='';caption.append(img);}caption.append(document.createTextNode(title));header.append(caption);
  const body=document.createElement('div');body.className='wm-body';if(typeof content==='string')body.innerHTML=content;else if(content)body.append(content);
  el.append(header,body);this.desktop.append(el);
  const api=this.adopt({id,el,body,header,title,icon,onClose});const w=this.windows.get(id);w.rect={x:32+(this.windows.size%5)*24,y:24+(this.windows.size%5)*24,width,height};this.fit(w);return api;
 }
 adopt({id,el,body,header,title,icon,onClose,retain=false}){
  if(this.windows.has(id)){const w=this.windows.get(id);if(title){w.task.title=title;w.task.setAttribute('aria-label',title);w.task.querySelector('span').textContent=title;}this.restore(id);return w.api;}
  el.classList.add('wm-window');el.classList.remove('hidden');el.tabIndex=-1;header.classList.add('pc-titlebar');
  let controls=header.querySelector('.wm-controls');
  if(!controls){header.querySelectorAll('button').forEach(b=>b.remove());controls=document.createElement('span');controls.className='wm-controls';header.append(controls);}
  controls.textContent='';
  const w={id,el,body,header,onClose,retain,rect:el._wmRect||this.geometry(el),minimized:false};this.windows.set(id,w);
  const button=(label,text,cls,action)=>{const b=document.createElement('button');b.className=cls;b.setAttribute('aria-label',label);b.textContent=text;b.onclick=action;controls.append(b);};
  button('Minimizar','─','pc-min',()=>this.minimize(id));button('Maximizar ou restaurar','□','pc-max',()=>this.maximize(id));button('Fechar janela','×','pc-close',()=>this.close(id));
  const task=document.createElement('button');task.className='pc-task';task.dataset.windowId=id;task.title=title;task.setAttribute('aria-label',title);
  const img=document.createElement('img');img.src=icon||header.querySelector('img')?.src||'assets/zeroos/imported/2.png';img.alt='';const label=document.createElement('span');label.textContent=title;task.append(img,label);
  task.onclick=()=>this.active===id&&!w.minimized?this.minimize(id):this.restore(id);
  task.oncontextmenu=e=>{e.preventDefault();showContextMenu(e.clientX,e.clientY,[{label:'Restaurar',action:()=>this.restore(id)},{label:'Minimizar',disabled:w.minimized,action:()=>this.minimize(id)},{label:'Fechar',action:()=>this.close(id)}]);};
  this.taskbar.insertBefore(task,this.taskbar.querySelector('.pc-session'));w.task=task;
  el.onpointerdown=()=>this.focus(id,false);header.ondblclick=e=>{if(!e.target.closest('button'))this.maximize(id);};
  header.onpointerdown=e=>{if(!e.target.closest('button'))this.gesture(e,w,'move',header);};
  el.querySelectorAll('.wm-resize').forEach(h=>h.remove());
  for(const edge of ['n','s','e','w','ne','nw','se','sw']){const h=document.createElement('span');h.className='wm-resize wm-'+edge;h.onpointerdown=e=>this.gesture(e,w,edge,h);el.append(h);}
  w.api={el,body,close:()=>this.close(id),focus:()=>this.restore(id)};this.fit(w);this.focus(id);return w.api;
 }
 focus(id,keyboard=true){const w=this.windows.get(id);if(!w||w.minimized)return;this.active=id;w.el.style.zIndex=++this.layer;for(const other of this.windows.values()){other.el.classList.toggle('wm-active',other===w);other.task.classList.toggle('wm-active',other===w);other.task.setAttribute('aria-pressed',String(other===w));}if(keyboard&&!w.el.contains(document.activeElement))w.el.focus({preventScroll:true});}
 next(){const visible=[...this.windows.values()].filter(w=>!w.minimized).sort((a,b)=>Number(b.el.style.zIndex)-Number(a.el.style.zIndex));this.active=null;if(visible[0])this.focus(visible[0].id);}
 minimize(id){const w=this.windows.get(id);if(!w)return;w.minimized=true;w.el.classList.add('hidden');w.el.classList.remove('wm-active');w.task.classList.remove('wm-active');w.task.setAttribute('aria-pressed','false');if(this.active===id)this.next();}
 restore(id){const w=this.windows.get(id);if(!w)return;w.minimized=false;w.el.classList.remove('hidden');this.focus(id);}
 maximize(id){const w=this.windows.get(id);if(!w)return;w.el.classList.toggle('maximized');if(!w.el.classList.contains('maximized'))this.fit(w);this.focus(id);}
 close(id){const w=this.windows.get(id);if(!w)return;this.windows.delete(id);w.task.remove();if(w.retain){w.el._wmRect={...w.rect};w.el.classList.add('hidden');w.el.classList.remove('wm-active');}else w.el.remove();w.onClose?.();if(this.active===id)this.next();}
 gesture(e,w,edge,handle){
  if(e.button!==0||w.el.classList.contains('maximized'))return;e.preventDefault();e.stopPropagation();this.focus(w.id,false);const start={...w.rect},d=this.desktop.getBoundingClientRect(),sx=this.desktop.clientWidth/d.width,sy=this.desktop.clientHeight/d.height;
  handle.setPointerCapture(e.pointerId);
  const move=ev=>{const b=this.bounds(),dx=(ev.clientX-e.clientX)*sx,dy=(ev.clientY-e.clientY)*sy,r={...start},mw=Math.min(360,b.width),mh=Math.min(360,b.height);
   if(edge==='move'){r.x+=dx;r.y+=dy;}
   else {if(edge.includes('e'))r.width=Math.max(mw,Math.min(b.width-r.x,start.width+dx));if(edge.includes('s'))r.height=Math.max(mh,Math.min(b.height-r.y,start.height+dy));if(edge.includes('w')){r.x=Math.max(0,Math.min(start.x+dx,start.x+start.width-mw));r.width=start.x+start.width-r.x;}if(edge.includes('n')){r.y=Math.max(0,Math.min(start.y+dy,start.y+start.height-mh));r.height=start.y+start.height-r.y;}}
   w.rect=r;this.fit(w);
  };
  const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);};
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
 }
 destroy(){this.observer.disconnect();for(const w of this.windows.values())w.task.remove();this.windows.clear();this.active=null;}
}
if(typeof module!=='undefined')module.exports=ZeroWindowManager;
