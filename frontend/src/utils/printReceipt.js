import dayjs from 'dayjs';

const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const orderNum = (num) => `#${String(num).padStart(4, '0')}`;

/**
 * Opens a print window with an 80mm thermal receipt.
 * Works with any USB thermal printer set as the default printer in Windows.
 *
 * @param {Object} params
 * @param {Object} params.order             - Order object from the API
 * @param {Object} params.taxDetails        - Tax breakdown from calculateTaxes()
 * @param {Object} params.restaurantSettings - Restaurant info (name, address, phone, gstNumber)
 * @param {string} params.paymentMethod     - 'cash' | 'card' | 'upi'
 * @param {string} params.amountReceived    - Cash amount entered (for cash payments)
 */
export const printReceipt = ({ order, taxDetails = {}, restaurantSettings = {}, paymentMethod = 'cash', amountReceived = '' }) => {
  const {
    subtotal = 0,
    cgst = 0,
    sgst = 0,
    serviceCharge = 0,
    grandTotal = 0,
    cgstPercent = 0,
    sgstPercent = 0,
    serviceChargePercent = 0,
  } = taxDetails;

  const paid = amountReceived ? parseFloat(amountReceived) : 0;
  const change = paymentMethod === 'cash' && paid > 0 ? Math.max(0, paid - grandTotal) : 0;

  const name = restaurantSettings.name || 'Restaurant';
  const address = restaurantSettings.address || '';
  const phone = restaurantSettings.phone || '';
  const gstNumber = restaurantSettings.gstNumber || '';

  const orderDate = dayjs(order.createdAt).format('DD-MMM-YYYY');
  const printTime = dayjs().format('hh:mm A');
  const waiterName = order.waiter
    ? typeof order.waiter === 'object'
      ? order.waiter.name
      : order.waiter
    : '';

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td class="item-name">${item.name}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">${fmt(item.price || 0)}</td>
        <td class="item-total">${fmt((item.price || 0) * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt ${orderNum(order.orderNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11.5px;
      width: 76mm;
      padding: 3mm 2mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .lg     { font-size: 14px; }
    .xl     { font-size: 16px; }
    .dash   { border-top: 1px dashed #000; margin: 3px 0; }
    .solid  { border-top: 1px solid #000;  margin: 3px 0; }
    .double { border-top: 3px double #000; margin: 3px 0; }
    .row    { display: flex; justify-content: space-between; margin: 1.5px 0; }
    .row span:last-child { white-space: nowrap; padding-left: 4px; }

    /* Items table */
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10.5px; text-align: left; padding: 1px 0; }
    td { font-size: 11px; padding: 1.5px 0; vertical-align: top; }
    .item-name  { word-break: break-word; }
    .item-qty   { text-align: center; width: 24px; }
    .item-price { text-align: right; width: 52px; }
    .item-total { text-align: right; width: 58px; }
    th.item-qty, th.item-price, th.item-total { text-align: right; }

    /* Total row */
    .total-row  { font-size: 14px; font-weight: bold; }
    .change-row { font-size: 13px; font-weight: bold; }

    /* Footer */
    .footer { margin-top: 6px; font-size: 10.5px; }

    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      body { width: 80mm; padding: 2mm; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="center">
    <div class="bold xl">${name}</div>
    ${address ? `<div>${address}</div>` : ''}
    ${phone ? `<div>Ph: ${phone}</div>` : ''}
    ${gstNumber ? `<div>GSTIN: ${gstNumber}</div>` : ''}
  </div>

  <div class="solid"></div>

  <!-- Order Info -->
  <div class="row">
    <span>Date: ${orderDate}</span>
    <span>Time: ${printTime}</span>
  </div>
  <div class="row">
    <span>Order: <span class="bold">${orderNum(order.orderNumber)}</span></span>
    ${order.tableNumber ? `<span>Table: <span class="bold">T${order.tableNumber}</span></span>` : '<span>Takeaway</span>'}
  </div>
  ${waiterName ? `<div>Server: ${waiterName}</div>` : ''}

  <div class="dash"></div>

  <!-- Items -->
  <table>
    <thead>
      <tr>
        <th class="item-name">Item</th>
        <th class="item-qty">Qty</th>
        <th class="item-price">Rate</th>
        <th class="item-total">Amt</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="4"><div class="dash"></div></td></tr>
      ${itemRows}
    </tbody>
  </table>

  <div class="dash"></div>

  <!-- Tax Breakdown -->
  <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
  ${cgstPercent > 0 ? `<div class="row"><span>CGST (${cgstPercent}%)</span><span>${fmt(cgst)}</span></div>` : ''}
  ${sgstPercent > 0 ? `<div class="row"><span>SGST (${sgstPercent}%)</span><span>${fmt(sgst)}</span></div>` : ''}
  ${serviceChargePercent > 0 ? `<div class="row"><span>Service Charge (${serviceChargePercent}%)</span><span>${fmt(serviceCharge)}</span></div>` : ''}

  <div class="double"></div>
  <div class="row total-row"><span>TOTAL</span><span>${fmt(grandTotal)}</span></div>
  <div class="double"></div>

  <!-- Payment -->
  <div class="row" style="margin-top:4px">
    <span>Payment Mode:</span>
    <span class="bold">${paymentMethod.toUpperCase()}</span>
  </div>
  ${paid > 0 && paymentMethod === 'cash' ? `
  <div class="row"><span>Cash Received</span><span>${fmt(paid)}</span></div>
  <div class="row change-row"><span>Change</span><span>${fmt(change)}</span></div>
  ` : ''}

  <div class="dash"></div>

  <!-- Footer -->
  <div class="center footer">
    <div class="bold">Thank you! Please visit again.</div>
    ${gstNumber ? `<div style="margin-top:3px;font-size:9.5px">Tax Invoice</div>` : ''}
    <div style="margin-top:5px;font-size:9px">Kotbilling POS</div>
  </div>

  <script>
    window.onload = function () {
      window.focus();
      window.print();
      setTimeout(function () { window.close(); }, 800);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=650,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // Fallback: popup was blocked — inform user
    alert('Popup blocked! Please allow popups for this site to enable receipt printing.');
  }
};
