from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 PageBreak, KeepTogether, HRFlowable)
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase import pdfmetrics

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

FONT = 'STSong-Light'
BLUE = HexColor('#1a5276')
DARK = HexColor('#2c3e50')
LIGHT_BLUE = HexColor('#d6eaf8')
LIGHT_GRAY = HexColor('#f2f3f4')
ACCENT = HexColor('#2980b9')
GREEN = HexColor('#27ae60')
RED = HexColor('#e74c3c')

styles = getSampleStyleSheet()

def zh(name, parent='Normal', **kw):
    defaults = {'fontName': FONT, 'wordWrap': 'CJK'}
    defaults.update(kw)
    return ParagraphStyle(name, parent=styles[parent], **defaults)

s_title = zh('ZHTitle', fontSize=22, textColor=BLUE, alignment=TA_CENTER, spaceAfter=6*mm, leading=28)
s_subtitle = zh('ZHSubtitle', fontSize=11, textColor=DARK, alignment=TA_CENTER, spaceAfter=12*mm, leading=14)
s_h1 = zh('ZHH1', fontSize=16, textColor=BLUE, spaceBefore=8*mm, spaceAfter=4*mm, leading=20)
s_h2 = zh('ZHH2', fontSize=13, textColor=DARK, spaceBefore=5*mm, spaceAfter=3*mm, leading=17)
s_h3 = zh('ZHH3', fontSize=11, textColor=ACCENT, spaceBefore=3*mm, spaceAfter=2*mm, leading=14)
s_body = zh('ZHBody', fontSize=9, leading=14, spaceAfter=2*mm)
s_formula = zh('ZHFormula', fontSize=9, leading=13, leftIndent=15, textColor=HexColor('#6c3483'),
               backColor=HexColor('#fef9e7'), borderPadding=4, spaceAfter=2*mm)
s_note = zh('ZHNote', fontSize=8, leading=11, textColor=HexColor('#7f8c8d'), leftIndent=10)
s_tc = zh('ZHTCell', fontSize=8, leading=11, alignment=TA_CENTER)
s_tl = zh('ZHTLeft', fontSize=8, leading=11)
s_small = zh('ZHSmall', fontSize=7.5, leading=10, alignment=TA_CENTER)

HEADER_STYLE = [
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, -1), FONT),
    ('FONTSIZE', (0, 0), (-1, 0), 8),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#bdc3c7')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]

def make_table(data, col_widths=None, extra_style=None):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = list(HEADER_STYLE)
    if extra_style:
        style.extend(extra_style)
    t.setStyle(TableStyle(style))
    return t

def P(text, style=s_body):
    return Paragraph(text, style)

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=HexColor('#bdc3c7'), spaceAfter=3*mm, spaceBefore=2*mm)

story = []

# ---- Cover ----
story.append(Spacer(1, 50*mm))
story.append(P('螺絲起子成本計算邏輯分析報告', s_title))
story.append(P('Screwdriver Cost Calculation Logic Analysis Report', s_subtitle))
story.append(Spacer(1, 15*mm))

cover_info = [
    ['項目', '內容'],
    ['產業別', '螺絲起子製造業'],
    ['分析範圍', '鐵材製造成本 + 最終定價（散裝/吊牌）'],
    ['資料來源', '成本分析數據.docx / 鐵材成本計算.xlsx / 2022 K25.xlsx'],
    ['產品數量', '410+ SKU（鐵材） / 500+ SKU（定價）'],
    ['報告日期', '2026-04-08'],
]
story.append(make_table(cover_info, col_widths=[35*mm, 120*mm]))
story.append(PageBreak())

# ---- TOC ----
story.append(P('目錄', s_h1))
story.append(hr())
toc_items = [
    '一、成本架構總覽',
    '二、模組 A — 鐵材製造成本（10 項工序）',
    '    2.1 鐵材原料成本',
    '    2.2 成形成本（十字/一字/六角）',
    '    2.3 熱處理成本',
    '    2.4 噴砂成本',
    '    2.5 電鍍成本',
    '    2.6 染黑（磷酸錳）成本',
    '    2.7 膠套成本',
    '    2.8 整直成本',
    '    2.9 六角環成本（可選）',
    '    2.10 貫通頭成本（可選）',
    '三、模組 B — 最終定價',
    '    3.1 手柄價格表',
    '    3.2 包裝費用',
    '    3.3 紙箱費用',
    '    3.4 運費',
    '    3.5 散裝售價計算流程',
    '    3.6 吊牌售價計算流程',
    '四、全域可調參數',
    '五、資料關聯圖',
    '六、計算範例驗證',
    '七、可維護單價系統設計',
]
for item in toc_items:
    indent = 15 if item.startswith('    ') else 0
    st = zh('toc_item', fontSize=9, leading=15, leftIndent=indent)
    story.append(P(item.strip(), st))
