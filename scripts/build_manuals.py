"""
E.L.L.A. — PDF Manual Builder
Converts docs/deutsch/bedienungsanleitung.md and docs/english/bedienungsanleitung.md to PDF.
Output: docs/deutsch/ELLA-Bedienungsanleitung.pdf and docs/english/ELLA-User-Manual.pdf
"""

import re
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Brand colors
ACCENT = colors.HexColor('#7c6af7')
DARK   = colors.HexColor('#161926')
LIGHT  = colors.HexColor('#f5f5f7')
MUTED  = colors.HexColor('#888888')
CODE_BG = colors.HexColor('#f0eeff')
NOTE_BG = colors.HexColor('#f0f4ff')

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

# ── Styles ────────────────────────────────────────────────────────────────────

def make_styles():
    base = dict(fontName='Helvetica', fontSize=10, leading=15, textColor=DARK,
                spaceAfter=6, spaceBefore=2)

    return {
        'h1': ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=22,
                             leading=28, textColor=ACCENT, spaceAfter=12, spaceBefore=20),
        'h2': ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=15,
                             leading=20, textColor=ACCENT, spaceAfter=8, spaceBefore=18),
        'h3': ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=12,
                             leading=16, textColor=DARK, spaceAfter=6, spaceBefore=12),
        'body': ParagraphStyle('body', **base),
        'note': ParagraphStyle('note', fontName='Helvetica-Oblique', fontSize=9,
                               leading=13, textColor=colors.HexColor('#444466'),
                               leftIndent=8, spaceAfter=6, spaceBefore=4,
                               borderPad=4),
        'li': ParagraphStyle('li', fontName='Helvetica', fontSize=10,
                             leading=14, textColor=DARK, leftIndent=12,
                             spaceAfter=3, spaceBefore=1, bulletIndent=4),
        'code_line': ParagraphStyle('code_line', fontName='Courier', fontSize=8,
                                    leading=12, textColor=DARK,
                                    leftIndent=8, spaceAfter=1, spaceBefore=1),
        'caption': ParagraphStyle('caption', fontName='Helvetica', fontSize=8,
                                  textColor=MUTED, spaceAfter=4, spaceBefore=2),
        'footer': ParagraphStyle('footer', fontName='Helvetica', fontSize=8,
                                 textColor=MUTED, alignment=TA_CENTER),
        'toc_h1': ParagraphStyle('toc_h1', fontName='Helvetica-Bold', fontSize=11,
                                  textColor=ACCENT, spaceAfter=4, spaceBefore=2),
        'toc_entry': ParagraphStyle('toc_entry', fontName='Helvetica', fontSize=10,
                                     textColor=DARK, leftIndent=8, spaceAfter=3),
    }


# ── Markdown parser ────────────────────────────────────────────────────────────

def inline(text, styles):
    """Convert inline markdown (bold, italic, code) to ReportLab XML."""
    # protect backtick code spans first — replace with placeholder
    codes = []
    def save_code(m):
        codes.append(m.group(1))
        return f'\x00CODE{len(codes)-1}\x00'
    text = re.sub(r'`(.+?)`', save_code, text)

    # escape XML special chars
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    # **bold** (must come before single-star italic)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # *italic* (star only — underscores are common in identifiers)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # _italic_ only when surrounded by spaces or start/end (not inside words)
    text = re.sub(r'(?<!\w)_(.+?)_(?!\w)', r'<i>\1</i>', text)

    # restore code spans
    for idx, code in enumerate(codes):
        safe = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        text = text.replace(f'\x00CODE{idx}\x00',
                            f'<font name="Courier" size="9">{safe}</font>')
    return text


def parse_table(lines):
    """Parse a markdown table block. Returns list of rows (list of strings)."""
    rows = []
    for line in lines:
        if re.match(r'^\s*\|[-| :]+\|\s*$', line):
            continue  # separator row
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        rows.append(cells)
    return rows


def build_table_flowable(rows, styles):
    if not rows:
        return None
    s = styles['body']
    # header row bold
    header = [Paragraph(f'<b>{inline(c, styles)}</b>', s) for c in rows[0]]
    data = [header]
    for row in rows[1:]:
        data.append([Paragraph(inline(c, styles), s) for c in row])

    col_count = max(len(r) for r in data)
    avail = PAGE_W - 2 * MARGIN
    col_w = avail / col_count

    t = Table(data, colWidths=[col_w] * col_count, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f4f2ff')]),
        ('GRID',       (0, 0), (-1, -1), 0.4, colors.HexColor('#cccccc')),
        ('VALIGN',     (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',  (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING',   (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 3),
    ]))
    return t


