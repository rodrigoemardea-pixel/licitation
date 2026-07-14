# LicitationBiznis, versão modular

Esta entrega reorganiza o arquivo único em HTML, CSS e arquivos JavaScript separados, preservando a ordem original de execução e os nomes globais usados pelos atributos `onclick`, `onchange` e `oninput`.

## Estrutura

- `index.html`: estrutura visual e referências externas.
- `css/app.css`: estilos extraídos do HTML.
- `js/01-firebase-config.js`: configuração e inicialização do Firebase.
- `js/02-core-auth-state.js`: autenticação, permissões e estado principal.
- `js/03-contratos-lotes-cache.js`: lotes, cache e inicialização de dados.
- `js/04-calculos-filtros-navegacao.js`: cálculos, filtros, abas, paginação e ordenação.
- `js/05-popups-selecao-itens.js`: popups e seleção de itens dos empenhos.
- `js/06-renderizacao-dashboard.js`: renderização principal e dashboard.
- `js/07-modais-formularios-crud.js`: modais, formulários, cadastros e exclusões.
- `js/08-compras.js`: compras vinculadas aos empenhos.
- `js/09-calculadora.js`: calculadora rápida e custos.
- `js/10-finalizacao-busca-ui.js`: finalização, busca, confirmação e notificações de interface.
- `js/11-finalizados-exportacoes.js`: registros finalizados e exportações.
- `js/12-acompanhamentos-licitanet.js`: acompanhamentos, Licitanet e retornos.
- `js/13-painel-comentarios-inline.js`: painel, agrupamentos, comentários e edição inline.
- `js/14-boot.js`: inicialização final.
- `js/15-interface-enterprise.js`: aprimoramentos finais da interface.

## Teste local

Não abra o arquivo apenas com duplo clique. Use um servidor HTTP local:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicação

Envie o conteúdo desta pasta para a raiz do repositório conectado à Vercel. O arquivo `index.html` deve ficar na raiz. Na Vercel, use Framework Preset `Other`, deixe Build Command vazio e mantenha a raiz do projeto como `./`.

## Observação de compatibilidade

Esta versão prioriza compatibilidade: os scripts continuam clássicos e são carregados na ordem original. Uma migração futura para ES Modules exigirá remover os eventos inline do HTML e importar explicitamente as dependências.
