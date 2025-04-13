import { BaseTool } from './base';
import { ToolError } from '../exceptions';
import { PlanStepStatus } from '../schema/planning';

const PLANNING_TOOL_DESCRIPTION = `
A planning tool that allows the agent to create and manage plans for solving complex tasks.
The tool provides functionality for creating plans, updating plan steps, and tracking progress.
`;

interface PlanStep {
    description: string;
    status: PlanStepStatus;
    notes?: string;
}

interface Plan {
    id: string;
    title: string;
    steps: PlanStep[];
    created_at: number;
    updated_at: number;
}

export class PlanningTool extends BaseTool {
    name = 'planning';
    description = PLANNING_TOOL_DESCRIPTION;
    parameters = {
        type: 'object',
        properties: {
            command: {
                description: 'The command to execute. Available commands: create, update, list, get, set_active, mark_step, delete.',
                enum: ['create', 'update', 'list', 'get', 'set_active', 'mark_step', 'delete'],
                type: 'string'
            },
            plan_id: {
                description: 'Unique identifier for the plan. Required for create, update, set_active, and delete commands. Optional for get and mark_step (uses active plan if not specified).',
                type: 'string'
            },
            title: {
                description: 'Title for the plan. Required for create command, optional for update command.',
                type: 'string'
            },
            steps: {
                description: 'List of plan steps. Required for create command, optional for update command.',
                type: 'array',
                items: { type: 'string' }
            },
            step_index: {
                description: 'Index of the step to update (0-based). Required for mark_step command.',
                type: 'integer'
            },
            step_status: {
                description: 'Status to set for a step. Used with mark_step command.',
                enum: Object.values(PlanStepStatus),
                type: 'string'
            },
            step_notes: {
                description: 'Additional notes for a step. Optional for mark_step command.',
                type: 'string'
            }
        },
        required: ['command'],
        additionalProperties: false
    };

    constructor() {
        super('planning', PLANNING_TOOL_DESCRIPTION, {
            type: 'object',
            properties: {
                command: {
                    description: 'The command to execute. Available commands: create, update, list, get, set_active, mark_step, delete.',
                    enum: ['create', 'update', 'list', 'get', 'set_active', 'mark_step', 'delete'],
                    type: 'string'
                },
                plan_id: {
                    description: 'Unique identifier for the plan. Required for create, update, set_active, and delete commands. Optional for get and mark_step (uses active plan if not specified).',
                    type: 'string'
                },
                title: {
                    description: 'Title for the plan. Required for create command, optional for update command.',
                    type: 'string'
                },
                steps: {
                    description: 'List of plan steps. Required for create command, optional for update command.',
                    type: 'array',
                    items: { type: 'string' }
                },
                step_index: {
                    description: 'Index of the step to update (0-based). Required for mark_step command.',
                    type: 'integer'
                },
                step_status: {
                    description: 'Status to set for a step. Used with mark_step command.',
                    enum: Object.values(PlanStepStatus),
                    type: 'string'
                },
                step_notes: {
                    description: 'Additional notes for a step. Optional for mark_step command.',
                    type: 'string'
                }
            },
            required: ['command'],
            additionalProperties: false
        });
    }

    private plans: Map<string, Plan> = new Map();
    private currentPlanId?: string;

    async execute(args: any): Promise<string> {
        const { command, plan_id, title, steps, step_index, step_status, step_notes } = args;

        if (!command) {
            throw new ToolError('Command is required');
        }

        switch (command) {
            case 'create':
                return this.createPlan(plan_id, title, steps);
            case 'update':
                return this.updatePlan(plan_id, title, steps);
            case 'list':
                return this.listPlans();
            case 'get':
                return this.getPlan(plan_id);
            case 'set_active':
                return this.setActivePlan(plan_id);
            case 'mark_step':
                if (!plan_id) {
                    throw new ToolError('Plan ID is required for mark_step command');
                }
                if (step_index === undefined) {
                    throw new ToolError('Step index is required for mark_step command');
                }
                if (!step_status) {
                    throw new ToolError('Step status is required for mark_step command');
                }
                return this.markStep(plan_id, step_index, step_status, step_notes);
            case 'delete':
                return this.deletePlan(plan_id);
            default:
                throw new ToolError(`Unknown command: ${command}`);
        }
    }

