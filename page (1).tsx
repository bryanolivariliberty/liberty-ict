'use client'
import { useState } from 'react'
import Image from 'next/image'
import { supabase, type Lead } from '@/lib/supabase'

const C = {
  blue:'#1A6FBF',blueDark:'#145A9E',blueLight:'#E8F2FB',
  orange:'#F05A22',orangeLight:'#FEF0EB',
  gray:'#F5F6F8',text:'#1A2B3C',muted:'#6B7A8D',border:'#DDE2EA',success:'#16A34A',
}

const SECTIONS = [
  { stage:'negocio', title:'Cuéntanos sobre tu negocio', sub:'Nos ayuda a entender mejor tu contexto.', questions:[
    {id:'rol',type:'radio',label:'¿Cuál es tu rol en la empresa?',req:true,opts:['Dueño / Presidente','Director / Gerencia','IT / Tecnología','Operaciones','Otro']},
    {id:'size_empresa',type:'radio',label:'Tamaño de la empresa',req:true,opts:['SoHo / PyMES 1–24 empleados','SMB 25–100 empleados','Large Enterprise +100 empleados']},
    {id:'sector',type:'radio',label:'Sector de tu empresa',req:false,opts:['Retail / Comercio','Salud','Educación','Finanzas','Manufactura','Servicios profesionales','Otro']},
  ]},
  { stage:'conectividad', title:'Conectividad e internet', sub:'Entendemos cuán crítica es tu conexión.', questions:[
    {id:'criticidad_internet',type:'scale',label:'¿Qué tan crítico es el internet para tu operación?',hint:'1 = Poco crítico · 5 = Totalmente crítico',req:true},
    {id:'respaldo_conexion',type:'radio',label:'¿Tienes un servicio de respaldo si falla tu conexión principal?',req:true,opts:['Sí, tengo respaldo activo','Sí, pero no está configurado','No tengo respaldo','No estoy seguro(a)']},
    {id:'problemas_conectividad',type:'checkbox',label:'¿Qué problemas de conectividad has experimentado?',req:false,opts:['Lentitud frecuente','Caídas de servicio','Alta latencia en videollamadas','Problemas de cobertura','Ninguno']},
  ]},
  { stage:'ciberseguridad', title:'Seguridad de tu negocio', sub:'Evaluamos qué tan protegida está tu empresa.', questions:[
    {id:'cyber_medidas',type:'checkbox',label:'¿Qué medidas de ciberseguridad tienes implementadas?',req:true,opts:['Autenticación Multifactor (MFA)','Capacitación de empleados','Copias de seguridad inmutables','Zero Trust / Confianza Cero','Planes de respuesta a incidentes','Ninguna de las anteriores']},
    {id:'cyber_nivel',type:'scale',label:'¿Qué tan protegido crees que está tu negocio ante ciberataques?',hint:'1 = Muy vulnerable · 5 = Muy protegido',req:true},
    {id:'cyber_incidente',type:'radio',label:'¿Has sufrido algún incidente de ciberseguridad en los últimos 2 años?',req:false,opts:['Sí','No','No lo sé']},
  ]},
  { stage:'crecimiento', title:'Tecnología y crecimiento', sub:'Cómo la tecnología apoya (o limita) tu expansión.', questions:[
    {id:'capacidad_crecer',type:'radio',label:'¿Tu tecnología actual te permite crecer sin limitaciones?',req:true,opts:['Sí, completamente','Parcialmente','No, es un obstáculo','No estoy seguro(a)']},
    {id:'reto_tecnologico',type:'textarea',label:'¿Cuál es tu mayor reto tecnológico hoy?',req:true,placeholder:'Ej: lentitud en el sistema, falta de movilidad, costos elevados...'},
    {id:'desea_contacto',type:'radio',label:'¿Deseas que te contactemos para una recomendación personalizada?',req:true,opts:['Sí, me interesa','No por ahora']},
  ]},
]
const STAGE_LABELS = ['Tu negocio','Conectividad','Ciberseguridad','Crecimiento','Resultados']
type Answers = Record<string, string|number|string[]>

