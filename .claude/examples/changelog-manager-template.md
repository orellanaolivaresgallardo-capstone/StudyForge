# CHANGELOG.md Template Example - changelog-manager

Este archivo muestra un ejemplo completo del formato CHANGELOG.md generado por `changelog-manager`.

---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features not yet released
- User preferences endpoint with JWT authentication

### Fixed
- Memory leak in file processing

## [1.2.0] - 2025-01-20

### Added
- JWT authentication system with Argon2 password hashing
- Adaptive quiz difficulty algorithm
- Study space organization feature

### Fixed
- Password validation error messages
- Quota calculation for large files
- CORS configuration for production

### Changed
- ⚠️ **BREAKING**: API response format changed for /summaries endpoint
  - **Migration**: Update client code to use new `content` field structure
  - **Impact**: All API consumers must update before 2025-02-01

## [1.1.0] - 2024-12-15

### Added
- Document upload with PDF/DOCX/PPTX support
- Summary generation with 3 expertise levels
- Quiz generation with randomized options

### Fixed
- File validation security vulnerability (CVE-2024-XXXXX)

[Unreleased]: https://github.com/usuario/studyforge/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/usuario/studyforge/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/usuario/studyforge/compare/v1.0.0...v1.1.0
