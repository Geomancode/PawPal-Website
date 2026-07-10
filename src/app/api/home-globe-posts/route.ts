import { reportError } from "@/lib/errorReporting";
import {
  createHomeGlobePostsResponse,
  type HomeGlobeRpcClient,
} from "@/lib/homeGlobePosts";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const homeGlobeRpcClient: HomeGlobeRpcClient = {
  async rpc(functionName, args) {
    const { data, error } = await supabaseServer.rpc(functionName, args);
    return { data, error };
  },
};

export async function GET() {
  return createHomeGlobePostsResponse(homeGlobeRpcClient, (error) => {
    reportError(error, {
      route: "/api/home-globe-posts",
      rpc: "homepage_globe_hot_posts",
    });
  });
}
