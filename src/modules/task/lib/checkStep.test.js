/* eslint-disable */
const chai = require('chai');
const { expect } = chai;

const checkStep = require('./checkStep');

describe('Test', () => {
	it('expect fail runable', (done) => {
		checkStep(null, {}).then(({ runable }) => {
			expect(runable).to.be.not.ok;
			done();
		}).catch(done);
	});
	it('fail if no cmd provide', (done) => {
		checkStep({ when: "" }, {}).then(({ runable }) => {
			expect(runable).to.be.not.ok;
			done();
		}).catch(done);
	});
	it('expect true when there is no when', (done) => {
		checkStep({cmd: 'ls'}, {}).then(({ runable, cmd }) => {
			expect(runable).to.be.ok;
			expect(cmd).to.equal('ls');
			done();
		}).catch(done);
	});
	it('expect true with right when', (done) => {
		checkStep({when: '<%= env === "dev"%b>', cmd: 'ls <%= env %>'}, { env: 'dev' }).then(({ runable, cmd }) => {
			expect(runable).to.be.ok;
			expect(cmd).to.equal('ls dev');
			done();
		}).catch(done);
	});
	it('expect fail with wrong when', (done) => {
		checkStep({when: '<%= env === "prod"%b>', cmd: 'ls <%= env %>'}, { env: 'dev' }).then(({ runable, cmd }) => {
			expect(runable).to.be.not.ok;
			done();
		}).catch(done);
	});
	it('expect true if when every is true', (done) => {
		checkStep({when: ['<%= true %b>', '<%= true %b>', '<%= true %b>'], cmd: 'ls'}, {}).then(({ runable, cmd }) => {
			expect(runable).to.be.ok;
			expect(cmd).to.equal('ls');
			done();
		}).catch(done);
	});
	it('expect fail if when not every is true', (done) => {
		checkStep({when: ['<%= true %b>', '<%= true %b>', '<%= false %b>'], cmd: 'ls'}, {}).then(({ runable }) => {
			expect(runable).to.be.not.ok;
			done();
		}).catch(done);
	});
});