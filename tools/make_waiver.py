#!/usr/bin/env python3
"""Generate the fillable under-18 parent/guardian consent & waiver PDF.

Output: documents/ClearConnect-Under18-Consent-Waiver.pdf
Regenerate and re-commit whenever the wording changes; bump VERSION.
Wording has not been reviewed by a lawyer — see the design spec in the
clearconnect repo (docs/superpowers/specs/2026-07-07-under18-consent-waiver-design.md).
"""
import os
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

VERSION = "v1 — July 2026"

PAGE_W, PAGE_H = letter
MARGIN = 54
BODY_W = PAGE_W - 2 * MARGIN
INK = colors.Color(0.07, 0.07, 0.08)
MUTED = colors.Color(0.38, 0.38, 0.42)
RULE = colors.Color(0.75, 0.75, 0.78)
BODY_FONT = "Helvetica"
BOLD_FONT = "Helvetica-Bold"


def _wrap(text, font, size, width):
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if stringWidth(trial, font, size) <= width:
            line = trial
        else:
            if line:  # skip empty line when a single token exceeds the width
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


class _Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.c.setTitle("Parent/Guardian Consent & Waiver — CC Driving Instruction")
        self._start_page()  # sets self.y

    def _start_page(self):
        c = self.c
        c.setFillColor(INK)
        c.setFont(BOLD_FONT, 15)
        c.drawString(MARGIN, PAGE_H - MARGIN, "CC Driving Instruction")
        c.setFont(BODY_FONT, 9)
        c.setFillColor(MUTED)
        c.drawString(
            MARGIN, PAGE_H - MARGIN - 13,
            "Richard Cooke — Certified Driving Instructor · rico@ccdrvn.com "
            "· 343-263-6264 · Kingston & Belleville, Ontario")
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.line(MARGIN, PAGE_H - MARGIN - 22, PAGE_W - MARGIN, PAGE_H - MARGIN - 22)
        c.setFont(BODY_FONT, 8)
        c.drawString(MARGIN, MARGIN - 18, VERSION)
        c.drawRightString(PAGE_W - MARGIN, MARGIN - 18, "Page %d" % c.getPageNumber())
        self.y = PAGE_H - MARGIN - 44

    def ensure(self, needed):
        if self.y - needed < MARGIN:
            self.c.showPage()
            self._start_page()

    def title(self, text):
        self.ensure(30)
        self.c.setFillColor(INK)
        self.c.setFont(BOLD_FONT, 13)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 22

    def heading(self, text):
        # 80pt guarantees a heading is never stranded at the bottom of a page
        # without at least ~3 lines of following body text.
        self.ensure(80)
        self.y -= 6
        self.c.setFillColor(INK)
        self.c.setFont(BOLD_FONT, 10.5)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 15

    def para(self, text, size=9.5, leading=13, indent=0, bullet=None):
        lines = _wrap(text, BODY_FONT, size, BODY_W - indent)
        self.ensure(leading * len(lines) + 4)
        self.c.setFillColor(INK)
        self.c.setFont(BODY_FONT, size)
        for i, line in enumerate(lines):
            if bullet and i == 0:
                self.c.drawString(MARGIN + indent - 12, self.y, bullet)
            self.c.drawString(MARGIN + indent, self.y, line)
            self.y -= leading
        self.y -= 4

    def field_row(self, specs):
        """specs: list of (field_name, label, relative_width)."""
        self.ensure(46)
        gap = 14
        total_w = BODY_W - gap * (len(specs) - 1)
        wsum = sum(w for _, _, w in specs)
        x = MARGIN
        for name, label, weight in specs:
            w = total_w * weight / wsum
            self.c.setFont(BODY_FONT, 7.5)
            self.c.setFillColor(MUTED)
            self.c.drawString(x, self.y, label.upper())
            self.c.acroForm.textfield(
                name=name, x=x, y=self.y - 24, width=w, height=18,
                borderWidth=0.5, borderColor=RULE, fillColor=None,
                fontName=BODY_FONT, fontSize=10, textColor=INK)
            x += w + gap
        self.y -= 38

    def sig_row(self):
        self.ensure(70)
        self.y -= 26
        c = self.c
        c.setStrokeColor(INK)
        c.setLineWidth(0.8)
        gap = 14
        x = MARGIN
        for label, frac in [("Parent/guardian signature", 0.50),
                            ("Printed name", 0.28), ("Date", 0.16)]:
            w = BODY_W * frac
            c.line(x, self.y, x + w, self.y)
            c.setFont(BODY_FONT, 7.5)
            c.setFillColor(MUTED)
            c.drawString(x, self.y - 10, label.upper())
            x += w + gap
        self.y -= 30

    def save(self):
        self.c.save()