story.append(PageBreak())

# ==== Section 1 ====
story.append(P('一、成本架構總覽', s_h1))
story.append(hr())
story.append(P('本系統的成本計算分為三大階段：', s_body))

story.append(P('最終售價 = (鐵材成本 + 手柄成本 + 印刷費 + 包裝費 + 紙箱費 + 運費) x 漲幅倍率 x 稅率 x 利潤倍率', s_formula))

story.append(P('分兩大計算模組：', s_body))
story.append(P('<b>模組 A</b>：鐵材製造成本（鐵材成本計算.xlsx，14 張工序表）', s_body))
story.append(P('<b>模組 B</b>：最終定價（2022 K25.xlsx，散裝/吊牌兩種定價）', s_body))

stage_data = [
    ['階段', '內容', '公式'],
    ['階段 1', '鐵材製造成本', '10 項工序成本加總'],
    ['階段 2', '單支產品成本', '鐵材成本 + 手柄 + 印刷'],
    ['階段 3', '最終售價', '(總成本 + 包裝 + 紙箱 + 運費) x 漲幅 x 稅率 x 利潤'],
]
story.append(make_table(stage_data, col_widths=[25*mm, 40*mm, 95*mm]))
story.append(PageBreak())

# ==== Section 2 ====
story.append(P('二、模組 A — 鐵材製造成本', s_h1))
story.append(hr())

# 2.1
story.append(P('2.1 鐵材原料成本', s_h2))
story.append(P('<b>重量公式：</b>', s_body))
story.append(P('總長 = 外露長度 + 內含長度', s_formula))
story.append(P('重量(g) = 線徑<super>2</super> x 總長 x 鐵材比重', s_formula))
story.append(P('鐵材成本 = 重量 / 1000 x 單價(每公斤)', s_formula))

story.append(P('<b>材料比重常數表：</b>', s_body))
density_data = [
    ['材料形體', '比重值', '用途'],
    ['圓鐵', '0.00617', '最常用，適用 PH/PZ/SL 系列'],
    ['六角', '0.00680', '六角螺絲起子'],
    ['四角', '0.00785', '四角螺絲起子'],
]
story.append(make_table(density_data, col_widths=[30*mm, 25*mm, 80*mm]))

story.append(P('<b>鐵材單價查表（依鋼種+形體+線徑）：</b>', s_body))
story.append(P('單價 = 2022 基礎單價 x 預抓漲幅（目前 1.1）', s_formula))
iron_price = [
    ['鋼種', '形體', '線徑', '2022單價', '漲幅', '計算單價'],
    ['8660', '圓型', '3MM', '84.8', '1.1', '93.28'],
    ['8660', '圓型', '4MM', '69.8', '1.1', '76.78'],
    ['8660', '圓型', '4.5MM', '68.8', '1.1', '75.68'],
    ['8660', '圓型', '5~5.5MM', '58.8', '1.1', '64.68'],
    ['8660', '圓型', '6MM~', '57.8', '1.1', '63.58'],
    ['8660', '四角/六角', '2MM', '84.8', '1.1', '93.28'],
    ['8660', '四角/六角', '3MM', '84.8', '1.1', '93.28'],
]
story.append(make_table(iron_price, col_widths=[18*mm, 22*mm, 22*mm, 22*mm, 18*mm, 22*mm]))
story.append(P('* 3MM 產品使用 Q17 參照（對應 8660 圓型 5~5.5MM 的 102.08 單價）', s_note))

# 2.2
story.append(P('2.2 成形成本（十字/一字/六角）', s_h2))
story.append(P('<b>計價方式：</b>依線徑 + 總長區間查表，固定單價/支', s_body))
story.append(P('成形成本 = 查表單價 x 漲幅', s_formula))
story.append(P('附加費用：TP 鑽孔 +1 元、打字 +0.2 元', s_note))

