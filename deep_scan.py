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

# Scan all TS and TSX files for .from('tablename')
src_files = []
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            src_files.append(os.path.join(root, file))

print("=== DEEP SCANNING ALL SUPABASE CALLS ===")

for path in src_files:
    with open(path) as f:
        content = f.read()
    
    # Find all occurrences of .from('...')
    for match in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
        table_name = match.group(1)
        start_pos = match.start()
        # grab the chunk of code following this query (up to 300 chars or semicolon)
        chunk = content[start_pos:start_pos+350]
        
        if table_name not in tables:
            print(f"[UNKNOWN TABLE] {path}: table '{table_name}'")
            continue
            
        valid_cols = tables[table_name]
        
        # Check select(...)
        sel_matches = re.findall(r"\.select\((['\"][^'\"]+['\"]|\s*`[^`]+`)", chunk)
        for sel in sel_matches:
            sel_str = sel.strip("'\"` ")
            # remove subqueries / joins like profiles:author_id(...) or profiles(...)
            clean_sel = re.sub(r'\w+:\w+\([^\)]*\)', '', sel_str)
            clean_sel = re.sub(r'\w+\([^\)]*\)', '', clean_sel)
            for part in clean_sel.split(','):
                part = part.strip()
                if not part or part == '*' or part.startswith('{') or 'count' in part:
                    continue
                # handle alias like name:full_name or col
                col_name = part.split(':')[0].strip()
                if col_name and col_name not in valid_cols and not col_name.startswith('!'):
                    print(f"[SELECT COL MISMATCH] {path} | Table: '{table_name}' | Column: '{col_name}' in select('{sel_str}')")

        # Check eq / order / ilike / match
        for op in ['eq', 'order', 'ilike', 'or', 'contains', 'like', 'neq', 'gt', 'gte', 'lt', 'lte']:
            op_matches = re.findall(rf"\.{op}\(['\"](\w+)['\"]", chunk)
            for col in op_matches:
                if col not in valid_cols:
                    print(f"[{op.upper()} COL MISMATCH] {path} | Table: '{table_name}' | Column: '{col}'")

