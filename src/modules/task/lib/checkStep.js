const tools = require('../../../tools');

/**
 *
 * @param {import('../task').Step} step
 * @param {import('../../../tpltools').TemplateMeta} meta
 * @return {{runable: boolean, name?: string, cmd?: string, cwd?: string}}
 */
const checkStepFn = (step, meta) => {
	if (!step) return { runable: false };
	const {
		when,
		name,
		cmd,
		cwd,
	} = step;
	if (!cmd) return { runable: false, name };
	let runable = true;
	if (when !== undefined) {
		if (typeof (when) === 'string') {
			runable = !!tools.template(when, meta);
		} else if (typeof when === 'object' && Array.isArray(when)) {
			runable = when.every(w => !!tools.template(w, meta));
		}
	}
	if (!runable) return { runable, name, cmd };
	let cmdTpl = cmd;
	if (Array.isArray(cmd)) cmdTpl = cmd.join(' ');
	const stepCmd = tools.template(cmdTpl, meta);
	const stepCwd = tools.template(cwd, meta);
	return {
		runable,
		name,
		cmd: stepCmd,
		cwd: stepCwd,
	};
};

module.exports = checkStepFn;
