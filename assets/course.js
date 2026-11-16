/* Shared components for the Math for Data Science course pages.
   Plot: a small canvas grapher. drag: draggable points. initPage: quizzes, progress, redraw. */
(function(){
"use strict";
var redraws=[];
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function $(id){return document.getElementById(id);}
function fmt(v,d){if(!isFinite(v))return "undefined";var s=v.toFixed(d===undefined?2:d);if(parseFloat(s)===0)s=(0).toFixed(d===undefined?2:d);return s;}
function num(v){var r=Math.round(v*100)/100;return String(r===0?0:r).replace("-","−");}
function vec(p){return "("+num(p.x)+", "+num(p.y)+")";}

function Plot(id,xmin,xmax,ymin,ymax,step){
  this.c=$(id);this.g=this.c.getContext("2d");
  this.xmin=xmin;this.xmax=xmax;this.ymin=ymin;this.ymax=ymax;this.step=step||1;
}
/* square units: set p.sq=true and p.yc (centre y); the y range then follows the canvas shape */
Plot.prototype.X=function(x){return (x-this.xmin)/(this.xmax-this.xmin)*this.w;};
Plot.prototype.Y=function(y){return this.h-(y-this.ymin)/(this.ymax-this.ymin)*this.h;};
Plot.prototype.fromPx=function(px,py){return {x:this.xmin+px/this.w*(this.xmax-this.xmin),y:this.ymin+(this.h-py)/this.h*(this.ymax-this.ymin)};};
Plot.prototype.clear=function(){
  var c=this.c,g=this.g,dpr=window.devicePixelRatio||1;
  this.w=c.clientWidth;this.h=c.clientHeight;
  if(this.sq&&this.w>0){var span=(this.xmax-this.xmin)*this.h/this.w;this.ymin=(this.yc||0)-span/2;this.ymax=(this.yc||0)+span/2;}
  c.width=Math.round(this.w*dpr);c.height=Math.round(this.h*dpr);
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,this.w,this.h);
  var grid=css("--grid"),muted=css("--muted");
  g.lineWidth=1;g.strokeStyle=grid;g.fillStyle=muted;g.font="11px 'IBM Plex Mono',monospace";
  var sx=this.step,sy=this.ystep||this.step,x,y;
  for(x=Math.ceil(this.xmin/sx)*sx;x<=this.xmax+1e-9;x+=sx){g.beginPath();g.moveTo(this.X(x),0);g.lineTo(this.X(x),this.h);g.stroke();}
  for(y=Math.ceil(this.ymin/sy)*sy;y<=this.ymax+1e-9;y+=sy){g.beginPath();g.moveTo(0,this.Y(y));g.lineTo(this.w,this.Y(y));g.stroke();}
  g.strokeStyle=muted;g.lineWidth=1.2;
  var ax=Math.min(Math.max(0,this.ymin),this.ymax),ay=Math.min(Math.max(0,this.xmin),this.xmax);
  g.beginPath();g.moveTo(0,this.Y(ax));g.lineTo(this.w,this.Y(ax));g.stroke();
  g.beginPath();g.moveTo(this.X(ay),0);g.lineTo(this.X(ay),this.h);g.stroke();
  g.textAlign="center";g.textBaseline="top";
  for(x=Math.ceil(this.xmin/sx)*sx;x<=this.xmax+1e-9;x+=sx){if(Math.abs(x)<1e-9)continue;var px=this.X(x);if(px<12||px>this.w-12)continue;g.fillText(String(Math.round(x*100)/100),px,Math.min(this.Y(ax)+4,this.h-14));}
  g.textAlign="right";g.textBaseline="middle";
  for(y=Math.ceil(this.ymin/sy)*sy;y<=this.ymax+1e-9;y+=sy){if(Math.abs(y)<1e-9)continue;var py=this.Y(y);if(py<8||py>this.h-8)continue;g.fillText(String(Math.round(y*100)/100),Math.max(this.X(ay)-5,26),py);}
};
Plot.prototype.fn=function(f,color,width,dash){
  var g=this.g,pen=false,i,n=Math.max(300,Math.round(this.w)),lastY=null;
  g.strokeStyle=color;g.lineWidth=width||2.2;g.setLineDash(dash||[]);g.beginPath();
  for(i=0;i<=n;i++){
    var x=this.xmin+(this.xmax-this.xmin)*i/n,y=f(x);
    if(!isFinite(y)||(lastY!==null&&Math.abs(y-lastY)>(this.ymax-this.ymin)*2)){pen=false;lastY=null;continue;}
    var py=this.Y(y);if(py<-2000)py=-2000;if(py>this.h+2000)py=this.h+2000;
    if(!pen){g.moveTo(this.X(x),py);pen=true;}else g.lineTo(this.X(x),py);
    lastY=y;
  }
  g.stroke();g.setLineDash([]);
};
Plot.prototype.seg=function(x1,y1,x2,y2,color,width,dash){
  var g=this.g;g.strokeStyle=color;g.lineWidth=width||1.5;g.setLineDash(dash||[]);
  g.beginPath();g.moveTo(this.X(x1),this.Y(y1));g.lineTo(this.X(x2),this.Y(y2));g.stroke();g.setLineDash([]);
};
Plot.prototype.arrow=function(x1,y1,x2,y2,color,width,dash){
  var g=this.g,ax=this.X(x1),ay=this.Y(y1),bx=this.X(x2),by=this.Y(y2),L=Math.hypot(bx-ax,by-ay);
  if(L<2){this.dot(x2,y2,color,3);return;}
  var ux=(bx-ax)/L,uy=(by-ay)/L,hd=Math.min(12,L*0.6);
  g.strokeStyle=color;g.fillStyle=color;g.lineWidth=width||2.4;g.setLineDash(dash||[]);
  g.beginPath();g.moveTo(ax,ay);g.lineTo(bx-ux*hd*0.8,by-uy*hd*0.8);g.stroke();g.setLineDash([]);
  g.beginPath();g.moveTo(bx,by);g.lineTo(bx-ux*hd-uy*hd*0.45,by-uy*hd+ux*hd*0.45);g.lineTo(bx-ux*hd+uy*hd*0.45,by-uy*hd-ux*hd*0.45);g.closePath();g.fill();
};
Plot.prototype.dot=function(x,y,color,r){
  var g=this.g;g.fillStyle=color;g.beginPath();g.arc(this.X(x),this.Y(y),r||5,0,Math.PI*2);g.fill();
  g.strokeStyle=css("--surface");g.lineWidth=1.5;g.stroke();
};
Plot.prototype.ring=function(x,y,color,r){
  var g=this.g;g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.arc(this.X(x),this.Y(y),r||9,0,Math.PI*2);g.stroke();
};
Plot.prototype.poly=function(pts,color,alpha,stroke){
  var g=this.g,i;g.beginPath();
  for(i=0;i<pts.length;i++){if(i===0)g.moveTo(this.X(pts[i].x),this.Y(pts[i].y));else g.lineTo(this.X(pts[i].x),this.Y(pts[i].y));}
  g.closePath();g.globalAlpha=alpha===undefined?0.25:alpha;g.fillStyle=color;g.fill();g.globalAlpha=1;
  if(stroke!==false){g.strokeStyle=color;g.lineWidth=1.8;g.stroke();}
};
Plot.prototype.handle=function(pt,color){this.ring(pt.x,pt.y,color,9);};
Plot.prototype.angle=function(a,b,color){
  var g=this.g,a1=Math.atan2(a.y,a.x),d=Math.atan2(b.y,b.x)-a1;
  while(d>Math.PI)d-=2*Math.PI;while(d<=-Math.PI)d+=2*Math.PI;
  g.strokeStyle=color;g.lineWidth=1.5;g.beginPath();g.arc(this.X(0),this.Y(0),26,-a1,-(a1+d),d>0);g.stroke();
};
Plot.prototype.label=function(x,y,t,color,dx,dy){
  var g=this.g;g.fillStyle=color||css("--ink");g.font="12px 'IBM Plex Mono',monospace";g.textAlign="left";g.textBaseline="middle";
  var px=this.X(x)+(dx===undefined?8:dx),py=this.Y(y)+(dy===undefined?-10:dy);
  var tw=g.measureText(t).width;if(px+tw>this.w-4)px=this.w-4-tw;if(px<4)px=4;if(py<10)py=10;if(py>this.h-10)py=this.h-10;
  g.fillText(t,px,py);
};

/* draggable points: pts is an array of {x,y}; values snap to `snap` (default 0.5) */
function drag(p,pts,draw,snap){
  var c=p.c,active=null;snap=snap||0.5;c.style.touchAction="none";c.style.cursor="grab";
  function pos(e){var r=c.getBoundingClientRect();return {px:e.clientX-r.left,py:e.clientY-r.top};}
  c.addEventListener("pointerdown",function(e){
    var q=pos(e),best=null,bd=34;
    pts.forEach(function(pt){var d=Math.hypot(p.X(pt.x)-q.px,p.Y(pt.y)-q.py);if(d<bd){bd=d;best=pt;}});
    if(best){active=best;c.setPointerCapture(e.pointerId);c.style.cursor="grabbing";e.preventDefault();}
  });
  c.addEventListener("pointermove",function(e){
    if(!active)return;var q=pos(e),v=p.fromPx(q.px,q.py);
    active.x=Math.max(Math.ceil(p.xmin),Math.min(Math.floor(p.xmax),Math.round(v.x/snap)*snap));
    active.y=Math.max(Math.ceil(p.ymin),Math.min(Math.floor(p.ymax),Math.round(v.y/snap)*snap));
    draw();
  });
  function up(){active=null;c.style.cursor="grab";}
  c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
}

function bind(ids,draw){ids.forEach(function(id){$(id).addEventListener("input",draw);});redraws.push(draw);draw();}
function reg(draw){redraws.push(draw);draw();}
function out(id,d){var e=$(id),v=parseFloat(e.value);$(id+"o").textContent=fmt(v,d);return v;}

function initPage(KEY){
  Array.prototype.forEach.call(document.querySelectorAll(".quiz"),function(q){
    var fb=q.querySelector(".fb"),ans=q.getAttribute("data-answer");
    Array.prototype.forEach.call(q.querySelectorAll("button"),function(b){
      b.addEventListener("click",function(){
        Array.prototype.forEach.call(q.querySelectorAll("button"),function(x){x.classList.remove("right","wrong");});
        var ok=b.getAttribute("data-o")===ans;
        b.classList.add(ok?"right":"wrong");
        fb.textContent=fb.getAttribute(ok?"data-ok":"data-no");
        fb.className="fb "+(ok?"ok":"no");
      });
    });
  });
  var done={};
  try{done=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){done={};}
  function paint(){
    var n=0,boxes=document.querySelectorAll("[data-done]");
    Array.prototype.forEach.call(boxes,function(b){
      var id=b.getAttribute("data-done"),on=!!done[id];b.checked=on;if(on)n++;
      var a=document.querySelector('#toc a[href="#'+id+'"]');if(a)a.classList.toggle("done",on);
    });
    if($("ptext"))$("ptext").textContent=n+" of "+boxes.length+" lessons done";
    if($("pbar"))$("pbar").style.width=(boxes.length?n/boxes.length*100:0)+"%";
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-done]"),function(b){
    b.addEventListener("change",function(){done[b.getAttribute("data-done")]=b.checked;try{localStorage.setItem(KEY,JSON.stringify(done));}catch(e){}paint();});
  });
  paint();
  function all(){redraws.forEach(function(f){f();});}
  var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(all,120);});
  if(window.matchMedia){var mq=window.matchMedia("(prefers-color-scheme: dark)");if(mq.addEventListener)mq.addEventListener("change",all);}
  new MutationObserver(all).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(all);
}
window.MDS={Plot:Plot,css:css,$:$,fmt:fmt,num:num,vec:vec,drag:drag,bind:bind,reg:reg,out:out,initPage:initPage};
})();
