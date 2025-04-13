import { BaseTool, ToolError } from "./base";
import { search, SafeSearchType } from 'duck-duck-scrape';

/** Perform a DuckDuckGo search and return a list of relevant result links. */
export class DuckDuckGoSearch extends BaseTool {
  constructor() {
    super(
      "duckduckgo_search",
      "Search the web via DuckDuckGo and return a list of result URLs for the query.",
      {
        type: "object",
        properties: {
          query: { type: "string", description: "(required) Search query to submit to DuckDuckGo." },
          num_results: { type: "integer", description: "(optional) Number of results to return (default 10).", default: 10 },
          safe_search: { type: "string", description: "(optional) Safe search level (OFF, MODERATE, STRICT). Default is MODERATE.", default: "MODERATE" }
        },
        required: ["query"]
      }
    );
  }

  async execute(args: { query: string; num_results?: number; safe_search?: string }): Promise<string> {
    const { query, num_results = 10, safe_search = "MODERATE" } = args;
    if (!query) throw new ToolError("Query is required for DuckDuckGo search");

    try {

      // 将安全搜索级别字符串转换为枚举值
      let safeSearchLevel = SafeSearchType.MODERATE;
      if (safe_search === "OFF") safeSearchLevel = SafeSearchType.OFF;
      else if (safe_search === "STRICT") safeSearchLevel = SafeSearchType.STRICT;

      const searchResults = await search(query, {
        safeSearch: safeSearchLevel,
      });

      if (!searchResults || searchResults.noResults || !searchResults.results || searchResults.results.length === 0) {
        return "No results found.";
      }

      // 获取指定数量的结果
      const results = searchResults.results.slice(0, num_results);

      // 只返回结果的 URL
      const urls = results.map(res => res.url).filter(url => !!url);

      return urls.join("\n");
    } catch (e: any) {
      throw new ToolError("DuckDuckGo search failed: " + e.message);
    }
  }
} 