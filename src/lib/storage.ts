export const getTransactions = (userId: string) => {
  const all = JSON.parse(localStorage.getItem("@Makel:transactions") || "[]");
  return all.filter((t: any) => t.userId === userId && !t.deleted).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = (userId: string, data: any) => {
  const all = JSON.parse(localStorage.getItem("@Makel:transactions") || "[]");
  const newTx = { ...data, id: "tx_" + Date.now(), userId, deleted: false };
  all.push(newTx);
  localStorage.setItem("@Makel:transactions", JSON.stringify(all));
  
  // Registrar em auditoria
  const audit = JSON.parse(localStorage.getItem("@Makel:auditoria") || "[]");
  audit.push({
    id: "aud_" + Date.now(),
    action: "Criação de Lançamento",
    details: `Lançamento ${newTx.id} criado com valor ${newTx.amount}.`,
    user: userId,
    date: new Date().toISOString()
  });
  localStorage.setItem("@Makel:auditoria", JSON.stringify(audit));
  
  return newTx;
};

export const deleteTransaction = (id: string, userId: string) => {
  let all = JSON.parse(localStorage.getItem("@Makel:transactions") || "[]");
  all = all.map((t: any) => (t.id === id) ? { ...t, deleted: true, status: "canceled" } : t);
  localStorage.setItem("@Makel:transactions", JSON.stringify(all));

  // Registrar em auditoria (estorno)
  const audit = JSON.parse(localStorage.getItem("@Makel:auditoria") || "[]");
  audit.push({
    id: "aud_" + Date.now(),
    action: "Exclusão/Estorno Contábil",
    details: `Lançamento ${id} excluído logicamente. O vínculo contábil foi estornado.`,
    user: userId,
    date: new Date().toISOString()
  });
  localStorage.setItem("@Makel:auditoria", JSON.stringify(audit));
};

export const getBillings = (userId: string) => {
  const all = JSON.parse(localStorage.getItem("@Makel:billings") || "[]");
  return all.filter((b: any) => b.userId === userId).sort((a: any, b: any) => b.createdAt - a.createdAt);
};

export const addBilling = (userId: string, data: any) => {
  const all = JSON.parse(localStorage.getItem("@Makel:billings") || "[]");
  const newBill = { ...data, id: "bill_" + Date.now(), userId };
  all.push(newBill);
  localStorage.setItem("@Makel:billings", JSON.stringify(all));
  return newBill;
};

export const deleteBilling = (id: string, userId: string) => {
  let all = JSON.parse(localStorage.getItem("@Makel:billings") || "[]");
  all = all.filter((b: any) => b.id !== id || b.userId !== userId);
  localStorage.setItem("@Makel:billings", JSON.stringify(all));
};
