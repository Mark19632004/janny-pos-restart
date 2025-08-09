import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, ScanLine, CreditCard, Trash2, Percent, Package, Search, FileText, Banknote, WifiOff, Plus, Minus, LogOut } from "lucide-react";
import { api } from "./api";

const currency = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
function Button({ children, className="", ...props }){ return <button className={`h-10 px-4 rounded-xl bg-[#0061FF] text-white ${className}`} {...props}>{children}</button>; }
function Card({ children, className="" }){ return <div className={`rounded-2xl bg-white border border-gray-200 shadow-sm ${className}`}>{children}</div>; }
function CardHeader({ title, subtitle, right }){ return (<div className="px-4 py-3 border-b flex items-center justify-between gap-3"><div><div className="font-semibold">{title}</div>{subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}</div>{right}</div>); }
function CardBody({ children, className="" }){ return <div className={`p-4 ${className}`}>{children}</div>; }

export default function App(){
  const [tab, setTab] = useState("ventas");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [barcode, setBarcode] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(()=>{
    const on = ()=>setOffline(false); const off = ()=>setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return ()=>{ window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  },[]);

  useEffect(()=>{ (async () => { setProducts(await api.products("")); setSales(await api.sales()); })(); },[]);
  useEffect(()=>{
    let live=true;
    (async () => { const list = await api.products(query); if(live) setResults(list); })();
    return ()=>{ live=false; };
  },[query]);

  const subtotal = useMemo(()=> cart.reduce((s,i)=>s+i.price*i.qty,0),[cart]);
  const discount = useMemo(()=> +(subtotal*(discountPct/100)).toFixed(2),[subtotal,discountPct]);
  const total = useMemo(()=> subtotal-discount,[subtotal,discount]);

  const addToCart = (p, qty=1)=> setCart(prev=>{
    const ix = prev.findIndex(i=>i.id===p.id);
    if(ix>=0){ const cp=[...prev]; cp[ix]={...cp[ix], qty:cp[ix].qty+qty}; return cp; }
    return [...prev, {...p, qty}];
  });
  const updateQty = (id, qty)=> setCart(prev=> prev.map(i=> i.id===id?{...i, qty: Math.max(1, qty||1)}:i));
  const removeItem = (id)=> setCart(prev=> prev.filter(i=>i.id!==id));
  const clearSale = ()=>{ setCart([]); setDiscountPct(0); setNotes(""); };

  async function onScan(e){ e.preventDefault(); if(!barcode.trim()) return;
    const list = await api.products(barcode.trim());
    const p = list.find(pp => pp.barcode === barcode.trim()) || list[0];
    if(p) addToCart(p,1);
    setBarcode("");
  }
  async function doCheckout(method){
    if(cart.length===0) return;
    setPayOpen(false);
    const payload={ cart:cart.map(({id,qty,price})=>({id,qty,price})), totals:{subtotal,discount,total}, method, notes };
    const r = await api.checkout(payload);
    if(r.ok){
      alert(`Venta realizada — Folio ${r.folio}`);
      clearSale();
      setSales(await api.sales());
      setProducts(await api.products(""));
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A]">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#0F172A] text-white grid place-items-center font-bold">JJ</div>
            <div><div className="font-semibold leading-tight">Janny POS</div><div className="text-xs text-gray-500 -mt-0.5">Railway</div></div>
          </div>
          <div className="flex items-center gap-3">{offline && <span className="px-2.5 h-6 text-xs rounded-full bg-rose-100 text-rose-700 inline-flex items-center">Offline</span>}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button onClick={()=>setTab("ventas")} className={`h-10 rounded-xl border text-sm flex items-center justify-center gap-2 ${tab==="ventas"?"bg-[#0061FF] text-white border-[#0052d6]":"bg-white hover:bg-gray-50"}`}><ShoppingCart className="h-4 w-4"/> Ventas</button>
          <button onClick={()=>setTab("inventario")} className={`h-10 rounded-xl border text-sm flex items-center justify-center gap-2 ${tab==="inventario"?"bg-[#0061FF] text-white border-[#0052d6]":"bg-white hover:bg-gray-50"}`}><Package className="h-4 w-4"/> Inventario</button>
          <button onClick={()=>setTab("caja")} className={`h-10 rounded-xl border text-sm flex items-center justify-center gap-2 ${tab==="caja"?"bg-[#0061FF] text-white border-[#0052d6]":"bg-white hover:bg-gray-50"}`}><Banknote className="h-4 w-4"/> Caja</button>
        </div>

        {tab==="ventas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader title="Punto de venta" subtitle="Escanea código o busca por nombre/SKU" right={
                <form onSubmit={onScan} className="flex items-center gap-2">
                  <input className="h-10 px-3 rounded-xl border outline-none focus:ring-2 focus:ring-[#8BB2FF]" value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Escanear código" style={{width:240}}/>
                  <Button className="bg-white text-[#0061FF] border border-[#CFE0FF]"><ScanLine className="h-4 w-4 mr-1"/> Escanear</Button>
                </form>
              }/>
              <CardBody>
                <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><Search className="h-4 w-4"/><input className="h-10 px-3 rounded-xl border outline-none focus:ring-2 focus:ring-[#8BB2FF] w-full" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar producto"/></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {results.map(p=> (
                    <motion.button whileTap={{scale:.98}} onClick={()=>addToCart(p)} key={p.id} className="p-3 text-left rounded-2xl border bg-white hover:shadow">
                      <div className="font-medium leading-tight truncate" title={p.name}>{p.name}</div>
                      <div className="text-xs text-gray-500">{p.id} • {p.category}</div>
                      <div className="mt-2 font-semibold">{currency(p.price)}</div>
                    </motion.button>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Carrito" subtitle="Notas" right={null} />
              <CardBody>
                <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                  {cart.length===0 && <div className="text-sm text-gray-500">Aún no hay productos</div>}
                  {cart.map(item=> (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 py-2 border-b">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.id}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="h-8 w-8 rounded-xl border" onClick={()=>setPayOpen(false) || setCart(prev=> prev.map(i=> i.id===item.id?{...i, qty: Math.max(1, item.qty-1)}:i))}>-</button>
                        <input type="number" value={item.qty} onChange={e=>updateQty(item.id, parseInt(e.target.value||"1"))} className="w-14 h-10 rounded-xl border text-center"/>
                        <button className="h-8 w-8 rounded-xl border" onClick={()=>setCart(prev=> prev.map(i=> i.id===item.id?{...i, qty: item.qty+1}:i))}>+</button>
                      </div>
                      <div className="w-24 text-right font-semibold">{currency(item.price*item.qty)}</div>
                      <button className="h-8 w-8 rounded-xl border text-rose-600" onClick={()=>removeItem(item.id)}><Trash2 className="h-4 w-4 m-auto"/></button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span className="font-medium">{currency(subtotal)}</span></div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span>Descuento</span><span className="px-2 py-1 rounded-lg bg-[#EAF1FF] text-[#0052d6] text-xs">{discountPct}%</span></div>
                    <div className="flex items-center gap-2"><input type="number" value={discountPct} onChange={(e)=>setDiscountPct(Math.max(0,Math.min(100, parseInt(e.target.value||"0"))))} className="w-16 h-10 rounded-xl border text-right"/><span className="font-medium">-{currency(discount)}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-base"><span className="font-semibold">Total</span><span className="font-bold">{currency(total)}</span></div>
                  <div className="mt-2"><div className="text-sm font-medium mb-1">Notas</div><textarea className="min-h-[84px] p-3 rounded-xl border w-full" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instrucciones, empaques, etc." /></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={()=>setPayOpen(true)}><CreditCard className="h-4 w-4 mr-1"/> Cobrar</Button>
                    <button className="h-10 rounded-xl border" onClick={clearSale}><LogOut className="h-4 w-4 mr-1 inline"/> Cancelar</button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab==="inventario" && (
          <Card>
            <CardHeader title="Inventario" subtitle="Consulta rápida" right={null} />
            <CardBody>
              <div className="overflow-auto rounded-xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2">Categoría</th>
                      <th className="p-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p=> (
                      <tr key={p.id} className="border-t">
                        <td className="p-2 font-mono text-xs">{p.id}</td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2 text-center">{p.category}</td>
                        <td className="p-2 text-right">{currency(p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {tab==="caja" && (
          <Card>
            <CardHeader title="Ventas" subtitle="Historial" />
            <CardBody>
              <div className="overflow-auto rounded-xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2 text-left">Folio</th>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Método</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s=> (
                      <tr key={s.id} className="border-t">
                        <td className="p-2 font-mono text-xs">{s.folio}</td>
                        <td className="p-2 text-center">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-center">{s.method}</td>
                        <td className="p-2 text-right">{currency(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {payOpen && (
        <div className="fixed right-4 bottom-4 rounded-2xl bg-white border shadow-xl p-4 w-72">
          <div className="font-semibold mb-2">Cobrar {currency(total)}</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="h-10 rounded-xl bg-[#0061FF] text-white" onClick={()=>doCheckout("efectivo")}>Efectivo</button>
            <button className="h-10 rounded-xl bg-[#0061FF] text-white" onClick={()=>doCheckout("tarjeta")}>Tarjeta</button>
            <button className="h-10 rounded-xl bg-[#0061FF] text-white" onClick={()=>doCheckout("transferencia")}>Transferencia</button>
            <button className="h-10 rounded-xl bg-[#0061FF] text-white" onClick={()=>doCheckout("qr")}>QR</button>
          </div>
          <div className="text-right mt-3">
            <button className="h-10 px-3 rounded-xl border" onClick={()=>setPayOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
