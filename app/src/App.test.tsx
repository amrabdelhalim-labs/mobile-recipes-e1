/**
 * اختبار التطبيق الرئيسي (App)
 * ──────────────────────────────
 * يتحقق من أن مكوّن التطبيق الرئيسي يتم تحميله بدون أخطاء.
 * هذا اختبار "smoke test" أساسي يضمن عدم وجود أخطاء في التهيئة.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('مكوّن التطبيق الرئيسي (App)', () => {
    it('يجب أن يتحمّل بدون أخطاء', () => {
        const { baseElement } = render(<App />);
        expect(baseElement).toBeDefined();
    });
});
