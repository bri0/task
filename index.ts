#!/usr/bin/env node

import 'colors';
import start from './src'
import { LOG } from './src/log';

const envColorStr = process.env.BRASK_LOG;
if (envColorStr) {
    const colorStr = envColorStr as keyof typeof LOG.LEVEL;
    const envLogLevel = LOG.LEVEL[colorStr];
    LOG.SetLevel(envLogLevel);
}

start().catch((err) => {
    LOG.Verbose(err.stack);
    LOG.Fatal(err.toString().red);
});
