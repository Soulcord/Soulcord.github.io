require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(express.json());
app.use(express.static(__dirname));

// ==================== EMAIL TRANSPORTER ====================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ==================== ORDER STORAGE ====================

async function saveOrder(order) {
  let orders = [];
  try {
    const raw = await fs.promises.readFile(ORDERS_FILE, 'utf8');
    orders = JSON.parse(raw);
  } catch {
    // File doesn't exist yet — start fresh
  }
  orders.push(order);
  await fs.promises.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ==================== EMAIL HELPERS ====================

function formatItemsTable(items) {
  return items.map(i => `
    <tr>
      <td style="padding: 8px 0; color: #374151; border-bottom: 1px solid #f3f4f6;">
        ${i.quantity}× ${i.name}
      </td>
      <td style="padding: 8px 0; color: #374151; text-align: right; border-bottom: 1px solid #f3f4f6; white-space: nowrap;">
        €${(i.price * i.quantity).toFixed(2)}
      </td>
    </tr>`).join('');
}

function formatDeliveryTime(bezorgtijd) {
  if (!bezorgtijd) return 'Zo snel mogelijk (ca. 30–45 min)';
  const [hh, mm] = bezorgtijd.split(':').map(Number);
  let eh = hh, em = mm + 30;
  if (em >= 60) { eh++; em -= 60; }
  return `${bezorgtijd} – ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function formatPayment(payment) {
  if (payment.method === 'contant') {
    return `Contant${payment.amount ? ` (gepast: €${payment.amount})` : ''}`;
  }
  if (payment.method === 'ideal') {
    return `iDEAL${payment.bank ? ` — ${payment.bank}` : ''}`;
  }
  return 'Creditcard';
}

// ==================== EMAIL TEMPLATES ====================

function customerEmailHtml(order) {
  const { orderNumber, timestamp, customer, items, subtotal, deliveryFee, serviceFee, discount, tip, total } = order;
  const date = new Date(timestamp).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f0f0f0; font-family: Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#fdf6ec; border-radius:16px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

      <!-- Header -->
      <tr>
        <td style="background:#1a4731; padding: 28px 32px; text-align:center;">
          <p style="margin:0; color:#f0a500; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase;">Jawel's Kitchen</p>
          <h1 style="margin:8px 0 4px; color:#fdf6ec; font-size:26px; font-weight:700;">Bedankt voor je bestelling!</h1>
          <p style="margin:0; color:rgba(253,246,236,0.65); font-size:14px;">Je eten wordt zo snel mogelijk bereid</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 32px;">

          <!-- Order number -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:white; border-radius:10px; margin-bottom:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 4px; color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Ordernummer</p>
                <p style="margin:0; color:#1a4731; font-size:28px; font-weight:800;">#${orderNumber}</p>
                <p style="margin:4px 0 0; color:#9ca3af; font-size:12px;">Ontvangen op ${date}</p>
              </td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="margin:0 0 12px; color:#1c1c1c; font-size:16px;">Je bestelling</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${formatItemsTable(items)}
            <tr><td colspan="2" style="padding:8px 0;"></td></tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Subtotaal</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Bezorgkosten</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${deliveryFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Servicekosten</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${serviceFee.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `<tr>
              <td style="padding:4px 0; color:#16a34a;">Korting (10%)</td>
              <td style="padding:4px 0; color:#16a34a; text-align:right;">-€${discount.toFixed(2)}</td>
            </tr>` : ''}
            ${tip > 0 ? `<tr>
              <td style="padding:4px 0; color:#6b7280;">Fooi</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${tip.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 0; color:#1c1c1c; font-size:16px; font-weight:700; border-top:2px solid #e5e5e5;">Totaal</td>
              <td style="padding:12px 0 0; color:#1a4731; font-size:16px; font-weight:700; text-align:right; border-top:2px solid #e5e5e5;">€${total.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Delivery info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:white; border-radius:10px; margin-top:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <h3 style="margin:0 0 12px; color:#1c1c1c; font-size:15px;">📦 Bezorging</h3>
                <p style="margin:0 0 6px; color:#374151; font-size:14px;">
                  ${customer.adres} ${customer.huisnummer}<br>
                  ${customer.postcode} ${customer.woonplaats}
                </p>
                <p style="margin:6px 0 0; color:#6b7280; font-size:13px;">
                  Geschatte aankomsttijd: <strong style="color:#1a4731;">${formatDeliveryTime(customer.bezorgtijd)}</strong>
                </p>
                ${customer.opmerking ? `<p style="margin:8px 0 0; color:#6b7280; font-size:13px;">Opmerking: ${customer.opmerking}</p>` : ''}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#1a4731; padding:20px 32px; text-align:center;">
          <p style="margin:0 0 4px; color:rgba(253,246,236,0.9); font-size:13px; font-weight:600;">Vragen over je bestelling?</p>
          <p style="margin:0; color:rgba(253,246,236,0.6); font-size:13px;">Bel ons op <a href="tel:0687031423" style="color:#f0a500; text-decoration:none;">06-87031423</a></p>
          <p style="margin:12px 0 0; color:rgba(253,246,236,0.4); font-size:11px;">Visseringweg 4B, 1112 AS Diemen</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function restaurantEmailHtml(order) {
  const { orderNumber, timestamp, customer, items, subtotal, deliveryFee, serviceFee, discount, tip, total, payment } = order;
  const date = new Date(timestamp).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f0f0f0; font-family: Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:white; border-radius:16px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

      <!-- Header -->
      <tr>
        <td style="background:#e05c2a; padding: 24px 32px;">
          <p style="margin:0 0 4px; color:rgba(255,255,255,0.8); font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">Nieuwe Bestelling</p>
          <h1 style="margin:0; color:white; font-size:28px; font-weight:800;">#${orderNumber}</h1>
          <p style="margin:4px 0 0; color:rgba(255,255,255,0.7); font-size:13px;">${date}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 28px 32px;">

          <!-- Customer -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px; color:#374151; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Klantgegevens</p>
                <p style="margin:0 0 4px; color:#1c1c1c; font-size:15px; font-weight:600;">${customer.voornaam} ${customer.achternaam}</p>
                <p style="margin:0 0 2px; color:#6b7280; font-size:13px;">📞 <a href="tel:${customer.telefoon}" style="color:#e05c2a; text-decoration:none;">${customer.telefoon}</a></p>
                <p style="margin:0; color:#6b7280; font-size:13px;">✉️ <a href="mailto:${customer.email}" style="color:#e05c2a; text-decoration:none;">${customer.email}</a></p>
              </td>
            </tr>
          </table>

          <!-- Delivery address -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px; color:#374151; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Bezorgadres</p>
                <p style="margin:0 0 2px; color:#1c1c1c; font-size:15px; font-weight:600;">${customer.adres} ${customer.huisnummer}</p>
                <p style="margin:0 0 6px; color:#6b7280; font-size:14px;">${customer.postcode} ${customer.woonplaats}</p>
                <p style="margin:0; color:#1a4731; font-size:14px; font-weight:600;">⏰ ${formatDeliveryTime(customer.bezorgtijd)}</p>
                ${customer.opmerking ? `<p style="margin:8px 0 0; padding:8px 12px; background:#fff3cd; border-radius:6px; color:#92400e; font-size:13px;">📝 ${customer.opmerking}</p>` : ''}
              </td>
            </tr>
          </table>

          <!-- Items -->
          <p style="margin:0 0 10px; color:#374151; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Bestelling</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; margin-bottom:16px;">
            ${formatItemsTable(items)}
            <tr><td colspan="2" style="padding:8px 0;"></td></tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Subtotaal</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Bezorgkosten</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${deliveryFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Servicekosten</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${serviceFee.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `<tr>
              <td style="padding:4px 0; color:#16a34a;">Korting (10%)</td>
              <td style="padding:4px 0; color:#16a34a; text-align:right;">-€${discount.toFixed(2)}</td>
            </tr>` : ''}
            ${tip > 0 ? `<tr>
              <td style="padding:4px 0; color:#6b7280;">Fooi</td>
              <td style="padding:4px 0; color:#6b7280; text-align:right;">€${tip.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 0; color:#1c1c1c; font-size:16px; font-weight:700; border-top:2px solid #e5e5e5;">Totaal</td>
              <td style="padding:12px 0 0; color:#1a4731; font-size:16px; font-weight:700; text-align:right; border-top:2px solid #e5e5e5;">€${total.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Payment -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px;">
            <tr>
              <td style="padding:14px 20px;">
                <p style="margin:0 0 4px; color:#374151; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Betaalwijze</p>
                <p style="margin:0; color:#1c1c1c; font-size:14px; font-weight:600;">💳 ${formatPayment(payment)}</p>
              </td>
            </tr>
          </table>

        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ==================== EMAIL SENDING ====================

async function sendCustomerConfirmation(order) {
  await transporter.sendMail({
    from: `"Jawel's Kitchen" <${process.env.GMAIL_USER}>`,
    to: order.customer.email,
    subject: `Bevestiging bestelling #${order.orderNumber} — Jawel's Kitchen`,
    html: customerEmailHtml(order),
  });
}

async function sendRestaurantNotification(order) {
  await transporter.sendMail({
    from: `"Jawel's Kitchen Orders" <${process.env.GMAIL_USER}>`,
    to: process.env.RESTAURANT_EMAIL,
    subject: `🛵 Nieuwe bestelling #${order.orderNumber} — ${order.customer.voornaam} ${order.customer.achternaam}`,
    html: restaurantEmailHtml(order),
  });
}

// ==================== ROUTES ====================

app.post('/api/orders', async (req, res) => {
  const orderData = req.body;

  if (!orderData.customer || !orderData.items || !orderData.items.length) {
    return res.status(400).json({ success: false, error: 'Ongeldige bestelling' });
  }

  const orderNumber = Math.floor(10000 + Math.random() * 90000);
  const order = {
    orderNumber,
    timestamp: new Date().toISOString(),
    ...orderData,
  };

  try {
    await saveOrder(order);
  } catch (err) {
    console.error('Failed to save order:', err);
    return res.status(500).json({ success: false, error: 'Kon bestelling niet opslaan' });
  }

  // Fire emails without blocking the response — log failures server-side
  Promise.all([
    sendCustomerConfirmation(order).catch(err =>
      console.error(`Customer email failed for order #${orderNumber}:`, err.message)
    ),
    sendRestaurantNotification(order).catch(err =>
      console.error(`Restaurant email failed for order #${orderNumber}:`, err.message)
    ),
  ]);

  console.log(`Order #${orderNumber} saved — ${order.customer.voornaam} ${order.customer.achternaam} — €${order.total.toFixed(2)}`);

  res.json({ success: true, orderNumber });
});

// ==================== START ====================

app.listen(PORT, () => {
  console.log(`Jawel's Kitchen server running → http://localhost:${PORT}`);
});
