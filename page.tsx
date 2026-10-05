'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase, type Lead } from '@/lib/supabase'

const LB_BLUE = '#1A6FBF'
const LB_ORANGE = '#F05A22'
const LB_GRAY = '#F5F6F8'
const LB_TEXT = '#1A2B3C'
const LB_MUTED = '#6B7A8D'
const LB_BLUE_LIGHT = '#E8F2FB'
const LB_ORANGE_LIGHT = '#FEF0EB'

function ScorePill({value}:{value:number}) {
  const s=value>=70?{bg:'#DCFCE7',color:'#15803D'}:value>=40?{bg:LB_ORANGE_LIGHT,color:'#C2410C'}:{bg:'#FEE2E2',color:'#B91C1C'}
  return <span style={{background:s.bg,color:s.color,fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20}}>{value}/100</span>
}

function MiniBar({value,label}:{value:number;label:string}) {
  const color=value>=70?'#16A34A':value>=40?LB_ORANGE:'#DC2626'
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:11,color:LB_MUTED}}>{label}</span><span style={{fontSize:11,fontWeight:700,color}}>{value}</span></div>
      <div style={{height:4,background:'#E5E9EE',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:color,width:`${value}%`}}/></div>
    </div>
  )
}

export default function AdminPage() {
  const [leads,setLeads]=useState<Lead[]>([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState<Lead|null>(null)
  const [search,setSearch]=useState('')
  const [sortBy,setSortBy]=useState<'created_at'|'score_general'>('created_at')
  const [view,setView]=useState<'table'|'cards'>('cards')

  useEffect(()=>{
    supabase.from('leads').select('*').order(sortBy,{ascending:false})
      .then(({data})=>{if(data) setLeads(data);setLoading(false)})
  },[sortBy])

  const filtered=leads.filter(l=>`${l.nombre} ${l.apellido} ${l.empresa} ${l.email}`.toLowerCase().includes(search.toLowerCase()))
  const avg=(f:keyof Lead)=>leads.length?Math.round(leads.reduce((s,l)=>s+((l[f] as number)||0),0)/leads.length):0

  function exportCSV(){
    const h=['Fecha','Nombre','Apellido','Empresa','Email','Teléfono','Rol','Score','Reto','Contacto']
    const rows=leads.map(l=>[l.created_at?.slice(0,10),l.nombre,l.apellido,l.empresa,l.email,l.telefono,l.rol,l.score_general,`"${(l.reto_tecnologico||'').replace(/"/g,"'")}"`,l.desea_contacto])
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([[h,...rows].map(r=>r.join(',')).join('\n')],{type:'text/csv'}))
    a.download=`leads-liberty-${new Date().toISOString().slice(0,10)}.csv`;a.click()
  }

  return(
    <div style={{minHeight:'100vh',background:LB_GRAY}}>
      {/* Header */}
      <header style={{background:'white',borderBottom:'1px solid #E5E9EE',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 1rem',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Image src="/logo-liberty.png" alt="Liberty Business" width={110} height={30} style={{objectFit:'contain'}} priority/>
          <span style={{fontSize:11,fontWeight:600,color:LB_MUTED,letterSpacing:'0.07em',textTransform:'uppercase'}}>Leads</span>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'1.5rem 1rem'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:'1.25rem'}}>
          {[{label:'Total leads',value:leads.length,color:LB_BLUE},{label:'Puntaje prom.',value:avg('score_general'),color:LB_BLUE},{label:'Quieren contacto',value:leads.filter(l=>l.desea_contacto==='Sí, me interesa').length,color:LB_ORANGE},{label:'Prom. cyber',value:avg('score_cyber'),color:LB_BLUE}].map(s=>(
            <div key={s.label} style={{background:'white',borderRadius:14,padding:'1rem',boxShadow:'0 2px 10px rgba(26,111,191,0.06)'}}>
              <p style={{fontSize:11,color:LB_MUTED,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</p>
              <p style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{marginBottom:'1rem',display:'flex',flexDirection:'column',gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nombre, empresa o email..."
            style={{width:'100%',background:'white',border:'1.5px solid #DDE2EA',borderRadius:10,padding:'12px 14px',fontSize:14,color:LB_TEXT,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:8}}>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'created_at'|'score_general')}
              style={{flex:1,background:'white',border:'1.5px solid #DDE2EA',borderRadius:10,padding:'10px 12px',fontSize:13,color:LB_TEXT,fontFamily:'inherit',outline:'none'}}>
              <option value="created_at">Más recientes</option>
              <option value="score_general">Mayor puntaje</option>
            </select>
            <button onClick={()=>setView(v=>v==='table'?'cards':'table')}
              style={{padding:'10px 14px',fontSize:12,fontWeight:600,border:`1.5px solid ${LB_BLUE}`,borderRadius:10,background:'white',color:LB_BLUE,cursor:'pointer',whiteSpace:'nowrap'}}>
              {view==='cards'?'📋 Tabla':'🃏 Cards'}
            </button>
            <button onClick={exportCSV}
              style={{padding:'10px 14px',fontSize:12,fontWeight:600,border:`1.5px solid ${LB_BLUE}`,borderRadius:10,background:'white',color:LB_BLUE,cursor:'pointer',whiteSpace:'nowrap'}}>
              ↓ CSV
            </button>
          </div>
        </div>

        {loading?(
          <div style={{background:'white',borderRadius:20,padding:'3rem',textAlign:'center',color:LB_MUTED}}>Cargando leads...</div>
        ):filtered.length===0?(
          <div style={{background:'white',borderRadius:20,padding:'3rem',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>📋</div>
            <p style={{color:LB_MUTED,fontSize:14}}>No hay leads aún. Comparte el assessment para empezar.</p>
          </div>
        ):view==='cards'?(
          /* Card view — great for mobile */
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,320px),1fr))',gap:12}}>
            {filtered.map(l=>(
              <div key={l.id} onClick={()=>setSelected(l)} style={{background:'white',borderRadius:16,padding:'1.25rem',boxShadow:'0 2px 10px rgba(26,111,191,0.06)',cursor:'pointer',border:'1.5px solid transparent',transition:'all .15s'}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=LB_BLUE)} onMouseLeave={e=>(e.currentTarget.style.borderColor='transparent')}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <p style={{fontWeight:700,color:LB_TEXT,fontSize:15,marginBottom:2}}>{l.nombre} {l.apellido}</p>
                    <p style={{fontSize:12,color:LB_MUTED}}>{l.empresa||l.email}</p>
                  </div>
                  <ScorePill value={l.score_general||0}/>
                </div>
                <div style={{marginBottom:10}}>
                  <MiniBar label="Internet" value={l.score_internet||0}/>
                  <MiniBar label="Cyber" value={l.score_cyber||0}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTop:'1px solid #F0F2F5'}}>
                  <span style={{fontSize:11,color:LB_MUTED}}>{l.created_at?.slice(0,10)}</span>
                  <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:l.desea_contacto==='Sí, me interesa'?LB_BLUE_LIGHT:'#F5F6F8',color:l.desea_contacto==='Sí, me interesa'?LB_BLUE:LB_MUTED}}>
                    {l.desea_contacto==='Sí, me interesa'?'✓ Contactar':'No por ahora'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ):(
          /* Table view — desktop */
          <div style={{background:'white',borderRadius:20,overflow:'auto',boxShadow:'0 2px 16px rgba(26,111,191,0.07)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
              <thead style={{background:LB_GRAY}}>
                <tr>{['Contacto','Empresa','Rol','Score','Internet','Cyber','¿Contactar?','Fecha',''].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,color:LB_MUTED,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid #F0F2F5'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(l=>(
                  <tr key={l.id} onClick={()=>setSelected(l)} style={{cursor:'pointer',borderBottom:'1px solid #F8F9FB'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='#FAFBFC')} onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                    <td style={{padding:'14px 16px'}}><p style={{fontWeight:600,color:LB_TEXT,marginBottom:2,fontSize:13}}>{l.nombre} {l.apellido}</p><p style={{fontSize:11,color:LB_MUTED}}>{l.email}</p></td>
                    <td style={{padding:'14px 16px',fontSize:13,color:LB_MUTED}}>{l.empresa||'—'}</td>
                    <td style={{padding:'14px 16px',fontSize:12,color:LB_MUTED}}>{l.rol}</td>
                    <td style={{padding:'14px 16px'}}><ScorePill value={l.score_general||0}/></td>
                    <td style={{padding:'14px 16px'}}><MiniBar label="" value={l.score_internet||0}/></td>
                    <td style={{padding:'14px 16px'}}><MiniBar label="" value={l.score_cyber||0}/></td>
                    <td style={{padding:'14px 16px'}}><span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:l.desea_contacto==='Sí, me interesa'?LB_BLUE_LIGHT:'#F5F6F8',color:l.desea_contacto==='Sí, me interesa'?LB_BLUE:LB_MUTED}}>{l.desea_contacto==='Sí, me interesa'?'✓ Sí':'No'}</span></td>
                    <td style={{padding:'14px 16px',fontSize:12,color:LB_MUTED}}>{l.created_at?.slice(0,10)}</td>
                    <td style={{padding:'14px 16px'}}><span style={{fontSize:12,color:LB_BLUE,fontWeight:600}}>Ver →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,43,60,0.5)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0'}} onClick={()=>setSelected(null)}>
          <div style={{background:'white',borderRadius:'20px 20px 0 0',padding:'1.5rem',width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            {/* Handle */}
            <div style={{width:40,height:4,background:'#DDE2EA',borderRadius:2,margin:'0 auto 1.25rem'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
              <div><h2 style={{fontSize:17,fontWeight:700,color:LB_TEXT}}>{selected.nombre} {selected.apellido}</h2><p style={{fontSize:13,color:LB_MUTED}}>{selected.email}{selected.telefono?` · ${selected.telefono}`:''}</p></div>
              <button onClick={()=>setSelected(null)} style={{fontSize:24,color:'#C4CBD6',background:'none',border:'none',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:'1.25rem'}}>
              {[['Empresa',selected.empresa||'—'],['Rol',selected.rol],['Tamaño',selected.size_empresa],['Sector',selected.sector||'—'],['Respaldo',selected.respaldo_conexion],['Incidente',selected.cyber_incidente||'—']].map(([k,v])=>(
                <div key={k} style={{background:LB_GRAY,borderRadius:10,padding:'10px 12px'}}><p style={{fontSize:11,color:LB_MUTED,fontWeight:600,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.05em'}}>{k}</p><p style={{fontSize:13,color:LB_TEXT}}>{v}</p></div>
              ))}
            </div>
            <div style={{marginBottom:'1.25rem'}}>
              <p style={{fontSize:11,fontWeight:600,color:LB_MUTED,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Puntajes</p>
              {[['Internet',selected.score_internet||0],['Ciberseguridad',selected.score_cyber||0],['Crecimiento',selected.score_crece||0],['Resiliencia',selected.score_respaldo||0]].map(([k,v])=>(
                <div key={k} style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <span style={{fontSize:13,color:LB_MUTED,width:100,flexShrink:0}}>{k}</span>
                  <div style={{flex:1,height:5,background:'#E5E9EE',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:LB_BLUE,borderRadius:3,width:`${v}%`}}/></div>
                  <span style={{fontSize:12,color:LB_MUTED,width:24,textAlign:'right'}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #F0F2F5',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:14,color:LB_TEXT,fontWeight:600}}>Puntaje general</span>
                <ScorePill value={selected.score_general||0}/>
              </div>
            </div>
            {selected.cyber_medidas?.length>0&&(
              <div style={{marginBottom:'1rem'}}>
                <p style={{fontSize:11,fontWeight:600,color:LB_MUTED,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Medidas de ciberseguridad</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{selected.cyber_medidas.map(m=><span key={m} style={{fontSize:12,background:LB_BLUE_LIGHT,color:'#145A9E',padding:'4px 10px',borderRadius:20,fontWeight:500}}>{m}</span>)}</div>
              </div>
            )}
            {selected.reto_tecnologico&&(
              <div style={{marginBottom:'1rem'}}>
                <p style={{fontSize:11,fontWeight:600,color:LB_MUTED,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Mayor reto tecnológico</p>
                <p style={{fontSize:13,color:LB_TEXT,background:LB_GRAY,borderRadius:10,padding:'10px 12px',lineHeight:1.6}}>{selected.reto_tecnologico}</p>
              </div>
            )}
            <div style={{paddingTop:12,borderTop:'1px solid #F0F2F5',display:'flex',justifyContent:'space-between',fontSize:12,color:LB_MUTED}}>
              <span>{selected.created_at?.slice(0,16).replace('T',' ')}</span>
              <span style={{color:selected.desea_contacto==='Sí, me interesa'?LB_BLUE:LB_MUTED,fontWeight:selected.desea_contacto==='Sí, me interesa'?700:400}}>{selected.desea_contacto}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
