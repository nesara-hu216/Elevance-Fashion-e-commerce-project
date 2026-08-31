const PDFDocument = require('pdfkit');

exports.generateInvoicePDF = (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc
        .fillColor('#2A2D34')
        .fontSize(24)
        .text('ELEVANCE STORE', 50, 45)
        .fontSize(10)
        .text('Official Tax Invoice / Receipt', 50, 75)
        .text('Support: support@elevance-store.com', 50, 90);

      doc
        .fontSize(12)
        .text(`INVOICE #: ${order.invoiceNumber}`, 400, 45, { align: 'right' })
        .text(`ORDER #: ${order.orderId}`, 400, 65, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 85, { align: 'right' });

      doc.moveTo(50, 115).lineTo(550, 115).stroke('#CCCCCC');

      // Customer & Billing Info
      doc
        .fontSize(12)
        .fillColor('#2A2D34')
        .text('Billed To:', 50, 130)
        .fontSize(10)
        .text(`Name: ${order.deliveryAddress.fullName || user.name}`, 50, 145)
        .text(`Phone: ${order.deliveryAddress.phone}`, 50, 160)
        .text(`Address: ${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.city}`, 50, 175)
        .text(`${order.deliveryAddress.state} - ${order.deliveryAddress.zipCode}`, 50, 190);

      doc
        .fontSize(12)
        .text('Payment Information:', 350, 130)
        .fontSize(10)
        .text(`Method: ${order.paymentMethod.toUpperCase()}`, 350, 145)
        .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 350, 160)
        .text(`Order Status: ${order.orderStatus.toUpperCase()}`, 350, 175);

      doc.moveTo(50, 215).lineTo(550, 215).stroke('#CCCCCC');

      // Table Header
      let y = 230;
      doc
        .fontSize(10)
        .fillColor('#1A1A1A')
        .text('Item Description', 50, y, { width: 220 })
        .text('Variant', 270, y, { width: 80 })
        .text('Qty', 350, y, { width: 40, align: 'center' })
        .text('Price', 400, y, { width: 70, align: 'right' })
        .text('Total', 480, y, { width: 70, align: 'right' });

      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#EEEEEE');

      // Table Items
      y += 25;
      order.items.forEach((item) => {
        doc
          .fontSize(9)
          .fillColor('#444444')
          .text(item.name, 50, y, { width: 220 })
          .text(`${item.size} / ${item.color}`, 270, y, { width: 80 })
          .text(item.quantity.toString(), 350, y, { width: 40, align: 'center' })
          .text(`₹${item.price}`, 400, y, { width: 70, align: 'right' })
          .text(`₹${item.price * item.quantity}`, 480, y, { width: 70, align: 'right' });

        y += 20;
      });

      doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke('#CCCCCC');
      y += 15;

      // Summary Breakdown
      doc
        .fontSize(10)
        .fillColor('#2A2D34')
        .text('Subtotal:', 350, y, { width: 120, align: 'right' })
        .text(`₹${order.subtotal}`, 480, y, { width: 70, align: 'right' });
      y += 18;

      doc
        .text('Tax (GST 18%):', 350, y, { width: 120, align: 'right' })
        .text(`₹${order.taxTotal}`, 480, y, { width: 70, align: 'right' });
      y += 18;

      doc
        .text('Shipping Fee:', 350, y, { width: 120, align: 'right' })
        .text(`₹${order.shippingTotal}`, 480, y, { width: 70, align: 'right' });
      y += 18;

      if (order.discountTotal > 0) {
        doc
          .text('Discount:', 350, y, { width: 120, align: 'right' })
          .text(`-₹${order.discountTotal}`, 480, y, { width: 70, align: 'right' });
        y += 18;
      }

      doc.moveTo(350, y + 2).lineTo(550, y + 2).stroke('#1A1A1A');
      y += 10;

      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Grand Total:', 350, y, { width: 120, align: 'right' })
        .text(`₹${order.grandTotal}`, 480, y, { width: 70, align: 'right' });

      // Footer
      doc
        .fontSize(9)
        .fillColor('#777777')
        .text('Thank you for shopping with Elevance Store! For returns and support visit our app.', 50, 700, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
