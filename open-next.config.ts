// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
	// Enable R2 caching to reduce CPU usage on repeated requests
	// See https://opennext.js.org/cloudflare/caching for more details
	incrementalCache: r2IncrementalCache
});
