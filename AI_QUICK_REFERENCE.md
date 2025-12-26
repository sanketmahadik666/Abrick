# AI Prompting Quick Reference Card

## One-Minute Guide

### 1️⃣ **Identify Task Type**
| Task | File | Pattern |
|------|------|---------|
| Add HTML element | `*.html` | Use existing classes |
| Style element | `css/style.css` | Use CSS variables |
| Add JavaScript | `js/*.js` | Use async/await + try/catch |
| New feature | Multiple | HTML + CSS + JS |
| Fix bug | Variable | Add Logger + debugging |
| Refactor | Variable | Keep same behavior |

---

## 2️⃣ **Build Your Prompt**

```
Task: [What do you want?]
File: [Which file to modify]
Current: [Show relevant code]
Change: [What needs to change]
Maintain: [What must stay same]
Requirements: 
  - [req 1]
  - [req 2]
Output: [Format you want]
```

---

## 3️⃣ **Key Requirements by Type**

### HTML Modifications
```
✓ Preserve CSS class names
✓ Keep JavaScript event listeners  
✓ Maintain accessibility (alt, aria)
✓ Don't change IDs unless needed
✓ Indentation: 4 spaces
```

### CSS Modifications  
```
✓ Use CSS variables (--primary-color, etc)
✓ Mobile-first approach
✓ Sufficient color contrast
✓ Relative units (rem, em)
✓ Group related properties
```

### JavaScript Modifications
```
✓ Use async/await (NOT .then())
✓ Always add try/catch
✓ Add Logger.info() and Logger.error()
✓ Use makeAuthenticatedRequest() for API
✓ Comment complex logic
```

---

## 4️⃣ **Copy-Paste Prompt Templates**

### Add HTML Element
```
I need to add [ELEMENT] to [FILE_NAME].

Location: [DESCRIBE_WHERE]
Current code: [PASTE_CODE]

Element should:
- Have id='[ID]'
- Have class='[CLASSES]'
- Contain text: '[TEXT]'

Keep existing: [WHAT_TO_KEEP]

Output: Modified HTML section with 3 lines of context
```

### Fix JavaScript Bug
```
Bug: [DESCRIBE_BUG]
File: [FILE_NAME]
Error: [ERROR_MESSAGE]

Current code: [PASTE_CODE]
Expected: [EXPECTED_BEHAVIOR]
Actual: [ACTUAL_BEHAVIOR]

Fix by:
- Add Logger.info() before API call
- Add Logger.error() in catch block
- Use makeAuthenticatedRequest() instead of fetch
- Add try/catch wrapper

Output: Fixed code with detailed comments
```

### Add JavaScript Function
```
Add function: [FUNCTION_NAME]
File: [FILE_NAME]
Location: [WHERE_IN_FILE]

Function should:
1. [REQUIREMENT_1]
2. [REQUIREMENT_2]
3. [REQUIREMENT_3]

Requirements:
- Use async/await
- Add Logger.info/error calls
- Handle errors with try/catch
- Reuse makeAuthenticatedRequest() for API

Output: Complete function with JSDoc comments
```

---

## 5️⃣ **Essential Code Patterns**

### API Call Pattern
```javascript
// Copy this pattern for all API calls
async function getData() {
  try {
    Logger.info('CATEGORY', 'Fetching data');
    const data = await makeAuthenticatedRequest('/api/endpoint');
    Logger.success('CATEGORY', 'Data loaded');
    return data;
  } catch (error) {
    Logger.error('CATEGORY', 'Error loading data', { message: error.message });
    throw error;
  }
}
```

### Form Submission Pattern
```javascript
// Copy this pattern for all form submissions
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  try {
    ToiletReviewUtils.setButtonLoading(btn, true);
    Logger.info('FORM', 'Submitting form');
    
    const data = await makeAuthenticatedRequest('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ /* data */ })
    });
    
    Logger.success('FORM', 'Form submitted');
  } catch (error) {
    Logger.error('FORM', 'Submission failed', { message: error.message });
  } finally {
    ToiletReviewUtils.setButtonLoading(btn, false);
  }
});
```

