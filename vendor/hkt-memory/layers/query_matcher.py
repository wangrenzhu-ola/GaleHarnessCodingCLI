import math
import re
from typing import Dict, List


def match_query_text(query: str, text: str) -> Dict[str, object]:
    return match_query_corpus(query, [text])[0]


def match_query_corpus(query: str, texts: List[str]) -> List[Dict[str, object]]:
    normalized_query = (query or "").strip().lower()
    normalized_texts = [(text or "").strip().lower() for text in texts]

    if not normalized_query:
        return [
            {
                "matched": True,
                "score": 0.0,
                "bm25_score": 0.0,
                "bm25_raw_score": 0.0,
                "matched_terms": [],
                "total_terms": 0,
                "coverage": 0.0,
                "exact_match": False,
                "term_frequencies": {},
            }
            for _ in normalized_texts
        ]

    terms = _extract_terms(normalized_query)
    if not terms:
        return [
            {
                "matched": False,
                "score": 0.0,
                "bm25_score": 0.0,
                "bm25_raw_score": 0.0,
                "matched_terms": [],
                "total_terms": 0,
                "coverage": 0.0,
                "exact_match": False,
                "term_frequencies": {},
            }
            for _ in normalized_texts
        ]

    doc_lengths = [_document_length(text) for text in normalized_texts]
    avg_doc_length = sum(doc_lengths) / max(len(doc_lengths), 1)
    document_frequencies = {
        term: sum(1 for text in normalized_texts if term in text)
        for term in terms
    }
    total_docs = max(len(normalized_texts), 1)

    analyses: List[Dict[str, object]] = []
    max_bm25 = 0.0
    for normalized_text, doc_length in zip(normalized_texts, doc_lengths):
        if not normalized_text:
            analyses.append(
                {
                    "matched": False,
                    "score": 0.0,
                    "bm25_score": 0.0,
                    "bm25_raw_score": 0.0,
                    "matched_terms": [],
                    "total_terms": len(terms),
                    "coverage": 0.0,
                    "exact_match": False,
                    "term_frequencies": {},
                }
            )
            continue

        exact_match = normalized_query in normalized_text
        term_frequencies = {
            term: normalized_text.count(term)
            for term in terms
            if term in normalized_text
        }
        matched_terms = list(term_frequencies.keys())
        required_matches = _required_matches(len(terms))
        coverage = len(matched_terms) / max(len(terms), 1)
        matched = exact_match or len(matched_terms) >= required_matches
        lexical_score = (
            100.0 + len(terms)
            if exact_match
            else coverage * 10.0 + len(matched_terms)
        )
        bm25_raw = _bm25_score(
            terms=terms,
            term_frequencies=term_frequencies,
            document_frequencies=document_frequencies,
            total_docs=total_docs,
            doc_length=doc_length,
            avg_doc_length=avg_doc_length,
        )
        max_bm25 = max(max_bm25, bm25_raw)
        analyses.append(
            {
                "matched": matched,
                "score": lexical_score,
                "bm25_score": 0.0,
                "bm25_raw_score": bm25_raw,
                "matched_terms": matched_terms,
                "total_terms": len(terms),
                "coverage": coverage,
                "exact_match": exact_match,
                "term_frequencies": term_frequencies,
            }
        )

    for analysis in analyses:
        raw_score = float(analysis.get("bm25_raw_score", 0.0))
        analysis["bm25_score"] = raw_score / max_bm25 if max_bm25 > 0 else 0.0
    return analyses


def _extract_terms(query: str) -> List[str]:
    base_terms = re.findall(r"[\u4e00-\u9fff]+|[a-z0-9][a-z0-9._+-]*", query.lower())
    expanded_terms: List[str] = []
    for term in base_terms:
        if re.fullmatch(r"[\u4e00-\u9fff]+", term):
            expanded_terms.extend(_expand_cjk_term(term))
        elif len(term) >= 2:
            expanded_terms.append(term)
    unique_terms: List[str] = []
    seen = set()
    for term in expanded_terms:
        if term in seen:
            continue
        seen.add(term)
        unique_terms.append(term)
    return unique_terms


def _expand_cjk_term(term: str) -> List[str]:
    if len(term) <= 3:
        return [term]
    grams = {term}
    for gram_size in (4, 3, 2):
        if len(term) < gram_size:
            continue
        for index in range(0, len(term) - gram_size + 1):
            grams.add(term[index:index + gram_size])
    return sorted(grams, key=lambda item: (-len(item), item))


def _required_matches(total_terms: int) -> int:
    if total_terms <= 2:
        return total_terms
    if total_terms <= 5:
        return 2
    return max(3, min(total_terms, math.ceil(total_terms * 0.35)))


def _document_length(text: str) -> int:
    return max(len(_extract_terms(text)), 1)


def _bm25_score(
    terms: List[str],
    term_frequencies: Dict[str, int],
    document_frequencies: Dict[str, int],
    total_docs: int,
    doc_length: int,
    avg_doc_length: float,
    k1: float = 1.5,
    b: float = 0.75,
) -> float:
    score = 0.0
    avg_length = max(avg_doc_length, 1.0)
    for term in terms:
        tf = float(term_frequencies.get(term, 0))
        if tf <= 0:
            continue
        df = float(document_frequencies.get(term, 0))
        idf = math.log(1.0 + (total_docs - df + 0.5) / (df + 0.5))
        denominator = tf + k1 * (1.0 - b + b * (doc_length / avg_length))
        score += idf * ((tf * (k1 + 1.0)) / max(denominator, 1e-9))
    return score
