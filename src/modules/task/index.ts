import { execSync } from "child_process";
import semver from "semver";
import ojp from "object-path";

import { LOG } from "../../log";
import { Tools } from "../../tools";
import { Metadata } from "./task";
import { TplTools } from "../../tplTools";
import { version } from "../../../package.json";

import run from "./run";

/**
 *
 * @param argv
 * @return Promise
 */
const index = async function (argv: any) {
    if (argv._.length < 1) {
        throw new Error('Require task name');
    }
    const taskCmds = <string[]>argv._;

    let finalMetadata: Metadata.Metadata;
    let rootDir = "";
    let cwd = process.env.HOME || "";
	let module = false;
	let man: Metadata.Manifest | undefined;

    // Now if the first argv start with ~, treat it as a global modules
    if (taskCmds[0].startsWith('~')) {
        module = true;
        const moduleName = (taskCmds.shift() || "").substr(1);
        const pkgFile = `${process.env.HOME}/.brask/modules/${moduleName}.yaml`;
        LOG.Verbose(`File path: ${pkgFile}`);
        man = Tools.getManifest(pkgFile, false);
        if (!man || !man.metadata) {
            throw new Error(`Can not find module ${moduleName}`);
        }
        finalMetadata = man.metadata;
	} else {
        man = Tools.getManifest('root.yaml');
        if (!man || !man.metadata) {
            throw new Error('Can not find root.yaml in any of parent folder');
        }
        LOG.Verbose(`File path: ${man.dir}`);
        cwd = man.dir;
        rootDir = man.dir;
		finalMetadata = man.metadata;
	}

	const requiredVersion: string = ojp.get(man.raw, "requiredVersion");
	if (requiredVersion && !semver.satisfies(version, requiredVersion)) {
		throw new Error(`Current brask version ${version} does not satisfy require ${requiredVersion}. Please consider to update ${'npm up -g brask '}`);
	}

    const svcMan = Tools.getManifest('manifest.yaml');
    if (svcMan && svcMan.metadata) {
        finalMetadata = Metadata.mergedMetadata(finalMetadata, svcMan.metadata);
        cwd = svcMan.dir;
    }

	let svcManDir = "";
    if (svcMan) {
        svcManDir = svcMan.dir;
    }

    const taskName = taskCmds.shift();
    if (!taskName) {
        throw new Error('Require task name');
    }

    const theTask = finalMetadata.getTask(taskName);
    if (!theTask || !theTask.steps) {
        throw new Error('This task does not exist');
    }

    LOG.Verbose(`Rootdir: ${rootDir}, CWD: ${cwd}, module: ${module}`);

    const gitSHA = execSync('git rev-parse --short HEAD', { cwd }).toString().trim();

    const theMeta = TplTools.tplMeta(argv, rootDir, finalMetadata, svcManDir, gitSHA, man.raw, svcMan ? svcMan.raw : {});
    return run(cwd, theTask, theMeta);
}

export default index;
