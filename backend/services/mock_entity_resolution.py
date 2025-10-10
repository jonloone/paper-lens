"""
Mock Entity Resolution Service
Fuzzy matching-based entity resolution for demo purposes

In production, this would be replaced with Zingg or similar entity resolution tool.
This mock version uses Levenshtein distance for fuzzy matching.

Purpose:
- Match entity mentions to canonical entities
- Link entities to structured data rows
- Calculate match confidence scores
- Provide same API as production Zingg integration

Date: October 10, 2025
"""

import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import re

logger = logging.getLogger(__name__)


@dataclass
class EntityMatch:
    """Result of entity resolution"""
    entity_id: str
    canonical_name: str
    match_score: float
    match_method: str
    row_identifier: Optional[str] = None
    metadata: Optional[Dict] = None


class MockEntityResolver:
    """
    Mock entity resolution using fuzzy string matching

    In production, replace with Zingg integration:
    - Use Zingg's ML-based matching
    - Handle complex entity types
    - Learn from feedback
    - Scale to millions of entities
    """

    def __init__(self):
        """Initialize mock entity resolver"""
        # In-memory cache of known entities
        # In production, this would be a database or Zingg cluster
        self.entity_cache: Dict[str, Dict] = {}

    def levenshtein_distance(self, s1: str, s2: str) -> int:
        """
        Calculate Levenshtein distance between two strings

        Args:
            s1: First string
            s2: Second string

        Returns:
            Edit distance between strings
        """
        if len(s1) < len(s2):
            return self.levenshtein_distance(s2, s1)

        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                # Cost of insertions, deletions, or substitutions
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row

        return previous_row[-1]

    def similarity_score(self, s1: str, s2: str) -> float:
        """
        Calculate similarity score between two strings (0-1)

        Args:
            s1: First string
            s2: Second string

        Returns:
            Similarity score (1.0 = identical, 0.0 = completely different)
        """
        s1_lower = s1.lower().strip()
        s2_lower = s2.lower().strip()

        # Exact match
        if s1_lower == s2_lower:
            return 1.0

        # Calculate normalized Levenshtein similarity
        max_len = max(len(s1_lower), len(s2_lower))
        if max_len == 0:
            return 0.0

        distance = self.levenshtein_distance(s1_lower, s2_lower)
        similarity = 1.0 - (distance / max_len)

        # Bonus for substring match
        if s1_lower in s2_lower or s2_lower in s1_lower:
            similarity = min(1.0, similarity + 0.1)

        return similarity

    def normalize_entity_name(self, name: str) -> str:
        """
        Normalize entity name for matching

        Args:
            name: Raw entity name

        Returns:
            Normalized name
        """
        # Convert to lowercase
        normalized = name.lower().strip()

        # Remove common suffixes/prefixes
        normalized = re.sub(r'\b(inc|corp|ltd|llc|co)\b\.?', '', normalized)

        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)

        # Remove special characters
        normalized = re.sub(r'[^\w\s]', '', normalized)

        return normalized.strip()

    def resolve_entity(
        self,
        mention_text: str,
        entity_type: str,
        context: Optional[str] = None,
        threshold: float = 0.7
    ) -> Optional[EntityMatch]:
        """
        Resolve an entity mention to a canonical entity

        Args:
            mention_text: Text of the entity mention
            entity_type: Type of entity (person, organization, product, etc.)
            context: Optional context for disambiguation
            threshold: Minimum match score (0-1)

        Returns:
            EntityMatch if found, None otherwise
        """
        normalized_mention = self.normalize_entity_name(mention_text)

        # Search entity cache for matches
        best_match: Optional[EntityMatch] = None
        best_score = 0.0

        for entity_id, entity_data in self.entity_cache.items():
            if entity_data.get("entity_type") != entity_type:
                continue

            canonical_name = entity_data.get("canonical_name", "")
            normalized_canonical = self.normalize_entity_name(canonical_name)

            # Calculate similarity
            score = self.similarity_score(normalized_mention, normalized_canonical)

            # Check aliases
            aliases = entity_data.get("aliases", [])
            for alias in aliases:
                normalized_alias = self.normalize_entity_name(alias)
                alias_score = self.similarity_score(normalized_mention, normalized_alias)
                score = max(score, alias_score)

            if score > best_score and score >= threshold:
                best_score = score
                best_match = EntityMatch(
                    entity_id=entity_id,
                    canonical_name=canonical_name,
                    match_score=score,
                    match_method="fuzzy_levenshtein",
                    row_identifier=entity_data.get("row_identifier"),
                    metadata={
                        "normalized_mention": normalized_mention,
                        "normalized_canonical": normalized_canonical,
                        "entity_type": entity_type
                    }
                )

        return best_match

    def resolve_batch(
        self,
        mentions: List[Dict],
        threshold: float = 0.7
    ) -> List[Optional[EntityMatch]]:
        """
        Resolve multiple entity mentions in batch

        Args:
            mentions: List of dicts with 'mention_text', 'entity_type', 'context'
            threshold: Minimum match score

        Returns:
            List of EntityMatch results (None for no match)
        """
        results = []
        for mention in mentions:
            match = self.resolve_entity(
                mention_text=mention.get("mention_text", ""),
                entity_type=mention.get("entity_type", ""),
                context=mention.get("context"),
                threshold=threshold
            )
            results.append(match)

        return results

    def add_entity(
        self,
        entity_id: str,
        canonical_name: str,
        entity_type: str,
        row_identifier: Optional[str] = None,
        aliases: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Add a known entity to the cache

        Args:
            entity_id: Unique entity identifier
            canonical_name: Canonical form of entity name
            entity_type: Type of entity
            row_identifier: Link to structured data row
            aliases: Alternative names for this entity
            metadata: Additional metadata
        """
        self.entity_cache[entity_id] = {
            "entity_id": entity_id,
            "canonical_name": canonical_name,
            "entity_type": entity_type,
            "row_identifier": row_identifier,
            "aliases": aliases or [],
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat()
        }

        logger.info(f"Added entity to cache: {entity_id} ({canonical_name})")

    def update_entity(
        self,
        entity_id: str,
        canonical_name: Optional[str] = None,
        aliases: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Update an existing entity

        Args:
            entity_id: Entity identifier
            canonical_name: Updated canonical name
            aliases: Updated aliases
            metadata: Updated metadata
        """
        if entity_id not in self.entity_cache:
            logger.warning(f"Entity not found for update: {entity_id}")
            return

        entity = self.entity_cache[entity_id]

        if canonical_name:
            entity["canonical_name"] = canonical_name
        if aliases is not None:
            entity["aliases"] = aliases
        if metadata:
            entity["metadata"].update(metadata)

        entity["updated_at"] = datetime.now().isoformat()

        logger.info(f"Updated entity: {entity_id}")

    def get_entity(self, entity_id: str) -> Optional[Dict]:
        """Get entity by ID"""
        return self.entity_cache.get(entity_id)

    def list_entities(self, entity_type: Optional[str] = None) -> List[Dict]:
        """
        List all entities in cache

        Args:
            entity_type: Optional filter by entity type

        Returns:
            List of entity dicts
        """
        entities = list(self.entity_cache.values())

        if entity_type:
            entities = [e for e in entities if e.get("entity_type") == entity_type]

        return entities

    def get_stats(self) -> Dict:
        """
        Get statistics about entity cache

        Returns:
            Dict with counts by entity type
        """
        stats = {
            "total_entities": len(self.entity_cache),
            "by_type": {}
        }

        for entity in self.entity_cache.values():
            entity_type = entity.get("entity_type", "unknown")
            stats["by_type"][entity_type] = stats["by_type"].get(entity_type, 0) + 1

        return stats

    def load_sample_entities(self):
        """
        Load sample entities for demo purposes

        In production, this would load from:
        - Existing customer database
        - Product catalog
        - Employee directory
        - Etc.
        """
        # Sample customers
        self.add_entity(
            entity_id="cust_001",
            canonical_name="Acme Corporation",
            entity_type="organization",
            row_identifier="customers.customer_id=1001",
            aliases=["Acme Corp", "Acme Inc", "ACME"]
        )

        self.add_entity(
            entity_id="cust_002",
            canonical_name="TechStart Industries",
            entity_type="organization",
            row_identifier="customers.customer_id=1002",
            aliases=["TechStart", "Tech Start", "TechStart Inc"]
        )

        self.add_entity(
            entity_id="cust_003",
            canonical_name="Global Solutions Ltd",
            entity_type="organization",
            row_identifier="customers.customer_id=1003",
            aliases=["Global Solutions", "GlobalSolutions", "GS Ltd"]
        )

        # Sample products
        self.add_entity(
            entity_id="prod_001",
            canonical_name="Enterprise Analytics Platform",
            entity_type="product",
            row_identifier="products.product_id=5001",
            aliases=["Analytics Platform", "EAP", "Enterprise Analytics"]
        )

        self.add_entity(
            entity_id="prod_002",
            canonical_name="Data Integration Suite",
            entity_type="product",
            row_identifier="products.product_id=5002",
            aliases=["DIS", "Integration Suite", "Data Suite"]
        )

        # Sample people
        self.add_entity(
            entity_id="person_001",
            canonical_name="John Smith",
            entity_type="person",
            row_identifier="employees.employee_id=2001",
            aliases=["J. Smith", "John S."]
        )

        self.add_entity(
            entity_id="person_002",
            canonical_name="Sarah Johnson",
            entity_type="person",
            row_identifier="employees.employee_id=2002",
            aliases=["S. Johnson", "Sarah J."]
        )

        logger.info(f"Loaded {len(self.entity_cache)} sample entities for demo")


# Singleton instance
_entity_resolver: Optional[MockEntityResolver] = None


def get_entity_resolver() -> MockEntityResolver:
    """Get or create singleton entity resolver instance"""
    global _entity_resolver
    if _entity_resolver is None:
        _entity_resolver = MockEntityResolver()
        _entity_resolver.load_sample_entities()
    return _entity_resolver
