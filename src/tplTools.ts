import { existsSync } from "fs";
import { execSync } from "child_process";
import * as ojp from "object-path";
// import * as ojp from "object-path";
import { Metadata } from "./modules/task/task";
import * as theTools from "./tools";
import os from 'os';

const tplData = {
    mem: {},
}

export namespace TplTools {
    export const Tools = {
        /**
         * Set cache
         *
         * @export
         * @param {string} [key=""]
         * @param {*} val
         */
        set(key: string="", val: any): void {
            tplData.mem[key] = val;
        },
        /**
         * Get cache
         *
         * @export
         * @param {string} [key=""]
         * @returns {*}
         */
        get(key: string=""): any{
            return tplData.mem[key];
        },
        /**
         * Check if a binary exist or not by which command
         *
         * @export
         * @param {string} binary
         * @returns {string}
         */
        which(binary:string): string{
            try {
                return execSync(`which ${binary}`).toString().trim();
            } catch (e) {
                return '';
            }
        },
        /**
         * Throw error
         *
         * @export
         * @param {string} errStr
         * @returns {never}
         */
        cancel(errStr: string): never {
            throw new Error(errStr);
        },
        /**
         * Check if a filename exists
         *
         * @export
         * @param {string} filename
         * @returns {boolean}
         */
        exists(filename: string): boolean {
            return existsSync(filename);
        },
    }
    /**
     * Generate the template interpolation variables
     *
     * @export
     * @param {*} argv argument from the command line
     * @param {string} rootDir root directory, current or closest parent folder contains root.yaml
     * @param {Metadata.Metadata} metadata merged metadata from module or root with service manifest
     * @param {string} svcDir service directory, current or closest parent folder contains manifest.yaml
     * @param {string} gitSHA sha of current git head commit
     * @returns {TemplateMeta}
     */
    export function tplMeta(argv: any, rootDir: string, metadata: Metadata.Metadata, svcDir: string, gitSHA: string): TemplateMeta {
        const vars = <Map<string,any>>ojp.get(metadata, 'vars', {});
        const theMeta = new TemplateMeta(argv, Date.now(), process.env, os, null, null);
        const tplVars = theTools.Tools.deepTemplate(vars, theMeta);
        theMeta.vars = tplVars;

        theMeta.project = new TemplateMeta_Project(rootDir, svcDir, null, gitSHA);

        if (svcDir !== '' && rootDir !== '') {
            const svcDirFromRoot = (svcDir || '').split(rootDir)[1];
            theMeta.project.svcDirFromRoot = svcDirFromRoot;
        }

        return theMeta;
    }
    export class TemplateMeta_Project {
        /**
         *Creates an instance of TemplateMeta_Project.
         * @param {string} rootDir root directory, current or closest parent folder contains root.yaml
         * @param {string} svcDir service directory current or closest parent folder contains manifest.yaml
         * @param {string} svcDirFromRoot relative directory from root to svc, only exists if svcDir exists
         * @param {string} gitSHA sha of current git head commit
         * @memberof TemplateMeta_Project
         */
        constructor(
            public rootDir: string,
            public svcDir: string,
            public svcDirFromRoot: string,
            public gitSHA: string,
        ) {}
    }
    export class TemplateMeta {
        public tools = Tools;
        public pipe: string
        /**
         *Creates an instance of TemplateMeta.
         * @param {ParsedArgs} argv args of command line tool
         * @param {number} timestamp timestamp at command invocation
         * @param {NodeJS.ProcessEnv} env Environment variable
         * @param {*} os os object
         * @param {*} vars merged variables from metadata of module or root with service
         * @param {*} project project's metadata
         * @memberof TemplateMeta
         */
        constructor(
            public argv: any,
            public timestamp: number,
            public env: NodeJS.ProcessEnv,
            public os: any,
            public vars: any,
            public project: TemplateMeta_Project,
        ) {
        }
    }
}