const {app,BrowserWindow}=require('electron');
const path=require('path');
const fs=require('fs');
const DATA_FILE=()=>path.join(app.getPath('userData'),'kaoqin-data.json');
function readData(){try{const d=JSON.parse(fs.readFileSync(DATA_FILE(),'utf8'));return {people:Array.isArray(d.people)?d.people:[],notes:d.notes&&typeof d.notes==='object'?d.notes:{},manual:d.manual&&typeof d.manual==='object'?d.manual:{}}}catch(e){return {people:[],notes:{},manual:{}}}}
function writeData(d){fs.mkdirSync(path.dirname(DATA_FILE()),{recursive:true});fs.writeFileSync(DATA_FILE(),JSON.stringify(d,null,2),'utf8')}
function weekdayOf(y,m,d){return ((new Date(y,m-1,d).getDay()+6)%7)+1}
function fillDay(data,p,y,m,day){if(!p||!p.id)return;const date=y+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0'),k='multi_note_'+p.id+'_'+date;if(data.notes[k]!==undefined&&data.notes[k]!==null&&String(data.notes[k]).trim()!=='')return;if(data.manual[k]||data.manual['manual_'+k])return;let rest=[];try{rest=Array.isArray(p.restWeekdays)?p.restWeekdays.map(Number):JSON.parse(p.restWeekdays||'[]').map(Number)}catch(e){}data.notes[k]=rest.includes(weekdayOf(y,m,day))?'休息':'正常';data.manual[k]=false}
function fillCurrentMonthThroughToday(){const data=readData(),n=new Date(),y=n.getFullYear(),m=n.getMonth()+1;for(const p of data.people)for(let d=1;d<=n.getDate();d++)fillDay(data,p,y,m,d);writeData(data)}
function fillToday(){const data=readData(),n=new Date();for(const p of data.people)fillDay(data,p,n.getFullYear(),n.getMonth()+1,n.getDate());writeData(data)}
let win=null,timer=null;
function schedule(){if(timer)clearTimeout(timer);const now=new Date(),next=new Date(now);next.setHours(1,0,0,0);if(next<=now)next.setDate(next.getDate()+1);timer=setTimeout(()=>{fillToday();if(win)win.webContents.send('attendance-updated');schedule()},Math.max(1000,next-now))}
function createWindow(){win=new BrowserWindow({width:430,height:900,minWidth:360,minHeight:700,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.loadFile(path.join(__dirname,'index.html'));win.on('closed',()=>{win=null})}
app.whenReady().then(()=>{fillCurrentMonthThroughToday();createWindow();schedule()});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(!win)createWindow()});
