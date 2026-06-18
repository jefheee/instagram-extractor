# InstaVault 📸⚡

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Instaloader](https://img.shields.io/badge/Instaloader-Motor_de_Extração-green?style=for-the-badge)

**InstaVault** é um wrapper avançado em Next.js para extração em lote e gerenciamento granular de mídias do Instagram, utilizando todo o poder do motor CLI [instaloader](https://github.com/instaloader/instaloader) (Python). Projetado com uma interface limpa e reativa, o projeto permite realizar o bypass de CORS e orquestrar extrações complexas diretamente de um painel de controle local.

> **Créditos do Motor de Extração:** O core de extração e a engenharia reversa do Instagram são providos inteiramente pela equipe do [Instaloader](https://instaloader.github.io/).

---

## 🏗️ Arquitetura e Stack

A aplicação opera através de uma arquitetura híbrida de controle de processos:
- **Frontend / Backend**: Construído em **Next.js 15** com TypeScript e Tailwind CSS v4, apresentando um layout **Bento Grid** compacto em uma única tela (100% viewport, sem scroll externo).
- **Motor de Execução**: O backend (`app/api/download/route.ts`) não realiza scraping nativo no Node. Ele funciona como um controlador lógico que invoca o interpretador Python do SO host via `child_process.spawn`. 
- **Comunicação em Tempo Real**: A rota estabelece uma conexão via **Server-Sent Events (SSE)**, repassando o fluxo de dados do `stdout` e `stderr` do Python diretamente para o **Terminal View** do frontend.

---

## 🛠️ Pré-requisitos

Para que o InstaVault funcione corretamente, o sistema host deve possuir:

1. **Node.js** (v18+ recomendado)
2. **Python 3** (v3.8+ recomendado)
3. **Instaloader**: O pacote Python deve ser instalado globalmente ou no ambiente ativo.
   ```bash
   pip install instaloader
   ```

---

## 🔐 Guia de Autenticação (Crucial)

O Instaloader gerencia a criptografia e o armazenamento da sua sessão (cookies) nativamente no seu Sistema Operacional. **Nenhuma senha trafega pela UI do InstaVault**. 

Para conseguir extrair posts salvos, conteúdos de perfis privados ou contornar bloqueios severos (Erro 400 Bad Request / Redirect to Login), **é obrigatório gerar a sessão local via terminal antes de usar a aplicação**:

1. Abra o CMD, PowerShell ou Terminal do seu sistema.
2. Execute o comando de login, substituindo pelo seu usuário do Instagram:
   ```bash
   python -m instaloader --login=SEU_USUARIO_AQUI
   ```
3. Digite sua senha quando solicitado (ela não aparecerá na tela) e resolva os desafios de 2FA se necessário.
4. O Instaloader salvará o cookie criptografado na sua máquina e o InstaVault poderá utilizá-lo livremente.

---

## ⚙️ Variáveis de Ambiente

Na raiz do projeto, crie um arquivo `.env.local` e informe **apenas** o usuário com o qual você gerou a sessão no passo anterior. Isso fará com que o backend anexe automaticamente a flag `--login` nos comandos de extração.

```env
# .env.local
IG_USERNAME=seu_usuario_aqui
```

*(Se você deseja rodar de forma anônima para perfis públicos, basta ativar o toggle "Modo Anônimo" diretamente na interface, ou deixar este arquivo em branco).*

---

## 🚀 Como Executar

Com os pré-requisitos instalados e a sessão do Python gerada, inicie a interface:

1. Instale as dependências do Node:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000` no seu navegador.

---

## ✨ Funcionalidades Principais

- **Terminal View Inteligente:** Acompanhe o progresso da extração linha por linha dentro da UI com auto-scroll infinito (SSE).
- **Controle Granular de Mídias:** Toggles visuais rápidos para ignorar vídeos, metadados (`.json`), legendas (`.txt`) ou avatares de perfil.
- **Modos Desacoplados de Operação:** Extraia o perfil inteiro, posts individuais via Shortcode (reconhecimento automático de URL), Stories ativos ou sua coleção completa de Posts Salvos.
- **Filtros de Engajamento Avançados:** Exija um mínimo de curtidas e comentários ou limite a quantidade de posts baixados (`--count`).
- **Alvos Especiais:** Suporte nativo à sintaxe `:tagged` (marcações) e `:saved` (salvos) repassada nativamente para a CLI.
- **Prevenção de Limites (Rate Limit):** Utilize a Atualização Rápida (`--fast-update`) para interromper o processo imediatamente assim que o motor encontrar uma mídia já salva na pasta local.
