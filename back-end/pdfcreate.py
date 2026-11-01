from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    PageBreak,
)


def create_heart_disease_pdf(
    Common_Warning_Signs_Symptoms,
    filename="Heart_Disease_Overview.pdf"
):
    # ============================================================
    # PAGE SETUP
    # ============================================================

    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=42,
        leftMargin=42,
        topMargin=55,
        bottomMargin=50,
        title="Heart Disease: Medical Overview & Details",
        author="Medical Information Document",
    )

    story = []

    # ============================================================
    # COLOR PALETTE
    # ============================================================

    PRIMARY = colors.HexColor("#A61B29")       # Medical crimson
    PRIMARY_DARK = colors.HexColor("#7E1420")
    SECONDARY = colors.HexColor("#263B4A")     # Deep slate
    ACCENT = colors.HexColor("#DCE9F2")
    LIGHT_BG = colors.HexColor("#F6F8FA")
    LIGHT_RED = colors.HexColor("#FDEBEC")
    BORDER = colors.HexColor("#D8DEE4")
    TEXT = colors.HexColor("#263238")
    MUTED = colors.HexColor("#65727E")
    WHITE = colors.white
    SUCCESS_BG = colors.HexColor("#EEF7F1")
    SUCCESS_TEXT = colors.HexColor("#276749")

    # ============================================================
    # STYLES
    # ============================================================

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=29,
        textColor=PRIMARY,
        alignment=TA_LEFT,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=MUTED,
        spaceAfter=12,
    )

    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=SECONDARY,
        spaceBefore=14,
        spaceAfter=7,
    )

    subsection_style = ParagraphStyle(
        "Subsection",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=PRIMARY_DARK,
        spaceBefore=7,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.6,
        leading=14,
        textColor=TEXT,
        spaceAfter=7,
    )

    small_style = ParagraphStyle(
        "Small",
        parent=body_style,
        fontSize=8.2,
        leading=11,
        textColor=MUTED,
    )

    bullet_style = ParagraphStyle(
        "Bullet",
        parent=body_style,
        leftIndent=16,
        firstLineIndent=-8,
        spaceAfter=4,
    )

    table_style = ParagraphStyle(
        "TableText",
        parent=body_style,
        fontSize=8.7,
        leading=12,
        spaceAfter=0,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=table_style,
        fontName="Helvetica-Bold",
        textColor=WHITE,
    )

    emergency_title_style = ParagraphStyle(
        "EmergencyTitle",
        parent=body_style,
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=PRIMARY_DARK,
        spaceAfter=4,
    )

    emergency_body_style = ParagraphStyle(
        "EmergencyBody",
        parent=body_style,
        fontSize=8.8,
        leading=13,
        textColor=TEXT,
        spaceAfter=0,
    )

    # ============================================================
    # HEADER / FOOTER
    # ============================================================

    def add_page_decor(canvas, doc):
        canvas.saveState()

        width, height = letter

        # Top accent line
        canvas.setStrokeColor(PRIMARY)
        canvas.setLineWidth(2)
        canvas.line(42, height - 30, width - 42, height - 30)

        # Header
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(SECONDARY)
        canvas.drawString(
            42,
            height - 22,
            "HEART HEALTH • MEDICAL INFORMATION"
        )

        # Footer line
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(42, 31, width - 42, 31)

        # Footer text
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)

        canvas.drawString(
            42,
            19,
            "For informational purposes only"
        )

        canvas.drawRightString(
            width - 42,
            19,
            f"Page {doc.page}"
        )

        canvas.restoreState()

    # ============================================================
    # TITLE BLOCK
    # ============================================================

    story.append(
        Paragraph(
            "Heart Disease",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Medical Overview, Warning Signs, Risk Factors, "
            "Diagnosis & Prevention",
            subtitle_style
        )
    )

    story.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=PRIMARY,
            spaceAfter=13,
        )
    )

    # ============================================================
    # QUICK SUMMARY BOX
    # ============================================================

    summary_text = (
        "<b>Quick summary:</b> Heart disease refers to several conditions "
        "that affect the heart or blood vessels. Coronary artery disease is "
        "one of the most common forms. Recognizing warning signs and "
        "addressing cardiovascular risk factors can help reduce serious "
        "complications."
    )

    summary_table = Table(
        [[Paragraph(summary_text, body_style)]],
        colWidths=[7.05 * inch],
    )

    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )

    story.append(summary_table)

    # ============================================================
    # 1. WHAT IS HEART DISEASE?
    # ============================================================

    story.append(
        Paragraph("1. What Is Heart Disease?", section_style)
    )

    intro_text = (
        "Heart disease is a broad term for conditions affecting the "
        "heart's structure, muscle, rhythm, valves, or blood supply. "
        "Some conditions develop gradually, while others can cause "
        "sudden symptoms and require urgent medical attention."
    )

    story.append(Paragraph(intro_text, body_style))

    # ============================================================
    # 2. COMMON TYPES
    # ============================================================

    story.append(
        Paragraph("2. Common Types of Heart Conditions", section_style)
    )

    type_data = [
        [
            Paragraph("Condition", table_header_style),
            Paragraph("Description", table_header_style),
        ],
        [
            Paragraph("<b>Coronary Artery Disease</b>", table_style),
            Paragraph(
                "Narrowing or blockage of the coronary arteries, "
                "often related to plaque buildup, which can reduce "
                "blood flow to the heart muscle.",
                table_style,
            ),
        ],
        [
            Paragraph("<b>Heart Arrhythmias</b>", table_style),
            Paragraph(
                "Abnormal heart rhythms that may be too fast, too slow, "
                "or irregular.",
                table_style,
            ),
        ],
        [
            Paragraph("<b>Heart Failure</b>", table_style),
            Paragraph(
                "A condition in which the heart cannot pump blood "
                "as effectively as the body needs.",
                table_style,
            ),
        ],
        [
            Paragraph("<b>Valvular Heart Disease</b>", table_style),
            Paragraph(
                "Problems involving one or more heart valves, "
                "including narrowing or leakage.",
                table_style,
            ),
        ],
        [
            Paragraph("<b>Cardiomyopathy</b>", table_style),
            Paragraph(
                "Disease of the heart muscle that can affect its "
                "ability to pump or maintain a normal rhythm.",
                table_style,
            ),
        ],
    ]

    type_table = Table(
        type_data,
        colWidths=[1.95 * inch, 5.10 * inch],
        repeatRows=1,
    )

    type_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [WHITE, LIGHT_BG],
            ),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(type_table)

    # ============================================================
    # 3. WARNING SIGNS
    # ============================================================

    story.append(
        Paragraph("3. Common Warning Signs & Symptoms", section_style)
    )

    if isinstance(Common_Warning_Signs_Symptoms, list):
        symptoms = Common_Warning_Signs_Symptoms
    else:
        symptoms = [
            line.strip("•- ").strip()
            for line in Common_Warning_Signs_Symptoms.splitlines()
            if line.strip()
        ]

    for symptom in symptoms:
        story.append(
            Paragraph(
                f"• {symptom}",
                bullet_style
            )
        )

    # ============================================================
    # EMERGENCY WARNING
    # ============================================================

    emergency_text = (
        "<b>Seek emergency medical help immediately</b> if symptoms "
        "suggestive of a heart attack occur, particularly chest pressure "
        "or discomfort that is severe, persistent, or accompanied by "
        "shortness of breath, sweating, nausea, fainting, or pain "
        "spreading to the arm, shoulder, back, neck, or jaw. "
        "Do not delay emergency care while trying to determine the cause."
    )

    emergency_table = Table(
        [[
            Paragraph(
                "⚠ WHEN TO SEEK URGENT HELP",
                emergency_title_style
            ),
            Paragraph(
                emergency_text,
                emergency_body_style
            ),
        ]],
        colWidths=[1.85 * inch, 5.20 * inch],
    )

    emergency_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_RED),
            ("BOX", (0, 0), (-1, -1), 0.9, PRIMARY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(Spacer(1, 7))
    story.append(emergency_table)

    # ============================================================
    # 4. RISK FACTORS
    # ============================================================

    story.append(
        Paragraph("4. Key Risk Factors", section_style)
    )

    modifiable = (
        "• High blood pressure<br/>"
        "• High cholesterol<br/>"
        "• Smoking and tobacco use<br/>"
        "• Diabetes or impaired glucose control<br/>"
        "• Physical inactivity<br/>"
        "• Overweight or obesity<br/>"
        "• Unhealthy diet<br/>"
        "• Excessive alcohol consumption"
    )

    non_modifiable = (
        "• Increasing age<br/>"
        "• Family history<br/>"
        "• Genetic factors<br/>"
        "• Previous cardiovascular disease<br/>"
        "• Certain inherited conditions"
    )

    risk_data = [
        [
            Paragraph(
                "Modifiable Factors",
                table_header_style
            ),
            Paragraph(
                "Non-Modifiable / Less Modifiable Factors",
                table_header_style
            ),
        ],
        [
            Paragraph(modifiable, table_style),
            Paragraph(non_modifiable, table_style),
        ],
    ]

    risk_table = Table(
        risk_data,
        colWidths=[3.525 * inch, 3.525 * inch],
    )

    risk_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SECONDARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("BACKGROUND", (0, 1), (-1, 1), LIGHT_BG),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(risk_table)

    # ============================================================
    # 5. DIAGNOSIS
    # ============================================================

    story.append(
        Paragraph("5. Diagnosis & Medical Evaluation", section_style)
    )

    diagnosis_intro = (
        "The appropriate evaluation depends on the person's symptoms, "
        "medical history, physical examination, and cardiovascular risk."
    )

    story.append(
        Paragraph(diagnosis_intro, body_style)
    )

    diagnostic_items = [
        ("ECG / EKG", "Records the heart's electrical activity."),
        ("Echocardiogram", "Uses ultrasound to assess heart structure and function."),
        ("Stress testing", "Evaluates heart function during controlled physical or medication-induced stress."),
        ("Blood tests", "May include cholesterol, glucose, cardiac biomarkers, and other tests when appropriate."),
        ("Coronary imaging", "CT coronary angiography or invasive coronary angiography may be used when clinically indicated."),
    ]

    diagnosis_table_data = [
        [
            Paragraph("Test / Evaluation", table_header_style),
            Paragraph("Purpose", table_header_style),
        ]
    ]

    for name, purpose in diagnostic_items:
        diagnosis_table_data.append([
            Paragraph(f"<b>{name}</b>", table_style),
            Paragraph(purpose, table_style),
        ])

    diagnosis_table = Table(
        diagnosis_table_data,
        colWidths=[2.0 * inch, 5.05 * inch],
        repeatRows=1,
    )

    diagnosis_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [WHITE, LIGHT_BG],
            ),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )

    story.append(diagnosis_table)

    # ============================================================
    # 6. PREVENTION
    # ============================================================

    story.append(
        Paragraph("6. Prevention & Heart-Healthy Habits", section_style)
    )

    prevention_items = [
        "Eat a balanced diet rich in vegetables, fruits, whole grains, legumes, and other minimally processed foods.",
        "Limit excessive saturated fat, trans fat, sodium, and highly processed foods.",
        "Aim for regular physical activity appropriate for your health and fitness level.",
        "Avoid smoking and tobacco products.",
        "Maintain healthy blood pressure, cholesterol, and blood glucose levels.",
        "Maintain a healthy body weight where appropriate.",
        "Get recommended health screenings and discuss cardiovascular risk with a healthcare professional.",
        "Manage sleep, stress, and other lifestyle factors that affect cardiovascular health."
    ]

    for item in prevention_items:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style
            )
        )

    # ============================================================
    # 7. WHEN TO CONTACT A DOCTOR
    # ============================================================

    story.append(
        Paragraph("7. When to Contact a Healthcare Professional", section_style)
    )

    doctor_text = (
        "Discuss new, unexplained, recurring, or worsening symptoms with "
        "a qualified healthcare professional. Medical evaluation is "
        "particularly important when symptoms occur with exertion, "
        "are associated with fainting or significant breathlessness, "
        "or occur in someone with known cardiovascular risk factors."
    )

    story.append(
        Paragraph(doctor_text, body_style)
    )

    # ============================================================
    # DISCLAIMER
    # ============================================================

    story.append(Spacer(1, 12))

    disclaimer = (
        "<b>Medical disclaimer:</b> This document provides general "
        "educational information and is not a substitute for professional "
        "medical advice, diagnosis, or treatment. Symptoms can have many "
        "causes, and individual medical decisions should be made with a "
        "qualified healthcare professional. If you believe you may be "
        "experiencing a medical emergency, seek emergency medical care."
    )

    disclaimer_table = Table(
        [[Paragraph(disclaimer, small_style)]],
        colWidths=[7.05 * inch],
    )

    disclaimer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ])
    )

    story.append(disclaimer_table)

    # ============================================================
    # BUILD PDF
    # ============================================================

    doc.build(
        story,
        onFirstPage=add_page_decor,
        onLaterPages=add_page_decor,
    )

    print(f"PDF successfully generated: {filename}")


# ================================================================
# EXAMPLE USAGE
# ================================================================

symptoms = [
    "Chest pain, pressure, tightness, or discomfort",
    "Shortness of breath",
    "Unusual fatigue",
    "Dizziness or lightheadedness",
    "Fainting or near-fainting",
    "Palpitations or an unusually rapid or irregular heartbeat",
    "Pain or discomfort spreading to the arm, shoulder, back, neck, or jaw",
    "Swelling of the legs, ankles, or feet",
]

create_heart_disease_pdf(symptoms)