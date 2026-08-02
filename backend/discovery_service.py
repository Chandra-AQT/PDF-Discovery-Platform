def discover_pdfs(links):

    pdf_links = []

    for link in links:

        if link.lower().endswith(".pdf"):
            pdf_links.append(link)

    return list(set(pdf_links))