const fs = require("fs"); const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const V3 = process.env.V3; const MODE = process.env.MODE==="live"?"live":"dry";
const clean=(x)=>typeof x==="string"?x.trim():"";
function fixTitle(t){ let s=clean(t); if(s.length>80)s=s.slice(0,80); if(s.length<10)s=(s+" — Remote Sales Role").trim().slice(0,80); if(s.length<10)s="Remote Sales Opportunity"; return s; }
const STATUS = new Set(["applied","invited","interviewing","hired","shortlisted"]);
async function pageAll(table, cols, filter){ let out=[], from=0; for(;;){ let q=s.from(table).select(cols).range(from,from+999); if(filter) q=filter(q); const {data,error}=await q; if(error) throw new Error(table+":"+error.message); out.push(...(data||[])); if(!data||data.length<1000) break; from+=1000; } return out; }
(async()=>{
  const listings=JSON.parse(fs.readFileSync(path.join(V3,"v3-listings-prod.json"),"utf8"));
  const users=JSON.parse(fs.readFileSync(path.join(V3,"v3-users-prod.json"),"utf8"));
  const v3IdToEmail={}; for(const u of users){ if(u.email) v3IdToEmail[u.id]=u.email.trim().toLowerCase(); }
  // email -> v4 user id
  const pu=await pageAll("users","id,email",(q)=>q.eq("creation_reference","v3-import"));
  const emailToV4={}; for(const r of pu) emailToV4[(r.email||"").toLowerCase()]=r.id;
  const v3RepToV4=(id)=>{ const e=v3IdToEmail[id]; return e?emailToV4[e]:null; };
  // client v3 id -> tenant id
  const tn=await pageAll("tenants","id,slug",(q)=>q.eq("type","client_company").like("slug","c-%"));
  const clientToTenant={}; for(const t of tn) clientToTenant[t.slug.slice(2)]=t.id;
  // replay listings uniquification -> v3 listing id -> {tenantId, title}
  const mine=listings.filter(l=>clientToTenant[l.client]).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const titleUse={}; const v3ListingMeta={};
  for(const l of mine){ const tid=clientToTenant[l.client]; let title=fixTitle(l.title); const key=tid+"|"+title; titleUse[key]=(titleUse[key]||0)+1; if(titleUse[key]>1) title=(title+" ("+titleUse[key]+")").slice(0,80); v3ListingMeta[l.id]={tenantId:tid, title}; }
  // (tenantId|title) -> v4 listing id
  const v4l=await pageAll("listings","id,tenant_id,title");
  const ttToListing={}; for(const r of v4l) ttToListing[r.tenant_id+"|"+r.title]=r.id;
  // Build applications
  const rows=new Map(); let noRep=0,noListing=0,badStatus=0;
  for(const l of mine){ const meta=v3ListingMeta[l.id]; const lid=ttToListing[meta.tenantId+"|"+meta.title]; if(!lid){ noListing+=(l.applications||[]).length; continue; }
    for(const a of (l.applications||[])){ const uid=v3RepToV4(a.talent); if(!uid){ noRep++; continue; } const st=(a.applicationStatus||"").toLowerCase(); if(!STATUS.has(st)){ badStatus++; continue; }
      const k=lid+"|"+uid; const when=new Date(a.dateCreated||Date.now()).toISOString(); const changed=new Date(a.dateUpdated||a.dateCreated||Date.now()).toISOString();
      const prev=rows.get(k); if(prev && (prev._u>=(a.dateUpdated||0))) continue;
      rows.set(k,{ tenant_id:meta.tenantId, listing_id:lid, candidate_user_id:uid, status:st, message:clean(a.applicationMessage)||null, applied_at:when, last_status_change_at:changed, _u:(a.dateUpdated||0) });
    }
  }
  const all=[...rows.values()].map(({_u,...r})=>r);
  console.log(`MODE=${MODE}  valid applications=${all.length}  (skipped: no-rep=${noRep} no-listing=${noListing} bad-status=${badStatus})`);
  const byStatus={}; for(const r of all) byStatus[r.status]=(byStatus[r.status]||0)+1; console.log("  by status:", JSON.stringify(byStatus));
  if(MODE==="dry"){ console.log("(dry — nothing written)"); return; }
  let ok=0,err=0; for(let i=0;i<all.length;i+=500){ const chunk=all.slice(i,i+500); const {error}=await s.from("applications").upsert(chunk,{onConflict:"listing_id,candidate_user_id",ignoreDuplicates:false}); if(error){ err+=chunk.length; if(err<=500) console.log("  chunk error:", error.message); } else ok+=chunk.length; if((i/500)%10===0) console.log("  …"+(i+chunk.length)+"/"+all.length); }
  console.log("Applications upserted:", ok, " errors:", err);
})();
