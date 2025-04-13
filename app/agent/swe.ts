import { ToolCallAgent } from "./toolcall";
import { ToolCollection } from "../tool/base";
import { Bash } from "../tool/bash";
import { PythonExecute } from "../tool/python_execute";
import { FileSaver } from "../tool/file_saver";
import { StrReplaceEditor } from "../tool/str_replace_editor";
import { Terminate } from "../tool/terminate";

/** SWEAgent: an agent with tools useful for software engineering tasks (code exec, file editing, etc.) */
export class SWEAgent extends ToolCallAgent {
  constructor(options: any = {}) {
    super({
      name: "SWEAgent",
      description: "Agent specialized in software engineering tasks",
      ...options
    });
    // Define the toolset for coding/file tasks
    this["available_tools"] = new ToolCollection(
      new PythonExecute(),
      new Bash(),
      new FileSaver(),
      new StrReplaceEditor(),
      new Terminate()
    );
  }
}
