// import { PlanningAgent } from "./planning";
import { ToolCallAgent } from "./toolcall";
import { ToolCollection } from "../tool/base";
import { PythonExecute } from "../tool/python_execute";
import { Bash } from "../tool/bash";
//import { GoogleSearch } from "../tool/google_search";
import { DuckDuckGoSearch } from "../tool/duckduckgo_search";
import { BrowserUseTool } from "../tool/browser_use_tool";
import { FileSaver } from "../tool/file_saver";
import { StrReplaceEditor } from "../tool/str_replace_editor";
import { PlanningTool } from "../tool/planning";
import { CreateChatCompletion } from "../tool/create_chat_completion";
import { Terminate } from "../tool/terminate";
import { SYSTEM_PROMPT, NEXT_STEP_PROMPT } from "../prompt/manus";

/** Manus: a versatile general-purpose agent with a comprehensive set of tools and planning ability */
export class Manus extends ToolCallAgent {
  // Default system and next-step prompts
  static SYSTEM_PROMPT: string = SYSTEM_PROMPT;
  static NEXT_STEP_PROMPT: string = NEXT_STEP_PROMPT;

  constructor(options: any = {}) {
    super({
      name: "Manus",
      description: "A versatile agent that can solve various tasks using multiple tools",
      system_prompt: Manus.SYSTEM_PROMPT,
      next_step_prompt: Manus.NEXT_STEP_PROMPT,
      max_steps: options.max_steps ?? 30
    });
    // Define a comprehensive set of tools for Manus
    this["available_tools"] = new ToolCollection(
      new PythonExecute(),
      new Bash(),
      // new GoogleSearch(),
      new BrowserUseTool(),
      new FileSaver(),
      new StrReplaceEditor(),
      new PlanningTool(),
      new CreateChatCompletion(),
      new Terminate(),
      new DuckDuckGoSearch()
    );
  }
}
