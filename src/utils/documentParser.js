import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Converts an ArrayBuffer to a base64 string (for optional native PDF multimodal input).
 */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Extracts structured page-by-page text from a PDF ArrayBuffer using PDF.js,
 * preserving visual line breaks and inserting explicit [Page N] markers.
 */
export async function extractTextFromPdfBuffer(arrayBuffer) {
  const bufferCopyForBase64 = arrayBuffer.slice(0);
  const bufferCopyForPdfJs = arrayBuffer.slice(0);
  const base64Pdf = arrayBufferToBase64(bufferCopyForBase64);

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bufferCopyForPdfJs) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items
      .filter((item) => typeof item.str === 'string')
      .map((item) => ({
        str: item.str,
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        hasEOL: Boolean(item.hasEOL)
      }));

    const lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      if (lastY !== null && Math.abs(item.y - lastY) > 4.5) {
        const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) lines.push(joined);
        currentLine = [];
      }
      if (item.str.trim()) {
        currentLine.push(item.str.trim());
      }
      lastY = item.y;
      if (item.hasEOL && currentLine.length > 0) {
        const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) lines.push(joined);
        currentLine = [];
        lastY = null;
      }
    }
    if (currentLine.length > 0) {
      const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) lines.push(joined);
    }

    const pageText = `[Page ${pageNum}]\n${lines.join('\n')}`;
    pages.push({
      pageNumber: pageNum,
      text: pageText
    });
  }

  return {
    fullText: pages.map((p) => p.text).join('\n\n'),
    numPages,
    pages,
    base64Pdf
  };
}

/**
 * Checks whether a trimmed line represents a top-level Section heading.
 */
function matchSectionHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return null;

  const explicitMatch = trimmed.match(
    /^(SECTION|PART|ARTICLE|CHAPTER|APPENDIX|ANNEX)\s+([0-9IVXLCDM]+[A-Z]?)\s*[:.\-—]?\s*(.*)$/i
  );
  if (explicitMatch) {
    const prefix = `${explicitMatch[1].toUpperCase()} ${explicitMatch[2].toUpperCase()}`;
    const rest = explicitMatch[3] ? explicitMatch[3].trim() : 'General';
    return {
      sectionNumber: prefix,
      title: `${prefix}: ${rest}`
    };
  }

  const mdMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (mdMatch) {
    const cleanTitle = mdMatch[2].trim();
    return {
      sectionNumber: `Section`,
      title: cleanTitle
    };
  }

  const numberedCapsMatch = trimmed.match(/^(\d+(?:\.0)?)\s+[A-Z][A-Z0-9\s,&\-/]{5,}$/);
  if (numberedCapsMatch && !/^Rule\s+\d+/i.test(trimmed)) {
    return {
      sectionNumber: `Section ${numberedCapsMatch[1]}`,
      title: trimmed
    };
  }

  return null;
}

/**
 * Splits raw document text into logical sections while tracking [Page N] boundaries,
 * word counts, rule counts, and auto-detecting Definitions sections.
 */
export function parseDocumentIntoSections(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  let currentPage = 1;

  const rawSections = [];
  let currentSec = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const pageMatch =
      trimmed.match(/^\[?\s*Page\s+(\d+)(?:\s+of\s+\d+)?\s*\]?$/i) ||
      trimmed.match(/REGULATORY STANDARD.*PAGE\s+(\d+)\s+OF\s+\d+/i);

    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // Skip repeated document running headers or decorative dividers
    if (
      /^[=\-_]{10,}$/.test(trimmed) ||
      /^REGULATORY STANDARD CRS-2026-04/i.test(trimmed) ||
      /^ULTRA-LOW TEMPERATURE BIOBANK SPECIMEN/i.test(trimmed) ||
      /^Effective Date:/i.test(trimmed) ||
      /^PAGE\s+\d+\s+OF\s+\d+$/i.test(trimmed)
    ) {
      continue;
    }

    const heading = matchSectionHeading(line);
    if (heading) {
      if (currentSec) {
        rawSections.push(currentSec);
      }
      currentSec = {
        sectionNumber: heading.sectionNumber,
        title: heading.title,
        pageStart: currentPage,
        pageEnd: currentPage,
        lines: [`[Page ${currentPage}]`, line]
      };
    } else if (trimmed) {
      if (currentSec) {
        if (currentPage > currentSec.pageEnd) {
          currentSec.pageEnd = currentPage;
          currentSec.lines.push(`[Page ${currentPage}]`);
        }
        currentSec.lines.push(line);
      }
    } else if (currentSec) {
      currentSec.lines.push('');
    }
  }

  if (currentSec) {
    rawSections.push(currentSec);
  }

  if (rawSections.length === 0) {
    const chunks = rawText.split(/(?=\[Page\s+\d+\])/i).filter((c) => c.trim());
    return chunks.map((chunk, idx) => {
      const pMatch = chunk.match(/\[Page\s+(\d+)\]/i);
      const pageNum = pMatch ? parseInt(pMatch[1], 10) : idx + 1;
      const words = chunk.trim().split(/\s+/).filter(Boolean).length;
      const ruleMatches = chunk.match(/\b(Rule\s+\d+|\d+\.\d+)\b/gi) || [];
      return {
        id: `sec-${idx + 1}`,
        sectionNumber: `Section ${idx + 1}`,
        title: `Page ${pageNum} Content`,
        pageStart: pageNum,
        pageEnd: pageNum,
        rawText: chunk.trim(),
        wordCount: words,
        detectedRuleCount: ruleMatches.length,
        isDefinitionsSection: /definition|glossary|terminology/i.test(chunk),
        selected: true
      };
    });
  }

  return rawSections.map((sec, idx) => {
    const bodyText = sec.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    const ruleMatches = bodyText.match(/(?:^|\n)\s*(?:Rule\s+\d+|\d+\.\d+)/gi) || [];
    const isDefs = /definition|glossary|interpretation|terminology/i.test(sec.title);

    return {
      id: `sec-${idx + 1}`,
      sectionNumber: sec.sectionNumber || `Section ${idx + 1}`,
      title: sec.title,
      pageStart: sec.pageStart,
      pageEnd: sec.pageEnd,
      rawText: bodyText,
      wordCount: words,
      detectedRuleCount: ruleMatches.length,
      isDefinitionsSection: isDefs,
      selected: true
    };
  });
}
