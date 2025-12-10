# Ken Burns Effect UI Controls

## Export Settings Panel - Advanced Section

```
┌─────────────────────────────────────────────────────────────┐
│ Advanced                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Hardware Acceleration                              [ON]  ←   │
│                                                               │
│ Two-Pass Encoding                                  [OFF] ←   │
│                                                               │
│ Burn Captions                                      [OFF] ←   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Ken Burns Effect                              [ON]  ← │   │
│ │                                                       │   │
│ │ Ken Burns Intensity                                   │   │
│ │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] Subtle              │   │
│ │  0.0                          0.15               0.3  │   │
│ │  None                        Medium          Dramatic │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Control Descriptions

### 1. Ken Burns Effect Toggle
- **Type**: Switch (ON/OFF)
- **Default**: ON
- **Location**: Advanced section, after "Burn Captions"
- **Behavior**: 
  - When ON: Shows intensity slider below
  - When OFF: Hides intensity slider, images render static

### 2. Ken Burns Intensity Slider
- **Type**: Range slider (0.0 to 0.3, step 0.05)
- **Default**: 0.1
- **Location**: Appears below toggle when Ken Burns is enabled
- **Display**: Shows numeric value with text label

**Label Logic:**
```typescript
value === 0.0          → "None"
value <= 0.1           → "Subtle"
value <= 0.2           → "Medium"
value > 0.2            → "Dramatic"
```

## Visual States

### State 1: Ken Burns Enabled (Default)
```
┌─────────────────────────────────────────┐
│ Ken Burns Effect             [✓ ON]     │
│                                          │
│ Ken Burns Intensity                     │
│ [━━━━━━━━━|━━━━━━━━━━━━━━━] Subtle      │
│  ^                                       │
│  0.1 (default)                           │
└─────────────────────────────────────────┘
```

### State 2: Ken Burns Disabled
```
┌─────────────────────────────────────────┐
│ Ken Burns Effect             [ ] OFF    │
│                                          │
│ (intensity slider hidden)                │
└─────────────────────────────────────────┘
```

### State 3: Maximum Intensity
```
┌─────────────────────────────────────────┐
│ Ken Burns Effect             [✓ ON]     │
│                                          │
│ Ken Burns Intensity                     │
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━━|] Dramatic │
│                              ^           │
│                              0.3         │
└─────────────────────────────────────────┘
```

## User Interaction Flow

### Scenario 1: Disabling Ken Burns
1. User opens Export Settings
2. Scrolls to Advanced section
3. Clicks Ken Burns Effect toggle to OFF
4. Intensity slider disappears
5. Images will render as static frames

### Scenario 2: Adjusting Intensity
1. User opens Export Settings
2. Scrolls to Advanced section
3. Ken Burns Effect is ON (default)
4. Drags intensity slider to desired position
5. Label updates in real-time:
   - Left (0.0-0.1): "Subtle"
   - Middle (0.15-0.2): "Medium"
   - Right (0.25-0.3): "Dramatic"
6. Exports video with chosen zoom intensity

### Scenario 3: Using Preset with Ken Burns
1. User selects "YouTube 1080p" preset
2. Export Settings loads with:
   - Ken Burns Effect: ON
   - Ken Burns Intensity: 0.1 (Subtle)
3. User can adjust or disable as needed
4. Settings are independent from preset after loading

## Responsive Behavior

### Desktop (1920x1080)
- Full width controls
- Slider spans majority of available width
- Labels clearly visible

### Tablet (768x1024)
- Controls stack vertically if needed
- Slider maintains touch-friendly size
- Labels remain readable

### Mobile (375x667)
- Controls may wrap to multiple lines
- Slider optimized for touch input
- Text labels may abbreviate

## Accessibility

### Keyboard Navigation
- Tab to focus on toggle switch
- Space/Enter to toggle ON/OFF
- Tab to intensity slider
- Arrow keys to adjust value
- +/- keys for fine adjustment

### Screen Reader
- "Ken Burns Effect toggle, currently enabled"
- "Ken Burns Intensity slider, value 0.1, Subtle"
- Updates announced when value changes

### Visual Indicators
- Clear ON/OFF state with color
- Slider thumb position shows exact value
- Text label provides human-readable feedback
- Focus outline for keyboard users

## Styling Details

### Colors (Fluent UI Theme)
- **Toggle ON**: Blue accent color
- **Toggle OFF**: Neutral gray
- **Slider Track**: Light gray background
- **Slider Fill**: Blue accent (filled portion)
- **Slider Thumb**: White with shadow

### Typography
- **Section Title**: 14px, semi-bold
- **Field Label**: 12px, regular
- **Slider Value**: 12px, right-aligned
- **Help Text**: 11px, muted

### Spacing
- Section padding: 16px
- Row gap: 8px between controls
- Control padding: 4px
- Slider margin: 8px sides

## Code Snippet: Component Structure

```tsx
<div className={styles.section}>
  <Text className={styles.sectionTitle}>Advanced</Text>

  {/* Other advanced settings ... */}

  {/* Ken Burns Toggle */}
  <div className={styles.switchRow}>
    <Text className={styles.fieldLabel}>Ken Burns Effect</Text>
    <Switch
      checked={currentSettings.enableKenBurns ?? true}
      onChange={(_, data) => updateCurrentSetting('enableKenBurns', data.checked)}
    />
  </div>

  {/* Ken Burns Intensity (conditional) */}
  {(currentSettings.enableKenBurns ?? true) && (
    <div className={styles.fieldRow}>
      <Text className={styles.fieldLabel}>Ken Burns Intensity</Text>
      <div className={styles.sliderContainer}>
        <Slider
          min={0}
          max={0.3}
          step={0.05}
          value={currentSettings.kenBurnsIntensity ?? 0.1}
          onChange={(_, data) => 
            updateCurrentSetting('kenBurnsIntensity', data.value)
          }
        />
        <Text className={styles.sliderValue}>
          {getIntensityLabel(currentSettings.kenBurnsIntensity ?? 0.1)}
        </Text>
      </div>
    </div>
  )}
</div>
```

## Integration with Export Presets

All video presets include Ken Burns settings:

```typescript
{
  id: 'youtube-1080p',
  name: '1080p Full HD',
  settings: {
    // ... other settings ...
    enableKenBurns: true,
    kenBurnsIntensity: 0.1,
  }
}
```

When user:
1. Selects preset → Ken Burns loads with preset values
2. Modifies settings → Changes apply to current export only
3. Saves as custom preset → Ken Burns settings are saved

## Testing Checklist

Visual/UI Testing:
- [ ] Toggle appears in Advanced section
- [ ] Toggle defaults to ON
- [ ] Slider appears when toggle is ON
- [ ] Slider hides when toggle is OFF
- [ ] Slider range is 0.0 to 0.3
- [ ] Slider step is 0.05
- [ ] Label updates correctly: None, Subtle, Medium, Dramatic
- [ ] Controls work with keyboard
- [ ] Controls work with mouse/touch
- [ ] Responsive on different screen sizes
- [ ] Theme colors apply correctly
- [ ] Accessible to screen readers

Functional Testing:
- [ ] Settings persist when switching presets
- [ ] Settings save/load with custom presets
- [ ] Export API receives correct values
- [ ] Backend applies Ken Burns as configured
- [ ] Rendered video matches intensity setting
