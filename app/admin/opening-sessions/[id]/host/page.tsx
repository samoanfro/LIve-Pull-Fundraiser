import { getHostConsoleData } from "../../actions";
import { HostConsole } from "./host-console";

export default async function HostConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entries = await getHostConsoleData(id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Host Console
      </h1>
      <div className="mt-6">
        <HostConsole sessionId={id} entries={entries} />
      </div>
    </div>
  );
}
