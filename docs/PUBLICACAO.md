# Publicação da versão 4.1 no GitHub e na Vercel

Esta entrega não exige alteração no Firebase, nas regras do Firestore ou na configuração da Vercel.

## Arquivos que devem ser publicados

- `index.html`
- `vercel.json`
- pasta `css`
- pasta `js`
- pasta `docs`

## Como publicar

1. Faça backup do repositório atual em **Code > Download ZIP**.
2. Extraia o arquivo `LicitationBiznis_v4_1_GitHub.zip`.
3. Abra a pasta extraída.
4. Substitua no repositório o `index.html`, o `vercel.json` e as pastas `css`, `js` e `docs`.
5. Faça commit na branch de produção, normalmente `main`.
6. Aguarde a implantação automática da Vercel.
7. Atualize o sistema com `Ctrl + F5`.

## O que permanece inalterado

- projeto Firebase atual;
- autenticação existente;
- documento `dados/principal`;
- regras atuais do Firestore;
- conexão atual entre GitHub e Vercel.

## Testes recomendados

- login e logout;
- Painel e Dashboard;
- contratos e empenhos;
- compras e calculadora;
- acompanhamentos;
- filtros avançados;
- visualizações salvas;
- seleção de colunas;
- checklists;
- backup e restauração;
- ordenação e exportação XLSX.
