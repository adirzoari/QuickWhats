# JavaScript Coding Standards

## Core Principles

### Simplicity First
Write clear, maintainable code that solves the current problem without unnecessary complexity.

### Build Only What's Needed
Implement requirements as they arise. Avoid speculative features and premature abstractions.

### Single Responsibility
Each function and module should have one clear purpose and one reason to change.

## Code Organization

### CRITICAL File Size Limits
- **Files**: HARD LIMIT of 200 lines - NO EXCEPTIONS
- **Functions**: Maximum 25 lines, single purpose
- **Classes**: Maximum 7 public methods  
- **Nesting**: Maximum 3 levels deep

If approaching these limits, split into multiple focused modules immediately.

### Architecture Planning for Claude Code
Before writing any code:
1. Plan module structure to respect 200-line limit
2. Design multiple small files instead of large monoliths
3. Stop coding at 180 lines and refactor into separate modules
4. Use `wc -l filename` to verify line counts

### File Splitting Strategies
- Extract utilities into separate modules
- Create dedicated files for constants and configurations
- Separate business logic from presentation logic
- Use composition over large monolithic files

### Naming Conventions
- Use descriptive, intention-revealing names
- Follow camelCase for variables and functions
- Use PascalCase for classes and constructors
- Prefer verbs for functions, nouns for variables

### Module Design
- Export focused, cohesive functionality
- Use dependency injection for external dependencies  
- Separate concerns into distinct modules
- Group related functionality together

## JavaScript Standards

### Modern Syntax
- Use `const` and `let` instead of `var`
- Prefer arrow functions for callbacks and short operations
- Use destructuring assignment for cleaner code
- Leverage template literals for string interpolation
- Apply optional chaining (`?.`) and nullish coalescing (`??`)

### Error Handling
- Use try-catch blocks for expected failures
- Throw specific error types with descriptive messages
- Handle Promise rejections explicitly
- Validate inputs early in functions
- Prefer async/await over Promise chains

### Performance Guidelines
- Avoid blocking the main thread
- Use appropriate data structures
- Implement memoization for expensive computations
- Apply debouncing for user-triggered operations

## Quality Assurance

### Documentation
```javascript
/**
 * Brief description of function purpose
 * @param {type} name - Parameter description
 * @returns {type} Return value description
 */
```

### Testing Requirements
- Write unit tests for business logic
- Test edge cases and error conditions
- Mock external dependencies
- Use descriptive test names

### Code Review Criteria
- Is this the simplest viable solution?
- Does each component have a single responsibility?
- Are dependencies properly abstracted?
- Is the code self-documenting?
- Are error cases handled appropriately?
- **Is every file under 200 lines?**

### Pre-Completion Checklist
- [ ] Each file is under 200 lines
- [ ] Each function is under 25 lines
- [ ] No nesting exceeds 3 levels
- [ ] All modules have single responsibility

## Anti-Patterns to Avoid

- Functions that do multiple unrelated tasks
- Deep nesting and complex conditional logic
- Magic numbers and unclear variable names
- Suppressing errors without proper handling
- Building generic solutions for specific problems
- Copy-pasting code instead of creating reusable functions
- **Creating files longer than 200 lines**
- **Monolithic modules with multiple concerns**

## Implementation Guidelines

### Development Workflow
1. **Plan file architecture first** - Design multiple focused files
2. Start with the simplest working solution
3. **Monitor line count continuously** - Split at 180 lines
4. Refactor for clarity and maintainability
5. Add abstractions only when patterns emerge
6. Document public interfaces
7. Test critical functionality

### File Organization
- Group by feature, not by file type
- Keep related functions in the same module
- Use clear directory structures
- Maintain consistent import/export patterns
- **Prefer many small files over few large files**

## Claude Code Usage

Always include this constraint in prompts:

**"CRITICAL: Each file must be under 200 lines. If any implementation would exceed this, split into multiple focused modules before coding."**

Verify compliance with: `find . -name "*.js" -exec wc -l {} +`