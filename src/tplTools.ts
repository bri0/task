import { existsSync, writeFileSync, appendFileSync } from "fs";
import { execSync } from "child_process";
import ojp from "object-path";

import { Metadata } from "./modules/task/task";
import * as theTools from "./tools";
import os from 'os';
import { LOG } from "./log";
import camelCase from "camelcase";
import pascalCase from "pascal-case";
import { JSONObject } from "./lib/json";
import NodeRSA from "node-rsa";

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
			ojp.set(tplData.mem, key, val);
		},
        /**
         * Get cache
         *
         * @export
         * @param {string} [key=""]
         * @returns {*}
         */
        get(key: string=""): any{
			return ojp.get(tplData.mem, key);
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
		hasError(cmd: string, warn: string="", warn_on_error:boolean=true): boolean {
			try  {
				execSync(`${cmd} > /dev/null 2>&1`);
				if (!warn_on_error && warn) {
					LOG.Warn(warn.yellow);
				}
				return false;
			} catch (e) {
				if (warn_on_error && warn) {
					LOG.Warn(warn.yellow);
				}
				return true;
			}
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
		writeFileSync,
		appendFileSync,
		replace(str: string, rpl: string = "", pattern: string, flags: string): string {
			const reg = new RegExp(pattern, flags);
			return str.replace(reg, rpl);
		},
		camelCase,
		pascalCase,
		templateFile(tplFile: string, inp: JSONObject, outputFile: string) {
			let tplFunc: (inp: JSONObject) => string;
			tplFunc = require(tplFile);
			const output = tplFunc.bind(TplTools.Tools)(inp);
			theTools.Tools.writeFile(outputFile, output);
        },
        rsaDecrypt(base64RsaPk: string, base64EncryptedStr: string): string{
            const rsa = new NodeRSA({ b: 512 });
            const prtkey = Buffer.from(base64RsaPk, 'base64').toString();
            rsa.importKey(prtkey, 'private');
			const decryptedBase64 = rsa.decrypt(base64EncryptedStr, 'base64');
			return Buffer.from(decryptedBase64, 'base64').toString();
        },
        rsaEncrypt(base64RsaPub: string, encryptingStr: string): string{
            const rsa = new NodeRSA({ b: 512 });
			const pubkey = Buffer.from(base64RsaPub, 'base64').toString();
            rsa.importKey(pubkey, 'public');
            return rsa.encrypt(encryptingStr, 'base64');
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
    export function tplMeta(argv: any, rootDir: string, metadata: Metadata.Metadata, svcDir: string, gitSHA: string, rootman: JSONObject, svcman: JSONObject): TemplateMeta {
        const { vars } = metadata;

        let svcDirFromRoot: string = '';
        if (svcDir !== '' && rootDir !== '') {
            svcDirFromRoot = (svcDir || '').split(rootDir)[1];
        }

        const metaProject = new TemplateMeta_Project(rootDir, svcDir, svcDirFromRoot, gitSHA);

        const theMeta = new TemplateMeta(argv, Date.now(), process.env, os, vars, metaProject, rootman, svcman);
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
			public rootman: JSONObject,
			public svcman: JSONObject,
        ) {
        }
    }
}
