#!/usr/bin/env ts-node

import 'colors';
import start from './src'
import { LOG } from './src/log';

const envLogLevel = LOG.LEVEL[process.env.BRASK_LOG || ''];
if (envLogLevel) {
    LOG.SetLevel(envLogLevel);
}

start().catch((err) => {
    LOG.Verbose(err.stack);
    LOG.Error(err.toString().red);
});
