const fs = require("fs");
const path = require("path");
const M = require("./mapping.js");
const { createClient } = require("@supabase/supabase-js");

const V3 = process.env.V3;
const MODE = process.env.MODE === "live" ? "live" : "dry";
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;
const MIGRATE_FILES = process.env.MIGRATE_FILES === "1";
const CONC = parseInt(process.env.CONCURRENCY || "6", 10);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const BLOCKED_DOMAINS = new Set(["darkbears.com"]);
const BLOCKED_EMAILS = new Set([]);
const ADMIN_GRANT_EMAILS = new Set(["aaron@remoterep.com","aaron.biblow@remoterep.com","team@remoterep.com","wardah@remoterep.com","erwen@remoterep.com","gracedemers25@gmail.com","mrjbalingit.18@gmail.com"]);
const isBlocked = (e) => { e=(e||"").toLowerCase(); if(!e) return false; if(BLOCKED_EMAILS.has(e)) return true; return BLOCKED_DOMAINS.has(e.split("@")[1]||""); };

const clean = (s) => (typeof s === "string" ? s.trim() : "");
const slugify = (p, id) => (p + "-" + String(id||"").toLowerCase().replace(/[^a-z0-9]/g,"")).slice(0,64);
const countryOrNull = (c) => { const x=clean(c).toUpperCase(); return /^[A-Z]{2}$/.test(x)?x:null; };
const clampInt = (n,lo,hi) => (n==null?null:(n<lo?null:(n>hi?null:n)));
const S3_HOST = "remoterep-production.s3.amazonaws.com";
const extFromType = (ct) => /png/.test(ct)?".png":/jpe?g/.test(ct)?".jpg":/webp/.test(ct)?".webp":/gif/.test(ct)?".gif":/pdf/.test(ct)?".pdf":"";
async function uploadFromUrl(url, bucket, folder, base) {
  if (typeof url !== "string" || !url.includes(S3_HOST)) return { ok:false, publicUrl:null };
  try {
    const res = await fetch(url); if (!res.ok) return { ok:false, publicUrl:null };
    const ct = res.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = folder + "/" + base + extFromType(ct);
    const { error } = await supabase.storage.from(bucket).upload(dest, buf, { contentType: ct, upsert: true });
    if (error && !/exists|resource already/i.test(error.message)) throw error;
    return { ok:true, publicUrl: supabase.storage.from(bucket).getPublicUrl(dest).data.publicUrl };
  } catch { return { ok:false, publicUrl:null }; }
}

function plan(u){ if(u.accountType==="talent") return {t:"solo_talent",r:"candidate",p:"t"}; if(u.accountType==="client") return {t:"client_company",r:"client_admin",p:"c"}; if(u.accountType==="administrator") return {admin:true}; return null; }

