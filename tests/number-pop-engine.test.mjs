import assert from 'node:assert/strict';
import {topics,question,parseAnswer,isCorrect,adapt,settingsKey} from '../interactives/number-pop-engine.mjs';
const num=s=>parseAnswer(s);
const minutes=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
const near=(actual,expected,context)=>assert(Math.abs(actual-expected)<1e-7,`${context}: expected ${expected}, got ${actual}`);
function independentlySolve(q){const t=q.text;let m;
 if((m=t.match(/^(.+?) ([+−×÷]) (.+)$/))){const a=num(m[1]),b=num(m[3]);if(a!==null&&b!==null)return m[2]==='+'?a+b:m[2]==='−'?a-b:m[2]==='×'?a*b:a/b;}
 if((m=t.match(/^([\d/]+) of (\d+)$/)))return num(m[1])*+m[2];
 if((m=t.match(/^([\d.]+)% of ([\d.]+)$/)))return +m[1]/100*+m[2];
 if((m=t.match(/^([\d.]+)% of what number is ([\d.]+)\?$/)))return +m[2]/(+m[1]/100);
 if((m=t.match(/^(Increase|Decrease) ([\d.]+) by ([\d.]+)%$/)))return +m[2]*(1+(m[1]==='Increase'?1:-1)*+m[3]/100);
 if((m=t.match(/^([\d.]+): increase ([\d.]+)%, then decrease ([\d.]+)%$/)))return +m[1]*(1+ +m[2]/100)*(1- +m[3]/100);
 if((m=t.match(/^(\d+) hours? = \? minutes$/)))return +m[1]*60;
 if((m=t.match(/^(\d+) h (\d+) min = \? (minutes|seconds)$/)))return (+m[1]*60+ +m[2])*(m[3]==='seconds'?60:1);
 if((m=t.match(/^Minutes from (\d{2}:\d{2}) to (\d{2}:\d{2})(?: \(next occurrence\))?\?$/)))return (minutes(m[2])-minutes(m[1])+1440)%1440;
 if((m=t.match(/^(\d{2}:\d{2}) \+ (\d+) minutes = \?$/)))return (minutes(m[1])+ +m[2])%1440;
 if((m=t.match(/^(\d+)(²|³)$/)))return (+m[1])**(m[2]==='²'?2:3);
 if((m=t.match(/^(√|∛)(\d+)$/)))return m[1]==='√'?Math.sqrt(+m[2]):Math.cbrt(+m[2]);
 throw Error('Unrecognised question: '+t);
}
for(const [raw,value] of [['3/4',.75],['6/8',.75],['0.75',.75],['1 1/2',1.5],['-1 1/2',-1.5],['−2.5',-2.5],['.5',.5],['1 / 2',.5]])assert.equal(parseAnswer(raw),value);
for(const raw of ['', '1/0','NaN','Infinity','2+2','1,5','1/2/3','1 3/2'])assert.equal(parseAnswer(raw),null,raw);
assert.equal(parseAnswer('00:05','clock'),5);assert.equal(parseAnswer('23:59','clock'),1439);assert.equal(parseAnswer('9:05','clock'),545);
for(const raw of ['24:00','12:60','12:5','90','-1:00'])assert.equal(parseAnswer(raw,'clock'),null);
assert(isCorrect('6/8',{answer:.75,format:'fraction'}));assert(!isCorrect('.74',{answer:.75,format:'fraction'}));
for(let level=1;level<=6;level++)for(const topic of Object.keys(topics))for(let i=0;i<600;i++){const q=question(level,[topic]);assert.equal(q.op,topic);assert(Number.isFinite(q.answer));assert(q.explanation.length>5);near(q.answer,independentlySolve(q),q.text);assert(isCorrect(q.answerText,q),q.text+' / '+q.answerText);}
assert.equal(adapt(6,Array(4).fill({correct:true,seconds:1})),6);assert.equal(adapt(1,Array(4).fill({correct:false,seconds:1})),1);assert.equal(adapt(3,Array(4).fill({correct:true,seconds:1})),4);assert.equal(adapt(3,Array(4).fill({correct:false,seconds:1})),2);
const s={duration:60,ops:['add','time'],startLevel:2,adaptive:false};assert.equal(settingsKey(s),settingsKey({...s,ops:['time','add']}));for(const change of [{duration:30},{ops:['add']},{startLevel:3},{adaptive:true}])assert.notEqual(settingsKey(s),settingsKey({...s,...change}));
assert.throws(()=>question(0,['add']));assert.throws(()=>question(1,[]));
console.log('32,400 questions independently checked across 9 topics and 6 levels; answer parsing, time formats, adaptation bounds and score settings passed.');
