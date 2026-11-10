/* Déca · Hepta : règles de carrière communes au jeu papier et au jeu en ligne (chapitres 11 et 12 du livre).
   Fonctions pures : l'athlète est un objet {CH, gauge, COMP, age, plaf, coach, fat, nextMent}. */
(function(root){
'use strict';
const STATS=['vit','for','pui','det','end','dex','tec','men','tac'];
const GEN={mus:{n:'Musculation',ch:['for','pui','end'],evs:['sp','dt','jt']},
 car:{n:'Cardio',ch:['end','vit','dex'],evs:['400','800','1000','1500']},
 exp:{n:'Explosivité',ch:['det','pui','vit'],evs:['lj','hj','pv','100','200','60','100h','110h','60h']},
 tec:{n:'Technique',ch:['tec','dex'],evs:null,choose:3},
 men:{n:'Préparation mentale',ch:['men','tac'],evs:[],nextMent:1}};
const gaugeNeed=(v,young)=>{const n=v<15?3:v<17?4:v<19?5:6;return young?Math.max(1,n-1):n;};   // coût pour passer de v à v+1
const pctRate=pc=>pc<40?3:pc<80?2:1;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));

function create(DATA,helpers){
 const E=helpers.engine;
 const avgCap=(A,ids)=>ids.reduce((s,id)=>s+E.capOf(id,A.COMP[id]||0),0)/ids.length;
 /* un athlète neuf : 13 partout + 16 points à répartir, plafonds de morphologie */
 function newAthlete(opts){const CH={};STATS.forEach(k=>CH[k]=13);
  let left=16;const plaf=opts.plaf||{};const alloc=opts.alloc||{};
  for(const k of STATS){const want=Math.min(alloc[k]||0,left,(plaf[k]||20)-13);CH[k]+=want;left-=want;}
  const gauge={};STATS.forEach(k=>gauge[k]=0);
  return{CH,gauge,COMP:Object.assign({},opts.COMP||{}),age:opts.age||19,plaf,coach:opts.coach||0,fat:0,nextMent:0,left};}
 /* jet de séance : seuil = capacité moyenne + coach + 2 si 20 ans ou moins − fatigue */
 function sessionSeuil(A,ids){return cl(Math.round(avgCap(A,ids))+A.coach+(A.age<=20?2:0)-A.fat,1,18);}
 function sessionPoints(A,seuil,d){if(d===20){A.fat=Math.min(3,A.fat+1);return 0;}return d===seuil?2:d<seuil?1:0;}
 /* séance générale : les points vont dans la jauge d'une caractéristique au choix */
 function generalSession(A,type,d,pick,ids,optsEv){
  const g=GEN[type];const seuil=sessionSeuil(A,ids);const pts=sessionPoints(A,seuil,d);const out={seuil,d,pts,gained:[],pct:{}};
  if(!pts)return out;if(!g.ch.includes(pick))throw new Error('caractéristique non permise');
  const young=A.age<=19;let n=pts;
  while(n>0){const v=A.CH[pick];if(v>=Math.min(20,A.plaf[pick]||20))break;A.gauge[pick]+=1;n--;if(A.gauge[pick]>=gaugeNeed(v,young)){A.gauge[pick]=0;A.CH[pick]+=1;out.gained.push(pick);}}
  const evs=g.evs===null?(optsEv||[]).slice(0,g.choose):g.evs;
  if(evs)evs.forEach(id=>{if(A.COMP[id]!=null||true){const before=A.COMP[id]||0;A.COMP[id]=Math.min(100,before+1);out.pct[id]=1;}});
  if(g.nextMent)A.nextMent+=g.nextMent;
  return out;}
 /* séance de discipline : les points donnent du % ; un parfait donne en plus une case de jauge sur une des 3 caractéristiques */
 function disciplineSession(A,id,d,pickCh,ids){
  const seuil=sessionSeuil(A,ids);const pts=sessionPoints(A,seuil,d);const out={seuil,d,pts,pct:0,gauge:null};
  if(!pts)return out;const cur=A.COMP[id]||0;const young=A.age<=19;
  let g=pts*pctRate(cur);if(young)g=Math.ceil(g*1.25);g=Math.min(g,100-cur);A.COMP[id]=cur+g;out.pct=g;
  if(d===seuil&&pickCh&&DATA.TRIO[id].includes(pickCh)){const v=A.CH[pickCh];if(v<Math.min(20,A.plaf[pickCh]||20)){A.gauge[pickCh]+=1;out.gauge=pickCh;if(A.gauge[pickCh]>=gaugeNeed(v,young)){A.gauge[pickCh]=0;A.CH[pickCh]+=1;out.up=pickCh;}}}
  return out;}
 /* après une compétition, dans chaque épreuve disputée */
 function afterCompetition(A,id,rank,pr){let g=2;if(rank<=3)g=4;else if(rank<=8)g=3;if(pr)g+=1;A.COMP[id]=Math.min(100,(A.COMP[id]||0)+g);return g;}
 /* début de saison : vieillissement */
 function ageSeason(A,dChoice){A.age+=1;const lost=[];if(A.age>29){const n=A.age>=35?3:2;const pool=['vit','det','pui','dex'];for(let i=0;i<n;i++){const k=dChoice?dChoice(i,pool):pool[i%4];if(A.CH[k]>1){A.CH[k]-=1;lost.push(k);}}}return lost;}
 return{newAthlete,sessionSeuil,generalSession,disciplineSession,afterCompetition,ageSeason,gaugeNeed,pctRate,GEN};
}
const api={create,STATS,GEN,gaugeNeed,pctRate};
if(typeof module!=='undefined')module.exports=api;else root.PaperCareer=api;
})(typeof window!=='undefined'?window:this);
