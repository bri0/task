const minimist = require('minimist');
// const { log } = require('./log');
const version = require('./modules/version');
const task = require('./modules/task');
// const fs = require('fs');

const argv = minimist(process.argv.slice(2));
const modules = {
	version,
};

module.exports = async () => {
	if (argv._[0] === '-') {
		if (typeof modules[argv._[1]] === 'function') {
			return modules[argv._[1]](argv);
		}
	}

	return task(argv);
};