async function findExisting(email){ const { data } = await supabase.from("users").select("id, creation_reference").eq("email", email).maybeSingle(); return data||null; }
async function ensureTenant(slug,name,type){ await supabase.from("tenants").upsert({slug,name,type,status:"active"},{onConflict:"slug",ignoreDuplicates:true}); const { data,error }=await supabase.from("tenants").select("id").eq("slug",slug).single(); if(error) throw new Error("tenant:"+error.message); return data.id; }
async function ensureMembership(tid,uid,role){ const { error }=await supabase.from("tenant_members").upsert({tenant_id:tid,user_id:uid,role,status:"active"},{onConflict:"tenant_id,user_id,role",ignoreDuplicates:true}); if(error) throw new Error("member:"+error.message); }
async function ensureCandidateProfile(uid,u,c){
  const e=u.talentData?.experience||{}, prof=u.talentData?.profile||{}, onboarded=!!u.talentData?.onboardingComplete;
  const when=new Date(u.dateUpdated||u.dateCreated||Date.now()).toISOString();
  let photoUrl=clean(prof.photoUrl)||null;
  if(MIGRATE_FILES && photoUrl){ const r=await uploadFromUrl(photoUrl,"photos",uid,"profile"); if(r.ok) photoUrl=r.publicUrl; }
  if(MIGRATE_FILES){ await uploadFromUrl(clean(u.talentData?.files?.resume),"resumes",uid,"resume").catch(()=>{}); }
  const tech=M.filterEnum([...(e.technologies||[]),...(e.crm||[])],"technology");
  const { error }=await supabase.from("candidate_profiles").upsert({ user_id:uid, headline:clean(prof.headline)||null, about:clean(prof.about)||null, photo_url:photoUrl, video_url:clean(prof.videoUrl)||null,
    education:M.oneEnum(e.education,"education_level"), years_of_experience:clampInt(M.toInt(e.yearsOfExperience),0,80),
    sales_types:M.filterEnum(e.salesTypes,"sales_type"), decision_makers:M.filterEnum(e.decisionMakers,"decision_maker"),
    deal_amounts:M.filterEnum(e.dealAmounts,"deal_amount"), sales_volumes:M.filterEnum(e.salesVolumes,"sales_volume"),
    lead_types:M.filterEnum(e.leadTypes,"lead_type"), technologies:tech, industry_slugs:M.mapIndustries(e.industries),
    skills:(Array.isArray(e.skills)&&e.skills.length)?e.skills.join(", "):null, city:clean(c.addressCity)||null, state_region:clean(c.addressState)||null,
    country:countryOrNull(c.addressCountry), contact_email:clean(u.email).toLowerCase()||null, visibility:onboarded?"public":"hidden", onboarding_completed_at:onboarded?when:null,
  },{onConflict:"user_id"}); if(error) throw new Error("cand_profile:"+error.message);
}
async function ensureGoals(uid,u){ const g=u.talentData?.goals; if(!g) return;
  const { error }=await supabase.from("candidate_goals").upsert({ user_id:uid, company_age_min:clampInt(M.toInt(g.companyAge),0,100), company_headcount_min:clampInt(M.toInt(g.companyHeadcount),0,100000),
    industries:M.mapIndustries(g.industries), sales_roles:M.filterEnum(g.salesRoles,"sales_role"), commitment:M.filterEnum(g.commitment,"commitment_type"),
    benefits:M.filterEnum(g.benefits,"benefit"), compensation_types:M.filterEnum(g.compensationTypes,"compensation_type"), minimum_compensation:M.toNum(g.minimumCompensation),
  },{onConflict:"user_id"}); if(error) throw new Error("goals:"+error.message); }
async function ensureSpecialties(uid,u){ const roles=M.filterEnum(u.talentData?.experience?.salesRoles,"sales_role"); if(!roles.length) return;
  const { error }=await supabase.from("candidate_specialties").upsert(roles.map(r=>({user_id:uid,sales_role:r})),{onConflict:"user_id,sales_role",ignoreDuplicates:true}); if(error) throw new Error("spec:"+error.message); }
async function ensureClientProfile(tid,u){ const p=u.clientData?.profile||{}, hasData=!!u.clientData; const when=new Date(u.dateUpdated||u.dateCreated||Date.now()).toISOString();
  let logoUrl=clean(p.photoUrl)||null; if(MIGRATE_FILES&&logoUrl){ const r=await uploadFromUrl(logoUrl,"logos",tid,"logo"); if(r.ok) logoUrl=r.publicUrl; }
  const age=M.toInt(p.companyAge); const foundedYear=(age!=null&&age>=0&&age<=226)?2026-age:null;
  const pitch=[clean(p.companyTagline),Array.isArray(p.companyCoreValues)?p.companyCoreValues.join(", "):clean(p.companyCoreValues),clean(u.clientData?.publicInformation?.hiringProcess)].filter(Boolean).join("\n\n")||null;
  const { error }=await supabase.from("client_profiles").upsert({ tenant_id:tid, about:clean(p.description)||null, logo_url:logoUrl, website_url:clean(p.websiteLink)||null,
    industry_slug:M.toSlug(p.industry), headcount:clampInt(M.toInt(p.companyHeadcount),0,1000000), founded_year:foundedYear, hiring_pitch:pitch, visibility:"public", onboarding_completed_at:hasData?when:null,
  },{onConflict:"tenant_id"}); if(error) throw new Error("client_profile:"+error.message); }
async function ensureLegacy(uid,u){ const pw=u.password; if(!pw||!pw.hashed||!pw.salt) return;
  const { error }=await supabase.from("legacy_credentials").upsert({ user_id:uid, algo:"pbkdf2", digest:"sha512", iterations:100000, key_length:64, salt:pw.salt, hash:pw.hashed },{onConflict:"user_id",ignoreDuplicates:true}); if(error) throw new Error("legacy:"+error.message); }

