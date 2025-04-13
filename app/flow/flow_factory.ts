import { BaseAgent } from '../agent/base';
import { BaseFlow } from './base';
import { PlanningFlow } from './planning';

export enum FlowType {
    PLANNING = 'planning'
}

export class FlowFactory {
    static createFlow(
        flowType: FlowType,
        agents: BaseAgent | BaseAgent[] | Map<string, BaseAgent>,
        options: any = {}
    ): BaseFlow {
        const flows: Record<FlowType, new (agents: BaseAgent | BaseAgent[] | Map<string, BaseAgent>, options?: any) => BaseFlow> = {
            [FlowType.PLANNING]: PlanningFlow
        };

        const FlowClass = flows[flowType];
        if (!FlowClass) {
            throw new Error(`Unknown flow type: ${flowType}`);
        }

        return new FlowClass(agents, options);
    }
} 