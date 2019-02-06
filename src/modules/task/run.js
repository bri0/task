require('colors');
const ojp = require('object-path');
const checkStep = require('./lib/checkStep');
const tools = require('../../tools');
const task = require('./task');
const yaml = require('js-yaml');
const { log } = require('../../log');

/**
 * @param {String} cwd working directory
 * @param {import('./task').Task} theTask the task to work
 * @param {import('../../tpltools').TemplateMeta} templateMeta
 * @returns {Promise}
 */
const runFn = async (cwd, theTask, templateMeta) => {
	const shell = true;
	const theMeta = templateMeta;

	const options = {
		stdio: 'inherit',
		cwd,
		shell,
		env: { ...process.env, ...theTask.env },
	};
	const pipeOptions = {
		stdio: ['inherit', 'pipe', 'inherit'],
		cwd,
		shell,
		env: { ...process.env, ...theTask.env },
	};

	const { steps } = theTask;

	if (!steps || steps.length <= 0) return;
	for (let j = 0; j < steps.length; j += 1) {
		const checkedStep = checkStep(steps[j], theMeta);
		if (checkedStep.runable) {
			log.Info(`About to run step: ${(checkedStep.name || j).toString().yellow}`);
			log.Verbose(`Command: ${checkedStep.cmd.cyan}`);
			if (checkedStep.cmd.indexOf('substeps.') === 0) {
				/** @type {import('./task').Step[]} */
				const substep = ojp.get(theTask, checkedStep.cmd);
				if (!substep) throw new Error(`Substep ${checkedStep.cmd} not found.`);
				if (!substep.steps || substep.steps.length === 0) {
					throw new Error(`Substeps ${checkedStep.cmd} does not contains any step.`);
				}
				let broken = false;
				for (let ssi = 0; ssi < substep.steps.length; ssi += 1) {
					const checkedSubstepStep = await checkStep(substep.steps[ssi], theMeta);
					if (checkedSubstepStep.runable) {
						log.Info(`  About to run substep: ${(checkedSubstepStep.name || ssi).cyan}`);
						log.Verbose(`  Command: ${substep.cmd.cyan}`);
						const { pipe, storeKey } = substep.steps[ssi];
						let opts = pipe ? pipeOptions : options;
						if (substep.cwd) {
							opts = { ...opts };
							opts.cwd = substep.cwd;
						}
						const res = tools.process.spawnSync(
							substep.cmd,
							opts,
						);
						if (res.status !== 0) {
							throw new Error('Stop due to non-sucessfull exit in sub step.');
						}
						if (substep.steps[ssi].break) {
							log.Verbose('Stop due to break control');
							broken = true;
							break;
						}
						const stdout = res.stdout && res.stdout.toString().trim();

						switch (pipe) {
						case task.PIPETYPE.PIPE:
							theMeta.pipe = stdout;
							break;
						case task.PIPETYPE.RAW:
							if (storeKey) theMeta.tools.set(storeKey, stdout);
							break;
						case task.PIPETYPE.YAML:
							if (storeKey) theMeta.tools.set(storeKey, yaml.load(stdout));
							break;
						case task.PIPETYPE.JSON:
							if (storeKey) theMeta.tools.set(storeKey, JSON.parse(stdout));
							break;
						default:
							break;
						}
					} else {
						log.Verbose(`  Ignore: ${checkedSubstepStep.cmd}`.grey);
					}
				}
				if (broken) break;
			} else {
				const { pipe, storeKey } = steps[j];
				let opts = pipe ? pipeOptions : options;
				if (checkedStep.cwd) {
					opts = { ...opts };
					opts.cwd = checkedStep.cwd;
				}
				const res = tools.process.spawnSync(checkedStep.cmd, opts);
				if (res.status !== 0) {
					throw new Error('Stop due to non-sucessfull exit in step.');
				}
				const stdout = res.stdout && res.stdout.toString().trim();
				switch (pipe) {
				case task.PIPETYPE.PIPE:
					theMeta.pipe = stdout;
					break;
				case task.PIPETYPE.RAW:
					if (storeKey) theMeta.tools.set(storeKey, stdout);
					break;
				case task.PIPETYPE.YAML:
					if (storeKey) theMeta.tools.set(storeKey, yaml.load(stdout));
					break;
				case task.PIPETYPE.JSON:
					if (storeKey) theMeta.tools.set(storeKey, JSON.parse(stdout));
					break;
				default:
					break;
				}
			}
			if (steps[j].break) {
				log.Verbose('Stop due to break control');
				break;
			}
		} else {
			log.Verbose(`Ignore: ${checkedStep.cmd}`.grey);
		}
	}
};

module.exports = runFn;
