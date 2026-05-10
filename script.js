let products = [
  {id:1, name: "Mabati Iron Sheet (28 Gauge)", price: 1450, stock: 245, img: "https://source.unsplash.com/random/300x200/?roof"},
  {id:2, name: "Portland Cement (50kg)", price: 750, stock: 180, img: "https://source.unsplash.com/random/300x200/?cement"},
  {id:3, name: "Treated Timber 3x2", price: 850, stock: 25, img: "https://source.unsplash.com/random/300x200/?wood"},
  {id:4, name: "PVC Pipe 110mm", price: 650, stock: 320, img: "https://source.unsplash.com/random/300x200/?pipe"},
  {id:5, name: "Dulux Emulsion 20L", price: 4500, stock: 18, img: "https://source.unsplash.com/random/300x200/?paint"},
  {id:6, name: "Ridge Cap", price: 650, stock: 140, img: "https://source.unsplash.com/random/300x200/?roof"},
  {id:7, name: "Ballast (1 Ton)", price: 2800, stock: 12, img: "https://source.unsplash.com/random/300x200/?stones"},
  {id:8, name: "PPR Pipe 25mm", price: 320, stock: 210, img: "https://source.unsplash.com/random/300x200/?plumbing"}
];

let cart = [];
let orderHistory = JSON.parse(localStorage.getItem('frankimOrders')) || [];
let currentUser = { name: "", role: "" };

function generateReceiptNumber() {
  const d = new Date();
  return `FRK-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${Math.floor(10000 + Math.random() * 90000)}`;
}

function login() {
  const username = document.getElementById('username').value || "Staff";
  const role = document.getElementById('userRole').value;
  currentUser = { name: username, role: role };

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('userInfo').innerHTML = `<strong>${role}</strong> — ${username}`;

  document.getElementById('receiptNo').textContent = generateReceiptNumber();
  renderProducts();
}

function renderProducts(filtered = products) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  filtered.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = `product-card ${product.stock <= 30 ? 'low-stock' : ''}`;
    card.innerHTML = `
      <img src="${product.img}">
      <strong>${product.name}</strong><br>
      KSh ${product.price}<br>
      <small style="color:${product.stock <= 30 ? 'red' : 'green'}">Stock: ${product.stock}</small>
    `;
    card.onclick = () => addToCart(index);
    grid.appendChild(card);
  });
}

function filterProducts() {
  const term = document.getElementById('searchBar').value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(term));
  renderProducts(filtered);
}

function addToCart(index) {
  const product = products[index];
  if (product.stock <= 0) return alert("Out of stock!");

  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    if (existing.qty < product.stock) existing.qty++;
    else return alert("Not enough stock!");
  } else {
    cart.push({...product, qty: 1});
  }
  renderCart();
}

function renderCart() {
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td><input type="number" value="${item.qty}" min="1" style="width:70px" onchange="updateQty(${index}, this.value)"></td>
      <td>${item.price}</td>
      <td>${subtotal}</td>
      <td><button onclick="removeItem(${index})">×</button></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('totalAmount').textContent = total.toLocaleString();
}

function updateQty(index, qty) {
  cart[index].qty = parseInt(qty) || 1;
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function clearCart() {
  if (confirm("Clear entire cart?")) {
    cart = [];
    renderCart();
  }
}

function payWithMpesa() {
  const total = parseInt(document.getElementById('totalAmount').textContent.replace(/,/g, '')) || 0;
  if (total === 0) return alert("Cart is empty!");

  const phone = prompt("Enter customer phone number:", "07");
  if (!phone) return;

  alert(`✅ M-Pesa STK Push sent to ${phone}`);

  setTimeout(() => {
    cart.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) prod.stock -= item.qty;
    });
    saveOrder(true);
    alert("🎉 Payment Confirmed!");
    printReceipt(true);
    
    cart = [];
    renderCart();
    document.getElementById('customerName').value = '';
    document.getElementById('receiptNo').textContent = generateReceiptNumber();
    renderProducts();
  }, 6500);
}

function saveOrder(paid) {
  const order = {
    receiptNo: document.getElementById('receiptNo').textContent,
    date: new Date().toLocaleString(),
    customer: document.getElementById('customerName').value || "Walk-in Customer",
    items: JSON.parse(JSON.stringify(cart)),
    total: parseInt(document.getElementById('totalAmount').textContent.replace(/,/g, '')),
    status: paid ? "Paid" : "Pending",
    cashier: currentUser.name
  };
  orderHistory.unshift(order);
  localStorage.setItem('frankimOrders', JSON.stringify(orderHistory));
}

function sendToWhatsApp() {
  const total = document.getElementById('totalAmount').textContent;
  let msg = `*Frankim Services - ${document.getElementById('receiptNo').textContent}*\n\n`;
  cart.forEach(item => msg += `• ${item.name} × ${item.qty} = KSh ${item.price*item.qty}\n`);
  msg += `\n💰 Total: KSh ${total}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function printReceipt(paid = false) {
  if (cart.length === 0) return alert("Nothing to print!");

  const receiptNo = document.getElementById('receiptNo').textContent;
  const customer = document.getElementById('customerName').value || "Walk-in Customer";
  const total = document.getElementById('totalAmount').textContent;

  let html = `
    <div style="font-family:monospace; width:320px; margin:auto; padding:20px; border:2px dashed #000;">
      <h2 style="text-align:center;">FRANKIM SERVICES</h2>
      <p style="text-align:center;">Thika Road, Nairobi</p>
      <p style="text-align:center;">0733 227 794 | 0728 671 110</p>
      <hr>
      <p><strong>Receipt:</strong> ${receiptNo}</p>
      <p><strong>Customer:</strong> ${customer}</p>
      <p>Date: ${new Date().toLocaleString()}</p>
      <hr>
      <table style="width:100%;"><tr><th align="left">Item</th><th>Qty</th><th align="right">Amt</th></tr>`;

  cart.forEach(item => {
    html += `<tr><td>${item.name}</td><td align="center">${item.qty}</td><td align="right">${item.price*item.qty}</td></tr>`;
  });

  html += `</table><hr><h3 style="text-align:right;">Total: KSh ${total}</h3>`;
  if (paid) html += `<h3 style="text-align:center;color:green;">✅ PAID</h3>`;

  html += `<div id="qrcode" style="text-align:center;margin:15px 0;"></div>
           <p style="text-align:center;">Thank you for shopping with us!</p></div>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    new QRCode(win.document.getElementById("qrcode"), { 
      text: receiptNo, 
      width: 140, 
      height: 140 
    });
    win.print();
  }, 700);
}

function exportToExcel() {
  if (orderHistory.length === 0) return alert("No sales data to export!");

  const data = orderHistory.map(order => ({
    "Receipt No": order.receiptNo,
    "Date": order.date,
    "Customer": order.customer,
    "Cashier": order.cashier,
    "Total Amount (KSh)": order.total,
    "Status": order.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Frankim Sales");
  XLSX.writeFile(wb, `Frankim_Sales_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function viewReports() {
  let totalSales = orderHistory.filter(o => o.status === "Paid").reduce((sum, o) => sum + o.total, 0);
  
  const summary = `📊 Total Revenue: KSh ${totalSales.toLocaleString()}\nTotal Transactions: ${orderHistory.length}`;

  if (confirm(summary + "\n\nExport to Excel now?")) {
    exportToExcel();
  }
}

// Initialize
document.getElementById('password').focus();
