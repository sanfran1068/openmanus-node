import { MCPServer } from './mcp/server';
import logger from './logger';

async function main() {
    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        const transport = args[0] || 'stdio';

        // Create and run server
        const server = new MCPServer();
        await server.run(transport);
    } catch (error) {
        logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

// Run the server
main().catch((error) => {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
});