/* ============ View tabs ============ */
const tabs = document.querySelectorAll('.cb-tab');
const views = {
  month: document.getElementById('view-month'),
  week:  document.getElementById('view-week'),
  day:   document.getElementById('view-day'),
  list:  document.getElementById('view-list'),
};
tabs.forEach(t=>t.addEventListener('click',()=>{
  tabs.forEach(x=>x.classList.remove('is-active'));
  t.classList.add('is-active');
  Object.values(views).forEach(v=>v.classList.remove('is-active'));
  views[t.dataset.view].classList.add('is-active');
}));

/* ============ Hours model ============ */
const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const HOUR_PX = 120;
const fmtHour = h => {
  const ap = h < 12 ? '오전' : '오후';
  const hh = h <= 12 ? h : h - 12;
  return `${ap} ${hh}:00`;
};
const yOf = h => (h - HOURS[0]) * HOUR_PX;

/* ============ MONTH VIEW ============ */
// 임시 영업일 pane(shop-setting.js)과 동일 기준 데이터 — 정기휴무: 월요일, 임시영업: 11/17
const M_TODAY = 9;
const M_REG_OFF_COL = 1;                 // 월요일 정기휴무
// 임시영업: { 일: {s,e,staff[]} } — 캘린더에서 직접 추가/수정/삭제
// 24=등록된 예시(월 뷰), 17=미설정 휴무로 비워 주 뷰에서 설정 시연
const M_TEMP_OPEN = { 24:{s:'10:00', e:'18:00', staff:[0,1]} };
const M_PAL=['#227EFF','#9B7CFF','#1DC9B7','#FF6B6B','#FFB020','#2BB0ED','#E64980','#7048E8','#12B886','#FA5252'];
const M_NAMES=['공대남','김직원이','박실장','이디자이너','최원장','정수석','강매니저','윤디자','임실장','한선생',
  '오대리','서디자','신매니','권원장','황실장','안수석','송디자','전매니','홍선생','문대리','양실장','구디자','배수석','조매니'];
const M_STAFF = M_NAMES.map((n,i)=>({n, c:M_PAL[i%M_PAL.length]})); // 24명 — 다인원 사용성 검증용
const M_TIME_OPTS=(()=>{const a=[];for(let h=6;h<=22;h++){['00','30'].forEach(m=>a.push(`${String(h).padStart(2,'0')}:${m}`));}return a;})();
const mFmtKo=v=>{const[h,m]=v.split(':').map(Number);const ap=h<12?'오전':'오후';const hh=h<=12?h:h-12;return `${ap} ${hh}:${String(m).padStart(2,'0')}`;};

function renderMonth(){
  const wdWrap = document.getElementById('monthWeekdays');
  if(!wdWrap.childElementCount){
    ['일','월','화','수','목','금','토'].forEach((d,i)=>{
      const s=document.createElement('span'); s.textContent=d;
      if(i===0)s.className='sun'; if(i===6)s.className='sat';
      wdWrap.appendChild(s);
    });
  }
  // 2025.11 — Nov 1 2025 is Saturday => grid starts Sun Oct 26
  const grid=document.getElementById('monthGrid');
  grid.innerHTML='';
  const cells=[];
  for(let d=26; d<=31; d++) cells.push({n:d,other:true});
  for(let d=1; d<=30; d++) cells.push({n:d,other:false});
  let nd=1; while(cells.length<42){cells.push({n:nd++,other:true});}
  cells.forEach((c,i)=>{
    const col=i%7;
    const el=document.createElement('div');
    el.className='mcell';
    if(c.other)el.classList.add('other');
    if(col===0)el.classList.add('sun');
    if(col===6)el.classList.add('sat');
    if(!c.other && c.n===M_TODAY)el.classList.add('today');

    const open = !c.other && M_TEMP_OPEN[c.n];
    const isOff  = !c.other && !open && col===M_REG_OFF_COL;
    let html=`<span class="dnum">${c.n}</span>`;

    if(open){
      // 임시 영업일 — 휴무지만 그날만 온라인 예약 노출. 클릭 시 수정/삭제
      el.classList.add('openday','openable');
      const t=mFmtKo(open.s).replace('오전 ','').replace('오후 ','');
      html+=`<div class="open-badge">임시영업 ${t}~</div>`;
      el.dataset.tempDay=c.n;
    } else if(isOff){
      // 정기휴무 — 미래는 임시영업(온라인 예약 열기) 가능
      el.classList.add('off');
      if(c.n>=M_TODAY){ el.dataset.offDay=c.n; el.classList.add('openable'); } // hover 단서 대상
      html+=`<span class="off-tag">휴무</span>`;
    }
    if(!c.other && c.n===12){
      html+=`<div class="ev"><span class="ev-dot"></span><span class="ev-time">오전 8:00</span><span>김고객</span></div>`;
    }
    el.innerHTML=html;
    // 모든 날짜 칸 클릭 → 액션 시트(실제 제품 동선)
    if(!c.other){
      el.classList.add('clickable');
      el.addEventListener('click',e=>{
        e.stopPropagation();
        const day=c.n, off=(col===M_REG_OFF_COL);
        if(M_TEMP_OPEN[day]){
          if(e.target.closest('.open-badge')) openTempPop(el, day, true); // 뱃지=바로 수정
          else openDaySheet(el, day, 'open');                            // 빈칸=시트
        }
        else if(off && day>=M_TODAY) openDaySheet(el, day, 'off');    // 미래 휴무
        else if(off)                 openDaySheet(el, day, 'offpast'); // 지난 휴무
        else                         openDaySheet(el, day, 'biz');    // 영업일
      });
    }
    grid.appendChild(el);
  });
}
renderMonth();
// 임시영업 변경 시 월·주 뷰 동시 갱신
function refreshViews(){ renderMonth(); renderWeek(); }

