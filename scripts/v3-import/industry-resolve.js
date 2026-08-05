const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const V3 = process.env.V3;
const THRESHOLD = 25;
const SYN = {
  "e-commerce":"e-commerce-platforms","e-commerce retail":"e-commerce-platforms",
  "digital marketing":"digital-marketing-agencies",
  "saas":"software-as-a-service-saas-companies","saas (software as a service)":"software-as-a-service-saas-companies",
  "ai and machine learning":"artificial-intelligence-and-machine-learning-companies",
  "content marketing":"content-marketing-agencies","social media marketing":"social-media-management-firms",
  "cybersecurity":"cybersecurity-software-providers","online education":"online-course-providers",
  "edtech":"e-learning-platforms-and-learning-management-systems-lms",
  "educational software":"e-learning-platforms-and-learning-management-systems-lms",
};
const slugify = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);
(async () => {
  const { data: inds } = await s.from("industries").select("slug, display_name");
  const slugSet = new Set(), dispToSlug = new Map();
  for (const i of inds) { slugSet.add(i.slug); dispToSlug.set(i.display_name.toLowerCase(), i.slug); }
  const users = JSON.parse(fs.readFileSync(V3 + "/v3-users-prod.json", "utf8"));
  const counts = new Map();
  const add = (arr) => { for (const v of (Array.isArray(arr)?arr:(arr?[arr]:[]))) if (typeof v==="string"&&v.trim()) counts.set(v.trim(), (counts.get(v.trim())||0)+1); };
  for (const u of users) { if (u.talentData) { add(u.talentData.experience&&u.talentData.experience.industries); add(u.talentData.goals&&u.talentData.goals.industries);} if (u.clientData) add(u.clientData.profile&&u.clientData.profile.industry); }
  const map = {}; const newInd = new Map(); const usedSlugs = new Set(slugSet);
  let matched=0, added=0, other=0, occM=0, occA=0, occO=0;
  for (const [label, n] of counts) {
    const low = label.toLowerCase(); let slug = null;
    if (slugSet.has(label)) slug = label;
    else if (dispToSlug.has(low)) slug = dispToSlug.get(low);
    else if (SYN[low]) slug = SYN[low];
    if (slug) { matched++; occM+=n; }
    else if (n >= THRESHOLD) { let sl = slugify(label); while (usedSlugs.has(sl)) sl += "-x"; usedSlugs.add(sl); newInd.set(sl, label); slug = sl; added++; occA+=n; }
    else { slug = "other"; other++; occO+=n; }
    map[label] = slug;
  }
  // insert any NEW industries
  if (newInd.size > 0) {
    let order = 3000;
    const rows = [...newInd].map(([slug, display_name]) => ({ slug, display_name, active: true, display_order: order++ }));
    const { error } = await s.from("industries").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
    if (error) { console.log("industry insert ERROR:", error.message); return; }
  }
  fs.writeFileSync(V3 + "/industry_map.json", JSON.stringify(map));
  const tot = occM+occA+occO;
  console.log("Distinct v3 industry labels:", counts.size);
  console.log("  matched existing:", matched, "("+occM+" occ)");
  console.log("  newly added     :", added, "("+occA+" occ) ->", [...newInd.values()].slice(0,10).join(", ") + (newInd.size>10?" …":""));
  console.log("  bucketed 'other':", other, "("+occO+" occ)");
  console.log("  preserved specifically: " + (100*(occM+occA)/tot).toFixed(1) + "%");
  console.log("Wrote industry_map.json (" + Object.keys(map).length + " labels)");
})();