forming_data = [
    ['線徑範圍', '長度區間', '2022單價', '漲幅', '計算單價'],
    ['PH 3.4MM', '200以下', '0.9', '1.1', '0.99'],
    ['PH 3.4MM', '201~250', '1.3', '1.1', '1.43'],
    ['PH 3.4MM', '251~300', '1.5', '1.1', '1.65'],
    ['PH 3.4MM', '301~350', '2.0', '1.1', '2.20'],
    ['PH 3.4MM', '351~400', '3.0', '1.1', '3.30'],
    ['PH 5.6MM', '100以下', '0.8', '1.1', '0.88'],
    ['PH 5.6MM', '101~200', '0.9', '1.1', '0.99'],
]
story.append(make_table(forming_data, col_widths=[28*mm, 28*mm, 22*mm, 18*mm, 22*mm]))

# 2.3
story.append(P('2.3 熱處理成本', s_h2))
story.append(P('<b>計價方式：</b>重量 x 每公斤單價', s_body))
story.append(P('熱處理成本 = 重量(g) x 單價/kg / 1000', s_formula))
story.append(P('<b>特殊邏輯：</b>預抓 10mm 廢料（精密柄/小柄 60+10mm，中柄 80+10mm，大柄 100+10mm，陀螺 45+10mm）', s_note))

heat_data = [
    ['材質', '線徑/尺寸', '2022單價', '漲幅', '計算單價'],
    ['8660.S2', '3.8MM以下', '15', '1.2', '18'],
    ['8660.S2', '4MM以上', '10.2', '1.2', '12.24'],
    ['8660.S2', '總長500MM以上', '31.2', '1.2', '37.44'],
    ['6150', '拔釘器 300MM以下', '10.2', '1.2', '12.24'],
]
story.append(make_table(heat_data, col_widths=[25*mm, 35*mm, 22*mm, 18*mm, 22*mm]))

# 2.4
story.append(PageBreak())
story.append(P('2.4 噴砂成本', s_h2))
story.append(P('<b>計價方式：</b>重量 x 每公斤單價（預抓 15% 漲幅）', s_body))
story.append(P('噴砂成本 = 重量(g) x 單價/kg / 1000', s_formula))

sand_data = [
    ['線徑', '長度區間', '2022單價', '漲幅', '計算單價'],
    ['3MM', '—', '35', '1.05', '36.75'],
    ['4MM', '465以下', '12', '1.05', '12.60'],
    ['4MM', '466~580', '18', '1.05', '18.90'],
    ['5MM', '465以下', '12', '1.05', '12.60'],
    ['5MM', '466~580', '18', '1.05', '18.90'],
]
story.append(make_table(sand_data, col_widths=[22*mm, 28*mm, 22*mm, 18*mm, 22*mm]))

# 2.5
story.append(P('2.5 電鍍成本', s_h2))
story.append(P('<b>計價方式：</b>固定單價/支（依線徑 + 總長區間查表，不乘重量）', s_body))
story.append(P('電鍍成本 = 查表單價（固定/支）', s_formula))

plating_data = [
    ['線徑', '長度區間', '2022單價', '漲幅', '計算單價'],
    ['3MM', '100以下', '0.87', '1.05', '0.9135'],
    ['3MM', '100~159', '1.09', '1.05', '1.1445'],
    ['3MM', '160~210', '1.74', '1.05', '1.827'],
    ['3MM', '211~365', '3.63', '1.05', '3.8115'],
    ['4MM', '100以下', '0.87', '1.05', '0.9135'],
    ['4MM', '100~149', '1.10', '1.05', '1.155'],
    ['4MM', '150~200', '1.40', '1.05', '1.47'],
    ['4MM', '201~240', '1.80', '1.05', '1.89'],
    ['4MM', '241~300', '2.18', '1.05', '2.289'],
]
story.append(make_table(plating_data, col_widths=[22*mm, 28*mm, 22*mm, 18*mm, 22*mm]))

# 2.6
story.append(P('2.6 染黑（磷酸錳）成本', s_h2))
story.append(P('<b>計價方式混合：</b>3MM 固定單價/支；4MM 以上重量 x 每公斤單價', s_body))

black_data = [
    ['線徑', '計價方式', '2022基礎', '漲幅', '計算單價'],
    ['3MM', '固定/支', '0.35', '1.05', '0.3675'],
    ['4MM', '重量計(10/KG)', '15', '1.05', '15.75'],
    ['5MM', '重量計(10/KG)', '15', '1.05', '15.75'],
    ['6MM', '重量計(9/KG)', '13.5', '1.05', '14.175'],
    ['6MM以上', '重量計(9/KG)', '13.5', '1.05', '14.175'],
]
story.append(make_table(black_data, col_widths=[22*mm, 30*mm, 22*mm, 18*mm, 22*mm]))

