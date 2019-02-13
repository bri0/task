import { existsSync } from "fs";
import { execSync } from "child_process";
import { Metadata } from "./modules/task/task";
import * as inquirer from "inquirer";
import * as theTools from "./tools";
import os from 'os';

const tplData = {
    mem: new Map<string, any>(),
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
            tplData.mem.set(key, val);
        },
        /**
         * Get cache
         *
         * @export
         * @param {string} [key=""]
         * @returns {*}
         */
        get(key: string=""): any{
            return tplData.mem.get(key);
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
        const { vars } = metadata;

        let svcDirFromRoot: string = '';
        if (svcDir !== '' && rootDir !== '') {
            svcDirFromRoot = (svcDir || '').split(rootDir)[1];
        }

        const metaProject = new TemplateMeta_Project(rootDir, svcDir, svcDirFromRoot, gitSHA);

        const theMeta = new TemplateMeta(argv, Date.now(), process.env, os, vars, metaProject);
        const tplVars = theTools.Tools.deepTemplate(vars, theMeta);
        theMeta.vars = tplVars;

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
	export const Inquiry = {

	}
    export class TemplateMeta {
        public tools = Tools;
        public pipe: string = "";
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
