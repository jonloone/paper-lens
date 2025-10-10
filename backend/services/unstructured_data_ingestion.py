"""
Unstructured Data Ingestion Service
Ingests documents, extracts entities, and stores in knowledge graph

Purpose:
- Ingest text documents (support tickets, logs, etc.)
- Extract entities using mock NER (production: Ollama LLM)
- Resolve entities to structured data
- Store documents and relationships in Kuzu graph

Date: October 10, 2025
"""

import logging
import json
import uuid
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass
import kuzu

from .mock_entity_resolution import get_entity_resolver, EntityMatch

logger = logging.getLogger(__name__)


@dataclass
class ExtractedEntity:
    """Entity extracted from document"""
    mention_text: str
    entity_type: str
    start_position: int
    end_position: int
    confidence: float
    context: str


class MockEntityExtractor:
    """
    Mock entity extraction using pattern matching

    In production, replace with:
    - Ollama LLM for sophisticated NER
    - Spacy or similar NER library
    - Custom trained models
    """

    # Entity patterns for demo
    ENTITY_PATTERNS = {
        "organization": [
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Inc|Ltd|LLC|Corporation|Industries|Solutions|Systems|Technologies))\b',
            r'\b(Acme|TechStart|Global\s+Solutions)\b'
        ],
        "person": [
            r'\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b(?=\s+(?:said|wrote|reported|mentioned|stated))',
            r'\b(?:Mr\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b'
        ],
        "product": [
            r'\b(Enterprise\s+Analytics\s+Platform|Data\s+Integration\s+Suite|Analytics\s+Platform)\b',
            r'\b([A-Z][a-z]+\s+Platform|[A-Z][a-z]+\s+Suite)\b'
        ],
        "email": [
            r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
        ],
        "ticket_id": [
            r'\b(TICKET-\d+|TKT-\d+|#\d{4,})\b'
        ]
    }

    def extract_entities(self, text: str, max_context: int = 100) -> List[ExtractedEntity]:
        """
        Extract entities from text using pattern matching

        Args:
            text: Input text
            max_context: Max characters of context around entity

        Returns:
            List of extracted entities
        """
        entities = []

        for entity_type, patterns in self.ENTITY_PATTERNS.items():
            for pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    mention_text = match.group(1) if match.lastindex else match.group(0)
                    start = match.start()
                    end = match.end()

                    # Extract context
                    context_start = max(0, start - max_context // 2)
                    context_end = min(len(text), end + max_context // 2)
                    context = text[context_start:context_end]

                    # Simple confidence based on pattern complexity
                    confidence = 0.8 if len(patterns) > 1 else 0.9

                    entities.append(ExtractedEntity(
                        mention_text=mention_text,
                        entity_type=entity_type,
                        start_position=start,
                        end_position=end,
                        confidence=confidence,
                        context=context
                    ))

        # Remove duplicates (same mention at same position)
        unique_entities = []
        seen = set()
        for entity in entities:
            key = (entity.mention_text, entity.start_position, entity.entity_type)
            if key not in seen:
                seen.add(key)
                unique_entities.append(entity)

        return unique_entities


class UnstructuredDataIngestionService:
    """
    Service for ingesting unstructured documents into knowledge graph
    """

    def __init__(self, kuzu_conn: kuzu.Connection):
        """
        Initialize ingestion service

        Args:
            kuzu_conn: Active Kuzu connection
        """
        self.kuzu = kuzu_conn
        self.entity_extractor = MockEntityExtractor()
        self.entity_resolver = get_entity_resolver()

    async def ingest_document(
        self,
        content: str,
        document_type: str,
        title: str,
        source: str,
        author: Optional[str] = None,
        file_path: Optional[str] = None,
        volume_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Ingest a document with entity extraction and resolution

        Args:
            content: Document text content
            document_type: Type (support_ticket, log, email, etc.)
            title: Document title
            source: Where document came from
            author: Optional author
            file_path: Optional file path
            volume_id: Optional Unity Catalog Volume ID
            metadata: Additional metadata

        Returns:
            document_id
        """
        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        # 1. Store document in graph
        logger.info(f"Ingesting document: {document_id} ({title})")

        self.kuzu.execute("""
            CREATE (doc:Document {
                document_id: $document_id,
                document_type: $document_type,
                title: $title,
                content: $content,
                source: $source,
                author: $author,
                created_at: $created_at,
                ingested_at: $ingested_at,
                file_path: $file_path,
                file_size: $file_size,
                embedding: $embedding,
                metadata: $metadata
            })
        """, {
            "document_id": document_id,
            "document_type": document_type,
            "title": title,
            "content": content,
            "source": source,
            "author": author or "unknown",
            "created_at": datetime.now(),
            "ingested_at": datetime.now(),
            "file_path": file_path or "",
            "file_size": len(content),
            "embedding": "",  # Would be generated by LLM in production
            "metadata": json.dumps(metadata or {})
        })

        # 2. Link to volume if provided
        if volume_id:
            self._link_document_to_volume(document_id, volume_id, file_path or "")

        # 3. Extract entities
        entities = self.entity_extractor.extract_entities(content)
        logger.info(f"Extracted {len(entities)} entities from document {document_id}")

        # 4. Process each entity
        entity_count = 0
        for extracted_entity in entities:
            try:
                self._process_entity(document_id, extracted_entity, content)
                entity_count += 1
            except Exception as e:
                logger.error(f"Error processing entity: {e}", exc_info=True)

        logger.info(f"Successfully processed {entity_count} entities for document {document_id}")

        return document_id

    def _process_entity(
        self,
        document_id: str,
        extracted_entity: ExtractedEntity,
        full_text: str
    ):
        """
        Process an extracted entity: create mention, resolve, link

        Args:
            document_id: Parent document ID
            extracted_entity: Extracted entity
            full_text: Full document text for context
        """
        # 1. Create EntityMention node
        mention_id = f"mention_{uuid.uuid4().hex[:12]}"

        self.kuzu.execute("""
            CREATE (m:EntityMention {
                mention_id: $mention_id,
                mention_text: $mention_text,
                entity_type: $entity_type,
                start_position: $start_position,
                end_position: $end_position,
                confidence: $confidence,
                context: $context,
                extracted_at: $extracted_at,
                metadata: $metadata
            })
        """, {
            "mention_id": mention_id,
            "mention_text": extracted_entity.mention_text,
            "entity_type": extracted_entity.entity_type,
            "start_position": extracted_entity.start_position,
            "end_position": extracted_entity.end_position,
            "confidence": extracted_entity.confidence,
            "context": extracted_entity.context,
            "extracted_at": datetime.now(),
            "metadata": json.dumps({})
        })

        # 2. Link mention to document
        self.kuzu.execute("""
            MATCH (m:EntityMention {mention_id: $mention_id})
            MATCH (doc:Document {document_id: $document_id})
            CREATE (m)-[:MENTIONED_IN {
                sentence_number: $sentence_number,
                paragraph_number: $paragraph_number,
                extraction_method: $extraction_method,
                created_at: $created_at,
                metadata: $metadata
            }]->(doc)
        """, {
            "mention_id": mention_id,
            "document_id": document_id,
            "sentence_number": 0,  # Would calculate in production
            "paragraph_number": 0,
            "extraction_method": "mock_pattern_matching",
            "created_at": datetime.now(),
            "metadata": json.dumps({})
        })

        # 3. Try to resolve entity
        entity_match = self.entity_resolver.resolve_entity(
            mention_text=extracted_entity.mention_text,
            entity_type=extracted_entity.entity_type,
            context=extracted_entity.context,
            threshold=0.7
        )

        if entity_match:
            # Link mention to existing entity
            self._link_mention_to_entity(mention_id, entity_match)
        else:
            # Create new entity
            entity_id = self._create_new_entity(extracted_entity)
            # Link mention to new entity
            entity_match = EntityMatch(
                entity_id=entity_id,
                canonical_name=extracted_entity.mention_text,
                match_score=1.0,
                match_method="exact_new"
            )
            self._link_mention_to_entity(mention_id, entity_match)

    def _create_new_entity(self, extracted_entity: ExtractedEntity) -> str:
        """
        Create a new entity in the graph

        Args:
            extracted_entity: Extracted entity data

        Returns:
            entity_id
        """
        entity_id = f"entity_{uuid.uuid4().hex[:12]}"

        self.kuzu.execute("""
            CREATE (e:Entity {
                entity_id: $entity_id,
                entity_type: $entity_type,
                canonical_name: $canonical_name,
                confidence: $confidence,
                first_seen: $first_seen,
                last_seen: $last_seen,
                mention_count: $mention_count,
                metadata: $metadata
            })
        """, {
            "entity_id": entity_id,
            "entity_type": extracted_entity.entity_type,
            "canonical_name": extracted_entity.mention_text,
            "confidence": extracted_entity.confidence,
            "first_seen": datetime.now(),
            "last_seen": datetime.now(),
            "mention_count": 1,
            "metadata": json.dumps({})
        })

        # Add to resolver cache
        self.entity_resolver.add_entity(
            entity_id=entity_id,
            canonical_name=extracted_entity.mention_text,
            entity_type=extracted_entity.entity_type
        )

        logger.info(f"Created new entity: {entity_id} ({extracted_entity.mention_text})")

        return entity_id

    def _link_mention_to_entity(self, mention_id: str, entity_match: EntityMatch):
        """
        Link an entity mention to a resolved entity

        Args:
            mention_id: EntityMention ID
            entity_match: Resolved entity match
        """
        self.kuzu.execute("""
            MATCH (m:EntityMention {mention_id: $mention_id})
            MATCH (e:Entity {entity_id: $entity_id})
            CREATE (m)-[:REFERS_TO {
                confidence: $confidence,
                resolution_method: $resolution_method,
                resolved_at: $resolved_at,
                verified: $verified,
                metadata: $metadata
            }]->(e)
        """, {
            "mention_id": mention_id,
            "entity_id": entity_match.entity_id,
            "confidence": entity_match.match_score,
            "resolution_method": entity_match.match_method,
            "resolved_at": datetime.now(),
            "verified": False,
            "metadata": json.dumps(entity_match.metadata or {})
        })

        # Update entity last_seen and mention_count
        self.kuzu.execute("""
            MATCH (e:Entity {entity_id: $entity_id})
            SET e.last_seen = $last_seen,
                e.mention_count = e.mention_count + 1
        """, {
            "entity_id": entity_match.entity_id,
            "last_seen": datetime.now()
        })

        logger.debug(f"Linked mention {mention_id} to entity {entity_match.entity_id} (score: {entity_match.match_score:.2f})")

    def _link_document_to_volume(self, document_id: str, volume_id: str, file_path: str):
        """
        Link document to Unity Catalog Volume

        Args:
            document_id: Document ID
            volume_id: Volume ID
            file_path: File path within volume
        """
        self.kuzu.execute("""
            MATCH (doc:Document {document_id: $document_id})
            MATCH (vol:Volume {volume_id: $volume_id})
            CREATE (doc)-[:STORED_IN {
                relative_path: $relative_path,
                storage_format: $storage_format,
                compression: $compression,
                created_at: $created_at,
                metadata: $metadata
            }]->(vol)
        """, {
            "document_id": document_id,
            "volume_id": volume_id,
            "relative_path": file_path,
            "storage_format": "text",
            "compression": "none",
            "created_at": datetime.now(),
            "metadata": json.dumps({})
        })

    async def ingest_batch(self, documents: List[Dict]) -> List[str]:
        """
        Ingest multiple documents in batch

        Args:
            documents: List of document dicts

        Returns:
            List of document IDs
        """
        document_ids = []

        for doc in documents:
            try:
                doc_id = await self.ingest_document(
                    content=doc.get("content", ""),
                    document_type=doc.get("document_type", "unknown"),
                    title=doc.get("title", "Untitled"),
                    source=doc.get("source", "unknown"),
                    author=doc.get("author"),
                    file_path=doc.get("file_path"),
                    volume_id=doc.get("volume_id"),
                    metadata=doc.get("metadata")
                )
                document_ids.append(doc_id)
            except Exception as e:
                logger.error(f"Error ingesting document: {e}", exc_info=True)

        logger.info(f"Batch ingested {len(document_ids)} documents")
        return document_ids

    async def get_document(self, document_id: str) -> Optional[Dict]:
        """
        Get document by ID

        Args:
            document_id: Document identifier

        Returns:
            Document dict or None
        """
        result = self.kuzu.execute("""
            MATCH (doc:Document {document_id: $document_id})
            RETURN
                doc.document_id,
                doc.document_type,
                doc.title,
                doc.content,
                doc.source,
                doc.author,
                doc.created_at,
                doc.ingested_at,
                doc.file_path,
                doc.file_size,
                doc.metadata
        """, {"document_id": document_id})

        if not result.has_next():
            return None

        row = result.get_next()
        metadata_str = row[10] if row[10] else "{}"
        metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

        return {
            "document_id": row[0],
            "document_type": row[1],
            "title": row[2],
            "content": row[3],
            "source": row[4],
            "author": row[5],
            "created_at": row[6],
            "ingested_at": row[7],
            "file_path": row[8],
            "file_size": row[9],
            "metadata": metadata
        }

    async def get_document_entities(self, document_id: str) -> List[Dict]:
        """
        Get all entities mentioned in a document

        Args:
            document_id: Document identifier

        Returns:
            List of entities with mention info
        """
        result = self.kuzu.execute("""
            MATCH (m:EntityMention)-[:MENTIONED_IN]->(doc:Document {document_id: $document_id})
            MATCH (m)-[r:REFERS_TO]->(e:Entity)
            RETURN
                m.mention_id,
                m.mention_text,
                m.entity_type,
                m.confidence,
                e.entity_id,
                e.canonical_name,
                r.confidence,
                r.resolution_method
        """, {"document_id": document_id})

        entities = []
        while result.has_next():
            row = result.get_next()
            entities.append({
                "mention_id": row[0],
                "mention_text": row[1],
                "entity_type": row[2],
                "extraction_confidence": row[3],
                "entity_id": row[4],
                "canonical_name": row[5],
                "resolution_confidence": row[6],
                "resolution_method": row[7]
            })

        return entities

    async def get_stats(self) -> Dict:
        """
        Get statistics about ingested documents

        Returns:
            Dict with counts
        """
        stats = {
            "total_documents": 0,
            "total_entities": 0,
            "total_mentions": 0,
            "by_document_type": {},
            "by_entity_type": {}
        }

        # Count documents
        result = self.kuzu.execute("MATCH (doc:Document) RETURN COUNT(*)")
        if result.has_next():
            stats["total_documents"] = result.get_next()[0]

        # Count entities
        result = self.kuzu.execute("MATCH (e:Entity) RETURN COUNT(*)")
        if result.has_next():
            stats["total_entities"] = result.get_next()[0]

        # Count mentions
        result = self.kuzu.execute("MATCH (m:EntityMention) RETURN COUNT(*)")
        if result.has_next():
            stats["total_mentions"] = result.get_next()[0]

        return stats


# Standalone service wrapper
class UnstructuredIngestionService:
    """FastAPI-compatible service wrapper"""

    def __init__(self, kuzu_db_path: str = "./data/nexusone_knowledge.kuzu"):
        """Initialize service with Kuzu connection"""
        self.db = kuzu.Database(kuzu_db_path)
        self.conn = kuzu.Connection(self.db)
        self.ingestion = UnstructuredDataIngestionService(self.conn)

    async def ingest_document(self, *args, **kwargs):
        return await self.ingestion.ingest_document(*args, **kwargs)

    async def ingest_batch(self, *args, **kwargs):
        return await self.ingestion.ingest_batch(*args, **kwargs)

    async def get_document(self, *args, **kwargs):
        return await self.ingestion.get_document(*args, **kwargs)

    async def get_document_entities(self, *args, **kwargs):
        return await self.ingestion.get_document_entities(*args, **kwargs)

    async def get_stats(self, *args, **kwargs):
        return await self.ingestion.get_stats(*args, **kwargs)
