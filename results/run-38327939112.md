<!-- steps:5 -->
<!-- provs:zhipu -->
<!-- run:38327939112 -->
```python
import os
from openpyxl import Workbook

# 生成 Excel 文件
wb = Workbook()
ws = wb.active
data = [["产品", "销量"], ["小神App", 100], ["夸克", 80]]
for row in data:
    ws.append(row)
wb.save("output/F表格.xlsx")

# 生成 Word 文档
from docx import Document
doc = Document()
doc.add_heading(level=0, text="# 终验报告")
doc.add_heading(level=1, text="## 一、结论")
doc.add_paragraph("118 轮四工坊终验通过。")
doc.save("output/F文档.docx")

# 生成 PPT 演示
from pptx import Presentation
prs = Presentation()
slide_layout = prs.slide_layouts[0]
slide = prs.slides.add_slide(slide_layout)
title = slide.shapes.title
subtitle = slide.placeholders[1]
title.text = "终验"
subtitle.text = "118 轮四工坊终验通过。"

slide_layout = prs.slide_layouts[5]
slide = prs.slides.add_slide(slide_layout)
title = slide.shapes.title
body = slide.placeholders[1]
title.text = "结论"
body.text = "118 轮四工坊终验通过。"

prs.save("output/F演示.pptx")

# 写说明文件
with open("output/F说明.txt", "w") as f:
    f.write("118 轮四工坊终验通过。")
```

📦 交付物（已在对话框内直接渲染播放/预览，也可到仓库下载）：
【交付:output/F文档.docx】
【交付:output/F表格.xlsx】