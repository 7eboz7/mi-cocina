const DEFAULT_GROUPS = [
["🥚 Huevos, lácteos y quesos",["Huevos criollos","Queso Chitagá","Queso salado","Queso tajado","Cuajada","Yogur griego","Yogures para la merienda de Zoe"]],
["🍗 Carnes, aves y pescados",["Pechuga de pollo","Carne molida","Pescado","Atún en agua"]],
["🥬 Verduras y hortalizas",["Brócoli","Coliflor","Remolacha","Habichuela","Rábanos","Pepino","Zucchini","Zanahoria","Repollo morado","Lechuga","Tomate","Pimentón verde","Pimentón rojo","Cebolla larga","Cebolla cabezona","Ajo","Cilantro"]],
["🍎 Frutas",["Piña","Guanábana","Patilla","Arándanos","Pera criolla","Mandarina","Ciruelas","Kiwi","Granadilla","Uva verde","Manzanas","Mango azúcar","Melón","Fresas","Papaya","Durazno","Feijoa","Banano","Banano bocadillo"]],
["🥔 Tubérculos y plátanos",["Plátano verde","Plátano maduro","Papa amarilla","Papa negra","Yuca"]],
["🌾 Granos, cereales y legumbres",["Arroz","Lentejas","Arveja desgranada","Maíz tierno desgranado","Avena"]],
["🫙 Despensa y complementos",["Miel de abejas","Limones","Arepas","Tortillas para pizza"]]
];
const DB_NAME="MiCocinaDB", STORE="state", KEY="main";
let db, state, scene="inventory", filter="all", expanded=new Set(), manageExpanded=new Set(), manageOpen=false, confirmReset=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function readState(){return new Promise((resolve,reject)=>{const req=db.transaction(STORE,"readonly").objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function save(){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(state,KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function initialState(){return {version:1,products:DEFAULT_GROUPS.flatMap(([category,names])=>names.map(name=>({name,category}))),status:{},shopping:[],bought:[]};}
function groups(){return [...new Set(state.products.map(p=>p.category))];}
function count(s){return state.products.filter(p=>state.status[p.name]===s).length;}
function reviewed(){return count("buy")+count("low")+count("have");}
function filteredProducts(){return state.products.filter(p=>filter==="all"||(filter==="unset"?!state.status[p.name]:state.status[p.name]===filter));}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200);}
function setScene(next){scene=next;render();}
function render(){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.scene===scene));
  $("inventoryScene").hidden=scene!=="inventory";$("shoppingScene").hidden=scene!=="shopping";
  renderInventory();renderShopping();renderManage();renderFooter();
  $("copyShopping").disabled=state.shopping.length===0;
  $("footnote").textContent=`Lista maestra: ${state.products.length} productos · Datos guardados en este dispositivo`;
}
function renderInventory(){
  $("countBuy").textContent=count("buy");$("countLow").textContent=count("low");$("countHave").textContent=count("have");
  $("reviewProgress").textContent=`${reviewed()}/${state.products.length}`;
  $("progressBar").style.width=(state.products.length?reviewed()/state.products.length*100:0)+"%";
  const options=[["all",`Mostrar todos (${state.products.length})`],["buy",`Agotados (${count("buy")})`],["low",`Por terminar (${count("low")})`],["have",`Disponibles (${count("have")})`],["unset",`Sin revisar (${state.products.length-reviewed()})`]];
  $("filterSelect").innerHTML=options.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");$("filterSelect").value=filter;
  const list=filteredProducts(), cats=groups().filter(c=>list.some(p=>p.category===c));
  $("visibleCount").textContent=`${list.length} productos visibles`;
  $("inventoryCategories").innerHTML=cats.length?cats.map(cat=>{
    const items=list.filter(p=>p.category===cat),open=expanded.has(cat);
    return `<div class="category"><button class="category-head" data-expand="${esc(cat)}"><span>${esc(cat)}</span><span class="category-count">${items.length}</span><span>${open?"⌃":"⌄"}</span></button>${open?items.map(p=>`<div class="product-row"><div class="product-name">${esc(p.name)}</div><div class="segments">${[["buy","Agotado"],["low","Poco"],["have","Hay"],["unset","—"]].map(([v,l])=>`<button class="${(state.status[p.name]||"unset")===v?`selected ${v}`:""}" data-status="${v}" data-product="${esc(p.name)}">${l}</button>`).join("")}</div></div>`).join(""):""}</div>`;
  }).join(""):`<div class="empty">No hay productos que coincidan con este filtro.</div>`;
}
function renderShopping(){
  const list=state.shopping,done=list.filter(p=>state.bought.includes(p.name)).length;
  if(!list.length){$("shoppingContent").innerHTML=`<div class="empty">🛒<br><b>No hay una lista de compras generada.</b><br><br>Vuelve al inventario y genera tu checklist.<br><br><button class="primary" id="goInventory">Ir al inventario</button></div>`;return;}
  let html=`<div class="progress-label"><small>Productos comprados</small><b>${done}/${list.length}</b></div><div class="progress"><span style="width:${done/list.length*100}%"></span></div><p class="hint">🟡 Queda poco: producto que aún tienes, pero necesitas reponer.</p>`;
  groups().forEach(cat=>{const items=list.filter(p=>p.category===cat);if(!items.length)return;html+=`<div class="category"><b>${esc(cat)}</b>${items.map(p=>`<div class="product-row"><label style="display:flex;gap:9px;align-items:center"><input style="width:auto" type="checkbox" data-bought="${esc(p.name)}" ${state.bought.includes(p.name)?"checked":""}><span>${esc(p.name)}</span></label>${state.status[p.name]==="low"?'<p class="hint compact">🟡 Queda poco · Reposición preventiva</p>':""}</div>`).join("")}</div>`;});
  html+=`<div class="progress-label"><small>Pendientes: ${list.length-done}</small><button class="link-btn" id="uncheckAll">Desmarcar todo</button></div>`;
  $("shoppingContent").innerHTML=html;
}
function renderManage(){
  $("manageToggle").setAttribute("aria-expanded",String(manageOpen));$("manageChevron").textContent=manageOpen?"⌃":"⌄";$("manageContent").hidden=!manageOpen;
  $("newCategory").innerHTML=groups().map(c=>`<option>${esc(c)}</option>`).join("");
  $("masterCount").textContent=`${state.products.length} productos`;
  $("masterCategories").innerHTML=groups().map(cat=>{const items=state.products.filter(p=>p.category===cat),open=manageExpanded.has(cat);return `<div class="master-category"><button class="master-head" data-master-expand="${esc(cat)}"><span>${esc(cat)}</span><span>${items.length}　${open?"⌃":"⌄"}</span></button>${open?items.map(p=>`<div class="master-product"><span>${esc(p.name)}</span><button class="trash" aria-label="Eliminar ${esc(p.name)}" data-delete="${esc(p.name)}">▤</button></div>`).join(""):""}</div>`;}).join("");
}
function renderFooter(){
  const f=$("footerActions");f.className="footer-actions";
  if(scene==="inventory"){
    f.innerHTML=`<button id="generate">🛒 Generar checklist de compras</button>${confirmReset?`<div class="empty">¿Reiniciar la revisión semanal? Se borrarán los estados y la lista de compras en curso. La lista maestra se conservará.<div class="two-buttons"><button class="danger-btn" id="confirmReset">Sí, reiniciar</button><button class="secondary" id="cancelReset">Cancelar</button></div></div>`:`<button class="secondary" id="askReset">↻ Reiniciar inventario semanal</button>`}`;
  }else f.innerHTML=`<button id="finish" ${state.shopping.length?"":"disabled"}>✓ Compra finalizada · Actualizar inventario</button><button class="secondary" id="backInventory">▤ Volver al inventario semanal</button>`;
}
async function changeStatus(name,value){if(value==="unset")delete state.status[name];else state.status[name]=value;await save();render();}
function copyInventory(){const list=filteredProducts(),cats=groups().filter(c=>list.some(p=>p.category===c));const labels={buy:"🔴 AGOTADO",low:"🟡 POCO",have:"🟢 DISPONIBLE"};const text=`INVENTARIO ACTUAL — FILTRO: ${filter.toUpperCase()}\n\n`+(cats.map(c=>c+"\n"+list.filter(p=>p.category===c).map(p=>(labels[state.status[p.name]]||"⚪ SIN REVISAR")+" — "+p.name).join("\n")).join("\n\n")||"Sin productos para este filtro.");navigator.clipboard.writeText(text).then(()=>toast("Inventario visible copiado")).catch(()=>toast("No se pudo copiar; usa Descargar copia."));}
function copyShopping(){const text="LISTA DE COMPRAS\n\n"+groups().map(c=>c+"\n"+state.shopping.filter(p=>p.category===c).map(p=>(state.bought.includes(p.name)?"☑ COMPRADO — ":"☐ PENDIENTE — ")+p.name+(state.status[p.name]==="low"?" (REPOSICIÓN: QUEDA POCO)":"")).join("\n")).filter(x=>!x.endsWith("\n")).join("\n\n");navigator.clipboard.writeText(text).then(()=>toast("Lista de compras copiada")).catch(()=>toast("No se pudo copiar; usa Descargar copia."));}
function downloadBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="mi-cocina-respaldo.json";a.click();URL.revokeObjectURL(url);toast("Copia de seguridad descargada");}
document.addEventListener("click",async e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.scene){setScene(b.dataset.scene);return;}
 if(b.dataset.expand){expanded.has(b.dataset.expand)?expanded.delete(b.dataset.expand):expanded.add(b.dataset.expand);renderInventory();return;}
 if(b.dataset.status){await changeStatus(b.dataset.product,b.dataset.status);return;}
 if(b.dataset.masterExpand){manageExpanded.has(b.dataset.masterExpand)?manageExpanded.delete(b.dataset.masterExpand):manageExpanded.add(b.dataset.masterExpand);renderManage();return;}
 if(b.dataset.delete){const name=b.dataset.delete;if(!confirm(`¿Dar de baja "${name}" de la lista maestra?`))return;state.products=state.products.filter(p=>p.name!==name);delete state.status[name];state.shopping=state.shopping.filter(p=>p.name!==name);state.bought=state.bought.filter(n=>n!==name);await save();render();toast("Producto eliminado");return;}
 switch(b.id){
  case "expandAll":filteredProducts().forEach(p=>expanded.add(p.category));renderInventory();break;
  case "collapseAll":expanded.clear();renderInventory();break;
  case "manageToggle":manageOpen=!manageOpen;renderManage();break;
  case "addProduct":{const name=$("newProduct").value.trim(),category=$("newCategory").value;if(!name)return;if(state.products.some(p=>p.name.toLowerCase()===name.toLowerCase())){toast("Ese producto ya existe");return;}state.products.push({name,category});$("newProduct").value="";await save();render();toast("Producto agregado");break;}
  case "generate":state.shopping=state.products.filter(p=>["buy","low"].includes(state.status[p.name]));state.bought=[];scene="shopping";confirmReset=false;await save();render();break;
  case "askReset":confirmReset=true;renderFooter();break;
  case "cancelReset":confirmReset=false;renderFooter();break;
  case "confirmReset":state.status={};state.shopping=[];state.bought=[];filter="all";expanded.clear();confirmReset=false;scene="inventory";await save();render();toast("Inventario semanal reiniciado");break;
  case "finish":state.shopping.forEach(p=>{if(state.bought.includes(p.name))state.status[p.name]="have";});scene="inventory";filter="all";await save();render();toast("Inventario actualizado");break;
  case "backInventory":setScene("inventory");break;
  case "goInventory":setScene("inventory");break;
  case "uncheckAll":state.bought=[];await save();renderShopping();break;
 }
});
$("filterSelect").addEventListener("change",e=>{filter=e.target.value;expanded.clear();renderInventory();});
$("copyInventory").addEventListener("click",copyInventory);$("copyShopping").addEventListener("click",copyShopping);
$("exportBackup").addEventListener("click",downloadBackup);
$("importBackup").addEventListener("click",()=>$("backupFile").click());
$("backupFile").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.products)||!data.status||!Array.isArray(data.shopping)||!Array.isArray(data.bought))throw Error();if(!confirm("Restaurar esta copia reemplazará los datos actuales. ¿Continuar?"))return;state=data;await save();render();toast("Copia restaurada correctamente");}catch{alert("El archivo no es una copia válida de Mi Cocina.");}e.target.value="";});
document.addEventListener("change",async e=>{if(e.target.matches("[data-bought]")){const n=e.target.dataset.bought;if(e.target.checked){if(!state.bought.includes(n))state.bought.push(n);}else state.bought=state.bought.filter(x=>x!==n);await save();renderShopping();}});
(async()=>{try{db=await openDB();state=await readState()||initialState();if(!state.products)state=initialState();await save();render();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});}catch(err){console.error(err);alert("No fue posible abrir el almacenamiento local. Revisa que el navegador permita IndexedDB.");}})();
