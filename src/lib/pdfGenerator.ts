import { ServiceOrder, Quote, Client, Company, Carrier } from '@/types';
import { format, parseISO } from 'date-fns';

// Utility function to generate printable HTML and trigger print
function printDocument(content: string, title: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup bloqueado. Por favor, permita popups para imprimir.');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4;
          color: #000;
          padding: 20px;
        }
        .page { 
          max-width: 210mm; 
          margin: 0 auto; 
          background: white;
        }
        .header { 
          text-align: center; 
          border: 2px solid #000; 
          padding: 15px;
          margin-bottom: 10px;
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header .numero {
          font-size: 18px;
          font-weight: bold;
        }
        .section { 
          border: 1px solid #000; 
          margin-bottom: 10px;
        }
        .section-title { 
          background: #000; 
          color: white; 
          padding: 5px 10px;
          font-weight: bold;
          font-size: 11px;
        }
        .section-content { 
          padding: 10px;
        }
        .row { 
          display: flex; 
          margin-bottom: 8px;
        }
        .row:last-child { margin-bottom: 0; }
        .field { 
          flex: 1;
        }
        .field-label { 
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 2px;
        }
        .field-value { 
          font-size: 12px;
          min-height: 18px;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2px;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
        .checkbox-row { 
          display: flex; 
          gap: 20px;
          align-items: center;
        }
        .checkbox { 
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .checkbox-box { 
          width: 16px; 
          height: 16px; 
          border: 1px solid #000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { 
          border: 1px solid #ccc; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #f0f0f0;
          font-size: 11px;
        }
        .total-row { 
          font-weight: bold;
          background: #f5f5f5;
        }
        .brand-logo {
          display: block;
          height: 40px;
          max-width: 220px;
          object-fit: contain;
          margin: 0 auto 10px auto;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        @media print {
          body { padding: 0; }
          .page { max-width: none; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Generate OS PDF
export function generateOSPDF(
  os: ServiceOrder,
  client: Client | undefined,
  company?: Company | null,
  carrier?: Carrier,
) {
  const content = `
    <div class="page">
      <div class="header">
        <img class="brand-logo" src="/rocha-etiquetas.webp" alt="Rocha Etiquetas" />
        <h1>ORDEM DE SERVIÇO</h1>
        <div class="numero">Nº ${os.numero_os}</div>
      </div>

      <div class="section">
        <div class="section-title">INFO. DO PEDIDO</div>
        <div class="section-content">
          <div class="grid-2">
            <div class="field">
              <div class="field-label">Empresa</div>
              <div class="field-value">${company?.company_name || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Vendedor</div>
              <div class="field-value">${os.vendedor_nome || ''}</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div class="field">
              <div class="field-label">Cliente</div>
              <div class="field-value">${client?.trade_name || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Transportadora</div>
              <div class="field-value">${carrier?.nome || ''}</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div class="field">
              <div class="field-label">Data de Entrada do Pedido</div>
              <div class="field-value">${os.data_entrada ? format(parseISO(os.data_entrada), 'dd/MM/yyyy') : ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Prazo do Pedido (Saída Até)</div>
              <div class="field-value">${os.prazo_saida_ate ? format(parseISO(os.prazo_saida_ate), 'dd/MM/yyyy') : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">PEDIDO</div>
        <div class="section-content">
          <div class="field" style="margin-bottom: 10px;">
            <div class="field-label">Nome do Pedido</div>
            <div class="field-value">${os.nome_pedido || ''}</div>
          </div>
          <div class="grid-2">
            <div class="field">
              <div class="field-label">Jogo/Faca 01</div>
              <div class="field-value">${os.faca_01 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Jogo/Faca 02</div>
              <div class="field-value">${os.faca_02 || ''}</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div class="field">
              <div class="field-label">Medida do Material</div>
              <div class="field-value">${os.medida_material_mm || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Material</div>
              <div class="field-value">${os.material || ''}</div>
            </div>
          </div>
          <div class="field" style="margin-top: 10px;">
            <div class="field-label">Data de Saída do Pedido</div>
            <div class="field-value">${os.data_saida ? format(parseISO(os.data_saida), 'dd/MM/yyyy') : ''}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CORES / PANTONES</div>
        <div class="section-content">
          <div class="grid-3">
            <div class="field">
              <div class="field-label">PANT 01</div>
              <div class="field-value">${os.pantone_01 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">PANT 02</div>
              <div class="field-value">${os.pantone_02 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">PANT 03</div>
              <div class="field-value">${os.pantone_03 || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">ANILOX</div>
        <div class="section-content">
          <div class="grid-4">
            <div class="field">
              <div class="field-label">Anilox 01</div>
              <div class="field-value">${os.anilox_01 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Anilox 02</div>
              <div class="field-value">${os.anilox_02 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Anilox 03</div>
              <div class="field-value">${os.anilox_03 || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Chapado</div>
              <div class="field-value">${os.chapado ? 'SIM' : 'NÃO'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">QUANTIDADE DO PEDIDO</div>
        <div class="section-content">
          <div class="grid-4">
            <div class="field">
              <div class="field-label">Impressão (metros)</div>
              <div class="field-value">${os.impressao_m || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Rebobinagem (metros)</div>
              <div class="field-value">${os.rebobinagem_m || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Quantidade Rolos</div>
              <div class="field-value">${os.quantidade_rolos || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Quantidade Caixa</div>
              <div class="field-value">${os.quantidade_caixa || ''}</div>
            </div>
          </div>
          ${os.etiqueta_qtd ? `
          <div class="field" style="margin-top: 10px;">
            <div class="field-label">Quantidade Etiquetas</div>
            <div class="field-value">${os.etiqueta_qtd}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">AMOSTRA</div>
        <div class="section-content">
          <div class="field-value" style="min-height: 40px;">${os.amostra || ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">UTILIZAR A CAIXA</div>
        <div class="section-content">
          <div class="checkbox-row">
            <div class="checkbox">
              <div class="checkbox-box">${os.usar_caixa === '107' ? 'X' : ''}</div>
              <span>107</span>
            </div>
            <div class="checkbox">
              <div class="checkbox-box">${os.usar_caixa === 'MX5500' ? 'X' : ''}</div>
              <span>MX5500</span>
            </div>
          </div>
        </div>
      </div>

      ${os.yield_snapshot ? `
      <div class="section">
        <div class="section-title">APROVEITAMENTO DA BOBINA</div>
        <div class="section-content">
          <div class="grid-4">
            <div class="field">
              <div class="field-label">Bobina</div>
              <div class="field-value">${os.yield_snapshot.bobina_nome}</div>
            </div>
            <div class="field">
              <div class="field-label">Pistas</div>
              <div class="field-value">${os.yield_snapshot.pistas}</div>
            </div>
            <div class="field">
              <div class="field-label">Eficiência</div>
              <div class="field-value">${os.yield_snapshot.eficiencia_percent.toFixed(1)}%</div>
            </div>
            <div class="field">
              <div class="field-label">MP Consumida</div>
              <div class="field-value">${os.yield_snapshot.metragem_bobina_com_perdas_m.toFixed(1)}m</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      ${os.observacoes_producao ? `
      <div class="section">
        <div class="section-title">OBSERVAÇÕES</div>
        <div class="section-content">
          <div class="field-value">${os.observacoes_producao}</div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} | LabelFlow Sistema de Gráfica
      </div>
    </div>
  `;

  printDocument(content, `OS ${os.numero_os}`);
}

// Generate Quote PDF
export function generateQuotePDF(
  quote: Quote,
  client: Client | undefined,
  company?: Company | null,
  carrier?: Carrier,
) {
  const itemsHTML = quote.itens.map(item => `
    <tr>
      <td>${item.descricao}</td>
      <td style="text-align: center;">${item.qtd_rolos}</td>
      <td style="text-align: center;">${item.metragem_total_m}m</td>
      <td style="text-align: right;">R$ ${item.valor_unit.toFixed(2)}</td>
      <td style="text-align: right;">R$ ${item.valor_total.toFixed(2)}</td>
    </tr>
    ${item.yield_snapshot ? `
    <tr style="background: #f9f9f9;">
      <td colspan="5" style="font-size: 10px; color: #666;">
        <strong>Aproveitamento:</strong> 
        ${item.yield_snapshot.pistas} pistas | 
        Eficiência: ${item.yield_snapshot.eficiencia_percent.toFixed(1)}% | 
        MP: ${item.yield_snapshot.metragem_bobina_com_perdas_m.toFixed(1)}m | 
        Custo MP: R$ ${item.yield_snapshot.custo_estimado.toFixed(2)}
      </td>
    </tr>
    ` : ''}
  `).join('');

  const subtotal = quote.itens.reduce((sum, item) => sum + item.valor_total, 0);
  const descontoValor = subtotal * (quote.desconto / 100);

  const content = `
    <div class="page">
      <div class="header">
        <img class="brand-logo" src="/rocha-etiquetas.webp" alt="Rocha Etiquetas" />
        <h1>ORÇAMENTO</h1>
        <div class="numero">Nº ${quote.numero}</div>
      </div>

      <div class="section">
        <div class="section-title">DADOS DO CLIENTE</div>
        <div class="section-content">
          <div class="grid-2">
            <div class="field">
              <div class="field-label">Empresa</div>
              <div class="field-value">${company?.company_name || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Cliente</div>
              <div class="field-value">${client?.trade_name || ''}</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div class="field">
              <div class="field-label">CNPJ</div>
              <div class="field-value">${client?.cnpj || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Transportadora</div>
              <div class="field-value">${carrier?.nome || ''}</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div class="field">
              <div class="field-label">Contato</div>
              <div class="field-value">${client?.name || ''} - ${client?.phone || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">${client?.email || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">DADOS DO ORÇAMENTO</div>
        <div class="section-content">
          <div class="grid-3">
            <div class="field">
              <div class="field-label">Data</div>
              <div class="field-value">${format(parseISO(quote.data), 'dd/MM/yyyy')}</div>
            </div>
            <div class="field">
              <div class="field-label">Vendedor</div>
              <div class="field-value">${quote.vendedor_nome}</div>
            </div>
            <div class="field">
              <div class="field-label">Prazo de Entrega</div>
              <div class="field-value">${quote.prazo_entrega_dias || '-'} dias</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">ITENS DO ORÇAMENTO</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th style="text-align: center; width: 80px;">Qtd Rolos</th>
                <th style="text-align: center; width: 80px;">Metragem</th>
                <th style="text-align: right; width: 100px;">Valor Unit.</th>
                <th style="text-align: right; width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
                <td style="text-align: right;">R$ ${subtotal.toFixed(2)}</td>
              </tr>
              ${quote.desconto > 0 ? `
              <tr>
                <td colspan="4" style="text-align: right;">Desconto (${quote.desconto}%):</td>
                <td style="text-align: right;">- R$ ${descontoValor.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;"><strong>TOTAL:</strong></td>
                <td style="text-align: right;"><strong>R$ ${quote.valor_final.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      ${quote.observacoes ? `
      <div class="section">
        <div class="section-title">OBSERVAÇÕES</div>
        <div class="section-content">
          <div class="field-value">${quote.observacoes}</div>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">CONDIÇÕES</div>
        <div class="section-content">
          <p>• Validade deste orçamento: 15 dias</p>
          <p>• Prazo de entrega: ${quote.prazo_entrega_dias || '-'} dias úteis após aprovação</p>
          <p>• Condição de pagamento: A combinar</p>
        </div>
      </div>

      <div class="footer">
        Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} | LabelFlow Sistema de Gráfica
      </div>
    </div>
  `;

  printDocument(content, `Orçamento ${quote.numero}`);
}
