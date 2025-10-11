# 📱 Mobile QR Code Testing Guide

## Test URLs for Manual Verification

### Production URLs

- **Valid QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-valid-qr-001
- **Expired QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-expired-qr-001
- **Private QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-private-qr-001

### Localhost URLs (if testing locally)

- **Valid QR**: http://localhost:3001/profile/test-valid-qr-001
- **Expired QR**: http://localhost:3001/profile/test-expired-qr-001
- **Private QR**: http://localhost:3001/profile/test-private-qr-001

## Mobile Testing Checklist

### ✅ iOS Safari Testing

1. **Open Safari on iPhone/iPad**
2. **Navigate to test URLs**
3. **Verify responsive design**:
   - [ ] Page scales properly on different screen sizes
   - [ ] Text is readable without zooming
   - [ ] Buttons are touch-friendly (44px minimum)
   - [ ] No horizontal scrolling

### ✅ Android Chrome Testing

1. **Open Chrome on Android device**
2. **Navigate to test URLs**
3. **Verify responsive design**:
   - [ ] Page scales properly on different screen sizes
   - [ ] Text is readable without zooming
   - [ ] Buttons are touch-friendly (44px minimum)
   - [ ] No horizontal scrolling

### ✅ Desktop Chrome DevTools Testing

1. **Open Chrome DevTools (F12)**
2. **Click device emulation icon**
3. **Test different devices**:
   - iPhone 12/13/14 (375px width)
   - iPhone 12/13/14 Pro Max (428px width)
   - Pixel 5 (393px width)
   - iPad (768px width)

## Expected Results by Test Case

### 1. Valid QR Code (test-valid-qr-001)

**Expected**:

- ✅ Shows John Doe's public profile
- ✅ Displays: Name, Job Title, Company, Bio, Interests, Social Links
- ✅ Responsive layout on mobile
- ✅ "Request Connection" button visible

### 2. Expired QR Code (test-expired-qr-001)

**Expected**:

- ✅ Shows "QR code has expired" message
- ✅ Friendly error message with retry option
- ✅ Responsive error layout on mobile

### 3. Private QR Code (test-private-qr-001)

**Expected**:

- ✅ Shows "Profile not publicly available" message
- ✅ Friendly error message
- ✅ Responsive error layout on mobile

## Mobile-Specific UI Elements to Test

### 📱 Touch Interactions

- [ ] **Buttons**: Easy to tap (44px minimum touch target)
- [ ] **Links**: Proper touch feedback
- [ ] **Form inputs**: Keyboard appears correctly
- [ ] **Scrolling**: Smooth vertical scrolling

### 📱 Layout & Scaling

- [ ] **Viewport**: Proper viewport meta tag
- [ ] **Safe areas**: Content respects device safe areas
- [ ] **Orientation**: Works in both portrait and landscape
- [ ] **Zoom**: Page remains usable when zoomed

### 📱 Performance

- [ ] **Load time**: Page loads quickly on mobile
- [ ] **Images**: Profile images load and scale properly
- [ ] **Animations**: Smooth transitions on mobile

## Browser Compatibility

### ✅ Supported Browsers

- **iOS Safari** (iOS 14+)
- **Chrome Mobile** (Android 8+)
- **Firefox Mobile** (Android 8+)
- **Samsung Internet** (Android 8+)

### ⚠️ Known Limitations

- **iOS Safari**: Some CSS features may have limitations
- **Android WebView**: May have different behavior than Chrome

## Testing Tools

### Chrome DevTools

1. **Device Emulation**: F12 → Device toolbar
2. **Network Throttling**: Simulate slow connections
3. **Touch Events**: Simulate touch interactions

### Real Device Testing

1. **iPhone**: Test on actual iOS devices
2. **Android**: Test on various Android devices
3. **Tablets**: Test on iPad and Android tablets

## Common Mobile Issues to Check

### 🚨 Layout Issues

- [ ] **Horizontal scroll**: No unwanted horizontal scrolling
- [ ] **Text overflow**: Text doesn't overflow containers
- [ ] **Button sizing**: Buttons are large enough for touch
- [ ] **Spacing**: Adequate spacing between interactive elements

### 🚨 Performance Issues

- [ ] **Image loading**: Images load quickly on mobile networks
- [ ] **JavaScript errors**: No console errors on mobile
- [ ] **Memory usage**: App doesn't consume excessive memory

### 🚨 Accessibility Issues

- [ ] **Screen readers**: Content is accessible to screen readers
- [ ] **Color contrast**: Sufficient contrast for readability
- [ ] **Focus indicators**: Clear focus indicators for keyboard navigation

## Reporting Issues

When reporting mobile issues, include:

1. **Device**: iPhone 12, Pixel 5, etc.
2. **Browser**: Safari, Chrome, etc.
3. **Screen size**: 375px, 428px, etc.
4. **Orientation**: Portrait or landscape
5. **Screenshot**: Visual evidence of the issue
6. **Steps to reproduce**: Detailed reproduction steps