# 2.7
story.append(P('2.7 膠套成本', s_h2))
story.append(P('<b>計價方式：</b>固定單價/支 = (膠套顆粒價 + 穿工費) x 漲幅', s_body))

sleeve_data = [
    ['線徑', '顆/價格', '穿工', '合計', '漲幅', '計算單價'],
    ['PH3MM', '0.09', '0.2', '0.29', '1.1', '0.319'],
    ['PH4MM', '0.09', '0.2', '0.29', '1.1', '0.319'],
    ['PH5MM', '0.18', '0.2', '0.38', '1.1', '0.418'],
    ['PH6MM', '0.21', '0.2', '0.41', '1.1', '0.451'],
    ['PH8MM', '0.23', '0.2', '0.43', '1.1', '0.473'],
    ['PH10MM', '0.23', '0.2', '0.43', '1.1', '0.473'],
]
story.append(make_table(sleeve_data, col_widths=[20*mm, 18*mm, 15*mm, 15*mm, 15*mm, 22*mm]))

# 2.8
story.append(P('2.8 整直成本', s_h2))
story.append(P('<b>計價方式：</b>總長 / 25mm x 區間單價', s_body))
story.append(P('整直成本 = 總長 / 25 x 區間單價', s_formula))
story.append(P('整直標準：3MM 線徑 130MM 以上才需要整直', s_note))

straight_data = [
    ['線徑', '長度區間', '2022單價', '漲幅', '計算單價'],
    ['3.4.5MM', '0~200', '0.18', '1.05', '0.189'],
    ['3.4.5MM', '201~300', '0.24', '1.05', '0.252'],
    ['3.4.5MM', '301~400', '0.30', '1.05', '0.315'],
    ['6MM', '0~300', '0.18', '1.05', '0.189'],
    ['6MM', '301~450', '0.30', '1.05', '0.315'],
]
story.append(make_table(straight_data, col_widths=[22*mm, 28*mm, 22*mm, 18*mm, 22*mm]))

# 2.9
story.append(PageBreak())
story.append(P('2.9 六角環成本（可選附加）', s_h2))
story.append(P('六角環成本 = (鍛品 + 車修加工 + 熱處理 + 噴砂 + 電鍍 + 焊工) x 1.05', s_formula))

hex_data = [
    ['尺寸', '鍛品', '車修', '熱處理', '噴砂', '電鍍', '焊工', '合計', '漲幅後'],
    ['5MM', '3.0', '1.0', '0', '0', '0', '1.0', '5.0', '5.25'],
    ['6MM', '3.0', '1.0', '0', '0', '0', '1.0', '5.0', '5.25'],
    ['7MM', '3.2', '1.0', '0', '0', '0', '1.0', '5.2', '5.46'],
    ['8MM', '3.2', '1.0', '0', '0', '0', '1.0', '5.2', '5.46'],
]
story.append(make_table(hex_data, col_widths=[15*mm, 15*mm, 13*mm, 15*mm, 13*mm, 13*mm, 13*mm, 13*mm, 18*mm]))

# 2.10
story.append(P('2.10 貫通頭成本（可選附加）', s_h2))
story.append(P('貫通頭成本 = (鍛品 + 加工) x 漲幅', s_formula))

thru_data = [
    ['尺寸', '鍛品', '加工', '合計', '漲幅', '計算單價'],
    ['4MM', '3.72', '3.64', '7.36', '1.05', '7.728'],
    ['5MM', '3.72', '3.64', '7.36', '1.05', '7.728'],
    ['6MM', '5.00', '4.29', '9.29', '1.05', '9.755'],
    ['7MM', '7.80', '5.33', '13.13', '1.05', '13.787'],
    ['8MM', '7.80', '5.33', '13.13', '1.05', '13.787'],
]
story.append(make_table(thru_data, col_widths=[18*mm, 18*mm, 18*mm, 18*mm, 18*mm, 22*mm]))

story.append(P('2.11 鐵材總成本公式', s_h2))
story.append(P('鐵材總成本 = 鐵材 + 成形 + 熱處理 + 噴砂 + 電鍍 + 染黑 + 膠套 + 整直 + [六角環] + [貫通頭]', s_formula))
story.append(P('六角環和貫通頭為可選項，以 Y/N 標記', s_note))

# ==== Section 3 ====
story.append(PageBreak())
story.append(P('三、模組 B — 最終定價', s_h1))
story.append(hr())

