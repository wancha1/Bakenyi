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

src_files = []
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            src_files.append(os.path.join(root, file))

print("=== EXACT STATEMENT PARSER FOR ALL FILES ===")

# Check for table queries
for path in src_files:
    with open(path) as f:
        content = f.read()

    # Find statements with client.from('tbl') or .from('tbl')
    for m in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
        table_name = match_tbl = m.group(1)
        pos = m.start()
        # extract lines around pos
        start_line = max(0, pos - 50)
        end_line = min(len(content), pos + 300)
        stmt = content[start_line:end_line]

        if table_name not in tables:
            print(f"[UNKNOWN TABLE] {path}: '{table_name}'")

print("Finished statement scan.")
