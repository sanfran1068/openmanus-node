import { BaseTool, ToolError } from "./base";
import { writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);

/** Executes Python code in a sandbox (new process) with a timeout. */
export class PythonExecute extends BaseTool {
  constructor() {
    super(
      "python_execute",
      "Executes a piece of Python code. Use print statements to see outputs (return values aren't captured).",
      {
        type: "object",
        properties: {
          code: { type: "string", description: "(required) The Python code to execute." }
        },
        required: ["code"]
      }
    );
  }
  async execute(args: { code: string }): Promise<string> {
    const { code } = args;
    if (!code) throw new ToolError("No code provided");
    // Write code to a temporary file
    const tmpPath = "temp_code.py";
    try {
      await writeFile(tmpPath, code, "utf-8");
    } catch (e: any) {
      throw new ToolError("Failed to write temporary file for code execution");
    }
    try {
      // Execute the Python file
      const { stdout, stderr } = await execAsync(`python "${tmpPath}"`, { timeout: 5000 });
      if (stderr && stderr.trim()) {
        return stderr.trim();
      }
      return stdout.trim() || "(No output)";
    } catch (e: any) {
      if (e.killed) {
        throw new ToolError("Python execution timed out or was terminated");
      }
      const errMsg = e.stderr?.trim() || e.message;
      return `Error: ${errMsg}`;
    } finally {
      // Clean up temp file
      await unlink(tmpPath).catch(() => {/* ignore */ });
    }
  }
}
