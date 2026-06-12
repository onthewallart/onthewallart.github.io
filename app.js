// Shared behaviour + in-browser editor for all gallery pages. Requires data.js first.
(function(){
  var LS='otwa_overrides_v1';
  var CATS=['Florals','Beaches','Landscapes','Towns','Animals','Figures','Abstract'];
  var ov={}; try{ ov=JSON.parse(localStorage.getItem(LS))||{}; }catch(e){ ov={}; }
  function saveOv(){ try{ localStorage.setItem(LS, JSON.stringify(ov)); }catch(e){} }

  // effective painting = original with Susan's saved edits applied
  function eff(p){
    var o=ov[p.src]||{};
    return { src:p.src,
             title:(o.title!=null?o.title:p.title),
             medium:p.medium, price:p.price,
             sold:(o.sold!=null?o.sold:p.sold),
             cat:(o.cat||p.cat),
             deleted:!!o.deleted };
  }
  function setOv(src,key,val){ ov[src]=ov[src]||{}; ov[src][key]=val; saveOv(); }

  var visible=[];   // effective objects currently shown
  var lbV=0, pageCat=null;

  function cardHTML(e){
    return '<div class="art"><img loading="lazy" src="'+e.src+'" alt="'+e.title+'">'+
        (e.sold?'<span class="sold-flag">Sold</span>':'')+'</div>'+
      '<div class="plaque"><div class="title">'+e.title+'</div>'+
      '<div class="meta">'+(e.medium||e.cat)+'</div>'+
      '<div class="acts">'+
        (e.sold ? '<a class="sold">Sold</a>'
                : '<a class="inquire" onclick="inquireFor(\''+e.title.replace(/'/g,"")+'\')">Inquire</a>')+
      '</div></div>';
  }

  window.renderGrid=function(category){
    pageCat=category;
    var grid=document.getElementById('grid'); if(!grid){ updateCounts(); return; }
    var editing=document.body.classList.contains('editing');
    grid.innerHTML=''; visible=[];
    PAINTINGS.forEach(function(p){
      var e=eff(p);
      if(e.deleted) return;
      if(category && category!=='All' && e.cat!==category) return;
      visible.push(e);
      var v=visible.length-1;
      var card=document.createElement('div'); card.className='piece'+(editing?' editing-card':'');
      card.innerHTML=cardHTML(e);
      card.querySelector('.art').onclick=(function(x){return function(){ if(!document.body.classList.contains('editing')) openLb(x); };})(v);
      if(editing) addEditControls(card,e);
      grid.appendChild(card);
    });
    updateCounts();
  };

  function addEditControls(card,e){
    var art=card.querySelector('.art');
    var rm=document.createElement('button'); rm.className='ec-x'; rm.textContent='✕'; rm.title='Remove this picture';
    rm.onclick=function(ev){ ev.stopPropagation(); setOv(e.src,'deleted',true); window.renderGrid(pageCat); };
    art.appendChild(rm);

    var panel=document.createElement('div'); panel.className='ec-panel';
    var ti=document.createElement('input'); ti.className='ec-title'; ti.value=e.title; ti.placeholder='Name this painting';
    ti.onclick=function(ev){ ev.stopPropagation(); };
    ti.onchange=function(){ setOv(e.src,'title',ti.value); };
    panel.appendChild(ti);

    var row=document.createElement('div'); row.className='ec-row';
    var sold=document.createElement('button'); sold.className='ec-btn'+(e.sold?' on':''); sold.textContent=e.sold?'Sold ✓':'Mark Sold';
    sold.onclick=function(ev){ ev.stopPropagation(); setOv(e.src,'sold',!e.sold); window.renderGrid(pageCat); };
    var mv=document.createElement('select'); mv.className='ec-sel';
    var d=document.createElement('option'); d.value=''; d.textContent='Move to…'; mv.appendChild(d);
    CATS.forEach(function(c){ if(c===e.cat) return; var o=document.createElement('option'); o.value=c; o.textContent=c; mv.appendChild(o); });
    mv.onclick=function(ev){ ev.stopPropagation(); };
    mv.onchange=function(){ if(mv.value){ setOv(e.src,'cat',mv.value); window.renderGrid(pageCat); } };
    row.appendChild(sold); row.appendChild(mv);
    panel.appendChild(row);
    art.appendChild(panel);
  }

  // counts on the home category cards
  function updateCounts(){
    var counts={};
    PAINTINGS.forEach(function(p){ var e=eff(p); if(e.deleted) return; counts[e.cat]=(counts[e.cat]||0)+1; });
    document.querySelectorAll('[data-count]').forEach(function(el){
      el.textContent=(counts[el.getAttribute('data-count')]||0)+' works';
    });
  }

  // lightbox
  function openLb(v){ var lb=document.getElementById('lb'); if(!lb)return;
    lbV=v; var e=visible[v];
    document.getElementById('lb-img').src=e.src;
    document.getElementById('lb-cap').textContent=e.title+(e.sold?' · Sold':'')+' · '+e.cat;
    lb.classList.add('open'); }
  window.closeLb=function(){ var lb=document.getElementById('lb'); if(lb) lb.classList.remove('open'); };
  window.step=function(d){ if(!visible.length)return; lbV=(lbV+d+visible.length)%visible.length; openLb(lbV); };

  // inquiries -> email Susan
  window.inquireFor=function(title){
    var s='Inquiry — '+title;
    var b='Hi Susan,\n\nI\'m interested in "'+title+'".\n\nMy name: \nMessage: \n\nThank you!';
    window.location.href='mailto:'+ARTIST_EMAIL+'?subject='+encodeURIComponent(s)+'&body='+encodeURIComponent(b);
  };
  window.sendInquiry=function(){
    var g=function(id){var x=document.getElementById(id);return x?x.value:'';};
    var name=g('f-name')||'(no name)', email=g('f-email')||'(no email)';
    var piece=g('f-piece')||'General inquiry', msg=g('f-msg');
    var b='Name: '+name+'\nEmail: '+email+'\nInterested in: '+piece+'\n\n'+msg;
    window.location.href='mailto:'+ARTIST_EMAIL+'?subject='+encodeURIComponent('Inquiry — '+piece)+'&body='+encodeURIComponent(b);
  };

  // ===== editor chrome =====
  function toggleEdit(){ document.body.classList.toggle('editing'); if(pageCat!=null) window.renderGrid(pageCat); else updateCounts(); }

  function downloadData(){
    var kept=[];
    PAINTINGS.forEach(function(p){ var e=eff(p); if(!e.deleted) kept.push(e); });
    function esc(s){ return String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"'); }
    var lines=kept.map(function(e){
      return '  { src: "'+e.src+'", title: "'+esc(e.title)+'", medium: "'+(e.medium||'')+'", price: "'+(e.price||'Inquire')+'", sold:'+(e.sold?'true':'false')+', cat:"'+e.cat+'" }';
    });
    var txt='// Shared data for all gallery pages — edit titles/prices/availability here.\n'+
            'var ARTIST_EMAIL = "'+ARTIST_EMAIL+'";\n\nvar PAINTINGS = [\n'+lines.join(',\n')+'\n];\n';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));
    a.download='data.js'; document.body.appendChild(a); a.click(); a.remove();
    alert('Saved "data.js" to your Downloads ('+kept.length+' paintings).\n\nTo publish your changes:\n1. Move it into the mom-gallery folder, replacing the old data.js\n2. Double-click DEPLOY ON THE WALL ART');
  }

  function buildEditUI(){
    var btn=document.createElement('button'); btn.id='editToggle'; btn.textContent='✎ Edit gallery';
    btn.onclick=toggleEdit; document.body.appendChild(btn);
    var bar=document.createElement('div'); bar.id='editBar';
    bar.innerHTML='<span class="eb-msg">✎ <b>Editing</b> — remove, rename, mark Sold, or move any painting. Changes save on this computer.</span>'+
      '<span class="eb-actions">'+
        '<button id="ebDownload">⬇ Download to publish</button>'+
        '<button id="ebReset">Undo all edits</button>'+
        '<button id="ebDone">Done</button></span>';
    document.body.appendChild(bar);
    document.getElementById('ebDone').onclick=toggleEdit;
    document.getElementById('ebDownload').onclick=downloadData;
    document.getElementById('ebReset').onclick=function(){
      if(confirm('Undo ALL of your edits and restore the original gallery?')){ ov={}; saveOv(); if(pageCat!=null) window.renderGrid(pageCat); else updateCounts(); }
    };
  }

  document.addEventListener('DOMContentLoaded',function(){
    buildEditUI();
    var lb=document.getElementById('lb');
    if(lb) lb.addEventListener('click',function(e){ if(e.target===this) closeLb(); });
    document.addEventListener('keydown',function(e){
      if(!lb || !lb.classList.contains('open')) return;
      if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')step(1); if(e.key==='ArrowLeft')step(-1);
    });
    var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
    updateCounts();
  });
})();
