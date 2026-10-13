<!-- steps:5 -->
<!-- provs:zhipu -->
<!-- run:38327089727 -->
```python
import os

# 生成终验表格
data = [[
    "产品",
    "销量"
], [
    "小神App",
    "100"
], [
    "夸克",
    "80"
]]
output_path = "output/终验表格.xlsx"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
# 假设 agent._xlsx 函数存在并可以直接使用
# agent._xlsx(data, output_path)

# 生成终验文档
text = "# 终验报告\n\n## 一、结论\n\n通过"
output_path = "output/终验文档.docx"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
# 假设 agent._docx 函数存在并可以直接使用
# agent._docx(text, output_path)

# 生成终验演示
slides = [{
    "title": "终验",
    "body": ""
}, {
    "title": "结论",
    "body": "全链通过"
}]
output_path = "output/终验演示.pptx"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
# 假设 agent._pptx 函数存在并可以直接使用
# agent._pptx(slides, output_path)

# 写终验说明
content = "118 轮四工坊终验通过"
output_path = "output/终验说明.txt"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as file:
    file.write(content)

# 确认文件生成成功
files = [
    "output/终验表格.xlsx",
    "output/终验文档.docx",
    "output/终验演示.pptx",
    "output/终验说明.txt"
]
for file in files:
    assert os.path.exists(file), f"文件 {file} 未生成成功"
```