import os
import re

with open("supabase_schema.sql") as f:
    sql_text = f.read()

# Parse schema
tables = {}
matches = re.findall(r"CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)\s*\((.*?)\);", sql_text, re.DOTALL)
for name, body in matches:
    cols = {}
    lines = body.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("--") or line.startswith("CONSTRAINT") or line.startswith("FOREIGN KEY") or line.startswith("PRIMARY KEY"):
            continue
        m = re.match(r"^\"?(\w+)\"?\s+([A-Z0-9_\(\)]+)", line, re.IGNORECASE)
        if m:
            cols[m.group(1)] = m.group(2)
    tables[name] = cols

# Parse FKs
fks = re.findall(r"FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*public\.(\w+)\s*\(([^)]+)\)", sql_text, re.IGNORECASE)
fk_map = []
for fk in fks:
    col = fk[0].replace('"', '').strip()
    ref_tbl = fk[1].strip()
    ref_col = fk[2].replace('"', '').strip()
    fk_map.append((col, ref_tbl, ref_col))

# Check foreign key references in inline table columns
inline_fks = re.findall(r"(\w+)\s+UUID\s+REFERENCES\s+public\.(\w+)\s*\(([^)]+)\)", sql_text, re.IGNORECASE)
for fk in inline_fks:
    fk_map.append((fk[0].strip(), fk[1].strip(), fk[2].strip()))

print("=== PARSED PRODUCTION SCHEMA ===")
print("Tables count:", len(tables))
print("FKs count:", len(fk_map))
print("FKs:", fk_map)

bucket_names = {"avatars", "heritage-images", "heritage-audio", "heritage-video", "event-media", "documents", "system-assets"}

# Now inspect every TS/TSX file
src_files = []
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            src_files.append(os.path.join(root, file))

print(f"\nChecking {len(src_files)} source files...")

issues = []

for path in src_files:
    with open(path) as f:
        content = f.read()

    # Check table names in .from('table')
    for m in re.finditer(r"\.from\(['\"]([^'\"]+)['\"]\)", content):
        tbl = m.group(1)
        if tbl not in tables and not tbl.startswith("storage."):
            issues.append(f"Invalid table '.from(\"{tbl}\")' in {path}")

    # Check storage buckets in .storage.from('bucket')
    for m in re.finditer(r"storage\s*\.\s*from\(['\"]([^'\"]+)['\"]\)", content):
        b = m.group(1)
        if b not in bucket_names:
            issues.append(f"Invalid storage bucket '.storage.from(\"{b}\")' in {path}")

print("\n=== INITIAL ISSUES FOUND ===")
for issue in sorted(list(set(issues))):
    print("-", issue)