/* 토스트(예약 등록 등 스텁) */
let toastT=null;
function showToast(msg){
  let t=document.getElementById('mToast');
  if(!t){ t=document.createElement('div'); t.id='mToast'; t.className='m-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  if(toastT)clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),2200);
}

function stubBooking(day,what){ showToast(`11월 ${day}일 ${what} (프로토타입 범위 외)`); }
const mDow=day=>['일','월','화','수','목','금','토'][(6+(day-1))%7];

/* 날짜 액션 항목 구성(월 시트·주 드롭다운 공용). withEdit=주 뷰는 메뉴에 수정 포함 */
function dayItems(cell, day, kind, withEdit){
  const items=[{ico:'＋', txt:'예약 등록', act:()=>stubBooking(day,'예약 등록 화면')}];
  if(kind==='biz')
    items.push({ico:'⊘', txt:'예약 막기', act:()=>stubBooking(day,'예약 막기')});
  else if(kind==='off')
    items.push({ico:'🟢', txt:'임시 영업일로 설정', hl:true, keep:true, act:()=>openTempPop(cell,day,false)});
  else if(kind==='open'){
    if(withEdit) items.push({ico:'🟢', txt:'임시 영업일 수정', hl:true, keep:true, act:()=>openTempPop(cell,day,true)});
    items.push({ico:'⊗', txt:'임시 영업일 해제', keep:true, act:()=>{ delete M_TEMP_OPEN[day]; closeFloaters(); refreshViews(); showToast(`11월 ${day}일 임시 영업일을 해제했어요`); }});
  }
  items.push({ico:'📅', txt:'일정 상세보기', act:()=>stubBooking(day,'일정 상세')});
  return items;
}

/* ===== 월 뷰: 날짜 칸 클릭 → 딤 + 중앙 액션 시트 ===== */
function openDaySheet(cell, day, kind){
  closeFloaters();
  const items=dayItems(cell, day, kind, false); // 월: 수정은 뱃지 클릭이 담당
  mMenu=document.createElement('div');
  mMenu.className='sheet-mask';
  const sheet=document.createElement('div');
  sheet.className='day-sheet';
  sheet.addEventListener('click',e=>e.stopPropagation());
  sheet.innerHTML=`<div class="ds-chip">2025. 11. ${day} (${mDow(day)}요일)</div>`+
    items.map((it,i)=>`<button class="ds-btn ${it.hl?'hl':''}" data-i="${i}">
      <span class="ds-ico">${it.ico}</span>${it.txt}${it.sub?`<span class="ds-sub">${it.sub}</span>`:''}</button>`).join('');
  mMenu.appendChild(sheet);
  document.body.appendChild(mMenu);
  items.forEach((it,i)=>sheet.querySelector(`[data-i="${i}"]`).addEventListener('click',()=>{
    if(!it.keep) closeFloaters();
    it.act();
  }));
}

/* ===== 주 뷰: 날짜 헤더 클릭 → 헤더 아래 앵커 드롭다운(딤 없음) ===== */
function openWeekMenu(anchor, day, kind){
  closeFloaters();
  const items=dayItems(anchor, day, kind, true); // 주: 메뉴에 수정 포함
  anchor.classList.add('menu-open');
  mMenu=document.createElement('div');
  mMenu.className='wk-menu';
  mMenu.addEventListener('click',e=>e.stopPropagation());
  mMenu.innerHTML=items.map((it,i)=>`<button class="wk-mi ${it.hl?'hl':''}" data-i="${i}"><span class="wk-ico">${it.ico}</span>${it.txt}</button>`).join('');
  document.body.appendChild(mMenu);
  const r=anchor.getBoundingClientRect(), mw=mMenu.offsetWidth;
  let left=r.left+r.width/2-mw/2;
  left=Math.min(Math.max(12,left), innerWidth-mw-12);
  mMenu.style.left=left+'px'; mMenu.style.top=(r.bottom+6)+'px';
  items.forEach((it,i)=>mMenu.querySelector(`[data-i="${i}"]`).addEventListener('click',()=>{ if(!it.keep)closeFloaters(); it.act(); }));
}

/* ===== 일 뷰: 직원 컬럼 헤더 클릭 → 드롭다운(직원 액션 + 임시영업) ===== */
function openDayStaffMenu(anchor, name){
  closeFloaters();
  const si=M_STAFF.findIndex(s=>s.n===name);
  // 담당자없음 또는 미매칭 → 전체 선택, 특정 직원 → 그 직원 기본 선택
  const preset = (name==='담당자없음' || si<0) ? M_STAFF.map((_,i)=>i) : si;
  const items=[
    {ico:'＋', txt:'예약 등록', act:()=>stubBooking(DAY_N,`${name} 예약 등록`)},
    {ico:'⊘', txt:'예약 막기', act:()=>stubBooking(DAY_N,`${name} 예약 막기`)},
    {ico:'👤', txt:'스케줄 설정', act:()=>stubBooking(DAY_N,`${name} 스케줄 설정`)},
    {ico:'📅', txt:'직원 색상 설정', act:()=>stubBooking(DAY_N,'직원 색상 설정')},
  ];
  if(M_TEMP_OPEN[DAY_N])
    items.push({ico:'🟢', txt:'임시 영업일 수정', hl:true, keep:true, act:()=>openTempPop(anchor,DAY_N,true)});
  else if(DAY_OFF)
    items.push({ico:'🟢', txt:'임시 영업일로 설정', hl:true, keep:true, act:()=>openTempPop(anchor,DAY_N,false, preset)});

  anchor.classList.add('menu-open');
  mMenu=document.createElement('div');
  mMenu.className='wk-menu';
  mMenu.addEventListener('click',e=>e.stopPropagation());
  mMenu.innerHTML=items.map((it,i)=>`<button class="wk-mi ${it.hl?'hl':''}" data-i="${i}"><span class="wk-ico">${it.ico}</span>${it.txt}</button>`).join('');
  document.body.appendChild(mMenu);
  const r=anchor.getBoundingClientRect(), mw=mMenu.offsetWidth;
  let left=r.left+r.width/2-mw/2;
  left=Math.min(Math.max(12,left), innerWidth-mw-12);
  mMenu.style.left=left+'px'; mMenu.style.top=(r.bottom+4)+'px';
  items.forEach((it,i)=>mMenu.querySelector(`[data-i="${i}"]`).addEventListener('click',()=>{ if(!it.keep)closeFloaters(); it.act(); }));
}

/* ===== 캘린더 인라인 임시 영업일 팝오버 ===== */
let mPop=null, mMenu=null, mDraft=null;
function closeFloaters(){
  if(mPop){mPop.remove();mPop=null;} if(mMenu){mMenu.remove();mMenu=null;} mDraft=null;
  document.querySelectorAll('.menu-open').forEach(d=>d.classList.remove('menu-open'));
}
document.addEventListener('click',closeFloaters);

function openTempPop(cell, day, isEdit, defStaff){
  closeFloaters();
  const cur = M_TEMP_OPEN[day];
  // 기본 담당자: 지정 없으면 전체, 배열이면 그대로, 숫자면 단일(직원 헤더 진입)
  const initStaff = defStaff==null ? M_STAFF.map((_,i)=>i)
                  : Array.isArray(defStaff) ? [...defStaff] : [defStaff];
  mDraft = isEdit
    ? {day, s:cur.s, e:cur.e, staff:[...cur.staff]}
    : {day, s:'10:00', e:'18:00', staff:initStaff};
  const dow=['일','월','화','수','목','금','토'][(6+(day-1))%7];
  const tag = (M_REG_OFF_COL===((6+(day-1))%7)) ? '정기 휴무' : '휴무일';

  mPop=document.createElement('div');
  mPop.className='cal-mask';
  const pop=document.createElement('div');
  pop.className='cal-pop';
  pop.addEventListener('click',e=>e.stopPropagation());
  const timeSel=(id,val)=>`<select id="${id}" class="cp-sel">`+
    M_TIME_OPTS.map(v=>`<option value="${v}" ${v===val?'selected':''}>${mFmtKo(v)}</option>`).join('')+`</select>`;
  pop.innerHTML=`
    <div class="cp-head">
      <div>
        <div class="cp-title">임시 영업일 ${isEdit?'수정':'설정'}</div>
        <div class="cp-date"><b>2025. 11. ${day}</b> (${dow}) <span class="cp-tag">${tag}</span></div>
      </div>
      <button class="cp-x" data-x>✕</button>
    </div>
    <div class="cp-note">이 날만 <b>네이버·공비서 온라인 예약</b>에 예약 가능으로 노출돼요.</div>
    <div class="cp-field">
      <div class="cp-label">영업시간 <span class="req">*</span></div>
      <div class="cp-times">${timeSel('cpS',mDraft.s)}<span class="cp-tilde">~</span>${timeSel('cpE',mDraft.e)}</div>
    </div>
    <div class="cp-field">
      <div class="cp-label">담당자 <span class="req">*</span></div>
      <div class="cp-msel">
        <button type="button" class="cp-trig" id="cpTrig"><span id="cpSum" class="cp-sum-ph">담당자 선택</span><span class="cp-caret">▾</span></button>
        <div class="cp-panel" id="cpPanel" hidden>
          <div class="cp-search"><input id="cpSearch" placeholder="담당자 이름 검색"><span class="cp-search-ico">🔍</span></div>
          <div class="cp-list" id="cpStaff"></div>
        </div>
      </div>
    </div>
    <div class="cp-actions">
      ${isEdit?'<button class="cp-del" data-del>삭제</button>':'<span></span>'}
      <div class="cp-right">
        <button class="cp-cancel" data-x>취소</button>
        <button class="cp-save" data-save>${isEdit?'수정 완료':'임시 영업일 등록'}</button>
      </div>
    </div>`;
  mPop.appendChild(pop);
  document.body.appendChild(mPop);

  mPop.querySelectorAll('[data-x]').forEach(b=>b.addEventListener('click',closeFloaters));
  // 담당자: 접이식 드롭다운 + 검색 + 체크리스트(다인원 대응, 단정)
  const trig=mPop.querySelector('#cpTrig'), panel=mPop.querySelector('#cpPanel'),
        sumEl=mPop.querySelector('#cpSum'), staffBox=mPop.querySelector('#cpStaff'), searchEl=mPop.querySelector('#cpSearch');
  function staffSummary(){
    const n=mDraft.staff.length;
    if(!n) return {t:'담당자 선택', ph:true};
    if(n===M_STAFF.length) return {t:`전체 ${n}명`, ph:false};
    const first=M_STAFF[[...mDraft.staff].sort((a,b)=>a-b)[0]].n;
    return {t: n>1?`${first} 외 ${n-1}명`:first, ph:false};
  }
  function renderStaff(){
    const f=(searchEl?.value||'').trim();
    const all=mDraft.staff.length===M_STAFF.length;
    const list=M_STAFF.map((s,i)=>({s,i})).filter(o=>!f||o.s.n.includes(f));
    let h=`<button type="button" class="cp-row cp-row-all ${all?'on':''}" data-all><span class="cp-rl">전체 ${M_STAFF.length}명</span><span class="cp-ck"></span></button>`;
    h+=list.map(({s,i})=>`<button type="button" class="cp-row ${mDraft.staff.includes(i)?'on':''}" data-staff="${i}"><span class="cp-rl"><span class="cp-sd" style="background:${s.c}"></span>${s.n}</span><span class="cp-ck"></span></button>`).join('')
      || `<div class="cp-empty">검색 결과 없음</div>`;
    staffBox.innerHTML=h;
    const sm=staffSummary(); sumEl.textContent=sm.t; sumEl.className=sm.ph?'cp-sum-ph':'';
  }
  trig.addEventListener('click',e=>{ e.stopPropagation(); panel.hidden=!panel.hidden; trig.classList.toggle('open',!panel.hidden); if(!panel.hidden&&searchEl)searchEl.focus(); });
  staffBox.addEventListener('click',e=>{
    if(e.target.closest('[data-all]')){
      mDraft.staff = (mDraft.staff.length===M_STAFF.length)?[]:M_STAFF.map((_,i)=>i);
      renderStaff(); return;
    }
    const r=e.target.closest('[data-staff]'); if(!r)return;
    const i=+r.dataset.staff, at=mDraft.staff.indexOf(i);
    if(at>-1)mDraft.staff.splice(at,1); else mDraft.staff.push(i);
    renderStaff();
  });
  if(searchEl)searchEl.addEventListener('input',renderStaff);
  renderStaff();
  mPop.querySelector('#cpS').addEventListener('change',e=>mDraft.s=e.target.value);
  mPop.querySelector('#cpE').addEventListener('change',e=>mDraft.e=e.target.value);
  const del=mPop.querySelector('[data-del]');
  if(del)del.addEventListener('click',()=>{ delete M_TEMP_OPEN[day]; closeFloaters(); refreshViews(); });
  mPop.querySelector('[data-save]').addEventListener('click',()=>{
    if(mDraft.e<=mDraft.s){ alert('종료 시간은 시작 시간보다 늦어야 해요.'); return; }
    if(!mDraft.staff.length){ alert('담당자를 1명 이상 선택해 주세요.'); return; }
    M_TEMP_OPEN[day]={s:mDraft.s,e:mDraft.e,staff:[...mDraft.staff]};
    closeFloaters(); refreshViews();
  });
}

/* ============ TIME GRID builders ============ */
function buildGutter(elId){
  const g=document.getElementById(elId);
  HOURS.forEach((h,i)=>{
    const row=document.createElement('div');
    row.className='hour';
    if(i>0) row.innerHTML=`<span>${fmtHour(h)}</span>`;
    g.appendChild(row);
  });
}
function buildColumns(elId,count){
  const wrap=document.getElementById(elId);
  const cols=[];
  for(let c=0;c<count;c++){
    const col=document.createElement('div');
    col.className='tg-col';
    HOURS.forEach((h,i)=>{
      const hr=document.createElement('div');
      hr.className='hour';
      if(i===0) hr.classList.add('closed'); // pre-open hatched block
      col.appendChild(hr);
    });
    wrap.appendChild(col);
    cols.push(col);
  }
  return cols;
}
function addEventCard(col,{variant,start,end,name,desc,time,naver}){
  const card=document.createElement('div');
  card.className=`ev-card ev-card--${variant}`;
  card.style.top=yOf(start)+'px';
  card.style.height=(yOf(end)-yOf(start))+'px';
  card.innerHTML=`
    <div class="ev-name"><span class="ev-wlogo">W</span>${name}</div>
    <div class="ev-desc">${desc}</div>
    <div class="ev-time">${time}</div>
    ${naver?'<div class="ev-naver">N</div>':''}`;
  col.appendChild(card);
}
/* 동시간 겹침: 레인 배치 + 좌우 분할 (폭 좁아지면 축약) */
function placeOverlap(col, events){
  // 실제 서비스 방식: 카드끼리 겹치지 않게, 겹치는 수만큼 width를 나눠 나란히 배치
  const items=[...events].sort((a,b)=>a.start-b.start);
  const laneEnd=[];  // 그리디 구간 분할: 동시에 겹치는 최대 개수 = 분할 수
  items.forEach(it=>{ let l=laneEnd.findIndex(e=>e<=it.start); if(l<0){l=laneEnd.length;laneEnd.push(it.end);}else laneEnd[l]=it.end; it.lane=l; });
  const N=laneEnd.length;
  items.forEach(it=>{
    const card=document.createElement('div');
    card.className=`ev-card ev-card--${it.variant} ev-card--split`+(N===2?' ev-card--lane2':N>=3?' ev-card--lane3':'');
    card.style.setProperty('--lane',it.lane); card.style.setProperty('--lanes',N);  // width 분할은 CSS가 계산
    card.style.top=yOf(it.start)+'px';
    card.style.height=(yOf(it.end)-yOf(it.start))+'px';
    card.innerHTML=`<div class="ev-name"><span class="ev-wlogo">W</span>${it.name}</div><div class="ev-desc">${it.desc}</div><div class="ev-time">${it.time}</div>${it.naver?'<div class="ev-naver">N</div>':''}`;
    col.appendChild(card);
  });
}
function addBlock(col,{start,end,label}){
  const b=document.createElement('div');
  b.className='ev-block';
  b.style.top=yOf(start)+'px';
  b.style.height=(yOf(end)-yOf(start))+'px';
  b.textContent=label;
  col.appendChild(b);
}

/* ============ WEEK VIEW ============ */
// 임시영업(11/17)이 보이는 주: 11.16(일)~11.22(토)
function renderWeek(){
  const WK=[16,17,18,19,20,21,22], WD=['일','월','화','수','목','금','토'];
  const head=document.getElementById('weekDayCols');
  head.innerHTML='<div class="gut"></div>';
  document.getElementById('weekGutter').innerHTML='';   // 재렌더 시 중복 방지
  document.getElementById('weekColumns').innerHTML='';
  const offCols=[];
  WK.forEach((n,i)=>{
    const el=document.createElement('div');
    const temp=M_TEMP_OPEN[n], off=(i===M_REG_OFF_COL)&&!temp;
    el.className='dc clickable '+(i===0?'sun':i===6?'sat':'')+(n===M_TODAY?' selected':'');
    if(temp)el.classList.add('dc-temp'); if(off){el.classList.add('dc-off'); offCols.push(i);}
    const tag = temp?`<span class="dc-tag temp">임시영업</span>` : off?`<span class="dc-tag off">휴무</span>`:'';
    el.innerHTML=`<span class="pill">11. ${n} ${WD[i]}</span>${tag}`;
    el.addEventListener('click',e=>{ e.stopPropagation();
      openWeekMenu(el, n, temp?'open':off?'off':'biz'); // 헤더 아래 드롭다운
    });
    head.appendChild(el);
  });
  buildGutter('weekGutter');
  const cols=buildColumns('weekColumns',7);
  offCols.forEach(i=>cols[i].classList.add('col-off'));   // 휴무 컬럼 빗금
  if(M_TEMP_OPEN[17]) cols[1].classList.add('col-temp');  // 임시영업 컬럼 강조
  // events
  addEventCard(cols[3],{
    variant:'blue',start:10,end:11,name:'김고객',
    desc:'손>젤네일 여름한정 디자인 및 스톤 추가외에도 이름이 길어질 경우 표시되는 방식은 이렇게 됩니다.',
    time:'오전 10:00 - 11:00',naver:true});

  buildMini('weekMini',{
    title:'2025.11', mode:'week', selectedRow:3, dayCircle:null,
    statTitle:'주간 일정 상세',
    stats:[['📅','예약','25 건'],['⊗','예약 취소','5 건'],['📍','노쇼','5 건'],['⊘','예약 막기','1 건']]
  });
}
renderWeek();

/* ============ DAY VIEW ============ */
// 일 뷰 기준일: 11.17(월) — 정기휴무 → 직원 헤더에서 임시 영업일 설정 시연
const DAY_N=17, DAY_OFF=((6+(DAY_N-1))%7)===M_REG_OFF_COL;
// 일 뷰 담당자 — 다인원(가로 스크롤/한눈에 보기 시연). 드래그 모듈과 공용
const DAY_STAFF=[
  {n:'담당자없음',c:'#B4B9C0'},{n:'공대남',c:'#227EFF'},{n:'김직원이',c:'#9B7CFF'},
  {n:'박실장',c:'#1DC9B7'},{n:'이디자이너',c:'#FF6B6B'},{n:'최원장',c:'#FFB020'},
  {n:'정수석',c:'#2BB0ED'},{n:'강매니저',c:'#E64980'},{n:'윤디자',c:'#7048E8'},
  {n:'임실장',c:'#12B886'},{n:'한선생',c:'#FA5252'},{n:'오대리',c:'#4C6EF5'},{n:'서디자',c:'#F06595'},
  {n:'신매니',c:'#227EFF'},{n:'권원장',c:'#9B7CFF'},{n:'황실장',c:'#1DC9B7'},{n:'안수석',c:'#FF6B6B'},
  {n:'송디자',c:'#FFB020'},{n:'전매니',c:'#2BB0ED'},{n:'홍선생',c:'#E64980'},{n:'문대리',c:'#7048E8'},
  {n:'양실장',c:'#12B886'},{n:'구디자',c:'#FA5252'},{n:'배수석',c:'#4C6EF5'},{n:'조매니',c:'#F06595'},
  {n:'남디자',c:'#227EFF'},{n:'유실장',c:'#1DC9B7'},{n:'표선생',c:'#E64980'},{n:'하대리',c:'#12B886'},
];  // 29명 (최대 인원 시나리오)
(function renderDay(){
  const staff=DAY_STAFF;
  const view=document.getElementById('view-day');
  view.style.setProperty('--dcols', staff.length);
  const head=document.getElementById('dayStaff');
  head.innerHTML='<div class="gut"></div>';
  staff.forEach(s=>{
    const el=document.createElement('div');
    el.className='st clickable';
    el.innerHTML=`<span class="sdot" style="background:${s.c}"></span><span class="stn">${s.n}</span>`;
    el.addEventListener('click',e=>{ e.stopPropagation(); openDayStaffMenu(el, s.n); });
    head.appendChild(el);
  });
  buildGutter('dayGutter');
  const cols=buildColumns('dayColumns',staff.length);
  if(DAY_OFF && !M_TEMP_OPEN[DAY_N]) cols.forEach(c=>c.classList.add('col-off')); // 휴무 → 컬럼 빗금
  // demo 예약 — 여러 담당자에 분산(한눈에 보기 시 폭 축소·카드 축약 시연)
  // 상태 다양하게 — 드래그가 각 상태 색 위에서도 잘 보이는지 검증용
  addEventCard(cols[0],{variant:'blue',start:9,end:10,name:'김고객',desc:'손>젤네일 (예약 확정)',time:'오전 9:00 - 10:00',naver:true});
  addEventCard(cols[2],{variant:'sales',start:9,end:11,name:'이고객',desc:'속눈썹 연장 (매출 등록)',time:'오전 9:00 - 11:00',naver:false});
  addEventCard(cols[3],{variant:'ongoing',start:11,end:12.5,name:'박고객',desc:'손>젤제거 (시술 중)',time:'오전 11:00 - 12:30',naver:true});
  addEventCard(cols[5],{variant:'noshow',start:10,end:11.5,name:'최고객',desc:'발>페디큐어 (노쇼)',time:'오전 10:00 - 11:30',naver:false});
  addEventCard(cols[7],{variant:'visit',start:13,end:14,name:'정고객',desc:'반영구 (매장 방문)',time:'오후 1:00 - 2:00',naver:false});
  addEventCard(cols[9],{variant:'cancel',start:12,end:13,name:'한고객',desc:'왁싱 (예약 취소)',time:'오후 12:00 - 1:00',naver:true});
  // 동시간 겹침 데모 — 2건(col4) / 3건(col6)
  placeOverlap(cols[4],[
    {variant:'blue',start:9.5,end:11,name:'김고객',desc:'손>젤네일 여름한정',time:'9:30-11:00',naver:true},
    {variant:'purple',start:10,end:11.5,name:'이고객',desc:'속눈썹 연장',time:'10:00-11:30'},
  ]);
  placeOverlap(cols[6],[
    {variant:'blue',start:9.5,end:10.5,name:'박고객',desc:'젤제거',time:'9:30-10:30'},
    {variant:'ongoing',start:9.83,end:11,name:'최고객',desc:'페디큐어',time:'9:50-11:00',naver:true},
    {variant:'purple',start:10.17,end:11.67,name:'정고객',desc:'왁싱',time:'10:10-11:40'},
  ]);
  // 나머지 담당자 열도 군데군데 1~3건씩 채움(실서비스처럼 자연스럽게 · 일부는 비워둠)
  const FILL=[
    [1,[{variant:'blue',start:9.5,end:10.5,name:'서고객',desc:'손>젤네일',time:'오전 9:30 - 10:30',naver:true}]],
    [8,[{variant:'visit',start:14,end:15.5,name:'문고객',desc:'속눈썹 연장',time:'오후 2:00 - 3:30'},
        {variant:'blue',start:14.5,end:16,name:'배고객',desc:'왁싱',time:'오후 2:30 - 4:00',naver:true}]],  // 2건 겹침
    [10,[{variant:'ongoing',start:13.5,end:15,name:'조고객',desc:'발>페디큐어',time:'오후 1:30 - 3:00'}]],
    [11,[{variant:'sales',start:10.5,end:12,name:'윤고객',desc:'속눈썹 연장',time:'오전 10:30 - 12:00'},
         {variant:'blue',start:11,end:12.5,name:'장고객',desc:'손>젤',time:'오전 11:00 - 12:30',naver:true}]],  // 2건 겹침
    [12,[{variant:'blue',start:9,end:10,name:'권고객',desc:'젤네일',time:'오전 9:00 - 10:00',naver:true}]],
    [13,[{variant:'noshow',start:11,end:12.5,name:'황고객',desc:'왁싱',time:'오전 11:00 - 12:30'},
         {variant:'visit',start:11.5,end:13,name:'안고객',desc:'반영구',time:'오전 11:30 - 1:00'}]],  // 2건 겹침
    [15,[{variant:'sales',start:10,end:11.5,name:'남고객',desc:'속눈썹',time:'오전 10:00 - 11:30'}]],
    [16,[{variant:'blue',start:13,end:14.5,name:'유고객',desc:'젤네일',time:'오후 1:00 - 2:30',naver:true},
         {variant:'ongoing',start:13.5,end:15,name:'표고객',desc:'젤제거',time:'오후 1:30 - 3:00'}]],  // 2건 겹침
    [18,[{variant:'visit',start:9.5,end:11,name:'하고객',desc:'페디큐어',time:'오전 9:30 - 11:00'}]],
    [19,[{variant:'blue',start:11,end:12.5,name:'구고객',desc:'젤네일',time:'오전 11:00 - 12:30',naver:true},
         {variant:'cancel',start:11.5,end:13,name:'백고객',desc:'왁싱',time:'오전 11:30 - 1:00'},
         {variant:'ongoing',start:12,end:13.5,name:'천고객',desc:'속눈썹',time:'오후 12:00 - 1:30',naver:true}]],  // 3건 겹침
    [21,[{variant:'sales',start:10,end:11,name:'주고객',desc:'젤',time:'오전 10:00 - 11:00'}]],
    [22,[{variant:'blue',start:14,end:15,name:'노고객',desc:'젤네일',time:'오후 2:00 - 3:00',naver:true}]],
    [24,[{variant:'ongoing',start:9.5,end:10.5,name:'심고객',desc:'페디',time:'오전 9:30 - 10:30'},
         {variant:'visit',start:9.83,end:11,name:'추고객',desc:'반영구',time:'오전 9:50 - 11:00'}]],  // 2건 겹침
    [25,[{variant:'blue',start:13.5,end:15,name:'방고객',desc:'속눈썹',time:'오후 1:30 - 3:00',naver:true}]],
    [27,[{variant:'sales',start:10.5,end:12,name:'고고객',desc:'왁싱',time:'오전 10:30 - 12:00'},
         {variant:'blue',start:11,end:12.5,name:'명고객',desc:'젤',time:'오전 11:00 - 12:30',naver:true}]],  // 2건 겹침
    [28,[{variant:'visit',start:11,end:12.5,name:'양고객',desc:'케어',time:'오전 11:00 - 12:30'}]],
  ];
  FILL.forEach(([ci,evs])=>{ if(!cols[ci])return; evs.length===1?addEventCard(cols[ci],evs[0]):placeOverlap(cols[ci],evs); });

  buildMini('dayMini',{
    title:'2025.11', mode:'day', selectedRow:3, dayCircle:17,
    statTitle:'일정 상세',
    stats:[['📅','예약','8 건'],['⊗','예약 취소','0 건'],['📍','노쇼','3 건'],['⊘','예약 막기','2 건']]
  });
  // 보기 방식 토글: 기본 보기(균등 분할) / 전체 보기(최소폭+스크롤)
  const fitBtn=document.getElementById('dayFitToggle');
  function updateNarrow(){
    const c=document.querySelectorAll('#dayColumns .tg-col')[1] || document.querySelector('#dayColumns .tg-col');
    if(!c) return;
    const w=c.getBoundingClientRect().width, fit=view.classList.contains('is-fit');
    view.classList.toggle('is-narrow', fit && w<118);   // 카드 간격 소폭 조정(정보 축약 없음)
    // 담당자 이름 폰트는 컨테이너 쿼리(clamp)로 폭에 비례 축소 — JS 불필요
  }
  function applyFit(on){
    view.classList.toggle('is-fit',on);
    if(fitBtn){ fitBtn.classList.toggle('out',on); fitBtn.querySelector('.fit-tx').textContent = on?'전체 보기':'기본 보기'; }
    updateNarrow();
  }
  if(fitBtn){
    // 재진입 유지: 프론트 전용 디바이스 저장(localStorage). 로그아웃 시 키 삭제로 리셋(프로토타입 범위 외). 계정별 동기화는 백엔드 필요
    let saved=null; try{ saved=localStorage.getItem('gongbizDayView'); }catch(e){}
    if(saved==='fit') applyFit(true);
    fitBtn.addEventListener('click',e=>{ e.stopPropagation();
      const on=!view.classList.contains('is-fit');
      applyFit(on);
      try{ localStorage.setItem('gongbizDayView', on?'fit':'basic'); }catch(e){}
    });
    window.addEventListener('resize',()=>{ if(view.classList.contains('is-fit')) updateNarrow(); });
  }
})();

/* ============ LIST VIEW ============ */
(function renderList(){
  // 상태: done(매출등록) noshow done-strike wait cancel block
  const ROWS=[
    {st:'done',  time:'오전 8:00 - 오전 9:00', dur:'1시간', label:'매출 등록', naver:true,
     cust:'홍길동 01012345678', staff:'김디자이너', svc:'손>젤제거', memo:'메모 없음', memoMuted:true},
    {st:'noshow', time:'오전 8:00 - 오전 9:00', dur:'1시간', label:'노쇼', strike:true,
     cust:'홍길동 01012345678', staff:'김디자이너', svc:'마용>젤제거', memo:'메모 없음', memoMuted:true},
    {st:'wait',  time:'오전 8:00 - 오전 9:00', dur:'1시간', label:'예약 대기', naver:true,
     cust:'홍길동 01012345678', staff:'김디자이너', svc:'예약서비스 예약 고객 가나라마사아자차가나라마사아자차가나라…', clamp:true},
    {st:'cancel', time:'오전 8:00 - 오전 9:00', dur:'1시간', label:'예약 취소', strike:true, muted:true,
     cust:'홍길동 01012345678 앵두 | 아바시나인 | 5kg', staff:'김디자이너', svc:'밤>젤제거',
     memo:'예약서비스 예약 고객 가나라마사아자차가나라마사아자차가나라…', clamp:true},
    {st:'block', time:'오전 8:00 - 오전 9:00', dur:'1시간', label:'예약 막기', muted:true,
     cust:'세미나 참여', staff:'공대남', svc:'7월 25일 뷰티 컨퍼런스 참여'},
  ];
  const naverBadge='<span class="lr-n">N</span>';
  document.getElementById('listRows').innerHTML = ROWS.map(r=>`
    <div class="lrow lrow--${r.st} ${r.muted?'is-muted':''} ${r.strike?'is-strike':''}">
      <span class="lr-bar"></span>
      <div class="lr-col lr-c1">
        <div class="lr-time">${r.time} <span class="lr-dur">(${r.dur})</span></div>
        <div class="lr-label">${r.label}${r.naver?naverBadge:''}</div>
      </div>
      <div class="lr-col lr-c2">
        <div class="lr-cust">${r.cust}</div>
        <div class="lr-staff">${r.staff}</div>
      </div>
      <div class="lr-col lr-c3">
        <div class="lr-svc ${r.clamp?'clamp':''}">${r.svc}</div>
        <div class="lr-memo ${r.memoMuted?'muted':''} ${r.clamp?'clamp':''}">${r.memo||''}</div>
      </div>
    </div>`).join('');

  buildMini('listMini',{
    title:'2025.11', mode:'day', selectedRow:3, dayCircle:17,
    statTitle:'일정 상세',
    stats:[['📅','예약','5 건'],['⊗','예약 취소','0 건'],['📍','노쇼','3 건'],['⊘','예약 막기','2 건']]
  });
  // Today 좌측 '임시 영업일 설정' 버튼 — 리스트는 클릭 대상이 없어 헤더에 배치
  const lcBtn=document.getElementById('lcTempBtn');
  if(lcBtn) lcBtn.addEventListener('click',e=>{ e.stopPropagation(); openTempPop(lcBtn, 17, !!M_TEMP_OPEN[17]); });
})();

/* ============ MINI CALENDAR ============ */
function buildMini(elId,opt){
  // hardcoded grid matching design (July). 6 rows x 7 cols
  const grid=[
    [26,27,28,29,30,1,2],
    [3,4,5,6,7,8,9],
    [10,11,12,13,14,15,16],
    [17,18,19,20,21,22,23],
    [24,25,26,27,28,29,30],
    [31,1,2,3,4,5,6],
  ];
  // which cells are "other month": row0 first 5 (26-30 prev), row5 last 6 (1-6 next)
  const isOther=(r,col)=> (r===0 && col<5) || (r===5 && col>0);
  const reds=[18,19,20]; // sample holiday markers
  // pseudo counts per in-month day
  const counts={};
  [2,3,4,5,1,2,3, 4,2,1,3,5,1,2, 3,12,5,1,2,4,2, 5,3,12,1,22,12, 2,11,5,4,2,1, 3,1,4,5,2,3].forEach((v,i)=>counts[i]=v);

  const wd=['일','월','화','수','목','금','토'];
  let html=`<div class="mini-head">
      <button>‹</button><div class="mtit">${opt.title}</div><button>›</button>
    </div>
    <div class="mini-weekdays">${wd.map((d,i)=>`<span class="${i===0?'sun':i===6?'sat':''}">${d}</span>`).join('')}</div>
    <div class="mini-grid ${opt.mode==='week'?'week-sel':''}">`;
  if(opt.mode==='week'){
    html+=`<div class="row-sel" style="top:${opt.selectedRow*52}px"></div>`;
  }
  let idx=0;
  grid.forEach((row,r)=>{
    row.forEach((n,col)=>{
      const other=isOther(r,col);
      const inWeek = opt.mode==='week' && r===opt.selectedRow;
      const dayCircle = opt.mode==='day' && r===opt.selectedRow && n===opt.dayCircle;
      let cls='mini-cell';
      if(other)cls+=' other';
      else if(reds.includes(n) && !inWeek)cls+=' sun-c';
      else if(col===0)cls+=' sun-c';
      else if(col===6)cls+=' sat-c';
      if(inWeek)cls+=' in-week';
      const cnt = other ? '' : (counts[idx]||'');
      const numHtml = dayCircle ? `<span class="num-wrap">${n}</span>` : n;
      html+=`<div class="${cls}${dayCircle?' day-sel':''}">
          <span class="cnt">${cnt}</span>${numHtml}</div>`;
      idx++;
    });
  });
  html+=`</div>
    <div class="mini-divider"></div>
    <div class="mini-sec-title">${opt.statTitle}</div>
    <div class="mini-stats">
      ${opt.stats.map(s=>`<div class="mini-stat"><span class="si">${s[0]}</span><span class="sl">${s[1]}</span><span class="sv">${s[2]}</span></div>`).join('')}
    </div>
    <div class="mini-foot">⌃ 접기</div>`;
  document.getElementById(elId).innerHTML=html;
}

/* deep-link to a view for previews: ?view=week , 임시영업 팝오버: ?pop=add|edit */
(function(){
  const q=new URLSearchParams(location.search);
  const v=q.get('view');
  if(v && views[v]){document.querySelector(`.cb-tab[data-view="${v}"]`)?.click();}
  const wk=q.get('wk'); // 주 헤더 드롭다운 미리보기: wk=17(휴무)|18(영업)
  if(wk){ document.querySelector('.cb-tab[data-view="week"]')?.click();
    setTimeout(()=>{ const dcs=[...document.querySelectorAll('#weekDayCols .dc')]; const idx=[16,17,18,19,20,21,22].indexOf(+wk); if(idx>=0)dcs[idx]?.click(); },0); }
  const ds=q.get('dstaff'); // 일 뷰 직원 헤더 메뉴 미리보기: dstaff=1(공대남 등)
  if(ds){ document.querySelector('.cb-tab[data-view="day"]')?.click();
    setTimeout(()=>document.querySelectorAll('#dayStaff .st')[+ds]?.click(),0); }
  if(q.get('hov')){ document.querySelector('.mcell[data-off-day]')?.classList.add('demo-hover'); } // hover 단서 미리보기
  const p=q.get('pop');  // 미리보기: add=휴무칸 시트, edit=임시영업칸 시트, biz=영업일 시트, editor=설정 모달
  if(p) setTimeout(()=>{
    if(p==='editor'||p==='staff'){ const c=document.querySelector('.mcell[data-off-day]'); if(c) openTempPop(c, +c.dataset.offDay, false); if(p==='staff') document.querySelector('#cpTrig')?.click(); return; }
    const sel = p==='edit' ? '.mcell[data-temp-day] .open-badge'
              : p==='biz'  ? '.mcell.clickable:not(.off):not(.openday)'
              : '.mcell[data-off-day]';
    document.querySelector(sel)?.click();
  },0);
})();

/* close naver toast */
document.querySelector('.nt-close').addEventListener('click',e=>{
  e.target.closest('.naver-toast').style.display='none';
});

/* ============ 드래그 예약: 변경(이동·리사이즈) + 등록 — 주·일 뷰 공통 ============
   · 빈 슬롯 세로 드래그 → 실제 공비서 2-step 예약 등록 모달 (담당자·시작·시술시간 프리필)
   · 기존 예약 카드 본문 드래그 → 이동(시간/컬럼 변경), 카드 하단 8px 드래그 → 시간 조정
   일 뷰 컬럼=담당자, 주 뷰 컬럼=날짜. 기존 직원 헤더 메뉴 등 다른 동선은 유지. */
(function(){
  // DAY_STAFF는 상단(renderDay)에서 정의한 공용 목록 사용
  const WK=[16,17,18,19,20,21,22], WD=['일','월','화','수','목','금','토'];
  const SERVICES=[{n:'손 > 젤네일',dur:90},{n:'손 > 젤제거',dur:30},{n:'손 > 케어',dur:60},
    {n:'발 > 페디큐어',dur:60},{n:'속눈썹 연장',dur:60},{n:'왁싱',dur:30},{n:'반영구',dur:120}];
  const CUSTOMERS=[
    {n:'김민아',phone:'01063522969',staff:'CX파트트',tag:'네이버 예약 고객',naver:true},
    {n:'김제크',phone:'01041584484',staff:'naver원장',meta:'1,015,420원 | 15회',tag:'단골 고객'},
    {n:'유창민',phone:'01050077082',staff:'naver원장',tag:'네이버 예약 고객',naver:true},
    {n:'임정민',phone:'01046020118',staff:'노페이직원1',tag:'네이버 예약 고객',naver:true},
  ];
  const DURATIONS=[30,60,90,120,150,180];
  const OPEN_MIN=HOURS[0]*60, CLOSE_MIN=HOURS[HOURS.length-1]*60+60, SNAP=15;
  const RESIZE_ZONE=9;
  const MAX_DUR=330;  // 최대 예약 길이(분). 실제는 간격 단위별 상이(10분→350·30분→330), 데모는 330 캡

  const durLabel=m=>(m>=60?`${Math.floor(m/60)}시간`:'')+(m%60?`${m>=60?' ':''}${m%60}분`:'');
  const bkFmt=m=>{const h=Math.floor(m/60),mm=m%60,ap=h<12?'오전':'오후',hh=h<=12?h:h-12;return `${ap} ${hh}:${String(mm).padStart(2,'0')}`;};
  const bkRange=(s,e)=>`${bkFmt(s)} - ${bkFmt(e)}`;
  const minToY=m=>(m/60 - HOURS[0])*HOUR_PX;
  const pxToMin=px=>px/HOUR_PX*60 + HOURS[0]*60;
  const clampMin=m=>Math.max(OPEN_MIN,Math.min(CLOSE_MIN,m));
  const snapMin=m=>clampMin(Math.round(m/SNAP)*SNAP);
  const timeOpts=sel=>{let o='';for(let m=OPEN_MIN;m<=CLOSE_MIN;m+=SNAP)o+=`<option value="${m}" ${m===sel?'selected':''}>${bkFmt(m)}</option>`;return o;};

  /* ghost */
  let ghost=null;
  function showGhost(col,s,e,hint){
    if(!ghost){ghost=document.createElement('div');ghost.className='bk-ghost';}
    if(ghost._col!==col){col.appendChild(ghost);ghost._col=col;}
    ghost.style.top=minToY(s)+'px';
    ghost.style.height=Math.max(22,minToY(e)-minToY(s))+'px';
    ghost.innerHTML=`<div class="g-time">${bkRange(s,e)}</div>${hint?`<div class="g-hint">${hint}</div>`:''}`;
  }
  const clearDim=()=>document.querySelectorAll('.bk-under').forEach(c=>c.classList.remove('bk-under'));
  function dimUnder(col,s,e){                 // 선택 범위와 겹치는 예약/막기만 dim (그 영역만)
    clearDim();
    col.querySelectorAll('.ev-card, .ev-block').forEach(card=>{
      const cs=cardStart(card), ce=cs+cardDur(card);
      if(cs<e && ce>s) card.classList.add('bk-under');
    });
  }
  const killGhost=()=>{if(ghost){ghost.remove();ghost._col=null;} clearDim();};

  const cardStart=card=>snapMin(pxToMin(parseFloat(card.style.top)||0));
  const cardDur=card=>Math.round((parseFloat(card.style.height)||0)/HOUR_PX*60/SNAP)*SNAP;
  const setCardTime=(card,s,e)=>{const t=card.querySelector('.ev-time');if(t)t.textContent=bkRange(s,e);};

  /* ===== 한 타임그리드(주 또는 일)에 드래그 바인딩 ===== */
  function bindGrid(wrapId, ctxOf){
    const wrap=document.getElementById(wrapId);
    if(!wrap) return;
    const liveCols=()=>[...wrap.querySelectorAll(':scope > .tg-col')];
    const colFromX=x=>{const cs=liveCols();for(let i=0;i<cs.length;i++){const r=cs[i].getBoundingClientRect();if(x>=r.left&&x<r.right)return i;}return null;};
    const yIn=(col,clientY)=>clientY-col.getBoundingClientRect().top;
    let drag=null;

    wrap.addEventListener('pointerdown',e=>{
      const cols=liveCols();
      const ci=colFromX(e.clientX); if(ci==null)return;
      const card=e.target.closest('.ev-card');
      if(card){
        const rect=card.getBoundingClientRect();
        const relY=e.clientY-rect.top;
        card.classList.add('dragging'); wrap.setPointerCapture(e.pointerId);
        if(relY<RESIZE_ZONE)                        // 위 끝 → 시작 시간 조정(종료 고정)
          drag={mode:'resizeTop',card,end:cardStart(card)+cardDur(card),initStart:cardStart(card)};
        else if(relY>rect.height-RESIZE_ZONE)       // 아래 끝 → 종료 시간 조정(시작 고정)
          drag={mode:'resize',card,start:cardStart(card),initEnd:cardStart(card)+cardDur(card)};
        else drag={mode:'move',card,dur:cardDur(card),grabY:yIn(cols[ci],e.clientY)-(parseFloat(card.style.top)||0),
                   initStart:cardStart(card),initCol:cols.indexOf(card.parentElement)};
        return;
      }
      const s=snapMin(pxToMin(yIn(cols[ci],e.clientY)));
      drag={mode:'create',ci,anchor:s,start:s,end:s+SNAP,moved:false};
      wrap.setPointerCapture(e.pointerId);
      showGhost(cols[ci],s,s+30,'드래그해서 시간 지정');
    });

    wrap.addEventListener('pointermove',e=>{
      if(!drag)return;
      const cols=liveCols();
      if(drag.mode==='create'){
        const cur=snapMin(pxToMin(yIn(cols[drag.ci],e.clientY))); drag.moved=true;
        let lo=Math.min(drag.anchor,cur), hi=Math.max(drag.anchor,cur);   // 아래→위 드래그도 허용
        if(hi-lo<SNAP)hi=lo+SNAP;
        if(hi-lo>MAX_DUR){ if(cur<drag.anchor)lo=hi-MAX_DUR; else hi=lo+MAX_DUR; }
        drag.start=lo; drag.end=hi;
        showGhost(cols[drag.ci],lo,hi,'');
        dimUnder(cols[drag.ci],lo,hi);           // 겹치는 예약/막기만 dim
      } else if(drag.mode==='move'){
        let ci=colFromX(e.clientX); if(ci==null)ci=cols.indexOf(drag.card.parentElement);
        let start=snapMin(pxToMin(yIn(cols[ci],e.clientY)-drag.grabY));
        if(start+drag.dur>CLOSE_MIN)start=CLOSE_MIN-drag.dur;
        drag.card.style.top=minToY(start)+'px';
        if(drag.card.parentElement!==cols[ci])cols[ci].appendChild(drag.card);
        setCardTime(drag.card,start,start+drag.dur);
        drag.pStart=start; drag.pCol=ci;
      } else if(drag.mode==='resize'){            // 아래 끝: 종료 시간
        let end=snapMin(pxToMin(yIn(drag.card.parentElement,e.clientY)));
        if(end<drag.start+SNAP)end=drag.start+SNAP;
        if(end-drag.start>MAX_DUR)end=drag.start+MAX_DUR;
        drag.card.style.height=(minToY(end)-minToY(drag.start))+'px';
        drag.card.classList.toggle('ev-card--short',minToY(end)-minToY(drag.start)<54);
        setCardTime(drag.card,drag.start,end); drag.pEnd=end;
      } else {                                     // resizeTop, 위 끝: 시작 시간
        let start=snapMin(pxToMin(yIn(drag.card.parentElement,e.clientY)));
        if(start>drag.end-SNAP)start=drag.end-SNAP;
        if(drag.end-start>MAX_DUR)start=drag.end-MAX_DUR;
        drag.card.style.top=minToY(start)+'px';
        drag.card.style.height=(minToY(drag.end)-minToY(start))+'px';
        drag.card.classList.toggle('ev-card--short',minToY(drag.end)-minToY(start)<54);
        setCardTime(drag.card,start,drag.end); drag.pStart=start;
      }
    });

    wrap.addEventListener('pointerup',e=>{
      if(!drag)return; const d=drag; drag=null;
      if(d.mode==='create'){
        killGhost();
        let end=d.end; if(!d.moved||end-d.start<SNAP)end=d.start+60;
        openCreateChoice(wrapId,d.ci,d.start,clampMin(end),ctxOf,e.clientX,e.clientY);
      } else {
        d.card.classList.remove('dragging');
        const cols=liveCols();
        if(d.mode==='move'){
          const moved=(d.pStart!=null&&d.pStart!==d.initStart)||(d.pCol!=null&&d.pCol!==d.initCol);
          if(moved){const c=ctxOf(d.pCol);showToast(`예약을 ${c.label} · ${bkFmt(d.pStart)}(으)로 옮겼어요`);}
        } else if(d.mode==='resize'){
          if(d.pEnd!=null&&d.pEnd!==d.initEnd)showToast(`예약 시간을 ${durLabel(d.pEnd-d.start)}(으)로 조정했어요`);
        } else if(d.mode==='resizeTop'){
          if(d.pStart!=null&&d.pStart!==d.initStart)showToast(`예약 시간을 ${durLabel(d.end-d.pStart)}(으)로 조정했어요`);
        }
      }
    });
  }

  /* ===== 생성 카드 ===== */
  function addNewCard(col,staffIdx,start,end,cust,svc,naver){
    const s=DAY_STAFF[staffIdx]||DAY_STAFF[0];
    const card=document.createElement('div');
    card.className='ev-card ev-card--new'+((minToY(end)-minToY(start))<54?' ev-card--short':'');
    card.style.setProperty('--c',s.c);
    card.style.top=minToY(start)+'px';
    card.style.height=(minToY(end)-minToY(start))+'px';
    card.innerHTML=`<div class="ev-name"><span class="ev-dot"></span>${cust}</div>
      <div class="ev-desc">${svc}</div><div class="ev-time">${bkRange(start,end)}</div>
      ${naver?'<div class="ev-naver">N</div>':''}`;
    col.appendChild(card);
  }

  /* ===== 드래그 후 선택: 예약 등록 / 예약 막기 ===== */
  let choiceMask=null;
  const closeChoice=()=>{if(choiceMask){choiceMask.remove();choiceMask=null;}};
  function openCreateChoice(wrapId,ci,start,end,ctxOf,px,py){
    closeChoice();
    choiceMask=document.createElement('div'); choiceMask.className='bk-choice-mask';
    const menu=document.createElement('div'); menu.className='bk-choice';
    menu.innerHTML=`
      <div class="bk-choice-time">${bkRange(start,end)}</div>
      <button data-act="book"><span class="ci">＋</span>예약 등록</button>
      <button data-act="block"><span class="ci">⊘</span>예약 막기</button>`;
    choiceMask.appendChild(menu); document.body.appendChild(choiceMask);
    const mw=280, mh=menu.offsetHeight, gap=8;
    let left=(px||innerWidth/2)-mw/2, top=(py||innerHeight/2)-mh/2;
    left=Math.max(12,Math.min(left,innerWidth-mw-12));
    top=Math.max(12,Math.min(top,innerHeight-mh-12));
    menu.style.left=left+'px'; menu.style.top=top+'px';
    choiceMask.addEventListener('pointerdown',ev=>{ if(ev.target===choiceMask)closeChoice(); });
    menu.querySelector('[data-act="book"]').onclick=()=>{ closeChoice(); openBooking(wrapId,ci,start,end,ctxOf); };
    menu.querySelector('[data-act="block"]').onclick=()=>{ closeChoice(); placeBlock(wrapId,ci,start,end,ctxOf); };
  }
  function placeBlock(wrapId,ci,start,end,ctxOf){
    const col=[...document.getElementById(wrapId).querySelectorAll(':scope > .tg-col')][ci];
    const b=document.createElement('div'); b.className='ev-block ev-block--new';
    b.style.top=minToY(start)+'px'; b.style.height=(minToY(end)-minToY(start))+'px';
    b.innerHTML=`<div class="eb-label">🚫 예약 막기</div><div class="eb-time">${bkRange(start,end)}</div>`;
    col.appendChild(b);
    const c=ctxOf(ci);
    showToast(`${c.label} · ${bkRange(start,end)} 예약을 막았어요`);
  }

  /* ===== 예약 등록 모달 (2-step) ===== */
  let mask=null;
  const closeBk=()=>{if(mask){mask.remove();mask=null;}};
  function openBooking(wrapId,ci,start,end,ctxOf){
    closeBk();
    const meta=ctxOf(ci);
    const ctx={wrapId,ci,start,dur:end-start,staffDefault:meta.staffDefault,dateLabel:meta.dateLabel,cust:null};
    mask=document.createElement('div');mask.className='bk-mask';
    mask.addEventListener('pointerdown',ev=>{if(ev.target===mask)closeBk();});
    const modal=document.createElement('div');modal.className='bk-modal';
    mask.appendChild(modal);document.body.appendChild(mask);
    step1(modal,ctx);
  }
  function step1(modal,ctx){
    const card=c=>`<div class="cust" data-p="${c.phone}">
      <div class="cust-r1"><div class="cust-name">${c.n}<span class="chev">›</span>${c.meta?`<span class="meta">${c.meta}</span>`:''}</div><div class="cust-noshow">노쇼 0</div></div>
      <div class="cust-r2"><div class="cust-phone">${c.phone}</div><div class="cust-staff">${c.staff}</div></div>
      ${c.tag?`<div class="cust-tag">${c.tag}</div>`:''}</div>`;
    modal.innerHTML=`<div class="m-head"><div class="t">예약 등록</div><button class="m-x">✕</button></div>
      <div class="m-body">
        <div class="pills"><button class="pill-btn" data-new>신규 고객 등록</button><button class="pill-btn" data-skip>고객 등록 없이 진행</button></div>
        <div class="m-search"><input placeholder="고객 이름, 연락처, 메모" id="bkSearch"><span class="ico">🔍</span></div>
        <div class="cust-list" id="bkList">${CUSTOMERS.map(card).join('')}</div>
      </div>`;
    modal.querySelector('.m-x').onclick=closeBk;
    const list=modal.querySelector('#bkList'),search=modal.querySelector('#bkSearch');
    list.addEventListener('click',ev=>{const el=ev.target.closest('.cust');if(!el)return;ctx.cust=CUSTOMERS.find(c=>c.phone===el.dataset.p);step2(modal,ctx);});
    modal.querySelector('[data-skip]').onclick=()=>{ctx.cust={n:'고객 미지정'};step2(modal,ctx);};
    modal.querySelector('[data-new]').onclick=()=>{ctx.cust={n:'신규 고객'};step2(modal,ctx);};
    search.addEventListener('input',()=>{const f=search.value.trim();
      list.innerHTML=CUSTOMERS.filter(c=>!f||c.n.includes(f)||c.phone.includes(f)).map(card).join('')||`<div class="cust-tag" style="text-align:center;padding:20px">검색 결과가 없어요</div>`;});
    setTimeout(()=>search.focus(),30);
  }
  function step2(modal,ctx){
    const st={start:ctx.start,staff:ctx.staffDefault,dur:ctx.dur,svc:''};
    const staffOpts=DAY_STAFF.map((s,i)=>`<option value="${i}" ${i===st.staff?'selected':''}>${s.n}</option>`).join('');
    const svcOpts=`<option value="" disabled selected>시술 메뉴를 선택해 주세요.</option>`+SERVICES.map(s=>`<option value="${s.n}" data-dur="${s.dur}">${s.n}</option>`).join('');
    const durOpts=DURATIONS.map(m=>`<option value="${m}" ${m===st.dur?'selected':''}>${durLabel(m)}</option>`).join('');
    modal.innerHTML=`<div class="m-head"><div class="t">'${ctx.cust.n}'님 예약 등록</div><button class="m-x">✕</button></div>
      <div class="m-body">
        <div class="f"><label class="f-l"><span class="lt">예약 일시 <span class="req">*</span></span><span class="rep-toggle">반복 예약 <span class="sw"></span></span></label>
          <div class="f-row"><div class="sel-wrap" style="flex:1.2"><div class="ctl">${ctx.dateLabel}</div><span class="date-ico">📅</span></div><div class="sel-wrap"><select class="ctl" id="bkS">${timeOpts(st.start)}</select></div></div></div>
        <div class="f"><label class="f-l"><span class="lt">담당자 <span class="req">*</span></span></label><div class="sel-wrap"><select class="ctl" id="bkStaff">${staffOpts}</select></div></div>
        <div class="f"><label class="f-l"><span class="lt">시술 메뉴 <span class="req">*</span></span></label><div class="sel-wrap"><select class="ctl ph" id="bkSvc">${svcOpts}</select></div></div>
        <div class="f"><label class="f-l"><span class="lt">시술 시간 <span class="req">*</span></span></label><div class="sel-wrap"><select class="ctl" id="bkDur">${durOpts}</select></div></div>
        <div class="f"><label class="f-l"><span class="lt">예약금 <span class="tag-mem">회원권 보유 고객</span></span></label>
          <div class="won-row"><input class="ctl" id="bkDep" inputmode="numeric" value="0" disabled><span class="won">원</span></div>
          <div class="chk-row"><div class="chk on" id="bkDepChk"><span class="box">✓</span>예약금 받지 않기</div><span class="link">예약금 설정 ›</span></div></div>
        <div class="f"><label class="f-l"><span class="lt">예약 메모</span><span class="link">최근 매출 메모 ›</span></label><textarea placeholder="예약과 관련된 메모가 있다면 작성해 주세요."></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" id="bkPrev">이전</button><button class="btn-primary" id="bkSave" disabled>등록</button></div>`;
    modal.querySelector('.m-x').onclick=closeBk;
    modal.querySelector('#bkPrev').onclick=()=>step1(modal,ctx);
    const svcEl=modal.querySelector('#bkSvc'),durEl=modal.querySelector('#bkDur'),sEl=modal.querySelector('#bkS'),
          staffEl=modal.querySelector('#bkStaff'),depEl=modal.querySelector('#bkDep'),depChk=modal.querySelector('#bkDepChk'),saveEl=modal.querySelector('#bkSave');
    svcEl.addEventListener('change',()=>{svcEl.classList.remove('ph');st.svc=svcEl.value;const d=+svcEl.selectedOptions[0].dataset.dur;if(d){st.dur=d;durEl.value=String(d);}saveEl.disabled=!st.svc;});
    durEl.addEventListener('change',()=>st.dur=+durEl.value);
    sEl.addEventListener('change',()=>st.start=+sEl.value);
    staffEl.addEventListener('change',()=>st.staff=+staffEl.value);
    depChk.addEventListener('click',()=>{const on=!depChk.classList.contains('on');depChk.classList.toggle('on',on);depEl.disabled=on;if(on)depEl.value='0';});
    saveEl.onclick=()=>{
      const end=clampMin(st.start+st.dur);
      const col=[...document.getElementById(ctx.wrapId).querySelectorAll(':scope > .tg-col')][ctx.ci];
      addNewCard(col,st.staff,st.start,end,ctx.cust.n,st.svc,!!ctx.cust.naver);
      closeBk(); showToast(`${ctx.cust.n}님 예약을 등록했어요`);
    };
  }

  /* ===== 컬럼 컨텍스트: 일=담당자, 주=날짜 ===== */
  const dayCtx=ci=>({label:(DAY_STAFF[ci]||DAY_STAFF[0]).n, staffDefault:ci, dateLabel:`2025. 11. ${DAY_N} (${['일','월','화','수','목','금','토'][(6+(DAY_N-1))%7]})`});
  const weekCtx=ci=>({label:`11.${WK[ci]} ${WD[ci]}`, staffDefault:0, dateLabel:`2025. 11. ${WK[ci]} (${WD[ci]})`});

  bindGrid('dayColumns', dayCtx);
  bindGrid('weekColumns', weekCtx);
})();
