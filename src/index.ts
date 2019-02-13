import minimist from 'minimist';
import version from './modules/version';
import task from './modules/task'

const cmdArgv = minimist(process.argv.slice(2));

export default async function () {
    if (cmdArgv._[0] === '-') {
        const taskName = cmdArgv._[1];
        switch (taskName) {
            case "version":
                return version();
                break;
            default:
                throw new Error(`Task ${taskName} not found.`);
        }
    }

    return task(cmdArgv);
};
