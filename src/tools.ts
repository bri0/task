import util from 'util';
import path from 'path';
import fs from 'fs';
import * as yaml from 'js-yaml';
import _ from 'underscore';
import { Metadata } from './modules/task/task';
import { spawn, spawnSync, exec, execSync } from 'child_process';

const templReg = /^<%(.*)%([ifbIFB]?)>$/;
const execPromise = util.promisify(exec);
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
        // @ts-ignore
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
    export function getManifest(name: string, foldup: boolean=true): Metadata.Manifest {
        let rPath = name;
        const finalPath = `/${name}`;

        while (rPath) {
            const aPath = path.resolve(rPath);

            if (fs.existsSync(aPath)) {
                const dir = path.dirname(aPath);
                try {
                    const metadata = readYaml(aPath);
                    return new Metadata.Manifest(dir, <Metadata.Metadata>metadata);
                } catch (e) {
                    throw new Error(`Malformed ${name}`);
                }
            }
            if (!foldup || (aPath === finalPath)) {
                return new Metadata.Manifest(null, null);
            }
            rPath = `../${rPath}`;
        }
        return new Metadata.Manifest(null, null);
    }
    /**
     * Templating function
     *
     * @export
     * @param {string} [str='']
     * @param {*} obj
     * @returns {string|boolean|number}
     */
    export function template(str: string = '', obj: any): string | boolean | number {
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
    }
    /**
     * Deep template
     *
     * @export
     * @param {*} templ
     * @param {*} obj
     * @returns
     */
    export function deepTemplate(templ: string|object, obj) {
        if (typeof templ === 'string') {
            return template(templ, obj);
        }
        if (_.isObject(templ)) {
            const newTempl = {};
            const keys = Object.keys(templ);
            for (let i = 0; i < keys.length; i += 1) {
                newTempl[keys[i]] = deepTemplate(templ[keys[i]], obj);
            }
            return newTempl;
        }
        return templ;
    }
}

