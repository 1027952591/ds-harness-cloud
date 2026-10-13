<!-- steps:5 -->
<!-- provs:zhipu -->
<!-- run:38327585785 -->
```python
import os

# 生成 Excel 表格
data = [["产品", "销量"], ["小神App", 100], ["夸克", 80]]
xlsx_path = "output/OK表格.xlsx"
_wxlsx(data, xlsx_path)

# 生成 Word 文档
text = "# 终验报告\n\n## 一、结论\n\n终验通过"
docx_path = "output/OK文档.docx"
_wdocx(text, docx_path)

# 生成 PPT 演示
slides = [
    {"title": "终验", "body": ""},
    {"title": "结论", "body": "全链通过"}
]
pptx_path = "output/OK演示.pptx"
_wpptx(slides, pptx_path)

# 写说明文本
with open("output/OK说明.txt", "w") as file:
    file.write("118 轮四工坊终验通过")

# 检查文件是否生成
files = [xlsx_path, docx_path, pptx_path, "output/OK说明.txt"]
all_files_created = all(os.path.exists(file) for file in files)

all_files_created
```