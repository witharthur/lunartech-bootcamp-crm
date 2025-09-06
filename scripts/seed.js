/* Simple seed that can run in a browser console via import, or adapted for Node bundlers. */
import { resetAll, seedLeads } from "../src/api/mockBackend";

export function runSeed() {
  resetAll();
  const leads = seedLeads(20);
  return leads;
}

export default runSeed;