# 3.1
story.append(P('3.1 手柄價格表', s_h2))
story.append(P('手柄價格依型號 x 大小交叉查表。以下為各型號手柄單價：', s_body))

handle_data = [
    ['型號', '大大柄', '大柄', '中柄', '小柄', '精密柄', '陀螺', '充接柄'],
    ['978', '—', '9.1', '7.1', '5.3', '—', '5.0', '—'],
    ['984', '—', '9.2', '7.0', '3.7', '—', '4.0', '—'],
    ['986', '—', '9.0', '7.0', '4.2', '—', '5.5', '—'],
    ['987', '—', '8.3', '5.9', '3.4', '—', '4.7', '—'],
    ['988', '—', '8.8', '6.2', '3.8', '—', '4.2', '—'],
    ['992', '—', '12.3', '10.3', '8.0', '—', '6.5', '—'],
    ['993', '—', '7.6', '5.7', '2.84', '2.5', '4.1', '6.5'],
    ['995', '—', '7.9', '6.7', '4.8', '3.5', '4.2', '—'],
]
story.append(make_table(handle_data, col_widths=[18*mm, 18*mm, 16*mm, 16*mm, 16*mm, 16*mm, 16*mm, 18*mm]))

story.append(P('<b>K25 定價表預設手柄價格：</b>', s_body))
default_handle = [
    ['手柄大小', '大大柄', '大柄', '中柄', '小柄', '陀螺'],
    ['預設單價', '10.88', '9.41', '8.09', '6.17', '7.59'],
]
story.append(make_table(default_handle, col_widths=[25*mm, 22*mm, 22*mm, 22*mm, 22*mm, 22*mm]))

# 3.2
story.append(P('3.2 包裝費用查表', s_h2))
pkg_data = [
    ['包裝方式', '手工', '吊牌', '貼工', '2022費用', '漲幅', '總費用'],
    ['散裝', '0.8', '0', '0', '0.8', '1', '0.8'],
    ['普通吊牌', '0.5', '1.2', '0.4', '2.1', '1', '2.1'],
    ['防盜吊牌', '0.5', '1.2', '0.4', '2.1', '1', '2.1'],
    ['綁卡', '0.5', '1.2', '0.4', '2.1', '1', '2.1'],
]
story.append(make_table(pkg_data, col_widths=[25*mm, 16*mm, 16*mm, 16*mm, 20*mm, 16*mm, 20*mm]))

# 3.3
story.append(P('3.3 紙箱費用查表（手柄大小 x 裝量）', s_h2))
story.append(P('紙箱最終費用 = 基礎費率 x 預抓漲幅(1.08)', s_formula))

box_data = [
    ['手柄\\裝量', '38', '60', '80', '100', '150', '200', '250', '300', '350', '400', '450', '500'],
    ['陀螺', '0.78', '', '', '', '', '', '', '', '', '', '', ''],
    ['精密柄', '', '0.35', '0.35', '0.37', '0.39', '0.42', '', '', '', '', '', ''],
    ['小柄', '', '0.70', '0.70', '0.73', '0.77', '0.81', '0.89', '0.92', '1.00', '1.12', '1.18', '1.24'],
    ['中柄', '', '', '', '0.84', '0.90', '0.97', '1.04', '1.10', '1.16', '1.22', '1.28', '1.34'],
    ['大柄', '', '', '', '1.08', '1.14', '1.20', '1.28', '1.34', '1.40', '1.46', '1.52', '1.58'],
]
story.append(make_table(box_data, col_widths=[20*mm] + [11.5*mm]*11))

# 3.4
story.append(P('3.4 運費查表（手柄大小 x 總長區間）', s_h2))
story.append(P('運費 = 基礎費率 x 預抓漲幅(3)', s_formula))

ship_data = [
    ['手柄\\總長', '0~100', '101~200', '201~400', '400以上'],
    ['陀螺', '0.17', '', '', ''],
    ['精密柄', '0.17', '0.19', '0.25', '0.37'],
    ['小柄', '0.17', '0.19', '0.25', '0.37'],
    ['中柄', '', '0.19', '0.25', '0.37'],
    ['大柄', '', '0.25', '0.34', '0.37'],
]
story.append(make_table(ship_data, col_widths=[25*mm, 25*mm, 25*mm, 25*mm, 25*mm]))

