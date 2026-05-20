from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_LEFT
from models.review_response import ReviewResponse
import io

SEVERITY_COLORS = {
    'critical': colors.HexColor('#ef4444'),
    'high':     colors.HexColor('#f97316'),
    'medium':   colors.HexColor('#eab308'),
    'low':      colors.HexColor('#3b82f6'),
    'info':     colors.HexColor('#6b7280'),
}

def generate_pdf(result: ReviewResponse, filename: str = "review") -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('title',
        fontName='Helvetica-Bold', fontSize=20,
        textColor=colors.HexColor('#1a1a18'), spaceAfter=4
    )
    subtitle_style = ParagraphStyle('subtitle',
        fontName='Helvetica', fontSize=10,
        textColor=colors.HexColor('#888880'), spaceAfter=2
    )
    section_style = ParagraphStyle('section',
        fontName='Helvetica-Bold', fontSize=9,
        textColor=colors.HexColor('#888880'), spaceAfter=8,
        spaceBefore=16, letterSpacing=1.5
    )
    body_style = ParagraphStyle('body',
        fontName='Helvetica', fontSize=10,
        textColor=colors.HexColor('#1a1a18'), leading=16, spaceAfter=4
    )
    suggestion_style = ParagraphStyle('suggestion',
        fontName='Helvetica', fontSize=9,
        textColor=colors.HexColor('#555550'), leading=14
    )
    mono_style = ParagraphStyle('mono',
        fontName='Courier', fontSize=9,
        textColor=colors.HexColor('#444440'), leading=14
    )

    story = []

    # Header
    story.append(Paragraph("CODEGUARD", title_style))
    story.append(Paragraph(f"Security Analysis Report — {filename}", subtitle_style))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e0ddd8')))
    story.append(Spacer(1, 4*mm))

    # Summary table
    sev_color = SEVERITY_COLORS.get(result.overall_severity, colors.gray)
    summary_data = [
        ['Language', result.language],
        ['Overall Severity', result.overall_severity.upper()],
        ['Total Findings', str(len(result.findings))],
    ]
    summary_table = Table(summary_data, colWidths=[40*mm, 120*mm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#888880')),
        ('TEXTCOLOR', (1,0), (1,-1), colors.HexColor('#1a1a18')),
        ('TEXTCOLOR', (1,1), (1,1), sev_color),
        ('FONTNAME', (1,1), (1,1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor('#f8f6f2'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', [4]),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 4*mm))

    # Summary text
    story.append(Paragraph("SUMMARY", section_style))
    story.append(Paragraph(result.summary, body_style))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e0ddd8')))

    # Findings
    story.append(Paragraph(f"FINDINGS ({len(result.findings)})", section_style))

    for i, finding in enumerate(result.findings):
        sev_color = SEVERITY_COLORS.get(finding.severity, colors.gray)
        line_info = f"  ·  line {finding.line}" if finding.line else ""

        # Finding header row
        header_data = [[
            Paragraph(f"<b>{finding.severity.upper()}</b>", ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=9, textColor=sev_color)),
            Paragraph(f"{finding.category}{line_info}", mono_style),
        ]]
        header_table = Table(header_data, colWidths=[25*mm, 135*mm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f6f2')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph(finding.message, body_style))
        story.append(Spacer(1, 1*mm))
        story.append(Paragraph(f"→  {finding.suggestion}", suggestion_style))

        if i < len(result.findings) - 1:
            story.append(Spacer(1, 3*mm))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#eeebe6'), dash=(2,4)))
            story.append(Spacer(1, 2*mm))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()