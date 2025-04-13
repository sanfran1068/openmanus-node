import { Manus } from "./agent/manus";
import { PlanningFlow } from "./flow/planning";
import dotenv from "dotenv";
import logger from "./logger";

// 暂时注释掉代理设置，以便应用程序可以启动
// import proxy from "node-global-proxy";
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// 
// console.log(proxy);
// // 代理设置在ESM模式下可能需要不同的导入方式
// // 暂时跳过代理设置

dotenv.config();

// 记录应用启动
logger.highlight("OpenManus (Node.js) - 应用启动");

// Choose between direct agent or planning flow based on use case
const agent = new Manus();
// (If you want to use planning flow for complex tasks, you could use PlanningFlow instead)
// const flow = new PlanningFlow();

export async function main(prompt: string) {
  try {
    logger.highlight(`接收到用户请求: "${prompt}"`);
    console.log("Processing your request...");
    const result = await agent.run(prompt);
    logger.success("Agent完成请求处理");
    console.log(`Agent: ${result}`);
    return result;
  } catch (err: any) {
    logger.error_detail(`处理请求时发生错误: ${err.message}`);
    console.error("Error:", err.message);
    throw err;
  }
}

// 如果是直接运行 main.ts，则启动命令行交互
// if (require.main === module) {
//   const readline = require('readline');
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });

//   console.log("OpenManus (Node.js) – Enter your prompt (or 'exit' to quit):");
//   rl.prompt();

//   rl.on("line", async (input: string) => {
//     const query = input.trim();
//     if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
//       logger.info("用户请求退出应用");
//       rl.close();
//       return;
//     }
//     if (!query) {
//       rl.prompt();
//       return;
//     }
//     try {
//       await main(query);
//     } catch (err) {
//       // 错误已经在 main 函数中处理
//     }
//     console.log("\nEnter your prompt (or 'exit' to quit):");
//     rl.prompt();
//   });

//   rl.on("close", () => {
//     logger.success("应用关闭");
//     console.log("Goodbye!");
//     process.exit(0);
//   });
// }
