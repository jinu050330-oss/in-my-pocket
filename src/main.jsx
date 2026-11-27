import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/nanum-gothic/400.css';
import '@fontsource/nanum-gothic/700.css';
import '@fontsource-variable/inter';
import {asset, artwork, calendarArt, featured, galleryLeft, galleryRight, people, seed} from './data';
import {readPhotos, savePhoto} from './storage';
import {removeBackground} from './segmentation';
import './styles.css';

const icons = {
  back:'M15 18l-6-6 6-6', next:'M9 6l6 6-6 6', menu:'M3 6h18M3 12h18M3 18h18',
  plus:'M12 5v14M5 12h14', close:'M5 5l14 14M19 5L5 19',
  calendar:'M4 10h16M10 10v10M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z',
  people:'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0m2-16a4 4 0 0 1 0 8m1 2a7 7 0 0 1 3 6',
  photo:'M3 4h18v16H3zM3 15l5-5 5 5 3-3 5 5M16 7h2',
};
function Icon({name}) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name]}/></svg>;
}
function IconButton({icon, label, className='', ...props}) {
  return <button className={`icon ${className}`} aria-label={label} {...props}><Icon name={icon}/></button>;
}
const dateLabel = date => date.split('-').join(' . ');
function localDate() {
  const now = new Date();
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
function Cover({person, className=''}) {
  return <div className={`cover ${person.id} ${className}`} style={{background:person.color}}>
    <img src={person.cover} alt="" draggable="false"/>
  </div>;
}
function Hero({person, className=''}) {
  return <div className={`hero ${className}`}>
    {person.hero ? <>
      <div className="hero-crop"><img className="hero-person" src={person.hero} alt={person.name}/></div>
      {artwork.map(([id,x,y,w,h])=><img key={id} className="doodle" src={asset(1363,id+'.png')} alt="" style={{left:x,top:y,width:w,height:h}}/>)}
    </> : <Cover person={person}/>}
  </div>;
}
function PocketCard({person, onClick, style, tabIndex, small=false}) {
  const contents = <><Cover person={person}/><span className="glass">
    {small && <span>{person.name} Pocket<small>{person.total}개 기록</small></span>}
  </span></>;
  if (small) return <div className="pocket-card" style={style}>{contents}</div>;
  return <button className="pocket-card" style={style} tabIndex={tabIndex} aria-label={person.name+' Pocket'} onClick={onClick}>{contents}</button>;
}
function Carousel({selected, select, open, count}) {
  const [delta, setDelta] = useState(0);
  const drag = useRef(null);
  const suppress = useRef(false);
  const wrap = index => (index+people.length)%people.length;
  const relative = index => ((index-selected+4)%3)-1;
  function begin(event) {
    if (event.button !== 0) return;
    suppress.current = false;
    drag.current = {x:event.clientX, id:event.pointerId};
  }
  function move(event) {
    if (drag.current?.id !== event.pointerId) return;
    const offset = event.clientX - drag.current.x;
    if (Math.abs(offset)>7 && !suppress.current) {
      suppress.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (suppress.current) setDelta(Math.max(-320,Math.min(320,offset)));
  }
  function end(event) {
    if (drag.current?.id !== event.pointerId) return;
    const offset = event.clientX - drag.current.x;
    if (event.type !== 'pointercancel' && Math.abs(offset)>136) select(wrap(selected + (offset<0 ? 1:-1)));
    drag.current = null;
    setDelta(0);
  }
  return <>
    <div className="carousel" aria-label="인물 카드" onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={event=>{if (!suppress.current) end(event);}}
      onKeyDown={event=>{if (event.key==='ArrowLeft'||event.key==='ArrowRight') {event.preventDefault();select(wrap(selected+(event.key==='ArrowLeft'?-1:1)));}}}>
      {people.map((person,index)=>{
        const slot=relative(index);
        const position=slot*272+delta;
        const scale=1-Math.min(1,Math.abs(position)/272)*.227;
        return <PocketCard key={person.id} person={person} tabIndex={slot===0?0:-1}
          style={{transform:`translateX(${position}px) scale(${scale})`,transition:delta?'none':undefined,zIndex:slot===0?2:1}}
          onClick={event=>{if (event.detail && suppress.current) return; open(index);}}/>;
      })}
    </div>
    <div className="card-caption"><strong>{people[selected].name} Pocket</strong><span>{count}개의 기록이 있어요</span></div>
  </>;
}
function Onboarding({start, login}) {
  const [slide,setSlide]=useState(0);
  const swipe=useRef(null);
  function begin(event) {
    if (!event.isPrimary || event.button!==0 || event.target.closest('button')) return;
    swipe.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function finish(event) {
    if (swipe.current?.id!==event.pointerId) return;
    const dx=event.clientX-swipe.current.x;
    const dy=event.clientY-swipe.current.y;
    swipe.current=null;
    if (event.type==='pointerup' && Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) {
      setSlide(current=>Math.max(0,Math.min(2,current+(dx<0?1:-1))));
    }
  }
  return <section className="onboarding" aria-label="앱 소개" onPointerDown={begin} onPointerUp={finish} onPointerCancel={finish}>
    <div className="dots">{[0,1,2].map(i=><button key={i} className={i===slide?'active':''} onClick={()=>setSlide(i)} aria-label={'소개 '+(i+1)} aria-current={i===slide?'step':undefined}/>)}</div>
    <h1>{slide===1?'드로잉 커스텀':<>소중한 추억을<br/>나만의 포켓으로</>}</h1>
    {slide===0&&<div className="intro-cards">{[people[2],people[0],people[1]].map((person,i)=><PocketCard small key={person.id} person={person} style={{left:`calc(50% + ${-321+i*221}px)`}}/>)}</div>}
    {slide===1&&<div className="intro-art"><span>2026 . 11 . 20</span><Hero person={people[0]}/></div>}
    <p className="intro-copy">사진첩 어딘가에 흩어진 그 사람과의 순간,<br/>이제 한 사람의 포켓에 모아볼까요?</p>
    <div className="entry-actions"><button className="primary" onClick={start}>시작하기</button>
      <p>이미 계정이 있나요? <button className="underlined" onClick={login}>로그인</button></p></div>
  </section>;
}
function Account({signup, back, start, register}) {
  const [message,setMessage]=useState('');
  const demoMessage=()=>setMessage('이 기능은 계정 연결 후 사용할 수 있어요.');
  return <section className={'account '+(signup?'signup':'')}>
    <IconButton icon="back" label="뒤로" className="account-back" onClick={back}/>
    <h1>In my pocket</h1>
    {signup&&<h2>나만의 포켓을 만들기 전<br/>회원가입이 필요해요!</h2>}
    <form onSubmit={event=>{event.preventDefault();start();}}>
      <div className="account-fields">
        {signup ? <>
          <input aria-label="이름" placeholder="이름"/><input aria-label="생년월일 6자리" placeholder="생년월일 6자리" inputMode="numeric" maxLength={6}/>
          <div className="verification-field"><input aria-label="전화번호 또는 이메일" placeholder="전화번호 / 이메일"/>
            <button type="button" onClick={demoMessage}>인증</button></div>
          <span className="account-help">03:00분 남음</span>
        </> : <>
          <input aria-label="아이디" placeholder="아이디" autoComplete="off"/>
          <input aria-label="비밀번호" type="password" placeholder="비밀번호" autoComplete="off"/>
          <div className="checks"><label><input type="checkbox"/> 자동로그인</label><label><input type="checkbox"/> 아이디 저장</label></div>
        </>}
      </div>
      <div className="entry-actions"><button className="primary">{signup?'가입하기':'로그인'}</button>
        {signup ? <p>데모에서는 탐색으로 이동합니다</p> : <p className="account-links">
          <button type="button" onClick={demoMessage}>아이디 찾기</button> ㅣ <button type="button" onClick={demoMessage}>비밀번호 찾기</button>
          <button className="underlined" type="button" onClick={register}>회원가입</button>
        </p>}
        {message&&<p role="status">{message}</p>}
      </div>
    </form>
  </section>;
}
function PhotoTile({photo, open, height, className='', checked}) {
  return <button className={`photo-tile ${className} tile-${photo.id}`} aria-label={photo.name} aria-pressed={checked} style={height?{height}:undefined} onClick={()=>open(photo.id)}>
    <img alt="" src={photo.original || photo.cutout} loading="lazy"/>
    {checked!==undefined&&<span className="selection-check" aria-hidden="true">{checked?'✓':''}</span>}
  </button>;
}
function Calendar({month, shift, records, day, choose}) {
  const year=month.getFullYear(), m=month.getMonth();
  const first=(new Date(year,m,1).getDay()+6)%7;
  const last=new Date(year,m+1,0).getDate();
  const weeks=Math.ceil((first+last)/7);
  const monthName=month.toLocaleString('en',{month:'short'}).toUpperCase();
  return <>
    <header className="calendar-head"><IconButton icon="back" label="이전 달" onClick={()=>shift(-1)}/>
      <h1>{monthName}</h1><IconButton icon="next" label="다음 달" onClick={()=>shift(1)}/></header>
    <div className="calendar-grid" style={{'--weeks':weeks}}>
      {['mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(name=><strong key={name}>{name}</strong>)}
      {Array.from({length:weeks*7},(_,i)=>{
        const number=i-first+1;
        if(number<1||number>last) return <span key={i}/>;
        const date=`${year}-${String(m+1).padStart(2,'0')}-${String(number).padStart(2,'0')}`;
        const matches=records.filter(photo=>(photo.calendarDate||photo.date)===date);
        const photo=matches[0];
        const [width,height,dx,dy]=(year===2026&&m===11&&!photo?.saved&&calendarArt[number])||[43,65,0,10];
        return <button key={i} className={day===date?'selected-day':''} onClick={()=>choose(date)} aria-label={`${m+1}월 ${number}일, ${matches.length}개 기록`}>
          <span>{number}</span>
          {photo&&<span className={`calendar-art art-${photo.id}`} style={{width,height,marginLeft:dx,top:24+dy}}>
            <img src={photo.cutout||photo.original} alt=""/>
          </span>}
        </button>;
      })}
    </div>
  </>;
}
function App() {
  const [route,setRoute] = useState(()=>({name:sessionStorage.getItem('started')?'explore':'splash',key:0}));
  const [selected,setSelected]=useState(1);
  const [saved,setSaved]=useState([]);
  const [notice,setNotice]=useState('');
  const [month,setMonth]=useState(new Date(2026,11,1));
  const [sortOld,setSortOld]=useState(false);
  const [gallerySelection,setGallerySelection]=useState(null);
  const [menu,setMenu]=useState(false);
  const [cutout,setCutout]=useState(false);
  const [draft,setDraft]=useState(null);
  const [busySave,setBusySave]=useState(false);
  const fileInput=useRef(null);
  const pickerPerson=useRef(null);
  const sequence=useRef(0);
  const draftJob=useRef(0);
  const scroll=useRef(null);
  const strip=useRef(null);
  const positions=useRef(new Map());
  const urls=useRef(new Set());
  const blobUrl=blob=>{
    const url=URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  };
  const prepare=photo=>({...photo,saved:true,original:blobUrl(photo.originalFile),cutout:blobUrl(photo.cutoutFile)});
  const person=people.find(p=>p.id===route.person)||people[selected];
  const records=[...saved,...seed];
  const byId=new Map(records.map(photo=>[photo.id,photo]));
  const personal=records.filter(photo=>photo.person===person.id||person.linkedPhotos?.includes(photo.id));
  const photo=byId.get(route.photo);
  const activeCount=people[selected].total+saved.filter(photo=>photo.person===people[selected].id).length;
  const personCount=person.total+saved.filter(photo=>photo.person===person.id).length;

  useEffect(()=>{
    let live=true;
    readPhotos().then(photos=>{
      if(live) setSaved(current=>[...current,...photos.filter(photo=>!current.some(existing=>existing.id===photo.id)).sort((a,b)=>b.created-a.created).map(prepare)]);
    }).catch(()=>{if(live)setNotice('저장된 사진을 불러올 수 없어요.');});
    return ()=>{live=false;for(const url of urls.current)URL.revokeObjectURL(url);};
  },[]);
  useEffect(()=>{
    history.scrollRestoration='manual';
    history.replaceState({pocket:route},'');
    function pop(event) {
      setMenu(false);
      setCutout(false);
      if(event.state?.pocket) setRoute(event.state.pocket);
    }
    window.addEventListener('popstate',pop);
    return ()=>window.removeEventListener('popstate',pop);
  },[]);
  useEffect(()=>{
    if(route.name!=='splash') return;
    const timer=setTimeout(()=>go('intro',{},true),950);
    return ()=>clearTimeout(timer);
  },[route.name]);
  useLayoutEffect(()=>{
    const [top,left]=positions.current.get(route.key)||[0,saved.some(photo=>photo.person===route.person)?0:32];
    if(scroll.current)scroll.current.scrollTop=top;
    if(strip.current)strip.current.scrollLeft=left;
  },[route.key]);
  useEffect(()=>{
    if(!notice)return;
    const timer=setTimeout(()=>setNotice(''),3500);
    return ()=>clearTimeout(timer);
  },[notice]);
  useEffect(()=>()=>{
    if(draft?.originalUrl){URL.revokeObjectURL(draft.originalUrl);urls.current.delete(draft.originalUrl);}
  },[draft?.originalUrl]);
  useEffect(()=>()=>{
    if(draft?.cutoutUrl){URL.revokeObjectURL(draft.cutoutUrl);urls.current.delete(draft.cutoutUrl);}
  },[draft?.cutoutUrl]);

  function remember() {
    positions.current.set(route.key,[scroll.current?.scrollTop||0,strip.current?.scrollLeft||0]);
  }
  function go(name, data={}, replace=false) {
    remember();
    if(name==='gallery')setGallerySelection(null);
    const next={name,key:++sequence.current,...data};
    history[replace?'replaceState':'pushState']({pocket:next},'');
    setMenu(false);
    setCutout(false);
    setRoute(next);
  }
  useEffect(()=>{
    if(route.name!=='import'&&draft){++draftJob.current;setDraft(null);}
  },[route.name,draft]);
  function back() {
    remember();
    if(route.name==='import'){++draftJob.current;setDraft(null);}
    history.back();
  }
  function start() {
    sessionStorage.setItem('started','1');
    if (route.name==='intro' && route.replay) {
      back();
      return;
    }
    go('explore',{},true);
  }
  const openPhoto=id=>go('detail',{photo:id});
  function pick(owner) {
    pickerPerson.current=owner;
    fileInput.current.value='';
    fileInput.current.click();
  }
  async function process(file, owner, originalUrl) {
    const job=++draftJob.current;
    setCutout(true);
    setDraft({file,owner,originalUrl,status:'배경 제거 준비 중…'});
    try {
      const png=await removeBackground(file,status=>{
        if(job===draftJob.current)setDraft(current=>({...current,status}));
      });
      if(job===draftJob.current)setDraft({file,owner,originalUrl,png,cutoutUrl:blobUrl(png)});
    } catch(error) {
      if(job===draftJob.current) setDraft({file,owner,originalUrl,error:'배경을 제거하지 못했어요. 다시 시도하거나 다른 사진을 선택해 주세요.'});
      console.error(error);
    }
  }
  function chooseFile(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    const owner=pickerPerson.current;
    if(route.name!=='import')go('import',{person:owner,originKey:route.key});
    process(file,owner,blobUrl(file));
  }
  async function commit() {
    if(!draft?.png||busySave)return;
    setBusySave(true);
    const entry={id:crypto.randomUUID?.()||`photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,name:draft.file.name,person:draft.owner,
      date:localDate(),created:Date.now(),originalFile:draft.file,cutoutFile:new File([draft.png],'cutout.png',{type:'image/png'})};
    try {
      await savePhoto(entry);
      setSaved(current=>[prepare(entry),...current]);
      const origin=positions.current.get(route.originKey);
      if(origin)positions.current.set(route.originKey,[origin[0],0]);
      setNotice('포켓에 저장했어요.');
      back();
    } catch {setNotice('사진을 저장할 수 없어요. 다시 시도해 주세요.');}
    finally {setBusySave(false);}
  }

  const recordHeader=(title, showMenu=false)=><header className="topbar"><IconButton icon="back" label="뒤로" onClick={back}/>{title&&<span>{title}</span>}
    {showMenu&&<><button className="edit-record" onClick={()=>setNotice('기록 편집은 다음 버전에서 사용할 수 있어요.')}>편집</button>
      <IconButton icon="menu" label="메뉴" onClick={()=>setMenu(!menu)}/></>}</header>;
  const navMenu=menu&&<nav className="popover" aria-label="화면 이동">
    <button onClick={()=>go('gallery',{person:person.id})}>갤러리</button><button onClick={()=>go('calendar')}>캘린더</button>
    {route.name==='explore'&&<button onClick={()=>go('intro',{replay:true})}>앱 소개 다시 보기</button>}
    {route.name!=='explore'&&<button onClick={()=>go('explore')}>인물 탐색</button>}
  </nav>;
  const galleryIds=new Set([...galleryLeft,...galleryRight].map(([id])=>id));
  const galleryExtra=seed.filter(item=>!galleryIds.has(item.id)&&item.original);
  const left=[...saved.filter((_,i)=>i%2===0).map(item=>[item,190]),...galleryLeft.map(([id,h])=>[byId.get(id),h]),...galleryExtra.filter((_,i)=>i%2===0).map(item=>[item,162])];
  const right=[...saved.filter((_,i)=>i%2===1).map(item=>[item,150]),...galleryRight.map(([id,h])=>[byId.get(id),h]),...galleryExtra.filter((_,i)=>i%2===1).map(item=>[item,148])];
  const columns=sortOld?[left.toReversed(),right.toReversed()]:[left,right];
  const stripPhotos=person.id==='yena'?[...saved.filter(item=>item.person===person.id),...featured.map(id=>byId.get(id))]:personal;

  return <main className="device" aria-label="In My Pocket">
    <input ref={fileInput} hidden type="file" accept="image/*" onChange={chooseFile}/>
    <div ref={scroll} className={`view view-${route.name}`} key={route.key} onScroll={remember}>
      {route.name==='splash'&&<button className="splash" onClick={()=>go('intro',{},true)}>In my pocket</button>}
      {route.name==='intro'&&<Onboarding start={start} login={()=>go('login')}/>}
      {(route.name==='login'||route.name==='signup')&&<Account signup={route.name==='signup'} back={back} start={start} register={()=>go('signup')}/>}
      {route.name==='explore'&&<>
        <header className="topbar"><h1>my pocket</h1><IconButton icon="menu" label="메뉴" onClick={()=>setMenu(!menu)}/></header>
        <div className="explore-options"><div className="dots">{people.map((item,i)=><button key={item.id} onClick={()=>setSelected(i)} aria-pressed={selected===i} aria-label={item.name}/>)}</div>
          <button className="add-pocket" onClick={()=>setNotice('새 포켓 만들기는 다음 버전에서 사용할 수 있어요.')}>포켓 추가하기</button></div>
        <Carousel selected={selected} select={setSelected} count={activeCount} open={index=>{setSelected(index);go('person',{person:people[index].id});}}/>
        {navMenu}
      </>}
      {route.name==='person'&&<>
        {recordHeader(null)}
        <div className="person-heading"><h1>{person.name} pocket</h1><button onClick={()=>go('journal',{person:person.id})}><Icon name="photo"/>{personCount}개 기록</button></div>
        <span className="person-date">2026 . 11 . 20</span>
        <button className="person-hero-button" aria-label={person.name+' 기록 설명 보기'} onClick={()=>go('journal',{person:person.id})}>
          <Hero person={person}/>
        </button>
        <div ref={strip} className="photo-strip" onScroll={remember}>
          {stripPhotos.map(item=><PhotoTile key={item.id} photo={item} open={openPhoto} className={item.id==='room'?'wide':''}/>)}
          {!stripPhotos.length&&<span className="empty">사진을 추가해 보세요.</span>}
        </div>
        <nav className="record-actions" aria-label="포켓 메뉴">
          <IconButton icon="people" label="인물 탐색으로 돌아가기" onClick={back}/>
          <IconButton icon="plus" label="새 사진 추가" onClick={()=>pick(person.id)}/>
          <IconButton icon="calendar" label="갤러리" onClick={()=>go('gallery',{person:person.id})}/>
        </nav>
      </>}
      {route.name==='journal'&&<>
        {recordHeader(null,true)}{navMenu}
        <div className="journal-intro"><h1>11월 20일</h1><p><Icon name="photo"/>{personCount}개 이미지</p>
          {person.id==='yena'&&<><p className="journal-place">서울특별시- 안암동</p><p className="journal-note">예나랑 오늘은 포컴그 과제를 했다. 예나는 여전히 사람말을 안한다. 언제쯤이면 예나는 호감일까?</p></>}
          <Hero person={person}/>
        </div>
        <div className="journal-grid">{personal.filter(item=>item.original).map(item=><PhotoTile key={item.id} photo={item} open={openPhoto}/>)}</div>
        <IconButton className="floating-add" icon="plus" label="새 사진 추가" onClick={()=>pick(person.id)}/>
      </>}
      {route.name==='gallery'&&<>
        <header className="gallery-head"><div><IconButton icon="close" label="뒤로" onClick={back}/><button onClick={()=>pick(person.id)}>사진 추가하기</button></div>
          <div><button className="sort" onClick={()=>setSortOld(!sortOld)}>{sortOld?'오래된 순':'최근 순'} <span aria-hidden="true"/></button>
            {gallerySelection&&<button disabled={!gallerySelection.length} onClick={()=>openPhoto(gallerySelection[0])}>보기</button>}
            <button className="gallery-select" onClick={()=>setGallerySelection(gallerySelection?null:[])}>{gallerySelection?'취소':'선택'}</button></div></header>
        <div className="masonry">{columns.map((column,i)=><div key={i}>{column.map(([item,height])=><PhotoTile key={item.id} photo={item}
          checked={gallerySelection?.includes(item.id)}
          open={id=>gallerySelection?setGallerySelection(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]):openPhoto(id)}
          height={height}/>)}</div>)}</div>
      </>}
      {route.name==='calendar'&&<>
        <IconButton icon="back" label="뒤로" className="calendar-back" onClick={back}/>
        <Calendar month={month} records={records} shift={offset=>setMonth(new Date(month.getFullYear(),month.getMonth()+offset,1))} choose={day=>go('day',{day})}/>
      </>}
      {route.name==='day'&&<>
        {recordHeader(dateLabel(route.day))}
        <div className="day-record"><h1>MEMORIES</h1><div className="journal-grid">
          {records.filter(item=>(item.calendarDate||item.date)===route.day).map(item=><PhotoTile key={item.id} photo={item} open={openPhoto}/>)}
        </div>{!records.some(item=>(item.calendarDate||item.date)===route.day)&&<p className="empty">이 날의 사진 기록이 없어요.</p>}</div>
      </>}
      {route.name==='detail'&&photo&&<>
        <header className="detail-head"><IconButton icon="back" label="뒤로" onClick={back}/><div><span>{dateLabel(photo.calendarDate||photo.date)}</span><h1>MEMORIES</h1></div></header>
        <div className={'detail-image '+(photo.id==='donuts'?'donuts ':'')+(cutout||!photo.original?'checker':'')}>
          <img alt={photo.name} src={(cutout&&photo.cutout)||photo.original||photo.cutout}/>
        </div>
        {photo.original&&photo.cutout&&<div className="switcher"><button aria-pressed={!cutout} onClick={()=>setCutout(false)}>원본</button><button aria-pressed={cutout} onClick={()=>setCutout(true)}>누끼</button></div>}
      </>}
      {route.name==='import'&&draft&&<>
        <header className="topbar"><IconButton icon="back" label="뒤로" onClick={back} disabled={busySave}/><h1>사진 추가</h1></header>
        <div className="import-content">
          <div className={'preview '+(cutout&&draft.png?'checker':'')}><img src={(cutout&&draft.cutoutUrl)||draft.originalUrl} alt="선택한 사진 미리보기"/></div>
          {draft.status&&<p role="status"><span className="spinner"/>{draft.status}</p>}
          {draft.error&&<p role="alert">{draft.error}</p>}
          {draft.png&&<div className="switcher"><button aria-pressed={!cutout} onClick={()=>setCutout(false)}>원본</button><button aria-pressed={cutout} onClick={()=>setCutout(true)}>누끼</button></div>}
          <div className="import-actions">
            {draft.error&&<button className="primary" onClick={()=>process(draft.file,draft.owner,draft.originalUrl)}>다시 시도</button>}
            {draft.png&&<button className="primary" disabled={busySave} onClick={commit}>{busySave?'저장 중…':'포켓에 저장'}</button>}
            <button disabled={busySave} onClick={()=>pick(draft.owner)}>다른 사진 선택</button>
          </div>
        </div>
      </>}
    </div>
    {notice&&<div role="status" className="toast">{notice}</div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App/>);
