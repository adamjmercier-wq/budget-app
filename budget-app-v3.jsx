import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { load, save } from "./storage";

// ============================================================
// PERSISTENT STORAGE
// ============================================================
const SK = {
  transactions: "ncb:tx", projections: "ncb:proj", incomeProjections: "ncb:inc",
  loans: "ncb:loans", categories: "ncb:cats", categoryGroups: "ncb:groups",
  accounts: "ncb:accts", monthlyHistory: "ncb:hist", lastUpdated: "ncb:updated",
  mortgage: "ncb:mortgage",
};


// ============================================================
// SEED DATA
// ============================================================
const SEED_HISTORY = {"2025-02":{"Car Payment":1000,"Coffee":251.4,"Dance":45.32,"Disney":15.99,"Gasoline":573.32,"Google One":2.13,"Groceries":1678.62,"Heat":229.95,"Internet":60,"Life Insurance":23.15,"Meds/Doctor":277.5,"Mortgage":3032.22,"Peacock":7.99,"Personal":994.9},"2025-03":{"Car Payment":1608.91,"Coffee":445.31,"Dance":45.32,"Disney":15.99,"Gasoline":541.38,"Google One":2.13,"Groceries":2081.8,"Heat":268.41,"Internet":60,"Life Insurance":23.15,"Meds/Doctor":223.33,"Mortgage":3032.22,"Moving":3871.84,"PBS":7,"Peacock":7.99,"Personal":671.1,"Prime":134.86},"2025-04":{"Car Payment":1000,"Coffee":429.04,"Disney":15.99,"Gasoline":478.71,"Google One":2.13,"Groceries":2024.19,"Heat":217.87,"Internet":60,"Life Insurance":23.15,"Meds/Doctor":103.52,"Mortgage":3032.22,"Moving":2171.99,"Peacock":7.99,"Personal":2346.25,"Water/Sewer":258.46},"2025-05":{"Audible":14.95,"Car Payment":1000,"Coffee":345.96,"Disney":15.99,"Gasoline":260.53,"Google One":2.13,"Groceries":2593.25,"Heat":163.06,"Internet":60,"Life Insurance":23.15,"Meds/Doctor":119.34,"Mortgage":3032.22,"Moving":1934.63,"Peacock":7.99,"Personal":1140.84},"2025-06":{"Audible":14.95,"Car Insurance":1806.3,"Coffee":193.66,"Disney":15.99,"Gasoline":330.92,"Google One":2.13,"Groceries":3575.29,"Gym":120,"Heat":112.4,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":327.34,"Moving":1685.13,"Peacock":7.99,"Personal":1888.28,"Tex":75},"2025-07":{"Audible":14.95,"Car Insurance":328.35,"Coffee":113.82,"Disney":15.99,"Electric":23.79,"Gasoline":664.16,"Google One":5.33,"Groceries":3295.75,"Gym":80,"Heat":37.43,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":110.31,"Mortgage":2120.02,"Peacock":7.99,"Personal":2095.83,"Tex":75},"2025-08":{"Audible":14.95,"Car Payment":300,"Coffee":262.01,"Disney":15.99,"Electric":194.94,"Gasoline":282.57,"Google One":4,"Groceries":2672.93,"Gym":80,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":972.47,"Mortgage":2120.02,"PBS":7,"Peacock":10.99,"Personal":2880.97,"Tex":75},"2025-09":{"Audible":14.95,"Car Payment":300,"Coffee":158.21,"Dance":51.5,"Disney":15.99,"Electric":232.28,"Gasoline":432.93,"Gifts/Events":362.64,"Google One":19.63,"Groceries":2310.96,"Gym":80,"Heat":650,"Internet":76.01,"Life Insurance":23.15,"Meds/Doctor":98.86,"Mortgage":2120.02,"PBS":4.99,"Peacock":10.99,"Personal":1612.11,"Tex":75},"2025-10":{"Audible":14.95,"Car Payment":300,"Coffee":230.47,"Dance":51.5,"Disney":38.99,"Electric":212.99,"Gasoline":419.89,"Gifts/Events":1188,"Google One":21.39,"Groceries":2918.13,"Gym":80,"Heat":667.67,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":434.88,"Mortgage":2120.02,"Netflix":7.99,"Peacock":10.99,"Personal":1197.65,"Student Loan":308.84,"Tex":75},"2025-11":{"Car Payment":300,"Coffee":102.96,"Dance":226.5,"Disney":38.99,"Electric":183.61,"Gasoline":245.97,"Gifts/Events":195,"Google One":33.49,"Groceries":1899.82,"Gym":80,"Heat":377.18,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":185.65,"Mortgage":2120.02,"Netflix":7.99,"Personal":1850.74,"Pets":98.26,"Student Loan":407.22,"Tex":75,"Water/Sewer":456},"2025-12":{"Car Insurance":1641.9,"Dance":51.5,"Electric":215.09,"Gym":80,"Heat":309.98,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":1621.97,"Mortgage":2120.02,"Personal":1910.13,"Student Loan":98.38,"Tex":75,"Xbox":15.93},"2026-01":{"Car Payment":300,"Coffee":173.18,"Dance":21.88,"Disney":38.99,"Electric":294.52,"Gasoline":449.54,"Gifts/Events":526.41,"Google One":20.24,"Groceries":2372.22,"Heat":593.96,"Internet":80,"Life Insurance":23.15,"Meds/Doctor":2159.41,"Mortgage":2120.02,"Netflix":7.99,"PBS":4.99,"Peacock":10.99,"Personal":1489.49,"Pets":154.32,"SimpliSafe":32.99,"Student Loan":407.22,"Xbox":15.93}};

const DEFAULT_CATEGORIES = [
  "Mortgage","Life Insurance","Electric","Heat","Internet","Dance","Water/Sewer","SimpliSafe",
  "Car Payment","Student Loan","Gasoline","Car Insurance",
  "Groceries","Coffee","Pets","Meds/Doctor","Gym","Tex",
  "Personal","Disney","Peacock","PBS","Netflix","Audible","Google One","Xbox","Prime",
  "Gifts/Events","Moving","Consulting Expense","Income","Ignore"
];

const DEFAULT_GROUPS = {
  "Bills":["Mortgage","Life Insurance","Electric","Heat","Internet","Dance","Water/Sewer","SimpliSafe"],
  "Debt/Projects":["Car Payment","Student Loan"],
  "Transportation":["Gasoline","Car Insurance"],
  "Food":["Groceries","Coffee","Pets"],
  "Health":["Meds/Doctor","Gym","Tex"],
  "Personal":["Personal","Gifts/Events","Moving"],
  "Subscriptions":["Disney","Peacock","PBS","Netflix","Audible","Google One","Xbox","Prime"],
  "Business":["Consulting Expense"],
};

const DEFAULT_PROJ = {"Mortgage":2293.28,"Life Insurance":23.15,"Electric":250,"Heat":200,"Internet":80,"Dance":51.5,"Water/Sewer":0,"SimpliSafe":33,"Car Payment":300,"Student Loan":407.22,"Gasoline":400,"Car Insurance":0,"Groceries":1500,"Coffee":150,"Pets":150,"Meds/Doctor":50,"Gym":0,"Tex":0,"Personal":200,"Gifts/Events":0,"Moving":0,"Disney":38.99,"Peacock":11,"PBS":7,"Netflix":0,"Audible":15,"Google One":4,"Xbox":0,"Prime":0,"Consulting Expense":0};

const DEFAULT_INC = {"Theresa 1":2191.35,"Theresa 2":2191.35,"Adam (Consulting/Driving)":2000,"Other":0};

