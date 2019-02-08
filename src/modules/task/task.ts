import { Tools } from '../../tools';
import { JSONObject } from '../../lib/json';
import _ from 'underscore';

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
        checkStep(tplData: any) {
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
    export type Flow = Array<Step>
    export type FlowValue = Flow | FlowObject
    export interface FlowObject {
        [x: string]: FlowValue
    }
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
            public flows: FlowObject,
            public env: Map<string,string>,
        ) {}
        getFlow(cmd: string | undefined): Flow | undefined{
            if (!cmd) return;
            const flowTree = cmd.split('.');
            let currentFLow = this.flows;
            while (flowTree.length > 0) {
                const tn = flowTree.shift();
                if (!tn) return;
                const fl = currentFLow[tn];
                if (_.isArray(fl)) {
                    return <Flow>fl;
                }
                currentFLow = <FlowObject>fl;
            }
            return;
        };

    }
    export type TaskValue = Task | TaskObject
    export interface TaskObject {
        [x: string]: TaskValue,
    }
    export class Metadata {
        /**
         *Creates an instance of Metadata.
         * @param {TaskObject} tasks
         * @param {FlowObject} [flows]
         * @param {JSONObject} [vars]
         * @memberof Metadata
         */
        constructor(
            public tasks: TaskObject,
            public flows?: FlowObject,
            public vars?: JSONObject,
        ) {}
        /**
         * Get a task from metadata, common flows from the meta will be overwrite by flows in task
         *
         * @param {string} taskName
         * @returns {Task}
         * @memberof Metadata
         */
        getTask(taskName: string): Task | undefined {
            const taskTree = taskName.split('.');
            let tskVal = this.tasks;
            let metaTask: Task | undefined;
            while (taskTree.length > 0) {
                const tn = taskTree.shift();
                if (!tn) return;
                const tsk = tskVal[tn];
                if (tsk instanceof Task) {
                    metaTask = tsk;
                    break;
                }
                tskVal = tsk;
            }
            if (!metaTask) return;
            const { steps, env } = metaTask;
            const copyFlows = { ...this.flows };
            const flows = { ...copyFlows, ...metaTask.flows }
            return new Task(steps, flows, env);
        }
    }
    export class Manifest {
        /**
         *Creates an instance of Manifest.
         * @param {string} dir directory of the manifest
         * @param {Metadata} metadata
         * @param {JSONObject} raw
         * @memberof Manifest
         */
        constructor(
            public dir: string,
            public metadata: Metadata,
            public raw: JSONObject,
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
        let tasks = <TaskObject>{};
        if (me1.tasks) {
            tasks = { ...me1.tasks };
        }
        if (me2.tasks) {
            tasks = { ...tasks, ...me2.tasks };
        }

        let flows = <FlowObject>{}
        if (me1.flows) {
            flows = { ...me1.flows }
        }
        if (me2.flows) {
            flows = { ...flows, ...me2.flows };
        }

        let vars = <JSONObject>{}
        if (me1.vars) {
            vars = { ...me1.vars };
        }
        if (me2.vars) {
            vars  = { ...vars, ...me2.vars };
        }
        const res = new Metadata(tasks, flows, vars);
        return res;
    }
}
