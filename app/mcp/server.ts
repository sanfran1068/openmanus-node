import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BaseTool } from '../tool/base';
import { Bash } from '../tool/bash';
import { BrowserUseTool } from '../tool/browser_use_tool';
import { StrReplaceEditor } from '../tool/str_replace_editor';
import { Terminate } from '../tool/terminate';
import logger from '../logger';

export class MCPServer {
    private server: McpServer;
    private tools: Map<string, BaseTool>;

    constructor(name: string = "openmanus") {
        this.server = new McpServer({
            name,
            version: '1.0.0',
            description: 'OpenManus MCP Server',
            schema_version: 'v1'
        });
        this.tools = new Map();

        // Initialize standard tools
        this.tools.set("bash", new Bash());
        this.tools.set("browser", new BrowserUseTool());
        this.tools.set("editor", new StrReplaceEditor());
        this.tools.set("terminate", new Terminate());
    }

    public registerTool(tool: BaseTool, methodName?: string): void {
        const toolName = methodName || tool.name;
        const toolParam = tool.toParam();
        const toolFunction = toolParam?.function;

        if (!toolFunction) {
            logger.error(`Invalid tool function for ${toolName}`);
            return;
        }

        // Define the async function to be registered
        const toolMethod = async (kwargs: Record<string, any>) => {
            logger.info(`Executing ${toolName}: ${JSON.stringify(kwargs)}`);
            try {
                const result = await tool.execute(kwargs);
                logger.info(`Result of ${toolName}: ${result}`);

                // Handle different types of results
                if (typeof result === 'object') {
                    return JSON.stringify(result);
                }
                return result;
            } catch (error) {
                logger.error(`Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        };

        // Set method metadata
        Object.defineProperty(toolMethod, 'name', { value: toolName });
        Object.defineProperty(toolMethod, 'description', { value: this.buildDocstring(toolFunction) });

        // Store parameter schema
        const paramProps = toolFunction.parameters?.properties || {};
        const requiredParams = toolFunction.parameters?.required || [];
        const parameterSchema = Object.entries(paramProps).reduce((acc, [paramName, paramDetails]) => {
            acc[paramName] = {
                description: paramDetails.description || '',
                type: paramDetails.type || 'any',
                required: requiredParams.includes(paramName)
            };
            return acc;
        }, {} as Record<string, any>);

        Object.defineProperty(toolMethod, '_parameter_schema', { value: parameterSchema });

        // Register with server
        this.server.tool(toolName, parameterSchema, toolMethod);
        logger.info(`Registered tool: ${toolName}`);
    }

    private buildDocstring(toolFunction: any): string {
        const description = toolFunction.description || '';
        const paramProps = toolFunction.parameters?.properties || {};
        const requiredParams = toolFunction.parameters?.required || [];

        let docstring = description;
        if (Object.keys(paramProps).length > 0) {
            docstring += '\n\nParameters:\n';
            for (const [paramName, paramDetails] of Object.entries(paramProps)) {
                const requiredStr = requiredParams.includes(paramName) ? '(required)' : '(optional)';
                const paramType = (paramDetails as any).type || 'any';
                const paramDesc = (paramDetails as any).description || '';
                docstring += `    ${paramName} (${paramType}) ${requiredStr}: ${paramDesc}\n`;
            }
        }

        return docstring;
    }

    public async cleanup(): Promise<void> {
        try {
            await this.server.stop();
        } catch (error) {
            logger.error(`Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public registerAllTools(): void {
        for (const [name, tool] of this.tools) {
            this.registerTool(tool, name);
        }
    }

    public async run(): Promise<void> {
        this.registerAllTools();
        const transport = new StdioServerTransport();
        await this.server.connect(transport).catch((error) => {
            logger.error(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
        logger.info(`starting openmanus mcp server (stdio mode)`);
    }
}

// Command line interface
const args = process.argv.slice(2);
const name = args[0] || "openmanus";

const server = new MCPServer(name);
server.run().catch((error) => {
    logger.error(`Server error: ${error}`);
    process.exit(1);
});