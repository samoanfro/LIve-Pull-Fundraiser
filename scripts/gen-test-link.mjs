import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx), l.slice(idx + 1)];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
);

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: "fred@rptaxes.com",
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(data.properties.action_link);
