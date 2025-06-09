## 🌍 Qual a Origem do Seu Nome?
Um aplicativo mobile intuitivo desenvolvido com React Native (Expo) que permite descobrir a provável nacionalidade de um nome utilizando uma API externa. O aplicativo exibe a bandeira do país correspondente e mantém um histórico de pesquisas no armazenamento local do dispositivo.

## 🚀 Funcionalidades

* Previsão de Nacionalidade: Digite um nome e veja a probabilidade de nacionalidade para diferentes países.
* Exibição de Bandeiras: Visualize a bandeira do país correspondente à nacionalidade.
* Histórico de Pesquisas: As pesquisas recentes são salvas localmente no seu dispositivo para acesso rápido.
* Interface Responsiva: Design otimizado para dispositivos móveis, com rolagem para visualizar todo o conteúdo.

## 🛠️ Tecnologias Utilizadas

* React Native: Framework para desenvolvimento de aplicativos móveis nativos utilizando JavaScript.
* Expo: Ferramenta e plataforma para desenvolvimento, construção e implantação de aplicativos React Native.
* @react-native-async-storage/async-storage: Para armazenamento persistente de dados no lado do cliente (histórico de pesquisas).
* API nationalize.io: Utilizada para prever a nacionalidade de um nome.
* API flagcdn.com: Utilizada para exibir as bandeiras dos países.

## ⚙️ Instalação e Execução (Desenvolvimento)

Para rodar este projeto em seu ambiente de desenvolvimento, siga os passos abaixo:

* Clone o repositório:
git clone (https://github.com/renatoloreto/app-nome-react-expo.git)

* Instale as dependências:

npm install

* Instale o Expo CLI globalmente:
  
npm install expo-cli -g

* Instale as dependências Expo adicionais:

npx expo install expo-linear-gradient @react-native-async-storage/async-storage

* Inicie o aplicativo (verifique se sua máquina e seu celular estão conectados na mesma rede):

npx expo start 

Isso abrirá o Metro Bundler. Você pode escanear o QR code com o aplicativo Expo Go no seu celular ou usar um emulador.
