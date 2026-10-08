import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
function gatewayFailure(response, res) {
 console.error('blackcat_request_failed', { status: response.status });
 if(response.status===401||response.status===403)return res.status(502).json({error:'A Black Cat recusou a autenticação. Confira a BLACKCAT_API_KEY na hospedagem.'});
 if(response.status===400||response.status===422)return res.status(400).json({error:'A Black Cat recusou os dados da cobrança. Confira nome, e-mail, telefone e CPF.'});
 if(response.status===429)return res.status(503).json({error:'Muitas solicitações de pagamento. Aguarde um momento antes de tentar novamente.'});
 return res.status(502).json({error:'A Black Cat está indisponível para esta solicitação. Tente novamente mais tarde.'});
}
const base = 'https://api.blackcatoficial.com/api';
const title = 'Pós-Graduação Lato Sensu em Odontologia Oncológica';
export function validCPF(cpf) {
 if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
 for (let n=9;n<11;n++) { let sum=0; for(let i=0;i<n;i++) sum+=Number(cpf[i])*(n+1-i); let digit=(sum*10)%11; if(digit===10)digit=0; if(digit!==Number(cpf[n]))return false; } return true;
}
function sign(payload) { return createHmac('sha256', process.env.CHECKOUT_SESSION_SECRET || process.env.BLACKCAT_API_KEY).update(payload).digest('base64url'); }
function token(id) { const payload=Buffer.from(JSON.stringify({id,exp:Date.now()+2*86400000})).toString('base64url'); return payload+'.'+sign(payload); }
function verify(value) { const [p,s]=String(value||'').split('.'); if(!p||!s)throw Error('invalid'); const expected=Buffer.from(sign(p)); const got=Buffer.from(s); if(expected.length!==got.length||!timingSafeEqual(expected,got))throw Error('invalid'); const data=JSON.parse(Buffer.from(p,'base64url')); if(data.exp<Date.now()||typeof data.id!=='string')throw Error('expired'); return data.id; }
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(!process.env.BLACKCAT_API_KEY)return res.status(503).json({error:'Pagamento indisponível. A chave da Black Cat precisa ser configurada.'});
 try {
  if(req.method==='GET') {
   let id; try{id=verify(req.query.token)}catch{return res.status(401).json({error:'Sessão de pagamento inválida ou expirada.'})}
   const response=await fetch(`${base}/sales/${encodeURIComponent(id)}/status`,{headers:{'X-API-Key':process.env.BLACKCAT_API_KEY},signal:AbortSignal.timeout(15000)});
   if(!response.ok)return gatewayFailure(response,res);
   const result=await response.json(); if(!result.success)throw Error('provider');
   return res.status(200).json({status:result.data.status});
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método inválido.'})}
  if(req.headers.origin&&req.headers.host&&new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origem inválida.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  const name=String(body?.name||'').trim(),email=String(body?.email||'').trim(),phone=String(body?.phone||'').replace(/\D/g,''),cpf=String(body?.cpf||'').replace(/\D/g,'');
  if(name.length<5||name.length>120||!name.includes(' ')||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!/^\d{10,11}$/.test(phone)||!validCPF(cpf))return res.status(400).json({error:'Confira nome completo, e-mail, telefone e CPF.'});
  const response=await fetch(`${base}/sales/create-sale`,{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':process.env.BLACKCAT_API_KEY},body:JSON.stringify({amount:39700,currency:'BRL',paymentMethod:'pix',items:[{title,unitPrice:39700,quantity:1,tangible:false}],customer:{name,email,phone,document:{number:cpf,type:'cpf'}},pix:{expiresInDays:1},externalRef:randomUUID()}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)return gatewayFailure(response,res);
  const result=await response.json();if(!result.success)throw Error('provider');
  const data=result.data,p=data.paymentData; if(!data.transactionId||!(p?.copyPaste||p?.qrCode))throw Error('provider');
  return res.status(201).json({token:token(data.transactionId),status:data.status,copyPaste:p.copyPaste||p.qrCode,qrCodeBase64:p.qrCodeBase64,expiresAt:p.expiresAt});
 }catch{return res.status(502).json({error:'Não foi possível consultar a Black Cat. Se a geração demorou, confira no painel antes de tentar novamente.'})}
}