### DOM Manipulation Pattern
```javascript
// Copy this pattern for all DOM changes
const element = document.getElementById('elementId');
if (element) {
  element.classList.remove('hidden');
  Logger.info('DOM', 'Showed element');
} else {
  Logger.warn('DOM', 'Element #elementId not found');
}
```

---

## 6️⃣ **Critical Reminders**

🔑 **Token & Auth**
- Token stored in: `localStorage.getItem('adminToken')`
- Always use: `makeAuthenticatedRequest()` (auto-injects token)
- Never hardcode: API keys or tokens

📍 **Logging**
```javascript
Logger.info('CATEGORY', 'message')        // Info
Logger.success('CATEGORY', 'message')     // Success  
Logger.error('CATEGORY', 'message', {})   // Error
Logger.warn('CATEGORY', 'message')        // Warning
Logger.debug('CATEGORY', 'message', {})   // Debug
```

🎨 **CSS Classes**
- `.hidden` = display: none
- `.btn` = button styling
- `.btn-danger` = danger button color
- `.loading-spinner` = loading animation

📱 **Responsive**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Desktop: 1024px+

---

## 7️⃣ **Common Mistakes to Avoid**

| ❌ Wrong | ✅ Right |
|---------|---------|
| `fetch()` | `makeAuthenticatedRequest()` |
| `.then().catch()` | `async/await` with `try/catch` |
| `console.log()` | `Logger.info()` |
| New passwords in code | Use `.env` file |
| Hardcoded API URLs | Use constants |
| No error handling | Always try/catch |
| IDs without checking | Check `if (element)` |
| Vague variable names | `const userEmail` not `const e` |

---

## 8️⃣ **Real Example: Add Feature**

### Prompt:
```
Feature: Add "Delete Toilet" button to admin dashboard

File: admin.html
Location: In the toilet list item, after edit button

HTML:
- Button id="deleteBtn"  
- Class="btn btn-danger btn-sm"
- Text: "Delete"
- onclick="deleteToilet(toiletId)"

JavaScript (js/admin.js):
- Function: async deleteToilet(id)
- Confirm before deleting
- API call: DELETE /api/toilet/{id}
- Show loading spinner on button
- Success message if deleted
- Error message if failed
- Add Logger calls

CSS (css/style.css):
- Style .btn-sm for smaller button
- Style .btn-danger with red color

Output: Provide changes for each file
```

### AI Output Would Include:
```html
<!-- admin.html changes -->
<button id="deleteBtn" class="btn btn-danger btn-sm" onclick="deleteToilet('123')">
  Delete
</button>
```

```javascript
// js/admin.js changes
async function deleteToilet(id) {
  try {
    Logger.info('TOILET', 'Deleting toilet', { id });
    if (!confirm('Delete this toilet?')) {
      Logger.warn('TOILET', 'Delete cancelled by user');
      return;
    }
    
    await makeAuthenticatedRequest(`/api/toilet/${id}`, { method: 'DELETE' });
    Logger.success('TOILET', 'Toilet deleted');
    // Refresh list
    loadToilets();
  } catch (error) {
    Logger.error('TOILET', 'Delete failed', { message: error.message });
  }
}
```

```css
/* css/style.css changes */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}
```

---

## 🎯 **Checklist Before Sending Prompt**

- [ ] Clear and specific task description
- [ ] File name mentioned
- [ ] Current code snippet provided  
- [ ] Requirements listed (3+ items)
- [ ] Output format specified
- [ ] Existing patterns mentioned
- [ ] Error handling requirements included
- [ ] No multiple unrelated tasks

---

## 📞 **When to Ask for Help**

**Ask AI for:**
- Code implementation
- Bug fixes
- Performance optimization
- Refactoring suggestions
- Design pattern implementation
- Error handling strategies

**Ask humans for:**
- API design decisions
- Feature prioritization
- Architecture changes
- Complex business logic
- Security implications
- Team code standards

---

## 🔄 **Iterative Improvement Process**

```
1st Prompt: Get basic implementation
   ↓
Review & Test
   ↓
2nd Prompt: Add error handling + logging
   ↓
Review & Test
   ↓
3rd Prompt: Optimize + refactor
   ↓
Final Review & Commit
```

---

**Save this card for quick reference while prompting!**

Last Updated: December 26, 2025
