import { BaseTool, ToolError } from "./base";
import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);

/** Execute Bash commands in a sandboxed manner (persistent working directory) */
export class Bash extends BaseTool {
  private static currentDir: string = process.cwd();  // current working directory for the shell session
  constructor() {
    super(
      "bash",
      "Execute a Bash shell command. Use for file system operations or running scripts. Persistent working directory maintained across calls.",
      {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "(required) The bash command to execute"
          }
        },
        required: ["command"]
      }
    );
  }
  async execute(args: { command: string }): Promise<string> {
    const { command } = args;
    if (!command) throw new ToolError("No command provided");
    // Handle directory changes persistently
    if (command.startsWith("cd ")) {
      const targetDir = command.slice(3).trim();
      Bash.currentDir = require("path").resolve(Bash.currentDir, targetDir);
      return `Changed directory to ${Bash.currentDir}`;
    }
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: Bash.currentDir, timeout: 5000 });
      if (stderr && stderr.trim()) {
        // return stderr as part of output if any (not throwing to allow capturing command errors)
        return stderr.trim();
      }
      return stdout.trim() || "(No output)";
    } catch (e: any) {
      if (e.killed) {
        throw new ToolError("Command timed out or was killed");
      }
      const errMsg = e.stderr?.trim() || e.message;
      return `Error: ${errMsg}`;
    }
  }
}