async function processUser(u, platformTenantId, res){
  const email=clean(u.email).toLowerCase(); const pl=plan(u); if(!pl) return;
  const c=u.contact||{}; const first=clean(c.firstName), last=clean(c.lastName);
  const fullName=(first+" "+last).trim()||email.split("@")[0];
  const companyName=clean(u.clientData?.generalInfo?.companyName)||clean(u.clientData?.companyName)||fullName;
  try {
    const existing=await findExisting(email);
    if(existing && existing.creation_reference!=="v3-import"){ res.skippedExisting++; return; }
    let uid=existing?existing.id:null;
    if(uid){ res.reused++; } else {
      const { data,error }=await supabase.auth.admin.createUser({ email, email_confirm:true, user_metadata:{ source:"v3-import", v3_id:u.id, account_type:u.accountType } });
      if(error) throw new Error("createUser:"+error.message); uid=data.user.id; res.created++;
    }
    await supabase.from("users").update({ first_name:first||null, last_name:last||null, display_name:fullName, phone:clean(u.phone)||null,
      address_city:clean(c.addressCity)||null, address_state:clean(c.addressState)||null, address_country:countryOrNull(c.addressCountry), address_zip:clean(c.addressZip)||null,
      creation_reference:"v3-import", status:"active" }).eq("id",uid);
    if(pl.admin){ if(ADMIN_GRANT_EMAILS.has(email)){ if(platformTenantId){ await ensureMembership(platformTenantId,uid,"platform_admin"); res.admins++; } } else { res.staff++; } }
    else if(pl.r==="candidate"){ const tid=await ensureTenant(slugify(pl.p,u.id),fullName,pl.t); await ensureMembership(tid,uid,pl.r); await ensureCandidateProfile(uid,u,c); await ensureGoals(uid,u); await ensureSpecialties(uid,u); }
    else { const tid=await ensureTenant(slugify(pl.p,u.id),companyName,pl.t); await ensureMembership(tid,uid,pl.r); await ensureClientProfile(tid,u); }
    await ensureLegacy(uid,u);
    res.ok++;
  } catch(e){ res.errors++; if(res.errSamples.length<15) res.errSamples.push(email.slice(0,4)+"***: "+e.message); }
}

async function runPool(items, worker){ let i=0; const workers=Array.from({length:CONC},async()=>{ while(i<items.length){ const idx=i++; await worker(items[idx],idx); } }); await Promise.all(workers); }

(async () => {
  const users = JSON.parse(fs.readFileSync(path.join(V3,"v3-users-prod.json"),"utf8"));
  const byEmail=new Map(); let blocked=0, dupes=0;
  for(const u of users){ const e=clean(u.email).toLowerCase(); if(!e) continue; if(isBlocked(e)){blocked++;continue;} const prev=byEmail.get(e); if(!prev) byEmail.set(e,u); else { const newer=(u.dateCreated||0)>=(prev.dateCreated||0)?u:prev; byEmail.set(e,newer); dupes++; } }
  let batch=[...byEmail.values()];
  if(LIMIT!==Infinity) batch=batch.slice(0,LIMIT);
  const talent=batch.filter(u=>u.accountType==="talent").length, client=batch.filter(u=>u.accountType==="client").length, admin=batch.filter(u=>u.accountType==="administrator").length;
  console.log(`MODE=${MODE} MIGRATE_FILES=${MIGRATE_FILES} CONC=${CONC}  processing=${batch.length} (reps=${talent} companies=${client} admins=${admin})  blocked=${blocked} dupes-collapsed=${dupes}`);
  if(MODE==="dry"){
    let vroles=0,vind=0,vcomp=0; for(const u of batch){ if(u.talentData){ vroles+=M.filterEnum(u.talentData.experience?.salesRoles,"sales_role").length?1:0; vind+=M.mapIndustries(u.talentData.experience?.industries).length?1:0; } if(u.talentData?.goals) vcomp+=M.filterEnum(u.talentData.goals.compensationTypes,"compensation_type").length?1:0; }
    console.log(`  reps with mappable specialties=${vroles}  with industries=${vind}  with comp goals=${vcomp}`);
    console.log("(dry run — nothing written)"); return;
  }
  const { data: plat } = await supabase.from("tenants").select("id").eq("slug","remoterep-platform").maybeSingle();
  const platformTenantId = plat?plat.id:null;
  const res={ created:0,reused:0,ok:0,errors:0,admins:0,staff:0,skippedExisting:0,errSamples:[] };
  let done=0; const t0=Date.now();
  await runPool(batch, async (u)=>{ await processUser(u,platformTenantId,res); if(++done%100===0) console.log(`  …${done}/${batch.length}  (created=${res.created} reused=${res.reused} err=${res.errors}) ${Math.round((Date.now()-t0)/1000)}s`); });
  console.log("\nSummary:", JSON.stringify(res, null, 0));
})();
