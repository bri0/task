import 'colors';
import { Metadata } from './task';
import { TplTools } from "../../tplTools";
import { LOG } from '../../log';
import * as ojp from 'object-path';
import { spawnSync } from 'child_process';
import * as yaml from 'js-yaml';

export default async function runTask(cwd: string, theTask: Metadata.Task, tplData: TplTools.TemplateMeta) {
    const shell = true;
    const theData = tplData;

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
        const checkedStep = steps[j].checkStep(theData);
        if (checkedStep.runable) {
            LOG.Info(`About to run step: ${(checkedStep.name || j).toString().yellow}`);
            LOG.Verbose(`Command: ${(checkedStep.cmd || "").cyan}`);
            if ((checkedStep.cmd || "").indexOf(Metadata.FlowPrefix) === 0) {
                // In the case that cmd refer to a flow
                const flow = <Metadata.Flow>ojp.get(theTask, checkedStep.cmd || "");
                if (!flow) throw new Error(`Flow ${checkedStep.cmd} not found.`);
                if (!flow || flow.length === 0) {
                    throw new Error(`Flow ${checkedStep.cmd} does not contains any step.`);
                }
                let broken = false;
                for (let ssi = 0; ssi < flow.length; ssi += 1) {
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
                        // @ts-ignore
                        const res = spawnSync(checkedFlow.cmd || "", opts);
                        if (res.status !== 0) {
                            throw new Error('Stop due to non-sucessfull exit in sub step.');
                        }
                        if (flow[ssi].stop) {
                            LOG.Verbose('Stop due to break control');
                            broken = true;
                            break;
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
                // @ts-ignore
                const res = spawnSync(checkedStep.cmd || "", opts);
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
            if (steps[j].stop) {
                LOG.Verbose('Stop due to break control');
                break;
            }
        } else {
            LOG.Verbose(`Ignore: ${checkedStep.cmd}`.grey);
        }
    }
}
