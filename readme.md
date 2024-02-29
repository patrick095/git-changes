# Bot para pegar todas suas alterações do mês do seu GIT

## Configuração
- Rode o comando `npm install` para instalar as dependências do projeto
- rode o comando `npm run build` para realizar o build do projeto

## Gerando o Token
- Para gerar o token necessário para o projeto você deve abrir o gitlab e seguir os seguintes passos:
  - Clica na sua foto no canto superior direito e depois em settings
  - Clica em Access Tokens
  - Preenche um nome qualquer mas que você identifique para que está sendo usando
  - marca o primeiro checkbox (api)
  - Clica em `Create personal access token`
  - Depois de criado o token irá aparecer em cima do nome no campo `Your new personal access token`
  - agora basta copiar e colar no .env do projeto

## iniciando
- Para rodar o projeto basta realizar as etapas de configuração e rodar o comando `npm start`
- o projeto irá rodar na url: http://localhost:3000
