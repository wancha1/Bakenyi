import os
import re

with open("supabase_schema.sql") as f:
    sql_text = f.read()

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

print("Valid tables:", sorted(list(tables.keys())))
print("Valid buckets:", sorted(list(bucket_names)))

from_table_regex = re.compile(r"\.from\(['\"]([^'\"]+)['\"]\)")
storage_bucket_regex = re.compile(r"storage\.from\(['\"]([^'\"]+)['\"]\)")

found_tables = set()
found_buckets = set()

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path) as f:
                content = f.read()
            for t in from_table_regex.findall(content):
                found_tables.add((t, path))
            for b in storage_bucket_regex.findall(content):
                found_buckets.add((b, path))

print("\n--- FOUND TABLES IN FRONTEND ---")
for t, p in sorted(found_tables):
    valid = t in tables
    status = "VALID" if valid else "INVALID (LEGACY)"
    print(f"Table: {t:25} {status:18} File: {p}")

print("\n--- FOUND BUCKETS IN FRONTEND ---")
for b, p in sorted(found_buckets):
    valid = b in bucket_names
    status = "VALID" if valid else "INVALID (LEGACY)"
    print(f"Bucket: {b:25} {status:18} File: {p}")