const DEFAULT_LOANS = [
  {id:"l1",name:"T Loan #2",balance:2467.6,rate:6.55,minPay:15.67,endDate:"2036-08"},
  {id:"l2",name:"T Loan #1",balance:5581.98,rate:6.55,minPay:34.32,endDate:"2036-08"},
  {id:"l3",name:"T Loan #5",balance:10729.04,rate:4.05,minPay:69.28,endDate:"2036-04"},
  {id:"l4",name:"A Loan 4",balance:10832.7,rate:8.08,minPay:19.48,endDate:"2037-03"},
  {id:"l5",name:"A Loan 3",balance:11154.91,rate:8.08,minPay:19.75,endDate:"2037-08"},
  {id:"l6",name:"A Loan 2",balance:11326.43,rate:7.05,minPay:19.72,endDate:"2037-05"},
  {id:"l7",name:"T Loan #3",balance:14005.01,rate:6.35,minPay:83.26,endDate:"2036-08"},
  {id:"l8",name:"T Loan #4",balance:16600.38,rate:5.83,minPay:105.94,endDate:"2036-07"},
  {id:"l9",name:"2020 Ascent (Car)",balance:16665.98,rate:5.56,minPay:297.39,endDate:"2031-07"},
  {id:"l10",name:"A Loan 1",balance:23153.26,rate:7.05,minPay:39.43,endDate:"2037-05"},
];

const DEFAULT_MORTGAGE = {balance:249656.8,rate:6.5,minPay:2293.28,endDate:"2055-06"};
const DEFAULT_ACCTS = {"Rockland":{balance:0,lastUpdated:""},"Passumpsic":{balance:0,lastUpdated:""}};

// ============================================================
// AUTO-CATEGORIZATION
// ============================================================
const AUTO_RULES = [
  {p:/payroll|essex north|direct deposit/i,c:"Income"},
  {p:/dovenmuehle|mortg/i,c:"Mortgage"},{p:/spectrum/i,c:"Internet"},
  {p:/eversource|web_pay/i,c:"Electric"},{p:/rancourt energy|fitch fuel|dead river/i,c:"Heat"},
  {p:/simplisafe/i,c:"SimpliSafe"},
  {p:/advs ed serv|studntloan|american education/i,c:"Student Loan"},
  {p:/shell|irving|sunoco|exxon|mobil|citgo|northwoods truck|vip 49/i,c:"Gasoline"},
  {p:/geico|progressive|car insurance|nh turnpike|e-zpass/i,c:"Car Insurance"},
  {p:/shaw|walmart|instacart|market basket|price chopper|aldi|dalton country|family dollar/i,c:"Groceries"},
  {p:/dunkin|starbucks|coffee/i,c:"Coffee"},{p:/chewy/i,c:"Pets"},
  {p:/walgreens|cvs|pillpack|pharmacy|headway|cbdfx|zoloft/i,c:"Meds/Doctor"},
  {p:/disney/i,c:"Disney"},{p:/peacock/i,c:"Peacock"},{p:/netflix/i,c:"Netflix"},
  {p:/audible/i,c:"Audible"},{p:/google.*one/i,c:"Google One"},
  {p:/microsoft|xbox/i,c:"Xbox"},{p:/pbs/i,c:"PBS"},{p:/prime|amazon prime/i,c:"Prime"},
  {p:/google.*workspace|netlify|anthropic|square.*nextc/i,c:"Consulting Expense"},
  {p:/venmo/i,c:"Personal"},{p:/amazon|target/i,c:"Personal"},
  {p:/panera|burger king|mcdonald|taco bell|wendy|subway|pizza|slice\*/i,c:"Personal"},
  {p:/kay barbersh/i,c:"Personal"},{p:/transfer|nsf fee|overdraft/i,c:"Ignore"},
];

function autoCat(desc) { for (const r of AUTO_RULES) { if (r.p.test(desc)) return r.c; } return null; }

function mapPassCat(bankCat, desc) {
  const m = {"Groceries":"Groceries","Healthcare & Pharmacy":"Meds/Doctor","Utilities":"Heat","Loans":"Student Loan","Travel & Commute":"Gasoline","Deposits":"Income","Online Services":"Consulting Expense","Personal Care & Fitness":"Personal"};
  return m[bankCat] || autoCat(desc);
}

// ============================================================
// XLSX PARSERS
// ============================================================
function parseDate(val) {
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) return val.substring(0,10);
  if (typeof val === "string" && val.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
    const p = val.split("/"); const y = p[2].length === 2 ? "20"+p[2] : p[2];
    return `${y}-${p[0].padStart(2,"0")}-${p[1].padStart(2,"0")}`;
  }
  if (typeof val === "number") { const d = new Date((val-25569)*86400*1000); return d.toISOString().split("T")[0]; }
  return "";
}

function parseRockland(rows) {
  const txs = []; let bal = null;
  for (const r of rows) {
    const desc = String(r["Description"]||"").trim();
    const debit = parseFloat(r["Debit"])||0, credit = parseFloat(r["Credit"])||0;
    if (!debit && !credit) continue;
    const isInc = credit > 0 && !debit, amt = isInc ? credit : debit;
    const date = parseDate(r["Post Date"]); if (!date) continue;
    const b = parseFloat(r["Balance"]); if (b && bal === null) bal = b;
    const cat = isInc ? "Income" : autoCat(desc);
    txs.push({id:crypto.randomUUID(),date,description:desc,amount:amt,category:cat||"",account:"Rockland",isIncome:isInc,autoMatched:!!cat});
  }
  return {transactions:txs,latestBalance:bal};
}

function parsePassumpsic(rows) {
  const txs = []; let bal = null;
  for (const r of rows) {
    const desc = String(r["Description"]||"").trim();
    const ext = String(r["Extended Description"]||"").trim();
    const raw = parseFloat(r["Amount"])||0; if (!raw) continue;
    const isInc = raw > 0, amt = Math.abs(raw);
    const date = parseDate(r["Posting Date"]); if (!date) continue;
    const b = parseFloat(r["Balance"]); if (b && bal === null) bal = b;
    const bankCat = String(r["Transaction Category"]||"").trim();
    const cat = isInc ? "Income" : (mapPassCat(bankCat, ext||desc) || autoCat(ext||desc));
    txs.push({id:crypto.randomUUID(),date,description:desc,amount:amt,category:cat||"",account:"Passumpsic",isIncome:isInc,autoMatched:!!cat,bankCategory:bankCat});
  }
  return {transactions:txs,latestBalance:bal};
}

// ============================================================
// UTILS
// ============================================================
const fmt = n => n == null || isNaN(n) ? "$0.00" : new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const fmtS = n => { if (n == null || isNaN(n)) return "$0"; if (Math.abs(n)>=1000) return "$"+(n/1000).toFixed(1)+"k"; return "$"+Math.round(n); };
const curMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const ML = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const mLabel = ym => { if (!ym) return ""; const [y,m] = ym.split("-"); return `${ML[parseInt(m)-1]} ${y}`; };
const dateToYM = d => d ? d.substring(0,7) : "";
const futureDate = (monthsAhead) => { const d = new Date(); d.setMonth(d.getMonth()+monthsAhead); return `${ML[d.getMonth()]} ${d.getFullYear()}`; };
const GREEN="#1a5632",RED="#c44",GOLD="#b8860b",GRAY="#666",FH="'Playfair Display',serif",FB="'DM Sans',sans-serif";

// ============================================================
// UI COMPONENTS
// ============================================================
function Card({label,value,color,sub}) {
  return <div style={{background:"#f8f9fa",borderRadius:10,padding:"14px 16px",borderLeft:`4px solid ${color}`}}>
    <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color,fontFamily:FB}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{sub}</div>}
  </div>;
}

