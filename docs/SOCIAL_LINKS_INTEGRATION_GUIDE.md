# Social Links Integration Guide

## 🎯 **Problem Solved**

Your React onboarding form now accepts both **usernames** and **full URLs** for social media platforms, automatically converts them to proper URLs, and handles form data updates correctly even when Supabase profile queries timeout.

## 📦 **What's Included**

### 1. **Core Utility** (`src/lib/socialLinksUtils.ts`)
- Validates and formats social media input (username or URL)
- Supports 16+ platforms (LinkedIn, GitHub, Twitter, Instagram, etc.)
- Handles both usernames and full URLs
- Provides proper error messages

### 2. **React Hook** (`src/hooks/useSocialLinks.ts`)
- Manages social links state
- Handles validation and formatting
- Provides debounced updates to prevent excessive API calls
- Includes batch operations for multiple updates

### 3. **React Component** (`src/components/common/SocialLinksForm.tsx`)
- Complete form component with add/edit/remove functionality
- Real-time validation
- User-friendly error messages
- Responsive design

### 4. **Example Integration** (`src/components/onboarding/SocialLinksStepExample.tsx`)
- Shows how to integrate into your onboarding flow
- Handles form data updates
- Manages validation state

## 🚀 **Quick Integration**

### Step 1: Use the Hook in Your Component

```tsx
import { useSocialLinks } from '../hooks/useSocialLinks';

function YourOnboardingStep() {
  const {
    links,
    errors,
    isValid,
    addLink,
    updateLink,
    removeLink
  } = useSocialLinks({
    initialLinks: formData.socialLinks || {},
    onUpdate: (links) => {
      // Update your form data
      setFormData(prev => ({ ...prev, socialLinks: links }));
    },
    onError: (errors) => {
      // Handle validation errors
      console.log('Validation errors:', errors);
    }
  });

  // Your component logic...
}
```

### Step 2: Use the Form Component

```tsx
import { SocialLinksForm } from '../components/common/SocialLinksForm';

function YourOnboardingStep() {
  const [formData, setFormData] = useState({
    socialLinks: {}
  });

  return (
    <SocialLinksForm
      initialLinks={formData.socialLinks}
      onUpdate={(links) => {
        setFormData(prev => ({ ...prev, socialLinks: links }));
      }}
      onError={(errors) => {
        // Handle errors
      }}
      required={true}
      minLinks={1}
      recommendedLinks={3}
    />
  );
}
```

## ✅ **What Works Now**

### **Username Input Examples:**
- **LinkedIn:** `antoniotubito` → `https://linkedin.com/in/antoniotubito`
- **Twitter:** `@antoniotubito` → `https://twitter.com/antoniotubito`
- **Instagram:** `@antoniotubito` → `https://instagram.com/antoniotubito`
- **GitHub:** `antoniotubito` → `https://github.com/antoniotubito`
- **YouTube:** `@antoniotubito` → `https://youtube.com/@antoniotubito`

### **Full URL Input Examples:**
- **LinkedIn:** `https://linkedin.com/in/antoniotubito` → ✅ Valid
- **Twitter:** `https://twitter.com/antoniotubito` → ✅ Valid
- **Instagram:** `https://instagram.com/antoniotubito` → ✅ Valid

### **Error Handling:**
- ❌ Invalid usernames show clear error messages
- ❌ Malformed URLs are rejected with helpful feedback
- ✅ Real-time validation as you type
- ✅ Form won't submit with invalid data

## 🔧 **Advanced Usage**

### **Custom Validation:**
```tsx
import { validateAndFormatSocialLink } from '../lib/socialLinksUtils';

const validation = validateAndFormatSocialLink('linkedin', 'antoniotubito');
if (validation.isValid) {
  console.log('Formatted URL:', validation.formattedUrl);
  console.log('Username:', validation.username);
}
```

### **Batch Updates:**
```tsx
const { batchUpdate } = useSocialLinks({...});

const updates = [
  { platform: 'linkedin', input: 'antoniotubito' },
  { platform: 'twitter', input: '@antoniotubito' },
  { platform: 'github', input: 'antoniotubito' }
];

const success = await batchUpdate(updates);
```

### **Custom Platforms:**
The system supports custom platforms by adding them to the utility functions.

## 🎨 **Styling**

The components use Tailwind CSS classes and are fully customizable. You can:
- Override the `className` prop
- Customize colors and spacing
- Add your own animations
- Modify the platform icons

## 🧪 **Testing**

### **Test Username Input:**
1. Enter `antoniotubito` for LinkedIn
2. Should convert to `https://linkedin.com/in/antoniotubito`
3. Should show green validation checkmark

### **Test URL Input:**
1. Enter `https://linkedin.com/in/antoniotubito`
2. Should remain as-is
3. Should show green validation checkmark

### **Test Invalid Input:**
1. Enter `invalid-username!@#` for LinkedIn
2. Should show red error message
3. Should prevent form submission

## 🚨 **Important Notes**

1. **Form Data Updates:** The hook automatically updates your form data through the `onUpdate` callback
2. **Debouncing:** Updates are debounced (300ms) to prevent excessive API calls
3. **Error Handling:** All validation errors are caught and displayed to the user
4. **Platform Support:** Currently supports 16+ platforms, easily extensible
5. **TypeScript:** Fully typed for better development experience

## 🔄 **Migration from Existing Code**

If you have existing social links code:

1. **Replace validation logic** with `validateAndFormatSocialLink()`
2. **Replace URL formatting** with the built-in formatters
3. **Use the hook** instead of manual state management
4. **Update your components** to use the new form component

## 📱 **Mobile Support**

The components are fully responsive and work on:
- Desktop browsers
- Mobile browsers
- Tablet devices
- Touch interfaces

## 🎯 **Next Steps**

1. **Integrate** the `SocialLinksForm` component into your onboarding
2. **Test** with various username and URL formats
3. **Customize** styling to match your design system
4. **Add** any additional platforms you need
5. **Deploy** and test in production

The solution handles all the issues you mentioned:
- ✅ Accepts both usernames and URLs
- ✅ Automatically converts usernames to proper URLs
- ✅ Updates formData correctly
- ✅ Works even when Supabase profile queries timeout
- ✅ Provides clear error messages
- ✅ Real-time validation
