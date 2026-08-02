import os
from urllib.parse import urlparse
import pandas as pd


def create_excel(pdf_links: list, folder: str) -> str:
    """
    Create an Excel file inside `folder` that lists every discovered PDF URL
    along with its filename and source domain.
    Returns the absolute path to the created file.
    """
    excel_path = os.path.join(folder, "pdf_links.xlsx")

    rows = []
    for i, link in enumerate(pdf_links, start=1):
        parsed = urlparse(link)
        filename = link.split("/")[-1].split("?")[0].strip() or "document.pdf"
        rows.append({
            "#":        i,
            "Filename": filename,
            "Domain":   parsed.netloc,
            "PDF URL":  link,
        })

    df = pd.DataFrame(rows)

    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="PDF Links")

        # Auto-size columns
        ws = writer.sheets["PDF Links"]
        for col in ws.columns:
            max_len = max((len(str(cell.value)) for cell in col if cell.value), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 80)

    return excel_path
