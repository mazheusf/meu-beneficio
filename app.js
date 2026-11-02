const KEY='meu-beneficio-v2';
const MONTHLY={VR:1227.16,VA:967.00};
const initial={vr:1223.50,va:1223.50,transactions:[],lastMonthlyCredit:''};
let state=load();let modalMode='expense';
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function load(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...initial}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function render(){
 const total=state.vr+state.va;$('totalBalance').textContent=money(total);$('vrBalance').textContent=money(state.vr);$('vaBalance').textContent=money(state.va);
 const vp=total?state.vr/total*100:50,ap=100-vp;$('vrBar').style.width=vp+'%';$('vaBar').style.width=ap+'%';$('vrPercent').textContent=Math.round(vp)+'%';$('vaPercent').textContent=Math.round(ap)+'%';
 const rows=state.transactions.slice(0,4);$('historyList').innerHTML=rows.length?rows.map(rowHTML).join(''):'<div class="empty-state">Suas movimentações aparecerão aqui.</div>';
 $('fullHistoryList').innerHTML=state.transactions.length?state.transactions.map(rowHTML).join(''):'<div class="empty-state">Nenhuma movimentação registrada.</div>';
}
function rowHTML(t){const credit=t.kind==='credit';return `<div class="history-row"><div class="history-left"><div class="history-icon">${credit?'＋':(t.type==='VR'?'↗':'⌂')}</div><div style="min-width:0"><div class="history-name">${escapeHTML(t.description||(credit?'Crédito recebido':'Compra'))} · ${t.type}</div><div class="history-meta">${new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')} · ${credit?'Crédito':'Despesa'}</div></div></div><div class="history-value ${credit?'positive':'negative'}">${credit?'+':'−'} ${money(t.amount)}</div></div>`}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function openTransaction(mode){modalMode=mode;$('modalEyebrow').textContent=mode==='expense'?'REGISTRAR DESPESA':'NOVO CRÉDITO';$('modalTitle').textContent=mode==='expense'?'Adicionar gasto':'Adicionar crédito';$('saveTransaction').textContent=mode==='expense'?'Salvar gasto':'Adicionar crédito';$('amount').value='';$('description').value='';$('formError').textContent='';$('transactionDate').value=today();$('transactionDialog').showModal()}
function parseAmount(v){return Number(String(v).trim().replace(/\./g,'').replace(',','.'))}
$('expenseBtn').onclick=()=>openTransaction('expense');$('creditBtn').onclick=()=>openTransaction('credit');
$('transactionForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const type=$('benefitType').value,amount=parseAmount($('amount').value),description=$('description').value.trim(),date=$('transactionDate').value;if(!Number.isFinite(amount)||amount<=0){$('formError').textContent='Informe um valor válido.';return}if(!date){$('formError').textContent='Informe a data.';return}const balanceKey=type.toLowerCase();if(modalMode==='expense'&&amount>state[balanceKey]){$('formError').textContent=`Saldo insuficiente no ${type}. Disponível: ${money(state[balanceKey])}`;return}const balanceKey=type.toLowerCase();state[balanceKey]=Math.round((state[balanceKey]+(modalMode==='credit'?amount:-amount))*100)/100;state.transactions.unshift({id:crypto.randomUUID?.()||String(Date.now()),kind:modalMode,type,amount,description,date});save();$('transactionDialog').close()});
$('settingsBtn').onclick=$('settingsNav').onclick=()=>$('settingsDialog').showModal();
$('monthlyCreditBtn').onclick=()=>{const month=today().slice(0,7);if(state.lastMonthlyCredit===month){alert('O crédito mensal deste mês já foi registrado.');return}if(!confirm(`Registrar os créditos mensais?\nVR: ${money(MONTHLY.VR)}\nVA: ${money(MONTHLY.VA)}\nTotal: ${money(MONTHLY.VR+MONTHLY.VA)}`))return;const date=today();for(const type of ['VR','VA']){const amount=MONTHLY[type];const balanceKey=type.toLowerCase();state[balanceKey]=Math.round((state[balanceKey]+amount)*100)/100;state.transactions.unshift({id:String(Date.now())+type,kind:'credit',type,amount,description:'Crédito mensal',date})}state.lastMonthlyCredit=month;save();$('settingsDialog').close()};
$('backupBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`meu-beneficio-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)};
$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(typeof data.vr!=='number'||typeof data.va!=='number'||!Array.isArray(data.transactions))throw Error();if(!confirm('Restaurar este backup? Os dados atuais serão substituídos.'))return;state={...initial,...data};save();$('settingsDialog').close();alert('Backup restaurado!')}catch{alert('Arquivo de backup inválido.')}e.target.value=''};
$('resetBtn').onclick=()=>{if(confirm('Tem certeza? Isso apagará os saldos e todo o histórico deste dispositivo.')){state={...initial,transactions:[]};save();$('settingsDialog').close()}};
$('allHistoryBtn').onclick=$('historyNav').onclick=()=>$('historyDialog').showModal();$('closeHistory').onclick=()=>$('historyDialog').close();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();