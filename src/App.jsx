import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sprout, LayoutDashboard, Camera, Bell, Leaf, Droplets, Sun, Plus,
  Search, Menu, X, ChevronRight, CalendarDays, Clock3, ImagePlus,
  CheckCircle2, CircleUserRound, LogOut, Settings, ArrowUpRight,
  CloudSun, Flower2, Shovel, TrendingUp, Heart, Trash2, Download,
  ShieldCheck, Smartphone, Eye, Mail, Lock, Sparkles
} from 'lucide-react'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase, hasSupabase } from './lib/supabase'

const starterBeds = [
  { id:'b1', name:'Canteiro das ervas', type:'Ervas aromáticas', plants:'Manjericão, hortelã e alecrim', progress:78, water:'Hoje, 08:30', image:'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=85', status:'Saudável' },
  { id:'b2', name:'Horta de folhas', type:'Hortaliças', plants:'Alface, rúcula e couve', progress:56, water:'Ontem, 17:10', image:'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85', status:'Precisa de água' },
  { id:'b3', name:'Canteiro do sol', type:'Legumes', plants:'Tomate-cereja e pimentão', progress:91, water:'Hoje, 09:15', image:'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=900&q=85', status:'Saudável' }
]
const initialLogs = [
  { id:'l1', bed:'Canteiro das ervas', activity:'Rega da manhã', note:'Terra úmida e folhas viçosas.', date:new Date(Date.now()-1000*60*60*2).toISOString(), photo:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=500&q=80', author:'Marina' },
  { id:'l2', bed:'Canteiro do sol', activity:'Observação do crescimento', note:'Primeiros tomates começando a amadurecer!', date:new Date(Date.now()-1000*60*60*26).toISOString(), photo:'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=500&q=80', author:'Rafael' }
]
const fmt = (d) => new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(d))
const readLogs = () => { try { return JSON.parse(localStorage.getItem('horta_logs')) || initialLogs } catch { return initialLogs } }

