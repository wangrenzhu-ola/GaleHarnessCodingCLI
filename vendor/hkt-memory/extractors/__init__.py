"""
Extractor package exports.

Expose `LayerTrigger` at package level so legacy imports like
`from extractors import LayerTrigger` continue to work.
"""

from .trigger import LayerTrigger

__all__ = ["LayerTrigger"]
