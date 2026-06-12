// Shared behaviour for all gallery pages. Requires data.js loaded first.
(function(){
  var visible = [];   // PAINTINGS indices currently shown on this page
  var lbV = 0;

  function cardHTML(p){
    return '<div class="art"><img loading="lazy" src="'+p.src+'" alt="'+p.title+'"></div>'+
      '<div class="plaque"><div class="title">'+p.title+'</div>'+
      '<div class="meta">'+(p.medium || p.cat)+(p.price && p.price!=='Inquire' ? ' · '+p.price : '')+'</div>'+
      '<div class="acts">'+
        (p.sold ? '<a class="sold">Sold</a>'
                : '<a class="inquire" onclick="inquireFor(\''+p.title.replace(/'/g,"")+'\')">Inquire</a>')+
      '</div></div>';
  }

  // Render every painting in `category` (or 'All') into #grid
  window.renderGrid = function(category){
    var grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML=''; visible=[];
    PAINTINGS.forEach(function(p,i){
      if(category && category!=='All' && p.cat!==category) return;
      visible.push(i);
      var v = visible.length-1;
      var card=document.createElement('div'); card.className='piece';
      card.innerHTML=cardHTML(p);
      card.querySelector('.art').onclick=(function(x){return function(){openLb(x);};})(v);
      grid.appendChild(card);
    });
  };

  function openLb(v){
    var lb=document.getElementById('lb'); if(!lb) return;
    lbV=v; var p=PAINTINGS[visible[v]];
    document.getElementById('lb-img').src=p.src;
    document.getElementById('lb-cap').textContent=p.title+(p.medium? ' · '+p.medium : ' · '+p.cat);
    lb.classList.add('open');
  }
  window.closeLb=function(){ var lb=document.getElementById('lb'); if(lb) lb.classList.remove('open'); };
  window.step=function(d){ if(!visible.length)return; lbV=(lbV+d+visible.length)%visible.length; openLb(lbV); };

  // Inquire about a specific painting -> opens an email to Susan
  window.inquireFor=function(title){
    var subject='Inquiry — '+title;
    var body='Hi Susan,\n\nI\'m interested in "'+title+'".\n\nMy name: \nMessage: \n\nThank you!';
    window.location.href='mailto:'+ARTIST_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  };

  // Home-page general inquiry form
  window.sendInquiry=function(){
    var g=function(id){var e=document.getElementById(id);return e?e.value:'';};
    var name=g('f-name')||'(no name)', email=g('f-email')||'(no email)';
    var piece=g('f-piece')||'General inquiry', msg=g('f-msg');
    var body='Name: '+name+'\nEmail: '+email+'\nInterested in: '+piece+'\n\n'+msg;
    window.location.href='mailto:'+ARTIST_EMAIL+'?subject='+encodeURIComponent('Inquiry — '+piece)+'&body='+encodeURIComponent(body);
  };

  document.addEventListener('DOMContentLoaded',function(){
    var lb=document.getElementById('lb');
    if(lb) lb.addEventListener('click',function(e){ if(e.target===this) closeLb(); });
    document.addEventListener('keydown',function(e){
      if(!lb || !lb.classList.contains('open')) return;
      if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')step(1); if(e.key==='ArrowLeft')step(-1);
    });
    var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
  });
})();
