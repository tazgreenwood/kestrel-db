# Changelog

All notable changes to Kestrel DB will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX (Planned)

### Added

- Initial MVP release
- MySQL database connection management with secure credential storage
- Command palette-driven navigation (Cmd+K)
- Table browsing with virtualized data grid
- Column sorting and table filtering
- Structure view for table schemas, indexes, and constraints
- SQL editor with Monaco-powered autocomplete
- Query history and saved queries
- Data export to CSV and JSON formats
- Multiple database and connection support
- Theme customization with built-in dark theme
- First-run onboarding tutorial
- Error boundary for graceful error handling
- Keyboard-first navigation with comprehensive shortcuts
- Data type-specific visualization and formatting
- Connection color coding
- Settings persistence

### Technical Features

- Built with Electron, React 19, and TypeScript
- TanStack Table for efficient data virtualization
- Zustand for state management
- Monaco Editor for SQL editing
- Tailwind CSS v4 for styling
- mysql2 for database connectivity
- keytar for secure credential storage

## [Unreleased]

### Planned Features

- PostgreSQL support
- Data editing capabilities (INSERT, UPDATE, DELETE)
- Advanced filtering with WHERE clause builder
- Query result comparison
- Database migration tools
- SSH tunnel support
- SSL/TLS connection options
- Table relationship visualization
- More export formats (Excel, SQL)
- Query execution plan visualization
- Database performance monitoring
- Dark theme variants and more built-in themes
- Window management (multiple windows, tabs)
- Backup and restore functionality
