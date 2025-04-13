import { Manus } from './agent/manus';
import { FlowFactory, FlowType } from './flow/flow_factory';
import logger from './logger';
import { BaseAgent } from './agent/base';

async function runFlow(): Promise<void> {
    const agents = new Map<string, BaseAgent>([
        ['manus', new Manus()]
    ]);

    try {
        const prompt = await new Promise<string>((resolve) => {
            process.stdout.write('Enter your prompt: ');
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });

        if (!prompt || prompt.trim().length === 0) {
            logger.warn('Empty prompt provided.');
            return;
        }

        const flow = FlowFactory.createFlow(
            FlowType.PLANNING,
            agents
        );
        logger.warn('Processing your request...');

        try {
            const startTime = Date.now();
            const result = await Promise.race([
                flow.execute(prompt),
                new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 3600 * 1000) // 60 minute timeout
                )
            ]);
            
            const elapsedTime = (Date.now() - startTime) / 1000;
            logger.info(`Request processed in ${elapsedTime.toFixed(2)} seconds`);
            logger.info(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Timeout') {
                logger.error('Request processing timed out after 1 hour');
                logger.info('Operation terminated due to timeout. Please try a simpler request.');
            } else {
                throw error;
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error: ${error.message}`);
        } else {
            logger.error('An unknown error occurred');
        }
    } finally {
        process.exit(0);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    logger.info('Operation cancelled by user.');
    process.exit(0);
});

// Run the flow
runFlow().catch((error) => {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
});