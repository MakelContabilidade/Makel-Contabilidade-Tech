import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Download, TrendingUp, TrendingDown, Wallet, PieChart, AlertCircle, Loader2, FileText, Search, Filter, Building2, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/lib/storage";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const REPORT_TYPES = [
  "Financeiro Geral",
  "Receitas",
  "Despesas",
  "Impostos",
  "Balanço Patrimonial",
  "DRE",
  "Pró-labore",
  "Atendimentos"
];

export default function Relatorios() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [impostos, setImpostos] = useState<any[]>([]);
  const [prolabore, setProlabore] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { appUser, user, selectedClientId, selectedClientData } = useAuth();
  
  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;
  const companyName = isInternal ? selectedClientData?.companyName : appUser?.companyName;

  useEffect(() => {
    if (!targetUid) {
      setTransactions([]);
      setImpostos([]);
      setProlabore([]);
      setChamados([]);
      setLoading(false);
      return;
    }
    
    const loadData = () => {
      try {
        setTransactions(getTransactions(targetUid) || []);
        
        const allImpostos = JSON.parse(localStorage.getItem("@Makel:impostos") || "[]");
        setImpostos(allImpostos.filter((i: any) => i.userId === targetUid) || []);
        
        const allProlabore = JSON.parse(localStorage.getItem("@Makel:prolabore") || "[]");
        setProlabore(allProlabore.filter((p: any) => p.userId === targetUid) || []);
        
        const allChamados = JSON.parse(localStorage.getItem("@Makel:chamados") || "[]");
        setChamados(allChamados.filter((c: any) => c.userId === targetUid) || []);
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    window.addEventListener("transactionsUpdated", loadData);
    return () => window.removeEventListener("transactionsUpdated", loadData);
  }, [targetUid]);

  // Aggregate stats
  const totalIn = transactions.filter(tx => tx.type === 'in').reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  const totalOut = transactions.filter(tx => tx.type === 'out').reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  const result = totalIn - totalOut;
  const margin = totalIn > 0 ? ((totalIn - totalOut) / totalIn) * 100 : 0;

  // Chart data mock mixed with actual data simple reduction by month
  const chartData = [
    { name: '1', rev: totalIn * 0.2, exp: totalOut * 0.1 },
    { name: '2', rev: totalIn * 0.3, exp: totalOut * 0.2 },
    { name: '3', rev: totalIn * 0.5, exp: totalOut * 0.7 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isInternal && !selectedClientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 border border-border shadow-lg">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Selecione um cliente para visualizar os relatórios.</h2>
        <p className="text-muted-foreground max-w-md">
          Selecione um cliente no cabeçalho superior para acessar os relatórios.
        </p>
      </div>
    );
  }

  // Define data based on report type
  let reportData: any[] = [];
  let tableColumns: string[] = [];

  const q = searchTerm.toLowerCase();

  switch (reportType) {
    case "Financeiro Geral":
    case "Receitas":
    case "Despesas":
      let txs = transactions;
      if (reportType === "Receitas") txs = transactions.filter(tx => tx.type === 'in');
      if (reportType === "Despesas") txs = transactions.filter(tx => tx.type === 'out');
      
      reportData = txs.filter(tx => {
        const desc = tx.title || tx.description || "";
        const cat = tx.category || "";
        return desc.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      }).map(tx => ({
        "Data": new Date(tx.date || tx.createdAt).toLocaleDateString('pt-BR'),
        "Descrição": tx.title || tx.description || "-",
        "Categoria": tx.category || "Geral",
        "Tipo": tx.type === 'in' ? 'Receita' : 'Despesa',
        "Valor": Number(tx.amount) || 0,
        "Status": tx.status === 'paid' ? 'Pago' : tx.status === 'canceled' ? 'Cancelado' : 'Pendente',
        "documentInfo": tx.documentInfo || null
      }));
      tableColumns = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)", "Status", "Documento"];
      break;
    case "Impostos":
      reportData = impostos.filter(i => {
        const imp = i.imposto || "";
        return imp.toLowerCase().includes(q);
      }).map(i => ({
        "Competência": i.competence || "-",
        "Imposto": i.imposto || "-",
        "Vencimento": i.dueDate ? new Date(i.dueDate).toLocaleDateString('pt-BR') : "-",
        "Valor": Number(i.amount) || 0,
        "Status": i.status === 'pago' ? 'Pago' : 'Aberto'
      }));
      tableColumns = ["Competência", "Imposto", "Vencimento", "Valor (R$)", "Status"];
      break;
    case "Pró-labore":
      reportData = prolabore.filter(p => {
        const comp = p.competence || "";
        return comp.toLowerCase().includes(q);
      }).map(p => ({
        "Competência": p.competence || "-",
        "Valor Bruto": Number(p.amount) || 0,
        "INSS": Number(p.inss) || 0,
        "IRRF": Number(p.irrf) || 0,
        "Líquido": Number(p.netAmount) || 0
      }));
      tableColumns = ["Competência", "Valor Bruto (R$)", "INSS (R$)", "IRRF (R$)", "Líquido (R$)"];
      break;
    case "Atendimentos":
      reportData = chamados.filter(c => {
        const proto = c.protocol || "";
        const subj = c.subject || "";
        return proto.toLowerCase().includes(q) || subj.toLowerCase().includes(q);
      }).map(c => ({
        "Protocolo": c.protocol || "-",
        "Assunto": c.subject || "-",
        "Abertura": c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : "-",
        "Status": c.status || "-",
        "Prioridade": c.priority || "-"
      }));
      tableColumns = ["Protocolo", "Assunto", "Abertura", "Status", "Prioridade"];
      break;
    default:
      reportData = [];
      tableColumns = [];
  }

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    try {
      await new Promise(r => setTimeout(r, 800)); // fake delay for UI UX

      const exportData = reportData.length > 0 ? reportData : [{ "Aviso": "Sem registros para exportar" }];

      if (format === 'Excel') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Format the currency column if exists
        const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:G1");
        // We look for cells that contain numbers to format as currency if they represent value
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({c: C, r: R});
            const cell = worksheet[cellAddress];
            if (cell && typeof cell.v === 'number') {
              // Basic heuristic for currency columns
              const headerAddress = XLSX.utils.encode_cell({c: C, r: 0});
              const header = worksheet[headerAddress]?.v as string;
              if (header && (header.includes('Valor') || header === 'INSS' || header === 'IRRF' || header === 'Líquido')) {
                cell.z = '"R$"#,##0.00';
              }
            }
          }
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
        XLSX.writeFile(workbook, `Relatorio_${reportType.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`);
      } else if (format === 'PDF') {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Makel Contabilidade - ${reportType}`, 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Cliente: ${companyName || 'Empresa'}`, 14, 28);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

        if (reportData.length === 0) {
          doc.text("Nenhum dado encontrado para o período/filtro selecionado.", 14, 45);
        } else {
          const body = reportData.map(d => {
            return Object.keys(d).map(k => {
              const val = d[k];
              return (typeof val === 'number' && (k.includes('Valor') || k === 'INSS' || k === 'IRRF' || k === 'Líquido' || k.includes('(R$)'))) 
                     ? formatCurrency(val) 
                     : String(val);
            });
          });

          autoTable(doc, {
            startY: 40,
            head: [Object.keys(reportData[0]).map(k => k.includes('Valor') && !k.includes('(R$)') ? `${k} (R$)` : k)],
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [49, 50, 62] }
          });
        }

        doc.save(`Relatorio_${reportType.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar o relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-[100px]">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Central de Relatórios</h1>
          <p className="text-sm text-muted-foreground">{companyName || 'Empresa'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="h-9 font-semibold gap-2 border border-border hover:border-primary" onClick={() => handleExport("Excel")}>
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="secondary" size="sm" className="h-9 font-semibold gap-2 border border-border hover:border-destructive text-white" onClick={() => handleExport("PDF")}>
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Relatório</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          >
            {REPORT_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
          </select>
        </div>
        
        <div className="flex-1 space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Período Contábil</label>
          <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary">
            <option>Mês Atual</option>
            <option>Mês Anterior</option>
            <option>Últimos 3 meses</option>
            <option>Este Ano</option>
            <option>Personalizado...</option>
          </select>
        </div>

        <div className="flex-[2] space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar termo..." 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <div className="flex items-end">
          <Button variant="secondary" className="h-[38px] w-full md:w-auto px-4 bg-background border border-border">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {isExporting ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-white font-semibold text-lg">Gerando Relatório...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default KPIs for 'Financeiro Geral' and 'Fluxo de Caixa' */}
          {(reportType === "Financeiro Geral" || reportType === "Receitas" || reportType === "Despesas") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-success text-xl">{formatCurrency(totalIn)}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Faturamento</p>
                </div>
              </Card>
              <Card className="p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center mb-3">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-destructive text-xl">{formatCurrency(totalOut)}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Despesas</p>
                </div>
              </Card>
              <Card className="p-4 flex flex-col justify-between hidden md:flex">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center mb-3">
                  <Wallet className="w-4 h-4 text-info" />
                </div>
                <div>
                  <h3 className="font-bold text-info text-xl">{formatCurrency(result)}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Lucro Líquido</p>
                </div>
              </Card>
              <Card className="p-4 flex flex-col justify-between hidden md:flex">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                  <PieChart className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h3 className="font-bold text-warning text-xl">{margin.toFixed(1)}%</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Margem</p>
                </div>
              </Card>
            </div>
          )}

          {/* Table View */}
          {(reportType === "Balanço Patrimonial" || reportType === "DRE") ? (
            <Card className="p-12 border border-dashed border-border flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Relatório de {reportType}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">Este é um relatório contábil complexo gerado pelo contador no final do exercício. Solicite a disponibilização na aba Suporte.</p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-muted-foreground" />
                  Lista: {reportType}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {reportData.length === 0 ? (
                  <div className="text-center p-12">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhum dado encontrado para este relatório com os filtros atuais.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground bg-background/50">
                        {tableColumns.map(col => (
                          <th key={col} className="p-3 font-medium whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                          {Object.keys(row).map((k, j) => {
                            if (k === 'documentInfo') {
                               return (
                                  <td key={j} className="p-3 whitespace-nowrap text-white">
                                    {row[k] ? (
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <button className="text-xs text-primary hover:underline border rounded px-2 py-0.5" onClick={() => window.alert('Visualizando anexo...')}>Visualizar</button>
                                        <button className="text-xs text-primary hover:underline border rounded px-2 py-0.5" onClick={() => window.alert('Baixando anexo...')}>Baixar</button>
                                        {isInternal && (
                                            <>
                                              <button className="text-xs text-warning hover:underline border rounded px-2 py-0.5" onClick={() => { document.getElementById('file-subst')?.click(); }}>Subst.</button>
                                              <button className="text-xs text-destructive hover:underline border rounded px-2 py-0.5" onClick={() => window.alert('Excluir anexo?')}>Excluir</button>
                                              <input type="file" id="file-subst" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xml,.xlsx" onChange={(e) => {
                                                  if(e.target.files && e.target.files.length > 0) window.alert('Anexo substituído!');
                                              }} />
                                            </>
                                        )}
                                      </div>
                                    ) : (
                                       <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                               );
                            }
                            const val = row[k];
                            // format currency fields
                            const isCurrency = typeof val === 'number' && (k.includes('Valor') || k === 'INSS' || k === 'IRRF' || k === 'Líquido');
                            return (
                              <td key={j} className="p-3 whitespace-nowrap text-white">
                                {isCurrency ? formatCurrency(val) : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {/* Alert */}
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-warning mb-1">Atenção Fiscal</h4>
              <p className="text-xs text-warning/80 leading-relaxed">
                Os relatórios gerados nesta plataforma refletem os lançamentos realizados até o momento. 
                Para validade legal contábil, certifique-se de que todos os comprovantes estão devidamente anexados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

