#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT=process.cwd()
const list=JSON.parse(
  fs.readFileSync(path.join(ROOT,'scratch','wikimedia-retry-report.json'),'utf8')
).unresolved
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()

function score(car,c){
  const t=norm((c.title||'')+' '+(c.description||''))
  const mt=norm(car.model).split(' ').filter(Boolean)
  const bt=norm(car.brand).split(' ').filter(Boolean)
  let s=0
  s+=mt.filter(x=>t.includes(x)).length*4
  s+=bt.filter(x=>t.includes(x)).length*2
  const ym=((c.title||'')+' '+(c.description||'')).match(/\b(19\d{2}|20\d{2})\b/)
  if(ym) s+=Math.max(0,8-Math.abs(car.year-Number(ym[1])))
  return s
}
async function search(car){
  const queries=[`${car.brand} ${car.model} ${car.year}`,`${car.brand} ${car.model}`,`${car.model} ${car.brand}`]
  const cand=[]
  for(const q of queries){
    const u=new URL('https://commons.wikimedia.org/w/api.php')
    u.searchParams.set('action','query');u.searchParams.set('format','json');u.searchParams.set('generator','search');u.searchParams.set('gsrsearch',q);u.searchParams.set('gsrnamespace','6');u.searchParams.set('gsrlimit','20');u.searchParams.set('prop','imageinfo');u.searchParams.set('iiprop','url|extmetadata');u.searchParams.set('iiurlwidth','1024')
    const r=await fetch(u,{headers:{'User-Agent':'carbi/1.0'}})
    if(r.ok){const j=await r.json();for(const p of Object.values(j?.query?.pages||{})){const i=p.imageinfo?.[0];if(!i?.url)continue;const d=i.extmetadata?.ImageDescription?.value||i.extmetadata?.ObjectName?.value||'';cand.push({title:p.title||'',description:d,url:i.thumburl||i.url})}}
    await sleep(1200)
  }
  if(!cand.length) return null
  const best=cand.map(c=>({c,s:score(car,c)})).sort((a,b)=>b.s-a.s)[0]
  return best.s>=3?best.c:null
}
async function download(url,tmp){
  for(let i=0;i<5;i++){
    const r=await fetch(url,{headers:{'User-Agent':'carbi/1.0'}})
    if(r.ok){fs.writeFileSync(tmp,Buffer.from(await r.arrayBuffer()));return true}
    await sleep(3000*(i+1))
  }
  return false
}
const out={synced:[],unresolved:[]}
for(const item of list){
  const car={id:item.id,brand:item.brand,model:item.model,year:item.year}
  try{
    const c=await search(car)
    if(!c){out.unresolved.push({...item,reason:'no-candidate'});continue}
    const tmp=path.join(ROOT,'scratch',`${car.id}.tmp`); const png=path.join(ROOT,'scratch',`${car.id}.png`)
    const ok=await download(c.url,tmp)
    if(!ok){out.unresolved.push({...item,reason:'download-failed'});continue}
    execFileSync('/usr/bin/sips',['-s','format','png',tmp,'--out',png],{stdio:'ignore'})
    fs.copyFileSync(png,path.join(ROOT,'public/assets/cars',`${car.id}.png`))
    fs.rmSync(tmp,{force:true});fs.rmSync(png,{force:true})
    out.synced.push({id:car.id,source:c.url,title:c.title})
    console.log('SYNCED',car.id)
    await sleep(2000)
  }catch(e){out.unresolved.push({...item,reason:e.message||'error'})}
}
fs.writeFileSync(path.join(ROOT,'scratch','wikimedia-retry-10-slow-report.json'),JSON.stringify(out,null,2),'utf8')
console.log('done',out.synced.length,out.unresolved.length)
