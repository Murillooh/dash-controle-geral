import csv
from datetime import datetime

with open('emails.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    
    # Indices mapping
    i_first = headers.index('First Name [Required]')
    i_last = headers.index('Last Name [Required]')
    i_email = headers.index('Email Address [Required]')
    i_ou = headers.index('Org Unit Path [Required]')
    i_status = headers.index('Status [READ ONLY]')
    i_login = headers.index('Last Sign In [READ ONLY]')
    
    # Try to find Department
    try:
        i_dept = headers.index('Department')
    except:
        i_dept = -1

    rows = []
    # Header
    rows.append(['email', 'nome', 'departamento', 'unidade', 'status', 'ultimo_login'])
    
    for r in reader:
        if not r: continue
        
        email = r[i_email].strip()
        nome = (r[i_first].strip() + " " + r[i_last].strip()).strip()
        dept = r[i_dept].strip() if i_dept != -1 and len(r) > i_dept else ''
        ou = r[i_ou].strip().replace('/', '').strip()
        ou = ou if ou else 'Matriz'  # Example default
        
        raw_status = r[i_status].strip()
        if raw_status.lower() == 'active':
            status = 'Ativo'
        elif raw_status.lower() == 'suspended':
            status = 'Suspenso'
        else:
            status = raw_status
            
        raw_login = r[i_login].strip()
        login = ''
        if raw_login and raw_login != 'Never logged in':
            try:
                dt = datetime.strptime(raw_login, '%Y-%m-%d %H:%M:%S')
                login = dt.strftime('%d/%m/%Y')
            except:
                login = raw_login
        elif raw_login == 'Never logged in':
            login = 'Nunca'
            
        rows.append([email, nome, dept, ou, status, login])

with open('emails_import.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter=';')
    writer.writerows(rows)

print("Generated emails_import.csv")
