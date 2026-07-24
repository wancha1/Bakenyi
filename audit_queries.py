import os
import re

with open("supabase_schema.sql") as f:
    sql_text = f.read()

# Parse table schemas
tables = {}
matches = re.findall(r"CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)\s*\((.*?)\);", sql_text, re.DOTALL)
for name, body in matches:
    cols = set()
    for line in body.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("--") or line.startswith("CONSTRAINT") or line.startswith("FOREIGN KEY") or line.startswith("PRIMARY KEY"):
            continue
        m = re.match(r"^\"?(\w+)\"?\s+([A-Z0-9_\(\)]+)", line, re.IGNORECASE)
        if m:
            cols.add(m.group(1))
    tables[name] = cols

# Let's check files for queries like .from('table').select(...) / .insert(...) / .update(...) / .order(...) / .eq(...)
print("=== CHECKING FRONTEND QUERY COLUMNS AGAINST PRODUCTION SCHEMA ===")

files_to_check = []
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            files_to_check.append(os.path.join(root, file))

# Regex for .from('table') followed by operations
from_pattern = re.compile(r"\.from\(['\"](\w+)['\"]\)(.*?)(?=\.from\(|\n\n|;|\Z)", re.DOTALL)

mismatches = []

for filepath in files_to_check:
    with open(filepath) as f:
        content = f.read()
    
    for match in from_pattern.finditer(content):
        table_name = match.group(1)
        chain = match.group(2)
        
        if table_name not in tables:
            mismatches.append(f"Unknown table '{table_name}' in {filepath}")
            continue
            
        valid_cols = tables[table_name]
        
        # Check .select('...')
        selects = re.findall(r"\.select\(['\"]([^'\"]+)['\"]\)", chain)
        for sel in selects:
            # Parse column names from select string like 'id, title, created_by, profiles:created_by(name)'
            # Clean up joins
            sel_clean = re.sub(r'\w+:\w+\([^\)]*\)', '', sel)
            sel_clean = re.sub(r'\w+\([^\)]*\)', '', sel_clean)
            tokens = [t.strip() for t in sel_clean.split(',') if t.strip() and t.strip() != '*']
            for token in tokens:
                col = token.split(':')[0].strip()
                if col and col not in valid_cols:
                    mismatches.append(f"Invalid column '{col}' for table '{table_name}' in .select() at {filepath}")
                    
        # Check .eq('col', ...), .order('col', ...), .update({ col: ... }), .insert({ col: ... })
        eqs = re.findall(r"\.eq\(['\"](\w+)['\"]", chain)
        for col in eqs:
            if col not in valid_cols:
                mismatches.append(f"Invalid column '{col}' in .eq() for table '{table_name}' at {filepath}")
                
        orders = re.findall(r"\.order\(['\"](\w+)['\"]", chain)
        for col in orders:
            if col not in valid_cols:
                mismatches.append(f"Invalid column '{col}' in .order() for table '{table_name}' at {filepath}")

if mismatches:
    print("FOUND MISMATCHES:")
    for m in set(mismatches):
        print(" -", m)
else:
    print("NO COLUMN MISMATCHES FOUND IN CHAINED QUERIES!")
