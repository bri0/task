import util from 'util';
import path from 'path';
import fs from 'fs';
import * as yaml from 'js-yaml';
import _ from 'underscore';
import { Metadata } from './modules/task/task';
import { spawn, spawnSync, exec, execSync } from 'child_process';
import { JSONValue, JSONObject } from './lib/json';
import { TplTools } from './tplTools';

const templReg = /^<%(.*)%([ifbIFB]?)>$/;
const execPromise = util.promisify(exec);

function yaml2Manifest(dir: string, yml: any): Metadata.Manifest | undefined {
    if (!dir || !yml) return;

    if (!_.isObject(yml)) return;
    const oyml = <JSONObject>yml;
    const { tasks, vars } = oyml;
    if (vars) {
        if (!_.isObject(vars)) throw new Error(`Vars of manifest in ${dir} is not an object`);
    }

    const metadata = new Metadata.Metadata(
        <Metadata.TaskObject>tasks,
        <JSONObject>vars,
    );

    return new Metadata.Manifest(dir, metadata, oyml);
}

export namespace Tools {
    export const process = {
        spawn, spawnSync, exec, execSync, execPromise,
    }
    /**
     * Read yaml from file
     *
     * @param {string} file
     * @returns {*}
     */
    function readYaml(file: string): any{
        const res = yaml.loadAll(fs.readFileSync(file).toString());
        if (res.length === 1) return res[0];
        return res;
    }
    /**
     * Get a manifest file, and read it as yaml
     *
     * @export
     * @param {string} name
     * @param {boolean} foldup=true search for parents folder or not
     * @returns {Metadata.Manifest}
     */
    export function getManifest(name: string, foldup: boolean=true): Metadata.Manifest | undefined {
        let rPath = name;
        const finalPath = `/${name}`;

        while (rPath) {
            const aPath = path.resolve(rPath);

            if (fs.existsSync(aPath)) {
                const dir = path.dirname(aPath);
                try {
                    const metadata = readYaml(aPath);
                    return yaml2Manifest(dir, metadata);
                } catch (e) {
                    throw new Error(`Malformed ${name}: ${e.toString()}`);
                }
            }
            if (!foldup || (aPath === finalPath)) {
                return;
            }
            rPath = `../${rPath}`;
        }
        return;
    }
    /**
     * Templating function
     *
     * @export
     * @param {string} [str='']
     * @param {*} obj
     * @returns {string|boolean|number}
     */
    export function template(str: string = '', obj: TplTools.TemplateMeta): string | boolean | number {
		try {
			const regRes = str.match(templReg);
			if (regRes) {
				const liter = _.template(`<%${regRes[1]}%>`)(obj);
				const c = regRes[2];
				if (c === 'i' || c === 'I') return parseInt(liter, 10);
				if (c === 'f' || c === 'F') return parseFloat(liter);
				if (c === 'b' || c === 'B') {
					if (liter === 'true') return true;
					if (liter === 'false') return false;
					return !!liter;
				}
				return liter;
			}
			return _.template(str)(obj);
		} catch (e) {
			const err = <Error>e;
			throw new Error(`Can not evaluate \`${str}\`: ${err.message}`);
		}
    }
    /**
     * Deep template
     *
     * @export
     * @param {*} templ
     * @param {*} obj
     * @returns
     */
    export function deepTemplate(templ: JSONValue | undefined, obj: TplTools.TemplateMeta): JSONValue {
        if (!templ) return <JSONObject>{};
        if (typeof templ === 'number' || typeof templ === 'boolean') return templ;

        if (typeof templ === 'string') {
            return template(templ, obj);
        }

        if (_.isArray(templ)) {
            const res: JSONValue[] = [];
            for (let i = 0; i < templ.length; i += 1) {
                res.push(deepTemplate(templ[i], obj));
            }
            return res;
        }

        if (_.isObject(templ)) {
            const res: {[x: string]: JSONValue} = {};
            // new Map<string, JSONValue>();
            const keys = Object.keys(templ);
            for (let i = 0; i < keys.length; i += 1) {
                res[keys[i]] = deepTemplate(templ[keys[i]], obj);
            }
            return res;
        }
        return templ;
    }
}

