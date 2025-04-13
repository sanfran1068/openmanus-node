import express from 'express';
import { createServer } from 'http';
import { main } from './main';

const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 流式响应接口
app.post('/api/prompt', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 设置 SSE 相关的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 创建一个可写流来发送数据
    const sendData = (data: string) => {
      res.write(`data: ${JSON.stringify({ text: data })}\n\n`);
    };

    // 创建一个 Promise 来包装 main 函数的执行
    await new Promise<void>((resolve, reject) => {
      // 重写 console.log 来捕获输出
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        sendData(message);
        originalConsoleLog.apply(console, args);
      };

      // 执行 main 函数
      main(message)
        .then(() => {
          console.log = originalConsoleLog; // 恢复原始的 console.log
          resolve();
        })
        .catch((error) => {
          console.log = originalConsoleLog; // 恢复原始的 console.log
          reject(error);
        });
    });

    // 发送结束标记
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务器
const server = createServer(app);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 