function Tab({active,onClick,children,badge}) {
  return <button onClick={onClick} style={{padding:"10px 18px",border:"none",borderBottom:active?`3px solid ${GREEN}`:"3px solid transparent",background:active?"rgba(26,86,50,0.08)":"transparent",color:active?GREEN:GRAY,fontWeight:active?700:500,fontSize:13,cursor:"pointer",position:"relative",fontFamily:FB,transition:"all 0.15s ease"}}>
    {children}
    {badge > 0 && <span style={{position:"absolute",top:4,right:2,background:RED,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 6px",fontWeight:700}}>{badge}</span>}
  </button>;
}

function Sec({children}) { return <h3 style={{fontSize:13,color:GREEN,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{children}</h3>; }

function LastUpdated({dates}) {
  const latest = Object.values(dates).filter(Boolean).sort().reverse()[0];
  if (!latest) return null;
  return <div style={{fontSize:11,color:"#aaa",marginTop:4}}>Last updated: {latest}</div>;
}

const inp = {padding:"6px 10px",border:"1px solid #ddd",borderRadius:6,fontSize:13};

// ============================================================
// IMPORT TAB
// ============================================================
function ImportTab({onImport,transactions,accounts,setAccounts,setLastUpdated}) {
  const [dragOver,setDragOver] = useState(false);
  const [importing,setImporting] = useState(false);
  const [result,setResult] = useState(null);
  const ref = useRef();

  async function handle(files) {
    setImporting(true); setResult(null);
    let allNew=[],errors=[],balUp={};
    for (const f of files) {
      try {
        const data = await f.arrayBuffer();
        const wb = XLSX.read(data,{type:"array",cellDates:true});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
        if (!rows.length) { errors.push(`${f.name}: empty`); continue; }
        const r0 = rows[0];
        const isR = "Account Number" in r0 || "Post Date" in r0;
        const isP = "Transaction ID" in r0 || "Posting Date" in r0;
        if (!isR && !isP) { errors.push(`${f.name}: unrecognized format`); continue; }
        const parsed = isR ? parseRockland(rows) : parsePassumpsic(rows);
        if (parsed.latestBalance !== null) balUp[isR?"Rockland":"Passumpsic"] = parsed.latestBalance;
        allNew.push(...parsed.transactions);
      } catch(e) { errors.push(`${f.name}: ${e.message}`); }
    }
    const keys = new Set(transactions.map(t=>`${t.date}|${t.amount}|${t.account}|${(t.description||"").substring(0,30)}`));
    const newTx = allNew.filter(t=>!keys.has(`${t.date}|${t.amount}|${t.account}|${(t.description||"").substring(0,30)}`));
    if (Object.keys(balUp).length) {
      const u = {...accounts};
      for (const [a,b] of Object.entries(balUp)) u[a] = {balance:b,lastUpdated:new Date().toISOString().split("T")[0]};
      setAccounts(u);
    }
    const today = new Date().toISOString().split("T")[0];
    setLastUpdated(prev => ({...prev, import: today, transactions: today}));
    setResult({total:allNew.length,new:newTx.length,dupes:allNew.length-newTx.length,unmatched:newTx.filter(t=>!t.autoMatched&&t.category!=="Income").length,errors,balUp});
    if (newTx.length) onImport(newTx);
    setImporting(false);
  }

  return <div style={{padding:24}}>
    <h2 style={{margin:"0 0 8px",fontSize:22,color:"#1a1a1a",fontFamily:FH}}>Import Bank Exports</h2>
    <p style={{color:GRAY,margin:"0 0 24px",fontSize:14}}>Upload .xlsx exports from Rockland or Passumpsic. Auto-categorized — review flagged items in Transactions.</p>
    <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handle(Array.from(e.dataTransfer.files))}} onClick={()=>ref.current?.click()}
      style={{border:`2px dashed ${dragOver?GREEN:"#ccc"}`,borderRadius:12,padding:48,textAlign:"center",cursor:"pointer",background:dragOver?"rgba(26,86,50,0.04)":"#fafafa",transition:"all 0.2s ease"}}>
      <input ref={ref} type="file" accept=".xlsx,.xls" multiple onChange={e=>handle(Array.from(e.target.files))} style={{display:"none"}} />
      <div style={{fontSize:40,marginBottom:12}}>📂</div>
      <div style={{fontSize:16,fontWeight:600,color:"#333"}}>{importing?"Processing...":"Drop bank exports here or click to browse"}</div>
      <div style={{fontSize:13,color:"#888",marginTop:6}}>Supports Rockland and Passumpsic .xlsx exports</div>
    </div>
    {result && <div style={{marginTop:20,padding:20,borderRadius:10,background:result.errors.length?"#fff3f3":"#f0f9f4",border:`1px solid ${result.errors.length?"#f5c6cb":"#c3e6cb"}`}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Import Complete</div>
      <div style={{fontSize:14,color:"#444",lineHeight:1.8}}>
        <strong>{result.new}</strong> new transactions imported.
        {result.dupes>0 && <> <strong>{result.dupes}</strong> duplicates skipped.</>}
        {Object.entries(result.balUp).map(([a,b])=><div key={a} style={{color:GREEN,fontWeight:600,marginTop:4}}>✓ {a} balance updated: {fmt(b)}</div>)}
        {result.unmatched>0 && <div style={{color:GOLD,fontWeight:600,marginTop:4}}>⚠ {result.unmatched} need categorization — check Transactions tab.</div>}
        {result.errors.map((e,i)=><div key={i} style={{color:RED,marginTop:4}}>Error: {e}</div>)}
      </div>
    </div>}
    <div style={{marginTop:32}}>
      <Sec>Account Balances</Sec>
      <p style={{fontSize:13,color:"#888",margin:"0 0 12px"}}>Auto-populated from imports. Adjust manually anytime.</p>
      <div style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
        {Object.entries(accounts).map(([n,info])=><div key={n} style={{background:"#f8f9fa",borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"#444",marginBottom:8}}>{n}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,color:"#888"}}>$</span>
            <input type="number" step="0.01" value={info.balance||""} onChange={e=>setAccounts(p=>({...p,[n]:{...p[n],balance:parseFloat(e.target.value)||0,lastUpdated:new Date().toISOString().split("T")[0]}}))}
              style={{flex:1,padding:"6px 10px",border:"1px solid #ddd",borderRadius:6,fontSize:14,fontWeight:600}} />
          </div>
          {info.lastUpdated && <div style={{fontSize:11,color:"#aaa",marginTop:4}}>Updated: {info.lastUpdated}</div>}
        </div>)}
      </div>
    </div>
  </div>;
}

// ============================================================
// TRANSACTIONS TAB (with filters)
// ============================================================
function TransactionsTab({transactions,onUpdate,onDelete,onAdd,categories,lastUpdated,setLastUpdated}) {
  const [filter,setFilter] = useState("all");
  const [monthF,setMonthF] = useState("");
  const [catF,setCatF] = useState("");
  const [acctF,setAcctF] = useState("");
  const [minAmt,setMinAmt] = useState("");
  const [maxAmt,setMaxAmt] = useState("");
  const [showAdd,setShowAdd] = useState(false);
  const [newTx,setNewTx] = useState({date:new Date().toISOString().split("T")[0],description:"",amount:"",category:"",account:"Rockland",isIncome:false});

  const months = useMemo(()=>{const m=new Set(); transactions.forEach(t=>{if(t.date)m.add(dateToYM(t.date))}); return Array.from(m).sort().reverse();},[transactions]);
  const accts = useMemo(()=>[...new Set(transactions.map(t=>t.account).filter(Boolean))].sort(),[transactions]);
  const usedCats = useMemo(()=>[...new Set(transactions.map(t=>t.category).filter(Boolean))].sort(),[transactions]);

  const filtered = useMemo(()=>{
    let txs = [...transactions].sort((a,b)=>b.date.localeCompare(a.date));
    if (filter==="unmatched") txs = txs.filter(t=>!t.category && !t.isIncome);
    if (filter==="income") txs = txs.filter(t=>t.isIncome || t.category==="Income");
    if (monthF) txs = txs.filter(t=>t.date.startsWith(monthF));
    if (catF) txs = txs.filter(t=>t.category===catF);
    if (acctF) txs = txs.filter(t=>t.account===acctF);
    if (minAmt) txs = txs.filter(t=>t.amount >= parseFloat(minAmt));
    if (maxAmt) txs = txs.filter(t=>t.amount <= parseFloat(maxAmt));
    return txs;
  },[transactions,filter,monthF,catF,acctF,minAmt,maxAmt]);

  const unmatched = transactions.filter(t=>!t.category && !t.isIncome).length;

  function addTx() {
    if (!newTx.amount||!newTx.category) return;
    const today = new Date().toISOString().split("T")[0];
    onAdd({id:crypto.randomUUID(),...newTx,amount:parseFloat(newTx.amount),autoMatched:true,isIncome:newTx.category==="Income"});
    setLastUpdated(p=>({...p,transactions:today}));
    setNewTx({date:new Date().toISOString().split("T")[0],description:"",amount:"",category:"",account:"Rockland",isIncome:false});
    setShowAdd(false);
  }

  function onCatChange(id,cat) {
    onUpdate(id,{category:cat,autoMatched:true});
    setLastUpdated(p=>({...p,transactions:new Date().toISOString().split("T")[0]}));
  }

  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
      <div>
        <h2 style={{margin:0,fontSize:22,color:"#1a1a1a",fontFamily:FH}}>Transactions</h2>
        <LastUpdated dates={{tx:lastUpdated.transactions}} />
      </div>
      <button onClick={()=>setShowAdd(!showAdd)} style={{padding:"8px 16px",border:"none",borderRadius:8,background:GREEN,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Manual Entry</button>
    </div>

    {showAdd && <div style={{background:"#f8f9fa",borderRadius:10,padding:16,marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
      <div><label style={{fontSize:11,color:GRAY,display:"block",marginBottom:3}}>Date</label><input type="date" value={newTx.date} onChange={e=>setNewTx({...newTx,date:e.target.value})} style={inp} /></div>
      <div><label style={{fontSize:11,color:GRAY,display:"block",marginBottom:3}}>Description</label><input value={newTx.description} onChange={e=>setNewTx({...newTx,description:e.target.value})} placeholder="e.g. Walmart" style={{...inp,width:180}} /></div>
      <div><label style={{fontSize:11,color:GRAY,display:"block",marginBottom:3}}>Amount</label><input type="number" step="0.01" value={newTx.amount} onChange={e=>setNewTx({...newTx,amount:e.target.value})} style={{...inp,width:90}} /></div>
      <div><label style={{fontSize:11,color:GRAY,display:"block",marginBottom:3}}>Category</label><select value={newTx.category} onChange={e=>setNewTx({...newTx,category:e.target.value})} style={inp}><option value="">Select...</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div><label style={{fontSize:11,color:GRAY,display:"block",marginBottom:3}}>Account</label><select value={newTx.account} onChange={e=>setNewTx({...newTx,account:e.target.value})} style={inp}><option>Rockland</option><option>Passumpsic</option></select></div>
      <button onClick={addTx} style={{padding:"7px 16px",background:GREEN,color:"#fff",border:"none",borderRadius:6,fontWeight:600,fontSize:13,cursor:"pointer"}}>Add</button>
    </div>}

    {/* Filter bar */}
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {[["all","All"],["unmatched","Needs Review" + (unmatched ? " (" + unmatched + ")" : "")],["income","Income"]].map(([v,l])=>
        <button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600,border:filter===v?`2px solid ${GREEN}`:"1px solid #ddd",background:filter===v?"rgba(26,86,50,0.08)":"#fff",color:filter===v?GREEN:GRAY,cursor:"pointer"}}>{l}</button>
      )}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center",fontSize:12}}>
      <select value={monthF} onChange={e=>setMonthF(e.target.value)} style={{...inp,fontSize:12}}><option value="">All months</option>{months.map(m=><option key={m} value={m}>{mLabel(m)}</option>)}</select>
      <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...inp,fontSize:12}}><option value="">All categories</option>{usedCats.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select value={acctF} onChange={e=>setAcctF(e.target.value)} style={{...inp,fontSize:12}}><option value="">All accounts</option>{accts.map(a=><option key={a} value={a}>{a}</option>)}</select>
      <input type="number" placeholder="Min $" value={minAmt} onChange={e=>setMinAmt(e.target.value)} style={{...inp,fontSize:12,width:70}} />
      <input type="number" placeholder="Max $" value={maxAmt} onChange={e=>setMaxAmt(e.target.value)} style={{...inp,fontSize:12,width:70}} />
      {(monthF||catF||acctF||minAmt||maxAmt) && <button onClick={()=>{setMonthF("");setCatF("");setAcctF("");setMinAmt("");setMaxAmt("")}} style={{border:"none",background:"none",color:RED,cursor:"pointer",fontSize:12,fontWeight:600}}>Clear filters</button>}
    </div>

    <div style={{fontSize:12,color:"#888",marginBottom:8}}>{filtered.length} transactions</div>
    <div style={{maxHeight:500,overflowY:"auto",border:"1px solid #eee",borderRadius:10}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"#f8f9fa",position:"sticky",top:0,zIndex:1}}>
          {["Date","Description","Amount","Category","Acct",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:600,color:"#555",borderBottom:"2px solid #eee",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.slice(0,200).map(tx=><tr key={tx.id} style={{borderBottom:"1px solid #f0f0f0",background:!tx.category&&!tx.isIncome?"rgba(200,68,68,0.04)":"transparent"}}>
            <td style={{padding:"8px 12px",whiteSpace:"nowrap",color:"#555"}}>{tx.date}</td>
            <td style={{padding:"8px 12px",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#333"}} title={tx.description}>{tx.description}</td>
            <td style={{padding:"8px 12px",fontWeight:600,color:tx.isIncome||tx.category==="Income"?GREEN:"#333",whiteSpace:"nowrap"}}>{tx.isIncome||tx.category==="Income"?"+":""}{fmt(tx.amount)}</td>
            <td style={{padding:"6px 8px"}}><select value={tx.category||""} onChange={e=>onCatChange(tx.id,e.target.value)} style={{padding:"4px 8px",border:`1px solid ${!tx.category?RED:"#ddd"}`,borderRadius:6,fontSize:12,width:"100%",maxWidth:150,background:!tx.category?"#fff5f5":"#fff"}}><option value="">⚠ Select...</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
            <td style={{padding:"8px 12px",color:"#888",fontSize:11}}>{tx.account}</td>
            <td style={{padding:"8px 6px"}}><button onClick={()=>onDelete(tx.id)} style={{border:"none",background:"none",color:"#bbb",cursor:"pointer",fontSize:16}}>×</button></td>
          </tr>)}
        </tbody>
      </table>
      {!filtered.length && <div style={{padding:40,textAlign:"center",color:"#999"}}>{transactions.length?`No transactions match filters.`:`No transactions yet.`}</div>}
    </div>
  </div>;
}

// ============================================================
// BUDGET TAB
// ============================================================
function BudgetTab({transactions,projections,setProjections,incomeProjections,setIncomeProjections,categoryGroups,accounts,monthlyHistory,lastUpdated}) {
  const [sel,setSel] = useState(curMonth);
  const months = useMemo(()=>{const m=new Set(); transactions.forEach(t=>{if(t.date)m.add(dateToYM(t.date))}); m.add(curMonth()); return Array.from(m).sort().reverse();},[transactions]);
  const mTx = useMemo(()=>transactions.filter(t=>t.date?.startsWith(sel)&&t.category&&t.category!=="Ignore"),[transactions,sel]);
  const actByCat = useMemo(()=>{const a={}; mTx.forEach(t=>{if(t.category!=="Income") a[t.category]=(a[t.category]||0)+t.amount}); return a;},[mTx]);
  const totInc = useMemo(()=>mTx.filter(t=>t.category==="Income").reduce((s,t)=>s+t.amount,0),[mTx]);
  const projInc = Object.values(incomeProjections).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const totProj = Object.values(projections).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const totAct = Object.values(actByCat).reduce((s,v)=>s+v,0);
  const cash = Object.values(accounts).reduce((s,a)=>s+(a.balance||0),0);

  // Historical ranges from seed + accumulated history
  const ranges = useMemo(()=>{
    const r={};
    const allM = Object.keys(monthlyHistory);
    for (const cat of Object.values(categoryGroups).flat()) {
      const vals = allM.filter(m=>m!==sel).map(m=>monthlyHistory[m]?.[cat]||0).filter(v=>v>0);
      if (vals.length>=2) r[cat] = {min:Math.min(...vals),max:Math.max(...vals),avg:vals.reduce((a,b)=>a+b,0)/vals.length,n:vals.length};
    }
    return r;
  },[monthlyHistory,categoryGroups,sel]);

  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div>
        <h2 style={{margin:0,fontSize:22,color:"#1a1a1a",fontFamily:FH}}>Monthly Budget</h2>
        <div style={{fontSize:14,color:GRAY,marginTop:4}}>
          <span style={{fontWeight:600}}>Projected:</span> {fmt(projInc)} in, {fmt(totProj)} out → <span style={{color:(projInc-totProj)>=0?GREEN:RED,fontWeight:700}}>{fmt(projInc-totProj)}</span>
        </div>
        <div style={{fontSize:14,color:"#333",marginTop:2}}>
          <span style={{fontWeight:600}}>Actual:</span> {fmt(totInc)} in, {fmt(totAct)} out → <span style={{color:(totInc-totAct)>=0?GREEN:RED,fontWeight:700}}>{fmt(totInc-totAct)}</span>
        </div>
        <LastUpdated dates={{budget:lastUpdated.budget,tx:lastUpdated.transactions}} />
      </div>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{padding:"8px 14px",border:"1px solid #ddd",borderRadius:8,fontSize:14,fontWeight:600}}>
        {months.map(m=><option key={m} value={m}>{mLabel(m)}</option>)}
      </select>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:24}}>
      <Card label="Cash on Hand" value={fmt(cash)} color={GREEN} sub={Object.entries(accounts).map(([n,a])=>`${n}: ${fmt(a.balance)}`).join(" · ")} />
      <Card label="Income Variance" value={(totInc-projInc>=0?"+":"")+fmt(totInc-projInc)} color={totInc>=projInc?GREEN:RED} />
      <Card label="Expense Variance" value={(totAct-totProj>0?"+":"")+fmt(totAct-totProj)} color={totAct<=totProj?GREEN:RED} />
      <Card label="Surplus / Deficit" value={fmt(totInc-totAct)} color={(totInc-totAct)>=0?GREEN:RED} />
    </div>

    {/* Income */}
    <div style={{marginBottom:24}}>
      <Sec>Income</Sec>
      <div style={{background:"#f8f9fa",borderRadius:10,padding:16}}>
        {Object.entries(incomeProjections).map(([s,v])=><div key={s} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <span style={{width:180,fontSize:13,color:"#444"}}>{s}</span>
          <input type="number" step="0.01" value={v} onChange={e=>setIncomeProjections(p=>({...p,[s]:e.target.value}))} style={{width:100,...inp,textAlign:"right"}} />
        </div>)}
        <div style={{borderTop:"1px solid #e0e0e0",marginTop:8,paddingTop:8,fontSize:13}}>
          <span style={{color:"#444"}}>Projected: <strong>{fmt(projInc)}</strong></span>{" · "}
          <span style={{color:GREEN}}>Actual: <strong>{fmt(totInc)}</strong></span>
        </div>
      </div>
    </div>

    {/* Expense groups */}
    {Object.entries(categoryGroups).map(([group,cats])=>{
      const gP = cats.reduce((s,c)=>s+(parseFloat(projections[c])||0),0);
      const gA = cats.reduce((s,c)=>s+(actByCat[c]||0),0);
      const gD = gA-gP;
      return <div key={group} style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Sec>{group}</Sec>
          <div style={{display:"flex",gap:16,fontSize:12}}>
            <span style={{color:"#888"}}>Proj: <strong>{fmt(gP)}</strong></span>
            <span style={{color:"#444"}}>Act: <strong>{fmt(gA)}</strong></span>
            <span style={{color:gD>0?RED:gD<0?GREEN:"#888",fontWeight:600}}>{gD>0?"+":""}{fmt(gD)}</span>
          </div>
        </div>
        <div style={{background:"#f8f9fa",borderRadius:10,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"130px 80px 80px 72px 110px 1fr",padding:"6px 14px",fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #eee"}}>
            <span>Category</span><span style={{textAlign:"right"}}>Projected</span><span style={{textAlign:"right"}}>Actual</span><span style={{textAlign:"right"}}>Var</span><span style={{textAlign:"center"}}>Hist. Range</span><span>Progress</span>
          </div>
          {cats.map(cat=>{
            const p=parseFloat(projections[cat])||0, a=actByCat[cat]||0, d=a-p, pct=p>0?a/p:0;
            const h=ranges[cat];
            return <div key={cat} style={{display:"grid",gridTemplateColumns:"130px 80px 80px 72px 110px 1fr",alignItems:"center",padding:"8px 14px",borderBottom:"1px solid #eee"}}>
              <span style={{fontSize:13,color:"#444"}}>{cat}</span>
              <input type="number" step="0.01" value={projections[cat]??""} onChange={e=>setProjections(p=>({...p,[cat]:e.target.value}))}
                style={{width:65,padding:"3px 6px",border:"1px solid #e0e0e0",borderRadius:5,fontSize:12,textAlign:"right",background:"#fff"}} />
              <span style={{fontSize:13,fontWeight:600,color:"#333",textAlign:"right",paddingRight:8}}>{a>0?fmt(a):"—"}</span>
              <span style={{fontSize:12,fontWeight:600,textAlign:"right",paddingRight:8,color:d>0?RED:d<0?GREEN:"#aaa"}}>{d?((d>0?"+":"")+fmt(d)):"—"}</span>
              <span style={{fontSize:10,color:"#999",textAlign:"center"}} title={h?`${h.n} months of data`:""}>{h?`${fmtS(h.min)}–${fmtS(h.max)}`:"—"}</span>
              <div style={{height:6,background:"#e9ecef",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${Math.min(pct*100,100)}%`,background:pct>1?RED:pct>0.85?GOLD:GREEN,transition:"width 0.3s ease"}} />
              </div>
            </div>;
          })}
        </div>
      </div>;
    })}
  </div>;
}

// ============================================================
// DEBT TAB
// ============================================================
function DebtTab({transactions,loans,setLoans,mortgage,setMortgage,lastUpdated,setLastUpdated}) {
  const [strategy,setStrategy] = useState("avalanche");
  const [extra,setExtra] = useState("");
  const [showTL,setShowTL] = useState(false);
  const [editing,setEditing] = useState(null);
  const [editMtg,setEditMtg] = useState(false);

  const cm = curMonth();
  const mTx = transactions.filter(t=>t.date?.startsWith(cm)&&t.category&&t.category!=="Ignore");
  const inc = mTx.filter(t=>t.category==="Income").reduce((s,t)=>s+t.amount,0);
  const exp = mTx.filter(t=>t.category!=="Income").reduce((s,t)=>s+t.amount,0);
  const surplus = inc-exp;
  const totalDebt = loans.reduce((s,l)=>s+l.balance,0);
  const totalMin = loans.reduce((s,l)=>s+l.minPay,0);
  const monthInt = loans.reduce((s,l)=>s+(l.balance*l.rate/100/12),0);
  const ex = parseFloat(extra)||Math.max(0,surplus);

  const sorted = useMemo(()=>{
    const s=[...loans].filter(l=>l.balance>0);
    if (strategy==="avalanche") s.sort((a,b)=>b.rate-a.rate);
    else if (strategy==="snowball") s.sort((a,b)=>a.balance-b.balance);
    else s.sort((a,b)=>(b.minPay/b.balance)-(a.minPay/a.balance));
    return s;
  },[loans,strategy]);

  const alloc = sorted.map(l=>({...l,extra:0,total:l.minPay}));
  let rem = ex;
  for (const a of alloc) { if (rem<=0) break; const mx=Math.max(0,a.balance-a.minPay); const ap=Math.min(rem,mx); if(ap>0){a.extra=ap;a.total=a.minPay+ap;rem-=ap;} }

  // Cascading timeline
  const timeline = useMemo(()=>{
    if (!showTL) return null;
    let states = loans.filter(l=>l.balance>0).map(l=>({...l,remaining:l.balance}));
    if (strategy==="avalanche") states.sort((a,b)=>b.rate-a.rate);
    else if (strategy==="snowball") states.sort((a,b)=>a.remaining-b.remaining);
    else states.sort((a,b)=>(b.minPay/b.remaining)-(a.minPay/a.remaining));

    const events=[]; let month=0,freed=0;
    const now = new Date();

    while(states.some(l=>l.remaining>0) && month<360) {
      month++;
      let avail = ex + freed;
      for (const l of states) { if(l.remaining>0) l.remaining += l.remaining*l.rate/100/12; }
      for (const l of states) {
        if(l.remaining>0) { const pay=Math.min(l.minPay,l.remaining); l.remaining-=pay;
          if(l.remaining<=0.01){l.remaining=0;freed+=l.minPay;
            const d=new Date(now); d.setMonth(d.getMonth()+month);
            events.push({month,name:l.name,type:"payoff",freed:l.minPay,date:`${ML[d.getMonth()]} ${d.getFullYear()}`,origEnd:l.endDate?mLabel(l.endDate):""});
          }
        }
      }
      for (const l of states) {
        if(l.remaining>0 && avail>0) { const pay=Math.min(avail,l.remaining); l.remaining-=pay; avail-=pay;
          if(l.remaining<=0.01){l.remaining=0;freed+=l.minPay;
            const d=new Date(now); d.setMonth(d.getMonth()+month);
            events.push({month,name:l.name,type:"payoff",freed:l.minPay,date:`${ML[d.getMonth()]} ${d.getFullYear()}`,origEnd:l.endDate?mLabel(l.endDate):""});
          }
          break;
        }
      }
      if (month%12===0) {
        const tot=states.reduce((s,l)=>s+l.remaining,0);
        events.push({month,type:"snapshot",total:tot,left:states.filter(l=>l.remaining>0).length});
      }
    }
    if (states.every(l=>l.remaining<=0.01)) {
      const d=new Date(now); d.setMonth(d.getMonth()+month);
      events.push({month,type:"debtfree",date:`${ML[d.getMonth()]} ${d.getFullYear()}`});
    }
    return {events,months:month};
  },[showTL,loans,ex,strategy]);

  // Mortgage timeline
  const mtgTimeline = useMemo(()=>{
    if (!showTL || !mortgage) return null;
    // Calculate months until loans are done
    const loansFreedDate = timeline?.events.find(e=>e.type==="debtfree");
    const monthsToFreedom = loansFreedDate?.month || 0;
    // After loans done, all loan minimums + extra go to mortgage
    const monthlyAfterLoans = totalMin + ex;
    let bal = mortgage.balance;
    let month = 0;
    // Phase 1: just minimum payments while paying loans
    while(month < monthsToFreedom && bal > 0) {
      month++;
      bal += bal * mortgage.rate / 100 / 12;
      bal -= Math.min(mortgage.minPay, bal);
    }
    // Phase 2: mortgage gets full firepower
    const phase2Start = month;
    while(bal > 0 && month < 600) {
      month++;
      bal += bal * mortgage.rate / 100 / 12;
      const pay = Math.min(mortgage.minPay + monthlyAfterLoans, bal);
      bal -= pay;
    }
    const now = new Date();
    const d = new Date(now); d.setMonth(d.getMonth()+month);
    return {totalMonths:month, payoffDate:`${ML[d.getMonth()]} ${d.getFullYear()}`, phase2Start, balAtPhase2:0};
  },[showTL,mortgage,timeline,totalMin,ex]);

  function editLoan(id,field,val) {
    setLoans(p=>p.map(l=>l.id===id?{...l,[field]:parseFloat(val)||0}:l));
    setLastUpdated(p=>({...p,debt:new Date().toISOString().split("T")[0]}));
  }

  return <div style={{padding:24}}>
    <div>
      <h2 style={{margin:"0 0 4px",fontSize:22,color:"#1a1a1a",fontFamily:FH}}>Debt Strategy</h2>
      <p style={{color:GRAY,margin:"0 0 4px",fontSize:14}}>Baby Step 2: Pay off all debt except the house. Surplus flows here.</p>
      <LastUpdated dates={{debt:lastUpdated.debt}} />
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,margin:"20px 0"}}>
      <Card label="Total Debt (excl. mortgage)" value={fmt(totalDebt)} color={RED} />
      <Card label="Monthly Minimums" value={fmt(totalMin)} color={GRAY} />
      <Card label="Monthly Interest" value={fmt(monthInt)} color={GOLD} />
      <Card label="Current Surplus" value={fmt(surplus)} color={surplus>=0?GREEN:RED} />
    </div>

    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
      {[["avalanche","🏔 Avalanche"],["snowball","⛄ Snowball"],["optimized","⚡ Optimized"]].map(([s,l])=>
        <button key={s} onClick={()=>setStrategy(s)} style={{padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:600,border:strategy===s?`2px solid ${GREEN}`:"1px solid #ddd",background:strategy===s?"rgba(26,86,50,0.08)":"#fff",color:strategy===s?GREEN:GRAY,cursor:"pointer"}}>{l}</button>
      )}
      <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
        <label style={{fontSize:13,color:GRAY}}>Extra/mo:</label>
        <input type="number" step="50" placeholder={Math.round(Math.max(0,surplus))+""} value={extra} onChange={e=>setExtra(e.target.value)} style={{width:100,...inp}} />
      </div>
    </div>

    {/* Loan table */}
    <div style={{border:"1px solid #eee",borderRadius:10,overflow:"hidden",marginBottom:20}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"#f8f9fa"}}>
          {["Loan","Balance","Rate","Min Pay",strategy==="optimized"?"Efficiency":"Extra","Total",""].map(h=>
            <th key={h} style={{padding:"10px 12px",textAlign:h==="Loan"?"left":"right",fontWeight:600,color:"#555",borderBottom:"2px solid #eee",fontSize:11,textTransform:"uppercase"}}>{h}</th>
          )}
        </tr></thead>
        <tbody>
          {alloc.map(loan=>{
            const eff = loan.balance>0?(loan.minPay/loan.balance*1000).toFixed(2):0;
            const isE = editing===loan.id;
            return <tr key={loan.id} style={{borderBottom:"1px solid #f0f0f0",background:loan.extra>0?"rgba(26,86,50,0.03)":"transparent"}}>
              <td style={{padding:"10px 12px",fontWeight:500,color:"#333"}}>{loan.name} <button onClick={()=>setEditing(isE?null:loan.id)} style={{border:"none",background:"none",color:"#aaa",cursor:"pointer",fontSize:11,marginLeft:4}}>{isE?"done":"edit"}</button></td>
              <td style={{padding:"10px 12px",textAlign:"right"}}>{isE?<input type="number" step="0.01" value={loan.balance} onChange={e=>editLoan(loan.id,"balance",e.target.value)} style={{width:90,padding:"3px 6px",border:"1px solid #ddd",borderRadius:4,fontSize:12,textAlign:"right"}} />:<span style={{color:RED,fontWeight:600}}>{fmt(loan.balance)}</span>}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:GRAY}}>{loan.rate}%</td>
              <td style={{padding:"10px 12px",textAlign:"right"}}>{isE?<input type="number" step="0.01" value={loan.minPay} onChange={e=>editLoan(loan.id,"minPay",e.target.value)} style={{width:70,padding:"3px 6px",border:"1px solid #ddd",borderRadius:4,fontSize:12,textAlign:"right"}} />:<span style={{color:GRAY}}>{fmt(loan.minPay)}</span>}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:strategy==="optimized"?GOLD:GREEN,fontWeight:700}}>{strategy==="optimized"?`${eff}x`:(loan.extra>0?fmt(loan.extra):"—")}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:"#333"}}>{fmt(loan.total)}</td>
              <td style={{padding:"10px 12px",textAlign:"right"}}>{loan.extra>0&&<span style={{background:GREEN,color:"#fff",padding:"2px 10px",borderRadius:10,fontSize:11,fontWeight:700}}>TARGET</span>}</td>
            </tr>;
          })}
        </tbody>
        <tfoot><tr style={{background:"#f8f9fa",fontWeight:700}}>
          <td style={{padding:"10px 12px"}}>TOTAL</td>
          <td style={{padding:"10px 12px",textAlign:"right",color:RED}}>{fmt(totalDebt)}</td>
          <td style={{padding:"10px 12px",textAlign:"right"}}>—</td>
          <td style={{padding:"10px 12px",textAlign:"right"}}>{fmt(totalMin)}</td>
          <td style={{padding:"10px 12px",textAlign:"right",color:GREEN}}>{fmt(ex-rem)}</td>
          <td style={{padding:"10px 12px",textAlign:"right"}}>{fmt(totalMin+ex-rem)}</td>
          <td></td>
        </tr></tfoot>
      </table>
    </div>

    {strategy==="optimized" && <div style={{padding:16,background:"#fffbf0",borderRadius:10,marginBottom:20,fontSize:13,color:"#555",lineHeight:1.7,border:"1px solid #f0e6cc"}}>
      <strong style={{color:GOLD}}>⚡ Efficiency Ratio</strong> — Monthly payment freed per $1,000 of payoff cost. Higher = more cash freed faster. The 2020 Ascent scores high because its $297/mo minimum is large relative to balance. Compare against avalanche (minimizes interest) to decide which trade-off you prefer right now.
    </div>}

    {/* Mortgage section */}
    <div style={{marginTop:24,marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <Sec>Baby Step 6: Mortgage</Sec>
        <button onClick={()=>setEditMtg(!editMtg)} style={{border:"none",background:"none",color:"#aaa",cursor:"pointer",fontSize:12}}>{editMtg?"done":"edit"}</button>
      </div>
      <div style={{background:"#f8f9fa",borderRadius:10,padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
          <div><div style={{fontSize:11,color:"#888",textTransform:"uppercase",marginBottom:4}}>Balance</div>
            {editMtg?<input type="number" step="0.01" value={mortgage.balance} onChange={e=>setMortgage(p=>({...p,balance:parseFloat(e.target.value)||0}))} style={{...inp,width:"100%",fontWeight:600}} />
            :<div style={{fontSize:18,fontWeight:700,color:RED}}>{fmt(mortgage.balance)}</div>}
          </div>
          <div><div style={{fontSize:11,color:"#888",textTransform:"uppercase",marginBottom:4}}>Rate</div>
            <div style={{fontSize:18,fontWeight:700,color:GRAY}}>{mortgage.rate}%</div>
          </div>
          <div><div style={{fontSize:11,color:"#888",textTransform:"uppercase",marginBottom:4}}>Payment</div>
            {editMtg?<input type="number" step="0.01" value={mortgage.minPay} onChange={e=>setMortgage(p=>({...p,minPay:parseFloat(e.target.value)||0}))} style={{...inp,width:"100%",fontWeight:600}} />
            :<div style={{fontSize:18,fontWeight:700,color:"#333"}}>{fmt(mortgage.minPay)}</div>}
          </div>
          <div><div style={{fontSize:11,color:"#888",textTransform:"uppercase",marginBottom:4}}>Scheduled End</div>
            <div style={{fontSize:18,fontWeight:700,color:GRAY}}>{mLabel(mortgage.endDate)}</div>
          </div>
        </div>
        <div style={{marginTop:12,fontSize:13,color:"#555",lineHeight:1.7}}>
          After all loans are paid off, the full {fmt(totalMin + ex)}/mo (current minimums + extra) redirects here. {mtgTimeline && <strong style={{color:GREEN}}>Projected payoff: {mtgTimeline.payoffDate}</strong>}
          {mtgTimeline && <span> — {Math.round((new Date(mortgage.endDate+"-01").getTime()-new Date().getTime())/(1000*60*60*24*30) - mtgTimeline.totalMonths)} months earlier than scheduled.</span>}
        </div>
      </div>
    </div>

    {/* Timeline toggle */}
    <button onClick={()=>setShowTL(!showTL)} style={{padding:"10px 20px",border:`1px solid ${GREEN}`,borderRadius:8,background:showTL?GREEN:"#fff",color:showTL?"#fff":GREEN,fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:20}}>
      {showTL?"Hide":"Show"} Cascading Payoff Timeline
    </button>

    {showTL && timeline && <div style={{border:"1px solid #eee",borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"16px 20px",background:"#f8f9fa",borderBottom:"1px solid #eee"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#333"}}>
          {timeline.events.some(e=>e.type==="debtfree") ? `All loans paid off by ${timeline.events.find(e=>e.type==="debtfree").date}` : `${Math.ceil(timeline.months/12)}+ years`}
        </div>
        <div style={{fontSize:13,color:GRAY,marginTop:4}}>With {fmt(ex)}/mo extra. As each loan clears, its payment rolls into the next target.</div>
      </div>
      <div style={{padding:20}}>
        {/* Header row */}
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 110px 110px",gap:8,marginBottom:12,fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:"0.06em",paddingBottom:8,borderBottom:"1px solid #eee"}}>
          <span>Scheduled End</span><span>Loan</span><span style={{textAlign:"right"}}>Revised Payoff</span><span style={{textAlign:"right"}}>Monthly Freed</span>
        </div>
        {timeline.events.filter(e=>e.type==="payoff"||e.type==="debtfree").map((ev,i)=>
          ev.type==="debtfree" ? <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"12px 0",borderTop:"2px solid #e9ecef"}}>
            <div style={{minWidth:100}}></div>
            <div style={{fontSize:16,fontWeight:700,color:GREEN}}>🎉 ALL LOANS PAID OFF — {ev.date}</div>
          </div>
          : <div key={i} style={{display:"grid",gridTemplateColumns:"100px 1fr 110px 110px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}}>
            <span style={{fontSize:12,color:"#aaa"}}>{ev.origEnd||"—"}</span>
            <span style={{fontSize:14,fontWeight:600,color:"#333"}}>{ev.name}</span>
            <span style={{fontSize:14,fontWeight:700,color:GREEN,textAlign:"right"}}>{ev.date}</span>
            <span style={{fontSize:12,color:GRAY,textAlign:"right"}}>+{fmt(ev.freed)}/mo</span>
          </div>
        )}

        {/* Annual snapshots */}
        <div style={{marginTop:20,borderTop:"1px solid #eee",paddingTop:16}}>
          <div style={{fontSize:12,fontWeight:600,color:"#888",textTransform:"uppercase",marginBottom:10}}>Annual Snapshots</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
            {timeline.events.filter(e=>e.type==="snapshot").map((s,i)=>{
              const d=new Date(); d.setMonth(d.getMonth()+s.month);
              return <div key={i} style={{background:"#f8f9fa",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:"#888"}}>{ML[d.getMonth()]} {d.getFullYear()}</div>
                <div style={{fontSize:15,fontWeight:700,color:s.total>0?RED:GREEN}}>{fmt(s.total)}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{s.left} loans left</div>
              </div>;
            })}
          </div>
        </div>

        {/* Mortgage projection */}
        {mtgTimeline && <div style={{marginTop:20,borderTop:"2px solid #e9ecef",paddingTop:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#333",marginBottom:8}}>Baby Step 6: Mortgage Payoff</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div style={{background:"#f8f9fa",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:"#888"}}>Scheduled End</div>
              <div style={{fontSize:15,fontWeight:700,color:GRAY}}>{mLabel(mortgage.endDate)}</div>
            </div>
            <div style={{background:"#f0f9f4",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:"#888"}}>Revised Payoff</div>
              <div style={{fontSize:15,fontWeight:700,color:GREEN}}>{mtgTimeline.payoffDate}</div>
            </div>
            <div style={{background:"#f0f9f4",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:"#888"}}>Total Months</div>
              <div style={{fontSize:15,fontWeight:700,color:GREEN}}>{mtgTimeline.totalMonths} mo ({(mtgTimeline.totalMonths/12).toFixed(1)} yr)</div>
            </div>
          </div>
        </div>}
      </div>
    </div>}
  </div>;
}

// ============================================================
// CATEGORY MANAGER
// ============================================================
function CatMgr({categories,setCategories,categoryGroups,setCategoryGroups,projections,setProjections}) {
  const [nc,setNc]=useState(""), [ng,setNg]=useState(""), [newG,setNewG]=useState("");

  function addCat() {
    if (!nc.trim()||!ng) return;
    const c=nc.trim(); if(categories.includes(c)) return;
    setCategories(p=>[...p.filter(x=>x!=="Income"&&x!=="Ignore"),c,"Income","Ignore"]);
    setCategoryGroups(p=>({...p,[ng]:[...(p[ng]||[]),c]}));
    setProjections(p=>({...p,[c]:0}));
    setNc("");
  }

  function addGroup() {
    if (!newG.trim()||categoryGroups[newG.trim()]) return;
    setCategoryGroups(p=>({...p,[newG.trim()]:[]}));
    setNewG("");
  }

  function removeCat(cat,group) {
    setCategories(p=>p.filter(c=>c!==cat));
    setCategoryGroups(p=>({...p,[group]:p[group].filter(c=>c!==cat)}));
  }

  return <div style={{padding:24}}>
    <h2 style={{margin:"0 0 8px",fontSize:22,color:"#1a1a1a",fontFamily:FH}}>Manage Categories</h2>
    <p style={{color:GRAY,margin:"0 0 24px",fontSize:14}}>Add categories or create entirely new groups.</p>

    <div style={{marginBottom:24}}>
      <Sec>Add New Group</Sec>
      <div style={{display:"flex",gap:10}}>
        <input value={newG} onChange={e=>setNewG(e.target.value)} placeholder="e.g. NC Homeschooling" style={{...inp,width:220}} />
        <button onClick={addGroup} style={{padding:"8px 16px",border:"none",borderRadius:6,background:GREEN,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>Add Group</button>
      </div>
    </div>

    <div style={{marginBottom:24}}>
      <Sec>Add Category to Group</Sec>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <input value={nc} onChange={e=>setNc(e.target.value)} placeholder="e.g. Oil Change" style={{...inp,width:180}} />
        <select value={ng} onChange={e=>setNg(e.target.value)} style={inp}><option value="">Add to group...</option>{Object.keys(categoryGroups).map(g=><option key={g} value={g}>{g}</option>)}</select>
        <button onClick={addCat} style={{padding:"8px 16px",border:"none",borderRadius:6,background:GREEN,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>Add</button>
      </div>
    </div>

    <Sec>Current Structure</Sec>
    {Object.entries(categoryGroups).map(([g,cats])=><div key={g} style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:"#333",marginBottom:6}}>{g}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {cats.map(c=><span key={c} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",background:"#f0f0f0",borderRadius:16,fontSize:12,color:"#444"}}>
          {c}<button onClick={()=>removeCat(c,g)} style={{border:"none",background:"none",color:"#bbb",cursor:"pointer",fontSize:14}}>×</button>
        </span>)}
        {!cats.length && <span style={{fontSize:12,color:"#aaa",fontStyle:"italic"}}>Empty</span>}
      </div>
    </div>)}
  </div>;
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [tab,setTab] = useState("import");
  const [loading,setLoading] = useState(true);
  const [transactions,setTransactions] = useState([]);
  const [projections,setProjections] = useState(DEFAULT_PROJ);
  const [incomeProjections,setIncomeProjections] = useState(DEFAULT_INC);
  const [loans,setLoans] = useState(DEFAULT_LOANS);
  const [mortgage,setMortgage] = useState(DEFAULT_MORTGAGE);
  const [categories,setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryGroups,setCategoryGroups] = useState(DEFAULT_GROUPS);
  const [accounts,setAccounts] = useState(DEFAULT_ACCTS);
  const [monthlyHistory,setMonthlyHistory] = useState(SEED_HISTORY);
  const [lastUpdated,setLastUpdated] = useState({import:"",transactions:"",budget:"",debt:""});

  useEffect(()=>{
    async function init() {
      const [tx,pr,ic,ln,mt,ca,cg,ac,mh,lu] = await Promise.all([
        load(SK.transactions,[]), load(SK.projections,DEFAULT_PROJ), load(SK.incomeProjections,DEFAULT_INC),
        load(SK.loans,DEFAULT_LOANS), load(SK.mortgage,DEFAULT_MORTGAGE),
        load(SK.categories,DEFAULT_CATEGORIES), load(SK.categoryGroups,DEFAULT_GROUPS),
        load(SK.accounts,DEFAULT_ACCTS), load(SK.monthlyHistory,SEED_HISTORY),
        load(SK.lastUpdated,{import:"",transactions:"",budget:"",debt:""}),
      ]);
      setTransactions(tx); setProjections(pr); setIncomeProjections(ic); setLoans(ln); setMortgage(mt);
      setCategories(ca); setCategoryGroups(cg); setAccounts(ac); setMonthlyHistory(mh); setLastUpdated(lu);
      setLoading(false);
    }
    init();
  },[]);

  const saveRef = useRef(null);
  useEffect(()=>{
    if (loading) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(()=>{
      save(SK.transactions,transactions); save(SK.projections,projections); save(SK.incomeProjections,incomeProjections);
      save(SK.loans,loans); save(SK.mortgage,mortgage); save(SK.categories,categories);
      save(SK.categoryGroups,categoryGroups); save(SK.accounts,accounts);
      save(SK.monthlyHistory,monthlyHistory); save(SK.lastUpdated,lastUpdated);
    },800);
  },[transactions,projections,incomeProjections,loans,mortgage,categories,categoryGroups,accounts,monthlyHistory,lastUpdated,loading]);

  // Update monthly history snapshots
  useEffect(()=>{
    if (loading) return;
    const cm = curMonth();
    const done = new Set();
    transactions.forEach(t=>{if(t.date) done.add(dateToYM(t.date))});
    done.delete(cm);
    let upd = false;
    const nh = {...monthlyHistory};
    for (const m of done) {
      // Re-snapshot if we have new data (allow updates to existing months)
      const mTx = transactions.filter(t=>dateToYM(t.date)===m && t.category && t.category!=="Ignore" && t.category!=="Income");
      const totals = {};
      mTx.forEach(t=>{totals[t.category]=(totals[t.category]||0)+t.amount});
      if (Object.keys(totals).length>0) {
        const existing = JSON.stringify(nh[m]||{});
        const fresh = JSON.stringify(totals);
        if (existing !== fresh) { nh[m]=totals; upd=true; }
      }
    }
    if (upd) setMonthlyHistory(nh);
  },[transactions,loading]);

  const unmatched = transactions.filter(t=>!t.category && !t.isIncome).length;

  if (loading) return <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",fontFamily:FB,color:GRAY}}>Loading...</div>;

  return <div style={{fontFamily:FB,maxWidth:1100,margin:"0 auto",background:"#fff",minHeight:"100vh"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />

    <div style={{padding:"20px 24px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div>
        <h1 style={{margin:0,fontSize:24,fontFamily:FH,color:"#1a1a1a",fontWeight:700,letterSpacing:"-0.02em"}}>Next Chapter Budget</h1>
        <div style={{fontSize:12,color:"#888",marginTop:2}}>{transactions.length} transactions · {Object.keys(monthlyHistory).length} months of history</div>
      </div>
      <div style={{fontSize:13,color:GREEN,fontWeight:600}}>Cash: {fmt(Object.values(accounts).reduce((s,a)=>s+(a.balance||0),0))}</div>
    </div>

    <div style={{display:"flex",borderBottom:"1px solid #eee",paddingLeft:12,overflowX:"auto"}}>
      <Tab active={tab==="import"} onClick={()=>setTab("import")}>Import</Tab>
      <Tab active={tab==="transactions"} onClick={()=>setTab("transactions")} badge={unmatched}>Transactions</Tab>
      <Tab active={tab==="budget"} onClick={()=>setTab("budget")}>Budget</Tab>
      <Tab active={tab==="debt"} onClick={()=>setTab("debt")}>Debt Strategy</Tab>
      <Tab active={tab==="categories"} onClick={()=>setTab("categories")}>Categories</Tab>
    </div>

    {tab==="import" && <ImportTab onImport={tx=>setTransactions(p=>[...p,...tx])} transactions={transactions} accounts={accounts} setAccounts={setAccounts} setLastUpdated={setLastUpdated} />}
    {tab==="transactions" && <TransactionsTab transactions={transactions} onUpdate={(id,u)=>setTransactions(p=>p.map(t=>t.id===id?{...t,...u}:t))} onDelete={id=>setTransactions(p=>p.filter(t=>t.id!==id))} onAdd={tx=>setTransactions(p=>[...p,tx])} categories={categories} lastUpdated={lastUpdated} setLastUpdated={setLastUpdated} />}
    {tab==="budget" && <BudgetTab transactions={transactions} projections={projections} setProjections={setProjections} incomeProjections={incomeProjections} setIncomeProjections={setIncomeProjections} categoryGroups={categoryGroups} accounts={accounts} monthlyHistory={monthlyHistory} lastUpdated={lastUpdated} />}
    {tab==="debt" && <DebtTab transactions={transactions} loans={loans} setLoans={setLoans} mortgage={mortgage} setMortgage={setMortgage} lastUpdated={lastUpdated} setLastUpdated={setLastUpdated} />}
    {tab==="categories" && <CatMgr categories={categories} setCategories={setCategories} categoryGroups={categoryGroups} setCategoryGroups={setCategoryGroups} projections={projections} setProjections={setProjections} />}
  </div>;
}
