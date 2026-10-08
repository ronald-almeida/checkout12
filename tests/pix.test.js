import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/pix.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}}}
test('create and query Pix securely without a database',async()=>{
process.env.BLACKCAT_API_KEY='test-secret';const original=global.fetch;let payload;
try{global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({success:true,data:{transactionId:'TXN-test',status:'PENDING',paymentData:{copyPaste:'pix-code',qrCodeBase64:'data:image/png;base64,AAAA'}}})}};
const res=response();await handler({method:'POST',headers:{host:'test',origin:'https://test'},body:{name:'Maria Silva',email:'maria@example.com',phone:'11999999999',cpf:'52998224725',amount:1}},res);assert.equal(res.code,201);assert.equal(payload.amount,39700);assert.equal(payload.items[0].unitPrice,39700);assert.ok(res.body.token);assert.equal(JSON.stringify(res.body).includes('test-secret'),false);
const token=res.body.token;global.fetch=async()=>({ok:true,json:async()=>({success:true,data:{status:'PAID',customer:{name:'private'}}})});const status=response();await handler({method:'GET',query:{token}},status);assert.deepEqual(status.body,{status:'PAID'});
const bad=response();await handler({method:'GET',query:{token:token+'x'}},bad);assert.equal(bad.code,401);
const invalid=response();await handler({method:'POST',headers:{},body:{name:'Maria Silva',email:'maria@example.com',phone:'11999999999',cpf:'11111111111'}},invalid);assert.equal(invalid.code,400);
}finally{global.fetch=original;delete process.env.BLACKCAT_API_KEY}
});
test('missing credential fails safely',async()=>{const r=response();await handler({method:'POST'},r);assert.equal(r.code,503)});
