const LOG_LEVEL = {
	VERBOSE: 0,
	INFO: 1,
	WARNING: 2,
	ERROR: 3,
	FATAL: 4,
};

const LOG_LEVELS = ['VERBOSE', 'INFO', 'WARNING', 'ERROR', 'FATAL'];

let defaultLogLevel = LOG_LEVEL.INFO;
/**
 * @param  {Number} level
 * @param  {String} message
 * @param  {...any=} opts
 */
function log(level, message, ...opts) {
	if (level < defaultLogLevel) return;
	if (level < LOG_LEVEL.ERROR) {
		console.log(`${LOG_LEVELS[level]}: ${message}`, ...opts);
		return;
	}
	console.error(`${LOG_LEVELS[level]}: ${message}`, ...opts);
}

module.exports = {
	LOG_LEVEL,
	LOG_LEVELS,
	log: {
		/**
		 * @param  {String} message
		 * @param  {...any=} opts
		 */
		Info(message, ...opts) {
			log(LOG_LEVEL.INFO, message, ...opts);
		},
		/**
		 * @param  {String} message
		 * @param  {...any=} opts
		 */
		Verbose(message, ...opts) {
			log(LOG_LEVEL.VERBOSE, message, ...opts);
		},
		/**
		 * @param  {String} message
		 * @param  {...any=} opts
		 */
		Warn(message, ...opts) {
			log(LOG_LEVEL.WARNING, message, ...opts);
		},
		/**
		 * @param  {String} message
		 * @param  {...any=} opts
		 */
		Error(message, ...opts) {
			log(LOG_LEVEL.ERROR, message, ...opts);
		},
		/**
		 * @param  {String} message
		 * @param  {...any=} opts
		 */
		Fatal(message, ...opts) {
			log(LOG_LEVEL.FATAL, message, ...opts);
			process.exit(1);
		},
		/**
		 * @param  {String} lvlStr
		 */
		SetLevel(lvlStr = "") {
			const lvl = lvlStr.toUpperCase();
			if (LOG_LEVEL[lvl] != null) {
				defaultLogLevel = LOG_LEVEL[lvl];
			}
		},
	},
};