    private createPlan(planId?: string, title?: string, steps?: string[]): string {
        if (!planId) {
            planId = `plan_${Date.now()}`;
        }

        if (!title) {
            throw new ToolError('Title is required for create command');
        }

        if (!steps || steps.length === 0) {
            throw new ToolError('Steps are required for create command');
        }

        const plan: Plan = {
            id: planId,
            title,
            steps: steps.map(description => ({
                description,
                status: PlanStepStatus.NOT_STARTED
            })),
            created_at: Date.now(),
            updated_at: Date.now()
        };

        this.plans.set(planId, plan);
        this.currentPlanId = planId;

        return this.formatPlan(plan);
    }

    private updatePlan(planId?: string, title?: string, steps?: string[]): string {
        if (!planId) {
            planId = this.currentPlanId;
        }

        if (!planId) {
            throw new ToolError('No plan ID provided and no active plan');
        }

        const plan = this.plans.get(planId);
        if (!plan) {
            throw new ToolError(`Plan not found: ${planId}`);
        }

        if (title) {
            plan.title = title;
        }

        if (steps) {
            plan.steps = steps.map(description => ({
                description,
                status: PlanStepStatus.NOT_STARTED
            }));
        }

        plan.updated_at = Date.now();
        this.plans.set(planId, plan);

        return this.formatPlan(plan);
    }

    private listPlans(): string {
        if (this.plans.size === 0) {
            return 'No plans available';
        }

        return Array.from(this.plans.values())
            .map(plan => `${plan.id}: ${plan.title} (${plan.steps.length} steps)`)
            .join('\n');
    }

    private getPlan(planId?: string): string {
        if (!planId) {
            planId = this.currentPlanId;
        }

        if (!planId) {
            throw new ToolError('No plan ID provided and no active plan');
        }

        const plan = this.plans.get(planId);
        if (!plan) {
            throw new ToolError(`Plan not found: ${planId}`);
        }

        return this.formatPlan(plan);
    }

    private setActivePlan(planId?: string): string {
        if (!planId) {
            throw new ToolError('Plan ID is required for set_active command');
        }

        if (!this.plans.has(planId)) {
            throw new ToolError(`Plan not found: ${planId}`);
        }

        this.currentPlanId = planId;
        return `Active plan set to: ${planId}`;
    }

    private markStep(planId: string, stepIndex: number, stepStatus: PlanStepStatus, stepNotes?: string): string {
        const effectivePlanId = planId || this.currentPlanId;
        if (!effectivePlanId) {
            throw new ToolError('No plan ID provided and no active plan');
        }

        const plan = this.plans.get(effectivePlanId);
        if (!plan) {
            throw new ToolError(`Plan not found: ${effectivePlanId}`);
        }

        if (stepIndex < 0 || stepIndex >= plan.steps.length) {
            throw new ToolError(`Invalid step index: ${stepIndex}`);
        }

        const step = plan.steps[stepIndex];
        step.status = stepStatus;
        if (stepNotes) {
            step.notes = stepNotes;
        }
        plan.updated_at = Date.now();
        return `Step ${stepIndex + 1} marked as ${stepStatus}`;
    }

    private deletePlan(planId?: string): string {
        if (!planId) {
            throw new ToolError('Plan ID is required for delete command');
        }

        if (!this.plans.has(planId)) {
            throw new ToolError(`Plan not found: ${planId}`);
        }

        this.plans.delete(planId);
        if (this.currentPlanId === planId) {
            this.currentPlanId = undefined;
        }

        return `Plan deleted: ${planId}`;
    }

    private formatPlan(plan: Plan): string {
        const stepsText = plan.steps.map((step, index) => {
            const statusMark = this.getStatusMark(step.status);
            const notes = step.notes ? `\n    Notes: ${step.notes}` : '';
            return `${statusMark} Step ${index + 1}: ${step.description}${notes}`;
        }).join('\n');

        return `Plan: ${plan.title} (${plan.id})\n${stepsText}`;
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

    // Helper methods for PlanningFlow
    createPlanForFlow(planId: string, title: string, steps: string[]): void {
        this.execute({ command: 'create', plan_id: planId, title, steps });
    }

    getPlanStepsForFlow(planId: string): PlanStep[] {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new ToolError(`Plan not found: ${planId}`);
        }
        return plan.steps;
    }

    updateStepStatusForFlow(planId: string, stepIndex: number, status: PlanStepStatus, notes?: string): void {
        this.execute({ 
            command: 'mark_step', 
            plan_id: planId, 
            step_index: stepIndex, 
            step_status: status,
            step_notes: notes
        });
    }
}
