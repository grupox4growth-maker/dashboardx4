# Facebook Ads Dashboard

Dashboard para visualização de métricas do Facebook Ads.

## Estrutura do Projeto

- `frontend/`: Código do dashboard
- `backend/`: Servidor Python para conexão com a API do Facebook

## Configuração

### Frontend
1. Abra o arquivo `frontend/facebook-api.js`
2. Atualize a URL do servidor na constante `API_URL`

### Backend
1. Instale as dependências: `pip install -r requirements.txt`
2. Configure a variável de ambiente `FACEBOOK_TOKEN` com seu token de acesso
3. Inicie o servidor: `python app.py`

## Uso

1. Acesse o dashboard através do arquivo `index.html`
2. Faça login com suas credenciais
3. Selecione a conta de anúncio, campanha e período
4. Visualize as métricas