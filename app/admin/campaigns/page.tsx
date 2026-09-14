import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { CampaignForm } from "./campaign-form";
import { CampaignStatusToggle } from "./status-toggle";

export default async function CampaignsPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: campaigns } = await context.supabase
    .from("campaigns")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Campaigns
      </h1>

      <div className="mt-6">
        <CampaignForm />
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {campaigns?.map((campaign) => (
          <li
            key={campaign.id}
            className="flex items-center justify-between py-3"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {campaign.title}
              </p>
              <p className="text-sm text-zinc-500">{campaign.status}</p>
            </div>
            <CampaignStatusToggle
              campaignId={campaign.id}
              status={campaign.status}
            />
          </li>
        ))}
        {campaigns?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">No campaigns yet.</li>
        )}
      </ul>
    </div>
  );
}
