const deepExtend = require('deep-extend');
const ojp = require('object-path');

/**
 * Enum for store in Step
 * @readonly
 * @enum {number}
 */
const PIPETYPE = {
	UNKNOWN: 0,
	PIPE: 1, // Store to pipe
	RAW: 2, // Store to tools.get('key')
	JSON: 3, // Store to tools.get('key') as json
	YAML: 4, // Store to tools.get('key') as yaml
};

/**
 * Enum for task scope
 * @readonly
 * @enum {number}
 */
const TASKSCOPE = {
	UNKNOWN: 0,
	GLOBAL: 1, // In ~/.brask/modules/${name}.yaml
	PROJECT: 2, // In ${rootDir}/root.yaml
	SERVICE: 3, // In ${svcDir}/manifest.yaml
};

/** @typedef {object} Step
 * @property {string} [name] Name of step
 * @property {string|string[]} cmd Command to execute
 * @property {string} [when] Condition
 * @property {boolean} [break=false] Break control
 * @property {PIPETYPE} [pipe] To pipe or not
 * @property {string} [storeKey] To store when pipe is other than PIPE
 * @property {string} [cwd] Working directory, default to moduleDir/RootDir/SvcDir
*/

/**
 * @typedef {object} Task
 * @property {Step[]} steps
 * @property {Step[]} substeps
 * @property {Object.<string,string>} env
*/


/** @typedef {object} Metadata
 * @property {Object.<string, Task>} tasks List of task for this metadata
 * @property {Object.<string, Step[]>} substeps Common substeps,
 * which will be overwrite by supstep inside a task
*/

/**
 * @typedef {object} Manifest
 * @property {string} dir The dir of the manifest
 * @property {Metadata} metadata The metadata object itself
 */

/**
 * @param {Metadata} me1
 * @param {Metadata} me2
 * @return {Metadata} merged metadata
 */
function mergeMetadata(me1, me2) {
	const copyTasks = { ...me1.tasks };
	const tasks = deepExtend(copyTasks, me2.tasks || {});
	const copySubsteps = { ...me1.substeps };
	const substeps = deepExtend(copySubsteps, me2.substeps || {});
	return { tasks, substeps };
}


/**
 * Get a task from metadata, common substeps from the meta will be overwirte by substeps in task
 *
 * @param {String} taskName name of task
 * @param {Metadata} meta
 * @returns {Task | null}
 */
function getTask(taskName, meta) {
	/** @type {Task|null} */
	const metaTask = ojp.get(meta.tasks, taskName);
	if (!metaTask) return null;
	const { steps } = metaTask;
	const copySubsteps = { ...meta.substeps };
	const substeps = deepExtend(copySubsteps, metaTask.substeps);

	return { steps, substeps };
}

module.exports = {
	PIPETYPE,
	TASKSCOPE,
	mergeMetadata,
	getTask,
};
