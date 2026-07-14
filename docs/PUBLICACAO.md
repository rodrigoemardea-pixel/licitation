# Roteiro de publicação no GitHub e na Vercel

1. Faça backup do repositório atual.
2. Extraia o ZIP desta entrega.
3. Envie o conteúdo interno da pasta `licitationbiznis_modular` para a raiz do repositório.
4. Confirme que `index.html`, `vercel.json`, `css/` e `js/` estão no mesmo nível.
5. Faça commit e push para a branch de produção, normalmente `main`.
6. Se a Vercel já estiver conectada ao repositório, o push criará uma implantação automaticamente.
7. Se for um projeto novo, importe o repositório na Vercel, escolha `Other`, sem comando de build, e use `./` como Root Directory.
8. Depois da implantação, teste login, contratos, empenhos, compras, acompanhamentos, dashboard, calculadora e exportação XLSX.

## Retorno rápido

Se houver problema, reverta o commit no GitHub ou promova novamente a implantação anterior na Vercel.
