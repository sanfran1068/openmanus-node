import { BaseTool, ToolError } from "./base";
import google from "googlethis";

/** Perform a Google search and return a list of relevant result links. */
export class GoogleSearch extends BaseTool {
  constructor() {
    super(
      "google_search",
      "Search the web via Google and return a list of result URLs for the query.",
      {
        type: "object",
        properties: {
          query: { type: "string", description: "(required) Search query to submit to Google." },
          num_results: { type: "integer", description: "(optional) Number of results to return (default 10).", default: 10 }
        },
        required: ["query"]
      }
    );
  }
  async execute(args: { query: string; num_results?: number }): Promise<string> {
    const { query, num_results = 10 } = args;
    if (!query) throw new ToolError("Query is required for Google search");
    try {
      console.log("Google search", query, num_results);
      const options = { page: 0, safe: false };
      const response = await google.search(query, options);
      const results = response.results.slice(0, num_results);

      console.log("Google search results", results);
      if (results.length === 0) {
        return "No results found.";
      }
      // Return only the URLs of the results
      const urls = results.map((res: any) => res.url).filter((url: string) => !!url);
      console.log("Google search results", urls);
      return urls.join("\n");
    } catch (e: any) {
      throw new ToolError("Google search failed: " + e.message);
    }
  }
}
