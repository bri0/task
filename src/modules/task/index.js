const tplTools = require('../../tpltools');
const { log } = require('../../log');
const tools = require('../../tools');
const task = require('./task');
const run = require('./run');

/**
 * @param {import("minimist").ParsedArgs} argv
 * @returns {Promise}
 */
module.exports = async (argv) => {
	if (argv._.length < 1) {
		throw new Error('Require task name');
	}

	/** @type string[] */
	const taskCmds = argv._;

	/** @type {import('./task').Metadata} */
	let finalMetadata = null;
	/** @type String */
	let rootDir = null;
	/** @type String */
	let cwd = process.env.HOME;
	/** @type boolean */
	let module = false;

	// Now if the first argv start with ~, treat it as a global modules
	if (taskCmds[0].startsWith('~')) {
		module = true;
		const moduleName = taskCmds.shift().substr(1);
		const pkgFile = `${process.env.HOME}/.brask/modules/${moduleName}.yaml`;
		log.Verbose(`File path: ${pkgFile}`);
		const man = tools.getManifest(pkgFile, false);
		if (!man.metadata) {
			throw new Error(`Can not find module ${moduleName}`);
		}
		finalMetadata = man.metadata;
	} else {
		const man = tools.getManifest('root.yaml');
		if (!man.metadata) {
			throw new Error('Can not find root.yaml in any of parent folder');
		}
		log.Verbose(`File path: ${man.dir}`);
		cwd = man.dir;
		rootDir = man.dir;
		finalMetadata = man.metadata;
	}

	const svcMan = tools.getManifest('manifest.yaml');
	if (svcMan.metadata) {
		finalMetadata = task.mergeMetadata(finalMetadata, svcMan.metadata);
		cwd = svcMan.dir;
	}

	const taskName = taskCmds.shift();
	if (!taskName) {
		throw new Error('Require task name');
	}

	const theTask = task.getTask(taskName, finalMetadata);
	if (!theTask || !theTask.steps) {
		throw new Error('This task does not exist');
	}

	log.Verbose(`Rootdir: ${rootDir}, CWD: ${cwd}, module: ${module}`);

	const shell = true;
	const gitSHA = tools.process.execSync('git rev-parse --short HEAD', { cwd, shell }).toString().trim();

	const theMeta = tplTools.tplMeta(argv, rootDir, finalMetadata, svcMan.dir, gitSHA);
	return run(cwd, theTask, theMeta);
};

