from io import BytesIO


class QuotationPdfService:

    def stream_pdf(self, quotation):
        return self.render_pdf(quotation)

    def render_pdf(self, quotation):
        html = self._build_html(quotation)
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return BytesIO(pdf_bytes)

    def _build_html(self, quotation):
        items_rows = ''
        for i, item in enumerate(quotation.items.all(), 1):
            items_rows += f'''
                <tr>
                    <td>{i}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit_price}</td>
                    <td>{item.discount}</td>
                    <td>{item.total}</td>
                </tr>
            '''

        return f'''
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 40px; }}
                    table {{ width: 100%; border-collapse: collapse; }}
                    th, td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
                </style>
            </head>
            <body>
                <h1>Quotation {quotation.number}</h1>
                <p>Customer: {quotation.customer.business_name}</p>
                <p>RFC: {quotation.customer.rfc}</p>
                <table>
                    <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Discount</th>
                        <th>Total</th>
                    </tr>
                    {items_rows}
                </table>
                <h3>Subtotal: {quotation.subtotal}</h3>
                <h3>IVA: {quotation.iva}</h3>
                <h2>Total: {quotation.total}</h2>
            </body>
            </html>
        '''
