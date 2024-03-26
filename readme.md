# Bot para pegar todas suas alterações do mês do seu GIT

## Configuração
- Rode o comando `npm install` para instalar as dependências do projeto

## iniciando
- Para rodar o projeto basta realizar as etapas de configuração e rodar o comando `npm run dev`
- o projeto irá rodar na url: http://localhost:3000

## Configurando Git
- Para configurar o git coloque a url da api do seu gitlab
  - Ex: "https://gitlab.com.br/api/v4"
- Como gerar o token:
  - Dentro do seu Gitlab
  - Clica na sua foto no canto superior direito e depois em settings
  - Clica em Access Tokens
  - Preenche um nome qualquer mas que você identifique para que está sendo usando
  - marca o primeiro checkbox (`api`) 
  - Clica em `Create personal access token`
  - Depois de criado o token irá aparecer em cima do nome no campo `Your new personal access token`
  - agora basta copiar e colar no .env do projeto