function App() {
  const [page,setPage] = useState('dashboard')
  const [mobileMenu,setMobileMenu] = useState(false)
  const [showRecord,setShowRecord] = useState(false)
  const [showNotifications,setShowNotifications] = useState(false)
  const [user,setUser] = useState(() => localStorage.getItem('horta_user') || '')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [logs,setLogs] = useState(readLogs)
  const [beds,setBeds] = useState(starterBeds)
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('Todos')
  const [toast,setToast] = useState('')
  const [reminders,setReminders] = useState(true)
  const [record,setRecord] = useState({bed:starterBeds[0].name,activity:'Rega',note:'',reminder:false,reminderTime:'18:00',photo:''})
  const [busy,setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(()=>{ localStorage.setItem('horta_logs',JSON.stringify(logs)) },[logs])
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(''),3200); return ()=>clearTimeout(t) },[toast])
  useEffect(()=>{ if(hasSupabase && user) loadCloudLogs() },[user])
  async function loadCloudLogs(){
    const {data,error}=await supabase.from('diario_canteiros').select('*').order('criado_em',{ascending:false}).limit(30)
    if(!error && data?.length) setLogs(data.map(x=>({id:x.id,bed:x.canteiro,activity:x.atividade,note:x.atividade,photo:x.foto_base64,date:x.criado_em,author:'Você'})))
  }
  async function login(e){
    e.preventDefault()
    if(!email || !password){setToast('Preencha seu e-mail e sua senha.');return}
    if(hasSupabase){
      const {data,error}=await supabase.auth.signInWithPassword({email,password})
      if(error){setToast(error.message);return}
      setUser(data.user.email)
    } else setUser(email.split('@')[0] || 'Voluntário')
    localStorage.setItem('horta_user',email.split('@')[0] || 'Voluntário')
    setToast('Que bom ter você por aqui! 🌱')
  }
  function logout(){setUser('');localStorage.removeItem('horta_user');setPage('dashboard')}
  async function takePhoto(){
    try {
      if(Capacitor.isNativePlatform()){
        const photo=await CapCamera.getPhoto({quality:78,resultType:CameraResultType.DataUrl,source:CameraSource.Prompt})
        setRecord(r=>({...r,photo:photo.dataUrl}))
      } else fileRef.current?.click()
    } catch(e){ if(e?.message) setToast('Não foi possível abrir a câmera. Você pode escolher uma foto da galeria.') }
  }
  function onFile(e){
    const file=e.target.files?.[0]; if(!file)return
    const reader=new FileReader();reader.onload=()=>setRecord(r=>({...r,photo:reader.result}));reader.readAsDataURL(file)
  }
  async function scheduleReminder(){
    try {
      if(Capacitor.isNativePlatform()){
        const perm=await LocalNotifications.requestPermissions()
        if(perm.display==='granted'){
          const [h,m]=record.reminderTime.split(':').map(Number);const at=new Date();at.setHours(h,m,0,0);if(at<new Date())at.setDate(at.getDate()+1)
          await LocalNotifications.schedule({notifications:[{title:'Hora de cuidar da horta 🌱',body:`Não esqueça de visitar: ${record.bed}`,id:Math.floor(Date.now()%2147483000),schedule:{at}}]})
        }
      } else if('Notification' in window){
        const permission=await Notification.requestPermission()
        if(permission==='granted') setTimeout(()=>new Notification('Lembrete da Horta 🌱',{body:`Está na hora de cuidar de ${record.bed}!`}),Math.max(1000,new Date().setHours(...record.reminderTime.split(':').map(Number),0,0)-Date.now()))
      }
      setToast('Lembrete configurado! Você receberá uma notificação.')
    } catch {setToast('Lembrete salvo no diário. Ative as notificações do dispositivo para receber alertas.')}
  }
  async function saveRecord(e){
    e.preventDefault();setBusy(true)
    const entry={id:'l'+Date.now(),bed:record.bed,activity:record.activity,note:record.note || 'Registro feito pela equipe.',date:new Date().toISOString(),photo:record.photo,author:user || 'Voluntário'}
    if(hasSupabase && user){
      const {data:{user:authUser}}=await supabase.auth.getUser()
      const {error}=await supabase.from('diario_canteiros').insert({user_id:authUser?.id,canteiro:entry.bed,atividade:entry.activity,foto_base64:entry.photo || null})
      if(error) setToast('Registro salvo neste dispositivo. Sincronização: '+error.message)
    }
    setLogs(prev=>[entry,...prev]);setRecord({bed:starterBeds[0].name,activity:'Rega',note:'',reminder:false,reminderTime:'18:00',photo:''})
    setShowRecord(false);setBusy(false);setPage('dashboard')
    if(record.reminder) await scheduleReminder()
    else setToast('Registro adicionado ao diário com sucesso!')
  }
  function removeLog(id){setLogs(prev=>prev.filter(x=>x.id!==id));setToast('Registro removido.')}
  const filteredLogs=useMemo(()=>logs.filter(l=>(filter==='Todos'||l.activity.toLowerCase().includes(filter.toLowerCase())) && (l.bed+l.activity+l.note).toLowerCase().includes(query.toLowerCase())),[logs,filter,query])
  const nav=[['dashboard','Visão geral',LayoutDashboard],['beds','Canteiros',Sprout],['diary','Diário de atividades',CalendarDays]]
  if(!user) return <Login email={email} setEmail={setEmail} password={password} setPassword={setPassword} login={login} />
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><Sprout size={23}/></div><div><b>Horta<span>Viva</span></b><small>COMUNIDADE QUE CULTIVA</small></div><button className="mobile-close" onClick={()=>setMobileMenu(false)}><X/></button></div>
      <div className="side-label">MENU PRINCIPAL</div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>{setPage(id);setMobileMenu(false)}}><Icon size={18}/>{label}{id==='diary'&&<span className="nav-count">{logs.length}</span>}</button>)}</nav>
      <div className="side-card"><div className="side-card-icon"><Sun size={19}/></div><b>Pequenos cuidados,<br/>grandes colheitas.</b><p>Cada gota e cada minuto fazem a diferença.</p><div className="side-leaves">✳ ✿ ✳</div></div>
      <div className="sidebar-bottom"><div className="avatar">{(user[0]||'V').toUpperCase()}</div><div className="profile-name"><b>{user}</b><small>Voluntário da horta</small></div><button className="icon-button subtle" title="Sair" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    {mobileMenu&&<div className="scrim" onClick={()=>setMobileMenu(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Horta Viva <ChevronRight size={14}/> <strong>{nav.find(x=>x[0]===page)?.[1] || 'Canteiros'}</strong></div><div className="top-actions"><div className="weather-pill"><CloudSun size={17}/><span>Dia perfeito para plantar</span></div><button className="icon-button notification-btn" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={19}/><i/></button><div className="top-avatar">{(user[0]||'V').toUpperCase()}</div></div>
      {showNotifications&&<div className="notification-pop"><b>Notificações</b><p><span className="dot green-dot"/> Seu canteiro de folhas pode precisar de água.</p><p><span className="dot"/> Novo registro adicionado ao diário.</p><button onClick={()=>setShowNotifications(false)}>Entendi</button></div>}</header>
      <div className="content">
        {page==='dashboard'&&<Dashboard beds={beds} logs={logs} setShowRecord={setShowRecord} setPage={setPage}/>}
        {page==='beds'&&<Beds beds={beds} setBeds={setBeds} setShowRecord={setShowRecord}/>}
        {page==='diary'&&<Diary logs={filteredLogs} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} removeLog={removeLog} setShowRecord={setShowRecord}/>}
      </div>
      <footer className="footer"><span>© 2026 Horta Viva</span><span>Feito com <Heart size={12} fill="currentColor"/> pela comunidade</span></footer>
    </main>
    {showRecord&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowRecord(false)}><form className="record-modal" onSubmit={saveRecord}><div className="modal-head"><div><span className="eyebrow">DIÁRIO DA HORTA</span><h2>Novo registro</h2><p>Compartilhe o cuidado que você teve hoje.</p></div><button type="button" className="icon-button" onClick={()=>setShowRecord(false)}><X/></button></div>
      <label>Canteiro<select value={record.bed} onChange={e=>setRecord({...record,bed:e.target.value})}>{beds.map(b=><option key={b.id}>{b.name}</option>)}</select></label>
      <label>O que foi feito?<select value={record.activity} onChange={e=>setRecord({...record,activity:e.target.value})}><option>Rega</option><option>Plantio</option><option>Adubação</option><option>Colheita</option><option>Observação do crescimento</option><option>Manutenção</option></select></label>
      <label>Observações<textarea rows="3" placeholder="Conte como está o canteiro..." value={record.note} onChange={e=>setRecord({...record,note:e.target.value})}/></label>
      <div className="photo-upload"><div className="photo-copy"><Camera size={20}/><div><b>Foto do canteiro</b><small>Registre a evolução com uma imagem</small></div></div><input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile}/><button type="button" className="outline-button" onClick={takePhoto}><ImagePlus size={16}/>{record.photo?'Trocar foto':'Adicionar foto'}</button>{record.photo&&<img className="photo-preview" src={record.photo} alt="Prévia da foto"/>}</div>
      <label className="reminder-toggle"><input type="checkbox" checked={record.reminder} onChange={e=>setRecord({...record,reminder:e.target.checked})}/><span><b><Bell size={16}/> Criar lembrete de cuidado</b><small>Receba uma notificação para voltar à horta.</small></span></label>
      {record.reminder&&<label>Horário do lembrete<input type="time" value={record.reminderTime} onChange={e=>setRecord({...record,reminderTime:e.target.value})}/></label>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowRecord(false)}>Cancelar</button><button className="primary-button" disabled={busy}>{busy?'Salvando...':'Salvar registro'} <CheckCircle2 size={17}/></button></div>
    </form></div>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>
}