def md_to_flowables(md_text, styles):
    flowables = []
    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_lines = []
    table_lines = []
    in_table = False

    def flush_code():
        nonlocal code_lines
        if code_lines:
            from reportlab.platypus import KeepTogether
            block = [Spacer(1, 2)]
            for cl in code_lines:
                block.append(Paragraph(cl.replace(' ', '&nbsp;')
                                         .replace('<', '&lt;')
                                         .replace('>', '&gt;')
                                         .replace('&', '&amp;'),
                                       styles['code_line']))
            # wrap in a shaded box via Table
            inner_text = '\n'.join(code_lines)
            inner_text = inner_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            pre = Preformatted(inner_text, styles['code_line'])
            t = Table([[pre]], colWidths=[PAGE_W - 2 * MARGIN - 8])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
                ('LEFTPADDING',  (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING',   (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING',(0, 0), (-1, -1), 6),
                ('BOX', (0, 0), (-1, -1), 0.5, ACCENT),
            ]))
            flowables.append(t)
            flowables.append(Spacer(1, 4))
            code_lines = []

    def flush_table():
        nonlocal table_lines
        if table_lines:
            rows = parse_table(table_lines)
            t = build_table_flowable(rows, styles)
            if t:
                flowables.append(Spacer(1, 4))
                flowables.append(t)
                flowables.append(Spacer(1, 6))
            table_lines = []

    while i < len(lines):
        line = lines[i]

        # code fence
        if line.strip().startswith('```'):
            if in_code:
                in_code = False
                flush_code()
            else:
                flush_table()
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # table row
        if line.strip().startswith('|'):
            in_table = True
            table_lines.append(line)
            i += 1
            continue
        else:
            if in_table:
                in_table = False
                flush_table()

        # horizontal rule
        if re.match(r'^---+\s*$', line):
            flowables.append(Spacer(1, 4))
            flowables.append(HRFlowable(width='100%', thickness=0.5, color=ACCENT))
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # h1
        m = re.match(r'^# (.+)', line)
        if m:
            flowables.append(Paragraph(inline(m.group(1), styles), styles['h1']))
            i += 1
            continue

        # h2
        m = re.match(r'^## (.+)', line)
        if m:
            flowables.append(Paragraph(inline(m.group(1), styles), styles['h2']))
            i += 1
            continue

        # h3
        m = re.match(r'^### (.+)', line)
        if m:
            flowables.append(Paragraph(inline(m.group(1), styles), styles['h3']))
            i += 1
            continue

        # blockquote / note
        m = re.match(r'^>\s*(.*)', line)
        if m:
            content = m.group(1)
            t = Table([[Paragraph(inline(content, styles), styles['note'])]],
                      colWidths=[PAGE_W - 2 * MARGIN - 8])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), NOTE_BG),
                ('LEFTPADDING',  (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING',   (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING',(0, 0), (-1, -1), 5),
                ('LINEBEFORE', (0, 0), (0, -1), 3, ACCENT),
            ]))
            flowables.append(t)
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # list item
        m = re.match(r'^[-*] (.+)', line)
        if m:
            flowables.append(Paragraph(f'• {inline(m.group(1), styles)}', styles['li']))
            i += 1
            continue

        # numbered list
        m = re.match(r'^\d+\. (.+)', line)
        if m:
            flowables.append(Paragraph(f'• {inline(m.group(1), styles)}', styles['li']))
            i += 1
            continue

        # toc entries (skip — we skip the TOC section)
        if re.match(r'^\d+\. \[', line):
            i += 1
            continue

        # empty line
        if not line.strip():
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # plain paragraph
        flowables.append(Paragraph(inline(line, styles), styles['body']))
        i += 1

    flush_code()
    flush_table()
    return flowables


# ── Page template ──────────────────────────────────────────────────────────────

def make_doc(output_path, title):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN + 8 * mm, bottomMargin=MARGIN + 6 * mm,
        title=title,
        author='Andre Zabel',
        subject='E.L.L.A. Documentation',
    )
    return doc


def header_footer(canvas, doc, title):
    canvas.saveState()
    w, h = A4
    # header bar
    canvas.setFillColor(DARK)
    canvas.rect(0, h - 14 * mm, w, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(MARGIN, h - 9 * mm, 'E.L.L.A.')
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica', 9)
    canvas.drawString(MARGIN + 40, h - 9 * mm, title)
    # page number
    canvas.setFillColor(MUTED)
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(w - MARGIN, 10 * mm, f'{doc.page}')
    # footer line
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 14 * mm, w - MARGIN, 14 * mm)
    canvas.restoreState()


