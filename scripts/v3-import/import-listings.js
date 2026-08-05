const fs = require("fs"); const path = require("path");
const M = require("./mapping.js");
const { createClient } = require("@supabase/supabase-js");
const V3 = process.env.V3; const MODE = process.env.MODE === "live" ? "live" : "dry";
const MIGRATE_FILES = process.env.MIGRATE_FILES === "1";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const clean = (s) => (typeof s === "string" ? s.trim() : "");
const clampInt = (n,lo,hi)=>(n==null?null:(n<lo?null:(n>hi?null:n)));
function fixTitle(t){ let s=clean(t); if(s.length>80)s=s.slice(0,80); if(s.length<10)s=(s+" — Remote Sales Role").trim().slice(0,80); if(s.length<10)s="Remote Sales Opportunity"; return s; }
function fixDesc(d,extra){ let s=clean(d); if(extra&&s.length<100)s=(s+"\n\n"+extra).trim(); while(s.length<100)s=(s+" This is a remote sales opportunity — contact the company for full details.").trim(); return s.slice(0,5000); }
const S3="remoterep-production.s3.amazonaws.com";
async function uploadFromUrl(url,bucket,folder,base){ if(typeof url!=="string"||!url.includes(S3)) return null; try{ const r=await fetch(url); if(!r.ok) return null; const ct=r.headers.get("content-type")||"application/octet-stream"; const buf=Buffer.from(await r.arrayBuffer()); const ext=/png/.test(ct)?".png":/jpe?g/.test(ct)?".jpg":""; const dest=folder+"/"+base+ext; const {error}=await supabase.storage.from(bucket).upload(dest,buf,{contentType:ct,upsert:true}); if(error&&!/exists|already/i.test(error.message)) return null; return supabase.storage.from(bucket).getPublicUrl(dest).data.publicUrl; }catch{return null;} }
(async () => {
  const listings = JSON.parse(fs.readFileSync(path.join(V3,"v3-listings-prod.json"),"utf8"));
  // imported company tenants (slug c-<v3id>) + their client_admin
  const { data: tn } = await supabase.from("tenants").select("id, slug").eq("type","client_company").like("slug","c-%");
  const tenantByV3={}; for(const t of tn||[]) tenantByV3[t.slug.slice(2)]={tenantId:t.id};
  const tids=Object.values(tenantByV3).map(x=>x.tenantId);
  // created_by per tenant (batch)
  const createdBy={}; for(let i=0;i<tids.length;i+=200){ const { data:mm }=await supabase.from("tenant_members").select("tenant_id,user_id,role").in("tenant_id",tids.slice(i,i+200)).eq("role","client_admin"); for(const m of mm||[]) if(!createdBy[m.tenant_id]) createdBy[m.tenant_id]=m.user_id; }
  const mine=listings.filter(l=>tenantByV3[l.client]).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  console.log(`MODE=${MODE} companies=${tn?.length} their-listings=${mine.length}`);
  if(MODE==="dry"){ let draft=0,pub=0; for(const l of mine){ if(l.draft)draft++;else pub++; } console.log(`  draft=${draft} published=${pub}`); console.log("(dry — nothing written)"); return; }
  // Unique-per-tenant titles so same-title listings stay separate + deterministic
  const titleUse={}; const res={created:0,updated:0,errors:0,errSamples:[]};
  for(const l of mine){
    const tenantId=tenantByV3[l.client].tenantId; const by=createdBy[tenantId]; if(!by){ res.errors++; continue; }
    let title=fixTitle(l.title); const key=tenantId+"|"+title; titleUse[key]=(titleUse[key]||0)+1; if(titleUse[key]>1) title=(title+" ("+titleUse[key]+")").slice(0,80);
    const req=l.requirements||{}, det=l.details||{}; const isDraft=!!l.draft; const when=new Date(l.dateUpdated||l.dateCreated||Date.now()).toISOString();
    try{
      const { data: ex }=await supabase.from("listings").select("id").eq("tenant_id",tenantId).eq("title",title).maybeSingle();
      let lid=ex?.id;
      if(!lid){ const { data:ins,error }=await supabase.from("listings").insert({ tenant_id:tenantId, created_by_user_id:by, title, description:fixDesc(l.description,clean(l.compensations)), calendar_link:clean(l.calendarLink)||null, status:isDraft?"draft":"published", visibility:isDraft?"hidden":"public", published_at:isDraft?null:when }).select("id").single(); if(error) throw new Error("listing:"+error.message); lid=ins.id; res.created++; } else res.updated++;
      const salesRole=M.filterEnum(req.salesRoles,"sales_role")[0]||"Other";
      const { error:de }=await supabase.from("listing_details").upsert({ listing_id:lid, sales_role:salesRole, commitment:M.filterEnum([det.commitment],"commitment_type"), benefits:M.filterEnum(det.benefits,"benefit"), compensation_type:M.filterEnum([det.compensationType],"compensation_type"), minimum_compensation:M.toNum(det.annualSalary), compensation_details:clean(l.compensations).slice(0,2000)||null },{onConflict:"listing_id"}); if(de) throw new Error("details:"+de.message);
      const { error:re }=await supabase.from("listing_requirements").upsert({ listing_id:lid, education:M.filterEnum([req.education],"education_level"), years_of_experience_min:M.toInt(req.yearsOfExperience), industries:M.mapIndustries(req.industries), sales_roles:M.filterEnum(req.salesRoles,"sales_role"), sales_types:M.filterEnum(req.salesTypes,"sales_type"), decision_makers:M.filterEnum(req.decisionMakers,"decision_maker"), deal_amounts:M.filterEnum(req.dealAmounts,"deal_amount"), sales_volumes:M.filterEnum(req.salesVolumes,"sales_volume"), lead_types:M.filterEnum(req.leadTypes,"lead_type"), technologies:M.filterEnum([...(req.technologies||[]),...(req.crm||[])],"technology") },{onConflict:"listing_id"}); if(re) throw new Error("reqs:"+re.message);
    }catch(e){ res.errors++; if(res.errSamples.length<15) res.errSamples.push(title.slice(0,30)+": "+e.message); }
  }
  console.log("Summary:", JSON.stringify(res));
})();
