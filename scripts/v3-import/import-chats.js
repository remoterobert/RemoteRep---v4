const fs=require("fs"); const path=require("path");
const { createClient } = require("@supabase/supabase-js");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const V3=process.env.V3; const MODE=process.env.MODE==="live"?"live":"dry"; const CONC=parseInt(process.env.CONCURRENCY||"6",10);
const clean=(x)=>typeof x==="string"?x.trim():"";
function fixTitle(t){ let s=clean(t); if(s.length>80)s=s.slice(0,80); if(s.length<10)s=(s+" — Remote Sales Role").trim().slice(0,80); if(s.length<10)s="Remote Sales Opportunity"; return s; }
async function pageAll(table,cols,filter){ let out=[],from=0; for(;;){ let q=s.from(table).select(cols).range(from,from+999); if(filter)q=filter(q); const {data,error}=await q; if(error)throw new Error(table+":"+error.message); out.push(...(data||[])); if(!data||data.length<1000)break; from+=1000; } return out; }
const LEDGER=path.join(V3,"imported-chats.json");
(async()=>{
  const chats=JSON.parse(fs.readFileSync(path.join(V3,"v3-chats-prod.json"),"utf8"));
  const users=JSON.parse(fs.readFileSync(path.join(V3,"v3-users-prod.json"),"utf8"));
  const listings=JSON.parse(fs.readFileSync(path.join(V3,"v3-listings-prod.json"),"utf8"));
  const byId={}; const v3ToEmail={}; for(const u of users){ byId[u.id]=u; if(u.email) v3ToEmail[u.id]=u.email.trim().toLowerCase(); }
  const pu=await pageAll("users","id,email",(q)=>q.eq("creation_reference","v3-import")); const emailToV4={}; for(const r of pu) emailToV4[(r.email||"").toLowerCase()]=r.id;
  const v4user=(id)=>{ const e=v3ToEmail[id]; return e?emailToV4[e]:null; };
  const tn=await pageAll("tenants","id,slug",(q)=>q.eq("type","client_company").like("slug","c-%")); const clientToTenant={}; for(const t of tn) clientToTenant[t.slug.slice(2)]=t.id;
  // v3 listing -> v4 listing (replay uniquification)
  const mine=listings.filter(l=>clientToTenant[l.client]).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const tu={}; const v3lMeta={}; for(const l of mine){ const tid=clientToTenant[l.client]; let title=fixTitle(l.title); const k=tid+"|"+title; tu[k]=(tu[k]||0)+1; if(tu[k]>1)title=(title+" ("+tu[k]+")").slice(0,80); v3lMeta[l.id]={tid,title}; }
  const v4l=await pageAll("listings","id,tenant_id,title"); const ttToL={}; for(const r of v4l) ttToL[r.tenant_id+"|"+r.title]=r.id;
  const v3ListingToV4=(id)=>{ const m=v3lMeta[id]; return m?ttToL[m.tid+"|"+m.title]||null:null; };
  const apps=await pageAll("applications","id,listing_id,candidate_user_id"); const appMap={}; for(const a of apps) appMap[a.listing_id+"|"+a.candidate_user_id]=a.id;
  // candidates: client+talent chats, both mapped, not already processed
  let processed=new Set(); try{ processed=new Set(JSON.parse(fs.readFileSync(LEDGER,"utf8"))); }catch{}
  const todo=[]; let skipUnmapped=0;
  for(const c of chats){ if(processed.has(c.id)) continue; const [a,b]=c.chatUsers||[]; const ua=byId[a],ub=byId[b]; if(!ua||!ub){skipUnmapped++;continue;}
    const va=v4user(a), vb=v4user(b); if(!va||!vb){skipUnmapped++;continue;}
    const rep=ua.accountType==="talent"?{v3:a,v4:va}:(ub.accountType==="talent"?{v3:b,v4:vb}:null);
    const client=ua.accountType==="client"?{v3:a,v4:va}:(ub.accountType==="client"?{v3:b,v4:vb}:null);
    if(!rep||!client){skipUnmapped++;continue;}
    todo.push({c, repV4:rep.v4, clientV4:client.v4, tenantId:clientToTenant[client.v3]});
  }
  console.log(`MODE=${MODE}  importable chats=${todo.length}  skipped(unmapped)=${skipUnmapped}  already-done=${processed.size}`);
  if(MODE==="dry"){ let msgs=0; for(const t of todo) for(const m of (t.c.messages||[])) if(clean(m.message))msgs++; console.log("  messages to import:", msgs); console.log("(dry — nothing written)"); return; }
  const res={chats:0,messages:0,errors:0,errSamples:[]}; let done=0; const newDone=[];
  async function worker(t){
    try{
      const msgs0=(t.c.messages||[]);
      const listingV4 = (()=>{ for(const m of msgs0){ const lv=v3ListingToV4(m.listingId); if(lv) return lv; } return null; })();
      const appId = listingV4 ? (appMap[listingV4+"|"+t.repV4]||null) : null;
      const times=msgs0.map(m=>m.dateCreated||0).filter(Boolean);
      const { data: ch, error: ce } = await s.from("chats").insert({ tenant_id:t.tenantId, related_listing_id:listingV4, related_application_id:appId, created_at:new Date(t.c.dateCreated||Date.now()).toISOString(), last_message_at:times.length?new Date(Math.max(...times)).toISOString():null }).select("id").single();
      if(ce) throw new Error("chat:"+ce.message);
      await s.from("chat_participants").upsert([{chat_id:ch.id,user_id:t.repV4},{chat_id:ch.id,user_id:t.clientV4}],{onConflict:"chat_id,user_id",ignoreDuplicates:true});
      const rows=[]; for(const m of msgs0){ const body=clean(m.message); if(!body) continue; const author=v4user(m.author); if(author!==t.repV4&&author!==t.clientV4) continue;
        rows.push({ chat_id:ch.id, author_user_id:author, body:body.slice(0,5000), created_at:new Date(m.dateCreated||Date.now()).toISOString(), deleted_at:m.deleted?new Date(m.dateUpdated||m.dateCreated||Date.now()).toISOString():null, deleted_by_admin:!!m.deletedByAdmin }); }
      for(let i=0;i<rows.length;i+=500){ const {error}=await s.from("messages").insert(rows.slice(i,i+500)); if(error) throw new Error("msgs:"+error.message); }
      res.chats++; res.messages+=rows.length; newDone.push(t.c.id);
    }catch(e){ res.errors++; if(res.errSamples.length<10) res.errSamples.push(e.message); }
    if(++done%500===0){ console.log("  …"+done+"/"+todo.length+" (chats="+res.chats+" msgs="+res.messages+" err="+res.errors+")"); fs.writeFileSync(LEDGER, JSON.stringify([...processed,...newDone])); }
  }
  let i=0; await Promise.all(Array.from({length:CONC},async()=>{ while(i<todo.length){ await worker(todo[i++]); } }));
  fs.writeFileSync(LEDGER, JSON.stringify([...processed,...newDone]));
  console.log("Summary:", JSON.stringify(res));
})();
