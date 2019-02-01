#!/usr/bin/env node

const start = require('./src');
const _ = require('colors');
const { log } = require('./src/log');

log.SetLevel(process.env.BRASK_LOG);

start().catch((err) => {
	log.Verbose(err.stack);
	log.Error(err.toString().red);
});
