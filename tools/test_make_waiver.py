import sys
from pathlib import Path

import pypdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_waiver import build_waiver

EXPECTED_FIELDS = {
    "participant_name", "participant_dob", "licence_class",
    "guardian_name", "relationship", "guardian_email", "guardian_phone",
}

EXPECTED_PHRASES = [
    "Parent/Guardian Consent & Waiver",
    "CC Driving Instruction",
    "certified driving instructor",
    "video, audio, and driving telemetry",
    "approximately 30 days",
    "gross negligence",
    "Severability",
    "parent or legal guardian",
]


def _build(tmp_path):
    out = tmp_path / "waiver.pdf"
    build_waiver(str(out))
    return out


def test_pdf_is_created_and_nonempty(tmp_path):
    out = _build(tmp_path)
    assert out.exists()
    assert out.stat().st_size > 5000


def test_fillable_fields_present(tmp_path):
    reader = pypdf.PdfReader(str(_build(tmp_path)))
    fields = reader.get_fields() or {}
    assert EXPECTED_FIELDS <= set(fields)


def test_required_wording_present(tmp_path):
    reader = pypdf.PdfReader(str(_build(tmp_path)))
    text = " ".join(" ".join(p.extract_text().split()) for p in reader.pages)
    for phrase in EXPECTED_PHRASES:
        assert phrase in text, f"missing: {phrase}"


def test_fits_two_pages(tmp_path):
    reader = pypdf.PdfReader(str(_build(tmp_path)))
    assert len(reader.pages) <= 2