function Login({email,setEmail,password,setPassword,login}){
 return <div className="login-page"><div className="login-photo"><div className="login-brand"><div className="brand-mark"><Sprout/></div><b>Horta<span>Viva</span></b></div><div className="login-quote"><span>UM PEDACINHO DE NATUREZA,</span><h1>Floresce melhor<br/>quando é <em>compartilhado.</em></h1><p>Conectando pessoas, cuidado e natureza em cada canteiro.</p><div className="login-proof"><div className="proof-avatars"><i>M</i><i>R</i><i>A</i><i>+</i></div><small>Uma comunidade que cultiva junto</small></div></div><div className="photo-credit">CULTIVE CONEXÕES · COLHA POSSIBILIDADES</div></div><div className="login-panel"><div className="login-form-wrap"><div className="mobile-login-brand"><div className="brand-mark"><Sprout/></div><b>Horta<span>Viva</span></b></div><span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Que bom ter você<br/>por aqui<span>.</span></h2><p className="login-sub">Entre para acompanhar o crescimento da nossa horta.</p><form onSubmit={login}><label>Seu e-mail<div className="input-icon"><Mail size={18}/><input type="email" placeholder="voce@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label><label>Senha<div className="input-icon"><Lock size={18}/><input type="password" placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)} required/></div></label><button className="primary-button login-submit">Entrar na horta <ArrowUpRight size={18}/></button></form><div className="login-hint"><ShieldCheck size={16}/> Seus registros ajudam toda a comunidade.</div><div className="demo-note"><Sparkles size={15}/> Modo demonstração: use qualquer e-mail e senha para entrar. Com Supabase configurado, o login será autenticado.</div></div><div className="login-bottom">© 2026 Horta Viva <span>•</span> Cultivando juntos 🌱</div></div></div>
}

