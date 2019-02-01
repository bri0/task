/* eslint-disable */
const { expect } = require('chai');
const tools = require('./tools');
describe('Test', () => {
  it('expect template', () => {
    expect(tools.template('<%= inj %>', { inj: 1.123 })).to.equal('1.123');
    expect(tools.template('<%= inj %i>', { inj: 1.123 })).to.equal(1);
    expect(tools.template('<%= inj %I>', { inj: 1.123 })).to.equal(1);
    expect(tools.template('<%= inj %f>', { inj: 1.123 })).to.equal(1.123);
    expect(tools.template('<%= inj %F>', { inj: 1.123 })).to.equal(1.123);
    expect(tools.template('<%= inj %b>', { inj: 1.123 })).to.equal(true);
    expect(tools.template('<%= inj %B>', { inj: 1.123 })).to.equal(true);
  });
  it('expect deep template', () => {
  	const obj = { port: { http: '<%=http%>', rpc: '<%=rpc%>', prefix: 'dev<%=http%><%rpc%>' } }
  	const res = tools.deepTemplate(obj, {http: 3000, rpc: 4000});
  	expect(res.port.http).to.equal('3000');
  	expect(res.port.rpc).to.equal('4000');
  	expect(res.port.prefix).to.equal('dev3000');
  })
});