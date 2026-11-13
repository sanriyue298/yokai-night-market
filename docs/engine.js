/* 妖怪夜市 — deterministic economy and placement rules. */
(function(root){'use strict';
const TYPES={fox:{name:'狐妖酒馆',short:'酒馆',cost:42,base:8,color:'#e0b8a5',desc:'相邻的烧烤、茶铺收益 +50%。满月时加成提高。',tag:'联动'},fire:{name:'火灵烧烤',short:'烧烤',cost:36,base:10,color:'#df9870',desc:'每相邻一间酒馆，基础收益 +5。相邻灯笼坊再 +3。',tag:'食摊'},tea:{name:'伞小鬼茶铺',short:'茶铺',cost:30,base:8,color:'#a5c2b4',desc:'每相邻一位巡夜人，基础收益 +6；每个相邻摊位再 +1。',tag:'食摊'},tanuki:{name:'狸猫商人',short:'商人',cost:40,base:6,color:'#ceb58b',desc:'额外获得相邻摊位结算收益的 20%。商人之间不重复抽成。',tag:'回收'},watch:{name:'巡夜人',short:'巡夜',cost:32,base:5,color:'#95aeb4',desc:'保护相邻摊位，免受雨夜和迷雾的减益；为相邻茶铺添客。',tag:'守护'},lantern:{name:'灯笼工坊',short:'灯坊',cost:34,base:6,color:'#ddad72',desc:'每相邻一种不同的摊位，自身基础收益 +3；点亮相邻烧烤。',tag:'增幅'}};
const NIGHTS=[22,35,50,68,88,112,145,185,230,280,335,400];
const SKIES=[{id:'clear',name:'晴夜',desc:'灯火温柔，所有摊位正常营业。'},{id:'moon',name:'满月',desc:'狐妖酒馆对相邻食摊的加成提高至 75%。'},{id:'rain',name:'细雨',desc:'未被巡夜人保护的烧烤收益 −25%；茶铺收益 +25%。'},{id:'festival',name:'灯会',desc:'灯笼工坊收益 +50%，每一条联动额外产生 1 铜钱。'},{id:'mist',name:'薄雾',desc:'未被保护、且没有相邻灯笼的摊位收益 −15%。'}];
const TECH={warm:{name:'百鬼同席',desc:'所有摊位收益 +15%'},charcoal:{name:'不熄之火',desc:'烧烤与酒馆收益 +25%'},tea:{name:'一盏清欢',desc:'茶铺、巡夜人收益 +30%'},paper:{name:'万家灯火',desc:'灯笼对每个相邻摊位额外提供 +3 收益'},trade:{name:'狸猫账本',desc:'商人抽成提高至 35%，招募价格 −10%'},craft:{name:'匠人手记',desc:'升级费用 −25%'}};
class Market{
 constructor(seed=Date.now()){this.version=1;this.seed=seed>>>0;this.nextId=1;this.night=0;this.coins=88;this.total=0;this.lives=3;this.phase='plan';this.board=Array(9).fill(null);this.board[4]={id:this.nextId++,type:'tea',level:1};this.offers=['fox','fire','lantern'];this.rerolls=0;this.tech=[];this.sky=0;this.pending=[];this.last=null;this.history=[];this.note='';}
 rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 adjacent(i){const x=i%3,y=Math.floor(i/3),out=[];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&x+dx<3&&y+dy>=0&&y+dy<3)out.push((y+dy)*3+x+dx);return out;}
 price(type){return Math.ceil(TYPES[type].cost*(this.tech.includes('trade')?.9:1));}
 upgradePrice(i){const m=this.board[i];return m?Math.ceil(TYPES[m.type].cost*.65*m.level*(this.tech.includes('craft')?.75:1)):0;}
 buy(offer,i){if(this.phase!=='plan'||!Number.isInteger(i)||i<0||i>8||this.board[i]||!this.offers[offer])return false;const type=this.offers[offer],cost=this.price(type);if(this.coins<cost)return false;this.coins-=cost;this.board[i]={id:this.nextId++,type,level:1};this.offers[offer]=null;return true;}
 move(a,b){if(this.phase!=='plan'||a<0||b<0||a>8||b>8||!this.board[a]||!Number.isInteger(a)||!Number.isInteger(b))return false;[this.board[a],this.board[b]]=[this.board[b],this.board[a]];return true;}
 sell(i){const m=this.board[i];if(this.phase!=='plan'||!m)return false;this.coins+=Math.floor(TYPES[m.type].cost*(.5+(m.level-1)*.3));this.board[i]=null;return true;}
 upgrade(i){const m=this.board[i],cost=this.upgradePrice(i);if(this.phase!=='plan'||!m||m.level>=3||this.coins<cost)return false;this.coins-=cost;m.level++;return true;}
 reroll(){const cost=4+this.rerolls*2;if(this.phase!=='plan'||this.coins<cost)return false;this.coins-=cost;this.rerolls++;this.offers=Array.from({length:3},()=>Object.keys(TYPES)[Math.floor(this.rand()*6)]);return true;}
 forecast(){const sky=SKIES[this.sky],base=Array(9).fill(0),earn=Array(9).fill(0),links=[];
  this.board.forEach((m,i)=>{if(!m)return;const near=this.adjacent(i).filter(n=>this.board[n]),neighbours=near.map(n=>this.board[n]),level=[1,1.75,2.7][m.level-1];let value=TYPES[m.type].base;
   if(m.type==='fire'){for(const n of near){if(this.board[n].type==='fox'){value+=5;links.push({a:n,b:i,kind:'酒香引客'});}if(this.board[n].type==='lantern'){value+=3;links.push({a:n,b:i,kind:'灯火添旺'});}}}
   if(m.type==='tea'){value+=near.length;for(const n of near)if(this.board[n].type==='watch'){value+=6;links.push({a:n,b:i,kind:'巡夜添茶'});}}
   if(m.type==='lantern')value+=new Set(neighbours.map(n=>n.type)).size*3;
   value*=level;if(this.tech.includes('warm'))value*=1.15;if(this.tech.includes('charcoal')&&['fox','fire'].includes(m.type))value*=1.25;if(this.tech.includes('tea')&&['tea','watch'].includes(m.type))value*=1.3;
   if(['fire','tea'].includes(m.type))for(const n of near)if(this.board[n].type==='fox'){value*=sky.id==='moon'?1.75:1.5;links.push({a:n,b:i,kind:'夜宴连锁'});}
   if(this.tech.includes('paper'))value+=neighbours.filter(n=>n.type==='lantern').length*3;
   const protectedBy=neighbours.some(n=>n.type==='watch');if(sky.id==='rain'&&m.type==='fire'&&!protectedBy)value*=.75;if(sky.id==='rain'&&m.type==='tea')value*=1.25;if(sky.id==='mist'&&!protectedBy&&!neighbours.some(n=>n.type==='lantern'))value*=.85;if(sky.id==='festival'&&m.type==='lantern')value*=1.5;base[i]=Math.round(value);earn[i]=base[i];
  });
  this.board.forEach((m,i)=>{if(m?.type==='tanuki'){for(const n of this.adjacent(i))if(this.board[n]&&this.board[n].type!=='tanuki'){earn[i]+=Math.floor(base[n]*(this.tech.includes('trade')?.35:.2));links.push({a:n,b:i,kind:'狸猫分红'});}}});
  if(sky.id==='festival')for(const l of links)earn[l.b]++;
  return{earn,links,total:earn.reduce((a,b)=>a+b,0),target:NIGHTS[this.night],sky};
 }
 settle(){if(this.phase!=='plan')return false;const f=this.forecast(),success=f.total>=f.target;this.last={...f,success,night:this.night+1,fee:Math.ceil(f.target*.3)};this.coins+=f.total;this.total+=f.total;this.coins=Math.max(0,this.coins-this.last.fee);if(!success)this.lives--;this.history.push({night:this.night+1,total:f.total,target:f.target,success});this.phase='result';return this.last;}
 continue(){if(this.phase!=='result')return false;if(this.lives<=0){this.phase='lost';return true;}if(this.night===11){this.phase='won';return true;}if((this.night+1)%3===0){this.phase='reward';const pool=Object.keys(TECH).filter(k=>!this.tech.includes(k));this.pending=[];while(this.pending.length<3&&pool.length)this.pending.push(pool.splice(Math.floor(this.rand()*pool.length),1)[0]);return true;}this.nextNight();return true;}
 chooseTech(key){if(this.phase!=='reward'||!this.pending.includes(key))return false;this.tech.push(key);this.pending=[];this.nextNight();return true;}
 nextNight(){this.night++;this.phase='plan';this.rerolls=0;this.sky=this.night===1?1:Math.floor(this.rand()*SKIES.length);this.offers=Array.from({length:3},()=>Object.keys(TYPES)[Math.floor(this.rand()*6)]);this.coins+=12;}
 serialize(){return JSON.stringify(this);}
 static restore(text){try{const v=JSON.parse(text);if(v.version!==1||!['plan','result','reward','won','lost'].includes(v.phase)||!Number.isInteger(v.night)||v.night<0||v.night>11||!Array.isArray(v.board)||v.board.length!==9||!Number.isFinite(v.coins)||v.coins<0||![0,1,2,3].includes(v.lives)||!Array.isArray(v.offers)||v.offers.length!==3||v.offers.some(t=>t!==null&&!TYPES[t])||!Array.isArray(v.tech)||v.tech.some(k=>!TECH[k])||!SKIES[v.sky])return null;const ids=new Set();for(const m of v.board){if(!m)continue;if(!TYPES[m.type]||![1,2,3].includes(m.level)||!Number.isInteger(m.id)||ids.has(m.id))return null;ids.add(m.id);}if(!Number.isInteger(v.nextId)||v.nextId<1||!Number.isFinite(v.total)||v.total<0||!Number.isInteger(v.seed)||!Number.isInteger(v.rerolls)||v.rerolls<0||!Array.isArray(v.history)||!Array.isArray(v.pending)||v.pending.some(k=>!TECH[k]))return null;if(v.phase==='result'&&(!v.last||!Number.isFinite(v.last.total)||!Number.isFinite(v.last.fee)))return null;if(v.phase==='reward'&&!v.pending.length)return null;return Object.assign(Object.create(Market.prototype),v);}catch{return null;}}
}
root.Yokai={Market,TYPES,NIGHTS,SKIES,TECH};if(typeof module!=='undefined')module.exports=root.Yokai;
})(typeof window!=='undefined'?window:globalThis);
