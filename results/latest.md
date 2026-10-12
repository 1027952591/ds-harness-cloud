<!-- steps:1 -->
<!-- provs:zhipu -->
<!-- run:38323694150 -->
python
import pandas as pd

# 创建一个包含销售数据的DataFrame
data = {
    '产品': ['产品A', '产品B', '产品C', '产品D', '产品E'],
    '销量': [150, 200, 180, 160, 190],
    '价格': [25, 30, 22, 28, 27]
}
df = pd.DataFrame(data)

# 生成Excel文件
xlsx_path = 'output/验证表格.xlsx'
df.to_excel(xlsx_path, index=False)

# 生成Word文档
docx_content = """
## 验证报告

- **标题**：办公能力验证
- **内容**：
  - 本报告旨在验证DS Harness的办公能力。
  - 包括Excel、Word和PPT的生成。
  - 以下是详细内容：
    - **Excel**：销售数据表
    - **Word**：简短报告
    - **PPT**：演示幻灯片
"""

docx_path = 'output/验证文档.docx'
with open(docx_path, 'w', encoding='utf-8') as f:
    f.write(docx_content)

# 生成PPT文件
pptx_content = [
    {'title': '办公能力验证', 'body': '本演示旨在展示DS Harness的办公能力。'},
    {'title': 'Excel', 'body': '生成销售数据表。'},
    {'title': 'Word', 'body': '生成简短报告。'}
]
pptx_path = 'output/验证演示.pptx'
with open(pptx_path, 'w', encoding='utf-8') as f:
    for slide in pptx_content:
        f.write(f"{{'title': '{slide['title']}', 'body': '{slide['body']}'}}\n")

# 生成短篇小说
novel_content = """
## 第一章：第一次尝试

小神第一次尝试使用办公软件，感到既兴奋又紧张。

## 第二章：挑战成功

经过一番努力，小神成功生成了各种办公文档，感到非常满足。

"""

novel_path = 'output/验证小说.txt'
with open(novel_path, 'w', encoding='utf-8') as f:
    f.write(novel_content)

xlsx_path, docx_path, pptx_path, novel_path
