import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const prisma = new PrismaClient();

app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Seed mínimo en primera carga si no hay sitio
app.post('/api/seed-basic', async (req, res) => {
  const count = await prisma.site.count();
  if (count === 0) await prisma.site.create({ data: { name: 'Principal' } });
  res.json({ ok: true });
});

// Products
app.get('/api/products', async (req, res) => {
  const q = (req.query.search || '').toString().toLowerCase();
  const rows = await prisma.product.findMany({ include: { stock: { include: { site: true } } }, orderBy: { createdAt: 'desc' } });
  const filtered = q ? rows.filter(p => [p.id, p.name, p.barcode].filter(Boolean).some(s => s.toLowerCase().includes(q))) : rows;
  res.json(filtered.map(p => ({ ...p, stockBySite: Object.fromEntries(p.stock.map(s => [s.site.name, s.qty])) })));
});

// Checkout
app.post('/api/checkout', async (req, res) => {
  const { cart = [], totals = {}, method = 'efectivo', customerId = null, employeeId = null, siteName = 'Principal' } = req.body || {};
  if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ error: 'Empty cart' });
  const site = await prisma.site.findFirst({ where: { name: siteName } }) || await prisma.site.create({ data: { name: 'Principal' } });
  const folio = 'TCK-' + dayjs().format('YYYYMMDD') + '-' + uuidv4().slice(0, 6).toUpperCase();
  const created = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({ data: {
      folio, method,
      subtotal: Number(totals.subtotal || 0),
      discount: Number(totals.discount || 0),
      total: Number(totals.total || 0),
      customerId, employeeId, siteId: site?.id
    }});
    for (const it of cart) {
      const p = await tx.product.findUnique({ where: { id: it.id } });
      if (!p) throw new Error('Product not found: ' + it.id);
      await tx.saleItem.create({ data: { saleId: sale.id, productId: p.id, name: p.name, qty: Number(it.qty), price: Number(it.price) } });
      const st = await tx.stock.upsert({ where: { productId_siteId: { productId: p.id, siteId: site.id } }, update: {}, create: { productId: p.id, siteId: site.id, qty: 0 } });
      if (st.qty < it.qty) throw new Error('Insufficient stock for ' + p.id);
      await tx.stock.update({ where: { productId_siteId: { productId: p.id, siteId: site.id } }, data: { qty: { decrement: Number(it.qty) } } });
    }
    return sale;
  });
  res.json({ ok: true, folio, id: created.id });
});

// Sales list
app.get('/api/sales', async (req, res) => {
  const rows = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rows);
});

// Cancel with PIN
app.post('/api/sales/:id/cancel', async (req, res) => {
  const { pin = '' } = req.body || {};
  if (pin.toString() !== (process.env.CANCEL_PIN || '1111')) return res.status(401).json({ error: 'PIN incorrecto' });
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { items: true, site: true } });
  if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
  if (sale.status === 'cancelada') return res.json(sale);
  await prisma.$transaction(async (tx) => {
    await tx.sale.update({ where: { id: sale.id }, data: { status: 'cancelada' } });
    if (sale.site) {
      for (const it of sale.items) {
        await tx.stock.upsert({ where: { productId_siteId: { productId: it.productId, siteId: sale.siteId } }, update: { qty: { increment: it.qty } }, create: { productId: it.productId, siteId: sale.siteId, qty: it.qty } });
      }
    }
  });
  res.json({ ok: true });
});

// Ticket PDF
app.get('/api/sales/:id/ticket.pdf', async (req, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } }, customer: true } });
  if (!sale) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ticket-${sale.folio}.pdf"`);
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: [210, 600], margin: 10 });
  doc.pipe(res);
  doc.fontSize(12).text('JANNY POS', { align: 'center' });
  doc.moveDown(0.2).fontSize(8).text(`Folio: ${sale.folio}`);
  doc.text(`Fecha: ${dayjs(sale.createdAt).format('YYYY-MM-DD HH:mm')}`);
  doc.text(`Método: ${sale.method}`);
  if (sale.customer) doc.text(`Cliente: ${sale.customer.name}`);
  doc.moveDown(0.3).text('-----------------------------------');
  sale.items.forEach(it => { doc.fontSize(8).text(`${it.qty} x ${it.name}`); doc.text(`@ ${Number(it.price).toFixed(2)}  Importe: ${(Number(it.price) * it.qty).toFixed(2)}`); });
  doc.text('-----------------------------------');
  doc.text(`Subtotal: ${Number(sale.subtotal).toFixed(2)}`);
  doc.text(`Descuento: ${Number(sale.discount).toFixed(2)}`);
  doc.fontSize(10).text(`TOTAL: ${Number(sale.total).toFixed(2)}`, { align: 'right' });
  doc.end();
});

// Serve frontend build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.resolve(__dirname, './dist');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'), (err) => { if (err) next(); });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, async () => {
  console.log('POS Janny backend on :' + PORT);
  const count = await prisma.site.count();
  if (count === 0) await prisma.site.create({ data: { name: 'Principal' } });
});
