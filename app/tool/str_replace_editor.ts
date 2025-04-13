import { BaseTool, ToolError } from "./base";
import { readFile, writeFile, access } from "fs/promises";
import { constants } from "fs";

/** Tool for basic file editing: view file content, or find & replace text in a file. */
export class StrReplaceEditor extends BaseTool {
  constructor() {
    super(
      "str_replace_editor",
      "View or edit file content. Can open files and replace text.",
      {
        type: "object",
        properties: {
          file_path: { type: "string", description: "(required) Path of the file to open or edit." },
          find: { type: "string", description: "(optional) String to find in the file." },
          replace: { type: "string", description: "(optional) String to replace the found text with." }
        },
        required: ["file_path"]
      }
    );
  }
  async execute(args: { file_path: string; find?: string; replace?: string }): Promise<string> {
    const { file_path, find, replace } = args;
    if (!file_path) throw new ToolError("file_path is required");
    try {
      await access(file_path, constants.F_OK);
    } catch {
      // File does not exist
      if (find || replace) {
        throw new ToolError("File not found for editing");
      } else {
        throw new ToolError("File not found");
      }
    }
    // Read file content
    let content: string;
    try {
      content = await readFile(file_path, "utf-8");
    } catch (e) {
      throw new ToolError(`Failed to read file: ${file_path}`);
    }
    if (find === undefined && replace === undefined) {
      // If no find/replace provided, just return file content (or a trimmed portion if large)
      return content.length > 1000 ? content.substring(0, 1000) + "...(truncated)" : content;
    }
    if (find === undefined || replace === undefined) {
      throw new ToolError("Both 'find' and 'replace' must be provided to edit the file");
    }
    // Perform find & replace
    const newContent = content.split(find).join(replace);
    try {
      await writeFile(file_path, newContent, "utf-8");
    } catch (e) {
      throw new ToolError(`Failed to write changes to file: ${file_path}`);
    }
    return `Replaced all occurrences of "${find}" with "${replace}" in ${file_path}.`;
  }
}
