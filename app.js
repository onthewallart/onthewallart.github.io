// Shared behaviour for all gallery pages. Requires data.js first.
(function(){
  var visible=[], lbV=0;

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

  // grid for a category page
  window.renderGrid=function(category){
    var grid=document.getElementById('grid'); if(!grid){ updateCounts(); return; }
    grid.innerHTML=''; visible=[];
    PAINTINGS.forEach(function(p){
      if(category && category!=='All' && p.cat!==category) return;
      visible.push(p);
      var v=visible.length-1;
      var card=document.createElement('div'); card.className='piece';
      card.innerHTML=cardHTML(p);
      card.querySelector('.art').onclick=(function(x){return function(){ openLb(x); };})(v);
      grid.appendChild(card);
    });
    updateCounts();
  };

  // random featured wall on the home page — fresh every visit
  window.renderFeatured=function(count){
    var grid=document.getElementById('featured'); if(!grid) return;
    var pool=PAINTINGS.slice();
    for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=pool[i];pool[i]=pool[j];pool[j]=t; }
    var pick=pool.slice(0,count||9);
    grid.innerHTML=''; visible=pick;
    pick.forEach(function(e,v){
      var card=document.createElement('div'); card.className='piece';
      card.innerHTML=cardHTML(e);
      card.querySelector('.art').onclick=(function(x){return function(){ openLb(x); };})(v);
      grid.appendChild(card);
    });
  };

  // counts on the home category cards
  function updateCounts(){
    var counts={};
    PAINTINGS.forEach(function(p){ counts[p.cat]=(counts[p.cat]||0)+1; });
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

  document.addEventListener('DOMContentLoaded',function(){
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
