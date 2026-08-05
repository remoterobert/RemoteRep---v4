const { execFileSync } = require("child_process");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const S3="remoterep-production.s3.amazonaws.com";
function dl(url){ const tmp="/tmp/_dl_"+Math.floor(Math.random()*1e9); try{ execFileSync("curl",["-s","-m","30","-o",tmp,url],{stdio:"ignore"}); if(fs.existsSync(tmp)&&fs.statSync(tmp).size>0) return tmp; }catch{} return null; }
function ctOf(url){ return /\.png/i.test(url)?"image/png":/\.jpe?g/i.test(url)?"image/jpeg":/\.webp/i.test(url)?"image/webp":"application/octet-stream"; }
function extOf(ct){ return ct==="image/png"?".png":ct==="image/jpeg"?".jpg":ct==="image/webp"?".webp":""; }
async function migrate(url,bucket,folder,base){ if(!url||!url.includes(S3)) return null; const tmp=dl(url); if(!tmp) return null; try{ const ct=ctOf(url); const buf=fs.readFileSync(tmp); const dest=folder+"/"+base+extOf(ct); const {error}=await s.storage.from(bucket).upload(dest,buf,{contentType:ct,upsert:true}); fs.unlinkSync(tmp); if(error&&!/exists|already/i.test(error.message)) return null; return s.storage.from(bucket).getPublicUrl(dest).data.publicUrl; }catch{ try{fs.unlinkSync(tmp);}catch{} return null; } }
(async()=>{
  let pOk=0,pF=0,lOk=0,lF=0;
  const { data: reps } = await s.from("candidate_profiles").select("user_id,photo_url").like("photo_url","%amazonaws.com%");
  for(const r of reps||[]){ const u=await migrate(r.photo_url,"photos",r.user_id,"profile"); if(u){ await s.from("candidate_profiles").update({photo_url:u}).eq("user_id",r.user_id); pOk++; } else pF++; }
  const { data: cos } = await s.from("client_profiles").select("tenant_id,logo_url").like("logo_url","%amazonaws.com%");
  for(const c of cos||[]){ const u=await migrate(c.logo_url,"logos",c.tenant_id,"logo"); if(u){ await s.from("client_profiles").update({logo_url:u}).eq("tenant_id",c.tenant_id); lOk++; } else lF++; }
  console.log("Photos: migrated="+pOk+" failed="+pF+"   Logos: migrated="+lOk+" failed="+lF);
})();