# 3.5
story.append(PageBreak())
story.append(P('3.5 散裝售價計算流程', s_h2))
bulk_flow = [
    ['步驟', '公式', '說明'],
    ['1', '手柄成本 = 鐵材價格 + 手柄價格 + 印刷費', '印刷費固定 1 元'],
    ['2', '總成本 = 手柄成本 + 包裝費 + 紙箱費 + 運費', '各項查表'],
    ['3', '調整後成本 = 總成本 x 預抓漲幅', '預設 1.0'],
    ['4', '稅後成本 = 調整後成本 x 稅率', '稅率 1.061 (6.1%)'],
    ['5', '散裝售價 = 稅後成本 x 利潤倍率', '預設 1.5'],
    ['6', '利潤 = 散裝售價 - 稅後成本', ''],
    ['7', '美金價 = 散裝售價 / 匯率', '匯率 29.5'],
]
story.append(make_table(bulk_flow, col_widths=[15*mm, 70*mm, 50*mm]))

# 3.6
story.append(P('3.6 吊牌售價計算流程', s_h2))
tag_flow = [
    ['步驟', '公式', '說明'],
    ['1', '手柄成本 = 鐵材價格 + 手柄價格 + 印刷費', '印刷費固定 1 元'],
    ['2', '總成本 = 手柄成本 + 貼紙 + 吊牌 + 包裝 + 紙箱 + 運費', '貼紙 0.8 元'],
    ['3', '調整後成本 = 總成本 x 預抓漲幅', '預設 1.0'],
    ['4', '稅後成本 = 調整後成本 x 稅率', '稅率 1.061 (6.1%)'],
    ['5', '吊牌售價 = 稅後成本 x 利潤倍率', '預設 1.5'],
    ['6', '利潤 = 吊牌售價 - 稅後成本', ''],
    ['7', '美金價 = 吊牌售價 / 匯率', '匯率 29.5'],
]
story.append(make_table(tag_flow, col_widths=[15*mm, 75*mm, 48*mm]))

# ==== Section 4 ====
story.append(P('四、全域可調參數', s_h1))
story.append(hr())

param_data = [
    ['參數', '預設值', '位置', '影響範圍'],
    ['材料比重（圓鐵）', '0.00617', '模組 A', '所有圓鐵產品重量'],
    ['材料比重（六角）', '0.00680', '模組 A', '所有六角產品重量'],
    ['材料比重（四角）', '0.00785', '模組 A', '所有四角產品重量'],
    ['各工序預抓漲幅', '1.05~1.2', '各工序表', '對應工序成本'],
    ['稅率', '1.061 (6.1%)', '模組 B', '所有產品售價'],
    ['利潤倍率（散裝）', '1.5', '模組 B', '散裝售價'],
    ['利潤倍率（吊牌）', '1.4~1.5', '模組 B', '吊牌售價'],
    ['印刷費', '1.0 元/支', '模組 B', '所有產品'],
    ['包裝費（散裝）', '0.8 元', '模組 B', '散裝產品'],
    ['貼紙費（吊牌）', '0.8 元', '模組 B', '吊牌產品'],
    ['紙箱漲幅', '1.08', '模組 B', '所有紙箱費'],
    ['運費漲幅', '3', '模組 B', '所有運費'],
    ['匯率', '29.5', '模組 B', '所有美金價'],
]
story.append(make_table(param_data, col_widths=[30*mm, 25*mm, 20*mm, 55*mm]))

# ==== Section 5 ====
story.append(PageBreak())
story.append(P('五、資料關聯圖', s_h1))
story.append(hr())

flow_data = [
    ['層級', '內容', '資料來源'],
    ['輸入', '線徑、外露長度、內含長度、材料類型、手柄大小、產品類型', '使用者輸入'],
    ['模組A-1', '鐵材原料（重量 x 單價/kg）', '鐵材單價表'],
    ['模組A-2', '成形（依線徑+長度查表）', '成形單價表'],
    ['模組A-3', '熱處理（重量 x 單價/kg）', '熱處理單價表'],
    ['模組A-4', '噴砂（重量 x 單價/kg）', '噴砂單價表'],
    ['模組A-5', '電鍍（依線徑+長度查表）', '電鍍單價表'],
    ['模組A-6', '染黑（混合計價）', '染黑單價表'],
    ['模組A-7', '膠套（顆粒+穿工）', '膠套單價表'],
    ['模組A-8', '整直（總長/25 x 單價）', '整直單價表'],
    ['模組A-9', '六角環 [可選]', '六角環單價表'],
    ['模組A-10', '貫通頭 [可選]', '貫通頭單價表'],
    ['匯總', '鐵材總成本 = 以上加總', '—'],
    ['模組B', '+ 手柄 + 印刷 + 包裝 + 紙箱 + 運費', '手柄/包裝/紙箱/運費表'],
    ['定價', 'x 漲幅 x 稅率 x 利潤倍率', '全域參數'],
    ['輸出', '最終售價 / 利潤 / 美金價', '計算結果'],
]
story.append(make_table(flow_data, col_widths=[22*mm, 70*mm, 40*mm]))

