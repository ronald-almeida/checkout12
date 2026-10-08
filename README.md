# Checkout12
Checkout responsivo com Nunito e imagens fornecidas, pagamento único de R$397,00 via Pix Black Cat. Sem banco de dados.

## Publicação
Importe este repositório na Vercel, usando preset Other e output `public`. As funções em `api/` são executadas no servidor.
Configure `BLACKCAT_API_KEY` nas variáveis de ambiente da Vercel. Opcionalmente configure `CHECKOUT_SESSION_SECRET` com um segredo aleatório forte (32 bytes ou mais). Faça novo deploy depois de configurar.

O valor é fixado no servidor em 39700 centavos. A chave nunca é enviada ao navegador. O Pix fica no sessionStorage da aba para permitir recarregar sem gerar nova cobrança. A consulta usa token assinado e expira em 48 horas. Sem armazenamento próprio de clientes ou transações; os registros do gateway continuam no painel Black Cat. Não há liberação automática de conteúdo: o checkout apenas confirma o status PAID retornado pela API.

Os campos de endereço reproduzem a referência visual; por se tratar de produto digital, não são transmitidos ao gateway nem armazenados. Não foram inventados termos jurídicos ou links de política de privacidade. Adicione os documentos reais do vendedor antes de divulgar o checkout.

## Verificação
`npm test`. Para testar cobrança real, configure a chave na hospedagem. Os testes locais usam uma API simulada e não geram pagamentos.
