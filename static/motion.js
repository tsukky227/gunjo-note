/* A small, dependency-free motion layer for 群青ノート. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const posts = document.getElementById('posts');
  const days = document.getElementById('days');
  const toast = document.getElementById('motion-toast');
  const motes = document.querySelector('.sky-motes');
  let toastTimer, frame = 0, counting = false, countFrame = 0;
  const points = [[14,17],[21,65],[32,12],[41,36],[49,21],[57,62],[65,14],[73,44],[83,19],[91,55]];
  points.forEach(([x,y],i) => {
    const dot = document.createElement('i');
    for (const [key,value] of Object.entries({x:x+'%',y:y+'%',size:(2+i%3)+'px',duration:(7+i%4)+'s',delay:(-i*1.13)+'s'})) dot.style.setProperty('--'+key,value);
    motes.append(dot);
  });
  document.documentElement.classList.add('motion-ready');
  // Background follows the page very subtly; text and controls stay stable.
  function shiftSky(){
    frame=0;
    const shift = reduced.matches ? 0 : Math.min(19, Math.max(0, -hero.getBoundingClientRect().top*.035));
    hero.style.setProperty('--sky-shift',shift+'px');
  }
  function requestShift(){if(!frame)frame=requestAnimationFrame(shiftSky)}
  addEventListener('scroll',requestShift,{passive:true});
  reduced.addEventListener('change',requestShift);
  requestShift();
  // Reveal once on scroll. Without IntersectionObserver, everything stays visible.
  if('IntersectionObserver' in window && !reduced.matches){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}
    },{threshold:.08});
    document.querySelectorAll('.intro,.count,.sectionhead,.toolbar,.searchrow').forEach(e=>{
      if(e.getBoundingClientRect().top>innerHeight){e.classList.add('reveal-pending');observer.observe(e)}
    });
  }
  const seenCards = new WeakSet();
  const cardObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if(entry.isIntersecting){entry.target.classList.add('card-arrive');cardObserver.unobserve(entry.target)}
  },{threshold:.08}) : null;
  function animateCards(){
    if(reduced.matches)return;
    [...posts.querySelectorAll('.post')].forEach((card,i)=>{
      if(seenCards.has(card))return;
      seenCards.add(card);
      card.style.setProperty('--card-delay',Math.min(i,7)*38+'ms');
      if(cardObserver && card.getBoundingClientRect().top>innerHeight) cardObserver.observe(card);
      else card.classList.add('card-arrive');
    });
  }
  new MutationObserver(animateCards).observe(posts,{childList:true});
  animateCards();
  // Count up only once, when the countdown is reached. Date changes remain instant.
  function countUp(){
    const target=Number(days.textContent);
    if(reduced.matches||!Number.isFinite(target)||target<=0)return;
    const started=performance.now();counting=true;
    function tick(now){if(!counting)return;const progress=Math.min(1,(now-started)/800);days.textContent=String(Math.round(target*(1-Math.pow(1-progress,3))));if(progress<1)countFrame=requestAnimationFrame(tick);else counting=false}
    countFrame=requestAnimationFrame(tick);
  }
  document.getElementById('graduation').addEventListener('change',()=>{counting=false;cancelAnimationFrame(countFrame)});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();countUp()}},{threshold:.35});observer.observe(days)}
  // Feedback is emitted only after a successful operation, not on failed requests.
  document.addEventListener('board:action',({detail})=>{
    const messages={post:'あなたの「いつか」を、ノートに残しました。',like:'応援を届けました。',done:'おめでとう。ひとつ、思い出が増えたね。'};
    toast.textContent=messages[detail.action]||'';
    toast.classList.add('visible');clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('visible'),3000);
    if(detail.action==='post'){const card=posts.querySelector('.post');if(card)card.classList.add('action-pulse')}
  });
})();
