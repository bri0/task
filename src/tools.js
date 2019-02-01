const util = require('util');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
// const ojp = require('object-path');
const mkdirp = require('mkdirp');
// const os = require('os');
const _ = require('underscore');

const templReg = /^<%(.*)%([ifbIFB]?)>$/;

const {
	spawn, spawnSync, exec, execSync,
} = require('child_process');
const execPromise = util.promisify(require('child_process').exec);

const tools = {
	process: {
		spawn, spawnSync, exec, execSync, execPromise,
	},
	/**
	 * @param  {String} name File name
	 * @param  {Boolean} [foldup=true] True to fold up folder to search recursively
	 * @return {import('./modules/task').Manifest} Result of the search, empty if nil
	 */
	getManifest(name, foldup = true) {
		let rPath = name;
		const finalPath = `/${name}`;

		while (rPath) {
			const aPath = path.resolve(rPath);

			if (fs.existsSync(aPath)) {
				const dir = path.dirname(aPath);
				try {
					const metadata = tools.readYaml(aPath);
					return { dir, metadata };
				} catch (e) {
					throw new Error(`Malformed ${name}`);
				}
			}
			if (!foldup || (aPath === finalPath)) {
				return {};
			}
			rPath = `../${rPath}`;
		}
		return {};
	},
	/**
	 * @param  {String} dir
	 * @return {String} dir prepend by slash
	 */
	slashDir(dir) {
		if (dir === '.') return '';
		return `/${dir}`;
	},
	/**
	 * @param  {String} dir
	 * @return {String} dir append by slash
	 */
	dirSlash(dir) {
		if (dir === '.') return '';
		return `${dir}/`;
	},
	// cacheClear() {
	// 	execSync(`rm -rf ${os.tmpdir()}/.gokums.*`);
	// },
	// cache(key, obj) {
	// 	const tmpfn = `${os.tmpdir()}/.gokums.${key}.json`;
	// 	try {
	// 		if (!obj) {
	// 			const content = fs.readFileSync(tmpfn);
	// 			return JSON.parse(content);
	// 		}
	// 		this.writeFilePath(tmpfn, JSON.stringify(obj));
	// 		return true;
	// 	} catch (e) {
	// 		this.cacheClear();
	// 		return null;
	// 	}
	// },
	// async findProjects() {
	// 	const { stdout } =
	// await execPromise(`find ${process.env.GOPATH}/src -type f -name root.yaml`);
	// 	const files = stdout.split('\n').filter(f => !!f.trim());
	// 	if (!files) {
	// 		return [];
	// 	}
	// 	const mans = {};
	// 	await Promise.all(files.map(async (fname) => {
	// 		try {
	// 			const manifest = tools.readYaml(fname);
	// 			const rootDir = path.dirname(fname);
	// 			mans[manifest.project] = { rootDir, manifest };
	// 		} catch (e) {
	// 			// Ignore non valid file
	// 		}
	// 	}));
	// 	return mans;
	// },
	// async findServices(rootDir, confDirs) {
	// 	const svcRoot = `${rootDir}${tools.slashDir(confDirs.service)}`;
	// 	const { stdout } = await execPromise(`find ${svcRoot} -type f -name manifest.yaml`);
	// 	const files = stdout.split('\n').filter(f => !!f.trim());
	// 	if (!files) {
	// 		return [];
	// 	}
	// 	const mans = {};
	// 	await Promise.all(files.map(async (fname) => {
	// 		const manifest = tools.readYaml(fname);
	// 		const svcDir = path.dirname(fname);
	// 		mans[manifest.service.name] = { svcDir, manifest };
	// 	}));
	// 	return mans;
	// },
	writeFilePath(f, c, o) {
		const dir = path.dirname(f);
		if (!fs.existsSync(dir)) {
			this.mkdirp(dir);
		}
		return fs.writeFileSync(f, c, o);
	},
	mkdirp(dir) {
		if (!fs.existsSync(dir)) {
			mkdirp.sync(dir);
			return true;
		}
		return false;
	},
	async wait(time) {
		const msec = parseInt(time, 10);
		return new Promise((resolve) => {
			setTimeout(() => resolve(), msec * 1000);
		});
	},
	generator(num) {
		const succ = function* succ(start) {
			let idx = start;
			while (idx < Infinity) {
				yield idx += 1;
			}
		};
		return succ(num);
	},
	template(str = '', obj) {
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
	},
	deepTemplate(templ, obj) {
		if (_.isString(templ)) return tools.template(templ, obj);
		if (_.isObject(templ)) {
			const newTempl = {};
			const keys = Object.keys(templ);
			for (let i = 0; i < keys.length; i += 1) {
				newTempl[keys[i]] = tools.deepTemplate(templ[keys[i]], obj);
			}
			return newTempl;
		}
		return templ;
	},
	readYaml(file) {
		const res = yaml.loadAll(fs.readFileSync(file));
		if (res.length === 1) return res[0];
		return res;
	},
	writeYaml(file, target) {
		if (Array.isArray(target)) {
			fs.writeFileSync(file, target.map(o => yaml.dump(o)).join('---\n'));
			return;
		}
		fs.writeFileSync(file, yaml.dump(target));
	},
	inspect(obj) {
		return util.inspect(obj, false, null);
	},
	argsSplit(args) {
		return args.trim().match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
	},
};

module.exports = tools;