# ==== Section 6 ====
story.append(PageBreak())
story.append(P('六、計算範例驗證', s_h1))
story.append(hr())

story.append(P('範例 1：PH0X60（3mm 小柄）', s_h2))
story.append(P('規格：線徑 3mm、外露 60mm、內含 60mm、圓鐵、小柄', s_body))

story.append(P('<b>模組 A — 鐵材製造成本</b>', s_h3))
ex1a = [
    ['工序', '計算過程', '成本'],
    ['鐵材', '3x3x120x0.00617=6.6636g / 1000 x 102.08', '0.6802'],
    ['成形', 'PH3.4mm, 120<200, 0.9x1.1', '0.9900'],
    ['熱處理', '6.6636 x 18 / 1000', '0.1199'],
    ['噴砂', '6.6636 x 36.75 / 1000', '0.2449'],
    ['電鍍', '3mm, 100~159區間, 1.09x1.05', '0.9135'],
    ['染黑', '3mm 固定, 0.35x1.05', '0.3675'],
    ['膠套', '(0.09+0.2)x1.1', '0.3190'],
    ['整直', '120<130mm 不需整直', '0.0000'],
    ['鐵材總成本', '', '3.6351'],
]
story.append(make_table(ex1a, col_widths=[22*mm, 75*mm, 22*mm],
    extra_style=[('BACKGROUND', (-1, -1), (-1, -1), HexColor('#d5f5e3'))]))

story.append(P('<b>模組 B — 散裝售價</b>', s_h3))
ex1b = [
    ['步驟', '計算', '金額'],
    ['鐵材價格', '(模組A或直接輸入)', '3.82'],
    ['+ 手柄（小柄）', '', '6.17'],
    ['+ 印刷費', '固定', '1.00'],
    ['= 手柄成本', '3.82+6.17+1', '10.99'],
    ['+ 包裝費', '散裝', '0.80'],
    ['+ 紙箱費', '小柄, 0.70x1.08', '0.756'],
    ['+ 運費', '小柄, 0~100, 0.19x3', '0.57'],
    ['= 總成本', '', '13.116'],
    ['x 稅率', 'x1.061', '13.916'],
    ['x 利潤倍率', 'x1.5', '20.874'],
    ['利潤', '20.874-13.916', '6.958'],
    ['美金價', '20.874/29.5', '0.708'],
]
story.append(make_table(ex1b, col_widths=[25*mm, 55*mm, 22*mm],
    extra_style=[('BACKGROUND', (-1, -1), (-1, -1), HexColor('#d5f5e3')),
                 ('BACKGROUND', (-1, 5), (-1, 5), HexColor('#fdebd0'))]))

story.append(P('<b>模組 B — 吊牌售價</b>', s_h3))
ex1c = [
    ['步驟', '計算', '金額'],
    ['手柄成本', '同上', '10.99'],
    ['+ 貼紙費', '固定', '0.80'],
    ['+ 吊牌費', '(0.5+1.2+0.4)x1', '2.10'],
    ['+ 包裝費', '固定', '0.80'],
    ['+ 紙箱費', '吊牌小柄, 0.75x1.08', '0.864'],
    ['+ 運費', '吊牌小柄, 0~99, 0.18x3', '0.54'],
    ['= 總成本', '', '16.094'],
    ['x 稅率 x 利潤', 'x1.061 x1.5', '25.614'],
    ['利潤', '25.614-17.076', '8.538'],
    ['美金價', '25.614/29.5', '0.868'],
]
story.append(make_table(ex1c, col_widths=[25*mm, 55*mm, 22*mm],
    extra_style=[('BACKGROUND', (-1, -1), (-1, -1), HexColor('#d5f5e3'))]))

story.append(P('範例 2：PH1X200（5mm 小柄，含六角環）', s_h2))
ex2 = [
    ['工序', '成本'],
    ['鐵材', '3.2557'],
    ['成形', '1.4300'],
    ['熱處理', '0.4909'],
    ['噴砂', '0.5053'],
    ['電鍍', '2.6250'],
    ['染黑', '0.6317'],
    ['膠套', '0.4180'],
    ['整直', '2.6208'],
    ['小計', '11.977'],
    ['+ 六角環', '4.200'],
    ['含六角環總成本', '16.177'],
]
story.append(make_table(ex2, col_widths=[30*mm, 25*mm],
    extra_style=[('BACKGROUND', (-1, -1), (-1, -1), HexColor('#d5f5e3'))]))

