import json

path = "src/presentation/game/levels/levelCube.ts"
with open(path, "r") as f:
    content = f.read()

# the file exports a const, so we need to extract the json part
start = content.find("{")
end = content.rfind("}") + 1
json_str = content[start:end]

data = json.loads(json_str)

for cell in data["cells"]:
    cell.pop("col", None)
    cell.pop("row", None)
    cell.pop("layer", None)

for arrow in data["arrows"]:
    arrow.pop("color", None)

new_content = content[:start] + json.dumps(data, indent=2) + ";\n"

with open(path, "w") as f:
    f.write(new_content)
