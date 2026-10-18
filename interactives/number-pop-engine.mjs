export const topics={add:{label:'Addition',symbol:'+'},sub:{label:'Subtraction',symbol:'−'},mul:{label:'Multiplication',symbol:'×'},div:{label:'Division',symbol:'÷'},fractions:{label:'Fractions',symbol:'½'},percent:{label:'Percentages',symbol:'%'},decimals:{label:'Decimals',symbol:'0.1'},time:{label:'Time',symbol:'◷'},powers:{label:'Powers & roots',symbol:'x²'}};
export const levels=['Single digit','Two digit','Intermediate','Advanced','Expert','Ultimate challenge'];
export const levelDetails=[
 'Single-digit arithmetic; halves and quarters; simple percentages, tenths and time conversions.',
 'Two-digit addition and subtraction; times tables; common fractions, percentages and decimal addition.',
 'Three-digit addition; multiplication beyond tables; fraction arithmetic, hundredths and elapsed time.',
 'Larger arithmetic; unlike fraction denominators; percentage changes, decimals and times across midnight.',
 'Multi-digit multiplication; mixed fractions, reverse percentages, decimal division and cubes.',
 'Large numbers; mixed fraction division, compound percentage changes, detailed time calculations and cube roots.'
];
const int=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[int(0,a.length-1)];
const clean=n=>Number(n.toFixed(8));
export const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
export function fraction(n,d){const g=gcd(n,d);n/=g;d/=g;return d===1?String(n):`${n}/${d}`;}
const clock=n=>`${String(Math.floor(((n%1440)+1440)%1440/60)).padStart(2,'0')}:${String(((n%1440)+1440)%1440%60).padStart(2,'0')}`;
function q(text,answer,explanation,options={}){return {text,answer:clean(answer),answerText:String(clean(answer)),format:'number',hint:'Enter a number. Fractions such as 3/4 are also accepted.',explanation,...options};}
function arithmetic(level,op){let a,b,answer,explanation;const max=[9,99,499,999,4999,9999][level-1];
 if(op==='add'||op==='sub'){
  a=int(level===1?0:10,max);b=int(level===1?0:10,max);if(op==='sub'&&b>a)[a,b]=[b,a];answer=op==='add'?a+b:a-b;
  const place=10**Math.max(0,String(b).length-1),part=Math.floor(b/place)*place,rest=b-part;
  explanation=op==='add'?`Split ${b} into ${part} + ${rest}. ${a} + ${part} = ${a+part}; add ${rest} to get ${answer}.`:`Subtract ${part} first: ${a} − ${part} = ${a-part}. Subtract ${rest} more to get ${answer}.`;
 }else if(op==='mul'){
  a=int(1,[9,12,25,50,99,999][level-1]);b=int(1,[9,12,12,25,50,99][level-1]);answer=a*b;
  const place=a<10?1:10**(String(a).length-1),part=Math.floor(a/place)*place,rest=a-part;
  explanation=rest?`${a} × ${b} = (${part} × ${b}) + (${rest} × ${b}) = ${part*b} + ${rest*b} = ${answer}.`:`${a} groups of ${b} give ${answer}.`;
 }else{b=int(1,[3,12,12,25,50,99][level-1]);answer=int(1,[3,12,25,50,99,199][level-1]);a=b*answer;explanation=`Use multiplication: ${b} × ${answer} = ${a}, so ${a} ÷ ${b} = ${answer}.`;}
 return q(`${a} ${topics[op].symbol} ${b}`,answer,explanation);
}
function fractions(level){
 if(level<=2){const d=pick(level===1?[2,4]:[2,3,4,5,8,10]),n=level===1?1:int(1,d-1),whole=d*int(1,level===1?4:12),answer=whole*n/d;return q(`${fraction(n,d)} of ${whole}`,answer,`Divide by ${d}, then multiply by ${n}: ${whole} ÷ ${d} × ${n} = ${answer}.`);}
 const d=pick([2,3,4,5,6,8]),e=level===3?d:pick([2,3,4,5,6,8,10,12]);
 const mixed=level>=5,n=int(1,d-1)+(mixed?d*int(1,3):0),m=int(1,e-1)+(mixed?e*int(1,2):0);
 const op=pick(level===3?['+','−']:level===6?['+','−','×','÷']:['+','−','×']);let num,den,a=n,b=m,c=d,f=e;
 if(op==='−'&&a/c<b/f){[a,b]=[b,a];[c,f]=[f,c];}
 if(op==='+'||op==='−'){num=a*f+(op==='+'?1:-1)*b*c;den=c*f;}else if(op==='×'){num=a*b;den=c*f;}else{num=a*f;den=c*b;}
 const display=(x,y)=>mixed&&x>y?`${Math.floor(x/y)} ${x%y}/${y}`:fraction(x,y);
 const text=`${display(a,c)} ${op} ${display(b,f)}`,answerText=fraction(num,den);
 const explanation=op==='+'||op==='−'?`Use denominator ${den}: ${a*f}/${den} ${op} ${b*c}/${den} = ${num}/${den} = ${answerText}.`:op==='×'?`Multiply numerators and denominators: (${a} × ${b}) / (${c} × ${f}) = ${answerText}.`:`Multiply by the reciprocal: ${a}/${c} × ${f}/${b} = ${answerText}.`;
 return q(text,num/den,explanation,{format:'fraction',answerText,hint:'Enter a fraction, decimal or mixed number, e.g. 3/4, 0.75 or 1 1/2.'});
}
function percentages(level){
 const p=pick(level===1?[10,50]:level===2?[10,20,25,50,75]:level<=4?[5,10,12.5,15,20,25,30,75]:[2.5,7.5,12.5,17.5,22.5,35,65,125]);
 const base=(p%1?40:20)*int(1,[5,10,20,30,40,50][level-1]);
 if(level>=5&&Math.random()<.35){const part=clean(base*p/100);return q(`${p}% of what number is ${part}?`,base,`${p}% = ${p/100}. Divide ${part} by ${p/100} to get ${base}.`);}
 if(level===6&&Math.random()<.35){const r=pick([5,10,15,20,25]),after=clean(base*(1+p/100)),answer=clean(after*(1-r/100));return q(`${base}: increase ${p}%, then decrease ${r}%`,answer,`First ${base} × ${clean(1+p/100)} = ${after}. Then ${after} × ${1-r/100} = ${answer}.`);}
 if(level>=4&&Math.random()<.5){const increase=Math.random()<.5,part=clean(base*p/100),answer=clean(base+(increase?part:-part));return q(`${increase?'Increase':'Decrease'} ${base} by ${p}%`,answer,`${p}% of ${base} is ${part}. ${increase?'Add':'Subtract'} ${part}: ${answer}.`);}
 return q(`${p}% of ${base}`,base*p/100,`${p}% means ${p} out of 100. ${base} × ${p} ÷ 100 = ${clean(base*p/100)}.`);
}
function decimals(level){
 const scale=level<=2?10:100,op=pick(level===1?['+']:level<=3?['+','−']:['+','−','×','÷']);let a,b,answer,explanation;
 if(op==='+'||op==='−'){a=int(1,[9,99,499,999,1999,9999][level-1]);b=int(1,[9,99,499,999,1999,9999][level-1]);if(op==='−'&&b>a)[a,b]=[b,a];answer=(op==='+'?a+b:a-b)/scale;explanation=`Work in ${scale===10?'tenths':'hundredths'}: ${a} ${op} ${b} = ${op==='+'?a+b:a-b}. Divide by ${scale} to get ${clean(answer)}.`;a/=scale;b/=scale;
 }else if(op==='×'){a=int(1,level===6?199:49)/10;b=int(1,level>=5?49:12)/10;answer=a*b;explanation=`${clean(a*10)} × ${clean(b*10)} = ${Math.round(a*10*b*10)}. Divide by 100: ${clean(answer)}.`;
 }else{b=pick([.2,.4,.5,.8,1.25,2.5]);answer=int(1,level===6?199:49)/10;a=clean(b*answer);explanation=`Use multiplication: ${b} × ${answer} = ${a}, so ${a} ÷ ${b} = ${answer}.`;}
 return q(`${clean(a)} ${op} ${clean(b)}`,answer,explanation,{hint:'Enter a decimal or an equivalent fraction. Use a decimal point, e.g. 2.5.'});
}
function timeQuestion(level){
 if(level===1){const hours=int(1,5);return q(`${hours} ${hours===1?'hour':'hours'} = ? minutes`,hours*60,`There are 60 minutes in an hour: ${hours} × 60 = ${hours*60}.`,{hint:'Enter the number of minutes.'});}
 if(level===2){const h=int(1,6),m=pick([15,30,45]);return q(`${h} h ${m} min = ? minutes`,h*60+m,`${h} × 60 + ${m} = ${h*60+m} minutes.`,{hint:'Enter the number of minutes.'});}
 if(level===3){const start=int(7,18)*60+pick([0,15,30,45]),elapsed=pick([30,45,60,75,90,105]);return q(`Minutes from ${clock(start)} to ${clock(start+elapsed)}?`,elapsed,`${clock(start)} to ${clock(start+elapsed)} is ${Math.floor(elapsed/60)} h ${elapsed%60} min = ${elapsed} minutes.`,{hint:'Enter the number of minutes. Times are on the same day.'});}
 if(level===4||level===5&&Math.random()<.5){const start=int(19,23)*60+int(0,59),elapsed=int(65,300);return q(`${clock(start)} + ${elapsed} minutes = ?`,(start+elapsed)%1440,`Add ${Math.floor(elapsed/60)} h ${elapsed%60} min to ${clock(start)}. The time is ${clock(start+elapsed)}${start+elapsed>=1440?' the next day':''}.`,{format:'clock',answerText:clock(start+elapsed),hint:'Enter a 24-hour time as HH:MM. Times may cross midnight.'});}
 if(level===5){const h=int(1,4),m=int(1,59);return q(`${h} h ${m} min = ? seconds`,(h*60+m)*60,`Convert to minutes: ${h} × 60 + ${m} = ${h*60+m}. Multiply by 60: ${(h*60+m)*60} seconds.`,{hint:'Enter the number of seconds.'});}
 const start=int(0,1439),elapsed=int(125,900);return q(`Minutes from ${clock(start)} to ${clock(start+elapsed)} (next occurrence)?`,elapsed,`${Math.floor(elapsed/60)} hours and ${elapsed%60} minutes separate the times. ${Math.floor(elapsed/60)} × 60 + ${elapsed%60} = ${elapsed} minutes.`,{hint:'Enter the number of minutes until the next occurrence of the end time.'});
}
function powers(level){const root=level>=2&&Math.random()<.5,cube=level>=5&&Math.random()<.5;const base=int(1,cube?(level===6?12:6):[5,10,12,20,25,40][level-1]),power=cube?3:2,value=base**power;return root?q(`${cube?'∛':'√'}${value}`,base,`${base}${cube?'³':'²'} = ${value}, so the ${cube?'cube':'square'} root is ${base}.`):q(`${base}${cube?'³':'²'}`,value,`${Array(power).fill(base).join(' × ')} = ${value}.`);}
export function question(level,selected){if(!Number.isInteger(level)||level<1||level>6||!selected.length||selected.some(x=>!topics[x]))throw Error('Invalid question settings');const op=pick(selected),result=['add','sub','mul','div'].includes(op)?arithmetic(level,op):op==='fractions'?fractions(level):op==='percent'?percentages(level):op==='decimals'?decimals(level):op==='time'?timeQuestion(level):powers(level);return {...result,op};}
export function parseAnswer(raw,format='number'){
 const s=raw.trim().replaceAll('−','-');
 if(format==='clock'){const m=s.match(/^(\d{1,2}):(\d{2})$/);if(!m||+m[1]>23||+m[2]>59)return null;return +m[1]*60+(+m[2]);}
 let m=s.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);if(m){if(+m[3]===0||+m[2]>=+m[3])return null;const sign=m[1].startsWith('-')?-1:1;return sign*(Math.abs(+m[1])+(+m[2])/(+m[3]));}
 m=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);if(m){if(+m[2]===0)return null;const n=+m[1]/+m[2];return Number.isFinite(n)?n:null;}
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;
}
export function isCorrect(raw,q){const n=parseAnswer(raw,q.format);return n!==null&&Math.abs(n-q.answer)<=1e-8;}
export function adapt(level,recent){if(recent.length<4)return level;const last=recent.slice(-4);if(last.every(x=>x.correct)&&last.reduce((s,x)=>s+x.seconds,0)/4<5)return Math.min(6,level+1);if(last.filter(x=>!x.correct).length>=2)return Math.max(1,level-1);return level;}
export function settingsKey(s){return `v2:${s.duration}:${[...s.ops].sort().join(',')}:${s.startLevel}:${s.adaptive?'adaptive':'fixed'}`;}
