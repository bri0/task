import 'colors';
import { Metadata } from './task';
import { TplTools } from "../../tplTools";
import { LOG } from '../../log';
import { spawnSync, SpawnSyncOptions } from 'child_process';
import * as yaml from 'js-yaml';

export default async function runTask(cwd: string, theTask: Metadata.Task, tplData: TplTools.TemplateMeta) {
    // const theTask = Metadata.taskify(task);
    // console.log(theTask.getFlow('flows.check-buildtool'));
    // console.log(task.getFlow('flows.check-buildtool'));

    const shell = true;
    const theData = tplData;

    const options: SpawnSyncOptions = {
        stdio: 'inherit',
        cwd,
        shell,
        env: { ...process.env, ...theTask.env },
    };
    const pipeOptions: SpawnSyncOptions = {
        stdio: ['inherit', 'pipe', 'inherit'],
        cwd,
        shell,
        env: { ...process.env, ...theTask.env },
    };

    const { steps } = theTask;

    if (!steps || steps.length <= 0) return;
    for (let j = 0; j < steps.length; j += 1) {
		const theStep = Metadata.stepify(steps[j]);
		// Perform inquiries
		await theStep.inquiry(theData);

		const checkedStep = theStep.checkStep(theData);
        if (checkedStep.runable) {
            LOG.Info(`About to run step: ${(checkedStep.name || j).toString().cyan}`);
            LOG.Verbose(`Command: ${(checkedStep.cmd || "").cyan}`);
            if ((checkedStep.cmd || "").indexOf(Metadata.FlowPrefix) === 0) {
                // In the case that cmd refer to a flow
                const flow = theTask.getFlow((checkedStep.cmd || "").substr(Metadata.FlowPrefix.length));
                if (!flow) throw new Error(`Flow ${checkedStep.cmd} not found.`);
                if (!flow || flow.length === 0) {
                    throw new Error(`Flow ${checkedStep.cmd} does not contains any step.`);
                }
                let broken = false;
                for (let ssi = 0; ssi < flow.length; ssi += 1) {
					// Inquiry
					await flow[ssi].inquiry(theData);

                    const checkedFlow = await flow[ssi].checkStep(theData);
                    if (checkedFlow.runable) {
                        LOG.Info(`  About to run substep: ${(checkedFlow.name || ssi.toString()).cyan}`);
                        LOG.Verbose(`  Command: ${(checkedFlow.cmd || "").cyan}`);
                        const { pipe, storeKey } = flow[ssi];
                        let opts = pipe ? pipeOptions : options;
                        if (checkedFlow.cwd) {
                            opts = { ...opts };
                            opts.cwd = checkedFlow.cwd;
						}
						taskExecute(checkedFlow.cmd, opts, pipe, storeKey, theData);
                        if (flow[ssi].stop) {
                            LOG.Verbose('Stop due to break control');
                            broken = true;
                            break;
                        }
                    } else {
                        LOG.Verbose(`  Ignore: ${checkedFlow.cmd}`.grey);
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
				taskExecute(checkedStep.cmd, opts, pipe,storeKey, theData);
            }
            if (steps[j].stop) {
                LOG.Verbose('Stop due to break control');
                break;
            }
        } else {
            LOG.Verbose(`Ignore: ${checkedStep.cmd}`.grey);
        }
    }
}

function taskExecute(
	cmd: string="",
	opts: SpawnSyncOptions,
	pipe: Metadata.PIPETYPE,
	storeKey: string,
	theData: TplTools.TemplateMeta) {
	const res = spawnSync(cmd || "", opts);
	if (res.status !== 0) {
		throw new Error('Stop due to non-sucessfull exit in step.');
	}
	const stdout = res.stdout && res.stdout.toString().trim();
	switch (pipe) {
		case Metadata.PIPETYPE.PIPE:
			theData.pipe = stdout;
			break;
		case Metadata.PIPETYPE.RAW:
			if (storeKey) theData.tools.set(storeKey, stdout);
			break;
		case Metadata.PIPETYPE.YAML:
			if (storeKey) theData.tools.set(storeKey, yaml.load(stdout));
			break;
		case Metadata.PIPETYPE.JSON:
			if (storeKey) theData.tools.set(storeKey, JSON.parse(stdout));
			break;
		default:
			break;
	}
}
