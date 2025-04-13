import winston from 'winston';
import { format } from 'winston';
import chalk from 'chalk';

// 创建自定义格式
const customFormat = format.printf(({ level, message, timestamp }) => {
    // 为不同级别的日志添加不同颜色
    let coloredLevel = level.toUpperCase().padEnd(8);
    let formattedMessage = message as string;

    // 添加表情符号到消息前面
    if (formattedMessage.includes('✨') || formattedMessage.includes('🛠️') || formattedMessage.includes('🧰') ||
        formattedMessage.includes('🔧') || formattedMessage.includes('🎯') || formattedMessage.includes('❌')) {
        // 已经有表情符号，不需要添加
    } else if (level === 'error') {
        formattedMessage = `❌ ${formattedMessage}`;
    } else if (level === 'warn') {
        formattedMessage = `⚠️ ${formattedMessage}`;
    } else if (level === 'info') {
        formattedMessage = `ℹ️ ${formattedMessage}`;
    } else if (level === 'debug') {
        formattedMessage = `🔍 ${formattedMessage}`;
    }

    return `${timestamp} | ${coloredLevel} | ${formattedMessage}`;
});

// 创建日志记录器实例
const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        customFormat
    ),
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize({ all: true }),
                customFormat
            )
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// 确保logs目录存在
import fs from 'fs';
import path from 'path';

try {
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }
} catch (error) {
    console.error('无法创建日志目录:', error);
}

// 添加彩色日志方法
const colorizedLogger = {
    error: (message: string) => logger.error(message),
    warn: (message: string) => logger.warn(message),
    info: (message: string) => logger.info(message),
    debug: (message: string) => logger.debug(message),
    // 添加彩色日志方法
    success: (message: string) => logger.info(`✅ ${message}`),
    highlight: (message: string) => logger.info(`🔆 ${message}`),
    step: (message: string) => logger.info(`🔄 ${message}`),
    tool: (message: string) => logger.info(`🔧 ${message}`),
    thinking: (message: string) => logger.info(`✨ ${message}`),
    result: (message: string) => logger.info(`🎯 ${message}`),
    error_detail: (message: string) => logger.error(`💥 ${message}`),
};

export default colorizedLogger; 