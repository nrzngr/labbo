# Tasks: Remove Code Comments

## Implementation Tasks

### 1. Preparation and Analysis
- [ ] Create git commit before making changes (backup)
- [ ] Scan all code files and catalog comment types
- [ ] Classify comments as removable vs preservable
- [ ] Identify files requiring manual review vs automated processing

### 2. High-Value Files (Manual Review Required)
- [ ] Review and clean comments in `lib/qr-service.ts` (preserve JSDoc)
- [ ] Review and clean comments in `database-schema.sql` (preserve schema docs)
- [ ] Review and clean comments in `CREATE_DEMO_USERS.sql` (preserve setup instructions)
- [ ] Manually review any files with complex logic comments

### 3. Component Files Cleanup
- [ ] Remove comments from React component files in `components/`
- [ ] Remove comments from page components in `app/`
- [ ] Remove comments from API route files
- [ ] Remove comments from utility functions

### 4. Style and Configuration Files
- [ ] Remove comments from CSS files in `app/globals.css`
- [ ] Remove comments from configuration files
- [ ] Clean up any remaining comment blocks

### 5. Code Enhancement (Where Needed)
- [ ] Improve variable names where comments were explaining complex variables
- [ ] Extract complex logic into well-named functions
- [ ] Ensure code is self-documenting where critical comments were removed

### 6. Validation and Testing
- [ ] Run build process to ensure no syntax errors
- [ ] Test all major application features
- [ ] Verify responsive design still works
- [ ] Check database connections and functionality
- [ ] Test user authentication flows
- [ ] Verify all pages load without errors

### 7. Final Cleanup
- [ ] Format all modified files consistently
- [ ] Remove any trailing whitespace from comment removal
- [ ] Final git commit with all changes
- [ ] Update documentation if needed

## Dependencies and Notes

**Dependencies:**
- None - this is a standalone cleanup task

**Notes:**
- Priority: Medium (improves code quality but not critical)
- Estimated time: 2-4 hours
- Risk level: Medium (some valuable documentation may be lost)
- Manual review required for files with critical documentation

**Protected Files (No Changes):**
- `next-env.d.ts` - Contains system-generated reference comments
- Any files with license headers

**Parallelizable Work:**
- Tasks 3 and 4 can be done in parallel by different team members
- Task 6 should be done after all cleanup is complete