function calcScores(ans: Answers) {
  const internet = Math.round(((ans.criticidad_internet as number)||0)/5*100)
  const cyber = (()=>{ const m=(ans.cyber_medidas as string[])||[]; if(m.includes('Ninguna de las anteriores')) return Math.round(((ans.cyber_nivel as number)||0)/5*30); return Math.round(Math.min(m.length,5)/5*60+((ans.cyber_nivel as number)||0)/5*40) })()
  const crece = ({'Sí, completamente':100,'Parcialmente':55,'No, es un obstáculo':20,'No estoy seguro(a)':40} as Record<string,number>)[ans.capacidad_crecer as string]||0
  const respaldo = ({'Sí, tengo respaldo activo':100,'Sí, pero no está configurado':50,'No tengo respaldo':0,'No estoy seguro(a)':30} as Record<string,number>)[ans.respaldo_conexion as string]||0
  return {internet,cyber,crece,respaldo,general:Math.round((internet+cyber+crece+respaldo)/4)}
}

function ScoreBar({label,value}:{label:string;value:number}) {
  const color = value>=70?'#16A34A':value>=40?C.orange:'#DC2626'
  return <div style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:13,color:C.muted}}>{label}</span><span style={{fontSize:13,fontWeight:700,color}}>{value}</span></div><div style={{height:7,background:'#E5E9EE',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',borderRadius:4,background:color,width:`${value}%`,transition:'width .7s ease'}}/></div></div>
}
function ScoreTag({value}:{value:number}) {
  const s=value>=70?{bg:'#DCFCE7',color:'#15803D',label:'Óptimo'}:value>=40?{bg:C.orangeLight,color:'#C2410C',label:'Mejorable'}:{bg:'#FEE2E2',color:'#B91C1C',label:'Atención'}
  return <span style={{background:s.bg,color:s.color,fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20}}>{s.label}</span>
}
function Field({label,req,type='text',value,onChange,placeholder}:{label:string;req?:boolean;type?:string;value:string;onChange:(v:string)=>void;placeholder:string}) {
  return <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted,display:'block',marginBottom:5}}>{label}{req&&<span style={{color:C.orange}}> *</span>}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:'100%',background:C.gray,border:'1.5px solid #DDE2EA',borderRadius:10,padding:'13px 14px',fontSize:15,color:C.text,fontFamily:'inherit',boxSizing:'border-box',outline:'none'}}/></div>
}
function Header() {
  return <header style={{background:'white',borderBottom:'1px solid #E5E9EE',position:'sticky',top:0,zIndex:10}}><div style={{maxWidth:620,margin:'0 auto',padding:'0 1rem',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}><Image src="/logo-liberty.png" alt="Liberty Business" width={120} height={34} style={{objectFit:'contain'}} priority/><span style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase'}}>Assessment ICT</span></div></header>
}
function Footer() {
  return <footer style={{background:'white',borderTop:'1px solid #E5E9EE',padding:'1rem',textAlign:'center'}}><p style={{fontSize:11,color:'#A0AABA'}}>© 2026 Liberty Puerto Rico · Tu información está segura y protegida.</p></footer>
}

export default function Home() {
  const [cur,setCur]=useState(0)
  const [ans,setAns]=useState<Answers>({})
  const [lead,setLead]=useState({nombre:'',apellido:'',empresa:'',email:'',telefono:''})
  const [submitted,setSubmitted]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const done=cur>=SECTIONS.length
  const sec=SECTIONS[cur]
  const sc=calcScores(ans)
  const pct=Math.round((cur/SECTIONS.length)*100)
  const leadValid=!!(lead.nombre&&lead.apellido&&lead.email.includes('@'))

  function sectionValid() {
    if(!sec) return true
    return sec.questions.every(q=>{
      if(!q.req) return true
      const a=ans[q.id]
      if(q.type==='textarea') return typeof a==='string'&&a.trim().length>0
      if(q.type==='checkbox') return Array.isArray(a)&&a.length>0
      return a!==undefined&&a!==null&&a!==''
    })
  }
  function toggleCheck(id:string,val:string){setAns(p=>{const c=(p[id] as string[])||[];return{...p,[id]:c.includes(val)?c.filter(x=>x!==val):[...c,val]}})}

  async function handleSubmit(){
    if(!leadValid) return
    setLoading(true);setError('')
    const payload:Lead={...lead,rol:(ans.rol as string)||'',size_empresa:(ans.size_empresa as string)||'',sector:(ans.sector as string)||'',criticidad_internet:(ans.criticidad_internet as number)||0,respaldo_conexion:(ans.respaldo_conexion as string)||'',problemas_conectividad:(ans.problemas_conectividad as string[])||[],cyber_medidas:(ans.cyber_medidas as string[])||[],cyber_nivel:(ans.cyber_nivel as number)||0,cyber_incidente:(ans.cyber_incidente as string)||'',capacidad_crecer:(ans.capacidad_crecer as string)||'',reto_tecnologico:(ans.reto_tecnologico as string)||'',desea_contacto:(ans.desea_contacto as string)||'',score_internet:sc.internet,score_cyber:sc.cyber,score_crece:sc.crece,score_respaldo:sc.respaldo,score_general:sc.general}
    const{error:err}=await supabase.from('leads').insert([payload])
    if(err){setError('Error al guardar: '+err.message);setLoading(false);return}
    setSubmitted(true);setLoading(false)
  }

  if(submitted) return(
    <div style={{minHeight:'100vh',background:C.gray,display:'flex',flexDirection:'column'}}>
      <Header/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 1rem'}}>
        <div style={{background:'white',borderRadius:20,padding:'2.5rem 1.5rem',maxWidth:480,width:'100%',textAlign:'center',boxShadow:'0 4px 24px rgba(26,111,191,0.08)'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:C.blueLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.25rem',fontSize:32}}>✅</div>
          <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:8}}>¡Gracias, {lead.nombre}!</h2>
          <p style={{fontSize:14,color:C.muted,marginBottom:'1.5rem',lineHeight:1.6}}>Hemos recibido tu assessment. Un especialista de Liberty Business se pondrá en contacto contigo pronto.</p>
          <div style={{background:C.gray,borderRadius:12,padding:'1rem',textAlign:'left',fontSize:13,color:C.muted,marginBottom:'1.5rem'}}>
            <p style={{fontWeight:600,color:C.text,marginBottom:4}}>Datos registrados</p>
            <p>{lead.nombre} {lead.apellido}{lead.empresa?` · ${lead.empresa}`:''}</p>
            <p>{lead.email}{lead.telefono?` · ${lead.telefono}`:''}</p>
            <p style={{marginTop:8}}>Puntaje: <strong style={{color:C.blue}}>{sc.general}/100</strong></p>
          </div>
          <button onClick={()=>{setCur(0);setAns({});setLead({nombre:'',apellido:'',empresa:'',email:'',telefono:''});setSubmitted(false)}} style={{fontSize:13,color:C.blue,background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>Hacer otro assessment</button>
        </div>
      </div>
      <Footer/>
    </div>
  )

  return(
    <div style={{minHeight:'100vh',background:C.gray,display:'flex',flexDirection:'column'}}>
      <Header/>
      <div style={{flex:1,maxWidth:620,margin:'0 auto',width:'100%',padding:'1.5rem 1rem 5rem'}}>

        {/* Pills */}
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:'1rem',scrollbarWidth:'none'}}>
          {STAGE_LABELS.map((s,i)=>{
            const isR=i===4,active=isR?done:i===cur,isDone=!isR&&i<cur
            return <span key={s} style={{fontSize:12,padding:'6px 14px',borderRadius:20,fontWeight:active?700:400,background:active?C.blue:isDone?C.blueLight:'white',color:active?'white':isDone?C.blue:'#C4CBD6',border:`1.5px solid ${active?C.blue:isDone?C.blueLight:'#E5E9EE'}`,whiteSpace:'nowrap',flexShrink:0}}>{isDone?`✓ ${s}`:s}</span>
          })}
        </div>

        {/* Progress */}
        <div style={{height:4,background:'#DDE2EA',borderRadius:4,marginBottom:'1.5rem'}}>
          <div style={{height:4,background:`linear-gradient(90deg,${C.blue},${C.orange})`,borderRadius:4,width:`${done?100:pct}%`,transition:'width .5s ease'}}/>
        </div>

        {/* Section */}
        {!done&&(
          <div style={{background:'white',borderRadius:20,padding:'1.5rem',boxShadow:'0 2px 16px rgba(26,111,191,0.07)'}}>
            <h1 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4}}>{sec.title}</h1>
            <p style={{fontSize:13,color:C.muted,marginBottom:'1.5rem'}}>{sec.sub}</p>
            {sec.questions.map(q=>(
              <div key={q.id} style={{marginBottom:'1.5rem'}}>
                <p style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.4}}>{q.label}{q.req&&<span style={{color:C.orange,marginLeft:4,fontSize:12}}>*</span>}</p>
                {('hint' in q)&&q.hint&&<p style={{fontSize:12,color:C.muted,marginBottom:8}}>{q.hint as string}</p>}
                {q.type==='radio'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>{q.opts!.map(o=>{const sel=ans[q.id]===o;return<button key={o} onClick={()=>setAns(p=>({...p,[q.id]:o}))} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:12,border:sel?`2px solid ${C.blue}`:'1.5px solid #DDE2EA',background:sel?C.blueLight:'white',cursor:'pointer',fontSize:14,color:sel?C.blueDark:C.text,fontWeight:sel?600:400,textAlign:'left',width:'100%'}}><span style={{width:20,height:20,borderRadius:'50%',border:sel?`6px solid ${C.blue}`:'2px solid #C4CBD6',background:'white',flexShrink:0}}/>{o}</button>})}</div>}
                {q.type==='checkbox'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>{q.opts!.map(o=>{const sel=((ans[q.id] as string[])||[]).includes(o);return<button key={o} onClick={()=>toggleCheck(q.id,o)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:12,border:sel?`2px solid ${C.blue}`:'1.5px solid #DDE2EA',background:sel?C.blueLight:'white',cursor:'pointer',fontSize:14,color:sel?C.blueDark:C.text,fontWeight:sel?600:400,textAlign:'left',width:'100%'}}><span style={{width:20,height:20,borderRadius:6,border:sel?`2px solid ${C.blue}`:'2px solid #C4CBD6',background:sel?C.blue:'white',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'white',fontWeight:700}}>{sel?'✓':''}</span>{o}</button>})}</div>}
                {q.type==='scale'&&<div><div style={{display:'flex',gap:8}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setAns(p=>({...p,[q.id]:n}))} style={{flex:1,height:52,borderRadius:12,fontSize:16,fontWeight:700,cursor:'pointer',border:ans[q.id]===n?`2px solid ${C.blue}`:'1.5px solid #DDE2EA',background:ans[q.id]===n?C.blue:'white',color:ans[q.id]===n?'white':C.muted}}>{n}</button>)}</div><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#A0AABA',marginTop:6}}><span>{('hint' in q&&q.hint)?(q.hint as string).split('·')[0].replace(/\d\s*=\s*/,'').trim():''}</span><span>{('hint' in q&&q.hint)?(q.hint as string).split('·')[1]?.replace(/\d\s*=\s*/,'').trim():''}</span></div></div>}
                {q.type==='textarea'&&<textarea value={(ans[q.id] as string)||''} onChange={e=>setAns(p=>({...p,[q.id]:e.target.value}))} placeholder={(q as {placeholder?:string}).placeholder} rows={4} style={{width:'100%',background:C.gray,border:'1.5px solid #DDE2EA',borderRadius:12,padding:'13px 14px',fontSize:14,color:C.text,fontFamily:'inherit',resize:'none',boxSizing:'border-box',outline:'none'}}/>}
              </div>
            ))}
            <div style={{paddingTop:'1.25rem',borderTop:'1px solid #F0F2F5'}}>
              <button onClick={()=>setCur(c=>c+1)} disabled={!sectionValid()} style={{width:'100%',padding:'15px',fontSize:15,fontWeight:700,borderRadius:12,border:'none',background:sectionValid()?C.blue:'#C4CBD6',color:'white',cursor:sectionValid()?'pointer':'not-allowed',marginBottom:10}}>Siguiente →</button>
              {cur>0&&<button onClick={()=>setCur(c=>c-1)} style={{width:'100%',padding:'13px',fontSize:14,border:'1.5px solid #DDE2EA',borderRadius:12,background:'white',color:C.muted,cursor:'pointer'}}>← Anterior</button>}
              <p style={{textAlign:'center',fontSize:12,color:'#A0AABA',marginTop:10}}>Sección {cur+1} de {SECTIONS.length}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {done&&(
          <div>
            <div style={{background:'white',borderRadius:20,padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 16px rgba(26,111,191,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:'1.5rem'}}>
                <div style={{width:52,height:52,borderRadius:14,background:C.blueLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>📊</div>
                <div><h2 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>Tu diagnóstico ICT</h2><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:24,fontWeight:800,color:C.blue}}>{sc.general}<span style={{fontSize:13,fontWeight:400,color:C.muted}}>/100</span></span><ScoreTag value={sc.general}/></div></div>
              </div>
              <ScoreBar label="Criticidad internet" value={sc.internet}/>
              <ScoreBar label="Ciberseguridad" value={sc.cyber}/>
              <ScoreBar label="Crecimiento" value={sc.crece}/>
              <ScoreBar label="Resiliencia" value={sc.respaldo}/>
              <div style={{marginTop:'1rem',background:C.blueLight,borderRadius:12,padding:'12px 14px',fontSize:13,color:C.blueDark,lineHeight:1.6,borderLeft:`4px solid ${C.blue}`}}>💡 {sc.general>=70?'Tu empresa tiene una base tecnológica sólida. Explora soluciones avanzadas de Liberty Business.':sc.general>=40?'Existen áreas de mejora. Un especialista de Liberty Business puede ayudarte.':'Tu negocio necesita atención urgente. Liberty Business tiene soluciones para ti.'}</div>
            </div>
            <div style={{background:'white',borderRadius:20,padding:'1.5rem',boxShadow:'0 2px 16px rgba(26,111,191,0.07)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.25rem'}}>
                <div style={{width:44,height:44,borderRadius:12,background:C.orangeLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>✉️</div>
                <div><h2 style={{fontSize:16,fontWeight:700,color:C.text}}>Déjanos tus datos</h2><p style={{fontSize:12,color:C.muted}}>Recibirás una propuesta personalizada.</p></div>
              </div>
              <Field label="Nombre" req value={lead.nombre} onChange={v=>setLead(p=>({...p,nombre:v}))} placeholder="Tu nombre"/>
              <Field label="Apellido" req value={lead.apellido} onChange={v=>setLead(p=>({...p,apellido:v}))} placeholder="Tu apellido"/>
              <Field label="Empresa" value={lead.empresa} onChange={v=>setLead(p=>({...p,empresa:v}))} placeholder="Nombre de tu empresa"/>
              <Field label="Email" req type="email" value={lead.email} onChange={v=>setLead(p=>({...p,email:v}))} placeholder="correo@empresa.com"/>
              <Field label="Teléfono" value={lead.telefono} onChange={v=>setLead(p=>({...p,telefono:v}))} placeholder="+1 (787) 000-0000"/>
              {error&&<p style={{fontSize:13,color:'#DC2626',marginBottom:12}}>{error}</p>}
              <button onClick={handleSubmit} disabled={!leadValid||loading} style={{width:'100%',padding:'16px',fontSize:15,fontWeight:700,borderRadius:12,border:'none',background:leadValid&&!loading?C.blue:'#C4CBD6',color:'white',cursor:leadValid&&!loading?'pointer':'not-allowed',marginTop:4}}>
                {loading?'Guardando...':'✉ Enviar y recibir recomendación'}
              </button>
              <button onClick={()=>setCur(0)} style={{width:'100%',marginTop:10,padding:'12px',fontSize:13,color:C.muted,background:'none',border:'none',cursor:'pointer'}}>← Reiniciar assessment</button>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  )
}

