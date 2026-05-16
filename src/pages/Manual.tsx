import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, Book, Shield, Wallet, Receipt, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MANUAL_TOPICS = [
  {
    category: "Acesso e Segurança",
    icon: Shield,
    items: [
      {
        q: "Como alterar minha senha?",
        a: "Acesse o menu 'Suporte' > 'Configurações da Conta' > 'Alterar Senha'. Insira sua senha atual e a nova senha desejada. Caso tenha esquecido, entre em contato via WhatsApp com a equipe Makel para um reset seguro."
      },
      {
        q: "O que é o usuário interno (Master/Admin)?",
        a: "São usuários da equipe Makel Contabilidade. Eles podem selecionar clientes no topo da tela para atuar em nome do cliente, carregar documentos e responder chamados."
      }
    ]
  },
  {
    category: "Financeiro & Cobranças",
    icon: Wallet,
    items: [
      {
        q: "Como adicionar uma nova receita ou despesa?",
        a: "Use o botão flutuante (+) no canto inferior direito da tela. Selecione 'Nova Receita' ou 'Nova Despesa'. Preencha os detalhes (valor, data, categoria) e clique em Salvar."
      },
      {
        q: "Como conciliar transações?",
        a: "A conciliação é feita visualmente na aba Financeiro. No futuro, adicionaremos importação de OFX. Transações excluídas realizam um estorno automático para não comprometer a auditoria contábil."
      },
      {
        q: "Como emitir uma cobrança?",
        a: "Vá na aba 'Cobranças' ou use o botão (+). Preencha os dados do cliente, vencimento e valor. Depois de gerada, você pode compartilhar o link via WhatsApp ou PDF."
      }
    ]
  },
  {
    category: "Contabilidade e Documentos",
    icon: FileText,
    items: [
      {
        q: "Como envio os documentos mensais para a contabilidade?",
        a: "Atualmente, o portal é feito para que a Contabilidade ENTREGUE documentos para você. Caso precise enviar documentos, você pode anexar em chamados na aba Suporte."
      },
      {
        q: "Onde encontro minha guia do Simples (DAS)?",
        a: "Na aba 'Contabilidade', clique no card 'DAS / Simples Nacional'. Uma lista aparecerá com as guias mensais, competência e botão de download."
      },
      {
        q: "Como acesso meu Contrato Social?",
        a: "Vá na aba lateral 'Documentos Jurídicos'. Lá você encontrará contratos, certidões e alvarás disponibilizados pela nossa equipe."
      }
    ]
  },
  {
    category: "Suporte e Dúvidas",
    icon: Book,
    items: [
      {
        q: "Como abro um chamado (ticket)?",
        a: "Vá no menu 'Suporte' e clique em 'Abrir Chamado'. Preencha o assunto e os detalhes. Você pode acompanhar pelo botão 'Minhas Solicitações'."
      },
      {
        q: "Posso falar diretamente pelo WhatsApp?",
        a: "Sim! Em várias partes do sistema existe o botão para iniciar conversa. Ou no menu Suporte, clique em 'Falar com a Makel'."
      }
    ]
  }
];

export default function Manual() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredTopics = MANUAL_TOPICS.map(topic => {
    const term = search.toLowerCase();
    const filteredItems = topic.items.filter(item => 
      item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term)
    );
    return { ...topic, items: filteredItems };
  }).filter(topic => topic.items.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in">
      {/* Header */}
      <header className="flex flex-col gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="self-start p-2 bg-card border border-border rounded-lg hover:bg-background transition-colors text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Central de Ajuda</h1>
          <p className="text-muted-foreground">Encontre respostas para as principais dúvidas sobre a plataforma Makel.</p>
        </div>
      </header>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input 
          type="text" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="O que você está procurando? Ex: senha, notas, DAS..." 
          className="w-full bg-card border border-border text-white text-base rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary shadow-sm"
        />
      </div>

      {/* Content */}
      <div className="space-y-8">
        {filteredTopics.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">Não achamos nada para "{search}". Tente usar palavras-chave mais genéricas.</p>
          </div>
        ) : (
          filteredTopics.map((topic, tIdx) => (
            <div key={tIdx} className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <topic.icon className="w-6 h-6 text-primary" />
                {topic.category}
              </h2>
              <div className="space-y-3">
                {topic.items.map((item, iIdx) => {
                  const id = `${tIdx}-${iIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <Card key={iIdx} className="border border-border overflow-hidden bg-card">
                      <button 
                        onClick={() => toggleAccordion(id)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-background/50 transition-colors"
                      >
                        <span className="font-semibold text-white">{item.q}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-border/50 text-muted-foreground leading-relaxed animate-in slide-in-from-top-2">
                          {item.a}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Contact */}
      <div className="mt-12 bg-primary/10 border border-primary/20 rounded-xl p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Ainda não encontrou o que precisa?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">Nossa equipe está pronta para te ajudar com as dúvidas sobre a plataforma e seu fechamento contábil.</p>
        <button 
          onClick={() => window.open('https://wa.me/5511999999999?text=Preciso%20de%20ajuda', '_blank')}
          className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors inline-block"
        >
          Falar com a Makel
        </button>
      </div>

    </div>
  );
}
