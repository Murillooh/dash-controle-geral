import openpyxl
import csv

wb = openpyxl.load_workbook(r'c:\Users\Murillo Silva\Desktop\Dash controle Geral\Email Google.xlsx')
ws = wb.active

with open(r'c:\Users\Murillo Silva\Desktop\Dash controle Geral\emails.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter=';')
    for row in ws.iter_rows(values_only=True):
        writer.writerow([str(cell) if cell is not None else '' for cell in row])
print('CSV generated successfully!')