function Dashboard({beds,logs,setShowRecord,setPage}){
 return <><div className="welcome-row"><div><span className="eyebrow">SEXTA-FEIRA · 27 DE NOVEMBRO</span><h1>Bom dia, <em>cultivador!</em> <span className="wave">✳</span></h1><p>Um novo dia para fazer nossa horta florescer.</p></div><button className="primary-button" onClick={()=>setShowRecord(true)}><Plus size={18}/> Novo registro</button></div>
 <div className="hero-banner"><div className="hero-text"><span className="hero-kicker"><Sparkles size={14}/> NOSSA HORTA, NOSSO FUTURO</span><h2>O cuidado de hoje<br/>é a colheita de amanhã.</h2><p>Cada gesto importa. Acompanhe, registre e inspire nossa comunidade.</p><button onClick={()=>setPage('beds')}>Explorar canteiros <ArrowUpRight size={16}/></button></div><div className="hero-decoration"><div className="hero-sticker"><Sprout size={27}/><span>Juntos<br/>cultivamos</span></div></div></div>
 <div className="stats-grid"><Stat icon={Sprout} label="Canteiros ativos" value="03" note="Todos em acompanhamento" color="sage"/><Stat icon={Droplets} label="Registros de cuidado" value={String(logs.length+24).padStart(2,'0')} note="+ 4 nesta semana" color="blue"/><Stat icon={Heart} label="Voluntários" value="12" note="Uma comunidade unida" color="peach"/><Stat icon={TrendingUp} label="Crescimento médio" value="75%" note="Os canteiros estão bem!" color="yellow"/></div>
 <div className="section-heading"><div><span className="eyebrow">ACOMPANHE DE PERTO</span><h2>Nossos canteiros <span>🌿</span></h2></div><button className="text-button" onClick={()=>setPage('beds')}>Ver todos <ChevronRight size={16}/></button></div>
 <div className="bed-grid">{beds.map(b=><BedCard key={b.id} bed={b}/>)}</div>
 <div className="bottom-grid"><div className="activity-panel"><div className="panel-heading"><div><span className="eyebrow">ACONTECE NA HORTA</span><h3>Atividades recentes</h3></div><button className="text-button" onClick={()=>setPage('diary')}>Ver diário <ChevronRight size={15}/></button></div>{logs.slice(0,3).map(l=><Activity key={l.id} log={l}/>)}</div><div className="tip-card"><div className="tip-icon"><Sun size={21}/></div><span className="eyebrow">DICA VERDE DA SEMANA</span><h3>Água na medida certa 💧</h3><p>Regue suas plantas nas primeiras horas da manhã. Assim, a água é melhor aproveitada e as folhas ficam protegidas do sol forte.</p><div className="tip-bottom">CUIDAR É UM ATO DE AMOR <Leaf size={16}/></div></div></div>
 </>
}
function Stat({icon:Icon,label,value,note,color}){return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function BedCard({bed}){return <div className="bed-card"><div className="bed-image"><img src={bed.image} alt={bed.name}/><span className={`status ${bed.status==='Saudável'?'healthy':'thirsty'}`}><i/>{bed.status}</span><button className="heart-float" title="Favoritar"><Heart size={16}/></button></div><div className="bed-info"><span className="bed-type">{bed.type}</span><h3>{bed.name}</h3><p>{bed.plants}</p><div className="progress-label"><span>Desenvolvimento</span><b>{bed.progress}%</b></div><div className="progress-track"><i style={{width:bed.progress+'%'}}/></div><div className="bed-foot"><span><Droplets size={14}/> {bed.water}</span><ArrowUpRight size={16}/></div></div></div>}
function Activity({log}){return <div className="activity-row"><div className="activity-thumb">{log.photo?<img src={log.photo} alt=""/>:<Sprout/>}</div><div className="activity-copy"><b>{log.activity}</b><span>{log.bed} · {log.author||'Voluntário'}</span></div><time>{fmt(log.date)}</time></div>}
function Beds({beds,setBeds,setShowRecord}){const [adding,setAdding]=useState(false),[name,setName]=useState(''),[plants,setPlants]=useState('');function add(e){e.preventDefault();setBeds([...beds,{id:'b'+Date.now(),name,type:'Novo canteiro',plants,progress:0,water:'Ainda sem rega',image:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85',status:'Saudável'}]);setName('');setPlants('');setAdding(false)}return <><div className="page-title-row"><div><span className="eyebrow">CRESCENDO JUNTOS</span><h1>Explore os <em>canteiros.</em></h1><p>Cada espaço tem uma história e um jeito especial de florescer.</p></div><button className="primary-button" onClick={()=>setAdding(!adding)}><Plus size={18}/> Novo canteiro</button></div>{adding&&<form className="add-bed-form" onSubmit={add}><h3>Adicionar um canteiro</h3><input placeholder="Nome do canteiro" value={name} onChange={e=>setName(e.target.value)} required/><input placeholder="O que está plantado?" value={plants} onChange={e=>setPlants(e.target.value)} required/><button className="primary-button">Adicionar</button></form>}<div className="bed-grid beds-page-grid">{beds.map(b=><BedCard key={b.id} bed={b}/>)}</div><div className="wide-callout"><Flower2 size={25}/><div><b>Tem novidade na horta?</b><span>Registre uma rega, um plantio ou uma descoberta para todo mundo acompanhar.</span></div><button className="outline-button" onClick={()=>setShowRecord(true)}>Registrar atividade</button></div></>}
function Diary({logs,query,setQuery,filter,setFilter,removeLog,setShowRecord}){return <><div className="page-title-row"><div><span className="eyebrow">MEMÓRIA DA NOSSA HORTA</span><h1>Diário de <em>atividades.</em></h1><p>Um registro de cada cuidado, conquista e descoberta.</p></div><button className="primary-button" onClick={()=>setShowRecord(true)}><Plus size={18}/> Novo registro</button></div><div className="diary-tools"><div className="search-box"><Search size={17}/><input placeholder="Buscar por canteiro ou atividade..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-pills">{['Todos','Rega','Plantio','Colheita'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</div></div><div className="diary-list">{logs.length?logs.map(l=><article className="diary-entry" key={l.id}><div className="diary-photo">{l.photo?<img src={l.photo} alt="Registro do canteiro"/>:<Sprout size={28}/>}</div><div className="diary-detail"><div className="diary-meta"><span>{l.bed}</span><time><Clock3 size={13}/>{fmt(l.date)}</time></div><h3>{l.activity}</h3><p>{l.note}</p><small><CircleUserRound size={13}/> Registrado por {l.author||'Voluntário'}</small></div><button className="delete-button" title="Excluir registro" onClick={()=>removeLog(l.id)}><Trash2 size={17}/></button></article>):<div className="empty-state"><Sprout size={35}/><h3>Nenhum registro encontrado</h3><p>Experimente mudar os filtros ou faça o primeiro registro.</p></div>}</div></>}
export default App