# Checkout12

Checkout com Nunito, imagens fornecidas e Pix PayShark de R$497,70. Sem banco de dados. Endereço opcional e não enviado ao gateway.

## Vercel
Configure PAYSHARK_API_KEY com a chave de pagamentos em Financeiro → Integrações → Credenciais de API. Não use a chave de saque ou tokenização. Configure CHECKOUT_SESSION_SECRET opcionalmente com segredo forte. Faça novo deploy após configurar.

POST https://api.gatewaypayshark.com.br/v1/payment usa Bearer, amount 49770, method PIX, payer e item DIGITAL. A resposta contém data.copypaste; a imagem QR é gerada no servidor com qrcode. A consulta manual usa GET /v1/payment/:id e token assinado.

A documentação proíbe polling no gateway. O checkout não faz consultas automáticas: o cliente usa o botão Já paguei. Atualizações automáticas requerem webhook com armazenamento durável de status e não estão implementadas neste projeto sem banco. Não existe liberação automática de conteúdo.

O Pix fica apenas no sessionStorage da aba; cobranças anteriores à migração não são reutilizadas. Registros do gateway permanecem no painel PayShark.

Documentação: https://app.gatewaypayshark.com.br/llms.txt

npm test valida a integração com respostas simuladas, sem gerar cobranças reais.
