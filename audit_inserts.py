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

bucket_names = {"avatars", "heritage-images", "heritage-audio", "heritage-video", "event-media", "documents", "system-assets"}

files_to_check = []
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            files_to_check.append(os.path.join(root, file))

print("=== CHECKING ALL TABLES AND COLUMNS IN ALL FILES ===")

# Check for table inserts and updates
for filepath in files_to_check:
    with open(filepath) as f:
        content = f.read()

    # Search for .from('tablename').insert(...) or .from('tablename').update(...)
    matches = re.finditer(r"\.from\(['\"](\w+)['\"]\)\.(insert|update|upsert)\(({.*?})\)", content, re.DOTALL)
    for m in matches:
        tbl = m.group(1)
        op = m.group(2)
        obj_str = m.group(3)
        if tbl in tables:
            valid_cols = tables[tbl]
            # find keys in object
            keys = re.findall(r"(\w+)\s*:", obj_str)
            for k in keys:
                if k not in valid_cols and k not in ['id', 'updated_at', 'created_at'] and not k.startswith('_'):
                    print(f"[INSERT/UPDATE ERROR] File: {filepath} | Table: {tbl} | Unknown Column: {k}")

# Search for storage bucket usages
for filepath in files_to_check:
    with open(filepath) as f:
        content = f.read()
    storage_matches = re.findall(r"storage\s*\.\s*from\(['\"]([^'\"]+)['\"]\)", content)
    for b in storage_matches:
        if b not in bucket_names:
            print(f"[BUCKET ERROR] File: {filepath} | Unknown Bucket: {b}")

