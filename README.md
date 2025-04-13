# OpenManus-node

[English Version](README.md) | [中文版](README_zh.md)

## Project Introduction

OpenManus-node is a Node.js and TypeScript recreation of the [mannaandpoem/OpenManus](https://github.com/mannaandpoem/OpenManus) project. While the original project is a Python-based open-source AI agent, this version reimplements it using the Node.js technology stack.

It's important to note that since the browser-use tool in the original project currently only supports Python, this project implements a simplified Node.js version as an alternative. While the functionality may not be as complete as the original, it is sufficient to meet basic web browsing and information retrieval needs.

OpenManus is an open-source Node.js and TypeScript project that serves as an alternative to the proprietary Manus AI agent. It provides a general-purpose AI agent platform capable of performing complex, multi-step tasks autonomously. By leveraging powerful Large Language Models (LLMs) (like GPT-4 or other compatible models), OpenManus can understand user instructions, break down tasks, use external tools, and generate solutions without requiring constant human guidance. The goal of OpenManus is to make advanced AI agent capabilities accessible to everyone – no invite codes, no paywalls – allowing developers and users to run their own AI agent with full control and customization.

OpenManus is designed with flexibility and extensibility in mind. The project's modular architecture lets you integrate various tools and services or even plug in different AI models. This means you can tailor the agent to different purposes, whether it's web research, data analysis, coding assistance, or content generation. Built by a community (originating from the MetaGPT team) in a short time frame, OpenManus demonstrates what's possible when the AI community collaborates. It's a young project under active development, welcoming contributions and feedback to help improve its capabilities. With OpenManus, you can experiment with an autonomous AI agent on your own infrastructure, ensuring privacy and transparency since all code is open-source.

## Installation and Usage

Follow these steps to set up and run OpenManus on your local machine. Ensure you have **Node.js (v18 or newer)** and **npm** (or Yarn) installed.

1. **Clone the Repository**: Download the OpenManus project source code from GitHub.
   ```bash
   git clone https://github.com/rxyshww/OpenManus-node.git
   cd OpenManus-node
   ```
2. **Install Dependencies**: Use npm (or Yarn) to install all required Node.js packages.
   ```bash
   npm install
   ```
3. **Set Environment Variables**: OpenManus requires API keys for the AI models (and any other services) it uses. For example, if using OpenAI's API, you need to provide your API key. Create a `.env` file (or use your preferred method of setting environment variables) in the project root and add the necessary keys:
   ```bash
   # .env file example
   OPENAI_MODEL=your-model-name
   OPENAI_BASE_URL=your-base-url
   OPENAI_API_KEY=your-api-key
   ```
   Make sure to replace the example values with your actual API keys. You can also adjust other configuration options (such as model names or settings) in a config file or environment variables as needed.
4. **Build the Project**: Compile the TypeScript source code to JavaScript (this step will create a `dist` directory with compiled files).
   ```bash
   npm run build
   ```
   _(If the project is set up to run TypeScript directly or uses ts-node, building might not be necessary. In that case, you can skip this step.)_
5. **Development Mode**: If you want to see changes in real-time during development, you can run the project in development mode:
   ```bash
   npm run dev
   ```
   This will start the project and watch for file changes, automatically recompiling and restarting the service when you modify the code. This is ideal for development and debugging.
6. **Run OpenManus**: Start the OpenManus agent. You can run it in interactive mode via the command line:
   ```bash
   npm start
   ```
   This will launch the OpenManus agent. You will typically be prompted in the terminal to enter a task or command for the AI agent to perform. Simply type in your request and press enter.

Once running, OpenManus will process your input, engage the AI model, and utilize its tools to carry out the task. You can interact with the agent in a conversational manner via the CLI. For example, you can ask it questions or give it a project to work on, and it will continually output its thought process and final results to the terminal.

_Note:_ By default, OpenManus runs as a CLI tool. Advanced users can also integrate OpenManus into other applications or use it as a library, thanks to its modular API-first design. (For instance, if OpenManus provides an HTTP API or function calls, you could send tasks programmatically instead of via the CLI.) Check the project documentation for any such usage details.

## Feature List

OpenManus comes with a variety of powerful features and tools that together enable it to function as a versatile AI agent. Below are the key functionalities and integrated tools, along with their descriptions:

- **Autonomous Task Execution**: Give OpenManus a high-level goal or problem, and it will autonomously break the task into sub-tasks and figure out how to solve it step by step. The agent can make decisions on which actions to take (such as which tool to use next) without additional prompts. This allows it to handle complex tasks (e.g., "Research and compile a report on the latest trends in renewable energy") with minimal human intervention.
- **LLM Integration**: OpenManus integrates with Large Language Models (like OpenAI's GPT-4/GPT-4o or Anthropic's Claude) to drive its reasoning and conversation. You can configure which model to use via the settings. The agent uses the LLM to interpret instructions, generate plans, and produce natural language output. By abstracting the model behind a configuration, OpenManus makes it easy to switch LLMs or even use local models.
- **Web Browsing Tool**: The agent can perform web searches and navigate webpages to gather information from the internet. Using this tool, OpenManus can autonomously query search engines, click on results, and scrape content from websites. This is crucial for tasks like researching a topic, finding up-to-date information, or pulling data from online sources in real-time. (For example, if asked to "find the latest news about a specific company," it can search the web and read relevant news articles.)
- **Code Execution Tool**: OpenManus is capable of writing and running code to solve problems. It can generate code in various programming languages (like Python, JavaScript, etc.) and execute that code in a sandboxed environment. This feature enables the agent to perform computations, data analysis, or even build simple applications as part of its task. For instance, if asked to "generate a chart from a dataset," the agent could write a Python script to process the data and produce the result.
- **System Command & File Management**: With proper safeguards, OpenManus can interact with the operating system to create or read files, run command-line operations, or manage content on disk. This tool allows the agent to handle tasks such as saving its output to a file, reading input files (e.g. reading a text or CSV file for analysis), or executing system commands necessary for a task. (For example, it might use a command to download a resource or use a CLI tool as part of solving a problem.)
- **Memory and Context**: The agent maintains an internal memory of previous instructions, intermediate results, and important information encountered during a session. This means it can use context from earlier in the conversation or task to inform later steps. The long-term memory helps in complex tasks where multiple steps are interdependent, and ensures the agent doesn't repeat work or contradict itself. You can also configure memory limits or persistence as needed.
- **Modular and Extensible Design**: OpenManus is built to be developer-friendly. Its codebase is modular, making it straightforward to add new tools or integrations. Developers can extend OpenManus by adding custom tools (for example, connecting an external API like a weather service or database) or by improving the reasoning strategies. Because it's open-source, you have full freedom to modify how the agent works, fine-tune model parameters, or integrate new AI services. Community contributions are encouraged, so the feature set is expected to grow.
- **API and GUI Options**: In addition to the CLI usage, OpenManus is designed with an API-first approach. This means you could run it as a backend service and send it tasks via HTTP requests (useful for integrating into web applications or other systems). A basic web-based user interface might also be available or in development, allowing you to interact with the agent through a browser. These interfaces provide alternative ways to use OpenManus beyond the terminal.

Each of these features works in tandem to emulate the capabilities of Manus AI in an open environment. For example, when given a complex job, OpenManus might use its LLM integration to break down the problem and draft a plan, then invoke the Web Browsing tool to gather data, use the Code Execution tool to analyze that data, and finally produce a comprehensive answer – all autonomously. The combination of internet access, code execution, and memory makes OpenManus a **generalist AI agent**, meaning it can tackle a wide array of tasks across different domains.

## Examples

To better understand how OpenManus can be used, here are a couple of example scenarios with sample commands and simplified input/output interactions:

**Example 1: Travel Itinerary Planner**  
Imagine you want an AI to plan a vacation. Once OpenManus is running, you can type a request like this in the terminal:

```bash
> Plan a 3-day trip to Tokyo, with flight and hotel suggestions for each day.
```

**What happens:** The OpenManus agent will interpret your request and begin working on it autonomously. It may start by using the **Web Browsing tool** to search for flights to Tokyo on your travel dates, then find popular tourist attractions and hotels. It could then use its reasoning to organize a day-by-day itinerary. As it works, you'll see intermediate output describing its actions, for example:

```
Agent: Searching for flight information from your location to Tokyo...
Agent: Found several flight options. Next, looking up top attractions in Tokyo...
Agent: Gathering details on highly rated hotels in Tokyo...
Agent: Compiling itinerary and pricing details...
```

After a short while, OpenManus will output a comprehensive itinerary, for example:

```
**Trip Plan for Tokyo (3 Days):**

- Day 1: Arrival in Tokyo
  - Morning: Flight from NYC to Tokyo (Narita Airport) arriving at 10:00 AM.
  - Afternoon: Check-in at Shinjuku Grand Hotel (4-star, central Tokyo).
  - Evening: Visit Shinjuku Gyoen National Garden and dinner at Ichiran Ramen.

- Day 2: Sightseeing
  - Morning: Visit Senso-ji Temple in Asakusa.
  - Afternoon: Tour the Tokyo Skytree for city views.
  - Evening: Stroll through Akihabara (electronics and anime district).

- Day 3: Culture and Departure
  - Morning: Explore Meiji Shrine and Yoyogi Park.
  - Afternoon: Shopping in Harajuku.
  - Evening: Flight back to NYC at 7:00 PM from Narita Airport.

*Flight Details:* ... (flight numbers, airlines, prices)
*Hotel Options:* ... (hotel price per night, link to booking)

Enjoy your trip!
```

_(The actual output may vary, but this is a simplified example of the kind of comprehensive answer OpenManus can generate by pulling real data and organizing it.)_

**Example 2: Coding Assistant**  
You can also use OpenManus to help with programming tasks. For instance, you could ask:

```bash
> Write a JavaScript function that sorts an array of numbers using the quicksort algorithm.
```

OpenManus will think through the problem using the LLM and then likely use the **Code Execution tool** to verify the solution. You might see it outline the approach and even run a test:

```
Agent: Drafting a quicksort implementation in JavaScript...
Agent: Code written. Now testing the function with a sample array [5,2,8,1,4]...
Agent: Test successful. The array was sorted to [1,2,4,5,8].
```

Then it will provide the final answer:

```javascript
function quickSort(arr) {
  if (arr.length < 2) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}
```

This output includes the JavaScript function as requested. OpenManus not only wrote the code but also tested it to ensure correctness before presenting it. You could follow up with additional questions or ask it to optimize the code further, and it would continue the conversation remembering the context.

These examples demonstrate how OpenManus can be applied to different domains. Whether you need a virtual research assistant, a travel planner, a coding helper, or something else entirely, you can interact with OpenManus using plain English (or other supported languages for the LLM) and get meaningful, context-aware results. The agent's use of tools is seamless – it decides on the fly how to solve your request and informs you of its process along the way.

Feel free to explore other tasks with OpenManus:

- Ask it to analyze a dataset or CSV file (it might use code execution to do so).
- Have it write a summary or report on a given topic (it can browse the web for information and then compile a report).
- Use it for brainstorming ideas or creating content (it can leverage the LLM's creativity and gather facts via the browser tool).

Each time, the power of OpenManus lies in its ability to autonomously figure out _how_ to get to the answer – using the right tool for each step – so you can get results that would normally require multiple separate tools or a lot of manual effort.

## Community Contributions

OpenManus-node is an open-source community project, and we warmly welcome contributions of all kinds! Whether you're an experienced developer or a newcomer, you can get involved in the following ways:

- **Code Contributions**: Help us improve existing features or add new ones. We're especially looking forward to enhancements to the browser-use tool with more comprehensive Node.js implementations.
- **Documentation Improvements**: Enhance documentation, add examples, or fix errors.
- **Issue Reporting**: Report bugs or suggest new features.
- **Use Case Sharing**: Share innovative ways you've used OpenManus-node and your success stories.

If you'd like to contribute code, please follow these steps:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

We'll review your contribution as soon as possible and provide feedback. Thank you for supporting the OpenManus-node project!

## License

OpenManus is an open-source project released under the **MIT License**. This means you are free to use, modify, and distribute the code as long as you include the original license notice. For more details, refer to the `LICENSE` file in the repository. In short, OpenManus's MIT License permits commercial and non-commercial use, making it easy for the community to build upon this work. Enjoy the freedom of open-source, and happy hacking with OpenManus!

---

[中文版](README_zh.md)