story.append(P('範例 3：PH2X100 JIS（6mm 中柄）散裝', s_h2))
ex3 = [
    ['項目', '金額'],
    ['鐵材價格', '8.00'],
    ['手柄（中柄）', '7.80'],
    ['印刷費', '1.00'],
    ['手柄成本', '16.80'],
    ['包裝+紙箱+運費', '0.80+0.907+0.57=2.277'],
    ['總成本', '19.077'],
    ['散裝售價 (x1.061x1.5)', '30.361'],
    ['利潤', '10.120'],
    ['美金價', '1.029'],
]
story.append(make_table(ex3, col_widths=[40*mm, 40*mm],
    extra_style=[('BACKGROUND', (-1, -1), (-1, -1), HexColor('#d5f5e3'))]))

# ==== Section 7 ====
story.append(PageBreak())
story.append(P('七、可維護單價系統設計', s_h1))
story.append(hr())
story.append(P('<b>核心需求：</b>所有原物料單價、加工單價、漲幅倍率等參數都要能在軟體中直接修改，修改後自動連動重算所有相關產品的成本和售價。', s_body))

story.append(P('7.1 需維護的 12 張價格表', s_h2))

maintain_data = [
    ['編號', '價格表', '可編輯欄位', '連動影響'],
    ['A', '鐵材原料單價', '鋼種+形體+線徑 -> 基礎單價、漲幅', '所有產品鐵材成本'],
    ['B', '成形單價(十字/一字/六角)', '線徑+長度區間 -> 基礎單價、漲幅', '所有產品成形成本'],
    ['C', '熱處理單價', '材質+尺寸 -> 基礎單價、漲幅', '所有產品熱處理成本'],
    ['D', '噴砂單價', '線徑+長度 -> 基礎單價、漲幅', '所有產品噴砂成本'],
    ['E', '電鍍單價', '線徑+長度區間 -> 基礎單價、漲幅', '所有產品電鍍成本'],
    ['F', '染黑單價', '線徑 -> 基礎單價、漲幅', '所有產品染黑成本'],
    ['G', '膠套單價', '線徑 -> 顆粒價/穿工費、漲幅', '所有產品膠套成本'],
    ['H', '整直單價', '線徑+長度區間 -> 基礎單價、漲幅', '所有產品整直成本'],
    ['I', '六角環/貫通頭', '尺寸 -> 各子項單價、漲幅', '需要該零件的產品'],
    ['J', '手柄價格', '型號 x 大小 -> 單價', '所有產品售價'],
    ['K', '包裝/紙箱/運費', '各方式費率、漲幅', '所有包裝/紙箱/運費'],
    ['L', '全域參數', '稅率/利潤/匯率/比重/印刷費', '所有產品'],
]
story.append(make_table(maintain_data, col_widths=[12*mm, 35*mm, 50*mm, 38*mm]))

story.append(P('7.2 連動計算機制', s_h2))
story.append(P('<b>設計原則：</b>', s_body))

principles = [
    ['原則', '說明'],
    ['公式驅動', '所有計算都是公式驅動，不存硬編碼的結果值'],
    ['集中管理', '單價表集中管理，產品只存規格參數（線徑、長度、手柄類型等）'],
    ['即時連動', '修改單價後，前端即時顯示所有產品的新價格'],
    ['對比預覽', '支援「調整前 vs 調整後」對比預覽'],
]
story.append(make_table(principles, col_widths=[25*mm, 110*mm]))

story.append(P('修改任一單價 -> 即時重算所有受影響產品的該工序成本 -> 鐵材總成本 -> 各包裝方式的最終售價 -> 利潤和美金價', s_formula))

# ---- Footer note ----
story.append(Spacer(1, 15*mm))
story.append(hr())
story.append(P('— 報告結束 —', zh('end', fontSize=10, alignment=TA_CENTER, textColor=HexColor('#95a5a6'))))

# Build PDF
output_path = '/Users/tim/webapps/sundove cost/螺絲起子成本計算邏輯分析報告.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4,
                        topMargin=20*mm, bottomMargin=15*mm,
                        leftMargin=15*mm, rightMargin=15*mm)
doc.build(story)
print(f'PDF generated: {output_path}')
