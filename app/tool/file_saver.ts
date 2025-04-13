import { BaseTool, ToolError } from "./base";
import { mkdir, writeFile } from "fs/promises";
import * as path from "path";

/** Save content to a local file at a specified path. */
export class FileSaver extends BaseTool {
  constructor() {
    super(
      "file_saver",
      "Save content to a local file at a specified path.",
      {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "(required) The content to save to the file."
          },
          file_path: {
            type: "string",
            description: "(required) The path (including filename) where the file should be saved."
          },
          mode: {
            type: "string",
            description: "(optional) File write mode: 'w' (overwrite) or 'a' (append). Default 'w'.",
            enum: ["w", "a"],
            default: "w"
          }
        },
        required: ["content", "file_path"]
      }
    );
  }
  async execute(args: { content: string; file_path: string; mode?: string }): Promise<string> {
    const { content, file_path, mode = "w" } = args;
    if (!content || !file_path) throw new ToolError("content and file_path are required");
    try {
      // Ensure directory exists
      const dir = path.dirname(file_path);
      if (dir && dir !== "." && dir !== "..") {
        await mkdir(dir, { recursive: true });
      }
      // Write or append content
      const flag = mode === "a" ? "a" : "w";
      await writeFile(file_path, content, { encoding: "utf-8", flag });
      return `Content successfully saved to ${file_path}`;
    } catch (e: any) {
      return `Error saving file: ${e.message}`;
    }
  }
}
