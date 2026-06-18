# InstaVault 📸⚡

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Instaloader](https://img.shields.io/badge/Instaloader-Motor_de_Extração-green?style=for-the-badge)

**InstaVault** é um wrapper avançado em Next.js para extração em lote e gerenciamento granular de mídias do Instagram, utilizando todo o poder do motor CLI [instaloader](https://github.com/instaloader/instaloader) (Python). Projetado com uma interface limpa e reativa, o projeto permite realizar o bypass de CORS e orquestrar extrações complexas diretamente de um painel de controle local seguro.

> **Créditos do Motor de Extração:** O core de extração e a engenharia reversa do Instagram são providos inteiramente pela equipe do [Instaloader](https://instaloader.github.io/).

---

## 🏗️ Arquitetura e Stack

A aplicação opera através de uma arquitetura híbrida de controle de processos locais:
- **Frontend / Backend**: Construído em **Next.js 15** com TypeScript e Tailwind CSS v4, apresentando um layout **Bento Grid** tático e focado na operação.
- **Motor de Execução**: O backend (`app/api/download/route.ts`) invoca nativamente o interpretador Python do SO host via `child_process.spawn`. O sistema utiliza o módulo nativo `fs` para a criação autônoma e segura dos diretórios de saída.
- **Comunicação Server-Sent Events (SSE)**: Toda a saída (stdout/stderr) do Python é capturada e "streamada" em tempo real para o navegador.

### 🛡️ Privacidade e Segurança (É Seguro?)

**Sim, 100% seguro.** O InstaVault atua puramente como um **Local Wrapper**. Isso significa que:
- Nenhuma das suas extrações, senhas, mídias baixadas ou perfis alvo são enviados para qualquer servidor em nuvem.
- Toda a execução ocorre exclusivamente dentro da sua máquina host (localhost).
- A autenticação baseada em sessão gera um cookie criptografado que nunca trafega pela interface gráfica (Next.js).

---

## 🛠️ Pré-requisitos

Para que o InstaVault funcione corretamente, o sistema host deve possuir:

1. **Node.js** (v18+ recomendado)
2. **Python 3** (v3.8+ recomendado)
3. **Instaloader**: Instalado no seu ambiente local.
   ```bash
   pip install instaloader
   ```

---

## 🔐 Guia de Inicialização do Motor Local (Auth)

Para extrair posts salvos, conteúdos de perfis privados, stories, highlights ou contornar bloqueios do Instagram, **é mandatório gerar a sessão local via terminal antes de usar a aplicação web**:

1. Abra o CMD, PowerShell ou Terminal do seu sistema operativo.
2. Execute o comando de login nativo, substituindo pelo seu usuário:
   ```bash
   python -m instaloader --login=SEU_USUARIO_AQUI
   ```
3. Digite sua senha quando solicitado (segurança nativa do terminal).
4. O Instaloader salvará o cookie de sessão persistente (`session-SEU_USUARIO`) na sua máquina. (Ex: Windows -> `%LOCALAPPDATA%\Instaloader`).

---

## ⚙️ Configuração e Personalização (Como Usar)

Na raiz do projeto, crie um arquivo `.env.local` e informe o usuário da sessão gerada:
```env
# .env.local
IG_USERNAME=seu_usuario_aqui
```

### 🎛️ O que você pode personalizar na UI?
O painel de controle (Dashboard) expõe poderosas *Flags* de personalização da CLI diretamente no navegador:

- **Caminho Absoluto (Target Directory):** Escolha qualquer diretório físico na sua máquina (ex: `C:\Users\Downloads\Meus Posts`). O backend garantirá a criação das pastas e o Python salvará as mídias em subpastas com o nome dos perfis (`{profile}`).
- **Modos de Operação:** Extraia o perfil inteiro (Profile), Links isolados (Post/Reel), a fila de Stories ativos ou a sua biblioteca de *Saved Posts*.
- **Parâmetros Booleanos (Toggles):** Otimize o download ativando "Ignorar Vídeos" (apenas imagens), "Ignorar Metadados .json" e "Ignorar Legendas .txt". Também pode instruir a baixar *Destaques* (Highlights) e *Comentários*.
- **Atualização Rápida (Fast Update):** Essencial para backups diários. O Instaloader para de buscar mídias assim que atinge a primeira foto que já existe na sua pasta local.
- **Filtros de Engajamento:** Define "Mínimo de Curtidas" ou "Mínimo de Comentários". O sistema traduz isso em eval lógico (`likes >= X and comments >= Y`) e ignora posts de baixa performance.

---

## 📦 Artefatos de Saída
Dependendo das suas configurações no painel, o InstaVault entregará:
1. **Mídia Bruta (`.jpg` / `.mp4`)**: Os arquivos limpos em máxima resolução.
2. **Legenda (`.txt`)**: O texto bruto extraído da publicação original.
3. **Graph Payload (`.json.xz`)**: Um dump compactado do retorno original da API privada do Instagram.

---

## 🚀 Inicialização

1. Instale as dependências: `npm install`
2. Inicie o servidor: `npm run dev`
3. Acesse `http://localhost:3000` no seu navegador e inicie as extrações!