def build_waiver(path):
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    d = _Doc(path)

    d.title("Parent/Guardian Consent & Waiver — Participants Under 18")
    d.para(
        "Please complete this form if the participant is under 18 years of age. A parent "
        "or legal guardian must sign before the participant's first recorded lesson. You "
        "can type into this form, or print it and fill it in by hand. Return it by email "
        "to rico@ccdrvn.com or hand it to your instructor at the first lesson.",
        size=9, leading=12)

    d.heading("A. Participant & parent/guardian information")
    d.field_row([("participant_name", "Participant full name", 3),
                 ("participant_dob", "Date of birth (YYYY-MM-DD)", 2)])
    d.field_row([("licence_class", "Licence class (G1 / G2)", 1),
                 ("guardian_name", "Parent/guardian full name", 2),
                 ("relationship", "Relationship to participant", 1.4)])
    d.field_row([("guardian_email", "Parent/guardian email (reports are sent here)", 2),
                 ("guardian_phone", "Parent/guardian phone", 1)])

    d.heading("B. About the lessons and the recording system")
    d.para(
        "Lessons are delivered by a certified driving instructor in a vehicle provided by "
        "CC Driving Instruction, with the instructor accompanying the participant at all "
        "times. The vehicle is equipped with the ClearConnect in-vehicle system: cameras "
        "and sensors that record video, audio, and driving telemetry (such as speed, "
        "position, and motion) during the lesson. Recordings are analyzed to produce a "
        "scored lesson report, short video clips of key moments, and a personalized "
        "practice plan (together, “My Lesson Review”).")

    d.heading("C. Recording & data consent")
    d.para("I consent to the following on behalf of the participant named above:")
    for b in [
        "Video, audio, and driving telemetry of the participant may be recorded during "
        "lessons.",
        "Recordings are stored securely. Video clips are retained for approximately 30 "
        "days after delivery and are then automatically deleted.",
        "Lesson reports and links to video clips are delivered by email to the "
        "parent/guardian email address given above.",
        "Recordings and reports are never sold, never posted publicly, and are not "
        "shared with third parties.",
        "I may withdraw this consent for future lessons at any time by writing to "
        "rico@ccdrvn.com.",
    ]:
        d.para(b, indent=14, bullet="•")

    d.heading("D. Assumption of risk & release")
    d.para(
        "I understand that driver training takes place in real traffic and, like all "
        "driving, carries inherent risks that cannot be eliminated even with careful "
        "instruction, including the risk of collision, injury, and damage to property. I "
        "confirm the participant holds a valid Ontario G1 or G2 licence and will follow "
        "the instructor's directions during lessons.")
    d.para(
        "In consideration of the participant being permitted to take part in lessons, I "
        "release Richard Cooke, carrying on business as CC Driving Instruction, from "
        "claims, losses, or damages arising out of the ordinary negligence of the "
        "instructor in connection with the lessons. This release does not apply to gross "
        "negligence or wilful misconduct, and nothing in this document limits rights "
        "that cannot be waived under Ontario law.")

    d.heading("E. Vehicle & incidents")
    d.para(
        "Lessons take place in a vehicle provided and insured by CC Driving Instruction. "
        "I agree that any incident, collision, or damage occurring during a lesson must "
        "be reported to the instructor immediately so it can be handled through the "
        "proper insurance process.")

    d.heading("F. Severability")
    d.para(
        "If any part of this document is found unenforceable, the remaining parts — "
        "including the recording and data consent in section C — remain in full "
        "effect.")

    d.heading("G. Signature")
    d.para(
        "I confirm that I am the parent or legal guardian of the participant named "
        "above, that I have read and understood this document, and that I agree to it on "
        "the participant's behalf.")
    d.sig_row()
    d.save()


if __name__ == "__main__":
    default = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                           "documents", "ClearConnect-Under18-Consent-Waiver.pdf")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    build_waiver(out)
    print("wrote", os.path.abspath(out))
