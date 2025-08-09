const BASE = ''; // mismo dominio en Railway

export const api = {
  async products(search=''){
    const r = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
    return r.json();
  },
  async addProduct(p){
    const r = await fetch(`/api/products`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p) });
    if(!r.ok) throw new Error('Error al guardar producto');
    return r.json();
  },
  async checkout(payload){
    const r = await fetch(`/api/checkout`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!r.ok) throw new Error('Error en checkout');
    return r.json();
  },
  async sales(){
    const r = await fetch(`/api/sales`);
    return r.json();
  },
  async cancelSale(id, pin='1111'){
    const r = await fetch(`/api/sales/${id}/cancel`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pin }) });
    if(!r.ok) throw new Error('PIN incorrecto o error al cancelar');
    return r.json();
  }
}
