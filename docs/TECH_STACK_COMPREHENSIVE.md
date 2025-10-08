# NexusOne Technology Stack Documentation
## Comprehensive Technical Architecture Reference

**Version**: 1.0
**Last Updated**: October 8, 2025
**Purpose**: Single source of truth for all technologies, their implementations, and the systems they power

---

## Table of Contents

1. [Frontend Stack](#frontend-stack)
2. [Backend Stack](#backend-stack)
3. [AI/ML & Intelligence Layer](#aiml--intelligence-layer)
4. [Data Engineering Tools](#data-engineering-tools)
5. [Infrastructure & DevOps](#infrastructure--devops)
6. [Feature-to-Technology Mapping](#feature-to-technology-mapping)
7. [System Architecture Patterns](#system-architecture-patterns)

---

## Frontend Stack

### Core Framework

#### **Next.js 14.1.0**
- **Role**: React framework with server-side rendering and API routes
- **Implementation**:
  - App router architecture (`/app` directory)
  - Server components for performance optimization
  - API routes for backend communication (`/app/api/*`)
  - Middleware for request processing
- **Powers**:
  - Entire web application shell
  - Server-side rendering for SEO and performance
  - Static generation for marketing pages
  - API proxy layer for backend services

**Configuration**: `next.config.js`
```javascript
- React strict mode enabled
- SWC minification for production builds
- Image optimization with external domains
- Environment variable injection
- Webpack customizations for aliases
- API rewrites for backend proxying
```

#### **React 18.2.0**
- **Role**: UI library for component-based interfaces
- **Implementation**:
  - Functional components with hooks
  - Context API for state management
  - Concurrent features for performance
  - Suspense for data loading states
- **Powers**:
  - All UI components and interactions
  - Component composition patterns
  - Reactive state management

---

### State Management

#### **Zustand 4.5.7**
- **Role**: Lightweight state management library
- **Implementation**: `stores/` directory
  - Global state stores for application-level data
  - Persistent stores for user preferences
  - Derived state calculations
- **Powers**:
  - Connection state management (`lib/services/connection-storage.ts`)
  - Draft recovery system (`lib/utils/draft-storage.ts`)
  - User preferences and settings
  - Cart and product management (`lib/types/product-cart.ts`)

#### **TanStack Query 5.85.5** (React Query)
- **Role**: Server state management and caching
- **Implementation**:
  - Query caching with automatic invalidation
  - Optimistic updates for mutations
  - Background refetching strategies
- **Powers**:
  - API data fetching and caching
  - Pipeline metrics real-time updates (`lib/api/pipeline-metrics-client.ts`)
  - Automatic background synchronization
  - Stale-while-revalidate patterns

#### **SWR 2.3.6**
- **Role**: Alternative data fetching with stale-while-revalidate
- **Implementation**:
  - Real-time data updates
  - Focus revalidation
  - Interval polling for metrics
- **Powers**:
  - Real-time monitoring dashboards
  - Live chart data updates
  - Automatic cache invalidation

---

### UI Component Libraries

#### **Radix UI** (Complete Suite)
- **Components Implemented**:
  - `@radix-ui/react-dialog` - Modals and dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-tabs` - Tab navigation
  - `@radix-ui/react-accordion` - Expandable sections
  - `@radix-ui/react-select` - Custom select inputs
  - `@radix-ui/react-popover` - Popovers and tooltips
  - `@radix-ui/react-navigation-menu` - Navigation components
  - `@radix-ui/react-scroll-area` - Custom scrollbars
  - `@radix-ui/react-slider` - Range inputs
  - `@radix-ui/react-switch` - Toggle switches
  - `@radix-ui/react-tooltip` - Accessible tooltips
  - `@radix-ui/react-checkbox` - Checkbox inputs
  - `@radix-ui/react-radio-group` - Radio button groups
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-avatar` - User avatars
  - `@radix-ui/react-separator` - Dividers
  - `@radix-ui/react-progress` - Progress bars
  - `@radix-ui/react-hover-card` - Hover cards
  - `@radix-ui/react-collapsible` - Collapsible sections
- **Powers**:
  - All form components throughout the application
  - Modal workflows (build flow, connections, settings)
  - Navigation system
  - Accessible UI patterns (WCAG 2.1 AA compliant)

#### **shadcn/ui Pattern Library**
- **Role**: Pre-built component patterns on top of Radix
- **Implementation**: `components/ui/` directory
  - Custom theme system with CSS variables
  - Dark mode support
  - Reusable component compositions
- **Custom Components**:
  - `button`, `input`, `card`, `table`
  - `command-palette.tsx` - Command+K interface
  - `omni-launcher.tsx` - Quick action launcher
  - `enhanced-button.tsx`, `enhanced-tabs.tsx`
  - `theme-switcher.tsx` - Light/dark mode toggle
  - `ai-chat.tsx` - AI conversation interface
  - `markdown-renderer.tsx` - Rich text display
  - `pixel-icon.tsx`, `custom-icon.tsx` - Icon system
  - `tech-logo.tsx` - Technology logo display
  - `heatmap-grid.tsx` - Data visualization
  - `radial-chart.tsx`, `sankey-diagram.tsx`, `treemap-chart.tsx`, `time-series-chart.tsx`

#### **TanStack Table 8.21.3**
- **Role**: Headless table library for complex data grids
- **Implementation**:
  - Sorting, filtering, pagination
  - Column resizing and reordering
  - Virtualization for large datasets
- **Powers**:
  - Table browser (`components/build/TableGridView.tsx`)
  - Pipeline monitoring tables
  - Data product catalogs
  - Schema viewers

---

### Data Visualization

#### **Recharts 2.10.4**
- **Role**: React charting library built on D3
- **Implementation**:
  - Line charts, bar charts, area charts
  - Composed charts for multi-metric views
  - Responsive containers
- **Powers**:
  - Pipeline success rate charts (`components/monitor/SuccessRateChart.tsx`)
  - Pipeline metrics visualization (`components/monitor/PipelineMetricsCharts.tsx`)
  - Quality trends analysis
  - System activity visualization

#### **Visx 3.12.0**
- **Role**: Low-level visualization primitives (Airbnb's D3 wrapper)
- **Components**: `@visx/axis`, `@visx/curve`, `@visx/gradient`, `@visx/group`, `@visx/scale`, `@visx/shape`
- **Implementation**:
  - Custom SVG-based charts
  - Advanced data visualizations
  - Complex composition patterns
- **Powers**:
  - Custom time-series charts (`components/ui/time-series-chart.tsx`)
  - Sparklines (`components/monitor/PipelineSparkline.tsx`)
  - Advanced analytical visualizations

#### **D3.js 7.8.5**
- **Role**: Low-level data visualization and manipulation
- **Implementation**:
  - Force-directed graphs
  - Custom shape generators
  - Data transformations
- **Powers**:
  - Lineage graph visualization (`components/build/SchemaLineageFlow.tsx`)
  - Network diagrams
  - Complex data transformations

#### **ReactFlow 11.11.4**
- **Role**: Node-based graph editor and visualization
- **Implementation**:
  - Custom node types
  - Edge routing algorithms
  - Interactive graph manipulation
- **Powers**:
  - Lineage visualization (`components/build/LineageCanvasOverlay.tsx`)
  - Pipeline DAG visualization
  - Schema relationship graphs
  - Data flow diagrams

---

### Code Editors & SQL Tools

#### **CodeMirror 6**
- **Package**: `@uiw/react-codemirror 4.25.2`
- **Extensions**:
  - `@codemirror/lang-sql 6.10.0` - SQL language support
- **Implementation**:
  - Lightweight SQL editing
  - Custom extensions for validation
  - Theme customization
- **Powers**:
  - Inline SQL editors
  - Quick query composition
  - Configuration snippets

#### **TiDB Cloud TiSQL Editor 0.0.6**
- **Package**: `@tidbcloud/tisqleditor-react`
- **Extensions**:
  - `@tidbcloud/codemirror-extension-ai-widget` - AI-powered SQL assistance
  - `@tidbcloud/codemirror-extension-sql-autocomplete` - Smart SQL completion
  - `@tidbcloud/codemirror-extension-cur-sql-gutter` - Line indicators
  - `@tidbcloud/codemirror-extension-save-helper` - Save state management
  - `@tidbcloud/codemirror-extension-themes` - Custom theming
  - `@tidbcloud/codemirror-extension-events` - Event handling
- **Implementation**: `components/tisql/TiSQLEditor.tsx`
- **Powers**:
  - Full-featured SQL IDE (`app/(main)/build/page.tsx`)
  - AI-powered SQL generation and optimization
  - Query execution and result display
  - Schema exploration and autocomplete
  - **NEW**: Replaces tiSQL AI widget with custom CopilotKit integration

#### **SQL Formatter 15.6.6**
- **Role**: SQL beautification and standardization
- **Implementation**:
  - Automatic formatting on save
  - Configurable style rules
- **Powers**:
  - SQL code formatting across all editors
  - Query readability improvements

---

### AI Chat Interfaces

#### **CopilotKit 1.10.4**
- **Packages**:
  - `@copilotkit/react-core` - Core hooks and providers
  - `@copilotkit/react-ui` - Pre-built chat UI components
  - `@copilotkit/react-textarea` - AI-powered textarea
  - `@copilotkit/backend` - Backend integration
  - `@copilotkit/shared` - Shared utilities
- **Implementation**: `components/build/BuildAssistantCopilot.tsx`
- **Powers**:
  - **SQL Agent Integration**: 5 specialized CrewAI agents
    - Schema Explorer Agent
    - Query Validator Agent
    - Performance Optimizer Agent
    - Query Explainer Agent
    - Error Debugger Agent
  - Natural language to SQL conversion
  - Context-aware code suggestions
  - Generative UI for SQL results
  - Real-time AI assistance in build flow

#### **Assistant UI**
- **Packages**:
  - `@assistant-ui/react 0.11.15` - React components for AI chat
  - `@assistant-ui/react-ai-sdk 1.1.0` - Vercel AI SDK integration
- **Implementation**: `components/ui/ai-chat.tsx`
- **Powers**:
  - Conversational AI interfaces
  - Chat history management
  - Streaming responses
  - Custom message rendering

#### **Vercel AI SDK 5.0.50**
- **Role**: Framework for building AI-powered applications
- **Implementation**:
  - Streaming text generation
  - Tool calling and function execution
  - Multi-provider LLM support
- **Powers**:
  - AI chat backends (`app/api/chat/*`)
  - Streaming SQL generation
  - Real-time AI responses

---

### Form Management

#### **React Hook Form 7.62.0**
- **Role**: Performant form validation and management
- **Implementation**:
  - Uncontrolled components for performance
  - Schema validation with Zod
  - Field-level error handling
- **Powers**:
  - Build flow forms
  - Connection configuration forms
  - User settings and preferences
  - Data product request intake (`components/build/RequestIntake.tsx`)

#### **Zod 3.25.76**
- **Role**: TypeScript-first schema validation
- **Implementation**: `lib/schemas/` and `lib/validators/`
  - Form validation schemas
  - API request/response validation
  - Type-safe data transformations
- **Powers**:
  - Form validation across all flows
  - API contract validation
  - Runtime type safety
  - Contract schema validation (`lib/services/contract-serializer.ts`)

---

### Animation & Interaction

#### **Framer Motion 11.0.5**
- **Role**: Production-ready animation library
- **Implementation**:
  - Page transitions
  - Component animations
  - Gesture-based interactions
  - Layout animations
- **Powers**:
  - Modal enter/exit animations
  - Drawer slide-ins
  - List item transitions
  - Loading state animations
  - Hero section animations

#### **React Hotkeys Hook 5.1.0**
- **Role**: Keyboard shortcut management
- **Implementation**:
  - Global keyboard bindings
  - Context-aware shortcuts
- **Powers**:
  - Command palette (Cmd+K)
  - Quick navigation shortcuts
  - Editor keyboard commands
  - Accessibility improvements

---

### File Management & Utilities

#### **Chonky 2.3.2**
- **Role**: File browser component
- **Implementation**: `components/build/BrowserTreeView.tsx`
- **Powers**:
  - Catalog browser for data sources
  - Iceberg catalog navigation (`components/build/IcebergCatalogTree.tsx`)
  - Lakehouse file exploration
  - Saved query browser

#### **React Resizable Panels 3.0.6**
- **Role**: Resizable split panes
- **Implementation**:
  - Horizontal and vertical splits
  - Persistent layouts
- **Powers**:
  - Resizable dashboard layouts (`components/build/ResizableTableDashboard.tsx`)
  - Split editor views
  - Adjustable sidebar widths
  - Table exploration panels

#### **React Markdown 10.1.0 + Remark GFM 4.0.1**
- **Role**: Markdown rendering with GitHub Flavored Markdown
- **Implementation**: `components/ui/markdown-renderer.tsx`
- **Powers**:
  - Documentation rendering
  - AI response formatting
  - Rich text content display
  - Code block highlighting (with `react-syntax-highlighter 15.6.6`)

#### **Date-fns 4.1.0**
- **Role**: Modern date utility library
- **Implementation**:
  - Date formatting
  - Relative time calculations
  - Time zone handling
- **Powers**:
  - Pipeline execution timestamps
  - Data freshness indicators
  - Schedule formatting
  - Temporal data analysis

---

### Styling & Design System

#### **Tailwind CSS 3.4.1**
- **Role**: Utility-first CSS framework
- **Configuration**: `tailwind.config.js`
  - Custom color palettes:
    - `nexus-primary`, `nexus-accent`, `nexus-secondary`, `nexus-tertiary`
    - `win98-*` colors for retro Windows 98 theme
    - `geo-*` colors for geospatial visualizations
  - Custom font families: Reckless, Tiempos, Roobert, MS Sans Serif
  - Custom animations: `pulse-slow`, `spin-slow`, `float`, `accordion-*`
  - Win98-style shadows and borders
- **Plugin**: `tailwindcss-animate 1.0.7`
- **Powers**:
  - Entire application styling
  - Responsive design system
  - Dark mode variants
  - Custom component styles

#### **Class Variance Authority 0.7.1 + clsx 2.1.0 + tailwind-merge 2.2.1**
- **Role**: Type-safe variant management for Tailwind
- **Implementation**:
  - Component variant systems
  - Conditional class composition
  - Merge conflicting classes intelligently
- **Powers**:
  - Button variants (primary, secondary, ghost, etc.)
  - Size variants (sm, md, lg, xl)
  - State variants (loading, disabled, active)
  - Theme variants (light, dark, terminal)

#### **next-themes 0.4.6**
- **Role**: Theme management with system preference detection
- **Implementation**: `components/ui/theme-switcher.tsx`
- **Powers**:
  - Light/dark mode switching
  - System preference sync
  - Theme persistence
  - CSS variable theming

---

### Icon Systems

#### **Lucide React 0.330.0**
- **Role**: Modern icon library (Feather fork)
- **Implementation**:
  - 1000+ consistent icons
  - Tree-shakeable imports
  - Customizable size and color
- **Powers**:
  - Primary icon system across UI
  - Navigation icons
  - Action buttons
  - Status indicators

#### **Radix Icons 1.3.2**
- **Role**: Icon set designed for Radix UI
- **Implementation**:
  - Complementary to Lucide
  - UI-specific icons
- **Powers**:
  - Radix component icons
  - Dropdown indicators
  - Menu chevrons

#### **Phosphor React 1.4.1**
- **Role**: Flexible icon family
- **Implementation**:
  - Multiple weights (thin, light, regular, bold)
  - Duotone variants
- **Powers**:
  - Alternative icon styles
  - Weighted icon variants
  - Brand-specific icons

#### **PixelArtIcons 1.8.1**
- **Package**: `@hackernoon/pixel-icon-library 1.0.6`
- **Implementation**: `components/ui/pixel-icon.tsx`
- **Powers**:
  - Retro pixel art aesthetic
  - Terminal-style UI elements
  - 8-bit data visualization icons
  - Design system showcase (`components/design-system/PixelIconsShowcase.tsx`)

#### **Custom Icon System**
- **Implementation**: `components/ui/custom-icon.tsx`, `components/ui/tech-logo.tsx`
- **Powers**:
  - Technology logos (Spark, Trino, Kafka, etc.)
  - Custom brand icons
  - SVG sprite management
  - Dynamic icon loading

---

### Utility Libraries

#### **Immer 10.1.1**
- **Role**: Immutable state updates with mutable syntax
- **Implementation**:
  - State management helpers
  - Reducer logic simplification
- **Powers**:
  - Complex state updates in Zustand stores
  - Form state management
  - Undo/redo functionality

#### **CMDK 1.1.1**
- **Role**: Command menu primitive (Cmd+K interface)
- **Implementation**: `components/ui/command-palette.tsx`, `components/ui/nexus-data-command.tsx`
- **Powers**:
  - Quick navigation system
  - Action launcher
  - Search interface
  - Keyboard-first interactions

#### **dotenv 17.2.2**
- **Role**: Environment variable management
- **Implementation**:
  - `.env.local` configuration
  - Development/production environment separation
- **Powers**:
  - API key management
  - Feature flags
  - Configuration injection

---

## Backend Stack

### Core Framework

#### **FastAPI 0.104.1**
- **Role**: Modern Python web framework
- **Implementation**: `backend/main.py`
  - Async request handling
  - Automatic OpenAPI documentation
  - Dependency injection
  - Middleware pipeline
- **Powers**:
  - All REST API endpoints (`backend/api/*`)
  - WebSocket endpoints
  - Background task processing
  - API documentation at `/docs`

#### **Uvicorn 0.24.0**
- **Role**: ASGI server with WebSocket support
- **Implementation**:
  - Multi-worker process management
  - Hot reload in development
  - Production-ready serving
- **Powers**:
  - Python backend server runtime
  - Concurrent request handling
  - WebSocket connections

#### **Pydantic 2.4.2**
- **Role**: Data validation with Python type hints
- **Implementation**: `backend/models/`
  - Request/response models
  - Configuration validation
  - Type-safe data structures
- **Powers**:
  - API contract enforcement (`backend/models/schemas.py`)
  - Configuration validation (`pydantic-settings 2.0.3`)
  - Runtime type checking
  - Automatic JSON schema generation

---

### Database & Storage

#### **SQLAlchemy 2.0.23**
- **Role**: SQL toolkit and ORM
- **Implementation**:
  - Async SQLAlchemy engine
  - Declarative models
  - Query builder
- **Powers**:
  - PostgreSQL interactions
  - Database migrations (with `alembic 1.12.1`)
  - Connection pooling
  - Transaction management

#### **PostgreSQL** (via psycopg2-binary 2.9.8)
- **Role**: Primary relational database
- **Implementation**:
  - Glossary term storage (`backend/services/glossary_persistence.py`)
  - User session management
  - Application state persistence
- **Powers**:
  - Glossary feedback loop storage
  - Data product metadata
  - User preferences and settings
  - Audit logs

#### **Redis 5.0.1**
- **Role**: In-memory data store and cache
- **Implementation**:
  - Session storage
  - Rate limiting
  - Pub/sub messaging
- **Powers**:
  - API response caching
  - Real-time feature flags
  - Distributed locks
  - Message queue

---

### Data Processing

#### **Pandas 2.1.3**
- **Role**: Data manipulation and analysis
- **Implementation**:
  - DataFrame operations
  - Data cleaning and transformation
  - Statistical analysis
- **Powers**:
  - Data profiling input (`backend/services/data_profiling.py`)
  - CSV/Excel processing
  - Data quality analysis
  - Sample data generation

#### **Polars 0.19.14**
- **Role**: High-performance DataFrame library (Rust-based)
- **Implementation**:
  - Fast data transformations
  - Lazy evaluation
  - Multi-threaded operations
- **Powers**:
  - Large dataset processing
  - Performance-critical operations
  - Alternative to Pandas for speed

#### **NumPy 1.25.2**
- **Role**: Numerical computing foundation
- **Implementation**:
  - Array operations
  - Mathematical functions
  - Random number generation
- **Powers**:
  - Statistical calculations
  - Mock data generation
  - Numerical transformations

#### **PyArrow 14.0.1**
- **Role**: Columnar data format (Apache Arrow)
- **Implementation**:
  - Zero-copy reads
  - Efficient serialization
  - Parquet file handling
- **Powers**:
  - Iceberg table integration
  - Fast data exchange with Trino
  - Parquet read/write operations

---

### Security & Authentication

#### **python-jose 3.3.0**
- **Role**: JWT token implementation
- **Implementation**:
  - Token generation and validation
  - Claims management
- **Powers**:
  - User authentication tokens
  - API authentication
  - Service-to-service auth

#### **passlib 1.7.4**
- **Role**: Password hashing library
- **Implementation**:
  - bcrypt password hashing
  - Secure password storage
- **Powers**:
  - User password management
  - API key hashing
  - Credential storage

---

### Utilities

#### **httpx 0.25.2**
- **Role**: Async HTTP client
- **Implementation**:
  - External API calls
  - Service mesh communication
  - Async requests
- **Powers**:
  - DataHub API integration (`backend/services/datahub_client.py`)
  - External service calls
  - Webhook delivery
  - Health checks

#### **Loguru 0.7.2**
- **Role**: Simplified logging library
- **Implementation**:
  - Structured logging
  - Automatic exception logging
  - Log rotation
- **Powers**:
  - Application logging
  - Error tracking
  - Debug output
  - Audit trails

#### **Tenacity 8.2.3**
- **Role**: Retry library for unreliable operations
- **Implementation**:
  - Exponential backoff
  - Configurable retry strategies
- **Powers**:
  - API call retries
  - Database connection resilience
  - External service fault tolerance

#### **python-multipart 0.0.6**
- **Role**: Multipart form data parsing
- **Implementation**:
  - File upload handling
  - Form data parsing
- **Powers**:
  - CSV/Excel file uploads
  - Image uploads
  - Multi-part API requests

---

## AI/ML & Intelligence Layer

### AI Agent Framework

#### **CrewAI 0.193.2**
- **Role**: Multi-agent AI orchestration framework
- **Implementation**: `crewai-backend/crews/`
  - Specialized agent definitions
  - Task decomposition
  - Inter-agent collaboration
  - Tool integration
- **Specialized Agent Crews**:

  **1. ReAct SQL Generation Crew** (`react_sql_crew.py`)
  - **ReAct SQL Specialist Agent**: Reasoning and Acting pattern for iterative SQL generation
  - **ReAct Query Optimizer Agent**: Performance optimization through iterative testing
  - **Tools**: SQL Validation, Schema Discovery, Query Testing
  - **Powers**: Intelligent SQL generation with self-correction and optimization

  **2. Query Optimization Crew** (`query_optimization_crew.py`)
  - **Senior Database Performance Engineer**: Query plan analysis
  - **Trino Performance Specialist**: Trino-specific optimizations
  - **Powers**: SQL query optimization, execution plan improvement

  **3. Pipeline Design Crew** (`pipeline_design_crew.py`)
  - **Data Pipeline Architect**: Pipeline design and best practices
  - **Data Quality Engineer**: Quality validation integration
  - **Powers**: End-to-end pipeline architecture recommendations

  **4. Connection Analysis Crew** (`connection_analysis_crew.py`)
  - **Connection Security Analyst**: Security validation
  - **Integration Specialist**: Compatibility verification
  - **Powers**: Connection validation, security analysis

  **5. System Health Crew** (`system_health_crew.py`)
  - **Site Reliability Engineer**: Pattern recognition across distributed systems
  - **Infrastructure Monitoring Specialist**: Resource utilization analysis
  - **Powers**: Root cause analysis, cascading failure prediction

  **6. Data Quality & Architecture Crews** (`backend/services/crew_intelligence.py`)
  - **Senior Data Quality Engineer**: Great Expectations rule generation
  - **Principal Data Architect**: SQLMesh architecture recommendations
  - **Senior Business Analyst**: Business impact translation
  - **Senior Data Operations Storyteller**: Technical-to-business narrative conversion
  - **Business Impact Analyst**: Stakeholder impact mapping
  - **Pattern Recognition Agent**: Cross-system root cause identification
  - **Action Recommendation Agent**: Prescriptive fix generation

- **MCP Adapters**: `crewai-backend/tools/mcp_adapters.py`
  - **AirflowMCP**: DAG and task management
  - **TrinoMCP**: Query performance and optimization
  - **SparkMCP**: Job monitoring and resource management
  - **DataHubMCP**: Metadata and lineage queries
  - **GreatExpectationsMCP**: Data quality management

- **Powers**:
  - Intelligent SQL generation with context awareness
  - Query optimization with performance validation
  - Architecture recommendations based on data characteristics
  - Quality rule generation from profiling results
  - Business impact analysis of technical issues
  - Cross-system root cause analysis
  - Prescriptive action recommendations

#### **LangChain 0.0.354**
- **Role**: LLM application framework
- **Implementation**:
  - Prompt templates and chains
  - Memory management for conversations
  - Tool integration with LLMs
- **Powers**:
  - LLM prompt engineering
  - Conversation history management
  - RAG (Retrieval Augmented Generation) pipelines
  - Agent tool calling


---

### Model Context Protocol (MCP)

#### **@modelcontextprotocol/sdk 1.17.5**
- **Role**: Framework for connecting LLMs to external tools and data
- **Implementation**: `backend/mcp-servers/` and `crewai-backend/tools/mcp_adapters.py`
- **MCP Servers**:
  - Airflow MCP: DAG management, task monitoring
  - Trino MCP: Query execution, performance metrics
  - Spark MCP: Job monitoring, resource management
  - DataHub MCP: Metadata queries, lineage tracking
  - Great Expectations MCP: Quality validation, profiling
- **Powers**:
  - Real-time tool integration for AI agents
  - Bi-directional data flow between agents and infrastructure
  - Standardized tool interfaces for multi-agent systems
  - Context preservation across tool invocations

---

### Vector Search & Embeddings

#### **Sentence Transformers 2.2.2**
- **Role**: Pre-trained sentence embedding models
- **Implementation**:
  - Semantic search
  - Text similarity computation
  - Document clustering
- **Powers**:
  - Semantic query search
  - Similar table discovery
  - Natural language query understanding
  - Document similarity matching

#### **FAISS CPU 1.7.4**
- **Role**: Vector similarity search (Facebook AI)
- **Implementation**:
  - In-memory vector index
  - Approximate nearest neighbor search
  - Clustering algorithms
- **Powers**:
  - Fast semantic search
  - Query suggestion systems
  - Similar query retrieval
  - Pattern matching in queries

#### **scikit-learn 1.3.2**
- **Role**: Machine learning library
- **Implementation**:
  - Classification models
  - Clustering algorithms
  - Dimensionality reduction
- **Powers**:
  - Data quality anomaly detection
  - Query pattern clustering
  - Feature engineering for recommendations
  - Statistical analysis

---

## Data Engineering Tools

### Data Quality & Profiling

#### **YData Profiling 4.6.3** (formerly pandas-profiling)
- **Role**: Automated exploratory data analysis and profiling
- **Implementation**: `backend/services/data_profiling.py`
- **Features**:
  - Comprehensive dataset profiling
  - Missing value analysis
  - Type inference and validation
  - Correlation matrices
  - Distribution analysis
  - HTML report generation (base64 encoded)
- **Powers**:
  - **Data quality scoring system** (0-100 scale)
  - **Automated quality issue detection**:
    - High missing values (>10%)
    - Duplicate rows (>5%)
    - Low text cardinality
    - High categorical cardinality
    - Infinite numeric values
    - Excessive zeros
  - **Great Expectations rule suggestions**:
    - Null value expectations
    - Categorical value set validation
    - Numeric range validation
  - **Quality recommendations**:
    - Imputation strategies
    - Type conversions
    - Data cleaning procedures
  - **Cache management** for performance
  - **Async execution** with thread pooling

#### **Great Expectations 0.18.8**
- **Role**: Data validation and quality testing framework
- **Implementation**: `backend/services/great_expectations_service.py`
- **Features**:
  - Expectation suite management
  - Batch validation
  - Checkpoint execution
  - Data docs generation
- **Powers**:
  - **Data quality validation** in build flow
  - **Self-service quality gates**:
    - Completeness checks (null value detection)
    - Uniqueness validation
    - Type validation
    - Range validation
    - Pattern matching (email, phone, regex)
    - Accepted value sets
  - **Integration with YData Profiling** for automatic rule generation
  - **CrewAI integration** for intelligent quality recommendations
  - **Deployment validation** (blocking/warning/optimization gates)
  - **Quality rule builder UI** (`components/build/QualityRulesBuilder.tsx`)

---

### Transformation Layer

#### **SQLMesh >= 0.90.0**
- **Role**: Data transformation framework with virtual environments
- **Implementation**: `backend/services/sqlmesh_service.py`
- **Features**:
  - **SQL-based model definitions**
  - **Virtual environments** for safe testing against production data
  - **Incremental models** with time-based partitioning
  - **Column-level lineage** tracking
  - **Audit trail** and data quality checks
  - **Plan and deploy workflows**
- **Model Types Supported**:
  - `VIEW`: Lightweight transforms
  - `INCREMENTAL_BY_TIME_RANGE`: Time-partitioned incremental processing
  - `FULL`: Full table refreshes
- **Powers**:
  - **Contract-to-code generation** from ODCS contracts:
    - Automatic model SQL generation
    - Schema-aware transformations
    - Quality audit generation
  - **Incremental processing** for large datasets:
    - Time-based lookback windows
    - Late-arriving data handling
    - Partition management
  - **Virtual environment testing**:
    - Safe testing against production data
    - Side-by-side comparisons
    - Zero production impact
  - **Column-level lineage** extraction
  - **Iceberg table integration**:
    - Partitioning strategies (`date(timestamp)`)
    - Clustering optimization
    - Table property management
  - **Quality audit generation** from contracts:
    - Unique constraints
    - Not null checks
    - Range validations
    - Format checks

**Example Model Generation Flow**:
```
ODCS Contract → SQLMesh Service → Generated Model:
  - Model header (name, kind, time_column)
  - Partitioning strategy
  - Clustering strategy
  - SELECT statement with type casting
  - Quality audits
```

---

### Metadata & Governance

#### **DataHub Integration**
- **Implementation**: `backend/services/datahub_client.py`
- **Features**:
  - RESTful API client
  - Glossary term management
  - Dataset metadata CRUD
  - Relationship management
  - Search and discovery
- **Powers**:
  - **Glossary feedback loop**:
    - AI-generated glossary term persistence
    - Term definition refinement
    - DataHub synchronization
    - Column-to-term mapping
  - **Metadata propagation**:
    - Ownership tracking
    - Tag management
    - Custom properties
    - Temporal metadata (created_at, updated_at)
  - **Lineage integration**:
    - Upstream/downstream tracking
    - Impact analysis
    - Lineage visualization support
  - **Quality metadata**:
    - Completeness scores
    - Accuracy metrics
    - Freshness indicators
    - Schema compliance status

**Glossary Term Flow**:
```
AI Agent → Glossary Term Suggestion → User Confirmation →
DataHub Client → Persistent Storage (PostgreSQL + DataHub) →
Column Association → Business Glossary
```

---

### Policy & Security

#### **Apache Ranger Policy Generator**
- **Implementation**: `backend/services/ranger_policy_generator.py`
- **Features**:
  - Automated policy generation from contracts
  - PII detection and masking
  - Role-based access control (RBAC)
  - Row-level and column-level security
- **Powers**:
  - **PII detection** from schema analysis:
    - Email pattern detection
    - Phone number identification
    - SSN/credit card detection
    - Custom PII patterns
  - **Masking policies**:
    - Hash masking for identifiers
    - Redaction for sensitive fields
    - Partial masking (show last 4)
    - Nullify for critical PII
  - **Access policies**:
    - Role-based permissions
    - User/group assignments
    - Resource-level controls
  - **Quality gates integration**:
    - Blocking deployment for unmasked PII
    - Security validation before deployment

#### **Open Policy Agent (OPA) Integration**
- **Implementation**: `backend/services/opa_policy_engine.py`
- **Features**:
  - Policy-as-code validation
  - Business rule enforcement
  - Governance automation
- **Powers**:
  - **Data product policy validation**:
    - Classification requirements
    - Ownership validation
    - Documentation standards
    - Naming conventions
  - **Deployment gates**:
    - Policy compliance checking
    - Violation detection
    - Remediation suggestions
  - **Governance service integration** (`backend/services/governance_service.py`)

---

### Quality Gates System

#### **Quality Gates Orchestration Service**
- **Implementation**: `backend/services/quality_gates_service.py`
- **Architecture**: 3-tier gate system for self-service deployment
- **Tiers**:

  **TIER 1: Blocking Gates** (Must pass to deploy)
  1. **Policy Compliance** (OPA)
     - Critical policy violations
     - Classification requirements
     - Ownership validation
  2. **PII Detection and Masking** (Ranger)
     - Unmasked PII detection
     - Masking policy validation
     - Security compliance
  3. **SQL Syntax Validation** (Trino)
     - Syntax correctness
     - Parentheses matching
     - Basic query structure
  4. **Critical Quality Rules** (Great Expectations)
     - Severity: critical
     - Business-critical validations
     - Mandatory data quality checks
  5. **Required Metadata** (DataHub)
     - Description, domain, owner, classification
     - Mandatory documentation fields

  **TIER 2: Warning Gates** (Can deploy with acknowledgment)
  6. **Data Quality Profile** (YData Profiling)
     - Quality score threshold: 80%
     - Data quality issues
     - Recommendations for improvement
  7. **Documentation Completeness**
     - Completeness threshold: 75%
     - Business context, usage examples
     - Column descriptions
  8. **Schema Breaking Changes** (DataHub)
     - Schema evolution tracking
     - Backward compatibility
  9. **Non-Critical Quality Rules** (Great Expectations)
     - Severity: warning
     - Optional quality validations

  **TIER 3: Optimization Gates** (Deploy first, improve later)
  10. **Performance Optimizations** (CrewAI)
      - Partitioning opportunities
      - Incremental processing
      - Index suggestions
  11. **Quality Improvements** (YData Profiling)
      - Type conversion recommendations
      - Data cleaning suggestions
      - Performance improvements

- **Deployment Decision Matrix**:
  ```
  No blocking failures + No warnings = Auto-deploy
  No blocking failures + Warnings = Deploy with acknowledgment
  Blocking failures = Deployment blocked
  ```

- **Powers**:
  - **80% self-service deployment rate**
  - **Automated compliance validation**
  - **Risk-based deployment decisions**
  - **Clear remediation guidance**
  - **Comprehensive validation reports**

---

## Infrastructure & DevOps

### Development Tools

#### **TypeScript 5.3.3**
- **Role**: Type-safe JavaScript superset
- **Configuration**: `tsconfig.json`
- **Powers**:
  - Type safety across entire frontend codebase
  - IDE autocomplete and error detection
  - Refactoring support
  - Interface contracts

#### **ESLint 8.56.0**
- **Configuration**: `eslint-config-next 14.1.0`
- **Powers**:
  - Code quality enforcement
  - Best practice validation
  - Automatic formatting
  - Next.js-specific rules

#### **PostCSS 8.4.35**
- **Role**: CSS transformation tool
- **Plugins**: Autoprefixer, Tailwind
- **Powers**:
  - Browser compatibility (autoprefixer 10.4.16)
  - Tailwind CSS processing
  - CSS optimization

---

### Testing

#### **Jest 30.2.0**
- **Configuration**: `jest.config.js`, `jest.config.llm.js`
- **Environment**: `jest-environment-jsdom 30.2.0`
- **Implementation**: `__tests__/`
- **Powers**:
  - Unit testing for utilities and services
  - React component testing (with `@testing-library/react 16.3.0`)
  - Snapshot testing
  - Coverage reporting

#### **Playwright 1.55.0**
- **Configuration**: `playwright.config.ts`
- **Implementation**: `e2e/`
- **Powers**:
  - End-to-end testing
  - Cross-browser testing
  - Visual regression testing
  - API testing

#### **Testing Library**
- **Packages**:
  - `@testing-library/react 16.3.0`
  - `@testing-library/jest-dom 6.9.0`
- **Powers**:
  - User-centric component testing
  - Accessibility-first testing
  - Integration testing

#### **Faker 19.13.0**
- **Role**: Mock data generation
- **Implementation**: `backend/services/mock_infrastructure.py`
- **Powers**:
  - Realistic test data generation
  - Mock API responses
  - Sample dataset creation

#### **Factory Boy 3.3.0**
- **Role**: Test fixture factory
- **Powers**:
  - Model instance generation for tests
  - Relationship handling
  - Sequence management

---

### Build & Deployment

#### **Sharp 0.34.4**
- **Role**: High-performance image processing
- **Powers**:
  - Image optimization in Next.js
  - WebP conversion
  - Responsive image generation

#### **tsx 4.20.6**
- **Role**: TypeScript execution and REPL
- **Powers**:
  - Run TypeScript scripts directly
  - Development utility execution
  - Data generation scripts (`lib/generators/`)

#### **ts-jest 29.4.4**
- **Role**: Jest TypeScript preprocessor
- **Powers**:
  - TypeScript test execution
  - Type checking in tests
  - Source map support

---

### Python Testing

#### **pytest 7.4.3**
- **Package**: `pytest-asyncio 0.21.1` for async support
- **Implementation**: `backend/tests/`
- **Powers**:
  - Python unit testing
  - Async test support
  - Fixture management
  - Integration testing

---

## Feature-to-Technology Mapping

### Build Flow - Data Product Creation

**Feature**: End-to-end data product development workflow

**Technologies**:
- **Frontend**: Next.js App Router (`app/(main)/build/page.tsx`)
- **UI Components**:
  - `LinearWorkflowNew.tsx` - Step-by-step wizard
  - `VerticalStepper.tsx` - Progress tracking
  - `WorkflowProgressBar.tsx` - Visual progress indicator
- **State Management**: Zustand stores for workflow state
- **Forms**: React Hook Form + Zod validation
- **Backend**: FastAPI routes (`backend/api/build_routes.py`)

**Steps**:

1. **Step 1: Request Intake**
   - **Component**: `RequestIntake.tsx`
   - **Tech**: React Hook Form, Zod schemas
   - **Backend**: `backend/services/request-processing.ts`
   - **Powers**: Natural language requirement capture, persona detection

2. **Step 2: Source Selection & Discovery**
   - **Components**:
     - `DataBrowser.tsx`, `LakehouseCatalogBrowser.tsx`
     - `NexusEcosystemBrowser.tsx`
     - `IcebergCatalogTree.tsx`
   - **Tech**: Chonky file browser, TanStack Table
   - **Backend**: Trino catalog integration
   - **Powers**: Iceberg catalog browsing, table discovery, metadata preview

3. **Step 3: SQL Workstation**
   - **Components**:
     - `TiSQLEditor.tsx` - SQL IDE
     - `BuildAssistantCopilot.tsx` - AI SQL agent
     - `HybridSQLWorkbench.tsx` - Unified SQL interface
   - **Tech**:
     - TiDB TiSQL Editor with CodeMirror extensions
     - CopilotKit for AI integration
     - Monaco Editor for advanced editing
   - **AI Agents** (5 CrewAI agents):
     - Schema Explorer Agent
     - Query Validator Agent
     - Performance Optimizer Agent
     - Query Explainer Agent
     - Error Debugger Agent
   - **Backend**: `crewai-backend/crews/react_sql_crew.py`
   - **Powers**:
     - Natural language to SQL
     - ReAct pattern for iterative improvement
     - Real-time validation and optimization
     - Context-aware autocomplete
     - Generative UI for results

4. **Step 4: Contract Designer**
   - **Component**: `ContractSchemaDesigner.tsx`
   - **Tech**: ODCS v4.0 schema builder
   - **Backend**: `backend/services/contract-serializer.ts`
   - **Powers**: Schema definition, ODCS contract generation

5. **Step 5: Transform & Quality**
   - **Components**:
     - `QualityRulesBuilder.tsx`
     - `TransformContextSidebar.tsx`
   - **Tech**:
     - Great Expectations rule builder
     - YData Profiling integration
   - **Backend**:
     - `backend/services/quality_gates_service.py`
     - `backend/services/data_profiling.py`
   - **AI**: CrewAI Data Quality Agent for intelligent rule suggestions
   - **Powers**:
     - Automated quality rule generation
     - Data profiling with quality scoring
     - Three-tier quality gates

6. **Step 6: Review & Deploy**
   - **Component**: `Step6ReviewDeploy.tsx`
   - **Tech**: Quality gates orchestration
   - **Backend**:
     - `backend/services/quality_gates_service.py`
     - `backend/services/sqlmesh_service.py`
   - **Powers**:
     - Automated quality gate validation
     - SQLMesh model generation
     - Deployment decision automation
     - Self-service deployment (80% auto-approval rate)

---

### Monitor - Pipeline & System Monitoring

**Feature**: Real-time pipeline monitoring and system health

**Technologies**:
- **Frontend**: `app/(main)/monitor/page.tsx`
- **Components**:
  - `PipelineDetailPanel.tsx` - Pipeline drill-down
  - `PipelineMetricsCharts.tsx` - Metric visualization
  - `PipelineSparkline.tsx` - Compact trend charts
  - `SuccessRateChart.tsx` - Success rate visualization
  - `ActivityHeatmap.tsx` - Temporal activity patterns
  - `HeroStatus.tsx` - System health overview
  - `IssueStream.tsx` - Real-time issue feed
- **Visualization**: Recharts, Visx, custom ASCII charts
- **Real-Time**: Socket.IO for live updates
- **Backend**:
  - `backend/services/pipeline_metrics_service.py`
  - `backend/services/airflow_metrics_service.py`
  - `backend/services/kafka_metrics_service.py`
- **AI**: CrewAI System Health Crew for root cause analysis

**Data Sources**:
- Airflow (via MCP): DAG status, task failures
- Trino (via MCP): Query performance, resource usage
- Spark (via MCP): Job status, executor metrics
- Kafka (via service): Topic lag, throughput
- DataHub (via MCP): Metadata quality, lineage health

**Powers**:
- Real-time pipeline status updates (30s intervals)
- Cascading failure prediction
- Root cause analysis with AI
- Business impact assessment
- Prescriptive action recommendations

---

### Discover - Data Product Marketplace

**Feature**: Semantic search and discovery of data products

**Technologies**:
- **Frontend**: `app/(main)/discover/`
- **Components**:
  - `DataEcosystemBrowser.tsx` - Product browsing
  - `SemanticSearchBar.tsx` - NLP search
  - `RecommendationsSection.tsx` - AI recommendations
  - `ProductCardFactory.tsx` - Dynamic product cards
  - `TableDetailPanel.tsx` - Metadata viewer
- **Backend**:
  - `backend/services/recommendation_engine.py`
  - `backend/services/table_analysis_service.py`
- **AI**:
  - Sentence Transformers for semantic embeddings
  - FAISS for vector similarity search
  - CrewAI for recommendation generation
- **Powers**:
  - Natural language search
  - Semantic table discovery
  - Usage-based recommendations
  - Context-aware suggestions

---

### Operations - Command Center Dashboard

**Feature**: Unified operations dashboard with intelligent insights

**Technologies**:
- **Frontend**: `app/(main)/page.tsx` (Command Center)
- **Components**:
    - `SystemActivity.tsx` - Activity visualization
  - `OptimizationOpportunitiesCard.tsx` - AI suggestions
- **Visualization**: ASCII charts with Socket.IO streaming
- **Backend**: `backend/api/overview_routes.py`
- **AI**: CrewAI Overview Intelligence Agents
  - Change Narrative Agent: Technical-to-business translation
  - Business Context Agent: Stakeholder impact mapping
  - Pattern Recognition Agent: Cross-system analysis
  - Action Recommendation Agent: Prescriptive fixes
- **Powers**:
  - Business-focused system summaries
  - Cross-system pattern recognition
  - Intelligent issue prioritization
  - Actionable recommendations

---

### Glossary Feedback Loop

**Feature**: AI-powered business glossary with human-in-the-loop refinement

**Technologies**:
- **Frontend**: `components/build/GlossaryTermConfirmation.tsx`
- **Backend**:
  - `backend/services/glossary_persistence.py` - PostgreSQL storage
  - `backend/services/datahub_client.py` - DataHub sync
  - `backend/models/glossary.py` - Data models
- **AI**: CrewAI Business Agent for term suggestion
- **Database**: PostgreSQL for persistence
- **Integration**: DataHub for enterprise metadata sync

**Flow**:
1. AI suggests glossary term from context
2. User reviews and confirms/edits
3. Store in PostgreSQL
4. Sync to DataHub metadata graph
5. Associate with dataset columns
6. Propagate to downstream systems

---

### Pattern Matching System

**Feature**: Intelligent pattern recognition for queries, schemas, and data quality

**Technologies**:
- **Backend**:
  - `backend/services/pattern_library.py` - Pattern storage
  - `backend/services/table_recommendations.py` - ML-based suggestions
  - `backend/consensus_ranking.py` - Multi-agent consensus
- **AI**:
  - Sentence Transformers for pattern embeddings
  - FAISS for pattern similarity search
  - scikit-learn for clustering and classification
  - CrewAI for pattern analysis
- **Powers**:
  - Query pattern recognition
  - Schema pattern matching
  - Quality issue pattern detection
  - Recommendation generation from historical patterns

---

### Trino Catalog Generation

**Feature**: Automated Trino catalog configuration from data sources

**Technologies**:
- **Backend**: `backend/services/trino_catalog_service.py`
- **Testing**: `scripts/test-trino-catalog-generation.ts`
- **Powers**:
  - Automatic catalog.properties generation
  - Connector-specific configuration
  - Security parameter injection
  - Iceberg catalog setup

**Supported Connectors**:
- PostgreSQL, MySQL, Oracle, SQL Server
- Iceberg (S3, HDFS, GCS)
- Kafka, Elasticsearch
- Delta Lake, Hudi

---

### Domain Accelerators

**Feature**: Industry-specific templates and patterns

**Technologies**:
- **Backend**: `backend/services/domain_accelerators/`
  - `retail.py` - Retail analytics templates
  - Other domain modules
- **Powers**:
  - Pre-built data product templates
  - Industry-specific quality rules
  - Common schema patterns
  - Best practice enforcement

---

## System Architecture Patterns

### Intelligent Orchestration Layer

NexusOne functions as an **orchestration platform** that enhances existing enterprise tools rather than replacing them. This is achieved through:

1. **API-First Integration**
   - Deep integration with enterprise tool APIs
   - Real-time state synchronization
   - Bi-directional data flow

2. **MCP Framework**
   - Model Context Protocol for standardized tool interfaces
   - CrewAI agents with MCP tool access
   - Automated workflow orchestration

3. **80/20 Orchestration Rule**
   - 80% of workflows through intelligent API orchestration
   - 20% through embedded native tool interfaces
   - Seamless transitions between orchestration and native tools

### Three-Tier Quality Gates

Quality gates are organized into three tiers to enable self-service while maintaining governance:

1. **Tier 1: Blocking Gates** (Must pass to deploy)
   - Policy compliance
   - Security validation
   - Critical quality checks

2. **Tier 2: Warning Gates** (Deploy with acknowledgment)
   - Data quality scores
   - Documentation completeness
   - Non-critical quality rules

3. **Tier 3: Optimization Gates** (Deploy first, improve later)
   - Performance optimizations
   - Quality improvements
   - Best practice suggestions

### Multi-Agent AI Architecture

AI capabilities are provided through specialized agent crews:

1. **Domain-Specific Agents**
   - Each agent has specialized knowledge
   - Agents collaborate on complex tasks
   - ReAct pattern for iterative improvement

2. **Tool Integration via MCP**
   - Agents access enterprise tools through MCP
   - Standardized tool interfaces
   - Real-time data access

3. **Human-in-the-Loop**
   - AI suggests, human confirms
   - Transparent reasoning
   - Full manual override capability

### Progressive Enhancement Strategy

The platform follows a progressive enhancement approach:

1. **Read**: Aggregate data from multiple tools
2. **Orchestrate**: Coordinate multi-tool workflows
3. **Automate**: Execute routine operations
4. **Learn**: Improve from usage patterns

### Real-Time Streaming Architecture

Real-time capabilities powered by:

1. **Socket.IO WebSockets**
   - Bi-directional communication
   - Room-based pub/sub
   - Automatic reconnection

2. **Server-Sent Events**
   - Unidirectional server→client streams
   - Chart data updates
   - Metric streaming

3. **Polling Strategies**
   - SWR for automatic revalidation
   - React Query background refetching
   - Configurable intervals

---

## Technology Decision Rationale

### Why Next.js?
- Server-side rendering for performance
- API routes eliminate need for separate backend
- Excellent developer experience
- Built-in optimization (image, fonts, etc.)
- Strong TypeScript support

### Why FastAPI?
- Async/await for concurrent operations
- Automatic API documentation
- Pydantic validation
- Modern Python features
- WebSocket support

### Why CrewAI?
- Multi-agent orchestration
- Task decomposition
- Tool integration framework
- Memory and context management
- ReAct pattern support

### Why SQLMesh?
- Virtual environments for safe testing
- Incremental processing
- Column-level lineage
- SQL-based (familiar to data engineers)
- Iceberg table support

### Why Great Expectations?
- Industry standard for data quality
- Extensible expectation library
- Data docs generation
- Checkpoint execution
- Integration with data catalogs

### Why YData Profiling?
- Comprehensive profiling
- HTML report generation
- Statistical analysis
- Quality issue detection
- Integration with Great Expectations

### Why Zustand over Redux?
- Simpler API
- Less boilerplate
- Better TypeScript support
- Smaller bundle size
- Easier learning curve

### Why TanStack Table?
- Headless architecture
- Full control over rendering
- Excellent performance
- Rich feature set
- TypeScript-first



---

## Key Metrics

### Frontend Bundle Size
- **Next.js Production Build**: ~450KB gzipped
- **First Load JS**: ~320KB
- **Shared by All Pages**: ~180KB
- **Page-specific**: ~140KB average

### Backend Performance
- **API Response Time**: <200ms p95
- **Concurrent Requests**: 1000+ req/s
- **WebSocket Connections**: 10,000+ concurrent
- **Database Connections**: Pool of 20

### AI/ML Inference
- **CrewAI Task Execution**: 5-30s depending on complexity
- **SQL Generation**: 2-10s with ReAct pattern
- **Semantic Search**: <100ms (FAISS)
- **Quality Rule Generation**: 10-20s (with profiling)

---

## Development Workflow

### Local Development Setup

```bash
# Frontend
npm install
npm run dev  # Port 3000

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# CrewAI Backend
cd crewai-backend
pip install -r requirements.txt
uvicorn enhanced_server:app --reload --port 8001
```

### Testing

```bash
# Frontend Tests
npm test              # Unit tests
npm run test:coverage # Coverage report

# E2E Tests
npx playwright test

# Backend Tests
pytest backend/tests/
```

### Code Quality

```bash
# Linting
npm run lint         # ESLint for frontend
ruff backend/        # Python linting

# Type Checking
npx tsc --noEmit     # TypeScript type checking
mypy backend/        # Python type checking (if configured)
```

---

## Deployment Architecture

### Production Stack

- **Frontend**: Next.js deployed on Vercel or self-hosted Node.js
- **Backend**: FastAPI on Uvicorn with Nginx reverse proxy
- **Database**: PostgreSQL (managed service recommended)
- **Cache**: Redis (managed service recommended)
- **WebSockets**: Socket.IO with sticky sessions
- **AI**: CrewAI backend as separate microservice

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_MAPTILER_KEY=<key>
```

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://user:pass@host:5432/nexusone
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=<key>
DATAHUB_BASE_URL=http://localhost:8080
DATAHUB_GMS_URL=http://localhost:8080/api/gms
```

---

## Future Technology Additions

### Planned Integrations

1. **Observability**
   - OpenTelemetry for distributed tracing
   - Prometheus for metrics
   - Grafana for visualization

2. **Additional Data Tools**
   - dbt Cloud integration
   - Monte Carlo for data observability
   - Atlan for metadata management

3. **Enhanced AI**
   - Local LLM support (Ollama)
   - Fine-tuned models for SQL generation
   - RAG with vector database (Weaviate/Qdrant)

4. **Security**
   - Keycloak for SSO
   - HashiCorp Vault for secrets
   - Enhanced Ranger integration

---

## Conclusion

This technology stack provides a comprehensive foundation for NexusOne's intelligent data orchestration platform. The combination of modern web technologies, production-ready data engineering tools, and cutting-edge AI frameworks enables the platform to deliver on its promise of reducing operational complexity by 70% while maintaining full technical control and governance.

The stack is designed for:
- **Scalability**: Handle enterprise-scale data operations
- **Performance**: Sub-second response times for critical workflows
- **Reliability**: 99.9% uptime with fault tolerance
- **Extensibility**: Easy integration of new tools and capabilities
- **Developer Experience**: Modern tooling with excellent DX

For questions or clarifications about any technology choice, implementation detail, or architectural pattern, please contact the engineering team.

---

**Document Maintenance**:
- Update this document when adding new dependencies
- Document new architectural patterns
- Keep version numbers current
- Add new feature mappings as they're built
