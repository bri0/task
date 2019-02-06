import * as deepExtend from 'deep-extend';
import * as ojp from 'object-path';
import { Tools } from '../../tools';

export namespace Metadata {
    export enum PIPETYPE {
        UNKNOWN = 0,
        PIPE, // Store to pipe
        RAW, // Store to tools.get('key')
        JSON, // Store to tools.get('key') as json
        YAML, // Store to tools.get('key') as yaml
    }
    export enum TASKSCOPE {
        UNKNOWN = 0,
        GLOBAL, // In ~/.brask/modules/${name}.yaml
        PROJECT, // In ${rootDir}/root.yaml
        SERVICE, // In ${svcDir}/manifest.yaml
    }
    export const FlowPrefix = 'flows.';
    /**
     * A step that execute a command
     *
     * @export
     * @class Step
     */
    export class Step {
        /**
         *Creates an instance of Step.
         * @param {string} name name of step
         * @param {(string | string[])} cmd command that run
         * @param {string} when condition, need to cast to boolean <%= condition %b>
         * @param {boolean} stop stop when finish
         * @param {PIPETYPE} pipe to pipe the stdout or not
         * @param {string} storeKey key to store stdout, To store when pipe is other than PIPE
         * @param {string} cwd Working directory, default to moduleDir/RootDir/SvcDir
         * @memberof Step
         */
        constructor(
            public name: string,
            public cmd: string | string[],
            public when: string | string[],
            public stop: boolean,
            public pipe: PIPETYPE,
            public storeKey: string,
            public cwd: string,
        ) {}
        /**
         * Check step
         *
         * @param {*} tplData
         * @returns {{runable: boolean, name?: string, cmd?: string, cwd?: string}}
         * @memberof Step
         */
        checkStep(tplData) {
            const stepName = Tools.template(this.name, tplData).toString();
            if (!this.cmd) return { runable: false, name: stepName };
            let runable = true;
            if (this.when !== undefined) {
                if (typeof (this.when) === 'string') {
                    runable = !!Tools.template(this.when, tplData);
                } else if (typeof this.when === 'object' && Array.isArray(this.when)) {
                    runable = this.when.every(w => !!Tools.template(w, tplData));
                }
            }
            if (!runable) {
                return {
                    runable,
                    name: stepName,
                    cmd: this.cmd.toString(),
                };
            }
            let cmdTpl = '';
            if (typeof (this.cmd) === 'string') {
                cmdTpl = this.cmd;
            } else if (Array.isArray(this.cmd)) {
                cmdTpl = this.cmd.join(' ');
            }
            const stepCmd = Tools.template(cmdTpl, tplData).toString();
            const stepCwd = Tools.template(this.cwd, tplData).toString();
            return {
                runable,
                name: stepName,
                cmd: stepCmd,
                cwd: stepCwd,
            };
        }
    }
    export type Flow = Step[]
    /**
     * A task, with steps
     * @property env map of environment variable
     *
     * @export
     * @class Task
     */
    export class Task {
        /**
         *Creates an instance of Task.
         * @param {Flow} steps Run step by step
         * @param {Map<string,Flow>} flows To be called in step's cmd with flows., merge and overwrite by flows in metadata
         * @param {Map<string,string>} env Environment variable to run this task
         * @memberof Task
         */
        constructor(
            public steps: Flow,
            public flows: Flow,
            public env: Map<string,string>,
        ) {}
    }
    export class Metadata {
        /**
         *Creates an instance of Metadata.
         * @param {Map<string,Task>} tasks
         * @param {Map<string,Flow>} flows
         * @memberof Metadata
         */
        constructor(
            public tasks: Map<string,Task>,
            public flows: Map<string,Flow>,
        ) {}
        /**
         * Get a task from metadata, common flows from the meta will be overwrite by flows in task
         *
         * @param {string} taskName
         * @returns {Task}
         * @memberof Metadata
         */
        getTask(taskName: string): Task {
            const metaTask = <Task>ojp.get(this.tasks, taskName);
            if (!metaTask) return null;
            const { steps, env } = metaTask;
            const copyFlows = { ...this.flows };
            const flows = deepExtend(copyFlows, metaTask.flows);
            return new Task(steps, flows, env);
        }
    }
    export class Manifest {
        constructor(
            public dir: string,
            public metadata: Metadata,
        ) {}
    }
    /**
     * Merge two metadata, second overwrite first, return a copy
     *
     * @export
     * @param {Metadata} me1
     * @param {Metadata} me2
     * @returns {Metadata}
     */
    export function mergedMetadata(me1: Metadata, me2: Metadata): Metadata {
        const copyTasks = { ...me1.tasks };
        const tasks = deepExtend(copyTasks, me2.tasks || {});
        const copyflows = { ...me1.flows };
        const flows = deepExtend(copyflows, me2.flows || {});
        return new Metadata(tasks, flows);
    }
}
