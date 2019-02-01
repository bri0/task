const tools = require('./tools');
const ojp = require('object-path');
const os = require('os');

const tplData = {
	generators: {},
	mem: {},
};

const tplTools = {
	next(schema, start) {
		if (tplData.generators[schema]) return tplData.generators[schema].next().value;
		tplData.generators[schema] = tools.generator(start);
		return start;
	},
	set(key, val) {
		tplData.mem[key] = val;
	},
	get(key) {
		return ojp.get(tplData.mem, key, null);
	},
	which(prog) {
		try {
			return tools.process.execSync(`which ${prog}`).toString().trim();
		} catch (e) {
			return '';
		}
	},
	cancel(err) {
		throw new Error(err);
	},
};

/**
 * @typedef {Object} TemplateMeta_Project
 * @property {string} rootDir
 * @property {string} svcDir
 * @property {string} svcDirFromRoot
 * @property {string} gitSHA
*/

/**
 * @typedef {Object} TemplateMeta
 * @property {import('minimist').ParsedArgs} argv args of command line tool
 * @property {number} timestamp
 * @property {Object.<string,string>} env Environment variable
 * @property {Object} os
 * @property {Object.<string,Object>} vars merged variables
 * from metadata of module or root with service
 * @property {TemplateMeta_Project} project project's metadata
*/

module.exports = {
	tools: tplTools,

	/**
	 * Generate the template interpolation variables
	 *
	 * @param {import('minimist').ParsedArgs} argv argument from the command line
	 * @param {String} rootDir root directory, current or closest parent folder contains root.yaml
	 * @param {import('./modules/task/task').Metadata} metadata merged metadata
	 * from module or root with service manifest
	 * @param {String} svcDir service directory,
	 * current or closest parent folder contains manifest.yaml
	 * @param {String} gitSHA sha of current git head commit
	 * @returns {TemplateMeta}
	 */
	tplMeta(argv, rootDir, metadata, svcDir, gitSHA) {
		/** @type {Object.<string, Object>} */
		const vars = ojp.get(metadata, 'vars', {});
		const theMeta = {
			argv,
			timestamp: Date.now(),
			env: process.env,
			tools: tplTools,
			os,
		};
		const tplVars = tools.deepTemplate(vars, theMeta);
		theMeta.vars = tplVars;

		theMeta.project = {
			rootDir,
			svcDir,
			gitSHA,
		};

		if (svcDir !== '' && rootDir !== '') {
			const svcDirFromRoot = (svcDir || '').split(rootDir)[1];
			theMeta.project.svcDirFromRoot = svcDirFromRoot;
		}

		return theMeta;
	},
};
