/** Abstract BaseFlow defining an execution flow for tasks */
export abstract class BaseFlow {
  abstract execute(userRequest: string): Promise<string>;
}
