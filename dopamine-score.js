/* HabitFlow — Dopamine Score module v1.0
   Add this line before </body> in index.html:
   <script src="dopamine-score.js"></script>
*/
(function () {
  const STYLE = `
    .hf-dopamine-hero{background:linear-gradient(135deg,#111827,#202b42);color:#fff;border-radius:27px;padding:24px 20px;text-align:center;box-shadow:0 16px 40px #0b0f1920;margin-bottom:14px}
    .hf-score-orb{width:154px;height:154px;margin:8px auto 14px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#20c46b var(--deg),#30394b 0);position:relative}
    .hf-score-orb:after{content:"";position:absolute;inset:10px;border-radius:50%;background:#111827}
    .hf-score-num{position:relative;z-index:1;font-size:48px;font-weight:900;line-height:1}.hf-score-num small{display:block;font-size:9px;letter-spacing:.15em;color:#aeb7c8;margin-top:5px}
    .hf-score-delta{font-size:13px;color:#8ff0b1;font-weight:800}
    .hf-pillar{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:15px;margin:9px 0}
    .hf-pillar-top{display:flex;justify-content:space-between;align-items:center}.hf-pillar-top b{font-size:14px}.hf-pillar-top span{font-size:13px;font-weight:900}
    .hf-mini-bar{height:7px;background:#edf0f4;border-radius:20px;overflow:hidden;margin-top:10px}.hf-mini-bar i{display:block;height:100%;background:var(--green);border-radius:20px}
    .hf-score-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hf-score-box{background:#f7f8fb;border-radius:17px;padding:14px}.hf-score-box b{font-size:20px}.hf-score-box small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
    .hf-insight{background:#eefbf3;border:1px solid #ccefd9;border-radius:19px;padding:15px;margin:10px 0}.hf-insight b{display:block;margin-bottom:5px}
    .hf-chart{height:125px;display:flex;align-items:end;gap:6px;padding-top:15px}.hf-chart-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:5px}.hf-chart-bar{width:100%;max-width:30px;background:var(--green);border-radius:7px 7px 3px 3px;min-height:3px}.hf-chart-col small{font-size:9px;color:var(--muted)}
    .hf-data-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hf-data-grid .field{margin:0}.hf-score-note{font-size:11px;color:var(--muted);line-height:1.5}.hf-score-action{width:100%;border:0;border-radius:14px;padding:14px;font-weight:900;background:var(--dark);color:#fff;margin-top:10px}
    @media(max-width:380px){.hf-data-grid{grid-template-columns:1fr}.hf-score-orb{width:140px;height:140px}}
  `;
  const style=document.createElement("style"); style.textContent=STYLE; document.head.appendChild(style);

  const oldRender = window.render;
  const oldPage = window.page;

  // Local state lives inside the same localStorage record as HabitFlow.
  function getState(){ return JSON.parse(localStorage.getItem("habitflow_pro")||"{}"); }
  function saveState(s){ localStorage.setItem("habitflow_pro",JSON.stringify(s)); }

  function keyToday(){ return typeof today==="function" ? today() : new Date().toISOString().slice(0,10); }
  function dateMinus(n){ const d=new Date(); d.setDate(d.getDate()-n); return typeof dk==="function"?dk(d):d.toISOString().slice(0,10); }
  function done(k,name){
    const s=getState(), i=(s.habits||[]).findIndex(h=>h[2]===name);
    return i>=0 && !!(s.done&&s.done[k]&&s.done[k][i]);
  }
  function dopamine(k){
    const s=getState(); s.dopamine=s.dopamine||{}; const d=s.dopamine[k]||{};
    let control;
    if(Number.isFinite(+d.socialMinutes)){ const m=+d.socialMinutes; control=m<30?19:m<60?17:m<90?14:m<120?10:m<180?5:0; }
    else control=done(k,"Ograniczyłem social media")?19:0;
    control=Math.min(25,control+(done(k,"Bez telefonu 30 min po przebudzeniu")?3:0)+(done(k,"Bez telefonu 30 min przed snem")?3:0));

    let sleep;
    if(Number.isFinite(+d.sleepHours)){ const h=+d.sleepHours; sleep=h>=7&&h<=9?15:h>=6?11:h>=5?6:2;if(h>9)sleep=12; }
    else sleep=done(k,"Sen min. 7 h")?15:0;
    const regen=Math.min(20,sleep+(done(k,"10 min wyciszenia")?5:0));

    let steps;
    if(Number.isFinite(+d.steps)){ const x=+d.steps; steps=x<3000?0:x<5000?5:x<7500?8:x<10000?11:x<12500?13:15; }
    else steps=done(k,"Min. 30 min ruchu")?11:0;
    const activity=Math.min(20,steps+(done(k,"Trening / aktywność")?5:0));

    const focus=Math.min(20,(done(k,"20 min nauki / czytania")?5:0)+(done(k,"Zrobiłem najważniejsze zadanie")?8:0)+(done(k,"Zaplanowałem dzień")?3:0)+(done(k,"10 min porządku")?2:0)+(d.deepWork?2:0));
    const self=Math.min(15,(done(k,"Brak słodyczy")?4:0)+(done(k,"Bez słodkich napojów")?3:0)+(done(k,"Bez alkoholu")?3:0)+(done(k,"Bez niepotrzebnego zakupu")?2:0)+(done(k,"Odłożyłem / zainwestowałem pieniądze")?1:0)+(done(k,"Sprawdziłem wydatki")?2:0));
    return {total:Math.max(0,Math.min(100,control+regen+activity+focus+self)),control,regen,activity,focus,self};
  }
  function avg7(){let a=[];for(let i=0;i<7;i++){const k=dateMinus(i),s=getState(),has=Object.keys((s.done||{})[k]||{}).length||Object.keys((s.dopamine||{})[k]||{}).length;if(has)a.push(dopamine(k).total)}return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;}
  function level(v){return v>=95?"PEAK FOCUS":v>=85?"ŚWIETNY DZIEŃ":v>=70?"DOBRY DZIEŃ":v>=50?"STABILNIE":"CZAS NA RESET";}
  function pillar(i,n,v,max){return `<div class="hf-pillar"><div class="hf-pillar-top"><b>${i} ${n}</b><span>${v}/${max}</span></div><div class="hf-mini-bar"><i style="width:${Math.round(v/max*100)}%"></i></div></div>`;}

  window.habitFlowDopamineData=function(){
    const s=getState(),d=(s.dopamine||{})[keyToday()]||{};
    document.getElementById("sheet").innerHTML=`<h2>🧠 Dane do Dopamine Score</h2>
      <div class="hf-score-note">Dopamine Score nie mierzy poziomu dopaminy. To wskaźnik zachowań związanych z kontrolą bodźców, regeneracją, aktywnością, focusem i samokontrolą.</div>
      <div class="hf-data-grid">
      <div class="field"><label>SOCIAL MEDIA / MIN</label><input id="hfSocial" type="number" min="0" placeholder="np. 54" value="${d.socialMinutes??""}"></div>
      <div class="field"><label>SEN / GODZ.</label><input id="hfSleep" type="number" min="0" max="24" step="0.1" placeholder="np. 7.5" value="${d.sleepHours??""}"></div>
      <div class="field"><label>KROKI</label><input id="hfSteps" type="number" min="0" placeholder="np. 8500" value="${d.steps??""}"></div>
      <div class="field"><label>DEEP WORK 30+ MIN</label><button id="hfDeep" class="secondary" data-on="${d.deepWork?1:0}" onclick="this.dataset.on=this.dataset.on==='1'?'0':'1';this.textContent=this.dataset.on==='1'?'✓ Wykonane':'Nie wykonane';this.classList.toggle('primary',this.dataset.on==='1')">${d.deepWork?"✓ Wykonane":"Nie wykonane"}</button></div>
      </div><button class="primary" onclick="habitFlowSaveDopamine()">Zapisz dane</button><button class="secondary" onclick="closeModal()">Anuluj</button>`;
    document.getElementById("modal").classList.add("open");
  };
  window.habitFlowSaveDopamine=function(){
    const s=getState();s.dopamine=s.dopamine||{};
    const val=id=>document.getElementById(id).value===""?undefined:Number(document.getElementById(id).value);
    s.dopamine[keyToday()]={socialMinutes:val("hfSocial"),sleepHours:val("hfSleep"),steps:val("hfSteps"),deepWork:document.getElementById("hfDeep").dataset.on==="1"};
    saveState(s);closeModal();render("dopamine");if(typeof toast==="function")toast("Dane zapisane ✓");
  };

  function renderDopamine(){
    const k=keyToday(),s=dopamine(k),a=avg7(),delta=a?s.total-a:0;
    const vals=[];for(let i=6;i>=0;i--)vals.push(dopamine(dateMinus(i)).total);
    let streak=0;for(let i=0;i<365;i++){const kk=dateMinus(i),st=getState(),has=Object.keys((st.done||{})[kk]||{}).length||Object.keys((st.dopamine||{})[kk]||{}).length;if(!has||dopamine(kk).total<70)break;streak++;}
    const weak=[["📱","Kontrola bodźców",s.control,25],["😴","Regeneracja",s.regen,20],["🏃","Aktywność",s.activity,20],["🎯","Focus",s.focus,20],["🧘","Samokontrola",s.self,15]].sort((x,y)=>x[2]/x[3]-y[2]/y[3])[0];
    const tip=weak[1]==="Kontrola bodźców"?"Spróbuj ograniczyć social media o 30 minut.":weak[1]==="Regeneracja"?"Zadbaj dziś o 7–9 godzin snu i 10 minut wyciszenia.":weak[1]==="Aktywność"?"Dodaj minimum 30 minut ruchu.":weak[1]==="Focus"?"Wykonaj najważniejsze zadanie i 20 minut nauki.":"Zrób dziś jeden świadomy wybór bez szybkiej nagrody.";
    const bars=vals.map((v,i)=>`<div class="hf-chart-col"><div class="hf-chart-bar" style="height:${Math.max(3,v)}%"></div><small>${new Date(dateMinus(6-i)+"T12:00:00").toLocaleDateString("pl-PL",{weekday:"short"})}</small></div>`).join("");
    document.getElementById("app").innerHTML=`
      <section class="hf-dopamine-hero"><div class="eyebrow">Dzisiaj</div><div class="hf-score-orb" style="--deg:${s.total*3.6}deg"><div class="hf-score-num">${s.total}<small>DOPAMINE SCORE</small></div></div><div style="font-size:16px;font-weight:900">${level(s.total)}</div><div class="hf-score-delta">${delta>=0?"↑":"↓"} ${Math.abs(delta)} vs średnia 7 dni</div><button class="hf-score-action" onclick="habitFlowDopamineData()">＋ Uzupełnij dane dnia</button></section>
      <div class="hf-score-cols"><div class="hf-score-box"><b>🔥 ${streak}</b><small>Focus Streak</small></div><div class="hf-score-box"><b>${a||"—"}</b><small>Średnia 7 dni</small></div></div>
      <div class="sectionTitle"><h2>Twoje 5 filarów</h2><small>${s.total}/100</small></div>
      ${pillar("📱","Kontrola bodźców",s.control,25)}${pillar("😴","Regeneracja",s.regen,20)}${pillar("🏃","Aktywność",s.activity,20)}${pillar("🎯","Focus",s.focus,20)}${pillar("🧘","Samokontrola",s.self,15)}
      <div class="sectionTitle"><h2>Co wpłynęło na wynik?</h2></div><div class="card"><div class="rowstat"><span>⭐ Najmocniejszy obszar</span><b>${[["😴 Regeneracja",s.regen],["🏃 Aktywność",s.activity],["🎯 Focus",s.focus],["📱 Bodźce",s.control],["🧘 Samokontrola",s.self]].sort((x,y)=>y[1]-x[1])[0][0]}</b></div><div class="rowstat"><span>⚠️ Do poprawy</span><b>${weak[0]} ${weak[1]}</b></div></div>
      <div class="hf-insight"><b>💡 Jutro spróbuj</b><span>${tip}</span></div>
      <div class="sectionTitle"><h2>📈 Ostatnie 7 dni</h2><small>Próg streaku: 70</small></div><div class="card"><div class="hf-chart">${bars}</div></div>
      <div class="card"><div class="hf-score-note"><b>Jak liczymy?</b><br>Kontrola bodźców 25 • Regeneracja 20 • Aktywność 20 • Focus 20 • Samokontrola 15.<br><br>To autorski wskaźnik zachowań — nie pomiar dopaminy.</div></div>`;
  }

  // Add the new tab.
  const nav=document.querySelector(".navin");
  if(nav && !document.querySelector('[data-page="dopamine"]')){
    const b=document.createElement("button");b.dataset.page="dopamine";b.innerHTML="<b>🧠</b>Score";b.onclick=()=>page("dopamine");nav.appendChild(b);
  }
  const oldPageFn=window.page;
  window.page=function(p){
    document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
    if(p==="dopamine") renderDopamine(); else oldPageFn(p);
  };
})();
