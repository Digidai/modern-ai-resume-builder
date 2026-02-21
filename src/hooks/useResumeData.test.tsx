import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResumeData } from './useResumeData';

const FULL_NAME_KEY = 'resumeData:v2:fullName';
const TEMPLATE_ID_KEY = 'resumeData:v2:templateId';

const dispatchStorageEvent = (key: string, newValue: string | null) => {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      newValue,
      url: window.location.href,
    })
  );
};

describe('useResumeData', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces segmented persistence for changed fields', () => {
    const { result } = renderHook(() => useResumeData());

    act(() => {
      result.current.setResumeData((prev) => ({
        ...prev,
        fullName: 'Pat Candidate',
      }));
    });

    expect(sessionStorage.getItem(FULL_NAME_KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(sessionStorage.getItem(FULL_NAME_KEY)).toBe(JSON.stringify('Pat Candidate'));
  });

  it('syncs field updates from other tabs through storage events', () => {
    const { result } = renderHook(() => useResumeData());

    act(() => {
      dispatchStorageEvent(TEMPLATE_ID_KEY, JSON.stringify('sidebar'));
    });

    expect(result.current.resumeData.templateId).toBe('sidebar');
  });
});
