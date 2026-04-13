from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import requests
from datetime import datetime, timedelta

# Inicialização do Flask
app = Flask(__name__)
CORS(app)  # Habilita CORS para toda a aplicação

# Token do Facebook - definido como variável de ambiente ou diretamente no código
FACEBOOK_TOKEN = os.environ.get('FACEBOOK_TOKEN', 'EAAS6y59i6xgBPzMKUH7ZCSX2XBEpQ67yGnMslchZA4Hs0laOxtNqcRFr30RcLdaKtsdpFqzKONrKZADZBez9PE3fu8PzVZCSTvHJ5HWJVGzewjZC73WnWZCxqXnTBSHlCs0bGjZADXVD6GoiMsuOy9KWCS6u5rAVux5RvNxXleJFzqQt0IzzxoKkirJnblwi')

# Configuração da URL base da API do Facebook
FB_API_VERSION = 'v19.0'  # Usar a versão mais recente da API
FB_API_BASE_URL = f'https://graph.facebook.com/{FB_API_VERSION}'

# Rota raiz para teste
@app.route('/')
def home():
    return "API do Facebook funcionando!"

# Rota para a API do Facebook
@app.route('/api/facebook', methods=['POST'])
def facebook_api():
    try:
        # Obter dados da requisição
        data = request.json
        action = data.get('action')
        
        # Verificar qual ação foi solicitada
        if action == 'getAdAccounts':
            return get_ad_accounts()
        elif action == 'getCampaigns':
            account_id = data.get('accountId')
            return get_campaigns(account_id)
        elif action == 'getAds':
            campaign_id = data.get('campaignId')
            return get_ads(campaign_id)
        elif action == 'getMetrics':
            account_id = data.get('accountId')
            campaign_id = data.get('campaignId')
            ad_id = data.get('adId')
            start_date = data.get('startDate')
            end_date = data.get('endDate')
            
            # Validação das datas
            if not validate_date_format(start_date) or not validate_date_format(end_date):
                return jsonify({
                    'success': False, 
                    'error': '(#100) Must be a date representation in the format YYYY-MM-DD'
                })
                
            # Obter métricas reais da API do Facebook
            return get_metrics(account_id, campaign_id, ad_id, start_date, end_date)
        else:
            return jsonify({'success': False, 'error': 'Ação desconhecida'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Função para validar o formato de data YYYY-MM-DD
def validate_date_format(date_str):
    """Valida se a string está no formato YYYY-MM-DD"""
    if not date_str:
        return False
    
    try:
        # Verificar se está no formato YYYY-MM-DD
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

# Função para obter contas de anúncio
def get_ad_accounts():
    try:
        # URL para obter contas de anúncio
        url = f"{FB_API_BASE_URL}/me/adaccounts"
        
        # Parâmetros da requisição
        params = {
            'access_token': FACEBOOK_TOKEN,
            'fields': 'id,name,account_id,account_status'
        }
        
        # Fazer a requisição para a API do Facebook
        response = requests.get(url, params=params)
        response_data = response.json()
        
        # Verificar se há erros na resposta
        if 'error' in response_data:
            return jsonify({
                'success': False,
                'error': response_data['error']['message']
            })
        
        # Formatar os dados para o formato esperado pelo frontend
        accounts = []
        for account in response_data.get('data', []):
            accounts.append({
                'id': account['id'],
                'name': account['name'],
                'accountId': account['id'],
                'status': account.get('account_status', 1)
            })
        
        return jsonify({'success': True, 'data': accounts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Função para obter campanhas
def get_campaigns(account_id):
    try:
        # URL para obter campanhas da conta
        url = f"{FB_API_BASE_URL}/{account_id}/campaigns"
        
        # Parâmetros da requisição
        params = {
            'access_token': FACEBOOK_TOKEN,
            'fields': 'id,name,status,objective',
            'limit': 100
        }
        
        # Fazer a requisição para a API do Facebook
        response = requests.get(url, params=params)
        response_data = response.json()
        
        # Verificar se há erros na resposta
        if 'error' in response_data:
            return jsonify({
                'success': False,
                'error': response_data['error']['message']
            })
        
        # Retornar os dados das campanhas
        return jsonify({'success': True, 'data': response_data.get('data', [])})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Função para obter anúncios
def get_ads(campaign_id):
    try:
        # URL para obter anúncios da campanha
        url = f"{FB_API_BASE_URL}/{campaign_id}/ads"
        
        # Parâmetros da requisição
        params = {
            'access_token': FACEBOOK_TOKEN,
            'fields': 'id,name,status,adset_id',
            'limit': 100
        }
        
        # Fazer a requisição para a API do Facebook
        response = requests.get(url, params=params)
        response_data = response.json()
        
        # Verificar se há erros na resposta
        if 'error' in response_data:
            return jsonify({
                'success': False,
                'error': response_data['error']['message']
            })
        
        # Retornar os dados dos anúncios
        return jsonify({'success': True, 'data': response_data.get('data', [])})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Função para obter métricas
def get_metrics(account_id, campaign_id=None, ad_id=None, start_date=None, end_date=None):
    try:
        # Determinar o nível de granularidade e o ID a ser usado
        if ad_id:
            level = 'ad'
            object_id = ad_id
        elif campaign_id:
            level = 'campaign'
            object_id = campaign_id
        else:
            level = 'account'
            object_id = account_id
        
        # URL para obter as insights
        url = f"{FB_API_BASE_URL}/{object_id}/insights"
        
        # Métricas a serem solicitadas
        metrics = [
            'impressions',
            'reach',
            'spend',
            'clicks',
            'cpm',
            'ctr',
            'conversions',
            'objective',
            'campaign_name',
            'campaign_id',
            'actions'  # Incluir actions para obter as ações de conversão, incluindo mensagens
        ]
        
        # Parâmetros da requisição
        params = {
            'access_token': FACEBOOK_TOKEN,
            'fields': ','.join(metrics),
            'time_range': json.dumps({
                'since': start_date,
                'until': end_date
            }),
            'level': level,
            'limit': 1000
        }
        
        # Fazer a requisição para a API do Facebook
        response = requests.get(url, params=params)
        insights_data = response.json()
        
        # Verificar se há erros na resposta
        if 'error' in insights_data:
            return jsonify({
                'success': False,
                'error': insights_data['error']['message']
            })
        
        # Processar os dados no formato esperado pelo frontend
        campaigns = []
        
        # Se for nível de campanha ou anúncio específico
        if level == 'campaign' or level == 'ad':
            # Obter detalhes adicionais (nome) da campanha
            campaign_name = ""
            if level == 'campaign':
                campaign_details_url = f"{FB_API_BASE_URL}/{campaign_id}"
                campaign_params = {'access_token': FACEBOOK_TOKEN, 'fields': 'name'}
                campaign_response = requests.get(campaign_details_url, params=campaign_params)
                campaign_data = campaign_response.json()
                campaign_name = campaign_data.get('name', '')
            elif level == 'ad':
                ad_details_url = f"{FB_API_BASE_URL}/{ad_id}"
                ad_params = {'access_token': FACEBOOK_TOKEN, 'fields': 'campaign{name}'}
                ad_response = requests.get(ad_details_url, params=ad_params)
                ad_data = ad_response.json()
                campaign_name = ad_data.get('campaign', {}).get('name', '')
            
            # Processar os insights
            for insight in insights_data.get('data', []):
                # Inicializar contagem de mensagens iniciadas
                messages_started = 0
                
                # Buscar as mensagens iniciadas nas actions se disponíveis
                if 'actions' in insight:
                    # Buscar conversas iniciadas nas ações
                    for action in insight['actions']:
                        # Verificar diferentes tipos de ações relacionadas a mensagens
                        action_type = action.get('action_type', '')
                        
                        if action_type == 'onsite_conversion.messaging_conversation_started_7d':
                            messages_started = int(action.get('value', 0))
                            break
                        elif action_type == 'onsite_conversion.messaging_conversation_started_1d':
                            messages_started = int(action.get('value', 0))
                            break
                        elif action_type == 'onsite_conversion.messaging_conversation_started':
                            messages_started = int(action.get('value', 0))
                            break
                        elif action_type == 'messaging_conversation_started':
                            messages_started = int(action.get('value', 0))
                            break
                
                campaigns.append({
                    'id': insight.get('campaign_id', campaign_id or ad_id),
                    'name': insight.get('campaign_name', campaign_name),
                    'amountSpent': float(insight.get('spend', 0)),
                    'messages': messages_started,  # Usar o valor encontrado
                    'reach': int(insight.get('reach', 0)),
                    'impressions': int(insight.get('impressions', 0)),
                    'cpm': float(insight.get('cpm', 0)),
                    'uniqueClicks': int(insight.get('clicks', 0)),
                    'uniqueCtr': float(insight.get('ctr', 0)) * 100  # Converter para porcentagem
                })

        else:
            # Para nível de conta, buscar insights por campanha
            campaigns_url = f"{FB_API_BASE_URL}/{account_id}/campaigns"
            campaigns_params = {
                'access_token': FACEBOOK_TOKEN,
                'fields': 'id,name',
                'limit': 100
            }
            campaigns_response = requests.get(campaigns_url, params=campaigns_params)
            campaigns_data = campaigns_response.json()
            
            # Para cada campanha, buscar insights
            for campaign in campaigns_data.get('data', []):
                campaign_insights_url = f"{FB_API_BASE_URL}/{campaign['id']}/insights"
                campaign_insights_params = {
                    'access_token': FACEBOOK_TOKEN,
                    'fields': ','.join(metrics),
                    'time_range': json.dumps({
                        'since': start_date,
                        'until': end_date
                    }),
                    'level': 'campaign'
                }
                campaign_insights_response = requests.get(campaign_insights_url, params=campaign_insights_params)
                campaign_insights_data = campaign_insights_response.json()
                
                # Se houver insights para a campanha, adicionar aos resultados
                for insight in campaign_insights_data.get('data', []):
                    # Inicializar contagem de mensagens
                    messages_started = 0
                    
                    # Buscar mensagens iniciadas nas ações (se existirem)
                    if 'actions' in insight:
                        for action in insight['actions']:
                            # Verificar diferentes tipos de ações relacionadas a mensagens
                            action_type = action.get('action_type', '')
                            
                            if action_type == 'onsite_conversion.messaging_conversation_started_7d':
                                messages_started = int(action.get('value', 0))
                                break
                            elif action_type == 'onsite_conversion.messaging_conversation_started_1d':
                                messages_started = int(action.get('value', 0))
                                break
                            elif action_type == 'onsite_conversion.messaging_conversation_started':
                                messages_started = int(action.get('value', 0))
                                break
                            elif action_type == 'messaging_conversation_started':
                                messages_started = int(action.get('value', 0))
                                break
                    
                    campaigns.append({
                        'id': campaign['id'],
                        'name': campaign['name'],
                        'amountSpent': float(insight.get('spend', 0)),
                        'messages': messages_started,  # Usar o valor encontrado
                        'reach': int(insight.get('reach', 0)),
                        'impressions': int(insight.get('impressions', 0)),
                        'cpm': float(insight.get('cpm', 0)),
                        'uniqueClicks': int(insight.get('clicks', 0)),
                        'uniqueCtr': float(insight.get('ctr', 0)) * 100
                    })
        
        # Calcular totais
        totals = {
            'amountSpent': sum(c['amountSpent'] for c in campaigns),
            'messages': sum(c['messages'] for c in campaigns),
            'reach': sum(c['reach'] for c in campaigns),
            'impressions': sum(c['impressions'] for c in campaigns),
            'uniqueClicks': sum(c['uniqueClicks'] for c in campaigns),
            'cpm': 0
        }
        
        # Calcular CPM para totais
        if totals['impressions'] > 0:
            totals['cpm'] = (totals['amountSpent'] / totals['impressions']) * 1000
        
        # Formatar o resultado no formato esperado pelo frontend
        result = {
            'campaigns': campaigns,
            'totals': totals,
            'startDate': start_date,
            'endDate': end_date
        }
        
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
