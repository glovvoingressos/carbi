#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT=process.cwd()
const IN=path.join(ROOT,'scratch','local-nearest-year-remaining.json')
const OUT=path.join(ROOT,'scratch','wikimedia-retry-report.json')
const unresolved=JSON.parse(fs.readFileSync(IN,'utf8'))

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()

function score(car,c){
  const combo=norm((c.title||'')+' '+(c.description||''))
  const mt=norm(car.model).split(' ').filter(Boolean)
  const bt=norm(car.brand).split(' ').filter(Boolean)
  let s=0
  s += mt.filter(t=>combo.includes(t)).length*4
  s += bt.filter(t=>combo.includes(t)).length*2
  const ym=((c.title||'')+' '+(c.description||'')).match(/\b(20\d{2}|19\d{2})\b/)
  if(ym) s += Math.max(0, 8-Math.abs(car.year-Number(ym[1])))
  return s
}

async function search(car){
  const queries=[`${car.brand} ${car.model} ${car.year}`,`${car.brand} ${car.model}`,`${car.model}`]
  const cand=[]
  for(const q of queries){
    const u=new URL('https://commons.wikimedia.org/w/api.php')
    u.searchParams.set('action','query')
    u.searchParams.set('format','json')
    u.searchParams.set('generator','search')
    u.searchParams.set('gsrsearch',q)
    u.searchParams.set('gsrnamespace','6')
    u.searchParams.set('gsrlimit','20')
    u.searchParams.set('prop','imageinfo')
    u.searchParams.set('iiprop','url|extmetadata')
    u.searchParams.set('iiurlwidth','1280')
    const r=await fetch(u,{headers:{'User-Agent':'carbi/1.0'}})
    if(!r.ok) continue
    const j=await r.json()
    for(const p of Object.values(j?.query?.pages||{})){
      const i=p.imageinfo?.[0]; if(!i) continue
      const url=i.thumburl||i.url; if(!url) continue
      if(!/\.(jpg|jpeg|png|webp)$/i.test(url)) continue
      const d=i.extmetadata?.ImageDescription?.value||i.extmetadata?.ObjectName?.value||''
      cand.push({title:p.title||'',description:d,url})
    }
    await sleep(250)
  }
  if(!cand.length) return null
  const best=cand.map(c=>({c,s:score(car,c)})).sort((a,b)=>b.s-a.s)[0]
  return best.s>=3?best.c:null
}

async function download(url,file){
  for(let i=0;i<3;i++){
    const r=await fetch(url,{headers:{'User-Agent':'carbi/1.0'}})
    if(r.ok){fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()));return true}
    if(r.status!==429) return false
    await sleep(1500*(i+1))
  }
  return false
}

const out={synced:[],unresolved:[]}
for(const item of unresolved){
  const car={id:item.id,brand:item.brand,model:item.model,year:item.year,image:`/assets/cars/${item.id}.png`}
  try{
    const c=await search(car)
    if(!c){out.unresolved.push({...item,reason:'no-candidate'});continue}
    const tmp=path.join(ROOT,'scratch',`${car.id}.tmp`)
    const png=path.join(ROOT,'scratch',`${car.id}.png`)
    const ok=await download(c.url,tmp)
    if(!ok){out.unresolved.push({...item,reason:'download-failed'});continue}
    execFileSync('/usr/bin/sips',['-s','format','png',tmp,'--out',png],{stdio:'ignore'})
    fs.copyFileSync(png,path.join(ROOT,'public',car.image))
    fs.rmSync(tmp,{force:true});fs.rmSync(png,{force:true})
    out.synced.push({id:car.id,source:c.url,title:c.title})
    console.log('SYNCED',car.id)
    await sleep(700)
  }catch(e){out.unresolved.push({...item,reason:e.message||'error'})}
}
fs.writeFileSync(OUT,JSON.stringify(out,null,2),'utf8')
console.log('done',out.synced.length,out.unresolved.length)
