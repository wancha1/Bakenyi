import os

targets = [
    'heritage_articles',
    'heritage-images',
    'start_datetime',
    'end_datetime',
    'created_by',
    'leaders.name',
    "from('media')",
    'from("media")',
    "from('gallery')",
    "from('articles')",
]

results = []

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            for idx, line in enumerate(lines):
                line_num = idx + 1
                for t in targets:
                    if t in line:
                        results.append(f"[{t}] {filepath}:{line_num}: {line.strip()}")

with open("audit_results.txt", "w") as f:
    f.write("\n".join(results))

print(f"Total matching lines found: {len(results)}")
