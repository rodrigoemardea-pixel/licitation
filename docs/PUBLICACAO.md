# Publicação da atualização de UI/UX

## Arquivos desta entrega

- `index.html`: estrutura revisada, títulos de página, navegação agrupada e correções de marcação.
- `css/app.css`: estilos existentes com camada final de consistência, acessibilidade e responsividade.
- `js/16-ui-ux-enhancements.js`: foco em modais, fechamento por Escape, navegação por teclado em colunas ordenáveis, atributos ARIA e preservação de filtros durante a sessão.
- `vercel.json`: configuração preservada.

## Como publicar

1. Faça backup do repositório atual.
2. Substitua o `index.html` da raiz pelo arquivo desta entrega.
3. Substitua `css/app.css`.
4. Adicione `js/16-ui-ux-enhancements.js` sem remover os arquivos JavaScript existentes.
5. Preserve a pasta `js` atual e todos os arquivos `01` a `15`.
6. Remova a pasta `Old` da publicação, caso ela não deva permanecer acessível.
7. Faça commit e push para a branch de produção.
8. Na Vercel, teste login, navegação, modais, filtros, ordenação, contratos, empenhos, compras, acompanhamentos, dashboard e exportação XLSX.

## Observação

Esta entrega não inclui os arquivos JavaScript `01` a `15`, pois eles não foram anexados. O novo arquivo `16` foi criado como uma camada complementar e não substitui a lógica de negócio existente.