# ── Cover page ─────────────────────────────────────────────────────────────────

def make_cover(version, subtitle, styles):
    flowables = []
    flowables.append(Spacer(1, 40 * mm))

    # Logo text
    t = Table([[Paragraph('<font color="#7c6af7"><b>E.L.L.A.</b></font>',
                          ParagraphStyle('cover_logo', fontName='Helvetica-Bold',
                                         fontSize=48, textColor=ACCENT,
                                         alignment=TA_CENTER))]],
              colWidths=[PAGE_W - 2 * MARGIN])
    flowables.append(t)
    flowables.append(Spacer(1, 4 * mm))

    flowables.append(Paragraph('Embedded Local Logic Agent',
                                ParagraphStyle('cover_sub', fontName='Helvetica',
                                               fontSize=14, textColor=MUTED,
                                               alignment=TA_CENTER)))
    flowables.append(Spacer(1, 6 * mm))
    flowables.append(HRFlowable(width='60%', thickness=1, color=ACCENT,
                                hAlign='CENTER'))
    flowables.append(Spacer(1, 6 * mm))
    flowables.append(Paragraph(subtitle,
                                ParagraphStyle('cover_title', fontName='Helvetica-Bold',
                                               fontSize=18, textColor=DARK,
                                               alignment=TA_CENTER)))
    flowables.append(Spacer(1, 4 * mm))
    flowables.append(Paragraph(version,
                                ParagraphStyle('cover_ver', fontName='Helvetica',
                                               fontSize=11, textColor=MUTED,
                                               alignment=TA_CENTER)))
    flowables.append(Spacer(1, 60 * mm))
    flowables.append(Paragraph('© 2026 Andre Zabel, Berlin · ella-agent.de',
                                ParagraphStyle('cover_copy', fontName='Helvetica',
                                               fontSize=9, textColor=MUTED,
                                               alignment=TA_CENTER)))
    flowables.append(PageBreak())
    return flowables


# ── Build ──────────────────────────────────────────────────────────────────────

def build(md_path, pdf_path, pdf_title, cover_subtitle, version='v1.5.6'):
    styles = make_styles()

    with open(md_path, encoding='utf-8') as f:
        md = f.read()

    # Remove TOC section (lines 8-24 roughly) — skip "## Inhaltsverzeichnis" block
    md = re.sub(r'## (Inhaltsverzeichnis|Table of Contents)\n.*?(?=\n---|\n## )',
                '', md, flags=re.DOTALL)

    doc = make_doc(pdf_path, pdf_title)
    flowables = make_cover(version, cover_subtitle, styles)
    flowables += md_to_flowables(md, styles)

    doc.build(
        flowables,
        onFirstPage=lambda c, d: header_footer(c, d, pdf_title),
        onLaterPages=lambda c, d: header_footer(c, d, pdf_title),
    )
    print(f'  -> {pdf_path}')


if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print('Building E.L.L.A. manuals...')

    build(
        md_path=os.path.join(base, 'docs', 'deutsch', 'bedienungsanleitung.md'),
        pdf_path=os.path.join(base, 'docs', 'deutsch', 'ELLA-Bedienungsanleitung.pdf'),
        pdf_title='Bedienungsanleitung',
        cover_subtitle='Bedienungsanleitung',
    )

    build(
        md_path=os.path.join(base, 'docs', 'english', 'bedienungsanleitung.md'),
        pdf_path=os.path.join(base, 'docs', 'english', 'ELLA-User-Manual.pdf'),
        pdf_title='User Manual',
        cover_subtitle='User Manual',
    )

    build(
        md_path=os.path.join(base, 'docs', 'deutsch', 'eula.md'),
        pdf_path=os.path.join(base, 'docs', 'deutsch', 'ELLA-EULA.pdf'),
        pdf_title='Endnutzer-Lizenzvertrag',
        cover_subtitle='Endnutzer-Lizenzvertrag (EULA)',
    )

    build(
        md_path=os.path.join(base, 'docs', 'english', 'eula.md'),
        pdf_path=os.path.join(base, 'docs', 'english', 'ELLA-EULA.pdf'),
        pdf_title='End User License Agreement',
        cover_subtitle='End User License Agreement (EULA)',
    )

    print('Done.')
