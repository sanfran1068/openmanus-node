import { BaseTool, ToolError } from "./base";
import { chromium, Browser, Page } from "playwright";

/** Interact with a headless browser: navigate, click elements, input text, and extract content. */
export class BrowserUseTool extends BaseTool {
  private static browser: Browser | null = null;
  private static page: Page | null = null;

  constructor() {
    super(
      "browser_use",
      "Use a web browser: navigate to pages, click elements, input text, and extract page content.",
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "(required) The action to perform: 'navigate', 'click', 'input', 'extract', or 'close'.",
            enum: ["navigate", "click", "input", "extract", "close"]
          },
          url: { type: "string", description: "(required for navigate) URL to navigate to." },
          selector: { type: "string", description: "(required for click/input/extract) DOM selector for the element." },
          text: { type: "string", description: "(required for input) Text to input into the field." },
          autoClose: { type: "boolean", description: "(optional) Whether to automatically close the browser after the operation. Default is true." }
        },
        required: ["action"]
      }
    );
  }

  private async ensureBrowser(): Promise<Page> {
    if (!BrowserUseTool.browser) {
      BrowserUseTool.browser = await chromium.launch({ headless: false });
      const context = await BrowserUseTool.browser.newContext();
      BrowserUseTool.page = await context.newPage();
    }
    return BrowserUseTool.page!;
  }

  private async closeBrowser(): Promise<void> {
    if (BrowserUseTool.browser) {
      await BrowserUseTool.browser.close();
      BrowserUseTool.browser = null;
      BrowserUseTool.page = null;
    }
  }

  async execute(args: { action: string; url?: string; selector?: string; text?: string; autoClose?: boolean }): Promise<string> {
    const { action, url, selector, text, autoClose = true } = args;

    if (action === "close") {
      await this.closeBrowser();
      return "Browser closed successfully";
    }

    const page = await this.ensureBrowser();
    try {
      let result: string;

      switch (action) {
        case "navigate":
          console.log("Navigating to", url);
          if (!url) throw new ToolError("URL is required for 'navigate' action");
          await page.goto(url, { waitUntil: "domcontentloaded" });
          result = `Navigated to ${url}`;
          break;
        case "click":
          if (!selector) throw new ToolError("selector is required for 'click' action");
          await page.click(selector).catch(() => {
            throw new ToolError(`Failed to click element '${selector}'`);
          });
          result = `Clicked element ${selector}`;
          break;
        case "input":
          if (!selector || text === undefined) throw new ToolError("selector and text are required for 'input' action");
          await page.fill(selector, text).catch(() => {
            throw new ToolError(`Failed to input text into '${selector}'`);
          });
          result = `Input text into ${selector}`;
          break;
        case "extract":
          if (!selector) throw new ToolError("selector is required for 'extract' action");
          const content = await page.textContent(selector).catch(() => {
            throw new ToolError(`Failed to extract content from '${selector}'`);
          });
          result = content || "(No content)";
          break;
        default:
          throw new ToolError("Unknown action");
      }

      // 自动关闭浏览器（除非明确指定不关闭）
      if (autoClose) {
        await this.closeBrowser();
        result += " (Browser closed)";
      }

      return result;
    } catch (e: any) {
      console.log(e);
      // 发生错误时也关闭浏览器
      if (autoClose) {
        await this.closeBrowser();
      }
      if (e instanceof ToolError) throw e;
      throw new ToolError(`Browser error: ${e.message}`);
    }
  }
}
