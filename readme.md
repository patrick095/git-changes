# Bot para pegar todas suas alterações do mês do seu GIT (Já atualizado para pegar do Github)

## Configuração
- Rode o comando `npm ci` para instalar as dependências do projeto

## iniciando
- Para rodar o projeto basta realizar as etapas de configuração e rodar o comando `npm start`
- o projeto irá rodar na url: http://localhost:3000

## Configurando Git
- Para configurar o git coloque a url da api do seu gitlab
  - Ex: "https://api.github.com"
- Como gerar o token:
  - Dentro do seu Github
  - Clica na sua foto no canto superior direito e depois em settings
  - Clieca em Developer Settings
  - Clica em Personal Access Tokens
  - Clica em Tokens (classic)
  - Generate new Token -> Generate new Token (classic)
  - Preenche um nome para que você saiba que esse token está sendo usado nesse projeto
  - Seleciona data de expiração (ou deixa sem expiração)
  - marca os checkboxes (`repo`, `user`, `project`) 
  - Clica em `Generate Token`
  - Depois de criado o token irá aparecer em uma mensaem com fundo verde, você deve salvar esse token.
  - Depois clica em Configure SSO
  - Depois seleciona as organizações (ex: bbvinet) onde estão os projetos que você trabalha e clica em Authorize
  - Autoriza para o token acessar a organização
  - agora basta copiar e colar no .env do projeto
- No campo de organizações você vai digitar o nome das organizações onde estão os projetos que você trabalha sendo cada um em uma linha (ex: bbvinet)