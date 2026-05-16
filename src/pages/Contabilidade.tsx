import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Landmark, FileSpreadsheet, FolderOpen, Users, 
  ArrowLeftRight, Smartphone, ChevronRight, X, Loader2, UploadCloud, AlertTriangle, Building2, BookOpen, Trash2, Eye, Download, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const DOC_TYPES = [
  "Contrato Social",
  "Alteração Contratual",
  "Cartão CNPJ",
  "Procuração",
  "Certificado Digital",
  "Inscrição Estadual",
  "Inscrição Municipal",
  "Licenças",
  "Certidões",
  "Outros"
];

const getFileTypeFromName = (name: string) => {
  const lowername = name.toLowerCase();
  if (lowername.endsWith(".xml")) return "text/xml";
  if (lowername.endsWith(".txt")) return "text/plain";
  if (lowername.endsWith(".png")) return "image/png";
  if (lowername.endsWith(".jpg") || lowername.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

export default function Contabilidade() {
  const { appUser, selectedClientId, selectedClientData, user } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const navigate = useNavigate();

  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;

  // Modal specific states
  const [competence, setCompetence] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxType, setTaxType] = useState("DAS");
  const [file, setFile] = useState<File | null>(null);
  const [partner, setPartner] = useState("");
  const [inss, setInss] = useState("");
  const [irrf, setIrrf] = useState("");
  const [docType, setDocType] = useState("NF-e");
  const [observation, setObservation] = useState("");

  // Juridicos state
  const [jurDocs, setJurDocs] = useState<any[]>([]);
  const [jurType, setJurType] = useState("Contrato Social");
  const [jurObservation, setJurObservation] = useState("");

  const [contaDocs, setContaDocs] = useState<any[]>([]);

  useEffect(() => {
    if (activeModal === 'juridicos' && targetUid) {
      loadJurDocs();
    } else if (activeModal && activeModal !== 'comunicacao' && targetUid) {
      loadContaDocs();
    }
  }, [activeModal, targetUid]);

  const loadJurDocs = () => {
    const all = JSON.parse(localStorage.getItem("@Makel:juridicos") || "[]");
    setJurDocs(all.filter((d: any) => d.userId === targetUid).sort((a: any, b: any) => b.createdAt - a.createdAt));
  };

  const loadContaDocs = () => {
    const all = JSON.parse(localStorage.getItem("@Makel:contabilidade") || "[]");
    setContaDocs(all.filter((d: any) => d.userId === targetUid && d.category === activeModal).sort((a: any, b: any) => b.createdAt - a.createdAt));
  };

  const renderClientDocs = (emptyIcon: any, emptyText: string, hideCloseButton?: boolean) => {
    const Icon = emptyIcon;
    return (
      <div className="space-y-4">
        {contaDocs.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {contaDocs.map(doc => (
              <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-background border border-border rounded-xl gap-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Icon className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-white truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</p>
                     <p className="text-[10px] sm:text-xs text-muted-foreground">
                       {doc.competence && <span>Comp: {doc.competence}</span>}
                       {doc.dueDate && <span> • Venc: {doc.dueDate}</span>}
                       {doc.taxType && <span> • Trib: {doc.taxType}</span>}
                       {doc.docType && <span> • Tipo: {doc.docType}</span>}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                   <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Visualizar" onClick={() => setPreviewDoc(doc)}>
                     <Eye className="w-4 h-4" />
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Baixar" onClick={() => handleDownload(doc)}>
                     <Download className="w-4 h-4"/>
                   </Button>
                   {isInternal && (
                     <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-transparent hover:bg-destructive/10" onClick={() => {
                        if(confirm('Excluir este documento?')) {
                          const all = JSON.parse(localStorage.getItem("@Makel:contabilidade") || "[]");
                          const filtered = all.filter((d: any) => d.id !== doc.id);
                          localStorage.setItem("@Makel:contabilidade", JSON.stringify(filtered));
                          loadContaDocs();
                        }
                     }}>
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   )}
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border rounded-xl text-center">
            <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}
        {!hideCloseButton && <Button variant="outline" className="w-full" onClick={handleCloseModal}>Fechar</Button>}
      </div>
    );
  };

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setFile(null);
    setCompetence("");
    setAmount("");
    setDueDate("");
    setPartner("");
    setInss("");
    setIrrf("");
    setObservation("");
  };

  const handleDownload = (doc: any) => {
    const url = doc.fileData || doc.fileUrl;
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || "documento";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showToast("Arquivo não encontrado", "error");
    }
  };

  const handleGenericSubmit = async (e: React.FormEvent, msg: string) => {
    e.preventDefault();
    if (isInternal && !selectedClientId) {
      showToast("Selecione um cliente primeiro.", "error");
      return;
    }
    setLoading(true);
    try {
      let fileData = null;
      let fileType = "application/pdf";
      if (file) {
        fileData = await readFileAsDataURL(file);
        fileType = file.type || getFileTypeFromName(file.name);
      }

      await new Promise(r => setTimeout(r, 600));
      
      if (activeModal && activeModal !== 'comunicacao' && targetUid) {
        const all = JSON.parse(localStorage.getItem("@Makel:contabilidade") || "[]");
        all.push({
          id: `cont_${Date.now()}`,
          userId: targetUid,
          category: activeModal,
          competence,
          dueDate,
          taxType,
          partner,
          docType,
          observation,
          fileName: file ? file.name : "documento_enviado.pdf",
          size: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
          fileData,
          fileType,
          createdAt: Date.now()
        });
        localStorage.setItem("@Makel:contabilidade", JSON.stringify(all));
        loadContaDocs();
      }

      showToast(msg);
      handleCloseModal();
    } catch {
      showToast("Erro ao processar solicitação.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isInternal && !selectedClientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 border border-border shadow-lg">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Nenhum cliente selecionado</h2>
        <p className="text-muted-foreground max-w-md">
          Selecione um cliente no cabeçalho superior para administrar os dados de contabilidade, impostos e documentos.
        </p>
      </div>
    );
  }

  const clientName = isInternal ? selectedClientData?.companyName || selectedClientData?.name : appUser?.companyName || appUser?.name;

  const MENU_GROUPS = [
    {
      title: "CONTABILIDADE E TRIBUTOS",
      items: [
        { icon: FileText, label: "DAS / Simples Nacional", desc: "Guias de pagamento", action: () => setActiveModal("das") },
        { icon: Landmark, label: "Impostos e Tributos", desc: "Gestão fiscal completa", action: () => setActiveModal("impostos") },
        { icon: FileSpreadsheet, label: "Pró-labore", desc: "Recibos de retiradas", action: () => setActiveModal("prolabore") },
        { icon: FolderOpen, label: "Documentos Fiscais", desc: "NFs, NFS-e, Certidões", action: () => setActiveModal("docs") },
        { icon: Users, label: "Comunicação com Contador", desc: "Mensagens e solicitações", action: () => setActiveModal("comunicacao") },
        { icon: BookOpen, label: "Documentos Jurídicos", desc: "Contratos e Certidões", action: () => setActiveModal("juridicos") },
      ]
    },
    {
      title: "CONCILIAÇÃO E BANCO",
      items: [
        { icon: ArrowLeftRight, label: "Conciliação Bancária", desc: "Importar OFX, categorizar", action: () => setActiveModal("ofx") },
        { icon: Smartphone, label: "Open Finance", desc: "Conectar contas bancárias", action: () => setActiveModal("openfinance") },
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Contabilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de {clientName}</p>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {MENU_GROUPS.map((group, i) => (
          <div key={i}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((item, j) => (
                <button 
                  key={j}
                  onClick={item.action} 
                  className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 transition-colors text-left border border-border rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-background text-primary border border-primary/20">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: DAS / Simples */}
      {activeModal === "das" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5"/> DAS / Simples Nacional</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isInternal ? renderClientDocs(FileText, "Nenhum documento disponível para este período.") : (
              <div className="flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-2 pb-4">
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4">Enviar Nova Guia</h3>
                  <form onSubmit={(e) => handleGenericSubmit(e, "Guia do DAS salva com sucesso!")} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Competência</label>
                        <input type="month" required value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Vencimento</label>
                        <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Valor (R$)</label>
                      <input type="text" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Upload da Guia (PDF)</label>
                      <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar e Publicar"}
                      </Button>
                    </div>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
                  {renderClientDocs(FileText, "Nenhum documento enviado ainda.", true)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: IMPOSTOS */}
      {activeModal === "impostos" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Landmark className="w-5 h-5"/> Impostos e Tributos</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isInternal ? renderClientDocs(Landmark, "Nenhum documento disponível para este período.") : (
              <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4">Novo Imposto</h3>
                  <form id="form-impostos" onSubmit={(e) => handleGenericSubmit(e, "Imposto salvo com sucesso!")} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Tipo de Tributo</label>
                      <select value={taxType} onChange={e => setTaxType(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm">
                        <option value="DARF">DARF</option>
                        <option value="INSS">INSS</option>
                        <option value="FGTS">FGTS</option>
                        <option value="ISS">ISS</option>
                        <option value="ICMS">ICMS</option>
                        <option value="IRRF">IRRF</option>
                        <option value="PIS">PIS</option>
                        <option value="COFINS">COFINS</option>
                        <option value="CSLL">CSLL</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Competência</label>
                        <input type="month" required value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Vencimento</label>
                        <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Valor do Imposto (R$)</label>
                      <input type="text" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Upload (PDF)</label>
                      <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Observação Opcional</label>
                      <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm h-16 resize-none" placeholder="Ex: Multa ref. a atraso"></textarea>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Imposto"}
                      </Button>
                    </div>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
                  {renderClientDocs(Landmark, "Nenhum documento enviado ainda.", true)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: PRO LABORE */}
      {activeModal === "prolabore" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileSpreadsheet className="w-5 h-5"/> Recibo Pró-Labore</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isInternal ? renderClientDocs(FileSpreadsheet, "Nenhum documento disponível para este período.") : (
              <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4">Novo Pró-Labore</h3>
                  <form onSubmit={(e) => handleGenericSubmit(e, "Pró-labore publicado com sucesso!")} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Sócio / Diretor</label>
                        <input type="text" required value={partner} onChange={e => setPartner(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" placeholder="Nome" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Competência</label>
                        <input type="month" required value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Valor (Bruto)</label>
                        <input type="text" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">INSS</label>
                        <input type="text" value={inss} onChange={e => setInss(e.target.value)} placeholder="0,00" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">IRRF</label>
                        <input type="text" value={irrf} onChange={e => setIrrf(e.target.value)} placeholder="0,00" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <label className="text-sm font-medium text-white">Upload do Recibo (PDF)</label>
                      <input type="file" required accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Pró-labore"}
                      </Button>
                    </div>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
                  {renderClientDocs(FileSpreadsheet, "Nenhum documento enviado ainda.", true)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: DOCUMENTOS FISCAIS */}
      {activeModal === "docs" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><FolderOpen className="w-5 h-5"/> {isInternal ? "Envio de Documentos" : "Documentos Fiscais"}</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isInternal ? renderClientDocs(FolderOpen, "Nenhum documento disponível para este período.") : (
              <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4">Novo Documento</h3>
                  <form onSubmit={(e) => handleGenericSubmit(e, "Documentos enviados com sucesso!")} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Tipo</label>
                        <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <option value="NF-e">NF-e</option>
                          <option value="NFS-e">NFS-e</option>
                          <option value="NFC-e">NFC-e</option>
                          <option value="CTe">CTe</option>
                          <option value="XML">Arquivos XML</option>
                          <option value="Certidão">Certidões</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Competência</label>
                        <input type="month" required value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Arquivos (Selecione vários)</label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-card border-border transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-white">Clique para enviar</span> ou arraste</p>
                            <p className="text-xs text-muted-foreground">PDF, XML, ZIP, JPG</p>
                          </div>
                          <input type="file" multiple onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Observação Opcional</label>
                      <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm h-16 resize-none" placeholder="Detalhes dos arquivos..."></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar Arquivos"}
                      </Button>
                    </div>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
                  {renderClientDocs(FolderOpen, "Nenhum documento enviado ainda.", true)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: CONCILIAÇÃO BANCÁRIA */}
      {activeModal === "ofx" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><ArrowLeftRight className="w-5 h-5"/> Enviar Extratos (OFX/PDF)</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2 max-h-[85vh]">
              <div className="bg-background border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-4">Novo Envio</h3>
                <form onSubmit={(e) => handleGenericSubmit(e, "Extratos enviados para conciliação bancária.")} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Banco / Conta</label>
                      <input type="text" required value={partner} onChange={e => setPartner(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" placeholder="Ex: Itaú, Nubank" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Competência/Mês</label>
                      <input type="month" required value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-medium text-white flex justify-between">Arquivo OFX <span className="text-warning text-xs">Recomendado</span></label>
                    <input type="file" accept=".ofx" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-medium text-white">Extrato PDF (Opcional)</label>
                    <input type="file" accept=".pdf" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-card file:text-white hover:file:bg-card/80 border border-border" />
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar Extratos"}
                    </Button>
                  </div>
                </form>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
                {renderClientDocs(ArrowLeftRight, "Nenhum documento enviado ainda.", true)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: OPEN FINANCE */}
      {activeModal === "openfinance" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-card border border-border rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Open Finance</h2>
            <p className="text-sm text-muted-foreground mb-6">Conexão bancária direta.</p>
            
            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-left mb-6">
              <div className="flex gap-3 text-warning">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm">A integração automática de Open Finance ainda não está ativa ou não foi configurada para sua conta. Entre em contato com o suporte para habilitar esta função.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Voltar</Button>
              <Button type="button" className="flex-1" onClick={() => { handleCloseModal(); navigate("/suporte"); }}>Ir para Suporte</Button>
            </div>
          </Card>
        </div>
      )}
      {/* MODAL: COMUNICACAO */}
      {activeModal === "comunicacao" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5"/> Falar com Contador</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => handleGenericSubmit(e, "Mensagem enviada com sucesso!")} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Mensagem</label>
                <textarea required value={observation} onChange={e => setObservation(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white h-24 resize-none" placeholder="Escreva sua solicitação ou dúvida..."></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Prioridade</label>
                <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-white">Anexo (Opcional)</label>
                <input type="file" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: DOCUMENTOS JURIDICOS */}
      {activeModal === "juridicos" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl bg-card border border-border shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5"/> Documentos Jurídicos
              </h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Form de Upload para Administrador/Colaborador */}
              {isInternal && (
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4">Adicionar Documento</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!targetUid) return;
                    setLoading(true);
                    try {
                      const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
                      const userFile = fileInput?.files?.[0];
                      let fileData = null;
                      let fileType = "application/pdf";
                      let fileName = "documento.pdf";
                      if (userFile) {
                        fileData = await readFileAsDataURL(userFile);
                        fileType = userFile.type || getFileTypeFromName(userFile.name);
                        fileName = userFile.name;
                      }

                      await new Promise(r => setTimeout(r, 600)); // fake delay
                      const all = JSON.parse(localStorage.getItem("@Makel:juridicos") || "[]");
                      all.push({
                        id: "docj_" + Date.now(),
                        userId: targetUid,
                        type: jurType,
                        competence: competence || "N/A",
                        observation: jurObservation,
                        fileName,
                        size: userFile ? `${(userFile.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
                        fileData,
                        fileType,
                        createdAt: Date.now()
                      });
                      localStorage.setItem("@Makel:juridicos", JSON.stringify(all));
                      setJurObservation("");
                      setCompetence("");
                      if (fileInput) fileInput.value = '';
                      loadJurDocs();
                      showToast("Documento publicado com sucesso!");
                    } catch {
                      showToast("Erro ao publicar documento", "error");
                    } finally {
                      setLoading(false);
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Tipo</label>
                        <select value={jurType} onChange={e => setJurType(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm">
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white">Competência (Opcional)</label>
                        <input type="month" value={competence} onChange={e => setCompetence(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Arquivo PDF / Imagem</label>
                      <input type="file" required className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white">Observação</label>
                      <textarea value={jurObservation} onChange={e => setJurObservation(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm h-16 resize-none" placeholder="Ex: Substitui versão anterior..."></textarea>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar Documento"}
                    </Button>
                  </form>
                </div>
              )}

              {/* Lista de Documentos */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Documentos Disponíveis</h3>
                {jurDocs.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-border rounded-xl">
                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhum documento jurídico disponível para este período.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jurDocs.map(doc => (
                      <Card key={doc.id} className="p-4 flex flex-col justify-between border-l-4 border-l-primary group bg-background">
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <FileText className="w-4 h-4" />
                            </div>
                            {isInternal && (
                              <button onClick={() => {
                                if(confirm("Deseja realmente excluir?")) {
                                  let all = JSON.parse(localStorage.getItem("@Makel:juridicos") || "[]");
                                  all = all.filter((d: any) => d.id !== doc.id);
                                  localStorage.setItem("@Makel:juridicos", JSON.stringify(all));
                                  loadJurDocs();
                                  showToast("Documento excluído.");
                                }
                              }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <h4 className="font-bold text-white leading-tight text-sm">{doc.type}</h4>
                          <p className="text-xs text-muted-foreground mt-1">Ref: {doc.competence}</p>
                          {doc.observation && (
                            <p className="text-xs text-white/80 mt-2 bg-card p-2 rounded-lg border border-border line-clamp-2">
                              "{doc.observation}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div className="text-[10px] text-muted-foreground font-mono uppercase leading-tight">
                            {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                            <div className={`mt-1 inline-block px-1.5 py-0.5 rounded-sm font-bold ${doc.status === 'inativo' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                              {doc.status === 'inativo' ? 'Inativo' : 'Ativo'}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setPreviewDoc(doc)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-card border border-border hover:bg-background transition-colors text-white" title="Visualizar">
                              <Eye className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDownload(doc)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors text-white" title="Baixar">
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border shrink-0">
              <Button variant="outline" className="w-full" onClick={handleCloseModal}>Fechar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: PREVIEW DOCUMENT */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-4xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border bg-background shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 truncate pr-4">
                <FileText className="w-5 h-5"/> {previewDoc.fileName || "Visualização Documento"}
              </h2>
              <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-card flex flex-col justify-center items-center">
              {previewDoc.fileData ? (
                previewDoc.fileType?.includes('image') ? (
                  <img src={previewDoc.fileData} className="max-w-full max-h-full object-contain rounded-lg shadow-lg mx-auto" alt="Preview"/>
                ) : (
                  <iframe src={previewDoc.fileData} className="w-full h-full min-h-[60vh] bg-white rounded-lg border-0 shadow-lg" title="Preview" />
                )
              ) : (
                <div className="text-center p-12">
                  <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">O arquivo selecionado não possui dados ou é uma versão antiga sem suporte a visualização.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border bg-background shrink-0 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                Fechar
              </Button>
              <Button onClick={() => handleDownload(previewDoc)}>
                <Download className="w-4 h-4 mr-2" /> Baixar Documento
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
