import { BaseAgent } from '../agent/base';
import { BaseFlow } from './base';
import { LLM } from '../llm';
import logger from '../logger';
import { AgentState } from '../schema';
import { PlanningTool } from '../tool/planning';
import { PlanStepStatus } from '../schema/planning';

/** PlanningFlow: orchestrates planning and executing a task in multiple steps */
export class PlanningFlow extends BaseFlow {
    private llm: LLM;
    private planningTool: PlanningTool;
    private executorKeys: string[];
    private activePlanId: string;
    private currentStepIndex?: number;

    constructor(agents: BaseAgent | BaseAgent[] | Map<string, BaseAgent>, data: any = {}) {
        super(agents, data);

        // Initialize properties
        this.llm = LLM.getInstance();
        this.planningTool = data.planningTool || new PlanningTool();
        this.executorKeys = data.executorKeys || Array.from(this.agents.keys());
        this.activePlanId = data.planId || `plan_${Date.now()}`;
    }

    private getExecutor(stepType?: string): BaseAgent {
        // If step type is provided and matches an agent key, use that agent
        if (stepType && this.agents.has(stepType)) {
            return this.agents.get(stepType)!;
        }

        // Otherwise use the first available executor or fall back to primary agent
        for (const key of this.executorKeys) {
            if (this.agents.has(key)) {
                return this.agents.get(key)!;
            }
        }

        // Fallback to primary agent
        return this.primaryAgent!;
    }

    async execute(inputText: string): Promise<string> {
        try {
            if (!this.primaryAgent) {
                throw new Error('No primary agent available');
            }

            // Create initial plan
            await this.createInitialPlan(inputText);

            // Execute plan steps
            while (true) {
                const [stepIndex, stepInfo] = await this.getCurrentStepInfo();
                if (!stepInfo) {
                    break;
                }

                const executor = this.getExecutor(stepInfo.type);
                const result = await this.executeStep(executor, stepInfo);
                await this.markStepCompleted(result);

                // Check if we should terminate
                if (executor.state === AgentState.FINISHED) {
                    break;
                }
            }

            // Finalize plan
            return await this.finalizePlan();
        } catch (error) {
            logger.error(`Error in planning flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private async createInitialPlan(request: string): Promise<void> {
        const planningPrompt = `Break down the following task into a step-by-step plan:\n"${request}"\nList the steps clearly.`;
        const planResponse = await this.llm.ask([{ role: 'user', content: planningPrompt }]);
        
        const steps = planResponse.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());

        this.planningTool.createPlanForFlow(this.activePlanId, request, steps);
    }

    private async getCurrentStepInfo(): Promise<[number | undefined, any | undefined]> {
        const steps = this.planningTool.getPlanStepsForFlow(this.activePlanId);
        const activeStepIndex = steps.findIndex(step => 
            step.status === PlanStepStatus.NOT_STARTED || 
            step.status === PlanStepStatus.IN_PROGRESS
        );

        if (activeStepIndex === -1) {
            return [undefined, undefined];
        }

        const stepInfo = {
            ...steps[activeStepIndex],
            index: activeStepIndex
        };
        return [activeStepIndex, stepInfo];
    }

    private async executeStep(executor: BaseAgent, stepInfo: any): Promise<string> {
        this.currentStepIndex = stepInfo.index;
        this.planningTool.updateStepStatusForFlow(
            this.activePlanId, 
            stepInfo.index, 
            PlanStepStatus.IN_PROGRESS
        );

        try {
            const result = await executor.run(stepInfo.description);
            return result;
        } catch (error) {
            this.planningTool.updateStepStatusForFlow(
                this.activePlanId, 
                stepInfo.index, 
                PlanStepStatus.BLOCKED
            );
            throw error;
        }
    }

    private async markStepCompleted(result: string): Promise<void> {
        if (this.currentStepIndex !== undefined) {
            this.planningTool.updateStepStatusForFlow(
                this.activePlanId,
                this.currentStepIndex,
                PlanStepStatus.COMPLETED,
                result
            );
        }
    }

    private async finalizePlan(): Promise<string> {
        const planText = this.generatePlanTextFromStorage();
        return `Plan execution completed.\n\n${planText}`;
    }

    private generatePlanTextFromStorage(): string {
        const steps = this.planningTool.getPlanStepsForFlow(this.activePlanId);
        return steps.map((step, index) => {
            const statusMark = this.getStatusMark(step.status);
            const notes = step.notes ? `\n    Notes: ${step.notes}` : '';
            return `${statusMark} Step ${index + 1}: ${step.description}${notes}`;
        }).join('\n');
    }

    private getStatusMark(status: PlanStepStatus): string {
        const marks: Record<PlanStepStatus, string> = {
            [PlanStepStatus.COMPLETED]: '[✓]',
            [PlanStepStatus.IN_PROGRESS]: '[→]',
            [PlanStepStatus.BLOCKED]: '[!]',
            [PlanStepStatus.NOT_STARTED]: '[ ]'
        };
        return marks[status];
    }
}
