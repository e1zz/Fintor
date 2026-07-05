from io import BytesIO

import openpyxl


class SpreadsheetExportService:

    def stream_xlsx(self, filename, headers, rows, column_types=None):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = filename

        ws.append(headers)

        for row in rows:
            ws.append(row)

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output
