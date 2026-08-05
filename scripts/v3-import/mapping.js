const fs = require("fs");
const path = require("path");
const V3 = process.env.V3;

const ENUMS = {
  sales_role: ["Appointment-setter","SDR","BDR","Account executive","Closer","Sales management","Executive","Other"],
  sales_type: ["B2B","B2C","B2G"],
  education_level: ["High school","Some college","Associate degree","Bachelor's degree","Master's degree","Doctorate"],
  decision_maker: ["Small business","C-suite","Consumer","Other"],
  sales_environment: ["In-person","Phone","Zoom / video conference","Door-to-door","Other"],
  sales_cycle: ["1 call","1 week","1 month","6 months","6 months+"],
  deal_amount: ["$0 - $5000","$5000 - $20,000","$20,000 - $50,000","$50,000 - $100,000","$100,000 - $500,000","$500,000 - $1M","$1M+"],
  sales_volume: ["$0 - $100,000","$100,000 - $250,000","$250,000 - $500,000","$500,000 - $1M","$1M - $2M","$2M - $5M","$5M+"],
  lead_type: ["Inbound","Outbound"],
  technology: ["Google Drive","Zoom","Google Meet","Google Calendar","Powerpoint","Keynote","Canva","Docusign","Salesforce","Hubspot"],
  commitment_type: ["Full-time","Part-time","Temporary","Internship","Other"],
  benefit: ["Health insurance","Dental coverage","Vision coverage","401k","Stock options","None"],
  // enum spelling was corrected to "commission"; v3 data already spells it correctly
  compensation_type: ["Salary","Base + commission","Commission-only","Draw against commission","Hourly"],
};
const ENUM_SETS = Object.fromEntries(Object.entries(ENUMS).map(([k,v])=>[k,new Set(v)]));
const CI = new Map(Object.entries(ENUMS).map(([k,v])=>[k,new Map(v.map(x=>[x.toLowerCase(),x]))]));
const INDUSTRY_MAP = JSON.parse(fs.readFileSync(path.join(V3,"industry_map.json"),"utf8"));

function normalize(en, v){ if(typeof v!=="string") return v; const s=v.trim(); const m=CI.get(en); return (m&&m.has(s.toLowerCase()))?m.get(s.toLowerCase()):s; }
function filterEnum(arr, en){ const set=ENUM_SETS[en]; const kept=[]; for(const raw of (Array.isArray(arr)?arr:[])){ const v=normalize(en,raw); if(set.has(v)) kept.push(v);} return [...new Set(kept)]; }
function oneEnum(v, en){ const n=normalize(en,v); return ENUM_SETS[en].has(n)?n:null; }
function mapIndustries(arr){ const kept=[]; for(const v of (Array.isArray(arr)?arr:[])){ const s=(typeof v==="string")?INDUSTRY_MAP[v.trim()]:null; if(s) kept.push(s);} return [...new Set(kept)]; }
function toSlug(v){ return (typeof v==="string")?(INDUSTRY_MAP[v.trim()]||null):null; }
function toInt(v){ if(v==null) return null; const n=parseInt(String(v).replace(/[^0-9.-]/g,""),10); return Number.isFinite(n)?n:null; }
function toNum(v){ if(v==null) return null; const n=parseFloat(String(v).replace(/[^0-9.-]/g,"")); return Number.isFinite(n)?n:null; }

module.exports = { ENUMS, ENUM_SETS, INDUSTRY_MAP, filterEnum, oneEnum, mapIndustries, toSlug, toInt, toNum };
